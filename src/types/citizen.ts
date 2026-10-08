import type { ComplaintPriority, ComplaintStatus, ProjectStatus } from './index';

export interface CitizenDashboardStats {
  myComplaintsCount: number;
  pendingComplaintsCount: number;
  resolvedComplaintsCount: number;
  activeVotesCount: number;
  nearbyIssuesCount: number;
  projectUpdatesCount: number;
}

export interface ComplaintSummary {
  id: string;
  trackingNumber: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  department: string;
  location: string;
  approvedBudgetCr: number;
  actualSpendingCr: number;
  progress: number;
  status: ProjectStatus;
  plannedCompletionDate: string;
  updatedAt: string;
}

export interface PollSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
  status: 'open' | 'closed';
  hasVoted?: boolean;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Traffic' | 'Water' | 'Public Safety' | 'Infrastructure' | 'Events' | 'Emergency';
  priority: 'normal' | 'important' | 'urgent';
  date: string;
  isRead?: boolean;
}

export interface CivicIssueSummary {
  id: string;
  title: string;
  category: string;
  priority: ComplaintPriority;
  area: string;
  status: ComplaintStatus;
  distanceKm?: number;
}
