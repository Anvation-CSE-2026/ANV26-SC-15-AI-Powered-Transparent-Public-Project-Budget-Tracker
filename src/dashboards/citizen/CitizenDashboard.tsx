import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CitizenHeader } from './components/CitizenHeader';
import { QuickActions } from './components/QuickActions';
import { CitizenStats } from './components/CitizenStats';
import { RecentComplaintsPreview } from './components/RecentComplaintsPreview';
import { ActiveVotingPreview } from './components/ActiveVotingPreview';
import { ProjectUpdatesPreview } from './components/ProjectUpdatesPreview';
import { NearbyIssuesPreview } from './components/NearbyIssuesPreview';
import { AnnouncementsPreview } from './components/AnnouncementsPreview';
import { ErrorState } from '../../components/common/ErrorState';
import {
  getCitizenStats,
  getCitizenRecentComplaints,
  getPublicProjectsSummary,
  getActivePolls,
  getNearbyCivicIssues,
  getCityAnnouncements,
} from '../../api/citizenService';
import type {
  CitizenDashboardStats,
  ComplaintSummary,
  ProjectSummary,
  PollSummary,
  CivicIssueSummary,
  AnnouncementSummary,
} from '../../types/citizen';

export const CitizenDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [stats, setStats] = useState<CitizenDashboardStats>({
    myComplaintsCount: 0,
    pendingComplaintsCount: 0,
    resolvedComplaintsCount: 0,
    activeVotesCount: 0,
    nearbyIssuesCount: 0,
    projectUpdatesCount: 0,
  });

  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [nearbyIssues, setNearbyIssues] = useState<CivicIssueSummary[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        const uid = currentUser?.uid || userProfile?.uid || '';
        const [statsData, complaintsData, projectsData, pollsData, nearbyData, annData] =
          await Promise.all([
            getCitizenStats(uid),
            getCitizenRecentComplaints(uid),
            getPublicProjectsSummary(),
            getActivePolls(),
            getNearbyCivicIssues(),
            getCityAnnouncements(),
          ]);

        if (!ignore) {
          setStats(statsData);
          setComplaints(complaintsData);
          setProjects(projectsData);
          setPolls(pollsData);
          setNearbyIssues(nearbyData);
          setAnnouncements(annData);
          setIsLoading(false);
          setHasError(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error('[CivicSight] Error loading Citizen Dashboard data:', err);
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, [currentUser?.uid, userProfile?.uid, reloadKey]);

  if (hasError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load citizen dashboard data"
          message="We encountered an issue synchronizing with municipal databases. Please check your connection and retry."
          onRetry={() => {
            setIsLoading(true);
            setReloadKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* 1. Header with greeting and global search */}
      <CitizenHeader />

      {/* 2. Quick Actions */}
      <QuickActions />

      {/* 3. Citizen Statistics */}
      <CitizenStats stats={stats} isLoading={isLoading} />

      {/* 4. Two-Column: Recent Complaints & Active Voting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentComplaintsPreview complaints={complaints} isLoading={isLoading} />
        <ActiveVotingPreview polls={polls} isLoading={isLoading} />
      </div>

      {/* 5. Project Updates Preview */}
      <ProjectUpdatesPreview projects={projects} isLoading={isLoading} />

      {/* 6. Two-Column: Nearby Issues & City Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <NearbyIssuesPreview issues={nearbyIssues} isLoading={isLoading} />
        <AnnouncementsPreview announcements={announcements} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default CitizenDashboard;
