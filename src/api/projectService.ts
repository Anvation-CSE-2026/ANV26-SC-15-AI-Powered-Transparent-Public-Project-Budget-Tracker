import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type {
  Project,
  ProjectMilestone,
  ProjectUpdate,
  ProjectIssue,
  ProjectDocument,
  ProjectPhoto,
  ProjectActivity,
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  CreateProjectUpdateInput,
  CreateProjectIssueInput,
} from '../types/project';
import type { UserProfile } from '../types';
import { generateProjectNumber } from '../utils/projectIdGenerator';
import { calculateBudgetDeviation, calculateDelayDays, calculateCivicSightRisk } from '../utils/calculations';
import { createNotification } from './notificationService';
import { logAuditEvent } from './auditService';

const LOCAL_STORAGE_PROJECTS = 'civicsight_local_projects';
const LOCAL_STORAGE_MILESTONES = 'civicsight_local_project_milestones';
const LOCAL_STORAGE_UPDATES = 'civicsight_local_project_updates';
const LOCAL_STORAGE_ISSUES = 'civicsight_local_project_issues';
const LOCAL_STORAGE_DOCUMENTS = 'civicsight_local_project_documents';
const LOCAL_STORAGE_PHOTOS = 'civicsight_local_project_photos';
const LOCAL_STORAGE_ACTIVITIES = 'civicsight_local_project_activities';

const projectMemoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return projectMemoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  projectMemoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

// ==========================================
// SEED INITIAL REALISTIC PROJECTS
// ==========================================
function getInitialSeedProjects(): Record<string, Project> {
  const p1: Project = {
    id: 'prj-seed-1',
    projectNumber: 'PRJ-2026-00101',
    name: 'Smart City Arterial Ring Road Resurfacing & Cycle Corridor',
    description: 'Comprehensive high-durability bituminous asphalt resurfacing with stormwater culverts, dedicated separated cycle tracks, and solar-powered smart streetlights along Sector 4 to 12.',
    category: 'Roads & Transport',
    department: 'Roads & Infrastructure',
    departmentId: 'dept_roads',
    projectManagerId: 'pm-seed-1',
    projectManagerName: 'Er. Rajesh Deshmukh',
    contractorId: 'cont-01',
    contractorName: 'Apex Urban Infra Tech Ltd',
    location: {
      address: 'Outer Ring Road, North Corridor',
      ward: 'Ward 12',
      city: 'Pune Metro',
      latitude: 18.5204,
      longitude: 73.8567,
    },
    startDate: '2026-01-15',
    plannedCompletionDate: '2026-11-30',
    expectedCompletionDate: '2026-11-30',
    approvedBudget: 10.0, // 10.0 Cr
    estimatedCost: 10.0,
    actualSpending: 9.2,
    progress: 82,
    expectedProgress: 80,
    budgetDeviation: calculateBudgetDeviation(10.0, 9.2),
    delayDays: 0,
    status: 'Ongoing',
    isPublic: true,
    riskScore: 0,
    riskLabel: 'Normal',
    milestonesCount: 5,
    completedMilestonesCount: 3,
    issuesCount: 1,
    unresolvedIssuesCount: 0,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-03-28T14:30:00.000Z',
  };

  const p2: Project = {
    id: 'prj-seed-2',
    projectNumber: 'PRJ-2026-00102',
    name: 'North Sector Stormwater Drainage & Flood Mitigation Canal',
    description: 'Construction of deep reinforced box culverts, silt traps, and high-capacity stormwater canal to mitigate monsoon waterlogging across low-lying commercial sectors.',
    category: 'Drainage',
    department: 'Stormwater & Drainage',
    departmentId: 'dept_drainage',
    projectManagerId: 'pm-seed-2',
    projectManagerName: 'Er. Pooja Kulkarni',
    contractorId: 'cont-02',
    contractorName: 'Varun Hydraulic Engineers Pvt Ltd',
    location: {
      address: 'Canal Road, Subhash Nagar',
      ward: 'Ward 8',
      city: 'Pune Metro',
      latitude: 18.5312,
      longitude: 73.8445,
    },
    startDate: '2025-11-01',
    plannedCompletionDate: '2026-05-15',
    expectedCompletionDate: '2026-06-30',
    approvedBudget: 8.0, // 8.0 Cr
    estimatedCost: 8.5,
    actualSpending: 10.1,
    progress: 58,
    expectedProgress: 80,
    budgetDeviation: calculateBudgetDeviation(8.0, 10.1),
    delayDays: 45,
    status: 'Delayed',
    isPublic: true,
    riskScore: 4,
    riskLabel: 'High Attention',
    milestonesCount: 4,
    completedMilestonesCount: 2,
    issuesCount: 7,
    unresolvedIssuesCount: 3,
    createdAt: '2025-10-25T09:00:00.000Z',
    updatedAt: '2026-03-25T11:20:00.000Z',
  };

  const p3: Project = {
    id: 'prj-seed-3',
    projectNumber: 'PRJ-2026-00103',
    name: 'Central Ward Automated Water Supply Pipeline Network',
    description: 'Replacement of aged ductile iron pipelines with HDPE pipelines equipped with SCADA flow telemetry and automated pressure regulation valves.',
    category: 'Water Supply',
    department: 'Water Supply & Sewerage',
    departmentId: 'dept_water',
    projectManagerId: 'pm-seed-1',
    projectManagerName: 'Er. Rajesh Deshmukh',
    contractorId: 'cont-03',
    contractorName: 'JalShakti Infrastructure Corp',
    location: {
      address: 'Main Reservoir Line, Gandhi Chowk',
      ward: 'Ward 4',
      city: 'Pune Metro',
      latitude: 18.5143,
      longitude: 73.8582,
    },
    startDate: '2026-02-01',
    plannedCompletionDate: '2026-10-15',
    expectedCompletionDate: '2026-10-15',
    approvedBudget: 15.0,
    estimatedCost: 14.8,
    actualSpending: 4.5,
    progress: 35,
    expectedProgress: 35,
    budgetDeviation: calculateBudgetDeviation(15.0, 4.5),
    delayDays: 0,
    status: 'Ongoing',
    isPublic: true,
    riskScore: 0,
    riskLabel: 'Normal',
    milestonesCount: 6,
    completedMilestonesCount: 2,
    issuesCount: 1,
    unresolvedIssuesCount: 0,
    createdAt: '2026-01-28T08:30:00.000Z',
    updatedAt: '2026-03-20T16:00:00.000Z',
  };

  const p4: Project = {
    id: 'prj-seed-4',
    projectNumber: 'PRJ-2026-00104',
    name: 'Smart Street Lighting & Centralized Energy Automation',
    description: 'City-wide conversion of 4,500 halogen streetlights to energy-efficient LED luminaires with LoRaWAN wireless remote dimming and dark-spot elimination.',
    category: 'Street Lighting',
    department: 'Electrical & Street Lighting',
    departmentId: 'dept_electrical',
    projectManagerId: 'pm-seed-3',
    projectManagerName: 'Er. Ramesh Sawant',
    contractorId: 'cont-04',
    contractorName: 'Lumina Smart Grids Ltd',
    location: {
      address: 'City Metropolitan West & East Grid',
      ward: 'Ward 15',
      city: 'Pune Metro',
      latitude: 18.528,
      longitude: 73.865,
    },
    startDate: '2025-08-10',
    plannedCompletionDate: '2026-02-28',
    actualCompletionDate: '2026-02-20',
    approvedBudget: 4.2,
    estimatedCost: 4.0,
    actualSpending: 3.95,
    progress: 100,
    expectedProgress: 100,
    budgetDeviation: calculateBudgetDeviation(4.2, 3.95),
    delayDays: 0,
    status: 'Completed',
    isPublic: true,
    riskScore: 0,
    riskLabel: 'Normal',
    milestonesCount: 4,
    completedMilestonesCount: 4,
    issuesCount: 1,
    unresolvedIssuesCount: 0,
    createdAt: '2025-08-01T10:00:00.000Z',
    updatedAt: '2026-02-22T17:45:00.000Z',
  };

  const p5: Project = {
    id: 'prj-seed-5',
    projectNumber: 'PRJ-2026-00105',
    name: 'Draft Civic Center Municipal Complex & Public Park',
    description: 'Internal planning draft for community recreation ground, municipal citizen service center, and public EV charging hub.',
    category: 'Public Buildings',
    department: 'General Public Works',
    departmentId: 'dept_public_works',
    projectManagerId: 'pm-seed-1',
    projectManagerName: 'Er. Rajesh Deshmukh',
    location: {
      address: 'Plot 44, Development Zone B',
      ward: 'Ward 6',
      city: 'Pune Metro',
      latitude: 18.508,
      longitude: 73.832,
    },
    startDate: '2026-06-01',
    plannedCompletionDate: '2027-04-30',
    approvedBudget: 18.0,
    estimatedCost: 18.5,
    actualSpending: 0,
    progress: 0,
    expectedProgress: 0,
    budgetDeviation: 0,
    delayDays: 0,
    status: 'Upcoming',
    isPublic: false, // Internal private draft
    riskScore: 0,
    riskLabel: 'Normal',
    milestonesCount: 3,
    completedMilestonesCount: 0,
    issuesCount: 0,
    unresolvedIssuesCount: 0,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  };

  return {
    [p1.id]: p1,
    [p2.id]: p2,
    [p3.id]: p3,
    [p4.id]: p4,
    [p5.id]: p5,
  };
}

function getInitialSeedMilestones(): Record<string, ProjectMilestone[]> {
  return {
    'prj-seed-1': [
      {
        id: 'ms-101',
        projectId: 'prj-seed-1',
        title: 'Geotechnical Soil Survey & Base Subgrade Compaction',
        description: 'Complete soil core sampling, CBR testing, and granular subbase compaction along 8.4 km corridor.',
        targetDate: '2026-02-15',
        actualDate: '2026-02-12',
        status: 'Completed',
        progressPercentage: 100,
        order: 1,
        weight: 20,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'ms-102',
        projectId: 'prj-seed-1',
        title: 'Stormwater Culvert Crossings & Kerb Lining',
        description: 'Installation of precast concrete culvert pipes and rainwater drainage channels along both shoulders.',
        targetDate: '2026-04-10',
        actualDate: '2026-04-05',
        status: 'Completed',
        progressPercentage: 100,
        order: 2,
        weight: 25,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'ms-103',
        projectId: 'prj-seed-1',
        title: 'Dense Bituminous Macadam (DBM) Base Layer',
        description: 'Paving 75mm thick hot mix asphalt DBM layer with electronic sensor paver.',
        targetDate: '2026-06-30',
        actualDate: '2026-06-25',
        status: 'Completed',
        progressPercentage: 100,
        order: 3,
        weight: 30,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'ms-104',
        projectId: 'prj-seed-1',
        title: 'Dedicated Cycling Track & Thermoplastic Lane Markings',
        description: 'High-visibility green acrylic surfaced cycle track, reflective road studs, and pedestrian crossings.',
        targetDate: '2026-09-15',
        status: 'In Progress',
        progressPercentage: 60,
        order: 4,
        weight: 15,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'ms-105',
        projectId: 'prj-seed-1',
        title: 'Smart Streetlight Poles & Final Commissioning Audit',
        description: 'Erection of 180 smart poles with energy metering and third-party quality safety certification.',
        targetDate: '2026-11-30',
        status: 'Pending',
        progressPercentage: 0,
        order: 5,
        weight: 10,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
    ],
    'prj-seed-2': [
      {
        id: 'ms-201',
        projectId: 'prj-seed-2',
        title: 'Land Demarcation & Utility Shifting Clearances',
        description: 'Underground electric cable and water line relocations alongside the primary canal path.',
        targetDate: '2025-12-15',
        actualDate: '2025-12-20',
        status: 'Completed',
        progressPercentage: 100,
        order: 1,
        weight: 25,
        createdAt: '2025-10-25T09:00:00.000Z',
      },
      {
        id: 'ms-202',
        projectId: 'prj-seed-2',
        title: 'Reinforced Box Culvert Channel Excavation',
        description: 'Heavy machinery canal deepening and silt evacuation across 3.2 km stretch.',
        targetDate: '2026-02-28',
        actualDate: '2026-03-15',
        status: 'Completed',
        progressPercentage: 100,
        order: 2,
        weight: 30,
        createdAt: '2025-10-25T09:00:00.000Z',
      },
      {
        id: 'ms-203',
        projectId: 'prj-seed-2',
        title: 'Concrete Retaining Wall Construction & Silt Trap Sump',
        description: 'Pouring M30 grade concrete retaining walls to prevent monsoon soil cave-ins.',
        targetDate: '2026-04-15',
        status: 'Delayed',
        progressPercentage: 45,
        order: 3,
        weight: 30,
        createdAt: '2025-10-25T09:00:00.000Z',
      },
      {
        id: 'ms-204',
        projectId: 'prj-seed-2',
        title: 'Safety Railings & High-Discharge Pump Installation',
        description: 'Perimeter protective railings and automated emergency stormwater release gate commissioning.',
        targetDate: '2026-05-15',
        status: 'Pending',
        progressPercentage: 0,
        order: 4,
        weight: 15,
        createdAt: '2025-10-25T09:00:00.000Z',
      },
    ],
  };
}

function getInitialSeedUpdates(): Record<string, ProjectUpdate[]> {
  return {
    'prj-seed-1': [
      {
        id: 'upd-101',
        projectId: 'prj-seed-1',
        title: 'Milestone 3 (DBM Asphalt Layer) Successfully Paved',
        content: 'The engineering team completed the dense bituminous macadam base along the entire 8.4 km stretch. Temperature quality checks met IRC-111 specifications with zero density deviations.',
        authorId: 'pm-seed-1',
        authorName: 'Er. Rajesh Deshmukh',
        authorRole: 'Project Manager',
        visibility: 'Public',
        pinned: true,
        createdAt: '2026-03-25T14:00:00.000Z',
      },
      {
        id: 'upd-102',
        projectId: 'prj-seed-1',
        title: 'Internal Audit: Minor vendor delay on streetlight delivery',
        content: 'Vendor batch for LoRa sensors delayed by 4 business days due to port customs. Does not compromise critical path milestone 4.',
        authorId: 'pm-seed-1',
        authorName: 'Er. Rajesh Deshmukh',
        authorRole: 'Project Manager',
        visibility: 'Internal',
        pinned: false,
        createdAt: '2026-03-22T09:30:00.000Z',
      },
      {
        id: 'upd-103',
        projectId: 'prj-seed-1',
        title: 'Traffic Diversion Advisory for Ward 12 Intersection',
        content: 'Northbound traffic will be redirected via Link Road between 10 PM and 5 AM this week to allow seamless thermoplastic line marking.',
        authorId: 'pm-seed-1',
        authorName: 'Er. Rajesh Deshmukh',
        authorRole: 'Project Manager',
        visibility: 'Public',
        pinned: false,
        createdAt: '2026-03-15T11:00:00.000Z',
      },
    ],
    'prj-seed-2': [
      {
        id: 'upd-201',
        projectId: 'prj-seed-2',
        title: 'Schedule Realignment & Monsoon Mitigation Action Plan',
        content: 'Subsoil water seepage required additional dewatering sumps. Work shifts have been augmented to double rotations to ensure completion prior to monsoon onset.',
        authorId: 'pm-seed-2',
        authorName: 'Er. Pooja Kulkarni',
        authorRole: 'Project Manager',
        visibility: 'Public',
        pinned: true,
        createdAt: '2026-03-24T16:30:00.000Z',
      },
      {
        id: 'upd-202',
        projectId: 'prj-seed-2',
        title: 'Contractor Cost Variation Notice - Steel Rebar Procurement',
        content: 'Contractor submitted cost overrun notice of ₹1.4 Cr for additional foundation stabilization piles. Department committee review underway.',
        authorId: 'pm-seed-2',
        authorName: 'Er. Pooja Kulkarni',
        authorRole: 'Project Manager',
        visibility: 'Internal',
        pinned: false,
        createdAt: '2026-03-20T10:15:00.000Z',
      },
    ],
  };
}

function getInitialSeedIssues(): Record<string, ProjectIssue[]> {
  return {
    'prj-seed-1': [
      {
        id: 'iss-101',
        projectId: 'prj-seed-1',
        title: 'Minor optical fiber cable snag near Sector 9 junction',
        description: 'Telecom trenching crew slightly damaged lateral curb lining; rectified within 24 hours under contractor warranty.',
        severity: 'Low',
        status: 'Resolved',
        reportedBy: 'pm-seed-1',
        reportedByName: 'Er. Rajesh Deshmukh',
        assignedTo: 'cont-01',
        assignedToName: 'Apex Urban Infra Tech Ltd',
        resolvedAt: '2026-03-12T15:00:00.000Z',
        resolutionNotes: 'Curb lining repoured and certified.',
        createdAt: '2026-03-10T11:00:00.000Z',
      },
    ],
    'prj-seed-2': [
      {
        id: 'iss-201',
        projectId: 'prj-seed-2',
        title: 'Unexpected high water-table seepage along culvert segment C-4',
        description: 'Excavation encountered perched water table requiring continuous submersible dewatering and structural retaining stabilization.',
        severity: 'High',
        status: 'In Progress',
        reportedBy: 'pm-seed-2',
        reportedByName: 'Er. Pooja Kulkarni',
        assignedTo: 'cont-02',
        assignedToName: 'Varun Hydraulic Engineers Pvt Ltd',
        createdAt: '2026-03-15T09:00:00.000Z',
      },
    ],
  };
}

function getInitialSeedDocuments(): Record<string, ProjectDocument[]> {
  return {
    'prj-seed-1': [
      {
        id: 'doc-101',
        projectId: 'prj-seed-1',
        title: 'Sanctioned Detailed Project Report (DPR)',
        fileName: 'DPR_RingRoad_Resurfacing_Sanctioned.pdf',
        fileUrl: '#',
        fileType: 'application/pdf',
        fileSize: 4200000,
        uploadedBy: 'pm-seed-1',
        uploadedByName: 'Er. Rajesh Deshmukh',
        isPublic: true,
        createdAt: '2026-01-12T10:00:00.000Z',
      },
      {
        id: 'doc-102',
        projectId: 'prj-seed-1',
        title: 'Environmental Clearance & Tree Preservation Certificate',
        fileName: 'EC_Preservation_Certificate_Ward12.pdf',
        fileUrl: '#',
        fileType: 'application/pdf',
        fileSize: 1850000,
        uploadedBy: 'pm-seed-1',
        uploadedByName: 'Er. Rajesh Deshmukh',
        isPublic: true,
        createdAt: '2026-01-15T14:00:00.000Z',
      },
    ],
  };
}

function getInitialSeedPhotos(): Record<string, ProjectPhoto[]> {
  return {
    'prj-seed-1': [
      {
        id: 'pho-101',
        projectId: 'prj-seed-1',
        caption: 'Pre-construction inspection of uneven carriage-way (Ward 12)',
        photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
        phase: 'Before',
        uploadedBy: 'pm-seed-1',
        uploadedByName: 'Er. Rajesh Deshmukh',
        isPublic: true,
        createdAt: '2026-01-15T11:00:00.000Z',
      },
      {
        id: 'pho-102',
        projectId: 'prj-seed-1',
        caption: 'Sensor asphalt paver laying dense bituminous macadam base layer',
        photoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
        phase: 'In Progress',
        uploadedBy: 'pm-seed-1',
        uploadedByName: 'Er. Rajesh Deshmukh',
        isPublic: true,
        createdAt: '2026-03-24T16:00:00.000Z',
      },
    ],
  };
}

function getInitialSeedActivities(): Record<string, ProjectActivity[]> {
  return {
    'prj-seed-1': [
      {
        id: 'act-101',
        projectId: 'prj-seed-1',
        action: 'PROJECT_CREATED',
        description: 'Project PRJ-2026-00101 sanctioned with approved budget ₹10.00 Cr.',
        actorId: 'pm-seed-1',
        actorName: 'Er. Rajesh Deshmukh',
        actorRole: 'project_manager',
        timestamp: '2026-01-10T10:00:00.000Z',
      },
      {
        id: 'act-102',
        projectId: 'prj-seed-1',
        action: 'MILESTONE_COMPLETED',
        description: 'Completed Milestone 3: Dense Bituminous Macadam (DBM) Base Layer.',
        actorId: 'pm-seed-1',
        actorName: 'Er. Rajesh Deshmukh',
        actorRole: 'project_manager',
        timestamp: '2026-03-25T14:00:00.000Z',
      },
    ],
  };
}

// Local storage loaders & savers
function getLocalProjects(): Record<string, Project> {
  const raw = safeGetItem(LOCAL_STORAGE_PROJECTS);
  if (!raw) {
    const seed = getInitialSeedProjects();
    saveLocalProjects(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedProjects();
  }
}

function saveLocalProjects(data: Record<string, Project>) {
  safeSetItem(LOCAL_STORAGE_PROJECTS, JSON.stringify(data));
}

function getLocalMilestones(): Record<string, ProjectMilestone[]> {
  const raw = safeGetItem(LOCAL_STORAGE_MILESTONES);
  if (!raw) {
    const seed = getInitialSeedMilestones();
    saveLocalMilestones(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedMilestones();
  }
}

function saveLocalMilestones(data: Record<string, ProjectMilestone[]>) {
  safeSetItem(LOCAL_STORAGE_MILESTONES, JSON.stringify(data));
}

function getLocalUpdates(): Record<string, ProjectUpdate[]> {
  const raw = safeGetItem(LOCAL_STORAGE_UPDATES);
  if (!raw) {
    const seed = getInitialSeedUpdates();
    saveLocalUpdates(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedUpdates();
  }
}

function saveLocalUpdates(data: Record<string, ProjectUpdate[]>) {
  safeSetItem(LOCAL_STORAGE_UPDATES, JSON.stringify(data));
}

function getLocalIssues(): Record<string, ProjectIssue[]> {
  const raw = safeGetItem(LOCAL_STORAGE_ISSUES);
  if (!raw) {
    const seed = getInitialSeedIssues();
    saveLocalIssues(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedIssues();
  }
}

function saveLocalIssues(data: Record<string, ProjectIssue[]>) {
  safeSetItem(LOCAL_STORAGE_ISSUES, JSON.stringify(data));
}

function getLocalDocuments(): Record<string, ProjectDocument[]> {
  const raw = safeGetItem(LOCAL_STORAGE_DOCUMENTS);
  if (!raw) {
    const seed = getInitialSeedDocuments();
    saveLocalDocuments(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedDocuments();
  }
}

function saveLocalDocuments(data: Record<string, ProjectDocument[]>) {
  safeSetItem(LOCAL_STORAGE_DOCUMENTS, JSON.stringify(data));
}

function getLocalPhotos(): Record<string, ProjectPhoto[]> {
  const raw = safeGetItem(LOCAL_STORAGE_PHOTOS);
  if (!raw) {
    const seed = getInitialSeedPhotos();
    saveLocalPhotos(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedPhotos();
  }
}

function saveLocalPhotos(data: Record<string, ProjectPhoto[]>) {
  safeSetItem(LOCAL_STORAGE_PHOTOS, JSON.stringify(data));
}

function getLocalActivities(): Record<string, ProjectActivity[]> {
  const raw = safeGetItem(LOCAL_STORAGE_ACTIVITIES);
  if (!raw) {
    const seed = getInitialSeedActivities();
    saveLocalActivities(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getInitialSeedActivities();
  }
}

function saveLocalActivities(data: Record<string, ProjectActivity[]>) {
  safeSetItem(LOCAL_STORAGE_ACTIVITIES, JSON.stringify(data));
}

// ==========================================
// PROJECT SERVICE EXPORTS
// ==========================================

export async function createProject(
  input: CreateProjectInput,
  author: UserProfile
): Promise<Project> {
  const projectId = `prj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const projectNumber = generateProjectNumber();
  const nowIso = new Date().toISOString();

  const actualSpending = input.actualSpending ?? 0;
  const progress = Math.min(100, Math.max(0, input.progress ?? 0));
  const expectedProgress = progress;
  const deviation = calculateBudgetDeviation(input.approvedBudget, actualSpending);
  const delayDays = calculateDelayDays(input.plannedCompletionDate);
  const riskResult = calculateCivicSightRisk(
    input.approvedBudget,
    actualSpending,
    progress,
    expectedProgress,
    delayDays,
    0
  );

  const newProject: Project = {
    id: projectId,
    projectNumber,
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    department: input.department,
    departmentId: input.departmentId,
    projectManagerId: author.uid,
    projectManagerName: author.displayName || author.username,
    contractorId: input.contractorId,
    contractorName: input.contractorName,
    location: input.location,
    startDate: input.startDate,
    plannedCompletionDate: input.plannedCompletionDate,
    expectedCompletionDate: input.plannedCompletionDate,
    approvedBudget: input.approvedBudget,
    estimatedCost: input.estimatedCost,
    actualSpending,
    progress,
    expectedProgress,
    budgetDeviation: deviation,
    delayDays,
    status: input.status || 'Upcoming',
    isPublic: input.isPublic,
    riskScore: riskResult.score,
    riskLabel: riskResult.level,
    milestonesCount: input.initialMilestones?.length || 0,
    completedMilestonesCount: 0,
    issuesCount: 0,
    unresolvedIssuesCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId);
      await setDoc(docRef, {
        ...newProject,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // fallback to local store
    }
  }

  // Update local store
  const allProjects = getLocalProjects();
  allProjects[projectId] = newProject;
  saveLocalProjects(allProjects);

  // If initial milestones provided
  if (input.initialMilestones && input.initialMilestones.length > 0) {
    const milestones = input.initialMilestones.map((m, idx) => ({
      id: `ms_${Date.now()}_${idx}`,
      projectId,
      title: m.title.trim(),
      description: m.description.trim(),
      targetDate: m.targetDate,
      status: 'Pending' as const,
      progressPercentage: 0,
      order: idx + 1,
      weight: m.weight || Math.round(100 / input.initialMilestones!.length),
      createdAt: nowIso,
    }));

    const allMilestones = getLocalMilestones();
    allMilestones[projectId] = milestones;
    saveLocalMilestones(allMilestones);

    if (isFirebaseConfigured && db) {
      try {
        for (const ms of milestones) {
          const msRef = doc(db, 'projects', projectId, 'milestones', ms.id);
          await setDoc(msRef, {
            ...ms,
            createdAt: serverTimestamp(),
          });
        }
      } catch {
        // fallback
      }
    }
  }

  // Log activity
  await logProjectActivity(
    projectId,
    'PROJECT_CREATED',
    `Project ${projectNumber} created with approved budget ₹${input.approvedBudget} Cr by ${author.displayName || author.username}`,
    author
  );

  void logAuditEvent({
    actorUid: author.uid,
    actorName: author.displayName || author.username,
    actorRole: author.role,
    actionType: 'project_created',
    actionTitle: `Project Created: ${projectNumber}`,
    entityType: 'project',
    entityId: projectId,
    entityNumber: projectNumber,
    summary: `Project "${newProject.name}" sanctioned with approved budget ₹${newProject.approvedBudget} Cr.`,
    beforeState: null,
    afterState: { approvedBudget: newProject.approvedBudget, status: newProject.status, category: newProject.category },
    isPublic: newProject.isPublic,
  });

  return newProject;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  actor: UserProfile
): Promise<Project> {
  const existing = await getProjectById(projectId, true);
  if (!existing) {
    throw new Error('Project not found');
  }

  const nowIso = new Date().toISOString();
  const approvedBudget = input.approvedBudget !== undefined ? input.approvedBudget : existing.approvedBudget;
  const actualSpending = input.actualSpending !== undefined ? input.actualSpending : existing.actualSpending;
  const progress = input.progress !== undefined ? Math.min(100, Math.max(0, input.progress)) : existing.progress;
  const plannedCompletionDate = input.plannedCompletionDate || existing.plannedCompletionDate;
  const delayDays = calculateDelayDays(plannedCompletionDate, input.actualCompletionDate || existing.actualCompletionDate);
  const budgetDeviation = calculateBudgetDeviation(approvedBudget, actualSpending);
  const riskResult = calculateCivicSightRisk(
    approvedBudget,
    actualSpending,
    progress,
    existing.expectedProgress || progress,
    delayDays,
    existing.unresolvedIssuesCount
  );

  const updatedProject: Project = {
    ...existing,
    ...input,
    id: existing.id, // Immutable
    projectNumber: existing.projectNumber, // Immutable
    approvedBudget,
    actualSpending,
    progress,
    delayDays,
    budgetDeviation,
    riskScore: riskResult.score,
    riskLabel: riskResult.level,
    updatedAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId);
      await updateDoc(docRef, {
        ...updatedProject,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  const allProjects = getLocalProjects();
  allProjects[projectId] = updatedProject;
  saveLocalProjects(allProjects);

  await logProjectActivity(
    projectId,
    'PROJECT_UPDATED',
    `Project updated by ${actor.displayName || actor.username} (${actor.role})`,
    actor
  );

  void logAuditEvent({
    actorUid: actor.uid,
    actorName: actor.displayName || actor.username,
    actorRole: actor.role,
    actionType: input.status && input.status !== existing.status ? 'project_status_changed' : 'project_updated',
    actionTitle: `Project Updated: ${existing.projectNumber}`,
    entityType: 'project',
    entityId: projectId,
    entityNumber: existing.projectNumber,
    summary: `Project updated by ${actor.displayName || actor.username} (${actor.role}). Progress: ${updatedProject.progress}%, Status: ${updatedProject.status}.`,
    beforeState: { progress: existing.progress, status: existing.status, spending: existing.actualSpending },
    afterState: { progress: updatedProject.progress, status: updatedProject.status, spending: updatedProject.actualSpending },
    isPublic: updatedProject.isPublic,
  });

  return updatedProject;
}

export async function getProjectById(
  projectId: string,
  isAuthority = false
): Promise<Project | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as Project;
        if (!isAuthority && !data.isPublic) {
          return null;
        }
        return data;
      }
    } catch {
      // fallback
    }
  }

  const allProjects = getLocalProjects();
  const found = allProjects[projectId] || null;
  if (found && !isAuthority && !found.isPublic) {
    return null;
  }
  return found;
}

export async function getProjects(filters?: {
  isAuthority?: boolean;
  category?: string;
  status?: string;
  ward?: string;
  searchQuery?: string;
}): Promise<Project[]> {
  const isAuthority = filters?.isAuthority ?? false;
  let list: Project[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const projectsCol = collection(db, 'projects');
      const q = isAuthority
        ? query(projectsCol, orderBy('createdAt', 'desc'))
        : query(projectsCol, where('isPublic', '==', true), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      list = snapshot.docs.map((d) => d.data() as Project);
    } catch {
      list = [];
    }
  }

  if (list.length === 0) {
    const all = getLocalProjects();
    list = Object.values(all);
    if (!isAuthority) {
      list = list.filter((p) => p.isPublic);
    }
  }

  // Apply filters
  if (filters?.category && filters.category !== 'All') {
    list = list.filter((p) => p.category === filters.category);
  }

  if (filters?.status && filters.status !== 'All') {
    list = list.filter((p) => p.status.toLowerCase() === filters.status!.toLowerCase());
  }

  if (filters?.ward && filters.ward !== 'All') {
    list = list.filter((p) => p.location.ward === filters.ward);
  }

  if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.projectNumber.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.location.address && p.location.address.toLowerCase().includes(q))
    );
  }

  return list;
}

// ==========================================
// MILESTONES SERVICE
// ==========================================

export async function getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  if (isFirebaseConfigured && db) {
    try {
      const msCol = collection(db, 'projects', projectId, 'milestones');
      const q = query(msCol, orderBy('order', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ProjectMilestone);
      }
    } catch {
      // fallback
    }
  }

  const all = getLocalMilestones();
  return (all[projectId] || []).sort((a, b) => a.order - b.order);
}

export async function addMilestone(
  projectId: string,
  input: CreateMilestoneInput,
  actor: UserProfile
): Promise<ProjectMilestone> {
  const milestoneId = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newMilestone: ProjectMilestone = {
    id: milestoneId,
    projectId,
    title: input.title.trim(),
    description: input.description.trim(),
    targetDate: input.targetDate,
    status: input.status || 'Pending',
    progressPercentage: input.progressPercentage ?? 0,
    order: input.order ?? 1,
    weight: input.weight,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId, 'milestones', milestoneId);
      await setDoc(docRef, {
        ...newMilestone,
        createdAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  const all = getLocalMilestones();
  const list = all[projectId] || [];
  list.push(newMilestone);
  all[projectId] = list;
  saveLocalMilestones(all);

  // Update project milestone counters
  const projects = getLocalProjects();
  if (projects[projectId]) {
    projects[projectId].milestonesCount = list.length;
    projects[projectId].completedMilestonesCount = list.filter((m) => m.status.toLowerCase() === 'completed').length;
    saveLocalProjects(projects);
  }

  await logProjectActivity(
    projectId,
    'MILESTONE_ADDED',
    `Added milestone "${newMilestone.title}" by ${actor.displayName || actor.username}`,
    actor
  );

  return newMilestone;
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  updates: Partial<ProjectMilestone>,
  actor: UserProfile
): Promise<ProjectMilestone> {
  const all = getLocalMilestones();
  const list = all[projectId] || [];
  const idx = list.findIndex((m) => m.id === milestoneId);
  if (idx === -1) {
    throw new Error('Milestone not found');
  }

  const nowIso = new Date().toISOString();
  const updated: ProjectMilestone = {
    ...list[idx],
    ...updates,
    id: list[idx].id,
    projectId,
    updatedAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId, 'milestones', milestoneId);
      await updateDoc(docRef, {
        ...updated,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  list[idx] = updated;
  all[projectId] = list;
  saveLocalMilestones(all);

  // Update project milestone counters & overall progress if applicable
  const projects = getLocalProjects();
  if (projects[projectId]) {
    projects[projectId].completedMilestonesCount = list.filter((m) => m.status.toLowerCase() === 'completed').length;
    // Auto-compute average milestone progress if multiple milestones exist
    if (list.length > 0) {
      const avgProgress = Math.round(
        list.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0) / list.length
      );
      projects[projectId].progress = avgProgress;
    }
    saveLocalProjects(projects);
  }

  // Trigger notification if milestone is completed
  if (updated.status.toLowerCase() === 'completed') {
    const proj = projects[projectId];
    void createNotification({
      recipientId: 'pm-seed-1',
      type: 'project_milestone_completed',
      category: 'project',
      title: `Milestone Completed: ${updated.title}`,
      message: `Milestone "${updated.title}" for ${proj ? proj.name : 'project'} was officially completed.`,
      entityType: 'project',
      entityId: projectId,
      entityNumber: proj ? proj.projectNumber : undefined,
      actionUrl: `/dashboard/project-manager/projects/${projectId}`,
      priority: 'normal',
    });
  }

  await logProjectActivity(
    projectId,
    'MILESTONE_UPDATED',
    `Updated milestone "${updated.title}" (Status: ${updated.status}, ${updated.progressPercentage}%)`,
    actor
  );

  return updated;
}

export async function deleteMilestone(
  projectId: string,
  milestoneId: string,
  actor: UserProfile
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId, 'milestones', milestoneId);
      await deleteDoc(docRef);
    } catch {
      // fallback
    }
  }

  const all = getLocalMilestones();
  const list = (all[projectId] || []).filter((m) => m.id !== milestoneId);
  all[projectId] = list;
  saveLocalMilestones(all);

  const projects = getLocalProjects();
  if (projects[projectId]) {
    projects[projectId].milestonesCount = list.length;
    projects[projectId].completedMilestonesCount = list.filter((m) => m.status.toLowerCase() === 'completed').length;
    saveLocalProjects(projects);
  }

  await logProjectActivity(
    projectId,
    'MILESTONE_DELETED',
    `Deleted milestone by ${actor.displayName || actor.username}`,
    actor
  );
}

// ==========================================
// PROJECT UPDATES SERVICE (ISOLATION ENFORCED)
// ==========================================

export async function getProjectUpdates(
  projectId: string,
  isAuthority = false
): Promise<ProjectUpdate[]> {
  let updates: ProjectUpdate[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const upCol = collection(db, 'projects', projectId, 'updates');
      const q = isAuthority
        ? query(upCol, orderBy('createdAt', 'desc'))
        : query(upCol, where('visibility', 'in', ['Public', 'public']), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        updates = snap.docs.map((d) => d.data() as ProjectUpdate);
      }
    } catch {
      // fallback
    }
  }

  if (updates.length === 0) {
    const all = getLocalUpdates();
    updates = all[projectId] || [];
  }

  // Strict isolation filter: Citizens must NEVER receive internal updates
  if (!isAuthority) {
    updates = updates.filter(
      (u) => u.visibility === 'Public' || u.visibility === 'public'
    );
  }

  return updates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addProjectUpdate(
  projectId: string,
  input: CreateProjectUpdateInput,
  actor: UserProfile
): Promise<ProjectUpdate> {
  const updateId = `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newUpdate: ProjectUpdate = {
    id: updateId,
    projectId,
    title: input.title.trim(),
    content: input.content.trim(),
    authorId: actor.uid,
    authorName: actor.displayName || actor.username,
    authorRole: actor.role === 'project_manager' ? 'Project Manager' : actor.role,
    visibility: input.visibility,
    pinned: input.pinned ?? false,
    attachments: input.attachments,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId, 'updates', updateId);
      await setDoc(docRef, {
        ...newUpdate,
        createdAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  const all = getLocalUpdates();
  const list = all[projectId] || [];
  list.unshift(newUpdate);
  all[projectId] = list;
  saveLocalUpdates(all);

  await logProjectActivity(
    projectId,
    'UPDATE_POSTED',
    `Posted ${input.visibility} update: "${newUpdate.title}"`,
    actor
  );

  return newUpdate;
}

// ==========================================
// PROJECT ISSUES SERVICE
// ==========================================

export async function getProjectIssues(
  projectId: string,
  isAuthority = false
): Promise<ProjectIssue[]> {
  void isAuthority;
  if (isFirebaseConfigured && db) {
    try {
      const issCol = collection(db, 'projects', projectId, 'issues');
      const q = query(issCol, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ProjectIssue);
      }
    } catch {
      // fallback
    }
  }

  const all = getLocalIssues();
  return (all[projectId] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addProjectIssue(
  projectId: string,
  input: CreateProjectIssueInput,
  actor: UserProfile
): Promise<ProjectIssue> {
  const issueId = `iss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newIssue: ProjectIssue = {
    id: issueId,
    projectId,
    title: input.title.trim(),
    description: input.description.trim(),
    severity: input.severity,
    status: 'Open',
    reportedBy: actor.uid,
    reportedByName: actor.displayName || actor.username,
    assignedTo: input.assignedTo,
    assignedToName: input.assignedToName,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId, 'issues', issueId);
      await setDoc(docRef, {
        ...newIssue,
        createdAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  const all = getLocalIssues();
  const list = all[projectId] || [];
  list.unshift(newIssue);
  all[projectId] = list;
  saveLocalIssues(all);

  // Update unresolved issues count in project
  const projects = getLocalProjects();
  if (projects[projectId]) {
    projects[projectId].issuesCount = list.length;
    projects[projectId].unresolvedIssuesCount = list.filter(
      (i) => i.status.toLowerCase() !== 'resolved' && i.status.toLowerCase() !== 'closed'
    ).length;
    saveLocalProjects(projects);
  }

  await logProjectActivity(
    projectId,
    'ISSUE_LOGGED',
    `Logged ${input.severity} severity issue: "${newIssue.title}"`,
    actor
  );

  // Trigger alert for Project Manager if high/critical severity
  if (input.severity === 'Critical' || input.severity === 'High') {
    void createNotification({
      recipientId: 'pm-seed-1',
      type: 'project_issue_logged',
      category: 'project',
      title: `Project Issue Logged: ${input.severity}`,
      message: `${actor.displayName || actor.username} logged ${input.severity.toLowerCase()} issue "${newIssue.title}".`,
      entityType: 'project',
      entityId: projectId,
      actionUrl: `/dashboard/project-manager/projects/${projectId}`,
      priority: input.severity === 'Critical' ? 'urgent' : 'high',
    });
  }

  return newIssue;
}

export async function updateProjectIssue(
  projectId: string,
  issueId: string,
  updates: Partial<ProjectIssue>,
  actor: UserProfile
): Promise<ProjectIssue> {
  const all = getLocalIssues();
  const list = all[projectId] || [];
  const idx = list.findIndex((i) => i.id === issueId);
  if (idx === -1) {
    throw new Error('Issue not found');
  }

  const nowIso = new Date().toISOString();
  const updated: ProjectIssue = {
    ...list[idx],
    ...updates,
    id: list[idx].id,
    projectId,
    updatedAt: nowIso,
  };

  if (updates.status === 'Resolved' || updates.status === 'resolved') {
    updated.resolvedAt = nowIso;
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'projects', projectId, 'issues', issueId);
      await updateDoc(docRef, {
        ...updated,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  list[idx] = updated;
  all[projectId] = list;
  saveLocalIssues(all);

  // Recalculate unresolved issues on project
  const projects = getLocalProjects();
  if (projects[projectId]) {
    projects[projectId].unresolvedIssuesCount = list.filter(
      (i) => i.status.toLowerCase() !== 'resolved' && i.status.toLowerCase() !== 'closed'
    ).length;
    saveLocalProjects(projects);
  }

  await logProjectActivity(
    projectId,
    'ISSUE_STATUS_CHANGED',
    `Issue "${updated.title}" status changed to ${updated.status}`,
    actor
  );

  return updated;
}

// ==========================================
// DOCUMENTS & PHOTOS SERVICE
// ==========================================

export async function getProjectDocuments(
  projectId: string,
  isAuthority = false
): Promise<ProjectDocument[]> {
  const all = getLocalDocuments();
  let list = all[projectId] || [];
  if (!isAuthority) {
    list = list.filter((d) => d.isPublic);
  }
  return list;
}

export async function addProjectDocument(
  projectId: string,
  docInput: Omit<ProjectDocument, 'id' | 'projectId' | 'createdAt'>,
  actor: UserProfile
): Promise<ProjectDocument> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newDoc: ProjectDocument = {
    ...docInput,
    id: docId,
    projectId,
    createdAt: nowIso,
  };

  const all = getLocalDocuments();
  const list = all[projectId] || [];
  list.unshift(newDoc);
  all[projectId] = list;
  saveLocalDocuments(all);

  await logProjectActivity(
    projectId,
    'DOCUMENT_UPLOADED',
    `Uploaded document "${newDoc.title}" (${newDoc.fileName})`,
    actor
  );

  return newDoc;
}

export async function getProjectPhotos(
  projectId: string,
  isAuthority = false
): Promise<ProjectPhoto[]> {
  const all = getLocalPhotos();
  let list = all[projectId] || [];
  if (!isAuthority) {
    list = list.filter((p) => p.isPublic);
  }
  return list;
}

export async function addProjectPhoto(
  projectId: string,
  photoInput: Omit<ProjectPhoto, 'id' | 'projectId' | 'createdAt'>,
  actor: UserProfile
): Promise<ProjectPhoto> {
  const photoId = `pho_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newPhoto: ProjectPhoto = {
    ...photoInput,
    id: photoId,
    projectId,
    createdAt: nowIso,
  };

  const all = getLocalPhotos();
  const list = all[projectId] || [];
  list.unshift(newPhoto);
  all[projectId] = list;
  saveLocalPhotos(all);

  await logProjectActivity(
    projectId,
    'PHOTO_UPLOADED',
    `Uploaded photo: "${newPhoto.caption}"`,
    actor
  );

  return newPhoto;
}

// ==========================================
// ACTIVITY LOG SERVICE
// ==========================================

export async function getProjectActivities(projectId: string): Promise<ProjectActivity[]> {
  const all = getLocalActivities();
  return (all[projectId] || []).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function logProjectActivity(
  projectId: string,
  action: string,
  description: string,
  actor: UserProfile,
  details?: Record<string, unknown>
): Promise<ProjectActivity> {
  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const activity: ProjectActivity = {
    id: actId,
    projectId,
    action,
    description,
    actorId: actor.uid,
    actorName: actor.displayName || actor.username,
    actorRole: actor.role,
    timestamp: nowIso,
    details,
  };

  const all = getLocalActivities();
  const list = all[projectId] || [];
  list.unshift(activity);
  all[projectId] = list;
  saveLocalActivities(all);

  return activity;
}
