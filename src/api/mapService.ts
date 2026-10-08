import { getProjects } from './projectService';
import { getAllComplaints } from './complaintService';
import {
  sanitizeComplaintForCitizenMap,
  sanitizeProjectForMap,
  formatComplaintForAuthorityMap,
} from '../utils/mapUtils';
import type {
  PublicMapProject,
  PublicMapComplaint,
  AuthorityMapComplaint,
  UserLocation,
} from '../types/map';

export interface CitizenMapData {
  projects: PublicMapProject[];
  complaints: PublicMapComplaint[];
}

export interface AuthorityMapData {
  projects: PublicMapProject[];
  complaints: AuthorityMapComplaint[];
}

/**
 * Loads citizen-safe GIS map data.
 * - Only includes public projects with valid GPS coordinates.
 * - Redacts all private citizen info, email, phone, and internal notes from complaints.
 */
export async function getCitizenMapData(userLocation?: UserLocation): Promise<CitizenMapData> {
  const [allProjects, allComplaints] = await Promise.all([
    getProjects({ isAuthority: false }),
    getAllComplaints(),
  ]);

  const projects: PublicMapProject[] = [];
  for (const p of allProjects) {
    const mapped = sanitizeProjectForMap(p, userLocation);
    if (mapped) {
      projects.push(mapped);
    }
  }

  const complaints: PublicMapComplaint[] = [];
  for (const c of allComplaints) {
    const mapped = sanitizeComplaintForCitizenMap(c, userLocation);
    if (mapped) {
      complaints.push(mapped);
    }
  }

  return { projects, complaints };
}

/**
 * Loads Project Manager GIS map data.
 * - Includes all projects (public and internal works).
 * - Includes all complaints with full administrative metadata (SLA, department, officer).
 */
export async function getAuthorityMapData(userLocation?: UserLocation): Promise<AuthorityMapData> {
  const [allProjects, allComplaints] = await Promise.all([
    getProjects({ isAuthority: true }),
    getAllComplaints(),
  ]);

  const projects: PublicMapProject[] = [];
  for (const p of allProjects) {
    const mapped = sanitizeProjectForMap(p, userLocation);
    if (mapped) {
      projects.push(mapped);
    }
  }

  const complaints: AuthorityMapComplaint[] = [];
  for (const c of allComplaints) {
    const mapped = formatComplaintForAuthorityMap(c, userLocation);
    if (mapped) {
      complaints.push(mapped);
    }
  }

  return { projects, complaints };
}
