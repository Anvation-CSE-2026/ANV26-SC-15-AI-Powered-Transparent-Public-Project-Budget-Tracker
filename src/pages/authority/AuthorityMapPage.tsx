import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuthorityMapData } from '../../api/mapService';
import type {
  PublicMapProject,
  AuthorityMapComplaint,
  MapFilters,
  UserLocation,
} from '../../types/map';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  filterMapProjects,
  filterMapComplaints,
  isValidCoordinate,
  formatDistance,
} from '../../utils/mapUtils';
import { MapContainerWrapper } from '../../components/map/MapContainerWrapper';
import { ProjectMarker } from '../../components/map/ProjectMarker';
import { ComplaintMarker } from '../../components/map/ComplaintMarker';
import { UserLocationMarker } from '../../components/map/UserLocationMarker';
import { MapLegend } from '../../components/map/MapLegend';
import { MapFiltersBar } from '../../components/map/MapFiltersBar';
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FolderGit2,
  Clock,
  Plus,
  Maximize2,
  Columns,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AuthorityMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<PublicMapProject[]>([]);
  const [complaints, setComplaints] = useState<AuthorityMapComplaint[]>([]);

  // User Location
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  // Map viewport center
  const initialLat = searchParams.get('focusLat') ? parseFloat(searchParams.get('focusLat')!) : undefined;
  const initialLng = searchParams.get('focusLng') ? parseFloat(searchParams.get('focusLng')!) : undefined;

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    isValidCoordinate(initialLat, initialLng)
      ? [initialLat!, initialLng!]
      : DEFAULT_MAP_CENTER
  );
  const [mapZoom, setMapZoom] = useState<number>(
    isValidCoordinate(initialLat, initialLng) ? 15 : DEFAULT_MAP_ZOOM
  );

  const [viewMode, setViewMode] = useState<'split' | 'full'>('split');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // SLA quick filter: 'all' | 'breached' | 'approaching' | 'emergency'
  const [slaFilter, setSlaFilter] = useState<'all' | 'breached' | 'approaching' | 'emergency'>('all');

  // Filter State
  const [filters, setFilters] = useState<MapFilters>({
    itemType: 'all',
    searchQuery: '',
    projectStatus: 'all',
    complaintPriority: 'all',
    complaintStatus: 'all',
    department: 'all',
    ward: 'all',
    radiusKm: 5,
    onlyNearby: false,
  });

  useEffect(() => {
    getAuthorityMapData()
      .then((data) => {
        startTransition(() => {
          setProjects(data.projects);
          setComplaints(data.complaints);
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load spatial authority data';
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [startTransition]);

  const refreshMapData = async (loc?: UserLocation) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuthorityMapData(loc);
      startTransition(() => {
        setProjects(data.projects);
        setComplaints(data.complaints);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load spatial authority data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc: UserLocation = {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setUserLocation(userLoc);
        setMapCenter([userLoc.latitude, userLoc.longitude]);
        setMapZoom(14);
        setIsLocating(false);
        refreshMapData(userLoc);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Base filtered items
  let filteredProjects =
    filters.itemType === 'complaints'
      ? []
      : filterMapProjects(projects, filters, userLocation);

  let filteredComplaints =
    filters.itemType === 'projects'
      ? []
      : filterMapComplaints(complaints, filters, userLocation);

  // Apply Authority SLA / Emergency Quick Toggle
  if (slaFilter === 'emergency') {
    filteredComplaints = filteredComplaints.filter((c) => c.priority === 'emergency');
    filteredProjects = [];
  } else if (slaFilter === 'breached') {
    filteredComplaints = filteredComplaints.filter((c) => c.sla?.status === 'breached');
    filteredProjects = [];
  } else if (slaFilter === 'approaching') {
    filteredComplaints = filteredComplaints.filter((c) => c.sla?.status === 'approaching');
    filteredProjects = [];
  }

  const availableWards = Array.from(
    new Set(
      [
        ...projects.map((p) => p.location.ward),
        ...complaints.map((c) => c.location.ward),
      ].filter((w): w is string => Boolean(w))
    )
  ).sort();

  const availableDepartments = Array.from(
    new Set([
      ...projects.map((p) => p.department),
      ...complaints.map((c) => c.departmentName || ''),
    ].filter(Boolean))
  ).sort();

  const handleItemClick = (lat: number, lng: number, id: string) => {
    setSelectedItemId(id);
    setMapCenter([lat, lng]);
    setMapZoom(16);
  };

  // Critical operational counters
  const emergencyCount = complaints.filter((c) => c.priority === 'emergency').length;
  const breachedCount = complaints.filter((c) => c.sla?.status === 'breached').length;
  const approachingCount = complaints.filter((c) => c.sla?.status === 'approaching').length;
  const activeProjectsCount = projects.filter((p) => p.status === 'Ongoing' || p.status === 'Delayed').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Authority Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl shadow-lg border border-slate-800">
        <div>
          <button
            onClick={() => navigate('/dashboard/project-manager')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to PM Command Center</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-heading">
              Municipal GIS Spatial Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
              Authority GIS
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-ward worksite tracking, SLA breach geo-hotspots, and contractor dispatch oversight
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/project-manager/projects/new')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="bg-blue-600 hover:bg-blue-500 text-white border-transparent text-xs"
          >
            Sanction Works
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMapData(userLocation)}
            isLoading={loading}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 text-xs"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Authority Critical Action Strip / SLA Quick Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSlaFilter(slaFilter === 'all' ? 'all' : 'all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            slaFilter === 'all'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Active Worksites</span>
            <FolderGit2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">{activeProjectsCount} Projects</p>
        </button>

        <button
          onClick={() => setSlaFilter(slaFilter === 'emergency' ? 'all' : 'emergency')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            slaFilter === 'emergency'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-red-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-600">Emergency Incidents</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-red-600 mt-1">{emergencyCount} Immediate</p>
        </button>

        <button
          onClick={() => setSlaFilter(slaFilter === 'breached' ? 'all' : 'breached')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            slaFilter === 'breached'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600">SLA Overdue</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-rose-700 mt-1">{breachedCount} Breached</p>
        </button>

        <button
          onClick={() => setSlaFilter(slaFilter === 'approaching' ? 'all' : 'approaching')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            slaFilter === 'approaching'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600">SLA At Risk (&lt;24h)</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-amber-700 mt-1">{approachingCount} Pending</p>
        </button>
      </div>

      {/* 3. Multi-Dimension Filters Bar */}
      <MapFiltersBar
        filters={filters}
        onChange={setFilters}
        userLocation={userLocation}
        onRequestLocation={handleRequestLocation}
        isLocating={isLocating}
        totalProjects={projects.length}
        totalComplaints={complaints.length}
        availableDepartments={availableDepartments}
        availableWards={availableWards}
        isAuthority={true}
      />

      {/* 4. Main Spatial Canvas */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Map */}
        <div
          className={`${
            viewMode === 'split' ? 'lg:col-span-8' : 'lg:col-span-12'
          } relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 min-h-[520px] lg:min-h-[640px]`}
        >
          {loading && !projects.length && !complaints.length ? (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <Layers className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-800">Loading Municipal GIS Spatial Layers...</p>
              <p className="text-xs text-slate-500 mt-1">
                Aggregating authority worksites and SLA tracking records
              </p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="text-sm font-bold text-slate-900">{error}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => refreshMapData(userLocation)}
                className="mt-3 text-xs"
              >
                Retry
              </Button>
            </div>
          ) : null}

          {/* View Mode Toggle Overlay */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'split' ? 'full' : 'split')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 text-xs font-semibold text-slate-700 shadow-md hover:bg-white transition-colors cursor-pointer"
            >
              {viewMode === 'split' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Full Map</span>
                </>
              ) : (
                <>
                  <Columns className="w-3.5 h-3.5 text-blue-600" />
                  <span>Split View</span>
                </>
              )}
            </button>
          </div>

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 max-w-[240px]">
            <MapLegend />
          </div>

          {/* React Leaflet Map */}
          <MapContainerWrapper
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full min-h-[520px] lg:min-h-[640px]"
          >
            {userLocation && <UserLocationMarker location={userLocation} />}

            {filteredProjects.map((p) => (
              <ProjectMarker key={`pm-proj-${p.id}`} project={p} userRole="project_manager" />
            ))}

            {filteredComplaints.map((c) => (
              <ComplaintMarker key={`pm-cmp-${c.id}`} complaint={c} userRole="project_manager" />
            ))}
          </MapContainerWrapper>
        </div>

        {/* Right Column: Split Explorer List */}
        {viewMode === 'split' && (
          <div className="lg:col-span-4 space-y-3 flex flex-col h-[640px]">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Municipal Geo Registry ({filteredProjects.length + filteredComplaints.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click to inspect live coordinates and SLA state
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredProjects.length} P &bull; {filteredComplaints.length} I
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredProjects.length === 0 && filteredComplaints.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No geo-assets found</p>
                  <p className="text-[11px] text-slate-400">
                    Adjust active authority filters or reset search query.
                  </p>
                </div>
              ) : (
                <>
                  {/* Projects List */}
                  {filteredProjects.map((p) => {
                    const isSelected = selectedItemId === p.id;
                    return (
                      <div
                        key={`pm-list-p-${p.id}`}
                        onClick={() =>
                          handleItemClick(
                            p.location.latitude,
                            p.location.longitude,
                            p.id
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-xs space-y-1.5 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {p.projectNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700">
                            {p.status} &bull; {p.progress}%
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span className="truncate max-w-[170px]">{p.department}</span>
                          <span className="font-semibold text-slate-700">₹{p.approvedBudget} Cr</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-400">
                            {p.location.ward || 'Ward Central'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/project-manager/projects/${p.id}`);
                            }}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Manage Dossier &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Complaints List */}
                  {filteredComplaints.map((c) => {
                    const isSelected = selectedItemId === c.id;
                    const isOverdue = c.sla?.status === 'breached';

                    return (
                      <div
                        key={`pm-list-c-${c.id}`}
                        onClick={() =>
                          handleItemClick(
                            c.location.latitude,
                            c.location.longitude,
                            c.id
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-xs space-y-1.5 ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-100 shadow-sm'
                            : isOverdue
                            ? 'border-red-300 bg-red-50/20'
                            : 'border-slate-200 hover:border-amber-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                            {c.complaintNumber}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                c.priority === 'emergency'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.priority}
                            </span>
                            {c.sla && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  c.sla.status === 'breached'
                                    ? 'bg-red-600 text-white'
                                    : c.sla.status === 'approaching'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {c.sla.status === 'breached' ? 'Overdue' : 'SLA OK'}
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 line-clamp-1">{c.title}</h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span className="truncate max-w-[170px]">
                            {c.departmentName || c.category} &bull; {c.location.ward || 'Central'}
                          </span>
                          {c.distanceKm !== undefined && (
                            <span className="text-blue-600 font-semibold text-[10px]">
                              {formatDistance(c.distanceKm)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-500">
                            Officer: {c.assignedOfficerName || 'Pending Assignment'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/project-manager/complaints/${c.id}`);
                            }}
                            className="text-amber-700 font-semibold hover:underline"
                          >
                            Assign / Act &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityMapPage;
