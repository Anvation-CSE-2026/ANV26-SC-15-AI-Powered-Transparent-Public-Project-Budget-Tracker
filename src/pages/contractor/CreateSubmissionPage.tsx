import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getContractorProjectById,
  createContractorSubmission,
  uploadSubmissionEvidence,
} from '../../api/contractorService';
import { getProjectMilestones } from '../../api/projectService';
import type { Project, ProjectMilestone } from '../../types/project';
import type { SubmissionType, SubmissionAttachment } from '../../types/contractor';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { ErrorState } from '../../components/common/ErrorState';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';

export const CreateSubmissionPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const refSubmissionId = searchParams.get('ref');

  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(Boolean(projectId && userProfile?.uid));
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [submissionType, setSubmissionType] = useState<SubmissionType>('Progress Update');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Progress Update
  const [requestedProgress, setRequestedProgress] = useState<number>(0);

  // Milestone Update
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [milestoneStatus, setMilestoneStatus] = useState<string>('Completed');
  const [milestoneProgress, setMilestoneProgress] = useState<number>(100);
  const [actualCompletionDate, setActualCompletionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Delay Report
  const [delayDays, setDelayDays] = useState<number>(7);
  const [delayReason, setDelayReason] = useState<string>('Inclement Monsoon Weather');

  // Issue Report
  const [issueSeverity, setIssueSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  // Attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Submit status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null);
  const [submitSuccessNumber, setSubmitSuccessNumber] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!projectId || !userProfile?.uid) return;

    getContractorProjectById(projectId, userProfile.uid)
      .then(async (prj) => {
        if (!isMounted) return;
        setProject(prj);
        setRequestedProgress(prj.progress || 0);

        const ms = await getProjectMilestones(projectId);
        if (isMounted) {
          setMilestones(ms);
          if (ms.length > 0) {
            setSelectedMilestoneId(ms[0].id);
          }
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Unable to access project.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, userProfile?.uid]);

  if (loading) {
    return (
      <div className="space-y-4 py-8 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <ErrorState
          title="Project Not Accessible"
          message={error || 'You are not authorized to submit updates for this project.'}
          onRetry={() => navigate('/dashboard/contractor/projects')}
        />
      </div>
    );
  }

  if (project.status.toLowerCase() === 'completed') {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Project Completed</h2>
        <p className="text-xs text-slate-600">
          This project has reached final municipal delivery and is marked as Completed. It is no longer accepting contractor updates.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/contractor/projects/${project.id}`)}
        >
          Back to Project Details
        </Button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !userProfile) return;

    if (!title.trim()) {
      alert('Please enter a descriptive title for this update.');
      return;
    }

    if (!description.trim()) {
      alert('Please enter description or worksite notes.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload files if any
      const uploadedAttachments: SubmissionAttachment[] = [];
      if (selectedFiles.length > 0) {
        for (const f of selectedFiles) {
          const att = await uploadSubmissionEvidence(project.id, 'temp-sub', f, userProfile.uid);
          uploadedAttachments.push(att);
        }
      }

      // 2. Create submission
      const sub = await createContractorSubmission(
        {
          projectId: project.id,
          type: submissionType,
          title,
          description,
          progress: submissionType === 'Progress Update' ? requestedProgress : undefined,
          milestoneId: submissionType === 'Milestone Update' ? selectedMilestoneId : undefined,
          milestoneProgress: submissionType === 'Milestone Update' ? milestoneProgress : undefined,
          milestoneStatus: submissionType === 'Milestone Update' ? milestoneStatus : undefined,
          actualCompletionDate: submissionType === 'Milestone Update' ? actualCompletionDate : undefined,
          delay:
            submissionType === 'Delay Report'
              ? {
                  isDelayed: true,
                  expectedDelayDays: delayDays,
                  reason: delayReason,
                  affectedMilestoneId: selectedMilestoneId || undefined,
                }
              : undefined,
          issue:
            submissionType === 'Issue Report'
              ? {
                  severity: issueSeverity,
                  affectedMilestoneId: selectedMilestoneId || undefined,
                }
              : undefined,
          attachments: uploadedAttachments,
          previousSubmissionId: refSubmissionId || undefined,
        },
        userProfile
      );

      setSubmitSuccessId(sub.id);
      setSubmitSuccessNumber(sub.submissionNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit update. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success View
  if (submitSuccessId && submitSuccessNumber) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 animate-in fade-in">
        <Card className="p-8 text-center border-emerald-200 bg-emerald-50/20 shadow-md space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <Badge variant="success" size="md">Submission Submitted for Review</Badge>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">Work Update Registered</h2>
            <p className="font-mono text-sm font-bold text-blue-600">{submitSuccessNumber}</p>
          </div>

          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Your worksite submission has been delivered to the supervising municipal Project Manager (<strong>{project.projectManagerName}</strong>). Official project metrics and public transparency dispatches will be updated upon inspection.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/contractor/projects/${project.id}`)}
              className="w-full sm:w-auto text-xs"
            >
              Back to Project
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-500 text-white"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/dashboard/contractor/submissions/${submitSuccessId}`)}
            >
              View Submission Details
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentProgress = project.progress || 0;
  const progressDiff = requestedProgress - currentProgress;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/contractor/projects/${project.id}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Back to Project
        </Button>
        <span className="font-mono text-xs text-slate-500 font-bold">{project.projectNumber}</span>
      </div>

      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl space-y-2">
        <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
          Worksite Update Submission
        </Badge>
        <h1 className="text-2xl font-bold font-heading">Submit Worksite Update</h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          Project: <strong>{project.name}</strong> &bull; Supervising PM: <strong>{project.projectManagerName}</strong>
        </p>
      </div>

      {refSubmissionId && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            This submission is a revised draft referencing previous feedback from submission <strong>{refSubmissionId}</strong>.
          </span>
        </div>
      )}

      {/* Form Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* 1. Submission Type */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 text-sm">
                Select Submission Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Progress Update', 'Milestone Update', 'Delay Report', 'Issue Report'] as SubmissionType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSubmissionType(type)}
                      className={`p-3 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        submissionType === type
                          ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs">{type}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* 2. Common Fields */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <Input
                label="Update Title"
                placeholder="e.g., Bituminous layering complete for Sector 8"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Detailed Description & Worksite Observations"
                placeholder="Provide specific notes regarding activities completed, materials applied, quality metrics, or field conditions..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* 3. Type-Specific Details */}

            {/* A. Progress Update */}
            {submissionType === 'Progress Update' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Physical Progress Verification</h4>
                    <p className="text-[11px] text-slate-500">
                      Approved Progress: <strong>{currentProgress}%</strong>
                    </p>
                  </div>
                  {progressDiff !== 0 && (
                    <Badge variant={progressDiff > 0 ? 'success' : 'warning'} size="sm">
                      {progressDiff > 0 ? `+${progressDiff}% requested` : `${progressDiff}% correction`}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-semibold">
                      Requested Physical Progress: <span className="text-blue-600 font-bold">{requestedProgress}%</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={requestedProgress}
                    onChange={(e) => setRequestedProgress(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Commencing)</span>
                    <span>50% (Midway)</span>
                    <span>100% (Substantial Delivery)</span>
                  </div>
                </div>

                {progressDiff < 0 && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Note:</strong> You are requesting a decrease in approved physical progress. Ensure your description outlines the audit or scope correction reason.
                  </p>
                )}
              </div>
            )}

            {/* B. Milestone Update */}
            {submissionType === 'Milestone Update' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900">Stage-Gate Milestone Details</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Target Milestone</label>
                    <select
                      value={selectedMilestoneId}
                      onChange={(e) => setSelectedMilestoneId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.progressPercentage}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Requested Status</label>
                    <select
                      value={milestoneStatus}
                      onChange={(e) => setMilestoneStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Milestone Progress (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={milestoneProgress}
                    onChange={(e) => setMilestoneProgress(Number(e.target.value))}
                  />
                  <Input
                    label="Actual Completion Date"
                    type="date"
                    value={actualCompletionDate}
                    onChange={(e) => setActualCompletionDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* C. Delay Report */}
            {submissionType === 'Delay Report' && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-amber-950">Schedule Delay Notification</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Estimated Timeline Delay (Days)"
                    type="number"
                    min="1"
                    value={delayDays}
                    onChange={(e) => setDelayDays(Number(e.target.value))}
                    required
                  />

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Primary Root Cause</label>
                    <select
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Inclement Monsoon Weather">Inclement Monsoon Weather / Flood</option>
                      <option value="Material Supply Chain Shortage">Material Supply Chain Shortage</option>
                      <option value="Utility Relocation Required">Utility (Gas/Water/Power) Relocation</option>
                      <option value="Right-of-Way Clearance Delay">Right-of-Way / Land Access Delay</option>
                      <option value="Engineering Redesign Approval">Engineering Redesign Approval</option>
                      <option value="Other Field Factor">Other Field Factor</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800">
                  Submitting a delay report alerts the Project Manager for stage-gate evaluation. The official project status is determined by municipal authority review.
                </p>
              </div>
            )}

            {/* D. Issue Report */}
            {submissionType === 'Issue Report' && (
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-4">
                <h4 className="font-bold text-rose-950">Worksite Internal Issue Report</h4>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Issue Severity</label>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Low">Low (Informational / minor inconvenience)</option>
                    <option value="Medium">Medium (Requires attention in next stage-gate)</option>
                    <option value="High">High (Impacting schedule / quality)</option>
                    <option value="Critical">Critical (Immediate safety / work stoppage)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. Evidence / Photos Upload */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Site Evidence &amp; Verification Photos
              </label>
              <p className="text-xs text-slate-500">
                Attach field inspection photos, material delivery notes, or lab test certificates.
              </p>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-file-input"
                />
                <label
                  htmlFor="evidence-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="font-semibold text-blue-600 hover:text-blue-700">
                    Click to select site photos or documents
                  </span>
                  <span className="text-[11px] text-slate-400">PNG, JPG, PDF up to 10MB each</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="font-semibold text-slate-700">Selected files ({selectedFiles.length}):</p>
                  <div className="space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                      >
                        <span className="truncate max-w-xs">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Submitted data will be queued for Project Manager verification.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                {isSubmitting ? 'Submitting to Municipal Queue...' : 'Submit Update for PM Review'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
