import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge, type BadgeVariant } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import type { CivicIssueSummary } from '../../../types/citizen';

export interface NearbyIssuesPreviewProps {
  issues: CivicIssueSummary[];
  isLoading?: boolean;
}

export const NearbyIssuesPreview: React.FC<NearbyIssuesPreviewProps> = ({ issues, isLoading }) => {
  const navigate = useNavigate();

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
          <CardTitle>Nearby Civic Issues</CardTitle>
          <CardDescription>Reported conditions in your municipal ward</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/citizen/map')}
          leftIcon={<MapPin className="w-3.5 h-3.5 text-blue-600" />}
        >
          View on Map
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <EmptyState
            title="No nearby civic issues available."
            description="Your local area has no active reports logged in the current municipal cycle."
            icon={<MapPin className="w-8 h-8 text-slate-400" />}
            className="py-10"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((iss) => (
              <div
                key={iss.id}
                onClick={() => navigate('/dashboard/citizen/map')}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityBadgeVariant(iss.priority)} size="sm">
                      {iss.priority.toUpperCase()}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {iss.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {iss.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>{iss.area}</span>
                    {iss.distanceKm !== undefined && (
                      <span className="text-blue-600 font-medium">({iss.distanceKm} km away)</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 group-hover:text-blue-600">
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
