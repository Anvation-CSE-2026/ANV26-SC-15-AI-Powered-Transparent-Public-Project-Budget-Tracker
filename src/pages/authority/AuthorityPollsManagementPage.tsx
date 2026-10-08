import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Vote,
  Plus,
  Search,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { getAllPollsForAuthority } from '../../api/pollService';
import type { Poll, PollStatus } from '../../types/poll';
import { formatDate } from '../../utils/formatters';

const STATUS_BADGE: Record<PollStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active (Open)', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  closed: { label: 'Concluded', variant: 'neutral' },
  draft: { label: 'Draft', variant: 'warning' },
};

export const AuthorityPollsManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let ignore = false;
    getAllPollsForAuthority({
      status: statusFilter,
      searchQuery: searchQuery.trim() || undefined,
    })
      .then((data) => {
        if (!ignore) {
          setPolls(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading authority polls:', err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, searchQuery]);

  // Derived metrics
  const totalPolls = polls.length;
  const activePolls = polls.filter((p) => p.status === 'active').length;
  const scheduledPolls = polls.filter((p) => p.status === 'scheduled').length;
  const closedPolls = polls.filter((p) => p.status === 'closed').length;
  const totalVotesCast = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-950">
        <div>
          <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
            Democratic Deliberation
          </span>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2.5 mt-1">
            <Vote className="w-7 h-7 text-indigo-400" />
            Civic Polls &amp; Referendum Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Design public engagement polls, set voting parameters, monitor real-time verified citizen votes, and publish conclusive municipal determinations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/dashboard/project-manager/voting/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Create New Civic Poll
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Initiatives
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalPolls}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Active Balloting
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {activePolls}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Scheduled / Upcoming
          </p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {scheduledPolls}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Total Ballots Cast
          </p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1 font-mono">
            {totalVotesCast}
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            All ({totalPolls})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'active' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('active')}
            className="text-xs"
          >
            Active ({activePolls})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'scheduled' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('scheduled')}
            className="text-xs"
          >
            Scheduled ({scheduledPolls})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'closed' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('closed')}
            className="text-xs"
          >
            Concluded ({closedPolls})
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Polls Table / List */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
        </div>
      ) : polls.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Vote className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">No Polls Found</CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs">
              {searchQuery || statusFilter !== 'all'
                ? 'No civic polls match the specified criteria.'
                : 'No voting initiatives created yet. Click "Create New Civic Poll" to start public deliberation.'}
            </CardDescription>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard/project-manager/voting/new')}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create First Poll
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Poll Title &amp; Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Voting Window</th>
                <th className="py-3.5 px-4">Options</th>
                <th className="py-3.5 px-4">Votes Cast</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {polls.map((poll) => {
                const badge = STATUS_BADGE[poll.status] || STATUS_BADGE.draft;
                return (
                  <tr
                    key={poll.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {poll.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {poll.category || 'General'}
                        </span>
                        {poll.targetArea && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.2 rounded border border-brand-200 dark:border-brand-900">
                            Ward {poll.targetArea}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={badge.variant} className="text-[11px]">
                        {badge.label}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {formatDate(poll.startsAt || poll.startDate || '')} –{' '}
                      {formatDate(poll.endsAt || poll.endDate || '')}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {poll.options.length} options
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {poll.totalVotes}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">ballots</span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/dashboard/project-manager/voting/${poll.id}`)}
                        className="text-xs py-1 px-3"
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" />
                        Manage &amp; Analytics
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
