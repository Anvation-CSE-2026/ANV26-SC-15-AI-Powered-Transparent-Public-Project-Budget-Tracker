import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSubmissionById, reviewSubmission } from '../../api/contractorService';
import { getProjectById } from '../../api/projectService';
import type { ContractorSubmission } from '../../types/contractor';
import type { Project } from '../../types/project';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { ErrorState } from '../../components/common/ErrorState';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  HardHat,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const AuthoritySubmissionDetailPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [submission, setSubmission] = useState<ContractorSubmission | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(Boolean(submissionId));
  const [error, setError] = useState<string | null>(null);

  // Decision Modals
  const [activeModal, setActiveModal] = useState<'approve' | 'request_changes' | 'reject' | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [publicUpdateTitle, setPublicUpdateTitle] = useState('');
  const [publicUpdateContent, setPublicUpdateContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!submissionId) return;

    getSubmissionById(submissionId)
      .then(async (sub) => {
        if (!isMounted) return;
        if (!sub) {
          setError('Submission not found.');
          setLoading(false);
          return;
        }
        setSubmission(sub);

        const prj = await getProjectById(sub.projectId);
        if (isMounted) {
          setProject(prj);
          setPublicUpdateTitle(`Verified Field Progress: ${sub.title}`);
          setPublicUpdateContent(
            sub.progress !== undefined
              ? `Municipal authority has inspected and verified field progress at ${sub.progress}%. Contractor work notes: "${sub.description}"`
              : `Municipal authority has verified contractor field update: ${sub.description}`
          );
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Unable to load submission.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  if (loading) {
    return (
      <div className="space-y-4 py-8 animate-pulse max-w-5xl mx-auto">
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !submission || !project) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <ErrorState
          title="Submission Not Accessible"
          message={error || 'Unable to retrieve submission record.'}
          onRetry={() => navigate('/dashboard/project-manager/submissions')}
        />
      </div>
    );
  }

  const isFinalized = submission.status === 'Approved' || submission.status === 'Rejected';

  const handleDecisionSubmit = async (decision: 'Approved' | 'Rejected' | 'Changes Requested') => {
    if (!userProfile) return;

    if (decision !== 'Approved' && !reviewRemarks.trim()) {
      alert('Remarks are required for Rejection or Changes Requested.');
      return;
    }

    try {
      setIsProcessing(true);
      const updated = await reviewSubmission(
        {
          submissionId: submission.id,
          decision,
          remarks: reviewRemarks,
          publicUpdateTitle: decision === 'Approved' ? publicUpdateTitle : undefined,
          publicUpdateContent: decision === 'Approved' ? publicUpdateContent : undefined,
        },
        userProfile
      );

      setSubmission(updated);
      setActiveModal(null);
      setReviewRemarks('');

      // Reload project to reflect updated progress
      const reloadedPrj = await getProjectById(submission.projectId);
      setProject(reloadedPrj);

      alert(`Submission successfully ${decision.toLowerCase()}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record decision.';
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/project-manager/submissions')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Back to Submissions Queue
        </Button>

        <span className="font-mono text-xs text-slate-500 font-bold">
          {submission.submissionNumber}
        </span>
      </div>

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
              Authority Review
            </Badge>
            <span className="font-mono text-xs font-bold text-amber-300">
              {submission.submissionNumber}
            </span>
            <Badge
              variant={
                submission.status === 'Approved'
                  ? 'success'
                  : submission.status === 'Rejected'
                  ? 'danger'
                  : 'warning'
              }
              size="sm"
            >
              {submission.status}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold font-heading">{submission.title}</h1>

          <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Project: <strong className="text-white">{submission.projectName}</strong>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5 text-slate-400" />
              Contractor: <strong className="text-white">{submission.contractorName}</strong>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Submitted: {new Date(submission.createdAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Buttons if not finalized */}
        {!isFinalized && (
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-amber-400 text-amber-300 hover:bg-amber-900/40"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setActiveModal('request_changes')}
            >
              Request Changes
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs border-rose-400 text-rose-300 hover:bg-rose-900/40"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => setActiveModal('reject')}
            >
              Reject
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => setActiveModal('approve')}
            >
              Approve &amp; Publish
            </Button>
          </div>
        )}
      </div>

      {/* Decision Status Banner if already finalized */}
      {submission.review && (
        <Card className={`border shadow-xs ${
          submission.status === 'Approved'
            ? 'border-emerald-200 bg-emerald-50/30'
            : submission.status === 'Changes Requested'
            ? 'border-amber-300 bg-amber-50/40'
            : 'border-rose-200 bg-rose-50/30'
        }`}>
          <CardContent className="p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {submission.status === 'Approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {submission.status === 'Changes Requested' && <RotateCcw className="w-4 h-4 text-amber-600" />}
                {submission.status === 'Rejected' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                Decision Logged: {submission.review.decision}
              </span>
              <span className="text-slate-500">
                Reviewed by Er. {submission.review.reviewerName} on {new Date(submission.review.reviewedAt).toLocaleDateString('en-IN')}
              </span>
            </div>

            {submission.review.remarks && (
              <p className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
                {submission.review.remarks}
              </p>
            )}

            {isFinalized && (
              <p className="text-[11px] text-slate-500 italic pt-1">
                This submission has been officially finalized and its review decision is permanently archived.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison Panel: Official Record vs Contractor Claim */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Official Project Record */}
        <Card className="border-slate-200 shadow-xs space-y-4">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <div className="space-y-0.5">
              <Badge variant="neutral" size="sm">Baseline</Badge>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-blue-600" />
                Current Approved Project Record
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Official municipal metrics currently visible on public portal.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs pt-1">
            <div className="space-y-1">
              <span className="text-slate-500">Approved Physical Progress</span>
              <div className="flex items-center justify-between font-bold text-slate-900 text-base">
                <span>{project.progress}% Complete</span>
                <Badge variant="info" size="sm">{project.status}</Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Project Number</span>
                <span className="font-mono font-bold text-slate-800">{project.projectNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{project.department}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Sanctioned Budget</span>
                <span className="font-semibold text-slate-800">₹{project.approvedBudget.toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Target Delivery</span>
                <span className="font-semibold text-slate-800">
                  {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Current Delay Status</span>
                <span className={`font-semibold ${project.delayDays > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
                  {project.delayDays > 0 ? `${project.delayDays} days delayed` : 'On Schedule'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}`)}
              >
                Inspect Full Project Charter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Contractor Submission Claim */}
        <Card className="border-amber-200/80 shadow-xs space-y-4">
          <CardHeader className="pb-3 border-b border-amber-100 bg-amber-50/30 rounded-t-xl">
            <div className="space-y-0.5">
              <Badge variant="warning" size="sm">Contractor Claim</Badge>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-1">
                <HardHat className="w-4 h-4 text-amber-600" />
                Submitted Worksite Update
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Claimed progress and field observations awaiting your verification.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs pt-1">
            {submission.progress !== undefined && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-900 font-semibold">Requested Progress Claim</span>
                  <span className="text-xl font-bold text-amber-950">{submission.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-800">
                  <span>Baseline: {submission.currentProgress}%</span>
                  <span className="font-bold text-emerald-700">
                    +{submission.progress - (submission.currentProgress || 0)}% Increase
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Work Description &amp; Field Notes:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                {submission.description}
              </p>
            </div>

            {submission.milestoneId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-800">Milestone Action</span>
                <p className="text-slate-600">
                  Status: <strong>{submission.milestoneStatus}</strong> &bull; Progress: <strong>{submission.milestoneProgress}%</strong>
                </p>
              </div>
            )}

            {submission.delay && (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1">
                <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Reported Delay Impact
                </span>
                <p className="text-amber-900">
                  Duration: <strong>{submission.delay.expectedDelayDays} Days</strong> &bull; Cause: {submission.delay.reason}
                </p>
              </div>
            )}

            {/* Evidence photos */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700">
                Site Photos &amp; Verification Evidence ({submission.attachments?.length || 0})
              </span>

              {(!submission.attachments || submission.attachments.length === 0) ? (
                <p className="text-slate-400 italic">No verification photos attached.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {submission.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2 rounded-lg border border-slate-200 bg-white space-y-1.5 text-[11px]"
                    >
                      <p className="font-semibold text-slate-900 truncate">{att.fileName}</p>
                      {att.downloadURL.startsWith('data:image') || att.downloadURL.includes('.jpg') || att.downloadURL.includes('.png') ? (
                        <div className="h-24 bg-slate-100 rounded overflow-hidden">
                          <img
                            src={att.downloadURL}
                            alt={att.fileName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <a
                        href={att.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-semibold block text-[10px]"
                      >
                        Open File &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* DECISION MODALS                                          */}
      {/* ========================================================= */}

      {/* Modal 1: Approve Submission */}
      <Modal
        isOpen={activeModal === 'approve'}
        onClose={() => setActiveModal(null)}
        title="Approve Contractor Submission"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Atomic Record Update &amp; Public Transparency Broadcast
            </p>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Approving will update the official project physical progress to{' '}
              <strong>{submission.progress ?? project.progress}%</strong>, update milestone status, and publish the verified update to citizens on the public portal.
            </p>
          </div>

          <Input
            label="Public Project Update Headline"
            value={publicUpdateTitle}
            onChange={(e) => setPublicUpdateTitle(e.target.value)}
            required
          />

          <Textarea
            label="Public Announcement Text (Visible to Citizens)"
            rows={3}
            value={publicUpdateContent}
            onChange={(e) => setPublicUpdateContent(e.target.value)}
            required
          />

          <Textarea
            label="Authority Review Remarks (Archived into audit trail)"
            placeholder="e.g. Field inspection conducted on 12th Oct verified bituminous layering quality and depth."
            rows={2}
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              isLoading={isProcessing}
              disabled={isProcessing}
              onClick={() => handleDecisionSubmit('Approved')}
            >
              Confirm &amp; Publish Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Request Changes */}
      <Modal
        isOpen={activeModal === 'request_changes'}
        onClose={() => setActiveModal(null)}
        title="Request Revisions from Contractor"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Contractor Revision Workflow
            </p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Official project progress will NOT change. The contractor will be notified to submit a revised draft addressing your remarks.
            </p>
          </div>

          <Textarea
            label="Required Revisions &amp; Feedback (Mandatory)"
            placeholder="Specify missing site evidence, corrections needed in claimed progress, or revised schedule estimates..."
            rows={4}
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
              isLoading={isProcessing}
              disabled={isProcessing}
              onClick={() => handleDecisionSubmit('Changes Requested')}
            >
              Send Revision Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Reject Submission */}
      <Modal
        isOpen={activeModal === 'reject'}
        onClose={() => setActiveModal(null)}
        title="Reject Worksite Submission"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Submission Rejection
            </p>
            <p className="text-rose-800 text-[11px] leading-relaxed">
              Official project progress will NOT change. The submission will be permanently archived as Rejected.
            </p>
          </div>

          <Textarea
            label="Reason for Rejection (Mandatory)"
            placeholder="State the engineering, contractual, or quality failure reason..."
            rows={4}
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="font-bold"
              isLoading={isProcessing}
              disabled={isProcessing}
              onClick={() => handleDecisionSubmit('Rejected')}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
