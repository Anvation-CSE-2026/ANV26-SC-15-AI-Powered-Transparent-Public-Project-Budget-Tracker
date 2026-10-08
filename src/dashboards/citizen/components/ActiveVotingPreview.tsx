import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { Vote, Users, Calendar, ArrowRight } from 'lucide-react';
import type { PollSummary } from '../../../types/citizen';
import { formatDate } from '../../../utils/formatters';

export interface ActiveVotingPreviewProps {
  polls: PollSummary[];
  isLoading?: boolean;
}

export const ActiveVotingPreview: React.FC<ActiveVotingPreviewProps> = ({ polls, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div>
          <CardTitle>Active Civic Voting &amp; Polls</CardTitle>
          <CardDescription>Direct democracy: cast your vote on municipal proposals</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/citizen/voting')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          All Polls
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <EmptyState
            title="There are no active civic votes right now."
            description="Municipal authorities regularly open public voting for ward developments and park enhancements."
            icon={<Vote className="w-8 h-8 text-slate-400" />}
            className="py-10"
          />
        ) : (
          <div className="space-y-3.5">
            {polls.map((poll) => (
              <div
                key={poll.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="info" size="sm">{poll.category}</Badge>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Voting Open
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {poll.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {poll.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      {poll.totalVotes.toLocaleString()} votes cast
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Ends {formatDate(poll.endDate)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/dashboard/citizen/voting')}
                    className="text-xs py-1 px-2.5 h-7"
                  >
                    View &amp; Vote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
