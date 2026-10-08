import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';

export interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  activeRole?: string;
  onRoleSwitch?: (role: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  activeRole = 'Citizen',
  onRoleSwitch,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeRole={activeRole}
        onRoleSwitch={onRoleSwitch}
      />

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content View */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-16 lg:pb-8">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
            {children}
          </div>

          {/* Civic Footer */}
          <footer className="mt-auto border-t border-slate-200/80 bg-white/60 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">CivicSight</span>
                <span>—</span>
                <span>“See the Project. Understand the Data. Make Your Voice Count.”</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">Public Transparency Platform</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-slate-400">Government Technology Initiative</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
};
