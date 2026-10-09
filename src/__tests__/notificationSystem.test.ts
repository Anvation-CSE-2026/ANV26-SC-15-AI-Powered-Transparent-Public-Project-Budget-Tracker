import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToUserNotifications,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  resetLocalNotificationsStore,
} from '../api/notificationService';
import { formatRelativeTime } from '../utils/notificationUtils';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification';
import type { AppNotification, CreateNotificationInput } from '../types/notification';

// Import service workflow actions
import {
  createComplaint,
  assignDepartmentAndOfficer,
  updateComplaintStatus,
  resolveComplaint,
} from '../api/complaintService';
import {
  createContractorSubmission,
  reviewContractorSubmission,
} from '../api/contractorService';
import { updateMilestone, addProjectIssue } from '../api/projectService';
import { createPoll, updatePollStatus } from '../api/pollService';
import { createSuggestion, updateSuggestionStatus } from '../api/suggestionService';
import type { UserProfile } from '../types';

const testCitizenUser: UserProfile = {
  uid: 'test-citizen-01',
  username: 'testcitizen',
  email: 'citizen@example.com',
  displayName: 'Test Citizen',
  role: 'citizen',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

const testAuthorityUser: UserProfile = {
  uid: 'pm-seed-1',
  username: 'pm_authority',
  email: 'pm@example.com',
  displayName: 'Authority PM',
  role: 'project_manager',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

const testContractorUser: UserProfile = {
  uid: 'cont-01',
  username: 'contractor_apex',
  email: 'contractor@apex.com',
  displayName: 'Apex Urban Infra Tech Ltd',
  role: 'contractor',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

describe('Phase 12: Complete Notification System Tests', () => {
  beforeEach(() => {
    resetLocalNotificationsStore();
  });

  // ==========================================
  // 1. DOMAIN MODELS & DEFAULTS
  // ==========================================
  describe('1. Domain Models & Preferences Defaults', () => {
    it('has all notification categories enabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.categories.complaint).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.categories.project).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.categories.contractor).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.categories.poll).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.categories.suggestion).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.categories.system).toBe(true);
    });

    it('enables in-app notifications by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.inAppEnabled).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.urgentOnly).toBe(false);
    });

    it('persists and retrieves updated user preferences', async () => {
      const updated = await updateUserNotificationPreferences('user-pref-1', {
        urgentOnly: true,
        categories: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
          contractor: false,
        },
      });

      expect(updated.urgentOnly).toBe(true);
      expect(updated.categories.contractor).toBe(false);

      const fetched = await getUserNotificationPreferences('user-pref-1');
      expect(fetched.urgentOnly).toBe(true);
      expect(fetched.categories.contractor).toBe(false);
    });
  });

  // ==========================================
  // 2. CREATION & RECIPIENT ISOLATION
  // ==========================================
  describe('2. Notification Creation & Recipient Isolation', () => {
    it('creates a notification with unique ID and timestamp', async () => {
      const input: CreateNotificationInput = {
        recipientId: 'user-a',
        type: 'complaint_created',
        category: 'complaint',
        title: 'Grievance Submitted',
        message: 'Your report has been logged.',
        priority: 'high',
        entityType: 'complaint',
        entityId: 'cmp-100',
        entityNumber: 'CMP-2026-00100',
      };

      const notif = await createNotification(input);
      expect(notif.id).toBeDefined();
      expect(notif.recipientId).toBe('user-a');
      expect(notif.title).toBe('Grievance Submitted');
      expect(notif.priority).toBe('high');
      expect(notif.isRead).toBe(false);
      expect(notif.createdAt).toBeDefined();
    });

    it('defaults priority to "normal" when not specified', async () => {
      const notif = await createNotification({
        recipientId: 'user-b',
        type: 'project_status_changed',
        category: 'project',
        title: 'Project Update',
        message: 'Normal update',
      });

      expect(notif.priority).toBe('normal');
    });

    it('strictly isolates notifications between recipients', async () => {
      await createNotification({
        recipientId: 'user-alice',
        type: 'complaint_created',
        category: 'complaint',
        title: 'Alice Alert',
        message: 'For Alice only',
      });

      await createNotification({
        recipientId: 'user-bob',
        type: 'contractor_submission_received',
        category: 'contractor',
        title: 'Bob Alert',
        message: 'For Bob only',
      });

      const aliceList = await getUserNotifications('user-alice');
      const bobList = await getUserNotifications('user-bob');

      expect(aliceList.some((n) => n.title === 'Alice Alert')).toBe(true);
      expect(aliceList.some((n) => n.title === 'Bob Alert')).toBe(false);

      expect(bobList.some((n) => n.title === 'Bob Alert')).toBe(true);
      expect(bobList.some((n) => n.title === 'Alice Alert')).toBe(false);
    });
  });

  // ==========================================
  // 3. QUERIES & FILTERING
  // ==========================================
  describe('3. Queries & Filtering', () => {
    beforeEach(async () => {
      await createNotification({
        recipientId: 'user-filter-test',
        type: 'complaint_created',
        category: 'complaint',
        title: 'Complaint Item',
        message: 'Msg',
      });
      await createNotification({
        recipientId: 'user-filter-test',
        type: 'project_milestone_completed',
        category: 'project',
        title: 'Project Item',
        message: 'Msg',
      });
      await createNotification({
        recipientId: 'user-filter-test',
        type: 'contractor_submission_received',
        category: 'contractor',
        title: 'Submission Item',
        message: 'Msg',
      });
    });

    it('queries all notifications for user in reverse chronological order', async () => {
      const list = await getUserNotifications('user-filter-test');
      expect(list.length).toBe(3);
      expect(list[0].title).toBe('Submission Item'); // latest
    });

    it('filters by category accurately', async () => {
      const complaints = await getUserNotifications('user-filter-test', { category: 'complaint' });
      expect(complaints.length).toBe(1);
      expect(complaints[0].category).toBe('complaint');

      const projects = await getUserNotifications('user-filter-test', { category: 'project' });
      expect(projects.length).toBe(1);
      expect(projects[0].category).toBe('project');
    });

    it('respects limitCount option', async () => {
      const limited = await getUserNotifications('user-filter-test', { limitCount: 2 });
      expect(limited.length).toBe(2);
    });

    it('counts unread notifications accurately', async () => {
      const count = await getUnreadNotificationsCount('user-filter-test');
      expect(count).toBe(3);
    });
  });

  // ==========================================
  // 4. READ STATUS & BATCH ACTIONS
  // ==========================================
  describe('4. Read Status & Batch Actions', () => {
    it('marks a single notification as read', async () => {
      const notif = await createNotification({
        recipientId: 'user-read-test',
        type: 'complaint_created',
        category: 'complaint',
        title: 'Unread Alert',
        message: 'Testing read mark',
      });

      expect(notif.isRead).toBe(false);

      await markNotificationAsRead('user-read-test', notif.id);

      const list = await getUserNotifications('user-read-test');
      const updated = list.find((n) => n.id === notif.id);
      expect(updated?.isRead).toBe(true);
      expect(updated?.readAt).toBeDefined();

      const unreadCount = await getUnreadNotificationsCount('user-read-test');
      expect(unreadCount).toBe(0);
    });

    it('marks all notifications as read in a single batch', async () => {
      await createNotification({
        recipientId: 'user-batch-test',
        type: 'complaint_created',
        category: 'complaint',
        title: 'Alert 1',
        message: 'Msg 1',
      });
      await createNotification({
        recipientId: 'user-batch-test',
        type: 'project_status_changed',
        category: 'project',
        title: 'Alert 2',
        message: 'Msg 2',
      });

      expect(await getUnreadNotificationsCount('user-batch-test')).toBe(2);

      await markAllNotificationsAsRead('user-batch-test');

      const list = await getUserNotifications('user-batch-test');
      expect(list.every((n) => n.isRead)).toBe(true);
      expect(await getUnreadNotificationsCount('user-batch-test')).toBe(0);
    });
  });

  // ==========================================
  // 5. DELETION & DISMISSAL
  // ==========================================
  describe('5. Notification Deletion & Dismissal', () => {
    it('deletes a specific notification and keeps remaining notifications', async () => {
      const notif1 = await createNotification({
        recipientId: 'user-del-test',
        type: 'complaint_created',
        category: 'complaint',
        title: 'Keep Me',
        message: 'Do not delete',
      });
      const notif2 = await createNotification({
        recipientId: 'user-del-test',
        type: 'complaint_status_changed',
        category: 'complaint',
        title: 'Delete Me',
        message: 'Remove this',
      });

      await deleteNotification('user-del-test', notif2.id);

      const list = await getUserNotifications('user-del-test');
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(notif1.id);
      expect(list.some((n) => n.id === notif2.id)).toBe(false);
    });
  });

  // ==========================================
  // 6. REAL-TIME SUBSCRIPTION
  // ==========================================
  describe('6. Real-Time Subscription Listener', () => {
    it('subscribes to updates and returns unsubscribe handler', async () => {
      let received: AppNotification[] = [];
      const unsubscribe = subscribeToUserNotifications('user-sub-test', (list) => {
        received = list;
      });

      expect(typeof unsubscribe).toBe('function');

      await createNotification({
        recipientId: 'user-sub-test',
        type: 'system_alert',
        category: 'system',
        title: 'Realtime Alert',
        message: 'Subscribed event',
      });

      expect(received.length).toBeGreaterThanOrEqual(1);
      expect(received[0].title).toBe('Realtime Alert');

      unsubscribe();
    });
  });

  // ==========================================
  // 7. EVENT-DRIVEN WORKFLOW TRIGGERS
  // ==========================================
  describe('7. Event-Driven Workflow Triggers', () => {
    it('triggers notifications on createComplaint for citizen and PM', async () => {
      const newCmp = await createComplaint(
        {
          title: 'Dangerous Water Puddle',
          description: 'Road flooded near school',
          category: 'Water',
          priority: 'emergency',
          severity: 'critical',
          location: { address: 'Main Road', ward: 'Ward 12' },
        },
        testCitizenUser
      );

      const citizenNotifs = await getUserNotifications(testCitizenUser.uid);
      expect(citizenNotifs.some((n) => n.entityId === newCmp.id)).toBe(true);
      expect(citizenNotifs[0].priority).toBe('urgent');

      const pmNotifs = await getUserNotifications('pm-seed-1');
      expect(pmNotifs.some((n) => n.entityId === newCmp.id)).toBe(true);
    });

    it('triggers citizen notification on assignDepartmentAndOfficer', async () => {
      const cmp = await createComplaint(
        {
          title: 'Pothole on 5th cross',
          description: 'Deep road crater',
          category: 'Roads',
          priority: 'high',
          location: { address: '5th cross', ward: 'Ward 4' },
        },
        testCitizenUser
      );

      await assignDepartmentAndOfficer(
        cmp.id,
        'dept_roads',
        'Roads Infrastructure',
        'off_10',
        'Er. Nilesh Shinde',
        'high',
        'high',
        24,
        testAuthorityUser
      );

      const citizenNotifs = await getUserNotifications(testCitizenUser.uid);
      const assignNotif = citizenNotifs.find((n) => n.type === 'complaint_assigned');
      expect(assignNotif).toBeDefined();
      expect(assignNotif?.message).toContain('Er. Nilesh Shinde');
    });

    it('triggers citizen notification on updateComplaintStatus', async () => {
      const cmp = await createComplaint(
        {
          title: 'Garbage accumulation',
          description: 'Bin overflow',
          category: 'Garbage',
          priority: 'medium',
          location: { address: 'Market Yard', ward: 'Ward 2' },
        },
        testCitizenUser
      );

      await updateComplaintStatus(
        cmp.id,
        'in_progress',
        'Sanitation crew dispatched to site',
        testAuthorityUser
      );

      const citizenNotifs = await getUserNotifications(testCitizenUser.uid);
      const statusNotif = citizenNotifs.find((n) => n.type === 'complaint_status_changed');
      expect(statusNotif).toBeDefined();
      expect(statusNotif?.message).toContain('Sanitation crew dispatched');
    });

    it('triggers citizen notification on resolveComplaint', async () => {
      const cmp = await createComplaint(
        {
          title: 'Fallen tree branch',
          description: 'Blocking lane',
          category: 'Roads',
          priority: 'high',
          location: { address: 'Lane 3', ward: 'Ward 1' },
        },
        testCitizenUser
      );

      await resolveComplaint(
        cmp.id,
        'Tree branch cleared and removed by tree authority',
        [],
        testAuthorityUser
      );

      const citizenNotifs = await getUserNotifications(testCitizenUser.uid);
      const resNotif = citizenNotifs.find((n) => n.type === 'complaint_resolved');
      expect(resNotif).toBeDefined();
      expect(resNotif?.message).toContain('Tree branch cleared');
    });

    it('triggers contractor and PM notifications on createContractorSubmission', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: 'prj-seed-1',
          type: 'Progress Update',
          title: 'Sub-base Layer Compaction Done',
          description: 'Completed 85% compaction on Section 2',
          progress: 85,
        },
        testContractorUser
      );

      const contractorNotifs = await getUserNotifications(testContractorUser.uid);
      expect(contractorNotifs.some((n) => n.entityId === submission.id)).toBe(true);

      const pmNotifs = await getUserNotifications('pm-seed-1');
      expect(pmNotifs.some((n) => n.entityId === submission.id)).toBe(true);
    });

    it('triggers contractor decision notification on reviewContractorSubmission', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: 'prj-seed-1',
          type: 'Progress Update',
          title: 'Paving Stretch 4',
          description: 'Complete paving for Stretch 4 up to 85%',
          progress: 85,
        },
        testContractorUser
      );

      await reviewContractorSubmission(
        {
          submissionId: submission.id,
          decision: 'Approved',
          remarks: 'Inspected and verified on site',
        },
        testAuthorityUser
      );

      const contractorNotifs = await getUserNotifications(testContractorUser.uid);
      const approvedNotif = contractorNotifs.find((n) => n.type === 'contractor_submission_approved');
      expect(approvedNotif).toBeDefined();
      expect(approvedNotif?.message).toContain('Inspected and verified');
    });

    it('triggers PM notification on updateMilestone completion', async () => {
      await updateMilestone(
        'prj-seed-1',
        'ms-101',
        { status: 'Completed', progressPercentage: 100 },
        testAuthorityUser
      );

      const pmNotifs = await getUserNotifications('pm-seed-1');
      const milestoneNotif = pmNotifs.find((n) => n.type === 'project_milestone_completed');
      expect(milestoneNotif).toBeDefined();
    });

    it('triggers PM notification on addProjectIssue with Critical severity', async () => {
      await addProjectIssue(
        'prj-seed-1',
        {
          title: 'Heavy structural crack discovered',
          description: 'Crack along pier 4 foundation',
          severity: 'Critical',
        },
        testAuthorityUser
      );

      const pmNotifs = await getUserNotifications('pm-seed-1');
      const issueNotif = pmNotifs.find((n) => n.type === 'project_issue_logged');
      expect(issueNotif).toBeDefined();
      expect(issueNotif?.priority).toBe('urgent');
    });

    it('triggers citizen notification when poll status is changed to active', async () => {
      const now = new Date();
      const future = new Date(Date.now() + 7 * 86400000);
      const poll = await createPoll(
        {
          title: 'Pedestrian Crossings on Main Avenue',
          description: 'Vote on proposed traffic calming measures and zebra crossings.',
          category: 'Roads & Transport',
          options: ['Approve plan', 'Revise layout'],
          startsAt: now.toISOString(),
          endsAt: future.toISOString(),
          publishImmediately: false,
        },
        testAuthorityUser
      );

      await updatePollStatus(poll.id, 'active', testAuthorityUser);

      const citNotifs = await getUserNotifications('cit-seed-1');
      const pollNotif = citNotifs.find(
        (n) => n.type === 'poll_published' && n.entityId === poll.id
      );
      expect(pollNotif).toBeDefined();
      expect(pollNotif?.actionUrl).toContain(`/dashboard/citizen/voting/${poll.id}`);
    });

    it('triggers citizen notification when suggestion status is updated', async () => {
      const createdSug = await createSuggestion(
        {
          title: 'Solar Panels on Ward 12 Library',
          description: 'Install rooftop solar panels',
          category: 'Environment',
          location: { address: 'Library road', ward: 'Ward 12' },
        },
        testCitizenUser
      );

      await updateSuggestionStatus(
        createdSug.id,
        'under_review',
        'Assigned to town planning committee',
        testAuthorityUser
      );

      const citNotifs = await getUserNotifications(testCitizenUser.uid);
      const sugNotif = citNotifs.find(
        (n) => n.type === 'suggestion_status_changed' && n.entityId === createdSug.id
      );
      expect(sugNotif).toBeDefined();
      expect(sugNotif?.message).toContain('town planning committee');
    });
  });

  // ==========================================
  // 8. FORMAT RELATIVE TIME HELPER
  // ==========================================
  describe('8. formatRelativeTime Helper', () => {
    it('formats seconds ago as "Just now"', () => {
      const nowIso = new Date().toISOString();
      expect(formatRelativeTime(nowIso)).toBe('Just now');
    });

    it('formats minutes ago properly', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
    });

    it('formats hours ago properly', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
    });

    it('formats 1 day ago as "Yesterday"', () => {
      const oneDayAgo = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(oneDayAgo)).toBe('Yesterday');
    });

    it('formats multiple days ago properly', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(fourDaysAgo)).toBe('4d ago');
    });
  });
});
