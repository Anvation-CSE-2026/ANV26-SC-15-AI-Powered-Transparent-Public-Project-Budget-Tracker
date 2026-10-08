import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  MapPin,
  AlertCircle,
  MoreHorizontal,
  Vote,
  Lightbulb,
  Megaphone,
  Bell,
  Sparkles,
  User,
  Settings,
  X,
} from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { label: 'Home', path: '/dashboard/citizen', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Complaints', path: '/dashboard/citizen/complaints', icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'Projects', path: '/dashboard/citizen/projects', icon: <FolderGit2 className="w-5 h-5" /> },
    { label: 'Map', path: '/dashboard/citizen/map', icon: <MapPin className="w-5 h-5" /> },
  ];

  const moreItems = [
    { label: 'Voting & Polls', path: '/dashboard/citizen/voting', icon: <Vote className="w-4 h-4 text-indigo-500" /> },
    { label: 'Suggestions', path: '/dashboard/citizen/suggestions', icon: <Lightbulb className="w-4 h-4 text-amber-500" /> },
    { label: 'Announcements', path: '/dashboard/citizen/announcements', icon: <Megaphone className="w-4 h-4 text-blue-500" /> },
    { label: 'Notifications', path: '/dashboard/citizen/notifications', icon: <Bell className="w-4 h-4 text-rose-500" /> },
    { label: 'Civic AI Assistant', path: '/dashboard/citizen/ai', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { label: 'Citizen Profile', path: '/dashboard/citizen/profile', icon: <User className="w-4 h-4 text-slate-600" /> },
    { label: 'Settings', path: '/dashboard/citizen/settings', icon: <Settings className="w-4 h-4 text-slate-600" /> },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* "More" Drawer / Modal for Mobile */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Additional Civic Modules
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3">
              {moreItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    location.pathname === item.path
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                      : 'border-slate-200/80 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="p-1.5 bg-white rounded-lg shadow-2xs">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => handleNavigate(tab.path)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}

          {/* "More" Trigger */}
          <button
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isMoreOpen ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isMoreOpen ? 'bg-blue-50 text-blue-600' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
