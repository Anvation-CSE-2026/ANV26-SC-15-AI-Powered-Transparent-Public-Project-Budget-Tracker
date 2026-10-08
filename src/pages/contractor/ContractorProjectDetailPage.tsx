import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getContractorProjectById,
  getContractorSubmissionsList,
} from '../../api/contractorService';
import {
  getProjectMilestones,
  getProjectUpdates,
} from '../../api/projectService';
import type { Project, ProjectMilestone, ProjectUpdate } from '../../types/project';
import type { ContractorSubmission } from '../../types/contractor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Building2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { WorksiteMapPreview } from '../../components/map/WorksiteMapPreview';

export const ContractorProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [submissions, setSubmissions] = useState<ContractorSubmission[]>([]);
  const [loading, setLoading] = useState(Boolean(projectId && userProfile?.uid));
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'updates' | 'submissions'>('overview');

  useEffect(() => {
    let isMounted = true;
    if (!projectId || !userProfile?.uid) return;

    getContractorProjectById(projectId, userProfile.uid)
      .then(async (prj) => {
        if (!isMounted) return;
        setProject(prj);
        const [ms, upds, subs] = await Promise.all([
          getProjectMilestones(projectId),
          getProjectUpdates(projectId, false),
          getContractorSubmissionsList(userProfile.uid, projectId),
        ]);
        if (isMounted) {
          setMilestones(ms);
          setUpdates(upds);
          setSubmissions(subs);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to access project details.';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, userProfile?.uid]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse py-8">
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <ErrorState
          title="Project Access Restricted"
          message={error || 'Project not found or not assigned to your contractor account.'}
          onRetry={() => navigate('/dashboard/contractor/projects')}
        />
      </div>
    );
  }

  const isCompleted = project.status.toLowerCase() === 'completed';
  const completion = project.progress || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/contractor/projects')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Back to Assigned Projects
        </Button>

        {!isCompleted ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/dashboard/contractor/projects/${project.id}/submit`)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
          >
            Submit Work Update
          </Button>
        ) : (
          <Badge variant="success" size="md">Project Completed</Badge>
        )}
      </div>

      {/* Project Banner Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
            Assigned Work Charter
          </Badge>
          <span className="font-mono text-xs text-amber-300 font-bold">
            {project.projectNumber}
          </span>
          <span className="text-xs text-slate-300 capitalize bg-white/10 px-2 py-0.5 rounded">
            Status: {project.status}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">{project.name}</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-white/10">
          <div>
            <span className="text-slate-400">Department</span>
            <p className="font-bold text-white mt-0.5">{project.department}</p>
          </div>
          <div>
            <span className="text-slate-400">Supervising PM</span>
            <p className="font-bold text-white mt-0.5">{project.projectManagerName}</p>
          </div>
          <div>
            <span className="text-slate-400">Location</span>
            <p className="font-bold text-white mt-0.5">
              {project.location.ward || 'Ward'}, {project.location.city}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Target Delivery</span>
            <p className="font-bold text-white mt-0.5">
              {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Verification Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Official Municipal Record Distinction</p>
          <p className="text-blue-800 leading-relaxed">
            All physical progress, milestone completions, and site evidence submitted below remain in a <strong>&quot;Pending Review&quot;</strong> state until formally verified and approved by the municipal Project Manager.
          </p>
        </div>
      </div>

      {/* Progress & Health Bar */}
      <Card className="p-5 border-slate-200 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Approved Physical Completion
            </span>
            <span className="text-base font-bold text-slate-900">{completion}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Started: {new Date(project.startDate).toLocaleDateString('en-IN')}</span>
            {project.delayDays > 0 ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {project.delayDays} days delayed
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Schedule on track
              </span>
            )}
            <span>Target: {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-b-2 border-amber-600 text-amber-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview &amp; Charter
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`pb-3 px-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'milestones'
              ? 'border-b-2 border-amber-600 text-amber-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Milestones</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px]">
            {milestones.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 px-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'submissions'
              ? 'border-b-2 border-amber-600 text-amber-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Contractor Submissions</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
            {submissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`pb-3 px-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'updates'
              ? 'border-b-2 border-amber-600 text-amber-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Approved Public Updates</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px]">
            {updates.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Charter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Project Category</span>
                <span className="font-semibold text-slate-800">{project.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Municipal Department</span>
                <span className="font-semibold text-slate-800">{project.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Supervising Officer</span>
                <span className="font-semibold text-slate-800">{project.projectManagerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Worksite Ward</span>
                <span className="font-semibold text-slate-800">{project.location.ward || 'Central'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Address</span>
                <span className="font-semibold text-slate-800">{project.location.address}</span>
              </div>

              {project.location && (
                <div className="pt-2">
                  <WorksiteMapPreview
                    latitude={project.location.latitude}
                    longitude={project.location.longitude}
                    title={project.name}
                    address={project.location.address}
                    ward={project.location.ward}
                    city={project.location.city}
                    type="project"
                    status={project.status}
                    heightClass="h-44"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Submission Action Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Submit progress updates, request milestone sign-offs, report weather/material delays, or log site issues for Project Manager verification.
              </p>

              {!isCompleted ? (
                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs bg-amber-600 hover:bg-amber-500 text-white justify-center"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => navigate(`/dashboard/contractor/projects/${project.id}/submit`)}
                  >
                    Submit Worksite Progress &amp; Photos
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg">
                  This project has reached official completion. No new updates are required.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Milestones */}
      {activeTab === 'milestones' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Official Stage-Gate Milestones ({milestones.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Milestone progress is officially updated upon Project Manager approval of submissions.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {milestones.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No stage-gate milestones configured for this project charter.
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{m.title}</span>
                        <Badge variant={m.status === 'Completed' ? 'success' : 'info'} size="sm">
                          {m.status}
                        </Badge>
                      </div>
                      <span className="text-slate-500">
                        Target Date: {new Date(m.targetDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <p className="text-slate-600">{m.description}</p>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Milestone Progress</span>
                        <span className="font-bold text-slate-700">{m.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${m.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Submissions History */}
      {activeTab === 'submissions' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Contractor Submissions for this Project ({submissions.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Track status and view Project Manager review remarks.
              </CardDescription>
            </div>

            {!isCompleted && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/dashboard/contractor/projects/${project.id}/submit`)}
              >
                New Submission
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-4">
            {submissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No submissions recorded yet for this project.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => navigate(`/dashboard/contractor/submissions/${sub.id}`)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {sub.submissionNumber}
                        </span>
                        <Badge
                          variant={
                            sub.status === 'Approved'
                              ? 'success'
                              : sub.status === 'Rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {sub.status}
                        </Badge>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {sub.type}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {sub.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {sub.description}
                      </p>

                      {sub.review?.remarks && (
                        <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                          <strong>PM Decision ({sub.review.decision}):</strong> {sub.review.remarks}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 w-full sm:w-auto flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs group-hover:border-blue-300 w-full sm:w-auto"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Approved Public Updates */}
      {activeTab === 'updates' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Verified Public Dispatches ({updates.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Approved contractor updates published to citizens on the public project tracking portal.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {updates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No public updates published yet. Approved submissions will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {updates.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900">{u.title}</h4>
                      <span className="text-[11px] text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{u.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
