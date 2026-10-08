import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSubmissionById } from '../../api/contractorService';
import type { ContractorSubmission } from '../../types/contractor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  User,
  ExternalLink,
  Plus,
} from 'lucide-react';

export const ContractorSubmissionDetailPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [submission, setSubmission] = useState<ContractorSubmission | null>(null);
  const [loading, setLoading] = useState(Boolean(submissionId && userProfile?.uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!submissionId || !userProfile?.uid) return;

    getSubmissionById(submissionId)
      .then((sub) => {
        if (!isMounted) return;
        if (!sub) {
          setError('Submission not found.');
          setLoading(false);
          return;
        }

        // Access boundary: contractor can only inspect their own submissions
        if (sub.contractorId !== userProfile.uid && userProfile.role !== 'project_manager') {
          setError('Unauthorized: You can only view submissions created by your contractor charter.');
          setLoading(false);
          return;
        }

        setSubmission(sub);
        setError(null);
        setLoading(false);
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
  }, [submissionId, userProfile?.uid, userProfile?.role]);

  if (loading) {
    return (
      <div className="space-y-4 py-8 animate-pulse max-w-4xl mx-auto">
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <ErrorState
          title="Submission Not Accessible"
          message={error || 'Unable to retrieve submission record.'}
          onRetry={() => navigate('/dashboard/contractor/submissions')}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'under review':
        return <Badge variant="warning" size="md">Under Review</Badge>;
      case 'approved':
        return <Badge variant="success" size="md">Approved</Badge>;
      case 'changes requested':
        return (
          <Badge variant="warning" size="md" className="bg-amber-100 text-amber-900 border-amber-300">
            Changes Requested
          </Badge>
        );
      case 'rejected':
        return <Badge variant="danger" size="md">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/contractor/submissions')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Back to Submissions
        </Button>

        <span className="font-mono text-xs text-slate-500 font-bold">
          {submission.submissionNumber}
        </span>
      </div>

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
            {submission.type}
          </Badge>
          <span className="font-mono text-xs font-bold text-amber-300">
            {submission.submissionNumber}
          </span>
          {getStatusBadge(submission.status)}
        </div>

        <div>
          <h1 className="text-2xl font-bold font-heading">{submission.title}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Project: <strong className="text-white">{submission.projectName}</strong> ({submission.projectNumber})
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300 pt-2 border-t border-white/10 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Submitted: {new Date(submission.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Contractor: {submission.contractorName}
          </span>
        </div>
      </div>

      {/* Project Manager Decision / Review Panel */}
      {submission.review && (
        <Card className={`border shadow-xs ${
          submission.status === 'Approved'
            ? 'border-emerald-200 bg-emerald-50/20'
            : submission.status === 'Changes Requested'
            ? 'border-amber-300 bg-amber-50/30'
            : 'border-rose-200 bg-rose-50/20'
        }`}>
          <CardHeader className="pb-3 border-b border-slate-200/60 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                {submission.status === 'Approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {submission.status === 'Changes Requested' && <RotateCcw className="w-5 h-5 text-amber-600" />}
                {submission.status === 'Rejected' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
                Municipal Review Decision: {submission.review.decision}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Reviewed by Er. {submission.review.reviewerName || 'Project Manager'} on {new Date(submission.review.reviewedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </CardDescription>
            </div>

            {submission.status === 'Changes Requested' && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white shrink-0"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  navigate(
                    `/dashboard/contractor/projects/${submission.projectId}/submit?ref=${submission.submissionNumber}`
                  )
                }
              >
                Submit Revised Update
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-4 text-xs space-y-2">
            <p className="font-semibold text-slate-700">Official Municipal Feedback &amp; Remarks:</p>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
              {submission.review.remarks}
            </div>

            {submission.status === 'Approved' && (
              <p className="text-[11px] text-emerald-700 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                This submission has been approved. The official project progress has been updated and a public dispatch has been published for citizens.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending State Notice if under review */}
      {(submission.status === 'Submitted' || submission.status === 'Under Review') && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Pending Municipal Review</p>
            <p className="text-amber-800 leading-relaxed">
              This update is currently queued for stage-gate inspection by the Project Manager. Once verified, official progress values and public milestone notifications will be published.
            </p>
          </div>
        </div>
      )}

      {/* Submission Payload Details */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Worksite Submission Contents
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          {/* Description */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700">Description &amp; Work Observations:</span>
            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-800 leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Progress claim */}
          {submission.progress !== undefined && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-900">Physical Progress Claimed</span>
                <p className="text-[11px] text-blue-700">
                  Approved progress at time of submission: {submission.currentProgress}%
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-700">{submission.progress}%</span>
            </div>
          )}

          {/* Milestone Details */}
          {submission.milestoneId && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800">Target Milestone Update</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Requested Status:</span>{' '}
                  <strong className="text-slate-800">{submission.milestoneStatus}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Progress:</span>{' '}
                  <strong className="text-slate-800">{submission.milestoneProgress}%</strong>
                </div>
                {submission.actualCompletionDate && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Actual Completion Date:</span>{' '}
                    <strong className="text-slate-800">{submission.actualCompletionDate}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delay Details */}
          {submission.delay && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
              <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Schedule Delay Reported
              </span>
              <div className="text-[11px] text-amber-900 space-y-1">
                <p>
                  Estimated Delay: <strong>{submission.delay.expectedDelayDays} Days</strong>
                </p>
                <p>
                  Root Cause: <strong>{submission.delay.reason}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Attachments & Photos */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">
              Attached Site Evidence ({submission.attachments?.length || 0})
            </span>

            {(!submission.attachments || submission.attachments.length === 0) ? (
              <p className="text-slate-400 italic">No verification photos attached.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {submission.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 truncate">{att.fileName}</p>
                      <span className="text-[10px] text-slate-400">
                        Size: {(att.size / 1024).toFixed(0)} KB &bull; Type: {att.contentType}
                      </span>
                    </div>

                    {att.downloadURL.startsWith('data:image') || att.downloadURL.includes('.jpg') || att.downloadURL.includes('.png') ? (
                      <div className="h-32 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
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
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full Document
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
