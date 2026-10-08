import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Search, Menu, X, ShieldCheck, LogOut, LogIn } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_DISPLAY_NAMES } from '../../routes/routeConfig';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';

export interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { isAuthenticated, userProfile, role, logout } = useAuth();

  const roleName = role ? ROLE_DISPLAY_NAMES[role] : 'Citizen';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 font-heading">
                  Civic<span className="text-blue-600">Sight</span>
                </span>
                <span className="hidden sm:inline-block">
                  <Badge variant="info" size="sm">Smart City</Badge>
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-slate-500 leading-none">
                AI-Powered Transparent Public Project & Budget Tracker
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search projects, complaints, areas, or wards..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions, Notifications, Role Badge & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown */}
          <NotificationBellDropdown />

          {/* User Profile or Sign In Link */}
          {isAuthenticated && userProfile ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {userProfile.displayName || userProfile.username}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase">
                  {roleName}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{roleName}</span>
              </div>

              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
