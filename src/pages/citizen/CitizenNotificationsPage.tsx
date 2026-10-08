import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ArrowLeft, Bell, Info, CheckCheck } from 'lucide-react';

export const CitizenNotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 'notif_01',
      title: 'New Public Voting Open',
      message: 'Voting has opened for the Pedestrian Green Corridor proposal in Ward 4.',
      time: '2 hours ago',
      unread: true,
      type: 'info',
    },
    {
      id: 'notif_02',
      title: 'Project Milestone Reached',
      message: 'City Road Improvement & Resurfacing has completed 82% progress on MG Road stretch.',
      time: '1 day ago',
      unread: false,
      type: 'success',
    },
    {
      id: 'notif_03',
      title: 'Citizen Grievance SLA Update',
      message: 'All sanitation complaints reported in Ward 12 are currently assigned to the rapid response crew.',
      time: '3 days ago',
      unread: false,
      type: 'neutral',
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
            Citizen Notifications
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Activity feed, complaint progress updates, and civic alerts
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          onClick={() => alert('Marked all as read.')}
        >
          Mark All as Read
        </Button>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
            Automated event triggers (complaint status transitions, SLA breach alerts, and push notifications) will be implemented in <strong>Phase 12: Notifications</strong>.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Feed</CardTitle>
          <CardDescription>Chronological events regarding your submissions and ward updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`py-3.5 first:pt-0 last:pb-0 flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                  n.unread ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${
                  n.unread ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>
                {n.unread && (
                  <Badge variant="info" size="sm" dot>New</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenNotificationsPage;
