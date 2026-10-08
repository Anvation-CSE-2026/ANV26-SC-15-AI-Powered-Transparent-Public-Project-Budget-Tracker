import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Sparkles, Calendar, Search } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

export interface CitizenHeaderProps {
  onSearch?: (query: string) => void;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({ onSearch }) => {
  const { userProfile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const citizenName = userProfile?.displayName || userProfile?.username || 'Citizen';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Smart City Citizen Portal</span>
            </span>
            <Badge variant="info" size="sm">Verified Citizen</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            {getGreeting()}, {citizenName}!
          </h1>

          <p className="mt-2 text-sm text-slate-300 font-sans leading-relaxed">
            “Stay informed. Report issues. Make your city better.”
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{todayFormatted}</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-medium">Municipal Services Online</span>
          </div>
        </div>

        {/* Search Bar for Dashboard Entry */}
        <div className="w-full md:w-80">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search projects, complaints, or areas..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-white/10 backdrop-blur-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
