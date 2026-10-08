import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Search,
  Trash2,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  FolderGit2,
  HardHat,
  Vote,
  Lightbulb,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card, CardContent } from '../common/Card';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/notificationUtils';
import type { AppNotification, NotificationCategory, NotificationPriority } from '../../types/notification';

export interface NotificationCenterProps {
  role: 'citizen' | 'project_manager' | 'contractor';
  title: string;
  subtitle: string;
  dashboardPath: string;
}

type FilterTab = 'all' | 'unread' | 'complaint' | 'project' | 'contractor' | 'civic' | 'system';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  role,
  title,
  subtitle,
  dashboardPath,
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications(100);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'unread' && item.isRead) return false;
      if (activeTab === 'complaint' && item.category !== 'complaint') return false;
      if (activeTab === 'project' && item.category !== 'project') return false;
      if (activeTab === 'contractor' && item.category !== 'contractor') return false;
      if (activeTab === 'civic' && item.category !== 'poll' && item.category !== 'suggestion') return false;
      if (activeTab === 'system' && item.category !== 'system') return false;

      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMsg = item.message.toLowerCase().includes(q);
        const matchesEntity = item.entityNumber ? item.entityNumber.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesMsg && !matchesEntity) return false;
      }

      return true;
    });
  }, [notifications, activeTab, priorityFilter, searchQuery]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    showToast('All notifications marked as read.');
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeNotification(id);
    showToast('Notification removed.');
  };

  const handleToggleRead = async (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    if (!notif.isRead) {
      await markAsRead(notif.id);
      showToast('Notification marked as read.');
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'complaint':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-blue-600" />;
      case 'contractor':
        return <HardHat className="w-4 h-4 text-amber-600" />;
      case 'poll':
        return <Vote className="w-4 h-4 text-emerald-600" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-purple-600" />;
      case 'system':
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">High</span>;
      case 'low':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
      case 'normal':
      default:
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Normal</span>;
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      complaint: notifications.filter((n) => n.category === 'complaint').length,
      project: notifications.filter((n) => n.category === 'project').length,
      contractor: notifications.filter((n) => n.category === 'contractor').length,
      civic: notifications.filter((n) => n.category === 'poll' || n.category === 'suggestion').length,
      system: notifications.filter((n) => n.category === 'system').length,
    };
  }, [notifications]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate(dashboardPath)}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading">{title}</h1>
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer"
              onClick={handleMarkAllRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({tabCounts.all})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({tabCounts.unread})
            </button>
            <button
              onClick={() => setActiveTab('complaint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'complaint'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Complaints ({tabCounts.complaint})
            </button>
            <button
              onClick={() => setActiveTab('project')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'project'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Projects ({tabCounts.project})
            </button>
            {role !== 'citizen' && (
              <button
                onClick={() => setActiveTab('contractor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'contractor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Submissions ({tabCounts.contractor})
              </button>
            )}
            {role === 'citizen' && (
              <button
                onClick={() => setActiveTab('civic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'civic'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Polls &amp; Suggestions ({tabCounts.civic})
              </button>
            )}
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              System ({tabCounts.system})
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2">
            {/* Priority Selector */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-60">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content Feed */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-600">Loading notification stream...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || priorityFilter !== 'all' || activeTab !== 'all'
                  ? 'No notifications match your current filter criteria. Try clearing filters or searching for something else.'
                  : 'You are all caught up! When updates or alerts arrive, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-start gap-4 hover:bg-slate-50/80 ${
                    !notif.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Category Icon */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      {getPriorityBadge(notif.priority)}
                      {notif.entityNumber && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {notif.entityNumber}
                        </span>
                      )}
                      {!notif.isRead && (
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                      {notif.actionUrl && (
                        <span className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                          <ExternalLink className="w-3 h-3" />
                          View Resource
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleToggleRead(e, notif)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
