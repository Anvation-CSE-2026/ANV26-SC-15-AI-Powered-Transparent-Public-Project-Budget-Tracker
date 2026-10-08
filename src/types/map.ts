import type { ProjectStatus, ProjectCategory } from './project';
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus, SLAStatus } from './complaint';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Public-facing sanitized complaint for citizen GIS maps.
 * Strict privacy rule: NEVER contains citizenEmail, citizenPhone, internal notes, or private identifiers.
 */
export interface PublicMapComplaint {
  id: string;
  complaintNumber: string;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: {
    address: string;
    ward?: string;
    city?: string;
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  distanceKm?: number;
}

/**
 * Public-facing project for citizen GIS maps.
 */
export interface PublicMapProject {
  id: string;
  projectNumber: string;
  name: string;
  category: ProjectCategory;
  department: string;
  status: ProjectStatus;
  progress: number;
  budgetDeviation: number;
  plannedCompletionDate: string;
  approvedBudget: number;
  actualSpending: number;
  location: {
    address: string;
    ward?: string;
    city?: string;
    latitude: number;
    longitude: number;
  };
  distanceKm?: number;
}

/**
 * Authority complaint view with full operational metadata for Project Managers.
 */
export interface AuthorityMapComplaint extends PublicMapComplaint {
  citizenId: string;
  citizenName: string;
  departmentId?: string;
  departmentName?: string;
  assignedOfficerName?: string;
  severity: string;
  sla?: {
    deadline: string;
    status: SLAStatus;
    hoursRemaining?: number;
  };
}

export type MapItemType = 'all' | 'projects' | 'complaints';

export interface MapFilters {
  itemType: MapItemType;
  searchQuery: string;
  projectStatus: string; // 'all' | 'Ongoing' | 'Delayed' | 'At Risk' | 'Completed' | 'Upcoming'
  complaintPriority: string; // 'all' | 'emergency' | 'high' | 'medium' | 'low'
  complaintStatus: string; // 'all' | 'active' | 'in_progress' | 'resolved'
  department: string; // 'all' | department name
  ward: string; // 'all' | ward name
  radiusKm?: number; // 1 | 5 | 10
  onlyNearby: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}
