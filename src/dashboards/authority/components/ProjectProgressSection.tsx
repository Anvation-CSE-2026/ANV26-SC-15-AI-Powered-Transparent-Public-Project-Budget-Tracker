import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { Project } from '../../../types/project';
import {
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';

export interface ProjectProgressSectionProps {
  activeProjects: Project[];
  delayedProjects: Project[];
  atRiskProjects: Project[];
}

export const ProjectProgressSection: React.FC<ProjectProgressSectionProps> = ({
  activeProjects,
  delayedProjects,
  atRiskProjects,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'delayed' | 'at_risk'>('ongoing');

  const currentList =
    activeTab === 'ongoing'
      ? activeProjects
      : activeTab === 'delayed'
      ? delayedProjects
      : atRiskProjects;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ongoing':
        return <Badge variant="info" size="sm">Ongoing</Badge>;
      case 'delayed':
        return <Badge variant="warning" size="sm">Delayed</Badge>;
      case 'at risk':
        return <Badge variant="danger" size="sm">At Risk</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Capital Infrastructure Progress &amp; Health Overview
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Active stage-gates, milestone delivery velocity, and timeline drift monitoring.
          </CardDescription>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Works ({activeProjects.length})
          </button>

          <button
            onClick={() => setActiveTab('delayed')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'delayed'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delayed ({delayedProjects.length})
          </button>

          <button
            onClick={() => setActiveTab('at_risk')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'at_risk'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            At Risk ({atRiskProjects.length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {currentList.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No Projects Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'ongoing'
                ? 'No active capital projects currently ongoing in this jurisdiction.'
                : activeTab === 'delayed'
                ? 'Excellent! No projects are currently running behind targeted delivery schedule.'
                : 'No projects flagged with elevated risk indicators at this time.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {currentList.slice(0, 6).map((project) => {
              const completion = project.progress || 0;
              const budgetSpentPct =
                project.approvedBudget > 0
                  ? Math.min(100, Math.round((project.actualSpending / project.approvedBudget) * 100))
                  : 0;

              return (
                <div
                  key={project.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {project.projectNumber}
                        </span>
                        {getStatusBadge(project.status)}
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {project.department}
                        </span>
                        {project.delayDays && project.delayDays > 0 ? (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {project.delayDays}d delayed
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {project.name}
                      </h4>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-slate-700 border-slate-200 self-start sm:self-center shrink-0"
                      rightIcon={<ArrowRight className="w-3 h-3" />}
                      onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}`)}
                    >
                      Inspect Charter
                    </Button>
                  </div>

                  {/* Progress & Financial Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Physical Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                          Physical Completion
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

                    {/* Financial Utilization */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Budget: ₹{project.actualSpending.toFixed(2)} Cr of ₹
                          {project.approvedBudget.toFixed(2)} Cr
                        </span>
                        <span className="font-bold text-slate-900">{budgetSpentPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            budgetSpentPct > 100
                              ? 'bg-rose-500'
                              : budgetSpentPct > 85
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${budgetSpentPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="truncate">
                      Contractor: <strong className="text-slate-700">{project.contractorName}</strong>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Target:{' '}
                      <strong className="text-slate-700">
                        {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}

            {currentList.length > 6 && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                  onClick={() => navigate('/dashboard/project-manager/projects')}
                >
                  View All {currentList.length} Projects in Registry &rarr;
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
