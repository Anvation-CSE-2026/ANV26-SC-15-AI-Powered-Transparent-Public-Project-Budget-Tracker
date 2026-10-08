import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Vote, ArrowLeft, Info, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const CitizenVotingPage: React.FC = () => {
  const navigate = useNavigate();

  const demoPolls = [
    {
      id: 'poll_green_corridor_01',
      title: 'Pedestrian Green Corridor & Cycling Track',
      description: 'Vote on whether Municipal Ward 4 should convert Central Avenue into a weekend zero-emission pedestrian zone.',
      category: 'Urban Mobility',
      startDate: '2026-10-01',
      endDate: '2026-10-25',
      totalVotes: 1240,
      options: [
        { text: 'In Favor: Create weekend pedestrian zone', votes: 840, percent: 68 },
        { text: 'Opposed: Maintain continuous vehicular traffic', votes: 400, percent: 32 },
      ],
    },
    {
      id: 'poll_solar_lights_02',
      title: 'Community Solar Street Lighting Expansion',
      description: 'Prioritize street lighting upgrades between North Sector Parks and Outer Residential Ward 7.',
      category: 'Public Infrastructure',
      startDate: '2026-10-03',
      endDate: '2026-10-28',
      totalVotes: 890,
      options: [
        { text: 'Priority 1: Outer Residential Ward 7', votes: 530, percent: 60 },
        { text: 'Priority 2: North Sector Parks perimeter', votes: 360, percent: 40 },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            Public Citizen Voting &amp; Polls
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Cast verified votes on municipal project prioritizations and ward enhancements
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-400/30 px-3.5 py-2 rounded-xl text-xs text-indigo-200">
          <Vote className="w-4 h-4 text-indigo-300" />
          <span>One Citizen = One Vote Security</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-indigo-800 text-[11px] mt-0.5 leading-relaxed">
            Cryptographic one-user-one-vote database transactions, duplicate vote prevention, and live tallied result engines will be activated in <strong>Phase 5: Suggestions + Voting</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {demoPolls.map((poll) => (
          <Card key={poll.id} className="flex flex-col justify-between">
            <CardHeader>
              <div>
                <Badge variant="info" size="sm">{poll.category}</Badge>
                <CardTitle className="mt-2 text-sm">{poll.title}</CardTitle>
                <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                {poll.options.map((opt, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-800">
                      <span>{opt.text}</span>
                      <span className="text-indigo-600">{opt.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${opt.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  {poll.totalVotes.toLocaleString()} votes cast
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ends {formatDate(poll.endDate)}
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => alert('Live vote casting will activate in Phase 5.')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Cast Verified Vote
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CitizenVotingPage;
