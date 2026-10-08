import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import type {
  RecentDashboardActivity,
} from '../../../api/authorityDashboardService';
import type { ProjectUpdate } from '../../../types/project';
import {
  Activity,
  Building2,
  FileText,
  Lightbulb,
  Vote,
  ExternalLink,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';

export interface RecentOperationsSectionProps {
  recentActivities: RecentDashboardActivity[];
  recentProjectUpdates: ProjectUpdate[];
}

export const RecentOperationsSection: React.FC<RecentOperationsSectionProps> = ({
  recentActivities,
  recentProjectUpdates,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'audit' | 'field_updates'>('audit');

  const getActivityIcon = (category: RecentDashboardActivity['category']) => {
    switch (category) {
      case 'project':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'complaint':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'poll':
        return <Vote className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getActivityBadge = (category: RecentDashboardActivity['category']) => {
    switch (category) {
      case 'project':
        return <Badge variant="success" size="sm">Project</Badge>;
      case 'complaint':
        return <Badge variant="info" size="sm">Complaint</Badge>;
      case 'suggestion':
        return <Badge variant="warning" size="sm">Suggestion</Badge>;
      case 'poll':
        return <Badge variant="info" size="sm">Poll</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Recent Municipal Operations &amp; Audit Trail
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Traceable activity logs across civic projects, citizen reports, and administrative decisions.
          </CardDescription>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail ({recentActivities.length})
          </button>

          <button
            onClick={() => setActiveTab('field_updates')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'field_updates'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Project Field Updates ({recentProjectUpdates.length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {activeTab === 'audit' && (
          <div>
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent municipal operations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => navigate(act.link)}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all flex items-start justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs shrink-0 mt-0.5">
                        {getActivityIcon(act.category)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getActivityBadge(act.category)}
                          <span className="text-[11px] font-semibold text-slate-700 capitalize">
                            {act.action}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {act.title}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {act.actor}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(act.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'field_updates' && (
          <div>
            {recentProjectUpdates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No contractor field updates recorded recently.
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjectUpdates.map((upd) => (
                  <div
                    key={upd.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm" className="capitalize">
                          {upd.visibility}
                        </Badge>
                        <span className="font-semibold text-slate-900">{upd.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(upd.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed">{upd.content}</p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Author: <strong className="text-slate-700">{upd.authorName}</strong> (
                        {upd.authorRole.replace(/_/g, ' ')})
                      </span>
                      {upd.attachments && upd.attachments.length > 0 && (
                        <span className="text-blue-600 font-semibold">
                          {upd.attachments.length} attachment{upd.attachments.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
