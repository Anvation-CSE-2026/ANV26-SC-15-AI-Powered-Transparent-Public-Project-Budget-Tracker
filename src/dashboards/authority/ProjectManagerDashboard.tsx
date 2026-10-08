import React, { useState } from 'react';
import { useAuthorityDashboard } from '../../hooks/useAuthorityDashboard';
import { AuthorityHeader } from './components/AuthorityHeader';
import { QuickActionsBar } from './components/QuickActionsBar';
import { AuthorityKPIGrid } from './components/AuthorityKPIGrid';
import { RequiresAttentionSection } from './components/RequiresAttentionSection';
import { EmergencyAndOverdueSection } from './components/EmergencyAndOverdueSection';
import { ComplaintAnalyticsSection } from './components/ComplaintAnalyticsSection';
import { ProjectProgressSection } from './components/ProjectProgressSection';
import { CitizenParticipationSection } from './components/CitizenParticipationSection';
import { RecentOperationsSection } from './components/RecentOperationsSection';
import { ErrorState } from '../../components/common/ErrorState';

export const ProjectManagerDashboard: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const { data, loading, error, refresh } = useAuthorityDashboard(selectedDepartment);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-44 bg-slate-200 rounded-2xl" />

        {/* Toolbar Skeleton */}
        <div className="h-12 bg-slate-200 rounded-xl" />

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>

        {/* Attention Center Skeleton */}
        <div className="h-64 bg-slate-200 rounded-xl" />

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-80 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="h-80 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12">
        <ErrorState
          title="Dashboard Unavailable"
          message={error || 'Failed to aggregate high authority municipal metrics.'}
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Authority Welcome Header & Department Jurisdiction Filter */}
      <AuthorityHeader
        selectedDepartment={selectedDepartment}
        onSelectDepartment={setSelectedDepartment}
        onRefresh={refresh}
        isLoading={loading}
        attentionCount={data.attentionItems.length}
      />

      {/* 2. Rapid Actions Toolbar */}
      <QuickActionsBar />

      {/* 3. Consolidated 8-KPI Metric Grid & Capital Budget Monitor */}
      <AuthorityKPIGrid metrics={data.metrics} />

      {/* 4. Action Center: Requires Authority Attention */}
      <RequiresAttentionSection items={data.attentionItems} />

      {/* 5. Dedicated Emergency Grievances & Overdue SLA Monitor */}
      <EmergencyAndOverdueSection
        emergencyComplaints={data.emergencyComplaints}
        overdueComplaints={data.overdueComplaints}
      />

      {/* 6. Deep Analytics & Operational Workstreams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Capital Infrastructure & Operations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Capital Works Progress & Health */}
          <ProjectProgressSection
            activeProjects={data.activeProjectsList}
            delayedProjects={data.delayedProjectsList}
            atRiskProjects={data.atRiskProjectsList}
          />

          {/* Traceable Municipal Operations & Field Dispatches */}
          <RecentOperationsSection
            recentActivities={data.recentActivities}
            recentProjectUpdates={data.recentProjectUpdates}
          />
        </div>

        {/* Right Column: Complaints Analytics & Democratic Citizen Participation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Complaints Lifecycle & Adherence Analytics */}
          <ComplaintAnalyticsSection
            statusBreakdown={data.complaintStatusBreakdown}
            totalComplaints={data.metrics.totalComplaints}
            overdueCount={data.metrics.overdueComplaints}
          />

          {/* Citizen Suggestions & Civic Polls */}
          <CitizenParticipationSection
            suggestionsSummary={data.suggestionsSummary}
            pollsSummary={data.pollsSummary}
          />
        </div>
      </div>
    </div>
  );
};
