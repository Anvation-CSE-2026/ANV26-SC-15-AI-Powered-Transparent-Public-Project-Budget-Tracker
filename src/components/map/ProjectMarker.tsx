import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { PublicMapProject } from '../../types/map';
import { createProjectMarkerIcon } from './mapIcons';
import { formatDistance } from '../../utils/mapUtils';
import { Building2, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

interface ProjectMarkerProps {
  project: PublicMapProject;
  userRole?: 'citizen' | 'project_manager' | 'authority';
}

export const ProjectMarker: React.FC<ProjectMarkerProps> = ({
  project,
  userRole = 'citizen',
}) => {
  const navigate = useNavigate();
  const icon = createProjectMarkerIcon(project.status);

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'delayed') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'at risk' || s === 'at_risk') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (s === 'ongoing') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const detailUrl =
    userRole === 'project_manager' || userRole === 'authority'
      ? `/dashboard/project-manager/projects/${project.id}`
      : `/dashboard/citizen/projects/${project.id}`;

  return (
    <Marker
      position={[project.location.latitude, project.location.longitude]}
      icon={icon}
    >
      <Popup className="civic-map-popup" minWidth={260} maxWidth={320}>
        <div className="p-1 space-y-2.5 text-slate-800">
          {/* Header */}
          <div className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {project.projectNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                  project.status
                )}`}
              >
                {project.status}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
              {project.name}
            </h4>
          </div>

          {/* Department & Ward */}
          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{project.department}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Target: {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN')}</span>
            </div>
            {project.distanceKm !== undefined && (
              <div className="text-[10px] font-semibold text-blue-600">
                📍 {formatDistance(project.distanceKm)}
              </div>
            )}
          </div>

          {/* Progress & Budget */}
          <div className="p-2 bg-slate-50 rounded-lg space-y-1.5 border border-slate-100 text-[11px]">
            <div className="flex justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                Physical Progress
              </span>
              <span className="font-bold text-slate-900">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
              <span>Budget: ₹{project.approvedBudget} Cr</span>
              <span
                className={`font-semibold ${
                  project.budgetDeviation > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {project.budgetDeviation > 0 ? `+${project.budgetDeviation}%` : 'On Budget'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate(detailUrl)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>View Project Dossier</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default ProjectMarker;
