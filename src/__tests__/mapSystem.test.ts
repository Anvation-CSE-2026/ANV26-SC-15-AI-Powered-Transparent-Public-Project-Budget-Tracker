import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidCoordinate,
  calculateDistanceKm,
  isWithinRadius,
  formatDistance,
  sanitizeComplaintForCitizenMap,
  sanitizeProjectForMap,
  formatComplaintForAuthorityMap,
  getComplaintMarkerColor,
  getProjectMarkerColor,
  filterMapProjects,
  filterMapComplaints,
  DEFAULT_MAP_CENTER,
} from '../utils/mapUtils';
import { getCitizenMapData, getAuthorityMapData } from '../api/mapService';
import type { Complaint } from '../types/complaint';
import type { Project } from '../types/project';
import type { MapFilters, UserLocation } from '../types/map';

describe('Phase 9: Maps & Location Intelligence Unit Tests', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  // 1. Coordinate Validation Logic
  describe('1. Coordinate Validation (isValidCoordinate)', () => {
    it('accepts valid decimal GPS coordinates', () => {
      expect(isValidCoordinate(18.5204, 73.8567)).toBe(true);
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(-33.8688, 151.2093)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
    });

    it('rejects null or undefined coordinates', () => {
      expect(isValidCoordinate(undefined, 73.8567)).toBe(false);
      expect(isValidCoordinate(18.5204, undefined)).toBe(false);
      expect(isValidCoordinate(null, null)).toBe(false);
    });

    it('rejects NaN or non-numeric values', () => {
      expect(isValidCoordinate(NaN, 73.8567)).toBe(false);
      expect(isValidCoordinate(18.5204, NaN)).toBe(false);
      // @ts-expect-error testing invalid type
      expect(isValidCoordinate('18.5204', '73.8567')).toBe(false);
    });

    it('rejects out-of-bounds latitudes and longitudes', () => {
      expect(isValidCoordinate(91, 73.8567)).toBe(false);
      expect(isValidCoordinate(-90.1, 73.8567)).toBe(false);
      expect(isValidCoordinate(18.5204, 180.1)).toBe(false);
      expect(isValidCoordinate(18.5204, -181)).toBe(false);
    });
  });

  // 2. Haversine Distance Calculation
  describe('2. Haversine Distance Calculation (calculateDistanceKm)', () => {
    it('returns 0 for identical coordinates', () => {
      expect(calculateDistanceKm(18.5204, 73.8567, 18.5204, 73.8567)).toBe(0);
    });

    it('calculates accurate distance between known municipal coordinates', () => {
      // Pune City Center to Subhash Nagar (~1.74 km)
      const dist = calculateDistanceKm(18.5204, 73.8567, 18.5312, 73.8445);
      expect(dist).toBeGreaterThan(1.5);
      expect(dist).toBeLessThan(2.0);
    });

    it('maintains mathematical symmetry (A to B === B to A)', () => {
      const dist1 = calculateDistanceKm(18.5204, 73.8567, 18.5085, 73.812);
      const dist2 = calculateDistanceKm(18.5085, 73.812, 18.5204, 73.8567);
      expect(dist1).toBe(dist2);
    });

    it('returns Infinity when given invalid coordinates', () => {
      expect(calculateDistanceKm(95, 73.8567, 18.5204, 73.8567)).toBe(Infinity);
      // @ts-expect-error testing invalid coordinate
      expect(calculateDistanceKm(undefined, 73.8567, 18.5204, 73.8567)).toBe(Infinity);
    });
  });

  // 3. Proximity / Radius Logic
  describe('3. Proximity Checker (isWithinRadius)', () => {
    const centerLat = 18.5204;
    const centerLng = 73.8567;

    it('identifies coordinates within 2 km radius', () => {
      const nearLat = 18.5285;
      const nearLng = 73.8425; // ~1.75 km away
      expect(isWithinRadius(nearLat, nearLng, centerLat, centerLng, 2)).toBe(true);
      expect(isWithinRadius(nearLat, nearLng, centerLat, centerLng, 1)).toBe(false);
    });

    it('identifies coordinates within 10 km radius', () => {
      const hadapsarLat = 18.511;
      const hadapsarLng = 73.9245; // ~7.2 km away
      expect(isWithinRadius(hadapsarLat, hadapsarLng, centerLat, centerLng, 10)).toBe(true);
      expect(isWithinRadius(hadapsarLat, hadapsarLng, centerLat, centerLng, 5)).toBe(false);
    });
  });

  // 4. Distance Formatting
  describe('4. Distance Formatter (formatDistance)', () => {
    it('formats distances under 1 km as meters', () => {
      expect(formatDistance(0.45)).toBe('450 m away');
      expect(formatDistance(0.08)).toBe('80 m away');
    });

    it('formats distances 1 km and above as kilometers with 1 decimal place', () => {
      expect(formatDistance(2.34)).toBe('2.3 km away');
      expect(formatDistance(12.78)).toBe('12.8 km away');
    });

    it('handles undefined or infinite distances gracefully', () => {
      expect(formatDistance(undefined)).toBe('');
      expect(formatDistance(Infinity)).toBe('');
    });
  });

  // 5. Citizen Privacy Boundary: Complaint Sanitization
  describe('5. Citizen Privacy Redaction (sanitizeComplaintForCitizenMap)', () => {
    const rawComplaint: Complaint = {
      id: 'cmp-priv-01',
      complaintNumber: 'CMP-2026-99999',
      citizenId: 'user_secret_uuid_123',
      citizenName: 'Deepa Deshmukh',
      citizenEmail: 'deepa.confidential@example.com',
      title: 'Water Pipe Rupture In Front of House',
      description: 'Major leak flooding the street outside my gate.',
      category: 'Water',
      priority: 'emergency',
      severity: 'critical',
      status: 'in_progress',
      location: {
        address: 'Lane 4, Subhash Nagar',
        ward: 'Ward 8',
        city: 'Pune Metro',
        latitude: 18.5312,
        longitude: 73.8445,
      },
      attachments: [],
      createdAt: '2026-10-08T10:00:00.000Z',
      updatedAt: '2026-10-08T11:00:00.000Z',
    };

    it('strictly strips citizenEmail from citizen map representation', () => {
      const sanitized = sanitizeComplaintForCitizenMap(rawComplaint);
      expect(sanitized).not.toBeNull();
      // @ts-expect-error testing privacy field absence
      expect(sanitized.citizenEmail).toBeUndefined();
    });

    it('strictly strips citizenName and citizenId from citizen map representation', () => {
      const sanitized = sanitizeComplaintForCitizenMap(rawComplaint);
      // @ts-expect-error testing privacy field absence
      expect(sanitized.citizenName).toBeUndefined();
      // @ts-expect-error testing privacy field absence
      expect(sanitized.citizenId).toBeUndefined();
    });

    it('preserves public civic safety fields (category, priority, status, address, coords)', () => {
      const sanitized = sanitizeComplaintForCitizenMap(rawComplaint);
      expect(sanitized?.id).toBe('cmp-priv-01');
      expect(sanitized?.complaintNumber).toBe('CMP-2026-99999');
      expect(sanitized?.title).toBe('Water Pipe Rupture In Front of House');
      expect(sanitized?.category).toBe('Water');
      expect(sanitized?.priority).toBe('emergency');
      expect(sanitized?.status).toBe('in_progress');
      expect(sanitized?.location.latitude).toBe(18.5312);
      expect(sanitized?.location.longitude).toBe(73.8445);
    });

    it('returns null if complaint lacks valid geographic coordinates', () => {
      const invalidComplaint = {
        ...rawComplaint,
        location: { address: 'Unknown place', ward: 'Ward 1' },
      };
      expect(sanitizeComplaintForCitizenMap(invalidComplaint)).toBeNull();
    });

    it('calculates distanceKm when user location is provided', () => {
      const userLoc: UserLocation = {
        latitude: 18.5204,
        longitude: 73.8567,
        timestamp: Date.now(),
      };
      const sanitized = sanitizeComplaintForCitizenMap(rawComplaint, userLoc);
      expect(sanitized?.distanceKm).toBeDefined();
      expect(sanitized!.distanceKm!).toBeGreaterThan(0);
    });
  });

  // 6. Authority Complaint Mapping
  describe('6. Authority Operational Context (formatComplaintForAuthorityMap)', () => {
    const rawComplaint: Complaint = {
      id: 'cmp-pm-01',
      complaintNumber: 'CMP-2026-88888',
      citizenId: 'user_cit_99',
      citizenName: 'Ramesh Patil',
      citizenEmail: 'ramesh@example.com',
      title: 'Open Trench on Pavement',
      description: 'Dangerous trench',
      category: 'Roads',
      priority: 'high',
      severity: 'critical',
      status: 'assigned',
      departmentId: 'dept_roads',
      departmentName: 'Roads Department',
      assignedOfficerName: 'Er. Kulkarni',
      location: {
        address: 'FC Road',
        ward: 'Ward 12',
        latitude: 18.5204,
        longitude: 73.8567,
      },
      sla: {
        deadline: '2026-10-10T12:00:00.000Z',
        status: 'approaching',
        hoursRemaining: 14,
      },
      attachments: [],
      createdAt: '2026-10-08T00:00:00.000Z',
      updatedAt: '2026-10-08T00:00:00.000Z',
    };

    it('retains administrative and SLA metadata for Project Managers', () => {
      const authMap = formatComplaintForAuthorityMap(rawComplaint);
      expect(authMap).not.toBeNull();
      expect(authMap?.citizenId).toBe('user_cit_99');
      expect(authMap?.citizenName).toBe('Ramesh Patil');
      expect(authMap?.departmentName).toBe('Roads Department');
      expect(authMap?.assignedOfficerName).toBe('Er. Kulkarni');
      expect(authMap?.sla?.status).toBe('approaching');
      expect(authMap?.sla?.hoursRemaining).toBe(14);
    });
  });

  // 7. Project Mapping to GIS Data
  describe('7. Project GIS Mapping (sanitizeProjectForMap)', () => {
    const rawProject: Project = {
      id: 'prj-test-01',
      projectNumber: 'PRJ-2026-00001',
      name: 'Outer Ring Road Asphalting',
      description: 'Major road widening',
      category: 'Roads & Transport',
      department: 'Roads & Infrastructure',
      departmentId: 'dept_roads',
      projectManagerId: 'pm-1',
      projectManagerName: 'Er. Deshmukh',
      location: {
        address: 'Sector 4',
        ward: 'Ward 12',
        city: 'Pune Metro',
        latitude: 18.5204,
        longitude: 73.8567,
      },
      startDate: '2026-01-01',
      plannedCompletionDate: '2026-12-31',
      approvedBudget: 10.0,
      estimatedCost: 9.8,
      actualSpending: 5.2,
      progress: 60,
      budgetDeviation: 0,
      delayDays: 0,
      status: 'Ongoing',
      isPublic: true,
      riskScore: 0,
      riskLabel: 'Normal',
      milestonesCount: 4,
      completedMilestonesCount: 2,
      issuesCount: 0,
      unresolvedIssuesCount: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('creates PublicMapProject with budget and completion details', () => {
      const mapped = sanitizeProjectForMap(rawProject);
      expect(mapped).not.toBeNull();
      expect(mapped?.id).toBe('prj-test-01');
      expect(mapped?.projectNumber).toBe('PRJ-2026-00001');
      expect(mapped?.progress).toBe(60);
      expect(mapped?.approvedBudget).toBe(10.0);
      expect(mapped?.location.latitude).toBe(18.5204);
      expect(mapped?.location.longitude).toBe(73.8567);
    });

    it('returns null if project has missing coordinates', () => {
      const noCoordsProject = {
        ...rawProject,
        location: { address: 'Site', city: 'City' },
      };
      expect(sanitizeProjectForMap(noCoordsProject)).toBeNull();
    });
  });

  // 8. Marker Color Styling
  describe('8. Marker Color Schemes', () => {
    it('assigns green for resolved and closed complaints', () => {
      expect(getComplaintMarkerColor('emergency', 'resolved')).toBe('#10b981');
      expect(getComplaintMarkerColor('high', 'closed')).toBe('#10b981');
    });

    it('assigns red for emergency priority complaints', () => {
      expect(getComplaintMarkerColor('emergency', 'in_progress')).toBe('#ef4444');
      expect(getComplaintMarkerColor('emergency', 'submitted')).toBe('#ef4444');
    });

    it('assigns orange for high priority complaints', () => {
      expect(getComplaintMarkerColor('high', 'in_progress')).toBe('#f97316');
      expect(getComplaintMarkerColor('high', 'under_review')).toBe('#f97316');
    });

    it('assigns cyan for medium, low, or normal complaints', () => {
      expect(getComplaintMarkerColor('medium', 'in_progress')).toBe('#06b6d4');
      expect(getComplaintMarkerColor('low', 'submitted')).toBe('#06b6d4');
    });

    it('assigns appropriate colors for project statuses', () => {
      expect(getProjectMarkerColor('Ongoing')).toBe('#2563eb'); // Blue
      expect(getProjectMarkerColor('Delayed')).toBe('#f59e0b'); // Amber
      expect(getProjectMarkerColor('At Risk')).toBe('#ef4444'); // Red
      expect(getProjectMarkerColor('Completed')).toBe('#10b981'); // Emerald
    });
  });

  // 9. Map Filtering Engine
  describe('9. Multi-Dimension Map Filtering Engine', () => {
    const userLocation: UserLocation = {
      latitude: 18.5204,
      longitude: 73.8567,
      timestamp: Date.now(),
    };

    const mockProjects = [
      {
        id: 'p1',
        projectNumber: 'PRJ-2026-00001',
        name: 'Arterial Road Resurfacing',
        category: 'Roads & Transport' as const,
        department: 'Roads & Infrastructure',
        status: 'Ongoing' as const,
        progress: 70,
        budgetDeviation: 0,
        plannedCompletionDate: '2026-12-31',
        approvedBudget: 12.5,
        actualSpending: 8.0,
        location: {
          address: 'Outer Ring Road',
          ward: 'Ward 12',
          city: 'Pune Metro',
          latitude: 18.5204,
          longitude: 73.8567, // exactly at user location
        },
      },
      {
        id: 'p2',
        projectNumber: 'PRJ-2026-00002',
        name: 'Stormwater Culvert Construction',
        category: 'Drainage' as const,
        department: 'Stormwater & Drainage',
        status: 'Delayed' as const,
        progress: 40,
        budgetDeviation: 15,
        plannedCompletionDate: '2026-08-31',
        approvedBudget: 8.0,
        actualSpending: 9.2,
        location: {
          address: 'Subhash Nagar Canal',
          ward: 'Ward 8',
          city: 'Pune Metro',
          latitude: 18.5312,
          longitude: 73.8445, // ~1.74 km away
        },
      },
      {
        id: 'p3',
        projectNumber: 'PRJ-2026-00003',
        name: 'Distant EV Charging Station Hub',
        category: 'Public Buildings' as const,
        department: 'General Public Works',
        status: 'Completed' as const,
        progress: 100,
        budgetDeviation: 0,
        plannedCompletionDate: '2026-03-31',
        approvedBudget: 5.0,
        actualSpending: 4.8,
        location: {
          address: 'Far Outer Sector 25',
          ward: 'Ward 25',
          city: 'Pune Metro',
          latitude: 18.65,
          longitude: 73.98, // > 15 km away
        },
      },
    ];

    const mockComplaints = [
      {
        id: 'c1',
        complaintNumber: 'CMP-2026-00101',
        title: 'Broken Water Pipe Flooding Road',
        category: 'Water' as const,
        priority: 'emergency' as const,
        status: 'in_progress' as const,
        location: {
          address: 'Near FC Road',
          ward: 'Ward 12',
          city: 'Pune Metro',
          latitude: 18.5285,
          longitude: 73.8425, // ~1.75 km away
        },
        createdAt: '2026-10-08T00:00:00.000Z',
      },
      {
        id: 'c2',
        complaintNumber: 'CMP-2026-00102',
        title: 'Uncollected Trash on Corner',
        category: 'Garbage' as const,
        priority: 'medium' as const,
        status: 'submitted' as const,
        location: {
          address: 'Ward 7 Market',
          ward: 'Ward 7',
          city: 'Pune Metro',
          latitude: 18.5665,
          longitude: 73.912, // ~7.8 km away
        },
        createdAt: '2026-10-08T00:00:00.000Z',
      },
      {
        id: 'c3',
        complaintNumber: 'CMP-2026-00103',
        title: 'Repaired Pothole Patch',
        category: 'Roads' as const,
        priority: 'low' as const,
        status: 'resolved' as const,
        location: {
          address: 'Ward 12 University Road',
          ward: 'Ward 12',
          city: 'Pune Metro',
          latitude: 18.536,
          longitude: 73.831,
        },
        createdAt: '2026-10-02T00:00:00.000Z',
      },
    ];

    const baseFilters: MapFilters = {
      itemType: 'all',
      searchQuery: '',
      projectStatus: 'all',
      complaintPriority: 'all',
      complaintStatus: 'all',
      department: 'all',
      ward: 'all',
      radiusKm: 5,
      onlyNearby: false,
    };

    it('filters projects by text search query', () => {
      const res = filterMapProjects(
        mockProjects,
        { ...baseFilters, searchQuery: 'Stormwater' },
        userLocation
      );
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('p2');
    });

    it('filters projects by project status', () => {
      const delayed = filterMapProjects(
        mockProjects,
        { ...baseFilters, projectStatus: 'Delayed' },
        userLocation
      );
      expect(delayed).toHaveLength(1);
      expect(delayed[0].id).toBe('p2');

      const completed = filterMapProjects(
        mockProjects,
        { ...baseFilters, projectStatus: 'Completed' },
        userLocation
      );
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('p3');
    });

    it('filters projects by ward', () => {
      const ward12 = filterMapProjects(
        mockProjects,
        { ...baseFilters, ward: 'Ward 12' },
        userLocation
      );
      expect(ward12).toHaveLength(1);
      expect(ward12[0].id).toBe('p1');
    });

    it('filters projects by nearby radius', () => {
      const nearby5km = filterMapProjects(
        mockProjects,
        { ...baseFilters, onlyNearby: true, radiusKm: 5 },
        userLocation
      );
      // p1 is 0 km, p2 is ~1.74 km, p3 is > 15 km
      expect(nearby5km).toHaveLength(2);
      expect(nearby5km.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('filters complaints by priority', () => {
      const emergencyOnly = filterMapComplaints(
        mockComplaints,
        { ...baseFilters, complaintPriority: 'emergency' },
        userLocation
      );
      expect(emergencyOnly).toHaveLength(1);
      expect(emergencyOnly[0].id).toBe('c1');
    });

    it('filters complaints by active status vs resolved', () => {
      const resolved = filterMapComplaints(
        mockComplaints,
        { ...baseFilters, complaintStatus: 'resolved' },
        userLocation
      );
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe('c3');

      const active = filterMapComplaints(
        mockComplaints,
        { ...baseFilters, complaintStatus: 'active' },
        userLocation
      );
      expect(active).toHaveLength(2);
      expect(active.map((c) => c.id)).toEqual(['c1', 'c2']);
    });

    it('filters complaints by nearby radius', () => {
      const nearby3km = filterMapComplaints(
        mockComplaints,
        { ...baseFilters, onlyNearby: true, radiusKm: 3 },
        userLocation
      );
      // c1 is ~1.75km, c2 is ~7.8km, c3 is ~3.5km
      expect(nearby3km.map((c) => c.id)).toContain('c1');
      expect(nearby3km.map((c) => c.id)).not.toContain('c2');
    });
  });

  // 10. Map Service Layer Integration
  describe('10. Map Data Services (getCitizenMapData & getAuthorityMapData)', () => {
    it('loads citizen map data containing valid coordinates and sanitized complaints', async () => {
      const data = await getCitizenMapData();
      expect(data.projects.length).toBeGreaterThan(0);
      expect(data.complaints.length).toBeGreaterThan(0);

      // Verify all items have valid coordinates
      for (const p of data.projects) {
        expect(isValidCoordinate(p.location.latitude, p.location.longitude)).toBe(true);
      }
      for (const c of data.complaints) {
        expect(isValidCoordinate(c.location.latitude, c.location.longitude)).toBe(true);
        // @ts-expect-error citizen email must be stripped
        expect(c.citizenEmail).toBeUndefined();
      }
    });

    it('loads authority map data with full operational SLA metadata', async () => {
      const data = await getAuthorityMapData();
      expect(data.projects.length).toBeGreaterThan(0);
      expect(data.complaints.length).toBeGreaterThan(0);

      // Verify that authority complaints contain administrative context
      const complaintWithSLA = data.complaints.find((c) => c.sla !== undefined);
      expect(complaintWithSLA).toBeDefined();
      expect(complaintWithSLA?.citizenName).toBeDefined();
    });

    it('includes default map center matching municipal smart city center', () => {
      expect(DEFAULT_MAP_CENTER).toEqual([18.5204, 73.8567]);
    });
  });
});
