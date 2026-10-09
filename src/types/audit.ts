import type { UserRole } from './index';

export type AuditActionType =
  | 'project_created'
  | 'project_updated'
  | 'project_status_changed'
  | 'project_budget_updated'
  | 'milestone_created'
  | 'milestone_updated'
  | 'milestone_completed'
  | 'contractor_assigned'
  | 'contractor_submission_created'
  | 'contractor_submission_approved'
  | 'contractor_submission_rejected'
  | 'contractor_submission_changes_requested'
  | 'complaint_created'
  | 'complaint_assigned'
  | 'complaint_status_changed'
  | 'complaint_resolved'
  | 'complaint_rejected'
  | 'audit_internal_note'
  | 'poll_created'
  | 'poll_closed'
  | 'vote_cast'
  | 'suggestion_created'
  | 'suggestion_reviewed'
  | 'risk_audit_flag_issued'
  | 'user_registered'
  | 'user_profile_updated';

export type AuditEntityType =
  | 'project'
  | 'milestone'
  | 'submission'
  | 'complaint'
  | 'poll'
  | 'suggestion'
  | 'user'
  | 'system';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  actionTitle: string;
  entityType: AuditEntityType;
  entityId: string;
  entityNumber?: string;
  summary: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  timestamp: string;
}

export interface AuditLogFilters {
  searchQuery?: string;
  entityType?: AuditEntityType;
  actionType?: AuditActionType;
  actorRole?: UserRole;
  entityId?: string;
  isPublicOnly?: boolean;
  startDate?: string;
  endDate?: string;
  limitCount?: number;
}
