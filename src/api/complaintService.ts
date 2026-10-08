import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebase';
import type {
  Complaint,
  ComplaintUpdate,
  ComplaintAttachment,
  CreateComplaintInput,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintSeverity,
} from '../types/complaint';
import type { UserProfile } from '../types';
import { generateComplaintNumber } from '../utils/complaintIdGenerator';
import { calculateSLAStatus } from '../utils/slaCalculator';

const LOCAL_STORAGE_COMPLAINTS = 'civicsight_local_complaints';
const LOCAL_STORAGE_UPDATES = 'civicsight_local_complaint_updates';

function getLocalComplaints(): Record<string, Complaint> {
  try {
    const raw = sessionStorage.getItem(LOCAL_STORAGE_COMPLAINTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalComplaints(data: Record<string, Complaint>) {
  try {
    sessionStorage.setItem(LOCAL_STORAGE_COMPLAINTS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getLocalUpdates(): Record<string, ComplaintUpdate[]> {
  try {
    const raw = sessionStorage.getItem(LOCAL_STORAGE_UPDATES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUpdates(data: Record<string, ComplaintUpdate[]>) {
  try {
    sessionStorage.setItem(LOCAL_STORAGE_UPDATES, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Uploads a file to Firebase Storage (or base64 fallback in offline dev mode).
 */
export async function uploadComplaintAttachment(
  complaintId: string,
  file: File,
  folder: 'attachments' | 'resolution',
  uploadedBy: string
): Promise<ComplaintAttachment> {
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileName = file.name;
  const contentType = file.type;
  const size = file.size;
  const nowIso = new Date().toISOString();

  if (isFirebaseConfigured && storage) {
    const storagePath = `complaints/${complaintId}/${folder}/${fileId}_${fileName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return {
      id: fileId,
      fileName,
      storagePath,
      downloadURL,
      contentType,
      size,
      uploadedBy,
      createdAt: nowIso,
    };
  }

  // Offline / local preview fallback using FileReader
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        id: fileId,
        fileName,
        storagePath: `local/${folder}/${fileName}`,
        downloadURL: (e.target?.result as string) || '',
        contentType,
        size,
        uploadedBy,
        createdAt: nowIso,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a new Citizen Complaint.
 */
export async function createComplaint(
  input: CreateComplaintInput,
  user: UserProfile,
  attachmentFiles: File[] = []
): Promise<Complaint> {
  const nowIso = new Date().toISOString();
  let complaintId: string;
  let complaintNumber: string;

  if (isFirebaseConfigured && db) {
    const newDocRef = doc(collection(db, 'complaints'));
    complaintId = newDocRef.id;
    complaintNumber = generateComplaintNumber();
  } else {
    complaintId = `cmp_${Date.now()}`;
    complaintNumber = generateComplaintNumber();
  }

  // Upload attachments
  const uploadedAttachments: ComplaintAttachment[] = [];
  for (const file of attachmentFiles) {
    const att = await uploadComplaintAttachment(complaintId, file, 'attachments', user.username);
    uploadedAttachments.push(att);
  }

  const newComplaint: Complaint = {
    id: complaintId,
    complaintNumber,
    citizenId: user.uid,
    citizenName: user.displayName || user.username,
    citizenEmail: user.email,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    priority: input.priority || 'medium',
    severity: input.severity || 'moderate',
    status: 'submitted',
    location: input.location,
    projectId: input.projectId,
    attachments: uploadedAttachments,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const initialUpdate: ComplaintUpdate = {
    id: `upd_${Date.now()}`,
    complaintId,
    actorId: user.uid,
    actorName: user.displayName || user.username,
    actorRole: 'citizen',
    action: 'Complaint Submitted',
    status: 'submitted',
    message: 'Grievance submitted by citizen and queued for municipal department verification.',
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'complaints', complaintId), {
      ...newComplaint,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'complaints', complaintId, 'updates', initialUpdate.id), initialUpdate);
  } else {
    const local = getLocalComplaints();
    local[complaintId] = newComplaint;
    saveLocalComplaints(local);

    const localUpdates = getLocalUpdates();
    localUpdates[complaintId] = [initialUpdate];
    saveLocalUpdates(localUpdates);
  }

  return newComplaint;
}

/**
 * Queries citizen's own complaints.
 */
export async function getCitizenComplaints(
  citizenId: string,
  filters?: {
    status?: string;
    category?: string;
    priority?: string;
    searchQuery?: string;
    sortBy?: 'latest' | 'oldest';
  }
): Promise<Complaint[]> {
  let list: Complaint[] = [];

  if (isFirebaseConfigured && db && citizenId) {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('citizenId', '==', citizenId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Complaint);
    } catch (err) {
      console.warn('[CivicSight] Error querying citizen complaints:', err);
    }
  }

  if (list.length === 0) {
    const local = getLocalComplaints();
    list = Object.values(local).filter((c) => c.citizenId === citizenId);
  }

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((c) => c.category === filters.category);
  }
  if (filters?.priority && filters.priority !== 'all') {
    list = list.filter((c) => c.priority === filters.priority);
  }
  if (filters?.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(queryLower) ||
        c.complaintNumber.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower) ||
        (c.location?.address && c.location.address.toLowerCase().includes(queryLower))
    );
  }

  list.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return filters?.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  return list;
}

/**
 * Authority: Queries all municipal complaints.
 */
export async function getAllComplaints(filters?: {
  status?: string;
  category?: string;
  priority?: string;
  departmentId?: string;
  searchQuery?: string;
  sortBy?: 'latest' | 'oldest';
}): Promise<Complaint[]> {
  let list: Complaint[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Complaint);
    } catch (err) {
      console.warn('[CivicSight] Error querying all complaints:', err);
    }
  }

  if (list.length === 0) {
    const local = getLocalComplaints();
    list = Object.values(local);
  }

  // Recalculate SLA statuses dynamically on read
  list = list.map((c) => {
    if (c.sla?.deadline) {
      const isDone = c.status === 'resolved' || c.status === 'closed';
      const calc = calculateSLAStatus(c.sla.deadline, isDone);
      return {
        ...c,
        sla: {
          deadline: c.sla.deadline,
          status: calc.status,
          hoursRemaining: calc.hoursRemaining,
        },
      };
    }
    return c;
  });

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((c) => c.category === filters.category);
  }
  if (filters?.priority && filters.priority !== 'all') {
    list = list.filter((c) => c.priority === filters.priority);
  }
  if (filters?.departmentId && filters.departmentId !== 'all') {
    list = list.filter((c) => c.departmentId === filters.departmentId);
  }
  if (filters?.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(queryLower) ||
        c.complaintNumber.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower) ||
        c.citizenName.toLowerCase().includes(queryLower)
    );
  }

  list.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return filters?.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  return list;
}

/**
 * Fetches a single complaint by ID.
 */
export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'complaints', complaintId));
      if (snap.exists()) {
        const c = snap.data() as Complaint;
        if (c.sla?.deadline) {
          const isDone = c.status === 'resolved' || c.status === 'closed';
          const calc = calculateSLAStatus(c.sla.deadline, isDone);
          return {
            ...c,
            sla: {
              deadline: c.sla.deadline,
              status: calc.status,
              hoursRemaining: calc.hoursRemaining,
            },
          };
        }
        return c;
      }
    } catch (err) {
      console.warn('[CivicSight] Error fetching complaint by ID:', err);
    }
  }

  const local = getLocalComplaints();
  const found = local[complaintId] || null;
  if (found && found.sla?.deadline) {
    const isDone = found.status === 'resolved' || found.status === 'closed';
    const calc = calculateSLAStatus(found.sla.deadline, isDone);
    return {
      ...found,
      sla: {
        deadline: found.sla.deadline,
        status: calc.status,
        hoursRemaining: calc.hoursRemaining,
      },
    };
  }
  return found;
}

/**
 * Fetches timeline updates.
 * For Citizens: strictly filters out internal authority notes.
 * For Authority: includes all public updates and internal notes.
 */
export async function getComplaintUpdates(
  complaintId: string,
  userRole: string
): Promise<ComplaintUpdate[]> {
  let updates: ComplaintUpdate[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'complaints', complaintId, 'updates'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      updates = snap.docs.map((d) => d.data() as ComplaintUpdate);
    } catch (err) {
      console.warn('[CivicSight] Error querying updates:', err);
    }
  }

  if (updates.length === 0) {
    const localUpdates = getLocalUpdates();
    updates = localUpdates[complaintId] || [];
  }

  // Enforce security boundary: Citizens must NEVER see internal authority remarks
  if (userRole === 'citizen') {
    return updates.filter((u) => !u.isInternal);
  }

  return updates;
}

/**
 * Authority: Assigns department, responsible officer, SLA hours, priority, and severity.
 */
export async function assignDepartmentAndOfficer(
  complaintId: string,
  deptId: string,
  deptName: string,
  officerId: string,
  officerName: string,
  priority: ComplaintPriority,
  severity: ComplaintSeverity,
  slaHours: number,
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();
  const deadlineDate = new Date(Date.now() + slaHours * 3600000).toISOString();

  const updatePayload = {
    departmentId: deptId,
    departmentName: deptName,
    assignedOfficerId: officerId,
    assignedOfficerName: officerName,
    priority,
    severity,
    status: 'assigned' as ComplaintStatus,
    sla: {
      deadline: deadlineDate,
      status: 'on_track' as const,
      hoursRemaining: slaHours,
    },
    updatedAt: nowIso,
  };

  const updateLog: ComplaintUpdate = {
    id: `upd_${Date.now()}`,
    complaintId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: 'Department & Officer Assigned',
    status: 'assigned',
    message: `Assigned to ${deptName} (Officer: ${officerName}) with an official ${slaHours}-hour resolution SLA deadline.`,
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'complaints', complaintId), updatePayload);
    await setDoc(doc(db, 'complaints', complaintId, 'updates', updateLog.id), updateLog);
  } else {
    const local = getLocalComplaints();
    if (local[complaintId]) {
      local[complaintId] = { ...local[complaintId], ...updatePayload };
      saveLocalComplaints(local);
    }
    const localUpdates = getLocalUpdates();
    if (!localUpdates[complaintId]) localUpdates[complaintId] = [];
    localUpdates[complaintId].push(updateLog);
    saveLocalUpdates(localUpdates);
  }
}

/**
 * Authority: Updates complaint status with an official timeline message.
 */
export async function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  message: string,
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  const updateLog: ComplaintUpdate = {
    id: `upd_${Date.now()}`,
    complaintId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: `Status Updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
    status: newStatus,
    message,
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'complaints', complaintId), {
      status: newStatus,
      updatedAt: nowIso,
    });
    await setDoc(doc(db, 'complaints', complaintId, 'updates', updateLog.id), updateLog);
  } else {
    const local = getLocalComplaints();
    if (local[complaintId]) {
      local[complaintId].status = newStatus;
      local[complaintId].updatedAt = nowIso;
      saveLocalComplaints(local);
    }
    const localUpdates = getLocalUpdates();
    if (!localUpdates[complaintId]) localUpdates[complaintId] = [];
    localUpdates[complaintId].push(updateLog);
    saveLocalUpdates(localUpdates);
  }
}

/**
 * Authority: Adds an internal note strictly hidden from citizen view.
 */
export async function addInternalNote(
  complaintId: string,
  note: string,
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  const noteLog: ComplaintUpdate = {
    id: `upd_${Date.now()}`,
    complaintId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: 'Internal Authority Note',
    message: note,
    isInternal: true, // Marked strictly as authority internal
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'complaints', complaintId, 'updates', noteLog.id), noteLog);
  } else {
    const localUpdates = getLocalUpdates();
    if (!localUpdates[complaintId]) localUpdates[complaintId] = [];
    localUpdates[complaintId].push(noteLog);
    saveLocalUpdates(localUpdates);
  }
}

/**
 * Authority: Resolves complaint and uploads resolution evidence proof.
 */
export async function resolveComplaint(
  complaintId: string,
  summary: string,
  proofFiles: File[],
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  const proofAttachments: ComplaintAttachment[] = [];
  for (const f of proofFiles) {
    const att = await uploadComplaintAttachment(complaintId, f, 'resolution', authorityUser.username);
    proofAttachments.push(att);
  }

  const resolutionData = {
    summary,
    resolvedBy: authorityUser.displayName || authorityUser.username,
    resolvedAt: nowIso,
    proofAttachments,
  };

  const updateLog: ComplaintUpdate = {
    id: `upd_${Date.now()}`,
    complaintId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: 'Issue Resolved with Verification Proof',
    status: 'resolved',
    message: `Work completed: ${summary}`,
    isInternal: false,
    attachments: proofAttachments,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'complaints', complaintId), {
      status: 'resolved',
      resolution: resolutionData,
      updatedAt: nowIso,
    });
    await setDoc(doc(db, 'complaints', complaintId, 'updates', updateLog.id), updateLog);
  } else {
    const local = getLocalComplaints();
    if (local[complaintId]) {
      local[complaintId].status = 'resolved';
      local[complaintId].resolution = resolutionData;
      local[complaintId].updatedAt = nowIso;
      saveLocalComplaints(local);
    }
    const localUpdates = getLocalUpdates();
    if (!localUpdates[complaintId]) localUpdates[complaintId] = [];
    localUpdates[complaintId].push(updateLog);
    saveLocalUpdates(localUpdates);
  }
}

/**
 * Citizen: Submits satisfaction rating (1-5) and feedback comment, moving complaint to Closed.
 */
export async function submitComplaintFeedback(
  complaintId: string,
  rating: number,
  comment: string,
  citizenUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  const feedbackData = {
    rating,
    comment: comment.trim(),
    submittedAt: nowIso,
  };

  const updateLog: ComplaintUpdate = {
    id: `upd_${Date.now()}`,
    complaintId,
    actorId: citizenUser.uid,
    actorName: citizenUser.displayName || citizenUser.username,
    actorRole: 'citizen',
    action: 'Citizen Feedback Submitted & Case Closed',
    status: 'closed',
    message: `Citizen verified resolution and awarded a ${rating}-star rating.${comment ? ` Feedback: "${comment}"` : ''}`,
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'complaints', complaintId), {
      status: 'closed',
      feedback: feedbackData,
      updatedAt: nowIso,
    });
    await setDoc(doc(db, 'complaints', complaintId, 'updates', updateLog.id), updateLog);
  } else {
    const local = getLocalComplaints();
    if (local[complaintId]) {
      local[complaintId].status = 'closed';
      local[complaintId].feedback = feedbackData;
      local[complaintId].updatedAt = nowIso;
      saveLocalComplaints(local);
    }
    const localUpdates = getLocalUpdates();
    if (!localUpdates[complaintId]) localUpdates[complaintId] = [];
    localUpdates[complaintId].push(updateLog);
    saveLocalUpdates(localUpdates);
  }
}
