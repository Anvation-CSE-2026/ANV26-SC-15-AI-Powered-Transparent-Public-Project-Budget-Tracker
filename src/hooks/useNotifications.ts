import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { AppNotification } from '../types/notification';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api/notificationService';

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
}

export function useNotifications(limitCount = 30): UseNotificationsResult {
  const { userProfile } = useAuth();
  const userId = userProfile?.uid || '';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    const unsubscribe = subscribeToUserNotifications(
      userId,
      (updatedList) => {
        if (isMounted) {
          setNotifications(updatedList);
          setLoading(false);
          setError(null);
        }
      },
      limitCount
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId, limitCount]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      try {
        await markNotificationAsRead(userId, notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || nowIso }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [userId]);

  const removeNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      try {
        await deleteNotification(userId, notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch (err) {
        console.error('Failed to remove notification:', err);
      }
    },
    [userId]
  );

  return {
    notifications,
    unreadCount,
    loading: userId ? loading : false,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}

export default useNotifications;
