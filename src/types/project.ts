export type RiskLevel = 'Normal' | 'Attention' | 'High Attention';

export interface ProjectLocation {
  address: string;
  city: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
}

export type ProjectCategory =
  | 'Roads & Transport'
  | 'Drainage'
  | 'Water Supply'
  | 'Waste Management'
  | 'Street Lighting'
  | 'Public Buildings'
  | 'Parks & Public Spaces'
  | 'Traffic Infrastructure'
  | 'Sanitation'
  | 'Digital Infrastructure'
  | 'Environment'
  | 'Other';

export type ProjectStatus =
  | 'Upcoming'
  | 'Ongoing'
  | 'Delayed'
  | 'Completed'
  | 'At Risk'
  | 'upcoming'
  | 'ongoing'
  | 'delayed'
  | 'completed'
  | 'at_risk';

export type MilestoneStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Delayed'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delayed';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string; // ISO date YYYY-MM-DD
  actualDate?: string;
  status: MilestoneStatus;
  progressPercentage: number; // 0 - 100
  order: number;
  weight?: number; // relative weight %
  createdAt: string;
  updatedAt?: string;
}

export type UpdateVisibility = 'Public' | 'Internal' | 'public' | 'internal';

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  visibility: UpdateVisibility;
  pinned: boolean;
  attachments?: string[];
  createdAt: string;
}

export type IssueSeverity =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type IssueStatus =
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface ProjectIssue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number; // in bytes
  uploadedBy: string;
  uploadedByName: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  caption: string;
  photoUrl: string;
  phase?: 'Before' | 'In Progress' | 'After';
  uploadedBy: string;
  uploadedByName: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  action: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface Project {
  id: string;
  projectNumber: string; // Format: PRJ-YYYY-XXXXX
  name: string;
  description: string;
  category: ProjectCategory;
  department: string;
  departmentId?: string;
  projectManagerId: string;
  projectManagerName: string;
  contractorId?: string;
  contractorName?: string;
  location: ProjectLocation;
  startDate: string; // ISO date YYYY-MM-DD
  plannedCompletionDate: string; // ISO date YYYY-MM-DD
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  approvedBudget: number; // In Crores INR
  estimatedCost: number; // In Crores INR
  actualSpending: number; // In Crores INR
  progress: number; // 0 - 100 percentage
  expectedProgress?: number;
  budgetDeviation: number; // ((actualSpending - approvedBudget) / approvedBudget) * 100
  delayDays: number;
  status: ProjectStatus;
  isPublic: boolean;
  riskScore: number; // 0 - 4
  riskLabel: RiskLevel;
  milestonesCount: number;
  completedMilestonesCount: number;
  issuesCount: number;
  unresolvedIssuesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  category: ProjectCategory;
  department: string;
  departmentId?: string;
  contractorId?: string;
  contractorName?: string;
  location: ProjectLocation;
  startDate: string;
  plannedCompletionDate: string;
  approvedBudget: number;
  estimatedCost: number;
  actualSpending?: number;
  progress?: number;
  status?: ProjectStatus;
  isPublic: boolean;
  initialMilestones?: Array<{
    title: string;
    description: string;
    targetDate: string;
    weight?: number;
  }>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  category?: ProjectCategory;
  department?: string;
  departmentId?: string;
  contractorId?: string;
  contractorName?: string;
  location?: ProjectLocation;
  startDate?: string;
  plannedCompletionDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  approvedBudget?: number;
  estimatedCost?: number;
  actualSpending?: number;
  progress?: number;
  delayDays?: number;
  status?: ProjectStatus;
  isPublic?: boolean;
}

export interface CreateMilestoneInput {
  title: string;
  description: string;
  targetDate: string;
  status?: MilestoneStatus;
  progressPercentage?: number;
  order?: number;
  weight?: number;
}

export interface CreateProjectUpdateInput {
  title: string;
  content: string;
  visibility: UpdateVisibility;
  pinned?: boolean;
  attachments?: string[];
}

export interface CreateProjectIssueInput {
  title: string;
  description: string;
  severity: IssueSeverity;
  assignedTo?: string;
  assignedToName?: string;
}
