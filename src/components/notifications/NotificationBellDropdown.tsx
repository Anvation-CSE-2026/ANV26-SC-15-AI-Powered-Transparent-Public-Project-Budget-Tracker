import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertCircle,
  FolderGit2,
  HardHat,
  Vote,
  Lightbulb,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/notificationUtils';
import type { AppNotification, NotificationCategory, NotificationPriority } from '../../types/notification';

export interface NotificationBellDropdownProps {
  className?: string;
}

function getCategoryIcon(category: NotificationCategory): React.ReactNode {
  switch (category) {
    case 'complaint':
      return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
    case 'project':
      return <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />;
    case 'contractor':
      return <HardHat className="w-3.5 h-3.5 text-amber-600" />;
    case 'poll':
      return <Vote className="w-3.5 h-3.5 text-emerald-600" />;
    case 'suggestion':
      return <Lightbulb className="w-3.5 h-3.5 text-purple-600" />;
    case 'system':
    default:
      return <Info className="w-3.5 h-3.5 text-slate-600" />;
  }
}

function getPriorityBadgeClass(priority: NotificationPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'high':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'normal':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

export const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { role } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(10);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const viewAllUrl =
    role === 'contractor'
      ? '/dashboard/contractor/notifications'
      : role === 'project_manager'
      ? '/dashboard/project-manager/notifications'
      : '/dashboard/citizen/notifications';

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate(viewAllUrl);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Body / List */}
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100">
            {recentNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  We will alert you when projects or issues update.
                </p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50/80 ${
                    !notif.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(
                          notif.priority
                        )}`}
                      >
                        {notif.priority}
                      </span>
                      {notif.entityNumber && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {notif.entityNumber}
                        </span>
                      )}
                      {!notif.isRead && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(viewAllUrl);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBellDropdown;
