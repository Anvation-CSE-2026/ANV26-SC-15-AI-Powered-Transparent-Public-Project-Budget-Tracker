import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCitizenMapData } from '../../api/mapService';
import type { PublicMapProject, PublicMapComplaint, MapFilters, UserLocation } from '../../types/map';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  filterMapProjects,
  filterMapComplaints,
  formatDistance,
  isValidCoordinate,
} from '../../utils/mapUtils';
import { MapContainerWrapper } from '../../components/map/MapContainerWrapper';
import { ProjectMarker } from '../../components/map/ProjectMarker';
import { ComplaintMarker } from '../../components/map/ComplaintMarker';
import { UserLocationMarker } from '../../components/map/UserLocationMarker';
import { MapLegend } from '../../components/map/MapLegend';
import { MapFiltersBar } from '../../components/map/MapFiltersBar';
import {
  ArrowLeft,
  Compass,
  AlertTriangle,
  FolderGit2,
  Building2,
  Maximize2,
  Columns,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const CitizenMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<PublicMapProject[]>([]);
  const [complaints, setComplaints] = useState<PublicMapComplaint[]>([]);

  // User GPS Geolocation State (explicit consent only, never auto-tracked)
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  // View mode: 'split' (map + sidebar items) vs 'full' (map only)
  const [viewMode, setViewMode] = useState<'split' | 'full'>('split');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
    getCitizenMapData()
      .then((data) => {
        startTransition(() => {
          setProjects(data.projects);
          setComplaints(data.complaints);
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load GIS spatial map data';
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
      const data = await getCitizenMapData(loc);
      startTransition(() => {
        setProjects(data.projects);
        setComplaints(data.complaints);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load GIS spatial map data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Request user GPS location handler
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

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
        // Refresh items with updated distances
        refreshMapData(userLoc);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Location permission denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Filter items
  const filteredProjects =
    filters.itemType === 'complaints'
      ? []
      : filterMapProjects(projects, filters, userLocation);

  const filteredComplaints =
    filters.itemType === 'projects'
      ? []
      : filterMapComplaints(complaints, filters, userLocation);

  // Unique wards and departments for filter drop-downs
  const availableWards = Array.from(
    new Set(
      [
        ...projects.map((p) => p.location.ward),
        ...complaints.map((c) => c.location.ward),
      ].filter((w): w is string => Boolean(w))
    )
  ).sort();

  const availableDepartments = Array.from(
    new Set(projects.map((p) => p.department))
  ).sort();

  // Item click handler to center map
  const handleItemClick = (lat: number, lng: number, id: string) => {
    setSelectedItemId(id);
    setMapCenter([lat, lng]);
    setMapZoom(16);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">
            Interactive City GIS Map
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time geographic visualization of public infrastructure projects and community grievances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-sky-900/60 border border-sky-400/30 px-3 py-1.5 rounded-xl text-xs text-sky-200">
            <Compass className="w-4 h-4 text-sky-300 animate-spin-slow" />
            <span>OpenStreetMap Spatial Engine</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMapData(userLocation)}
            isLoading={loading}
            className="bg-sky-950/80 text-sky-200 border-sky-400/40 hover:bg-sky-900 text-xs"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Geolocation Notice Banner */}
      {locationError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError} You can still pan and zoom the map manually.</span>
          </div>
          <button
            onClick={() => setLocationError(null)}
            className="text-amber-600 hover:text-amber-800 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Multi-Dimension Filters Bar */}
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
        isAuthority={false}
      />

      {/* 3. Main Workspace (Map + Split Sidebar) */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Map Canvas */}
        <div
          className={`${
            viewMode === 'split' ? 'lg:col-span-8' : 'lg:col-span-12'
          } relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 min-h-[520px] lg:min-h-[640px]`}
        >
          {loading && !projects.length && !complaints.length ? (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <Compass className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-800">Loading Municipal GIS Layers...</p>
              <p className="text-xs text-slate-500 mt-1">
                Plotting worksites and civic reports on OpenStreetMap tiles
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

          {/* Map Controls Overlay (Top Right: View Toggle) */}
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

          {/* Floating Map Legend Overlay (Bottom Left) */}
          <div className="absolute bottom-3 left-3 z-10 max-w-[240px]">
            <MapLegend />
          </div>

          {/* React Leaflet Map Container */}
          <MapContainerWrapper
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full min-h-[520px] lg:min-h-[640px]"
          >
            {/* User GPS location marker */}
            {userLocation && <UserLocationMarker location={userLocation} />}

            {/* Public Projects markers */}
            {filteredProjects.map((p) => (
              <ProjectMarker key={`proj-${p.id}`} project={p} userRole="citizen" />
            ))}

            {/* Public Complaints markers */}
            {filteredComplaints.map((c) => (
              <ComplaintMarker key={`cmp-${c.id}`} complaint={c} userRole="citizen" />
            ))}
          </MapContainerWrapper>
        </div>

        {/* Right Column: Split Explorer List Panel (Visible in Split Mode) */}
        {viewMode === 'split' && (
          <div className="lg:col-span-4 space-y-3 flex flex-col h-[640px]">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Visible On Map ({filteredProjects.length + filteredComplaints.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click any card to center and inspect on map
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredProjects.length} P &bull; {filteredComplaints.length} I
              </span>
            </div>

            {/* Scrollable list of items */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredProjects.length === 0 && filteredComplaints.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
                  <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No items match current filter</p>
                  <p className="text-[11px] text-slate-400">
                    Try adjusting search terms, radius, or priority options.
                  </p>
                </div>
              ) : (
                <>
                  {/* Projects Section */}
                  {filteredProjects.map((project) => {
                    const isSelected = selectedItemId === project.id;
                    return (
                      <div
                        key={`list-proj-${project.id}`}
                        onClick={() =>
                          handleItemClick(
                            project.location.latitude,
                            project.location.longitude,
                            project.id
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-xs space-y-1.5 ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {project.projectNumber}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            {project.status} &bull; {project.progress}%
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 line-clamp-1">{project.name}</h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1 truncate max-w-[170px]">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{project.department}</span>
                          </span>
                          {project.distanceKm !== undefined && (
                            <span className="text-blue-600 font-semibold text-[10px]">
                              {formatDistance(project.distanceKm)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-400">Budget: ₹{project.approvedBudget} Cr</span>
                          <span className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                            Inspect &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Complaints Section */}
                  {filteredComplaints.map((complaint) => {
                    const isSelected = selectedItemId === complaint.id;
                    const isEmergency = complaint.priority === 'emergency';
                    const isResolved =
                      complaint.status === 'resolved' || complaint.status === 'closed';

                    return (
                      <div
                        key={`list-cmp-${complaint.id}`}
                        onClick={() =>
                          handleItemClick(
                            complaint.location.latitude,
                            complaint.location.longitude,
                            complaint.id
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-xs space-y-1.5 ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-100 shadow-sm'
                            : 'border-slate-200 hover:border-amber-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                            {complaint.complaintNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isEmergency
                                ? 'bg-red-100 text-red-800 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {complaint.priority}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 line-clamp-1">{complaint.title}</h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="truncate max-w-[170px]">
                            {complaint.category} &bull; {complaint.location.ward || 'Municipal Ward'}
                          </span>
                          {complaint.distanceKm !== undefined && (
                            <span className="text-blue-600 font-semibold text-[10px]">
                              {formatDistance(complaint.distanceKm)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-400 capitalize">
                            Status: {complaint.status.replace('_', ' ')}
                          </span>
                          <span className="text-amber-700 font-semibold flex items-center gap-0.5 hover:underline">
                            Inspect &rarr;
                          </span>
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

      {/* 4. Municipal Geo-Intelligence Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Public Works</p>
            <p className="text-base font-bold text-slate-900">{projects.length} Worksites</p>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Emergency Incidents</p>
            <p className="text-base font-bold text-red-600">
              {complaints.filter((c) => c.priority === 'emergency').length} Active
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Resolved Grievances</p>
            <p className="text-base font-bold text-emerald-600">
              {
                complaints.filter(
                  (c) => c.status === 'resolved' || c.status === 'closed'
                ).length
              }{' '}
              Verified
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Municipal Coverage</p>
            <p className="text-base font-bold text-indigo-900">
              {availableWards.length || 5} Wards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenMapPage;
