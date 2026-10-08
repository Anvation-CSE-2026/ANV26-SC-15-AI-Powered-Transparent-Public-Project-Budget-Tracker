import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Vote,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Award,
  Play,
  Square,
  RotateCw,
} from 'lucide-react';
import { getPollById, updatePollStatus } from '../../api/pollService';
import type { CitizenPollView, PollStatus } from '../../types/poll';
import { calculatePollResults } from '../../utils/pollCalculator';
import { formatDate } from '../../utils/formatters';

const STATUS_BADGE: Record<PollStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active (Open for Voting)', variant: 'success' },
  scheduled: { label: 'Scheduled (Upcoming)', variant: 'info' },
  closed: { label: 'Concluded (Final Results)', variant: 'neutral' },
  draft: { label: 'Draft', variant: 'warning' },
};

export const AuthorityPollDetailPage: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [poll, setPoll] = useState<CitizenPollView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPoll = useCallback(() => {
    if (!pollId) return;
    getPollById(pollId)
      .then((data) => {
        if (!data) {
          setError('Civic poll not found.');
        } else {
          setPoll(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading poll details for authority:', err);
        setError('Failed to load poll analytics.');
        setLoading(false);
      });
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const authUser = userProfile || {
    uid: currentUser?.uid || 'pm_default',
    email: currentUser?.email || 'pm@civicsight.org',
    username: currentUser?.displayName || 'Project Manager',
    displayName: currentUser?.displayName || 'Project Manager',
    role: 'project_manager' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  const handleStatusChange = async (newStatus: PollStatus) => {
    if (!poll) return;
    setIsUpdating(true);
    setActionSuccess(null);

    try {
      await updatePollStatus(poll.id, newStatus, authUser);
      setActionSuccess(`Poll status changed to ${newStatus.toUpperCase()}`);
      fetchPoll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update poll status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <LoadingSkeleton className="h-9 w-32" />
        <LoadingSkeleton className="h-44 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <LoadingSkeleton className="h-64 w-full" />
          </div>
          <div>
            <LoadingSkeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Poll Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error || 'Unable to load poll.'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/project-manager/voting')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Polls Management
        </Button>
      </div>
    );
  }

  const badge = STATUS_BADGE[poll.status] || STATUS_BADGE.draft;
  const results = calculatePollResults(poll.options, poll.totalVotes);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/project-manager/voting')}
            className="flex items-center text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Polls
          </Button>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/dashboard/project-manager" className="hover:underline">Authority Portal</Link>
            <span>/</span>
            <Link to="/dashboard/project-manager/voting" className="hover:underline">Voting</Link>
            <span>/</span>
            <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">
              {poll.title}
            </span>
          </div>
        </div>

        {/* Lifecycle Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {poll.status !== 'active' && poll.status !== 'closed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange('active')}
              isLoading={isUpdating}
              className="text-xs flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Publish &amp; Activate Balloting
            </Button>
          )}

          {poll.status === 'active' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleStatusChange('closed')}
              isLoading={isUpdating}
              className="text-xs flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              Conclude / Close Voting
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPoll}
            className="text-xs p-2"
            title="Refresh analytics"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Details Banner */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-indigo-400/40 text-indigo-200 bg-indigo-950/40">
                {poll.category}
              </Badge>
              {poll.targetArea && (
                <span className="text-xs text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full font-medium">
                  Jurisdiction: {poll.targetArea}
                </span>
              )}
            </div>
            <Badge variant={badge.variant} className="text-xs px-2.5 py-1">
              {badge.label}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold font-heading leading-tight mb-2">
            {poll.title}
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {poll.description}
          </p>
        </div>

        {/* Sub-bar */}
        <div className="bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {poll.totalVotes}
              </span>{' '}
              verified ballots recorded
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>
                Window: {formatDate(poll.startsAt || poll.startDate || '')} –{' '}
                {formatDate(poll.endsAt || poll.endDate || '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict One-Citizen-One-Vote Transaction Lock</span>
          </div>
        </div>
      </Card>

      {/* Main Grid: Options Distribution + Sidebar Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real-time Distribution Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-600" />
                  Verified Balloting Distribution
                </CardTitle>
                <span className="text-xs text-slate-500 font-mono">
                  {results.totalVotes} Total Votes
                </span>
              </div>
              <CardDescription className="text-xs">
                Real-time tabulation with percentage normalization and zero-division protection.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {results.options.map((opt) => {
                const isLeading = results.winningOption?.id === opt.id && results.hasVotes;
                const percent = opt.percentage ?? 0;

                return (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isLeading
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {opt.label || opt.text}
                        </span>
                        {isLeading && (
                          <Badge variant="success" className="text-[10px] py-0 px-2 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {poll.status === 'closed' ? 'Winning Choice' : 'Currently Leading'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          {percent}%
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {opt.voteCount || 0} votes
                        </span>
                      </div>
                    </div>

                    {/* Percentage Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isLeading ? 'bg-emerald-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {!results.hasVotes && (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Vote className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-50" />
                  No ballots have been registered for this initiative yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Governance Audit & Parameters */}
        <div className="space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Balloting Audit &amp; Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Initiated By
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white font-medium">
                  {poll.createdByName || 'Municipal PM'}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Creation Timestamp
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white">
                  {formatDate(poll.createdAt)}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Database Document Path
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                  polls/{poll.id}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Firestore security rule blocks duplicate submissions: <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">polls/&#123;pollId&#125;/votes/&#123;userId&#125;</code>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
