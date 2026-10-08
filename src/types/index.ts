// Core Domain Models & Contracts for CivicSight

export type UserRole = 'citizen' | 'project_manager' | 'contractor';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

import type { ProjectLocation } from './project';

export type {
  RiskLevel,
  ProjectLocation,
  ProjectCategory,
  ProjectStatus,
  MilestoneStatus,
  ProjectMilestone,
  UpdateVisibility,
  ProjectUpdate,
  IssueSeverity,
  IssueStatus,
  ProjectIssue,
  ProjectDocument,
  ProjectPhoto,
  ProjectActivity,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  CreateProjectUpdateInput,
  CreateProjectIssueInput,
} from './project';

export type Milestone = import('./project').ProjectMilestone;

export type ComplaintCategory =
  | 'Roads'
  | 'Drainage'
  | 'Garbage'
  | 'Street Lights'
  | 'Water'
  | 'Traffic'
  | 'Public Infrastructure'
  | 'Parks'
  | 'Sanitation'
  | 'Other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'emergency';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_info'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'rejected';

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenEmail?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: ProjectLocation;
  department: string;
  photoURL?: string;
  videoURL?: string;
  assignedOfficer?: string;
  slaDeadline?: string;
  resolutionProofURL?: string;
  resolutionNotes?: string;
  projectId?: string; // linked project if applicable
  feedbackRating?: number; // 1 to 5
  feedbackComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorUpdate {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  milestoneId?: string;
  progressReported: number;
  description: string;
  evidencePhotos: string[];
  reportedDelayDays: number;
  status: 'pending' | 'approved' | 'rejected';
  pmFeedback?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Suggestion {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  authorityResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  category: string;
  options: PollOption[];
  totalVotes: number;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
  votedUserIds?: string[];
  createdAt: string;
}

export interface CivicNotification {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'complaint' | 'project' | 'contractor_update' | 'suggestion' | 'poll' | 'user';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}
