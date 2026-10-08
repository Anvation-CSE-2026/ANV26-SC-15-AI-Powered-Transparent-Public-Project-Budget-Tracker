import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { PublicMapComplaint, AuthorityMapComplaint } from '../../types/map';
import { createComplaintMarkerIcon } from './mapIcons';
import { formatDistance } from '../../utils/mapUtils';
import { AlertCircle, MapPin, Calendar, Clock, ArrowRight, Shield } from 'lucide-react';

interface ComplaintMarkerProps {
  complaint: PublicMapComplaint | AuthorityMapComplaint;
  userRole?: 'citizen' | 'project_manager' | 'authority';
}

export const ComplaintMarker: React.FC<ComplaintMarkerProps> = ({
  complaint,
  userRole = 'citizen',
}) => {
  const navigate = useNavigate();
  const icon = createComplaintMarkerIcon(complaint.priority, complaint.status);

  const isAuthority = userRole === 'project_manager' || userRole === 'authority';
  const authorityData = isAuthority ? (complaint as AuthorityMapComplaint) : null;

  const getPriorityBadgeClass = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'emergency') return 'bg-red-100 text-red-800 border-red-200';
    if (p === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (p === 'medium') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'resolved' || s === 'closed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'in_progress' || s === 'assigned') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'under_review') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const detailUrl = isAuthority
    ? `/dashboard/project-manager/complaints/${complaint.id}`
    : `/dashboard/citizen/complaints/${complaint.id}`;

  return (
    <Marker
      position={[complaint.location.latitude, complaint.location.longitude]}
      icon={icon}
    >
      <Popup className="civic-map-popup" minWidth={260} maxWidth={320}>
        <div className="p-1 space-y-2.5 text-slate-800">
          {/* Header */}
          <div className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {complaint.complaintNumber}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${getPriorityBadgeClass(
                    complaint.priority
                  )}`}
                >
                  {complaint.priority}
                </span>
                <span
                  className={`text-[10px] font-bold capitalize px-1.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                    complaint.status
                  )}`}
                >
                  {complaint.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
              {complaint.title}
            </h4>
          </div>

          {/* Details */}
          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700">{complaint.category}</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="truncate">
                {complaint.location.address}
                {complaint.location.ward ? ` (${complaint.location.ward})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Reported: {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            {complaint.distanceKm !== undefined && (
              <div className="text-[10px] font-semibold text-blue-600">
                📍 {formatDistance(complaint.distanceKm)}
              </div>
            )}
          </div>

          {/* Authority-only Operational Context */}
          {authorityData && (
            <div className="p-2 bg-slate-50 rounded-lg space-y-1 border border-slate-200 text-[10px]">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-500" />
                  Dept: {authorityData.departmentName || 'Unassigned'}
                </span>
              </div>
              {authorityData.sla && (
                <div className="flex items-center justify-between pt-0.5 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    SLA Deadline:
                  </span>
                  <span
                    className={`font-bold ${
                      authorityData.sla.status === 'breached'
                        ? 'text-red-600'
                        : authorityData.sla.status === 'approaching'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {authorityData.sla.status === 'breached'
                      ? 'Breached'
                      : `${authorityData.sla.hoursRemaining || 0}h remaining`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => navigate(detailUrl)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>View Grievance Status</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default ComplaintMarker;
