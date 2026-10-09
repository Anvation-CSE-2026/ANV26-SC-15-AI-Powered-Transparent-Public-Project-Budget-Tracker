import { describe, it, expect, beforeEach } from 'vitest';
import {
  createComplaint,
  assignDepartmentAndOfficer,
  updateComplaintStatus,
  getComplaintById,
  getComplaintUpdates,
} from '../api/complaintService';
import {
  createContractorSubmission,
  reviewSubmission,
  getContractorSubmissionsList,
} from '../api/contractorService';
import { getProjectById } from '../api/projectService';
import { getAuditLogs, resetAuditStoreForTesting } from '../api/auditService';
import { getUserNotifications } from '../api/notificationService';
import type { UserProfile } from '../types';

describe('Phase 16: Complete Feature Integration Across Roles', () => {
  const citizenUser: UserProfile = {
    uid: 'cit-integ-1',
    username: 'citizen_aarav',
    email: 'aarav@citizen.org',
    role: 'citizen',
    displayName: 'Aarav Sharma',
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
  };

  const pmUser: UserProfile = {
    uid: 'pm-seed-1',
    username: 'er_deshmukh',
    email: 'deshmukh@pmc.gov.in',
    role: 'project_manager',
    displayName: 'Er. Rajesh Deshmukh',
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
  };

  const contractorUser: UserProfile = {
    uid: 'cont-01',
    username: 'apex_infra',
    email: 'contact@apexinfra.in',
    role: 'contractor',
    displayName: 'Apex Urban Infra Tech Ltd',
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
  };

  beforeEach(() => {
    resetAuditStoreForTesting();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  describe('1. Citizen Grievance -> Authority Assignment -> Resolution Workflow', () => {
    it('executes full complaint lifecycle with notifications and immutable audit trail', async () => {
      // Step A: Citizen reports a critical issue
      const complaint = await createComplaint(
        {
          title: 'Damaged Manhole Cover at Sector 4 Junction',
          description: 'Broken cast iron manhole cover exposing deep chamber on busy road.',
          category: 'Drainage',
          priority: 'emergency',
          severity: 'critical',
          location: {
            address: 'Sector 4 Main Road',
            ward: 'Ward 12',
            city: 'Pune Metro',
            latitude: 18.5285,
            longitude: 73.8425,
          },
        },
        citizenUser,
        []
      );

      expect(complaint.id).toBeDefined();
      expect(complaint.status).toBe('submitted');

      // Step B: PM assigns department and officer with SLA
      await assignDepartmentAndOfficer(
        complaint.id,
        'dept_drainage',
        'Stormwater & Drainage',
        pmUser.uid,
        'Er. Rajesh Deshmukh',
        'emergency',
        'critical',
        12, // 12 hours SLA
        pmUser
      );

      const assigned = await getComplaintById(complaint.id);
      expect(assigned?.status).toBe('assigned');
      expect(assigned?.departmentId).toBe('dept_drainage');
      expect(assigned?.assignedOfficerName).toBe('Er. Rajesh Deshmukh');

      // Step C: Authority updates status to in_progress
      await updateComplaintStatus(
        complaint.id,
        'in_progress',
        'Repair team dispatched with replacement composite cover.',
        pmUser
      );

      const inProgress = await getComplaintById(complaint.id);
      expect(inProgress?.status).toBe('in_progress');

      // Step D: Verify Citizen cannot see internal notes
      const updatesForCitizen = await getComplaintUpdates(complaint.id, 'citizen');
      expect(updatesForCitizen.every((u) => !u.isInternal)).toBe(true);

      // Step E: Verify Audit trail captured the lifecycle
      const auditTrail = await getAuditLogs({ entityId: complaint.id });
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail.some((a) => a.actionType === 'complaint_created')).toBe(true);
      expect(auditTrail.some((a) => a.actionType === 'complaint_assigned')).toBe(true);
    });
  });

  describe('2. Contractor Work Submission -> PM Review -> Project Progress Sync', () => {
    it('handles contractor progress submission, PM approval, and automatic project reflection', async () => {
      // Get assigned project (prj-seed-1 is assigned to cont-01)
      const projectBefore = await getProjectById('prj-seed-1', true);
      expect(projectBefore).toBeDefined();
      const initialProgress = projectBefore!.progress;

      // Step A: Contractor submits physical progress update
      const targetProgress = Math.min(100, initialProgress + 5);
      const submission = await createContractorSubmission(
        {
          projectId: 'prj-seed-1',
          type: 'Progress Update',
          title: 'Asphalt Compaction Testing Complete',
          description: 'Density core tests verified IRC compliance. Requesting progress verification.',
          progress: targetProgress,
        },
        contractorUser
      );

      expect(submission.id).toBeDefined();
      expect(submission.status).toBe('Submitted');

      // Step B: Verify PM can view the submission in the queue
      const contractorSubmissions = await getContractorSubmissionsList(contractorUser.uid, 'prj-seed-1');
      expect(contractorSubmissions.some((s) => s.id === submission.id)).toBe(true);

      // Step C: PM approves submission
      const reviewed = await reviewSubmission(
        {
          submissionId: submission.id,
          decision: 'Approved',
          remarks: 'Core test results inspected and verified. Progress certified.',
          publicUpdateTitle: 'Compaction Stage Certified',
          publicUpdateContent: 'Field density test passed. Official progress advanced.',
        },
        pmUser
      );

      expect(reviewed.status).toBe('Approved');

      // Step D: Verify Project official progress was updated
      const projectAfter = await getProjectById('prj-seed-1', true);
      expect(projectAfter?.progress).toBe(targetProgress);

      // Step E: Verify Contractor received approval notification
      const contractorNotifs = await getUserNotifications(contractorUser.uid);
      expect(contractorNotifs.some((n) => n.entityId === submission.id)).toBe(true);

      // Step F: Verify Audit logs recorded both events
      const submissionAudits = await getAuditLogs({ entityId: submission.id });
      expect(submissionAudits.some((a) => a.actionType === 'contractor_submission_created')).toBe(true);
      expect(submissionAudits.some((a) => a.actionType === 'contractor_submission_approved')).toBe(true);
    });
  });
});
