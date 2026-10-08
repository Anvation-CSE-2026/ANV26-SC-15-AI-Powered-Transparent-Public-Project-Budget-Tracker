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

export type ComplaintSeverity = 'low' | 'moderate' | 'high' | 'critical';

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

export type SLAStatus = 'on_track' | 'approaching' | 'breached';

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface ComplaintLocation {
  address: string;
  ward?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface ComplaintSLA {
  deadline: string; // ISO string
  status: SLAStatus;
  hoursRemaining?: number;
}

export interface ComplaintResolution {
  summary: string;
  resolvedBy: string;
  resolvedAt: string;
  proofAttachments: ComplaintAttachment[];
}

export interface ComplaintFeedback {
  rating: number; // 1 to 5
  comment?: string;
  submittedAt: string;
}

export interface Complaint {
  id: string; // Firestore document ID
  complaintNumber: string; // CMP-YYYY-XXXXX format
  citizenId: string;
  citizenName: string;
  citizenEmail: string;

  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  severity: ComplaintSeverity;
  status: ComplaintStatus;

  location: ComplaintLocation;

  departmentId?: string;
  departmentName?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;

  projectId?: string; // Optional linked public project

  attachments: ComplaintAttachment[];

  sla?: ComplaintSLA;

  resolution?: ComplaintResolution;

  feedback?: ComplaintFeedback;

  createdAt: string;
  updatedAt: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  actorId: string;
  actorName: string;
  actorRole: 'citizen' | 'project_manager' | 'contractor';
  action: string;
  status?: ComplaintStatus;
  message: string;
  isInternal: boolean; // TRUE for authority-only notes; FALSE for public timeline updates
  attachments?: ComplaintAttachment[];
  createdAt: string;
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  severity?: ComplaintSeverity;
  location: ComplaintLocation;
  projectId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  slaHoursDefault: number;
}

export interface Officer {
  id: string;
  name: string;
  designation: string;
  departmentId: string;
  email: string;
}
