import type {
  CitizenDashboardStats,
  ComplaintSummary,
  ProjectSummary,
  PollSummary,
  AnnouncementSummary,
  CivicIssueSummary,
} from '../types/citizen';
import { isFirebaseConfigured, db } from './firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

/**
 * Service Layer for Citizen Dashboard.
 * Interacts with Firestore when available, otherwise safely returns initialized models.
 */

export async function getCitizenStats(userId: string): Promise<CitizenDashboardStats> {
  if (isFirebaseConfigured && db && userId) {
    try {
      const complaintsRef = collection(db, 'complaints');
      const q = query(complaintsRef, where('citizenId', '==', userId));
      const snap = await getDocs(q);

      let pending = 0;
      let resolved = 0;
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.status === 'resolved' || data.status === 'closed') {
          resolved += 1;
        } else {
          pending += 1;
        }
      });

      return {
        myComplaintsCount: snap.size,
        pendingComplaintsCount: pending,
        resolvedComplaintsCount: resolved,
        activeVotesCount: 2,
        nearbyIssuesCount: 4,
        projectUpdatesCount: 2,
      };
    } catch (err) {
      console.warn('[CivicSight] Error loading live stats from Firestore:', err);
    }
  }

  // Local storage fallback
  try {
    const raw = sessionStorage.getItem('civicsight_local_complaints');
    if (raw) {
      const allComplaints = Object.values(JSON.parse(raw)) as Array<{
        citizenId: string;
        status: string;
      }>;
      const userComplaints = allComplaints.filter((c) => c.citizenId === userId);
      const pending = userComplaints.filter(
        (c) => c.status !== 'resolved' && c.status !== 'closed'
      ).length;
      const resolved = userComplaints.filter(
        (c) => c.status === 'resolved' || c.status === 'closed'
      ).length;

      return {
        myComplaintsCount: userComplaints.length,
        pendingComplaintsCount: pending,
        resolvedComplaintsCount: resolved,
        activeVotesCount: 2,
        nearbyIssuesCount: 4,
        projectUpdatesCount: 2,
      };
    }
  } catch {
    // ignore
  }

  // Initial zero-state for new citizens
  return {
    myComplaintsCount: 0,
    pendingComplaintsCount: 0,
    resolvedComplaintsCount: 0,
    activeVotesCount: 2,
    nearbyIssuesCount: 4,
    projectUpdatesCount: 2,
  };
}

export async function getCitizenRecentComplaints(userId: string): Promise<ComplaintSummary[]> {
  if (isFirebaseConfigured && db && userId) {
    try {
      const complaintsRef = collection(db, 'complaints');
      const q = query(
        complaintsRef,
        where('citizenId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          trackingNumber: data.complaintNumber || data.trackingNumber || `CMP-${docSnap.id.substring(0, 6).toUpperCase()}`,
          title: data.title || 'Civic Issue',
          category: data.category || 'General',
          status: data.status || 'submitted',
          priority: data.priority || 'medium',
          location: data.location?.address || 'Municipal Ward',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('[CivicSight] Error querying recent complaints:', err);
    }
  }

  // Local storage fallback
  try {
    const raw = sessionStorage.getItem('civicsight_local_complaints');
    if (raw) {
      const allComplaints = Object.values(JSON.parse(raw)) as Array<{
        id: string;
        citizenId: string;
        complaintNumber?: string;
        trackingNumber?: string;
        title: string;
        category: string;
        status: string;
        priority: string;
        location?: { address: string };
        createdAt: string;
        updatedAt: string;
      }>;
      const userComplaints = allComplaints
        .filter((c) => c.citizenId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      return userComplaints.map((c) => ({
        id: c.id,
        trackingNumber: c.complaintNumber || c.trackingNumber || `CMP-${c.id.substring(0, 6).toUpperCase()}`,
        title: c.title,
        category: c.category,
        status: (c.status as ComplaintSummary['status']) || 'submitted',
        priority: (c.priority as ComplaintSummary['priority']) || 'medium',
        location: c.location?.address || 'Municipal Ward',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    }
  } catch {
    // ignore
  }

  // Returns empty array for newly registered citizens so empty state is triggered
  return [];
}

export async function getPublicProjectsSummary(): Promise<ProjectSummary[]> {
  // Public Projects preview matching our MVP benchmark datasets
  return [
    {
      id: 'proj_city_road_01',
      name: 'City Road Improvement & Resurfacing',
      department: 'Public Works Department',
      location: 'Ward 12, MG Road to Ring Road',
      approvedBudgetCr: 10.0,
      actualSpendingCr: 9.2,
      progress: 82,
      status: 'ongoing',
      plannedCompletionDate: '2026-12-15',
      updatedAt: '2026-10-05',
    },
    {
      id: 'proj_urban_drainage_02',
      name: 'Urban Drainage & Flood Mitigation Upgrade',
      department: 'Stormwater & Drainage Dept',
      location: 'Ward 8, Low-Lying Eastern Basin',
      approvedBudgetCr: 8.0,
      actualSpendingCr: 10.1,
      progress: 58,
      status: 'at_risk',
      plannedCompletionDate: '2026-09-01',
      updatedAt: '2026-10-06',
    },
  ];
}

export async function getActivePolls(): Promise<PollSummary[]> {
  return [
    {
      id: 'poll_green_corridor_01',
      title: 'Pedestrian Green Corridor & Cycling Track',
      description: 'Vote on whether Municipal Ward 4 should convert Central Avenue into a weekend zero-emission pedestrian zone.',
      category: 'Urban Mobility',
      startDate: '2026-10-01',
      endDate: '2026-10-25',
      totalVotes: 1240,
      status: 'open',
      hasVoted: false,
    },
    {
      id: 'poll_solar_lights_02',
      title: 'Community Solar Street Lighting Expansion',
      description: 'Prioritize street lighting upgrades between North Sector Parks and Outer Residential Ward 7.',
      category: 'Public Infrastructure',
      startDate: '2026-10-03',
      endDate: '2026-10-28',
      totalVotes: 890,
      status: 'open',
      hasVoted: false,
    },
  ];
}

export async function getNearbyCivicIssues(): Promise<CivicIssueSummary[]> {
  return [
    {
      id: 'iss_101',
      title: 'Malfunctioning Traffic Signal',
      category: 'Traffic',
      priority: 'high',
      area: 'Station Junction, Ward 12',
      status: 'in_progress',
      distanceKm: 0.6,
    },
    {
      id: 'iss_102',
      title: 'Stormwater Drain Clogging',
      category: 'Drainage',
      priority: 'emergency',
      area: 'Market Road, Ward 12',
      status: 'assigned',
      distanceKm: 1.2,
    },
    {
      id: 'iss_103',
      title: 'Damaged Pavement Curb',
      category: 'Roads',
      priority: 'medium',
      area: 'Civic Center Lane',
      status: 'under_review',
      distanceKm: 1.8,
    },
  ];
}

export async function getCityAnnouncements(): Promise<AnnouncementSummary[]> {
  return [
    {
      id: 'ann_01',
      title: 'Scheduled Water Supply Maintenance in Western Wards',
      description: 'Pipeline rehabilitation work scheduled for Saturday 10:00 PM to Sunday 06:00 AM. Low pressure expected.',
      category: 'Water',
      priority: 'important',
      date: '2026-10-07',
      isRead: false,
    },
    {
      id: 'ann_02',
      title: 'Public Budget Town Hall: FY 2027 Capital Projects',
      description: 'Join the Municipal Commissioner for the open public consultation regarding upcoming arterial road budgets.',
      category: 'General',
      priority: 'normal',
      date: '2026-10-05',
      isRead: true,
    },
  ];
}
