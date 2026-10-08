import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Vote,
  MapPin,
  FolderGit2,
} from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import type { CitizenDashboardStats } from '../../../types/citizen';

export interface CitizenStatsProps {
  stats: CitizenDashboardStats;
  isLoading?: boolean;
}

export const CitizenStats: React.FC<CitizenStatsProps> = ({ stats, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            My Civic Overview
          </h2>
          <p className="text-xs text-slate-500">
            Personal engagement &amp; live municipal indicators
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="My Complaints"
          value={stats.myComplaintsCount}
          subtitle={stats.myComplaintsCount === 0 ? 'No issues reported' : 'Total submitted'}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="default"
          onClick={() => navigate('/dashboard/citizen/complaints')}
        />

        <StatCard
          title="Pending"
          value={stats.pendingComplaintsCount}
          subtitle={stats.pendingComplaintsCount === 0 ? 'Zero pending' : 'Under review/assigned'}
          icon={<Clock className="w-4 h-4" />}
          variant="warning"
          onClick={() => navigate('/dashboard/citizen/complaints')}
        />

        <StatCard
          title="Resolved"
          value={stats.resolvedComplaintsCount}
          subtitle={stats.resolvedComplaintsCount === 0 ? 'Awaiting resolutions' : 'Verified closed'}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="success"
          onClick={() => navigate('/dashboard/citizen/complaints')}
        />

        <StatCard
          title="Active Votes"
          value={stats.activeVotesCount}
          subtitle="Open proposals"
          icon={<Vote className="w-4 h-4" />}
          variant="info"
          onClick={() => navigate('/dashboard/citizen/voting')}
        />

        <StatCard
          title="Nearby Issues"
          value={stats.nearbyIssuesCount}
          subtitle="In your local ward"
          icon={<MapPin className="w-4 h-4" />}
          variant="default"
          onClick={() => navigate('/dashboard/citizen/map')}
        />

        <StatCard
          title="Project Updates"
          value={stats.projectUpdatesCount}
          subtitle="Active municipal works"
          icon={<FolderGit2 className="w-4 h-4" />}
          variant="success"
          onClick={() => navigate('/dashboard/citizen/projects')}
        />
      </div>
    </section>
  );
};
