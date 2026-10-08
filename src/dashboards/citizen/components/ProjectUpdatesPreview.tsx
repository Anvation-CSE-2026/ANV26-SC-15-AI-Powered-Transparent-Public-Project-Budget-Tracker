import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge, type BadgeVariant } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { FolderGit2, ArrowRight, IndianRupee, Calendar } from 'lucide-react';
import type { ProjectSummary } from '../../../types/citizen';
import { formatCurrencyINR, formatDate } from '../../../utils/formatters';

export interface ProjectUpdatesPreviewProps {
  projects: ProjectSummary[];
  isLoading?: boolean;
}

export const ProjectUpdatesPreview: React.FC<ProjectUpdatesPreviewProps> = ({ projects, isLoading }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'completed':
        return { label: 'COMPLETED', variant: 'success' };
      case 'ongoing':
        return { label: 'ON TRACK', variant: 'success' };
      case 'at_risk':
        return { label: 'AT RISK', variant: 'danger' };
      case 'delayed':
        return { label: 'DELAYED', variant: 'warning' };
      default:
        return { label: 'UPCOMING', variant: 'info' };
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div>
          <CardTitle>Public Project Updates</CardTitle>
          <CardDescription>Transparent budget and progress tracking across municipal works</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/citizen/projects')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All Projects
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No recent project updates."
            description="All active municipal infrastructure projects are being scheduled by the public works department."
            icon={<FolderGit2 className="w-8 h-8 text-slate-400" />}
            className="py-10"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const badge = getStatusBadge(proj.status);
              return (
                <div
                  key={proj.id}
                  onClick={() => navigate('/dashboard/citizen/projects')}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {proj.department}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">
                        {proj.name}
                      </h4>
                    </div>
                    <Badge variant={badge.variant} size="sm" dot>
                      {badge.label}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-900">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          proj.status === 'at_risk' ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget & Target date */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Budget: <strong>{formatCurrencyINR(proj.approvedBudgetCr)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Target: <strong>{formatDate(proj.plannedCompletionDate)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
