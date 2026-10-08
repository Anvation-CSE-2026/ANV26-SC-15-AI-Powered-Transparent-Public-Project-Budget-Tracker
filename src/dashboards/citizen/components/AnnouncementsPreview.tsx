import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge, type BadgeVariant } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { Bell, Calendar, ArrowRight } from 'lucide-react';
import type { AnnouncementSummary } from '../../../types/citizen';
import { formatDate } from '../../../utils/formatters';

export interface AnnouncementsPreviewProps {
  announcements: AnnouncementSummary[];
  isLoading?: boolean;
}

export const AnnouncementsPreview: React.FC<AnnouncementsPreviewProps> = ({ announcements, isLoading }) => {
  const navigate = useNavigate();

  const getPriorityBadgeVariant = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'important':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div>
          <CardTitle>City Announcements</CardTitle>
          <CardDescription>Official municipal notices and public advisories</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/citizen/announcements')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            title="No new city announcements."
            description="All municipal services are running according to regular schedule."
            icon={<Bell className="w-8 h-8 text-slate-400" />}
            className="py-10"
          />
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => navigate('/dashboard/citizen/announcements')}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-2xs transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityBadgeVariant(ann.priority)} size="sm">
                      {ann.priority.toUpperCase()}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {ann.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(ann.date)}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {ann.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {ann.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
