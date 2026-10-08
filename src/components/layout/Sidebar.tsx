import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  AlertCircle,
  MapPin,
  Vote,
  Lightbulb,
  Sparkles,
  BarChart3,
  HardHat,
  ShieldAlert,
  History,
  Settings,
  ChevronRight,
  Bell,
  Megaphone,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info';
}

export interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const citizenItems: NavItem[] = [
    { id: 'dashboard', label: 'Citizen Dashboard', path: '/dashboard/citizen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'city-analytics', label: 'City Analytics & Data', path: '/dashboard/citizen/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'complaints', label: 'Complaints & Issues', path: '/dashboard/citizen/complaints', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'projects', label: 'Public Projects', path: '/dashboard/citizen/projects', icon: <FolderGit2 className="w-4 h-4" />, badge: 'Live' },
    { id: 'map', label: 'Interactive Map', path: '/dashboard/citizen/map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'voting', label: 'Public Voting & Polls', path: '/dashboard/citizen/voting', icon: <Vote className="w-4 h-4" /> },
    { id: 'suggestions', label: 'Civic Suggestions', path: '/dashboard/citizen/suggestions', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', path: '/dashboard/citizen/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', path: '/dashboard/citizen/notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'ai-assistant', label: 'Civic AI Assistant', path: '/dashboard/citizen/ai', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const authorityItems: NavItem[] = [
    { id: 'authority-center', label: 'PM Command Center', path: '/dashboard/project-manager', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'authority-ai', label: 'AI Intelligence Assistant', path: '/dashboard/project-manager/ai', icon: <Sparkles className="w-4 h-4" />, badge: 'Gemini' },
    { id: 'risk-engine', label: 'Risk Engine & Analytics', path: '/dashboard/project-manager/risk-engine', icon: <ShieldAlert className="w-4 h-4" />, badge: 'Anomaly' },
    { id: 'projects-management', label: 'Projects Management', path: '/dashboard/project-manager/projects', icon: <FolderGit2 className="w-4 h-4" />, badge: 'Active' },
    { id: 'complaints-queue', label: 'Complaints Queue', path: '/dashboard/project-manager/complaints', icon: <AlertCircle className="w-4 h-4" />, badge: 'SLA' },
    { id: 'suggestions-queue', label: 'Suggestions Queue', path: '/dashboard/project-manager/suggestions', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'voting-management', label: 'Civic Polls & Voting', path: '/dashboard/project-manager/voting', icon: <Vote className="w-4 h-4" /> },
    { id: 'contractor-submissions', label: 'Contractor Submissions', path: '/dashboard/project-manager/submissions', icon: <HardHat className="w-4 h-4" />, badge: 'Queue' },
    { id: 'gis-map', label: 'GIS Location Map', path: '/dashboard/project-manager/map', icon: <MapPin className="w-4 h-4" />, badge: 'GIS' },
    { id: 'authority-notifications', label: 'Alerts & Notifications', path: '/dashboard/project-manager/notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'audit-logs', label: 'Audit Trail', path: '/design-system', icon: <History className="w-4 h-4" /> },
  ];

  const contractorItems: NavItem[] = [
    { id: 'contractor-dashboard', label: 'Contractor Portal', path: '/dashboard/contractor', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'assigned-projects', label: 'Assigned Projects', path: '/dashboard/contractor/projects', icon: <FolderGit2 className="w-4 h-4" />, badge: 'Charter' },
    { id: 'contractor-submissions', label: 'Work Submissions', path: '/dashboard/contractor/submissions', icon: <HardHat className="w-4 h-4" />, badge: 'Audit' },
    { id: 'contractor-notifications', label: 'Worksite Notifications', path: '/dashboard/contractor/notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* 1. If Contractor: Show only Contractor Operations */}
          {role === 'contractor' && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">
                Contractor Operations
              </p>
              <nav className="space-y-1">
                {contractorItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-amber-700 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* 2. Main Citizen Section (Visible to Citizens and Project Managers) */}
          {role !== 'contractor' && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Citizen Transparency
              </p>
              <nav className="space-y-1">
                {citizenItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* 3. Authority / Management Section (visible for project managers) */}
          {role === 'project_manager' && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Authority &amp; Management
              </p>
              <nav className="space-y-1">
                {authorityItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer Navigation (Profile & Settings) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
          <button
            onClick={() => handleNavigate(role === 'contractor' ? '/dashboard/contractor/profile' : '/dashboard/citizen/profile')}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              location.pathname === (role === 'contractor' ? '/dashboard/contractor/profile' : '/dashboard/citizen/profile')
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {role === 'contractor' ? <HardHat className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4" />}
              <span>{role === 'contractor' ? 'Contractor Profile' : 'Citizen Profile'}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNavigate(role === 'contractor' ? '/dashboard/contractor/settings' : '/dashboard/citizen/settings')}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              location.pathname === (role === 'contractor' ? '/dashboard/contractor/settings' : '/dashboard/citizen/settings')
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Portal Settings</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-mono">CivicSight v1.0</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Citizen Secure
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
