import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Vote,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Check,
  BarChart3,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { getCitizenPolls } from '../../api/pollService';
import type { CitizenPollView, PollStatus } from '../../types/poll';
import { formatDate } from '../../utils/formatters';

const STATUS_BADGE: Record<PollStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active Poll', variant: 'success' },
  scheduled: { label: 'Upcoming', variant: 'info' },
  closed: { label: 'Concluded', variant: 'neutral' },
  draft: { label: 'Draft', variant: 'warning' },
};

export const CitizenVotingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [polls, setPolls] = useState<CitizenPollView[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let ignore = false;
    getCitizenPolls(currentUser?.uid, {
      status: statusFilter,
      searchQuery: searchQuery.trim() || undefined,
    })
      .then((data: CitizenPollView[]) => {
        if (!ignore) {
          setPolls(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.warn('[CivicSight] Error loading citizen polls:', err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentUser?.uid, statusFilter, searchQuery]);

  // Derived metrics
  const activeCount = polls.filter((p) => p.status === 'active').length;
  const votedCount = polls.filter((p) => p.hasVoted).length;
  const concludedCount = polls.filter((p) => p.status === 'closed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-950">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2.5">
            <Vote className="w-7 h-7 text-indigo-400" />
            Public Citizen Voting &amp; Polls
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Cast verified, secure one-citizen votes on municipal budget priorities, urban master plans, and ward enhancements.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-400/30 px-3.5 py-2 rounded-xl text-xs text-indigo-200 self-stretch sm:self-auto justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>One-Citizen-One-Vote Blockchain/Audit Verified</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Open For Voting
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {activeCount}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <Vote className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Your Participations
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {votedCount}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Concluded Polls
            </p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
              {concludedCount}
            </p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            All Polls
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'active' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('active')}
            className="text-xs"
          >
            Active ({activeCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'closed' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('closed')}
            className="text-xs"
          >
            Concluded
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

      {/* Polls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
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
                ? 'No civic polls match your selected criteria. Try adjusting filters or search query.'
                : 'There are currently no active public decision polls for your municipal jurisdiction.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {polls.map((poll) => {
            const badge = STATUS_BADGE[poll.status] || STATUS_BADGE.active;
            const isOpen = poll.status === 'active';

            return (
              <Card
                key={poll.id}
                className="flex flex-col justify-between border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Voted Indicator Banner */}
                {poll.hasVoted && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-1.5 flex items-center justify-between text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Your vote is officially recorded
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">
                      VERIFIED
                    </span>
                  </div>
                )}

                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {poll.category}
                    </span>
                  </div>

                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                      {poll.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                      {poll.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{poll.totalVotes} votes cast</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ends {formatDate(poll.endsAt || poll.endDate || '')}</span>
                    </div>
                  </div>

                  {/* Options Mini Preview */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Options ({poll.options.length})
                    </p>
                    <div className="space-y-1.5">
                      {poll.options.slice(0, 3).map((opt) => {
                        const isSelected = poll.userVotedOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-md text-xs flex items-center justify-between border ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-medium'
                                : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate pr-2 flex items-center gap-1.5">
                              {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                              {opt.label || opt.text}
                            </span>
                            {(poll.hasVoted || poll.status === 'closed') && (
                              <span className="font-mono text-[11px] text-slate-500 shrink-0">
                                {opt.percentage ?? 0}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {poll.options.length > 3 && (
                        <p className="text-[10px] text-slate-400 text-center">
                          +{poll.options.length - 3} more options
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isOpen && !poll.hasVoted ? (
                      <Button
                        variant="primary"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => navigate(`/dashboard/citizen/voting/${poll.id}`)}
                      >
                        <Vote className="w-4 h-4" />
                        Cast Your Vote
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => navigate(`/dashboard/citizen/voting/${poll.id}`)}
                      >
                        <BarChart3 className="w-4 h-4" />
                        {poll.hasVoted ? 'View Poll Details & Standings' : 'View Final Results'}
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
