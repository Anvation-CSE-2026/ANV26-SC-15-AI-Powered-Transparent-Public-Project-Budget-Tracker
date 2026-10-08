import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ArrowLeft, Calendar, Info, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const CitizenAnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();

  const announcements = [
    {
      id: 'ann_01',
      title: 'Scheduled Water Supply Maintenance in Western Wards',
      description: 'Pipeline rehabilitation work scheduled for Saturday 10:00 PM to Sunday 06:00 AM. Low pressure expected across Ward 11, 12, and 14.',
      category: 'Water Supply',
      priority: 'Important',
      date: '2026-10-07',
    },
    {
      id: 'ann_02',
      title: 'Public Budget Town Hall: FY 2027 Capital Projects',
      description: 'Join the Municipal Commissioner for open public consultation regarding upcoming arterial road budgets and urban green spaces.',
      category: 'Public Finance',
      priority: 'Normal',
      date: '2026-10-05',
    },
    {
      id: 'ann_03',
      title: 'Monsoon Preparedness & Stormwater Drain Clearing Drive',
      description: 'Municipal sanitation crews deployed for comprehensive desilting of major drainage canals. Citizens can report clogged storm inlets.',
      category: 'Drainage',
      priority: 'Important',
      date: '2026-10-02',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            Official Municipal Announcements
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Verified public advisories, maintenance schedules, and civic bulletins
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-900/60 border border-blue-400/30 px-3.5 py-2 rounded-xl text-xs text-blue-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Government Notices</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
            Targeted ward push notifications, category subscriptions, and emergency broadcast dispatch will be activated in <strong>Phase 12: Notifications</strong>.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant={item.priority === 'Important' ? 'warning' : 'info'} size="sm">
                  {item.priority}
                </Badge>
                <span className="text-xs font-semibold text-slate-500">{item.category}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(item.date)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CitizenAnnouncementsPage;
