import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import {
  Calendar,
  RefreshCw,
  Plus,
  Filter,
  User,
  Settings,
  Bell,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { INITIAL_DEPARTMENTS } from '../../../data/departmentsData';

export interface AuthorityHeaderProps {
  selectedDepartment: string;
  onSelectDepartment: (deptId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  attentionCount?: number;
}

export const AuthorityHeader: React.FC<AuthorityHeaderProps> = ({
  selectedDepartment,
  onSelectDepartment,
  onRefresh,
  isLoading,
  attentionCount = 0,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const activeDepartment = INITIAL_DEPARTMENTS.find((d) => d.id === selectedDepartment);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
              High Authority Command Center
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {formattedDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            Welcome back, {userProfile?.displayName || userProfile?.username || 'Project Manager'}!
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed">
            Monitor civic projects, citizen issues, and public participation across municipal jurisdictions.
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-slate-300">
            <button
              onClick={() => navigate('/dashboard/citizen/profile')}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>{userProfile?.email}</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => navigate('/dashboard/citizen/settings')}
              className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>
            {attentionCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Bell className="w-3.5 h-3.5" />
                  <span>{attentionCount} Actionable Items</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls & Department Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs justify-center"
          >
            Refresh Metrics
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/project-manager/projects/new')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 text-white text-xs justify-center"
          >
            Sanction Project
          </Button>
        </div>
      </div>

      {/* Global Dashboard Department Filter Toolbar */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700 whitespace-nowrap">Filter Jurisdiction:</span>
          <select
            value={selectedDepartment}
            onChange={(e) => onSelectDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
          >
            <option value="all">All Municipal Departments (City-Wide)</option>
            {INITIAL_DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {selectedDepartment !== 'all' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">
              Active Filter:{' '}
              <strong className="text-blue-700">{activeDepartment?.name || selectedDepartment}</strong>
            </span>
            <button
              onClick={() => onSelectDepartment('all')}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              Clear Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
