import React from 'react';
import type { MapFilters, UserLocation } from '../../types/map';
import { Search, Navigation, Filter, X, Crosshair } from 'lucide-react';
import { Button } from '../common/Button';

interface MapFiltersBarProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  userLocation?: UserLocation;
  onRequestLocation: () => void;
  isLocating: boolean;
  totalProjects: number;
  totalComplaints: number;
  availableDepartments?: string[];
  availableWards?: string[];
  isAuthority?: boolean;
}

export const MapFiltersBar: React.FC<MapFiltersBarProps> = ({
  filters,
  onChange,
  userLocation,
  onRequestLocation,
  isLocating,
  totalProjects,
  totalComplaints,
  availableDepartments = [],
  availableWards = [],
  isAuthority = false,
}) => {
  const handleTypeChange = (itemType: MapFilters['itemType']) => {
    onChange({ ...filters, itemType });
  };

  const handleNearbyToggle = () => {
    if (!userLocation) {
      // First prompt location, then toggle
      onRequestLocation();
    }
    onChange({
      ...filters,
      onlyNearby: !filters.onlyNearby,
      radiusKm: filters.radiusKm || 5,
    });
  };

  const handleRadiusSelect = (radiusKm: number) => {
    onChange({
      ...filters,
      onlyNearby: true,
      radiusKm,
    });
  };

  const handleReset = () => {
    onChange({
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
  };

  const hasActiveFilters =
    filters.itemType !== 'all' ||
    filters.searchQuery.trim() !== '' ||
    filters.projectStatus !== 'all' ||
    filters.complaintPriority !== 'all' ||
    filters.complaintStatus !== 'all' ||
    filters.department !== 'all' ||
    filters.ward !== 'all' ||
    filters.onlyNearby;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 space-y-3.5">
      {/* Row 1: Search, Item Type Tabs, and Location Action */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              isAuthority
                ? 'Search worksites, project IDs, complaint IDs, or municipal wards...'
                : 'Search public projects, complaints, or areas...'
            }
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Layer Type Segmented Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start lg:self-auto shrink-0">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filters.itemType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Layers ({totalProjects + totalComplaints})
          </button>
          <button
            onClick={() => handleTypeChange('projects')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.itemType === 'projects'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <span>Projects</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
              {totalProjects}
            </span>
          </button>
          <button
            onClick={() => handleTypeChange('complaints')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.itemType === 'complaints'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <span>Grievances</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              {totalComplaints}
            </span>
          </button>
        </div>

        {/* GPS Geolocation Button */}
        <div className="flex items-center gap-2">
          <Button
            variant={userLocation ? 'secondary' : 'outline'}
            size="sm"
            onClick={onRequestLocation}
            isLoading={isLocating}
            leftIcon={<Navigation className={`w-3.5 h-3.5 ${userLocation ? 'text-blue-600 fill-blue-600' : 'text-slate-500'}`} />}
            className="text-xs whitespace-nowrap"
          >
            {userLocation ? 'Location Active' : 'Use My Location'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-rose-600 hover:bg-rose-50"
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Secondary Multi-dimension Filters & Nearby Radius Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-slate-400" />
          Filter:
        </span>

        {/* Project Status Filter */}
        {(filters.itemType === 'all' || filters.itemType === 'projects') && (
          <select
            value={filters.projectStatus}
            onChange={(e) => onChange({ ...filters, projectStatus: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Project Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delayed">Delayed</option>
            <option value="At Risk">At Risk</option>
            <option value="Completed">Completed</option>
            <option value="Upcoming">Upcoming</option>
          </select>
        )}

        {/* Complaint Priority Filter */}
        {(filters.itemType === 'all' || filters.itemType === 'complaints') && (
          <select
            value={filters.complaintPriority}
            onChange={(e) => onChange({ ...filters, complaintPriority: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Issue Priorities</option>
            <option value="emergency">🔴 Emergency</option>
            <option value="high">🟠 High Priority</option>
            <option value="medium">🔷 Medium</option>
            <option value="low">Low</option>
          </select>
        )}

        {/* Complaint Lifecycle Status Filter */}
        {(filters.itemType === 'all' || filters.itemType === 'complaints') && (
          <select
            value={filters.complaintStatus}
            onChange={(e) => onChange({ ...filters, complaintStatus: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Issue Statuses</option>
            <option value="active">Active / Open</option>
            <option value="in_progress">In Progress / Assigned</option>
            <option value="resolved">Resolved / Closed</option>
          </select>
        )}

        {/* Municipal Ward Filter */}
        {availableWards.length > 0 && (
          <select
            value={filters.ward}
            onChange={(e) => onChange({ ...filters, ward: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Municipal Wards</option>
            {availableWards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        )}

        {/* Department Filter (especially useful for PM / Authority) */}
        {availableDepartments.length > 0 && (
          <select
            value={filters.department}
            onChange={(e) => onChange({ ...filters, department: e.target.value })}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Municipal Departments</option>
            {availableDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {/* Nearby Radius Section */}
        <div className="flex items-center gap-1.5 ml-auto border-l border-slate-200 pl-3">
          <button
            onClick={handleNearbyToggle}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filters.onlyNearby
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Nearby Only</span>
          </button>

          {filters.onlyNearby && (
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
              {[1, 5, 10].map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusSelect(radius)}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    filters.radiusKm === radius
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapFiltersBar;
