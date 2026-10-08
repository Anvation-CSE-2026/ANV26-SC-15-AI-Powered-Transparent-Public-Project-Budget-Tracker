import React from 'react';
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
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info';
  section?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  onClose,
}) => {
  const citizenItems: NavItem[] = [
    { id: 'dashboard', label: 'Citizen Portal', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'Public Projects', icon: <FolderGit2 className="w-4 h-4" />, badge: 'Live' },
    { id: 'map', label: 'Interactive Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'complaints', label: 'Citizen Complaints', icon: <AlertCircle className="w-4 h-4" />, badge: '7' },
    { id: 'voting', label: 'Public Voting / Polls', icon: <Vote className="w-4 h-4" /> },
    { id: 'suggestions', label: 'Civic Suggestions', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'ai-assistant', label: 'Civic AI Assistant', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const authorityItems: NavItem[] = [
    { id: 'authority-center', label: 'PM Command Center', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'contractor-updates', label: 'Contractor Workflows', icon: <HardHat className="w-4 h-4" /> },
    { id: 'risk-engine', label: 'Risk Engine', icon: <ShieldAlert className="w-4 h-4" />, badge: 'Anomaly' },
    { id: 'audit-logs', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
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
          {/* Main Citizen Section */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Citizen Transparency
            </p>
            <nav className="space-y-1">
              {citizenItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
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
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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

          {/* Authority / Management Section */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Authority & Management
            </p>
            <nav className="space-y-1">
              {authorityItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
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
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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
        </div>

        {/* Footer / System Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="font-medium">System Settings</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">CivicSight v1.0</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
