import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import type { StatusDistributionItem } from '../../../api/authorityDashboardService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart3, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface ComplaintAnalyticsSectionProps {
  statusBreakdown: StatusDistributionItem[];
  totalComplaints: number;
  overdueCount: number;
}

export const ComplaintAnalyticsSection: React.FC<ComplaintAnalyticsSectionProps> = ({
  statusBreakdown,
  totalComplaints,
  overdueCount,
}) => {
  const resolvedCount =
    statusBreakdown.find((s) => s.status === 'resolved')?.count || 0;
  const closedCount =
    statusBreakdown.find((s) => s.status === 'closed')?.count || 0;
  const totalSettled = resolvedCount + closedCount;

  // Zero-division protected rates
  const resolutionRate =
    totalComplaints > 0 ? Math.round((totalSettled / totalComplaints) * 100) : 0;
  const slaComplianceRate =
    totalComplaints > 0
      ? Math.max(0, Math.round(((totalComplaints - overdueCount) / totalComplaints) * 100))
      : 100;

  return (
    <Card className="border-slate-200 shadow-xs h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Grievance Resolution Analytics
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Municipal complaint lifecycle &amp; statutory SLA adherence
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              {totalComplaints} Total
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Top Key Performance Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Resolution Rate
              </div>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {resolutionRate}%
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {totalSettled} of {totalComplaints} resolved/closed
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs text-blue-800 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                SLA Compliance
              </div>
              <p className="text-xl font-bold text-blue-700 mt-1">
                {slaComplianceRate}%
              </p>
              <p className="text-[10px] text-blue-600 mt-0.5">
                {overdueCount} breach{overdueCount === 1 ? '' : 'es'} logged
              </p>
            </div>
          </div>

          {/* Recharts Bar Breakdown */}
          {totalComplaints === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No complaint distribution data available.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusBreakdown}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as StatusDistributionItem;
                          const pct =
                            totalComplaints > 0
                              ? Math.round((item.count / totalComplaints) * 100)
                              : 0;
                          return (
                            <div className="p-2 bg-slate-900 text-white rounded-md shadow-md text-xs">
                              <p className="font-semibold">{item.label}</p>
                              <p className="text-slate-300">
                                {item.count} complaints ({pct}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status List with Progress Bars */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {statusBreakdown.map((item) => {
                  const pct =
                    totalComplaints > 0
                      ? Math.round((item.count / totalComplaints) * 100)
                      : 0;
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                        </span>
                        <span className="text-slate-700 font-semibold">
                          {item.count}{' '}
                          <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};
