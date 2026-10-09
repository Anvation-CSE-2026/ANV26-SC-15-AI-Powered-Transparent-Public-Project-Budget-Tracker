import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 1. onMilestoneApproved Trigger
 * Fired whenever a contractor submission or milestone is officially approved by the Project Manager.
 * Recalculates official project physical progress, releases verified milestones, and creates an audit trail.
 */
export const onMilestoneApproved = functions.firestore
  .document('projectSubmissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Trigger only when transitioning to 'Approved'
    if (before.status !== 'Approved' && after.status === 'Approved') {
      const projectId = after.projectId;
      const progress = after.progress;
      const milestoneId = after.milestoneId;
      const submissionId = context.params.submissionId;
      const nowIso = new Date().toISOString();

      try {
        await db.runTransaction(async (transaction) => {
          const projectRef = db.collection('projects').doc(projectId);
          const projectDoc = await transaction.get(projectRef);

          if (!projectDoc.exists) return;

          const projectData = projectDoc.data() || {};
          const updates: Record<string, unknown> = {
            updatedAt: nowIso,
          };

          if (typeof progress === 'number') {
            updates.progress = Math.min(100, Math.max(projectData.progress || 0, progress));
          }

          if (after.delay?.isDelayed && after.delay.expectedDelayDays) {
            updates.delayDays = (projectData.delayDays || 0) + after.delay.expectedDelayDays;
          }

          transaction.update(projectRef, updates);

          // Update milestone if present
          if (milestoneId) {
            const milestoneRef = db.collection('projects').doc(projectId).collection('milestones').doc(milestoneId);
            transaction.set(
              milestoneRef,
              {
                status: 'Completed',
                progressPercentage: 100,
                actualDate: after.actualCompletionDate || nowIso.split('T')[0],
                updatedAt: nowIso,
              },
              { merge: true }
            );
          }

          // Immutable Audit Log
          const auditRef = db.collection('audit_logs').doc(`aud_fn_${Date.now()}`);
          transaction.set(auditRef, {
            id: auditRef.id,
            actorUid: after.review?.reviewedBy || 'system',
            actorName: after.review?.reviewerName || 'Authority Engineer',
            actorRole: 'project_manager',
            actionType: 'contractor_submission_approved',
            actionTitle: `Milestone Approved: ${after.submissionNumber}`,
            entityType: 'submission',
            entityId: submissionId,
            entityNumber: after.submissionNumber,
            summary: `Approved submission "${after.title}" on project ${projectData.name || projectId}.`,
            beforeState: { status: before.status, progress: projectData.progress },
            afterState: { status: 'Approved', progress: updates.progress ?? projectData.progress },
            isPublic: true,
            timestamp: nowIso,
          });

          // Notification for contractor
          if (after.contractorId) {
            const notifRef = db.collection('notifications').doc();
            transaction.set(notifRef, {
              id: notifRef.id,
              recipientId: after.contractorId,
              type: 'contractor_submission_approved',
              category: 'contractor',
              title: `Submission Approved: ${after.submissionNumber}`,
              message: `Your submission "${after.title}" was approved by PM. Progress verified.`,
              entityType: 'submission',
              entityId: submissionId,
              isRead: false,
              createdAt: nowIso,
            });
          }
        });
      } catch (err) {
        functions.logger.error('Error executing onMilestoneApproved transaction:', err);
      }
    }
  });

/**
 * 2. onComplaintAssigned Trigger
 * Fired whenever an unassigned complaint is assigned to a department officer with an SLA.
 */
export const onComplaintAssigned = functions.firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const complaintId = context.params.complaintId;

    if (before.status !== 'assigned' && after.status === 'assigned') {
      const nowIso = new Date().toISOString();

      try {
        const batch = db.batch();

        // 1. Audit log
        const auditRef = db.collection('audit_logs').doc(`aud_cmp_${Date.now()}`);
        batch.set(auditRef, {
          id: auditRef.id,
          actorUid: after.assignedOfficerId || 'authority',
          actorName: after.assignedOfficerName || 'Ward Officer',
          actorRole: 'project_manager',
          actionType: 'complaint_assigned',
          actionTitle: `Grievance Assigned: ${after.complaintNumber}`,
          entityType: 'complaint',
          entityId: complaintId,
          entityNumber: after.complaintNumber,
          summary: `Complaint assigned to ${after.departmentName || 'Department'} (${after.assignedOfficerName}).`,
          beforeState: { status: before.status },
          afterState: { status: 'assigned', department: after.departmentName, officer: after.assignedOfficerName },
          isPublic: true,
          timestamp: nowIso,
        });

        // 2. Notification to Citizen
        if (after.citizenId) {
          const citizenNotifRef = db.collection('notifications').doc();
          batch.set(citizenNotifRef, {
            id: citizenNotifRef.id,
            recipientId: after.citizenId,
            type: 'complaint_assigned',
            category: 'complaint',
            title: `Grievance Assigned: ${after.complaintNumber}`,
            message: `Your complaint is assigned to ${after.departmentName} under ${after.assignedOfficerName}.`,
            entityType: 'complaint',
            entityId: complaintId,
            isRead: false,
            createdAt: nowIso,
          });
        }

        await batch.commit();
      } catch (err) {
        functions.logger.error('Error executing onComplaintAssigned:', err);
      }
    }
  });

/**
 * 3. onSuggestionVoted Callable Function
 * Guarantees anti-tamper single vote per citizen per suggestion.
 */
export const onSuggestionVoted = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to vote.');
  }

  const { suggestionId, voteType } = data; // 'up' or 'down'
  const userId = context.auth.uid;

  if (!suggestionId || !voteType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing suggestionId or voteType parameter.');
  }

  const suggestionRef = db.collection('suggestions').doc(suggestionId);
  const userVoteRef = suggestionRef.collection('votes').doc(userId);

  return await db.runTransaction(async (transaction) => {
    const existingVote = await transaction.get(userVoteRef);

    if (existingVote.exists) {
      throw new functions.https.HttpsError('already-exists', 'You have already voted on this suggestion.');
    }

    const suggestionDoc = await transaction.get(suggestionRef);
    if (!suggestionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Suggestion not found.');
    }

    const currentCount = suggestionDoc.data()?.upvotesCount || 0;
    const increment = voteType === 'up' ? 1 : -1;

    transaction.update(suggestionRef, {
      upvotesCount: Math.max(0, currentCount + increment),
      updatedAt: new Date().toISOString(),
    });

    transaction.set(userVoteRef, {
      userId,
      voteType,
      votedAt: new Date().toISOString(),
    });

    return { success: true, newCount: Math.max(0, currentCount + increment) };
  });
});

/**
 * 4. scheduledRiskAnalysis Cron Trigger (Runs Every 6 Hours)
 * Computes objective CivicSight Risk Index across active municipal projects.
 * Flags projects transitioning into High Attention.
 */
export const scheduledRiskAnalysis = functions.pubsub
  .schedule('0 */6 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const nowIso = new Date().toISOString();
    const projectsSnapshot = await db.collection('projects').where('status', 'in', ['Ongoing', 'Delayed', 'Under Review']).get();

    for (const docSnapshot of projectsSnapshot.docs) {
      const p = docSnapshot.data();

      // Deviation rule: (actual - approved) / approved * 100
      const approved = Number(p.approvedBudget || 0);
      const actual = Number(p.actualSpending || 0);
      const deviation = approved > 0 ? ((actual - approved) / approved) * 100 : 0;

      // Risk Factors
      let score = 0;
      if (deviation >= 15) score += 1;
      if (Number(p.delayDays || 0) >= 30) score += 1;
      if (Number(p.progress || 0) < Number(p.expectedProgress || 0)) score += 1;
      if (Number(p.unresolvedIssuesCount || 0) >= 3) score += 1;

      let riskLabel = 'Normal';
      if (score === 2) riskLabel = 'Attention';
      else if (score >= 3) riskLabel = 'High Attention';

      const prevScore = p.riskScore || 0;

      await docSnapshot.ref.update({
        riskScore: score,
        riskLabel,
        budgetDeviation: Number(deviation.toFixed(2)),
        updatedAt: nowIso,
      });

      // Audit flag if newly escalated to High Attention
      if (prevScore < 3 && score >= 3) {
        await db.collection('audit_logs').add({
          actorUid: 'system_risk_engine',
          actorName: 'Automated Risk Evaluator',
          actorRole: 'project_manager',
          actionType: 'risk_audit_flag_issued',
          actionTitle: `Potential Anomaly Alert: ${p.projectNumber || p.name}`,
          entityType: 'project',
          entityId: docSnapshot.id,
          entityNumber: p.projectNumber,
          summary: `Project escalated to High Attention (Score: ${score}/4, Deviation: ${deviation.toFixed(1)}%, Delay: ${p.delayDays || 0}d).`,
          beforeState: { riskScore: prevScore, riskLabel: p.riskLabel },
          afterState: { riskScore: score, riskLabel },
          isPublic: true,
          timestamp: nowIso,
        });
      }
    }

    functions.logger.info(`Completed scheduledRiskAnalysis for ${projectsSnapshot.size} projects.`);
  });
