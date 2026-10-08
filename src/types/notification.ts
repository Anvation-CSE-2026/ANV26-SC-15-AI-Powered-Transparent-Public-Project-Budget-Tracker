export type NotificationCategory =
  | 'complaint'
  | 'project'
  | 'contractor'
  | 'suggestion'
  | 'poll'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationType =
  // Complaint events
  | 'complaint_submitted'
  | 'complaint_created'
  | 'complaint_status_changed'
  | 'complaint_assigned'
  | 'complaint_info_requested'
  | 'complaint_escalated'
  | 'complaint_resolved'
  | 'complaint_rejected'
  | 'new_complaint_alert'
  | 'authority_alert'
  | 'sla_breach_warning'
  // Project events
  | 'project_created'
  | 'project_progress_updated'
  | 'project_milestone_completed'
  | 'project_milestone_delayed'
  | 'project_status_changed'
  | 'project_issue_logged'
  | 'project_risk_alert'
  // Contractor events
  | 'contractor_project_assigned'
  | 'contractor_submission_created'
  | 'contractor_submission_received'
  | 'contractor_submission_approved'
  | 'contractor_submission_rejected'
  | 'contractor_submission_changes_requested'
  // Suggestions and polls
  | 'suggestion_submitted'
  | 'suggestion_status_changed'
  | 'poll_published'
  | 'poll_closing_soon'
  // System and announcements
  | 'system_announcement'
  | 'system_alert'
  | 'profile_security_alert';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  entityType: 'complaint' | 'project' | 'submission' | 'suggestion' | 'poll' | 'system';
  entityId: string;
  entityNumber?: string;
  actionUrl: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string; // ISO String
  readAt?: string;
  expiresAt?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  entityType?: 'complaint' | 'project' | 'submission' | 'suggestion' | 'poll' | 'system';
  entityId?: string;
  entityNumber?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, string | number | boolean>;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  categories: {
    complaint: boolean;
    project: boolean;
    contractor: boolean;
    suggestion: boolean;
    poll: boolean;
    system: boolean;
  };
  urgentOnly: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppEnabled: true,
  categories: {
    complaint: true,
    project: true,
    contractor: true,
    suggestion: true,
    poll: true,
    system: true,
  },
  urgentOnly: false,
};
