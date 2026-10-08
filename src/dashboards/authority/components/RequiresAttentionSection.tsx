import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { AttentionItem } from '../../../api/authorityDashboardService';
import {
  AlertOctagon,
  Clock,
  AlertTriangle,
  Lightbulb,
  Vote,
  CheckCircle2,
  ExternalLink,
  Filter,
} from 'lucide-react';

export interface RequiresAttentionSectionProps {
  items: AttentionItem[];
}

export const RequiresAttentionSection: React.FC<RequiresAttentionSectionProps> = ({ items }) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'complaints') {
      return item.type === 'emergency_complaint' || item.type === 'overdue_complaint';
    }
    if (filterType === 'projects') {
      return item.type === 'delayed_project' || item.type === 'at_risk_project';
    }
    if (filterType === 'participation') {
      return item.type === 'pending_suggestion' || item.type === 'closing_poll';
    }
    return true;
  });

  const getSeverityBadge = (severity: AttentionItem['severity']) => {
    switch (severity) {
      case 'emergency':
        return (
          <Badge variant="danger" size="sm" className="bg-red-600 text-white animate-pulse">
            Emergency Dispatch
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="danger" size="sm">
            SLA Breached
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="warning" size="sm">
            High Project Risk
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" size="sm">
            Timeline Delayed
          </Badge>
        );
      default:
        return (
          <Badge variant="info" size="sm">
            Action Recommended
          </Badge>
        );
    }
  };

  const getItemIcon = (type: AttentionItem['type']) => {
    switch (type) {
      case 'emergency_complaint':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'overdue_complaint':
        return <Clock className="w-5 h-5 text-rose-600" />;
      case 'delayed_project':
      case 'at_risk_project':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'pending_suggestion':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'closing_poll':
        return <Vote className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getItemBorderClass = (severity: AttentionItem['severity']) => {
    switch (severity) {
      case 'emergency':
        return 'border-l-4 border-l-red-600 bg-red-50/30 hover:bg-red-50/60';
      case 'critical':
        return 'border-l-4 border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/40';
      case 'high':
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-50/20 hover:bg-amber-50/40';
      default:
        return 'border-l-4 border-l-blue-500 bg-slate-50/50 hover:bg-slate-50';
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {items.length > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    items.length > 0 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
              Requires Authority Attention
            </CardTitle>
            <Badge
              variant={items.length > 0 ? 'danger' : 'success'}
              size="sm"
            >
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Prioritized municipal intervention queue aggregating emergencies, SLA violations, project delays, and pending citizen reviews.
          </CardDescription>
        </div>

        {/* Filter Pill Buttons */}
        {items.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterType('complaints')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'complaints'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Complaints (
              {
                items.filter(
                  (i) => i.type === 'emergency_complaint' || i.type === 'overdue_complaint'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilterType('projects')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'projects'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Projects (
              {
                items.filter(
                  (i) => i.type === 'delayed_project' || i.type === 'at_risk_project'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilterType('participation')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'participation'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Citizen (
              {
                items.filter(
                  (i) => i.type === 'pending_suggestion' || i.type === 'closing_poll'
                ).length
              }
              )
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              Operational Status Optimal
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {items.length === 0
                ? 'No emergency complaints, SLA violations, delayed milestones, or unreviewed proposals requiring immediate authority intervention.'
                : 'No items match the selected filter category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border border-slate-200/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${getItemBorderClass(
                  item.severity
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                    {getItemIcon(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.identifier}
                      </span>
                      {getSeverityBadge(item.severity)}
                      {item.overdueDuration && (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {item.overdueDuration}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  <Button
                    variant={item.severity === 'emergency' ? 'danger' : 'primary'}
                    size="sm"
                    className="text-xs w-full sm:w-auto"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => navigate(item.actionUrl)}
                  >
                    {item.actionLabel}
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
