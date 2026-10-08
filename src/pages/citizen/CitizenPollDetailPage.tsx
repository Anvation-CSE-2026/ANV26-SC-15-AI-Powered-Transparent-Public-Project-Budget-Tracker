import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import {
  Vote,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Check,
  Award,
  Info,
  Lock,
} from 'lucide-react';
import { getPollById, castVote } from '../../api/pollService';
import type { CitizenPollView, PollStatus } from '../../types/poll';
import { calculatePollResults, isPollOpenForVoting } from '../../utils/pollCalculator';
import { formatDate } from '../../utils/formatters';

const STATUS_BADGE: Record<PollStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Voting Open', variant: 'success' },
  scheduled: { label: 'Upcoming', variant: 'info' },
  closed: { label: 'Concluded', variant: 'neutral' },
  draft: { label: 'Draft', variant: 'warning' },
};

export const CitizenPollDetailPage: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [poll, setPoll] = useState<CitizenPollView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voting interaction state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    if (!pollId) return;
    let ignore = false;

    getPollById(pollId, currentUser?.uid)
      .then((data) => {
        if (!ignore) {
          if (!data) {
            setError('The requested civic poll was not found or has been removed.');
          } else {
            setPoll(data);
            if (data.userVotedOptionId) {
              setSelectedOptionId(data.userVotedOptionId);
            }
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading poll details:', err);
        if (!ignore) {
          setError('Failed to load poll details. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pollId, currentUser?.uid]);

  const handleVoteSubmit = async () => {
    if (!poll || !selectedOptionId) return;

    const authUser = userProfile || {
      uid: currentUser?.uid || `citizen_${Date.now()}`,
      email: currentUser?.email || 'citizen@civicsight.org',
      username: currentUser?.displayName || 'Verified Citizen',
      displayName: currentUser?.displayName || 'Verified Citizen',
      role: 'citizen' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    setSubmittingVote(true);
    setVoteError(null);

    try {
      await castVote(poll.id, selectedOptionId, authUser);
      setIsConfirmModalOpen(false);
      setVoteSuccess(true);

      // Refresh poll view with updated totals & vote state
      const refreshedPoll = await getPollById(poll.id, authUser.uid);
      if (refreshedPoll) {
        setPoll(refreshedPoll);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register your vote';
      setVoteError(msg);
    } finally {
      setSubmittingVote(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <LoadingSkeleton className="h-9 w-32" />
        <LoadingSkeleton className="h-48 w-full" />
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Poll Not Available</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error || 'Unable to display poll.'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/citizen/voting')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Civic Polls
        </Button>
      </div>
    );
  }

  const isOpen = isPollOpenForVoting(poll);
  const statusInfo = STATUS_BADGE[poll.status] || STATUS_BADGE.active;

  // Safe percentage calculation
  const results = calculatePollResults(poll.options, poll.totalVotes);
  const calculatedOptions = results.options;
  const winningOptionId = results.winningOption?.id || null;

  const selectedOptionObj = poll.options.find((o) => o.id === selectedOptionId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/citizen/voting')}
            className="flex items-center text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Polls
          </Button>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/dashboard/citizen" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/citizen/voting" className="hover:underline">Voting</Link>
            <span>/</span>
            <span className="truncate max-w-[180px] font-medium text-slate-700 dark:text-slate-300">
              {poll.title}
            </span>
          </div>
        </div>

        <Badge variant={statusInfo.variant} className="px-3 py-1 text-sm font-semibold self-start sm:self-auto">
          {statusInfo.label}
        </Badge>
      </div>

      {/* Main Poll Header Card */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs border-indigo-400/40 text-indigo-200 bg-indigo-950/40">
              {poll.category}
            </Badge>
            {poll.targetArea && (
              <span className="text-xs text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full font-medium">
                Ward / Area: {poll.targetArea}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading leading-tight mb-2">
            {poll.title}
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {poll.description}
          </p>
        </div>

        {/* Voting Sub-bar */}
        <div className="bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {poll.totalVotes}
              </span>{' '}
              verified votes cast
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Closes {formatDate(poll.endsAt || poll.endDate || '')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>One-Citizen-One-Vote Enforced</span>
          </div>
        </div>
      </Card>

      {/* Notification / Success State */}
      {voteSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Vote Successfully Registered!</h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Your choice has been atomically committed. Thank you for contributing to transparent civic decision making.
            </p>
          </div>
        </div>
      )}

      {/* Already Voted Banner */}
      {poll.hasVoted && (
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
          <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">You have participated in this civic decision</h4>
            <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
              Your vote has been verified and recorded. As per municipal governance rules, votes cannot be changed once submitted.
            </p>
          </div>
        </div>
      )}

      {/* Closed Poll Banner */}
      {!isOpen && poll.status === 'closed' && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">This Poll Has Concluded</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              The public voting window closed on {formatDate(poll.endsAt || poll.endDate || '')}. Final vote tallies and outcomes are displayed below.
            </p>
          </div>
        </div>
      )}

      {/* Voting / Results Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Options / Results Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isOpen && !poll.hasVoted ? (
                    <>
                      <Vote className="w-5 h-5 text-brand-600" />
                      Select Your Preferred Option
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 text-brand-600" />
                      Current Standings &amp; Vote Breakdown
                    </>
                  )}
                </CardTitle>
                <span className="text-xs font-semibold text-slate-500">
                  {calculatedOptions.length} Options
                </span>
              </div>
              <CardDescription className="text-xs">
                {isOpen && !poll.hasVoted
                  ? 'Choose one option below and click Submit Vote to cast your verified civic vote.'
                  : 'Breakdown of verified votes cast across all municipal respondents.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* If user CAN vote: Interactive Radio-like Options */}
              {isOpen && !poll.hasVoted ? (
                <div className="space-y-3">
                  {calculatedOptions.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 dark:border-brand-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-500'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${
                            isSelected
                              ? 'text-brand-900 dark:text-brand-100'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {opt.label || opt.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {voteError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{voteError}</span>
                    </div>
                  )}

                  <div className="pt-3">
                    <Button
                      variant="primary"
                      className="w-full py-2.5 font-medium"
                      disabled={!selectedOptionId}
                      onClick={() => setIsConfirmModalOpen(true)}
                    >
                      <Vote className="w-4 h-4 mr-2" />
                      Cast Verified Vote
                    </Button>
                  </div>
                </div>
              ) : (
                /* User has voted OR poll is closed: Show Visual Results Progress Bars */
                <div className="space-y-4">
                  {calculatedOptions.map((opt) => {
                    const isUserChoice = poll.userVotedOptionId === opt.id;
                    const isWinning = winningOptionId === opt.id && poll.totalVotes > 0;
                    const percent = opt.percentage ?? 0;

                    return (
                      <div
                        key={opt.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isUserChoice
                            ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {opt.label || opt.text}
                            </span>
                            {isUserChoice && (
                              <Badge variant="primary" className="text-[10px] py-0 px-2">
                                Your Vote
                              </Badge>
                            )}
                            {isWinning && (
                              <Badge variant="success" className="text-[10px] py-0 px-2 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {poll.status === 'closed' ? 'Outcome Choice' : 'Leading'}
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

                        {/* Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isUserChoice
                                ? 'bg-indigo-600'
                                : isWinning
                                ? 'bg-emerald-500'
                                : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Poll Information &amp; Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Category
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white font-medium">{poll.category}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Voting Window
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white">
                  {formatDate(poll.startsAt || poll.startDate || '')} – {formatDate(poll.endsAt || poll.endDate || '')}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Municipal Authority
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white">
                  Created by {poll.createdByName}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Strict one-user-one-vote rule enforced via cryptographic user tokens and Firestore transactions.
                  </p>
                </div>
                <div className="flex items-start gap-2 text-slate-500">
                  <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Votes are irreversible once confirmed. Public summaries show aggregate distributions only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vote Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !submittingVote && setIsConfirmModalOpen(false)}
        title="Confirm Your Vote"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            You are about to cast your vote for:
          </p>

          <div className="p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-semibold text-sm">
            {selectedOptionObj?.text}
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              In accordance with civic platform guidelines, <strong>votes cannot be modified or withdrawn</strong> once cast.
            </p>
          </div>

          {voteError && (
            <p className="text-xs text-red-600 font-medium">{voteError}</p>
          )}

          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={submittingVote}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleVoteSubmit}
              isLoading={submittingVote}
            >
              Confirm &amp; Cast Vote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
