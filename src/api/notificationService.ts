import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type {
  AppNotification,
  CreateNotificationInput,
  NotificationCategory,
  NotificationPreferences,
} from '../types/notification';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification';

const LOCAL_STORAGE_NOTIFICATIONS = 'civicsight_local_notifications';
const LOCAL_STORAGE_PREFERENCES = 'civicsight_local_notification_prefs';

const notificationMemoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return notificationMemoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  notificationMemoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

function getInitialSeedNotifications(): Record<string, AppNotification[]> {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();

  return {
    // Citizen Seed Notifications
    'cit-seed-1': [
      {
        id: 'notif-cit-1',
        recipientId: 'cit-seed-1',
        type: 'complaint_status_changed',
        category: 'complaint',
        title: 'Grievance Assigned to Response Crew',
        message: 'Your complaint CMP-2026-00401 (Major Water Main Burst) has been assigned to Er. Rajesh Deshmukh.',
        entityType: 'complaint',
        entityId: 'cmp-seed-1',
        entityNumber: 'CMP-2026-00401',
        actionUrl: '/dashboard/citizen/complaints/cmp-seed-1',
        priority: 'high',
        isRead: false,
        createdAt: twoHoursAgo,
      },
      {
        id: 'notif-cit-2',
        recipientId: 'cit-seed-1',
        type: 'project_milestone_completed',
        category: 'project',
        title: 'Project Milestone Delivered',
        message: 'Milestone 3 (Dense Bituminous Macadam Base Layer) for Arterial Ring Road (PRJ-2026-00101) was completed.',
        entityType: 'project',
        entityId: 'prj-seed-1',
        entityNumber: 'PRJ-2026-00101',
        actionUrl: '/dashboard/citizen/projects/prj-seed-1',
        priority: 'normal',
        isRead: false,
        createdAt: oneDayAgo,
      },
      {
        id: 'notif-cit-3',
        recipientId: 'cit-seed-1',
        type: 'poll_published',
        category: 'poll',
        title: 'New Ward 12 Civic Poll Live',
        message: 'Voting has opened for the "Ward 12 Pedestrian Corridor & Smart Crossings" initiative.',
        entityType: 'poll',
        entityId: 'poll-seed-1',
        actionUrl: '/dashboard/citizen/voting',
        priority: 'normal',
        isRead: true,
        readAt: oneDayAgo,
        createdAt: twoDaysAgo,
      },
    ],

    // Project Manager Seed Notifications
    'pm-seed-1': [
      {
        id: 'notif-pm-1',
        recipientId: 'pm-seed-1',
        type: 'contractor_submission_created',
        category: 'contractor',
        title: 'Contractor Milestone Submission Awaiting Review',
        message: 'Apex Urban Infra Tech submitted Milestone 3 proof for PRJ-2026-00101 awaiting statutory approval.',
        entityType: 'submission',
        entityId: 'sub-seed-1',
        entityNumber: 'PRJ-2026-00101',
        actionUrl: '/dashboard/project-manager/submissions',
        priority: 'high',
        isRead: false,
        createdAt: twoHoursAgo,
      },
      {
        id: 'notif-pm-2',
        recipientId: 'pm-seed-1',
        type: 'new_complaint_alert',
        category: 'complaint',
        title: 'Emergency Civic Complaint Filed in Ward 12',
        message: 'Complaint CMP-2026-00401 reported major high-pressure flooding requiring rapid intervention.',
        entityType: 'complaint',
        entityId: 'cmp-seed-1',
        entityNumber: 'CMP-2026-00401',
        actionUrl: '/dashboard/project-manager/complaints',
        priority: 'urgent',
        isRead: false,
        createdAt: oneDayAgo,
      },
      {
        id: 'notif-pm-3',
        recipientId: 'pm-seed-1',
        type: 'project_risk_alert',
        category: 'project',
        title: 'CivicSight Risk Engine Anomaly Detected',
        message: 'North Sector Canal (PRJ-2026-00102) was flagged for High Attention (+45d schedule slippage).',
        entityType: 'project',
        entityId: 'prj-seed-2',
        entityNumber: 'PRJ-2026-00102',
        actionUrl: '/dashboard/project-manager/risk-engine',
        priority: 'high',
        isRead: true,
        readAt: oneDayAgo,
        createdAt: twoDaysAgo,
      },
    ],

    // Contractor Seed Notifications
    'cont-01': [
      {
        id: 'notif-cont-1',
        recipientId: 'cont-01',
        type: 'contractor_project_assigned',
        category: 'contractor',
        title: 'Project Charter Sanctioned & Assigned',
        message: 'You have been designated primary execution contractor for PRJ-2026-00101.',
        entityType: 'project',
        entityId: 'prj-seed-1',
        entityNumber: 'PRJ-2026-00101',
        actionUrl: '/dashboard/contractor/projects/prj-seed-1',
        priority: 'high',
        isRead: false,
        createdAt: oneDayAgo,
      },
    ],
  };
}

function getLocalNotifications(): Record<string, AppNotification[]> {
  const raw = safeGetItem(LOCAL_STORAGE_NOTIFICATIONS);
  if (!raw) {
    const seed = getInitialSeedNotifications();
    saveLocalNotifications(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedNotifications();
  }
}

const memorySubscribers = new Set<() => void>();

function saveLocalNotifications(data: Record<string, AppNotification[]>): void {
  safeSetItem(LOCAL_STORAGE_NOTIFICATIONS, JSON.stringify(data));
  // Dispatch to active memory subscribers
  memorySubscribers.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
  // Dispatch custom event for real-time local listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('civicsight_notifications_updated'));
  }
}

export function resetLocalNotificationsStore(): void {
  const seed = getInitialSeedNotifications();
  saveLocalNotifications(seed);
}

export function getLocalPreferences(): Record<string, NotificationPreferences> {
  const raw = safeGetItem(LOCAL_STORAGE_PREFERENCES);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveLocalPreferences(data: Record<string, NotificationPreferences>): void {
  safeSetItem(LOCAL_STORAGE_PREFERENCES, JSON.stringify(data));
}

// ==========================================
// NOTIFICATION SERVICE API
// ==========================================

/**
 * Creates and delivers a notification to a specific recipient.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<AppNotification> {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newNotification: AppNotification = {
    id: notificationId,
    recipientId: input.recipientId,
    type: input.type,
    category: input.category,
    title: input.title.trim(),
    message: input.message.trim(),
    entityType: input.entityType || 'system',
    entityId: input.entityId || notificationId,
    entityNumber: input.entityNumber,
    actionUrl: input.actionUrl || '',
    priority: input.priority || 'normal',
    isRead: false,
    createdAt: nowIso,
    metadata: input.metadata,
  };

  // 1. Save in local store
  const all = getLocalNotifications();
  const userList = all[input.recipientId] || [];
  userList.unshift(newNotification);
  all[input.recipientId] = userList;
  saveLocalNotifications(all);

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const notifRef = doc(db, 'users', input.recipientId, 'notifications', notificationId);
      await setDoc(notifRef, newNotification);
    } catch (err) {
      console.warn('[NotificationService] Firestore write failed, using local store:', err);
    }
  }

  return newNotification;
}

/**
 * Retrieves notifications for a specific user, sorted latest first.
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limitCount?: number;
    unreadOnly?: boolean;
    category?: NotificationCategory;
  }
): Promise<AppNotification[]> {
  let list: AppNotification[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, 'users', userId, 'notifications');
      let q = query(col, orderBy('createdAt', 'desc'));
      if (options?.limitCount) {
        q = query(q, firestoreLimit(options.limitCount));
      }
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as AppNotification);
    } catch {
      list = [];
    }
  }

  if (list.length === 0) {
    const all = getLocalNotifications();
    list = all[userId] || [];
  }

  // Apply filters
  if (options?.unreadOnly) {
    list = list.filter((n) => !n.isRead);
  }

  if (options?.category) {
    list = list.filter((n) => n.category === options.category);
  }

  if (options?.limitCount && options.limitCount > 0) {
    list = list.slice(0, options.limitCount);
  }

  return list;
}

/**
 * Counts unread notifications for a user.
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const notifs = await getUserNotifications(userId, { unreadOnly: true });
  return notifs.length;
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const nowIso = new Date().toISOString();

  // 1. Update local store
  const all = getLocalNotifications();
  const userList = all[userId] || [];
  const target = userList.find((n) => n.id === notificationId);
  if (target) {
    target.isRead = true;
    target.readAt = nowIso;
    all[userId] = userList;
    saveLocalNotifications(all);
  }

  // 2. Update Firestore
  if (isFirebaseConfigured && db) {
    try {
      const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notifRef, {
        isRead: true,
        readAt: nowIso,
      });
    } catch {
      // fallback
    }
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const nowIso = new Date().toISOString();

  // 1. Update local store
  const all = getLocalNotifications();
  const userList = all[userId] || [];
  let updatedAny = false;
  for (const n of userList) {
    if (!n.isRead) {
      n.isRead = true;
      n.readAt = nowIso;
      updatedAny = true;
    }
  }
  if (updatedAny) {
    all[userId] = userList;
    saveLocalNotifications(all);
  }

  // 2. Update Firestore
  if (isFirebaseConfigured && db) {
    try {
      for (const n of userList) {
        const notifRef = doc(db, 'users', userId, 'notifications', n.id);
        await updateDoc(notifRef, {
          isRead: true,
          readAt: nowIso,
        });
      }
    } catch {
      // fallback
    }
  }
}

/**
 * Deletes a notification from user history.
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  // 1. Update local store
  const all = getLocalNotifications();
  const userList = all[userId] || [];
  const filtered = userList.filter((n) => n.id !== notificationId);
  all[userId] = filtered;
  saveLocalNotifications(all);

  // 2. Delete Firestore doc
  if (isFirebaseConfigured && db) {
    try {
      const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
      await deleteDoc(notifRef);
    } catch {
      // fallback
    }
  }
}

/**
 * Subscribes to real-time notification updates for a user.
 * Returns unsubscribe function.
 */
export function subscribeToUserNotifications(
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void,
  limitCount = 25
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  // Local memory and storage real-time listener
  const emitLocal = () => {
    const all = getLocalNotifications();
    const list = (all[userId] || []).slice(0, limitCount);
    onUpdate(list);
  };

  emitLocal();
  memorySubscribers.add(emitLocal);

  const handleCustomEvent = () => emitLocal();
  if (typeof window !== 'undefined') {
    window.addEventListener('civicsight_notifications_updated', handleCustomEvent);
  }

  let firestoreUnsubscribe: (() => void) | undefined;
  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, 'users', userId, 'notifications');
      const q = query(col, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
      firestoreUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifs = snapshot.docs.map((d) => d.data() as AppNotification);
          if (notifs.length > 0) {
            onUpdate(notifs);
          }
        },
        () => {
          // ignore
        }
      );
    } catch {
      // fallback
    }
  }

  return () => {
    memorySubscribers.delete(emitLocal);
    if (typeof window !== 'undefined') {
      window.removeEventListener('civicsight_notifications_updated', handleCustomEvent);
    }
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}

/**
 * Retrieves notification preferences for a user.
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const all = getLocalPreferences();
  return all[userId] || DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Updates notification preferences for a user.
 */
export async function updateUserNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const all = getLocalPreferences();
  const current = all[userId] || DEFAULT_NOTIFICATION_PREFERENCES;
  const updated: NotificationPreferences = {
    ...current,
    ...prefs,
    categories: {
      ...current.categories,
      ...(prefs.categories || {}),
    },
  };
  all[userId] = updated;
  saveLocalPreferences(all);
  return updated;
}
