import type { Complaint } from '../types/complaint';
import type { Project } from '../types/project';
import type {
  PublicMapComplaint,
  PublicMapProject,
  AuthorityMapComplaint,
  MapFilters,
  UserLocation,
} from '../types/map';

/**
 * Standard municipal map center (Pune Metropolitan Municipal Center).
 * Matches test benchmarks and city infrastructure data.
 */
export const DEFAULT_MAP_CENTER: [number, number] = [18.5204, 73.8567];
export const DEFAULT_MAP_ZOOM = 13;

/**
 * Validates whether latitude and longitude are valid decimal coordinates.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Haversine formula: Calculates great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return Infinity;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Checks if a point is within the specified radius (in kilometers) from a center coordinate.
 */
export function isWithinRadius(
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number
): boolean {
  const dist = calculateDistanceKm(pointLat, pointLng, centerLat, centerLng);
  return dist <= radiusKm;
}

/**
 * Formats distance into a clean human-readable string (meters or kilometers).
 */
export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || distanceKm === null || !isFinite(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Strict Privacy Rule: Sanitizes a citizen complaint for public GIS view.
 * Strips citizenEmail, citizenPhone, citizenName, internal notes, and private metadata.
 */
export function sanitizeComplaintForCitizenMap(
  complaint: Complaint,
  userLocation?: UserLocation
): PublicMapComplaint | null {
  if (
    !complaint.location ||
    !isValidCoordinate(complaint.location.latitude, complaint.location.longitude)
  ) {
    return null;
  }

  const lat = complaint.location.latitude!;
  const lng = complaint.location.longitude!;

  let distanceKm: number | undefined;
  if (userLocation && isValidCoordinate(userLocation.latitude, userLocation.longitude)) {
    distanceKm = calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lng
    );
  }

  return {
    id: complaint.id,
    complaintNumber: complaint.complaintNumber,
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    location: {
      address: complaint.location.address,
      ward: complaint.location.ward,
      city: complaint.location.city,
      latitude: lat,
      longitude: lng,
    },
    createdAt: complaint.createdAt,
    distanceKm,
  };
}

/**
 * Maps Project model to public GIS project representation.
 */
export function sanitizeProjectForMap(
  project: Project,
  userLocation?: UserLocation
): PublicMapProject | null {
  if (
    !project.location ||
    !isValidCoordinate(project.location.latitude, project.location.longitude)
  ) {
    return null;
  }

  const lat = project.location.latitude!;
  const lng = project.location.longitude!;

  let distanceKm: number | undefined;
  if (userLocation && isValidCoordinate(userLocation.latitude, userLocation.longitude)) {
    distanceKm = calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lng
    );
  }

  return {
    id: project.id,
    projectNumber: project.projectNumber,
    name: project.name,
    category: project.category,
    department: project.department,
    status: project.status,
    progress: project.progress,
    budgetDeviation: project.budgetDeviation,
    plannedCompletionDate: project.plannedCompletionDate,
    approvedBudget: project.approvedBudget,
    actualSpending: project.actualSpending,
    location: {
      address: project.location.address,
      ward: project.location.ward,
      city: project.location.city,
      latitude: lat,
      longitude: lng,
    },
    distanceKm,
  };
}

/**
 * Maps Complaint to Project Manager operational view with full department and SLA context.
 */
export function formatComplaintForAuthorityMap(
  complaint: Complaint,
  userLocation?: UserLocation
): AuthorityMapComplaint | null {
  const publicBase = sanitizeComplaintForCitizenMap(complaint, userLocation);
  if (!publicBase) return null;

  return {
    ...publicBase,
    citizenId: complaint.citizenId,
    citizenName: complaint.citizenName,
    departmentId: complaint.departmentId,
    departmentName: complaint.departmentName,
    assignedOfficerName: complaint.assignedOfficerName,
    severity: complaint.severity,
    sla: complaint.sla,
  };
}

/**
 * Determines marker color for a complaint based on priority and lifecycle status.
 * - Resolved/Closed = Green (#10b981)
 * - Emergency = Red (#ef4444)
 * - High Priority = Orange (#f97316)
 * - Medium/Low/Other = Cyan/Blue (#06b6d4)
 */
export function getComplaintMarkerColor(priority: string, status: string): string {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'closed') {
    return '#10b981'; // Green
  }

  const p = priority.toLowerCase();
  if (p === 'emergency') {
    return '#ef4444'; // Red
  }
  if (p === 'high') {
    return '#f97316'; // Orange
  }
  return '#06b6d4'; // Cyan
}

/**
 * Determines marker color for public projects.
 */
export function getProjectMarkerColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return '#10b981'; // Emerald
  if (s === 'delayed') return '#f59e0b'; // Amber
  if (s === 'at risk' || s === 'at_risk') return '#ef4444'; // Red
  return '#2563eb'; // Royal Blue
}

/**
 * Filters projects based on the active map filter state.
 */
export function filterMapProjects(
  projects: PublicMapProject[],
  filters: MapFilters,
  userLocation?: UserLocation
): PublicMapProject[] {
  return projects.filter((project) => {
    // 1. Text Search query (matches title, projectNumber, address, ward, department)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = project.name.toLowerCase().includes(q);
      const matchNum = project.projectNumber.toLowerCase().includes(q);
      const matchAddr = project.location.address.toLowerCase().includes(q);
      const matchWard = project.location.ward?.toLowerCase().includes(q);
      const matchDept = project.department.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchAddr && !matchWard && !matchDept) {
        return false;
      }
    }

    // 2. Project Status filter
    if (filters.projectStatus && filters.projectStatus !== 'all') {
      const statusNormalized = project.status.toLowerCase().replace('_', ' ');
      const filterNormalized = filters.projectStatus.toLowerCase().replace('_', ' ');
      if (statusNormalized !== filterNormalized) {
        return false;
      }
    }

    // 3. Department filter
    if (filters.department && filters.department !== 'all') {
      if (project.department !== filters.department) {
        return false;
      }
    }

    // 4. Ward filter
    if (filters.ward && filters.ward !== 'all') {
      if (project.location.ward !== filters.ward) {
        return false;
      }
    }

    // 5. Radius / Nearby filter
    if (filters.onlyNearby && filters.radiusKm && userLocation) {
      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        project.location.latitude,
        project.location.longitude
      );
      if (dist > filters.radiusKm) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filters complaints based on the active map filter state.
 */
export function filterMapComplaints<T extends PublicMapComplaint>(
  complaints: T[],
  filters: MapFilters,
  userLocation?: UserLocation
): T[] {
  return complaints.filter((complaint) => {
    // 1. Text Search query (matches title, complaintNumber, address, ward, category)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchTitle = complaint.title.toLowerCase().includes(q);
      const matchNum = complaint.complaintNumber.toLowerCase().includes(q);
      const matchAddr = complaint.location.address.toLowerCase().includes(q);
      const matchWard = complaint.location.ward?.toLowerCase().includes(q);
      const matchCat = complaint.category.toLowerCase().includes(q);
      if (!matchTitle && !matchNum && !matchAddr && !matchWard && !matchCat) {
        return false;
      }
    }

    // 2. Complaint Priority filter
    if (filters.complaintPriority && filters.complaintPriority !== 'all') {
      if (complaint.priority.toLowerCase() !== filters.complaintPriority.toLowerCase()) {
        return false;
      }
    }

    // 3. Complaint Status filter
    if (filters.complaintStatus && filters.complaintStatus !== 'all') {
      const s = complaint.status.toLowerCase();
      if (filters.complaintStatus === 'resolved') {
        if (s !== 'resolved' && s !== 'closed') return false;
      } else if (filters.complaintStatus === 'in_progress') {
        if (s !== 'in_progress' && s !== 'assigned') return false;
      } else if (filters.complaintStatus === 'active') {
        if (s === 'resolved' || s === 'closed' || s === 'rejected') return false;
      } else {
        if (s !== filters.complaintStatus.toLowerCase()) return false;
      }
    }

    // 4. Ward filter
    if (filters.ward && filters.ward !== 'all') {
      if (complaint.location.ward !== filters.ward) {
        return false;
      }
    }

    // 5. Radius / Nearby filter
    if (filters.onlyNearby && filters.radiusKm && userLocation) {
      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        complaint.location.latitude,
        complaint.location.longitude
      );
      if (dist > filters.radiusKm) {
        return false;
      }
    }

    return true;
  });
}
