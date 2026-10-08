import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useContractorDashboard } from '../../hooks/useContractorDashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { ErrorState } from '../../components/common/ErrorState';
import {
  HardHat,
  Building2,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Calendar,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const ContractorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { assignedProjects, submissions, metrics, loading, error, refresh } =
    useContractorDashboard(userProfile?.uid);

  if (loading && !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="py-12">
        <ErrorState
          title="Contractor Portal Unavailable"
          message={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'under review':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'changes requested':
        return <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-900 border-amber-300">Changes Requested</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Contractor Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
              Contractor Operations Portal
            </Badge>
            <span className="text-xs text-amber-300/90 font-mono">
              Charter ID: {userProfile?.uid?.substring(0, 10)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            Welcome back, {userProfile?.displayName || userProfile?.username || 'Contractor'}!
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed">
            Manage your assigned civic infrastructure projects, report worksite milestones, and submit field evidence for municipal verification.
          </p>

          <div className="flex items-center gap-2 text-xs text-amber-200/90 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Updates require Project Manager verification before publishing to public transparency records.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs justify-center"
          >
            Refresh Data
          </Button>

          {assignedProjects.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/dashboard/contractor/projects/${assignedProjects[0].id}/submit`)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/20 text-white text-xs justify-center"
            >
              Submit Update
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top 5 Real KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Projects"
          value={metrics?.assignedProjects ?? 0}
          subtitle="Contractor chartered works"
          icon={<Building2 className="w-5 h-5" />}
          variant="default"
          onClick={() => navigate('/dashboard/contractor/projects')}
        />

        <StatCard
          title="Active Ongoing"
          value={metrics?.activeProjects ?? 0}
          subtitle="Under physical construction"
          icon={<Activity className="w-5 h-5" />}
          variant="info"
          onClick={() => navigate('/dashboard/contractor/projects')}
        />

        <StatCard
          title="Pending Submissions"
          value={metrics?.pendingSubmissions ?? 0}
          subtitle="Awaiting PM inspection"
          icon={<Clock className="w-5 h-5" />}
          variant={(metrics?.pendingSubmissions ?? 0) > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/dashboard/contractor/submissions')}
        />

        <StatCard
          title="Approved Updates"
          value={metrics?.approvedSubmissions ?? 0}
          subtitle="Integrated into public record"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
          onClick={() => navigate('/dashboard/contractor/submissions')}
        />
      </div>

      {/* Revisions & Attention Banner if changes requested */}
      {(metrics?.changesRequestedSubmissions ?? 0) > 0 && (
        <Card className="p-4 bg-amber-50/90 border border-amber-300 text-amber-900 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-200 text-amber-800">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  {metrics?.changesRequestedSubmissions} Submission{metrics?.changesRequestedSubmissions === 1 ? '' : 's'} Require Revision
                </h4>
                <p className="text-xs text-amber-800">
                  The municipal Project Manager has requested modifications or additional evidence for previous submissions.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0"
              onClick={() => navigate('/dashboard/contractor/submissions')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Review Revisions
            </Button>
          </div>
        </Card>
      )}

      {/* 3. Assigned Projects Registry Grid */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600" />
              Assigned Capital Projects
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Public projects assigned to your contractor company by municipal project managers.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate('/dashboard/contractor/projects')}
          >
            View All ({assignedProjects.length})
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {assignedProjects.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Assigned Projects Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your contractor account does not currently have any assigned capital works. Contact municipal authorities or your supervising Project Manager.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedProjects.map((project) => {
                const completion = project.progress || 0;
                const isCompleted = project.status.toLowerCase() === 'completed';

                return (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {project.projectNumber}
                          </span>
                          <Badge variant="info" size="sm">{project.status}</Badge>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {project.department}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {project.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                          Approved Progress
                        </span>
                        <span className="font-bold text-slate-900">{completion}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Target: {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      {project.delayDays > 0 && (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {project.delayDays}d delayed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-slate-700 border-slate-200"
                        onClick={() => navigate(`/dashboard/contractor/projects/${project.id}`)}
                      >
                        Project Details
                      </Button>

                      {!isCompleted ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs bg-amber-600 hover:bg-amber-500 text-white"
                          rightIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/dashboard/contractor/projects/${project.id}/submit`)}
                        >
                          Submit Update
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded">
                          Project Delivered
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Recent Work Submissions & Review Status */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Recent Work Submissions &amp; Authority Decisions
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              History of submitted progress updates, site evidence photos, and delay reports.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => navigate('/dashboard/contractor/submissions')}
          >
            View Submissions ({submissions.length})
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {submissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No work updates submitted yet. Use the &quot;Submit Update&quot; action to report progress or milestones.
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/dashboard/contractor/submissions/${sub.id}`)}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {sub.submissionNumber}
                      </span>
                      {getStatusBadge(sub.status)}
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sub.type}
                      </span>
                      {sub.progress !== undefined && (
                        <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          Requested: {sub.progress}%
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {sub.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      Project: {sub.projectName} &bull; {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>

                    {sub.review?.remarks && (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                        <strong>PM Remarks:</strong> {sub.review.remarks}
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
    </div>
  );
};
