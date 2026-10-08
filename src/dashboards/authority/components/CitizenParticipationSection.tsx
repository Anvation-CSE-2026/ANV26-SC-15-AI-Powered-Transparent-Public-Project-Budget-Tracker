import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { Poll } from '../../../types/poll';
import {
  Lightbulb,
  Vote,
  Users,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle,
} from 'lucide-react';

export interface CitizenParticipationSectionProps {
  suggestionsSummary: {
    total: number;
    pending: number;
    accepted: number;
    inProgress: number;
    implemented: number;
    rejected: number;
  };
  pollsSummary: {
    total: number;
    active: number;
    scheduled: number;
    draft: number;
    closed: number;
    activePolls: Poll[];
  };
}

export const CitizenParticipationSection: React.FC<CitizenParticipationSectionProps> = ({
  suggestionsSummary,
  pollsSummary,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Citizen Suggestions Moderation Overview */}
      <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Citizen Suggestions Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Community ideas &amp; urban improvement proposals
              </CardDescription>
            </div>
            <Badge variant="warning" size="sm">
              {suggestionsSummary.pending} Pending Review
            </Badge>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Breakdown Status Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/60">
                <p className="text-[10px] uppercase font-semibold text-amber-800">Pending</p>
                <p className="text-lg font-bold text-amber-900 mt-0.5">{suggestionsSummary.pending}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200/60">
                <p className="text-[10px] uppercase font-semibold text-blue-800">Accepted</p>
                <p className="text-lg font-bold text-blue-900 mt-0.5">{suggestionsSummary.accepted}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
                <p className="text-[10px] uppercase font-semibold text-emerald-800">Implemented</p>
                <p className="text-lg font-bold text-emerald-900 mt-0.5">{suggestionsSummary.implemented}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200/60">
                <p className="text-[10px] uppercase font-semibold text-indigo-800">In Progress</p>
                <p className="text-lg font-bold text-indigo-900 mt-0.5">{suggestionsSummary.inProgress}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/60">
                <p className="text-[10px] uppercase font-semibold text-rose-800">Rejected</p>
                <p className="text-lg font-bold text-rose-900 mt-0.5">{suggestionsSummary.rejected}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[10px] uppercase font-semibold text-slate-700">Total</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{suggestionsSummary.total}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>
                  Official Authority Responses: <strong>{suggestionsSummary.total - suggestionsSummary.pending}</strong> evaluated
                </span>
              </span>
              <span className="text-[11px] text-slate-400">Phase 5 Module</span>
            </div>
          </CardContent>
        </div>

        <div className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-amber-800 border-amber-300 hover:bg-amber-50"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => navigate('/dashboard/project-manager/suggestions')}
          >
            Moderate Suggestions Queue
          </Button>
        </div>
      </Card>

      {/* 2. Civic Balloting & Referendum Management */}
      <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Vote className="w-4 h-4 text-indigo-600" />
                Active Civic Polls &amp; Ballots
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Democratic voter consultation on municipal priorities
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              onClick={() => navigate('/dashboard/project-manager/voting/new')}
            >
              New Poll
            </Button>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            {pollsSummary.activePolls.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <Vote className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No active civic polls currently in progress.</p>
                <p className="text-[11px] text-slate-400">
                  {pollsSummary.scheduled} scheduled &bull; {pollsSummary.closed} concluded
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pollsSummary.activePolls.slice(0, 3).map((poll) => {
                  const endsDateStr = poll.endsAt || poll.endDate;
                  const formattedEndDate = endsDateStr
                    ? new Date(endsDateStr).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Active';

                  return (
                    <div
                      key={poll.id}
                      className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="info" size="sm" className="bg-indigo-100 text-indigo-800">
                            Active
                          </Badge>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Closes {formattedEndDate}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 truncate">{poll.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {poll.totalVotes || 0} citizen votes
                          </span>
                          <span>&bull;</span>
                          <span>{poll.options?.length || 0} ballot options</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                        onClick={() => navigate(`/dashboard/project-manager/voting/${poll.id}`)}
                      >
                        Tally
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>

        <div className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-indigo-800 border-indigo-300 hover:bg-indigo-50"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => navigate('/dashboard/project-manager/voting')}
          >
            Manage Civic Polls Hub ({pollsSummary.total} Total)
          </Button>
        </div>
      </Card>
    </div>
  );
};
