export type SubmissionType =
  | 'Progress Update'
  | 'Milestone Update'
  | 'Delay Report'
  | 'Issue Report';

export type SubmissionStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Changes Requested';

export interface SubmissionAttachment {
  id: string;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface SubmissionReview {
  reviewedBy: string;
  reviewerName?: string;
  reviewedAt: string; // ISO date string
  decision: 'Approved' | 'Rejected' | 'Changes Requested';
  remarks?: string;
}

export interface ContractorSubmission {
  id: string; // Firestore document ID
  submissionNumber: string; // SUB-YYYY-XXXXX format

  projectId: string;
  projectNumber: string;
  projectName: string;

  contractorId: string;
  contractorName?: string;

  type: SubmissionType;
  title: string;
  description: string;

  // For Progress Update
  currentProgress?: number;
  progress?: number; // Requested progress (0 - 100)

  // For Milestone Update
  milestoneId?: string;
  milestoneTitle?: string;
  milestoneProgress?: number;
  milestoneStatus?: string;
  actualCompletionDate?: string;

  // For Delay Report
  delay?: {
    isDelayed: boolean;
    expectedDelayDays?: number;
    reason?: string;
    affectedMilestoneId?: string;
  };

  // For Issue Report
  issue?: {
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    affectedMilestoneId?: string;
  };

  attachments: SubmissionAttachment[];

  status: SubmissionStatus;

  review?: SubmissionReview;

  previousSubmissionId?: string; // Reference to previous submission if revised

  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionInput {
  projectId: string;
  type: SubmissionType;
  title: string;
  description: string;

  progress?: number;

  milestoneId?: string;
  milestoneProgress?: number;
  milestoneStatus?: string;
  actualCompletionDate?: string;

  delay?: {
    isDelayed: boolean;
    expectedDelayDays?: number;
    reason?: string;
    affectedMilestoneId?: string;
  };

  issue?: {
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    affectedMilestoneId?: string;
  };

  attachments?: SubmissionAttachment[];
  previousSubmissionId?: string;
}

export interface ReviewSubmissionInput {
  submissionId: string;
  decision: 'Approved' | 'Rejected' | 'Changes Requested';
  remarks?: string;
  publicUpdateTitle?: string;
  publicUpdateContent?: string;
}

export interface ContractorDashboardMetrics {
  assignedProjects: number;
  activeProjects: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  changesRequestedSubmissions: number;
  rejectedSubmissions: number;
  delayedProjects: number;
}
