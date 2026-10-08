import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge, type BadgeVariant } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { AlertCircle, PlusCircle, ArrowRight, MapPin, Calendar } from 'lucide-react';
import type { ComplaintSummary } from '../../../types/citizen';
import { formatDate } from '../../../utils/formatters';

export interface RecentComplaintsPreviewProps {
  complaints: ComplaintSummary[];
  isLoading?: boolean;
}

export const RecentComplaintsPreview: React.FC<RecentComplaintsPreviewProps> = ({
  complaints,
  isLoading,
}) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'success';
      case 'in_progress':
      case 'assigned':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'escalated':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getPriorityBadgeVariant = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'emergency':
        return 'emergency';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div>
          <CardTitle>My Recent Complaints</CardTitle>
          <CardDescription>Track status and SLA progress of issues you reported</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/citizen/complaints')}
          leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
        >
          Report New Issue
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState
            title="You haven't reported any civic issues yet."
            description="Notice a pothole, broken streetlight, or drainage overflow? Report it directly to municipal authorities."
            icon={<AlertCircle className="w-8 h-8 text-slate-400" />}
            actionLabel="Report an Issue"
            onAction={() => navigate('/dashboard/citizen/complaints')}
            className="py-10"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/dashboard/citizen/complaints')}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 hover:bg-slate-50/80 rounded-xl p-2.5 transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.trackingNumber}
                    </span>
                    <Badge variant={getStatusBadgeVariant(item.status)} size="sm" dot>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(item.priority)} size="sm">
                      {item.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.location}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
