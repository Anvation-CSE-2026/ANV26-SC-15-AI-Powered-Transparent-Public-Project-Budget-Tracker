import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../components/common/StatCard';
import { Card } from '../../../components/common/Card';
import type { AuthorityDashboardMetrics } from '../../../api/authorityDashboardService';
import {
  Building2,
  Activity,
  AlertTriangle,
  FileText,
  Clock,
  AlertOctagon,
  Vote,
  Lightbulb,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';

export interface AuthorityKPIGridProps {
  metrics: AuthorityDashboardMetrics;
}

export const AuthorityKPIGrid: React.FC<AuthorityKPIGridProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const totalDelayedOrAtRisk = metrics.delayedProjects + metrics.atRiskProjects;
  const budgetUtilization =
    metrics.totalSanctionedBudget > 0
      ? Math.round((metrics.totalActualSpending / metrics.totalSanctionedBudget) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* 8 Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Projects */}
        <StatCard
          title="Total Capital Projects"
          value={metrics.totalProjects}
          subtitle="Public works registry"
          icon={<Building2 className="w-5 h-5" />}
          variant="default"
          onClick={() => navigate('/dashboard/project-manager/projects')}
        />

        {/* 2. Active Projects */}
        <StatCard
          title="Active Projects"
          value={metrics.activeProjects}
          subtitle={`${metrics.completedProjects} delivered & completed`}
          icon={<Activity className="w-5 h-5" />}
          variant="info"
          onClick={() => navigate('/dashboard/project-manager/projects')}
        />

        {/* 3. Delayed / At Risk */}
        <StatCard
          title="Delayed / At Risk"
          value={totalDelayedOrAtRisk}
          subtitle={`${metrics.delayedProjects} delayed · ${metrics.atRiskProjects} at risk`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={totalDelayedOrAtRisk > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/dashboard/project-manager/projects')}
        />

        {/* 4. Total Complaints */}
        <StatCard
          title="Total Complaints"
          value={metrics.totalComplaints}
          subtitle="City grievance register"
          icon={<FileText className="w-5 h-5" />}
          variant="default"
          onClick={() => navigate('/dashboard/project-manager/complaints')}
        />

        {/* 5. Pending Complaints */}
        <StatCard
          title="Pending Complaints"
          value={metrics.pendingComplaints}
          subtitle={`${Math.max(0, metrics.totalComplaints - metrics.pendingComplaints)} resolved or closed`}
          icon={<Clock className="w-5 h-5" />}
          variant={metrics.pendingComplaints > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/dashboard/project-manager/complaints')}
        />

        {/* 6. Emergency Complaints */}
        <StatCard
          title="Emergency Grievances"
          value={metrics.emergencyComplaints}
          subtitle={
            metrics.emergencyComplaints > 0
              ? 'Urgent municipal response required'
              : 'Zero active emergency escalations'
          }
          icon={<AlertOctagon className="w-5 h-5" />}
          variant={metrics.emergencyComplaints > 0 ? 'danger' : 'success'}
          onClick={() => navigate('/dashboard/project-manager/complaints')}
        />

        {/* 7. Active Civic Polls */}
        <StatCard
          title="Active Civic Polls"
          value={metrics.activePolls}
          subtitle="Democratic voter initiatives"
          icon={<Vote className="w-5 h-5" />}
          variant="info"
          onClick={() => navigate('/dashboard/project-manager/voting')}
        />

        {/* 8. Pending Suggestions */}
        <StatCard
          title="Pending Suggestions"
          value={metrics.pendingSuggestions}
          subtitle="Citizen ideas awaiting review"
          icon={<Lightbulb className="w-5 h-5" />}
          variant="default"
          onClick={() => navigate('/dashboard/project-manager/suggestions')}
        />
      </div>

      {/* Capital Budget Overview Bar */}
      <Card className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-0 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Consolidated Capital Budget Monitoring
              </p>
              <div className="flex items-center gap-4 mt-0.5 text-sm">
                <span>
                  Sanctioned:{' '}
                  <strong className="text-white font-bold">
                    ₹{metrics.totalSanctionedBudget.toFixed(2)} Cr
                  </strong>
                </span>
                <span className="text-slate-400">&bull;</span>
                <span>
                  Audited Spending:{' '}
                  <strong className="text-emerald-300 font-bold">
                    ₹{metrics.totalActualSpending.toFixed(2)} Cr
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Capital Utilization
              </span>
              <span className="font-bold text-white">{budgetUtilization}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilization > 100
                    ? 'bg-rose-500'
                    : budgetUtilization > 85
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
