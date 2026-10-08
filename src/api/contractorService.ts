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
  runTransaction,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebase';
import type {
  ContractorSubmission,
  CreateSubmissionInput,
  ReviewSubmissionInput,
  ContractorDashboardMetrics,
  SubmissionAttachment,
} from '../types/contractor';
import type { Project, MilestoneStatus } from '../types/project';
import type { UserProfile } from '../types';
import { generateSubmissionNumber } from '../utils/submissionIdGenerator';
import {
  getProjects,
  getProjectById,
  updateProject,
  addProjectUpdate,
  updateMilestone,
} from './projectService';
import { createNotification } from './notificationService';

const LOCAL_STORAGE_SUBMISSIONS = 'civicsight_local_contractor_submissions';

const memorySubmissionsStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memorySubmissionsStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  memorySubmissionsStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

function getLocalSubmissions(): Record<string, ContractorSubmission> {
  const raw = safeGetItem(LOCAL_STORAGE_SUBMISSIONS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocalSubmissions(data: Record<string, ContractorSubmission>): void {
  safeSetItem(LOCAL_STORAGE_SUBMISSIONS, JSON.stringify(data));
}

/**
 * Uploads site photo or verification evidence to Firebase Storage
 * (or converts to data URL for local offline testing)
 */
export async function uploadSubmissionEvidence(
  projectId: string,
  submissionId: string,
  file: File,
  uploadedBy: string
): Promise<SubmissionAttachment> {
  const fileId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (isFirebaseConfigured && storage) {
    try {
      const storagePath = `projects/${projectId}/contractor-submissions/${submissionId}/${fileId}_${cleanFileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      return {
        id: fileId,
        fileName: file.name,
        storagePath,
        downloadURL,
        contentType: file.type || 'image/jpeg',
        size: file.size,
        uploadedBy,
        createdAt: new Date().toISOString(),
      };
    } catch {
      // Fallback to offline reader
    }
  }

  // Offline / local storage fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        id: fileId,
        fileName: file.name,
        storagePath: `local/projects/${projectId}/submissions/${file.name}`,
        downloadURL: reader.result as string,
        contentType: file.type || 'image/jpeg',
        size: file.size,
        uploadedBy,
        createdAt: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fetches ONLY projects assigned to the authenticated contractor.
 * Enforces ownership boundary at query level.
 */
export async function getAssignedProjects(contractorId: string): Promise<Project[]> {
  if (!contractorId) return [];

  if (isFirebaseConfigured && db) {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(
        projectsCol,
        where('contractorId', '==', contractorId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => d.data() as Project);
      }
    } catch {
      // fallback to local projects
    }
  }

  // Local storage / seed fallback
  const allProjects = await getProjects({ isAuthority: true });
  return allProjects.filter((p) => p.contractorId === contractorId);
}

/**
 * Retrieves a single project verifying the contractor is assigned to it.
 * Strictly prevents URL manipulation by unassigned contractors.
 */
export async function getContractorProjectById(
  projectId: string,
  contractorId: string
): Promise<Project> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found.');
  }

  if (project.contractorId !== contractorId) {
    throw new Error('Unauthorized: You are not the assigned contractor for this project.');
  }

  return project;
}

/**
 * Creates a contractor submission for PM review.
 * Enforces strict project assignment and validation.
 * Does NOT directly update the official project record.
 */
export async function createContractorSubmission(
  input: CreateSubmissionInput,
  contractorUser: UserProfile
): Promise<ContractorSubmission> {
  if (contractorUser.role !== 'contractor') {
    throw new Error('Only authenticated contractors can create work submissions.');
  }

  // 1. Verify project exists & contractor is assigned
  const project = await getContractorProjectById(input.projectId, contractorUser.uid);

  // 2. Completed project rule: completed projects cannot accept new updates
  if (project.status === 'Completed' || project.status.toLowerCase() === 'completed') {
    throw new Error('This project is completed and is not accepting new contractor updates.');
  }

  // 3. Validate progress values
  if (input.type === 'Progress Update') {
    if (input.progress === undefined || isNaN(input.progress)) {
      throw new Error('Requested progress percentage is required for progress updates.');
    }
    if (input.progress < 0 || input.progress > 100) {
      throw new Error('Progress must be between 0% and 100%.');
    }
    if (input.progress < project.progress && !input.description.toLowerCase().includes('correction')) {
      throw new Error(
        `Requested progress (${input.progress}%) is lower than current approved progress (${project.progress}%). Please provide an explicit correction explanation in the description.`
      );
    }
  }

  // 4. Validate delay report
  if (input.type === 'Delay Report') {
    if (!input.delay?.reason && !input.description) {
      throw new Error('Please describe the reason for the reported timeline delay.');
    }
  }

  // 5. Generate unique SUB-YYYY-XXXXX identifier
  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const submissionNumber = generateSubmissionNumber();
  const now = new Date().toISOString();

  const submission: ContractorSubmission = {
    id: submissionId,
    submissionNumber,
    projectId: project.id,
    projectNumber: project.projectNumber,
    projectName: project.name,
    contractorId: contractorUser.uid,
    contractorName: contractorUser.displayName || contractorUser.username,
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    currentProgress: project.progress,
    progress: input.progress,
    milestoneId: input.milestoneId,
    milestoneProgress: input.milestoneProgress,
    milestoneStatus: input.milestoneStatus,
    actualCompletionDate: input.actualCompletionDate,
    delay: input.delay,
    issue: input.issue,
    attachments: input.attachments || [],
    status: 'Submitted',
    previousSubmissionId: input.previousSubmissionId,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'projectSubmissions', submissionId), submission);
    } catch {
      // fallback to local storage
    }
  }

  const local = getLocalSubmissions();
  local[submissionId] = submission;
  saveLocalSubmissions(local);

  // Trigger alert for Project Manager
  void createNotification({
    recipientId: 'pm-seed-1',
    type: 'contractor_submission_received',
    category: 'contractor',
    title: `New Contractor Submission: ${submissionNumber}`,
    message: `${contractorUser.displayName || contractorUser.username} submitted "${submission.title}" for ${project.name}.`,
    entityType: 'submission',
    entityId: submissionId,
    entityNumber: submissionNumber,
    actionUrl: `/dashboard/project-manager/submissions/${submissionId}`,
    priority: submission.delay?.isDelayed ? 'high' : 'normal',
  });

  // Trigger confirmation for Contractor
  void createNotification({
    recipientId: contractorUser.uid,
    type: 'contractor_submission_received',
    category: 'contractor',
    title: `Submission Received: ${submissionNumber}`,
    message: `Your update "${submission.title}" for ${project.name} has been queued for PM audit review.`,
    entityType: 'submission',
    entityId: submissionId,
    entityNumber: submissionNumber,
    actionUrl: `/dashboard/contractor/submissions/${submissionId}`,
    priority: 'normal',
  });

  return submission;
}

/**
 * Fetches all submissions created by the authenticated contractor.
 */
export async function getContractorSubmissions(
  contractorId: string,
  projectId?: string
): Promise<ContractorSubmission> {
  let list: ContractorSubmission[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, 'projectSubmissions');
      const q = projectId
        ? query(
            col,
            where('contractorId', '==', contractorId),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
          )
        : query(col, where('contractorId', '==', contractorId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      list = snapshot.docs.map((d) => d.data() as ContractorSubmission);
    } catch {
      list = [];
    }
  }

  if (list.length === 0) {
    const local = getLocalSubmissions();
    list = Object.values(local).filter(
      (s) => s.contractorId === contractorId && (!projectId || s.projectId === projectId)
    );
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list as unknown as ContractorSubmission;
}

/**
 * Retrieves an array of all submissions created by a contractor.
 */
export async function getContractorSubmissionsList(
  contractorId: string,
  projectId?: string
): Promise<ContractorSubmission[]> {
  let list: ContractorSubmission[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, 'projectSubmissions');
      const q = projectId
        ? query(
            col,
            where('contractorId', '==', contractorId),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
          )
        : query(col, where('contractorId', '==', contractorId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      list = snapshot.docs.map((d) => d.data() as ContractorSubmission);
    } catch {
      list = [];
    }
  }

  if (list.length === 0) {
    const local = getLocalSubmissions();
    list = Object.values(local).filter(
      (s) => s.contractorId === contractorId && (!projectId || s.projectId === projectId)
    );
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
}

/**
 * Retrieves a submission by ID.
 */
export async function getSubmissionById(
  submissionId: string
): Promise<ContractorSubmission | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'projectSubmissions', submissionId));
      if (snap.exists()) {
        return snap.data() as ContractorSubmission;
      }
    } catch {
      // fallback
    }
  }

  const local = getLocalSubmissions();
  return local[submissionId] || null;
}

/**
 * Retrieves all contractor submissions for Project Manager review queue.
 */
export async function getAllSubmissionsForAuthority(filters?: {
  status?: string;
  projectId?: string;
  type?: string;
}): Promise<ContractorSubmission[]> {
  let list: ContractorSubmission[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, 'projectSubmissions');
      const q = query(col, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      list = snapshot.docs.map((d) => d.data() as ContractorSubmission);
    } catch {
      list = [];
    }
  }

  if (list.length === 0) {
    const local = getLocalSubmissions();
    list = Object.values(local);
  }

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((s) => s.status.toLowerCase() === filters.status?.toLowerCase());
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    list = list.filter((s) => s.projectId === filters.projectId);
  }
  if (filters?.type && filters.type !== 'all') {
    list = list.filter((s) => s.type.toLowerCase() === filters.type?.toLowerCase());
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

/**
 * Reviews a contractor submission (Approve / Reject / Changes Requested).
 * Only Project Managers can review.
 * Approval atomically updates the official project record, creates a public update, and logs activity.
 */
export async function reviewSubmission(
  input: ReviewSubmissionInput,
  pmUser: UserProfile
): Promise<ContractorSubmission> {
  if (pmUser.role !== 'project_manager') {
    throw new Error('Unauthorized: Only authorized Project Managers can review contractor submissions.');
  }

  const submission = await getSubmissionById(input.submissionId);
  if (!submission) {
    throw new Error('Submission not found.');
  }

  // Immutability check: once approved or rejected, cannot be re-reviewed
  if (submission.status === 'Approved' || submission.status === 'Rejected') {
    throw new Error(`This submission has already been finalized as "${submission.status}".`);
  }

  // Mandate remarks for Rejection or Changes Requested
  if (input.decision === 'Rejected' && !input.remarks?.trim()) {
    throw new Error('Rejection requires remarks detailing the reason.');
  }

  if (input.decision === 'Changes Requested' && !input.remarks?.trim()) {
    throw new Error('Requesting changes requires detailed remarks explaining required revisions.');
  }

  const now = new Date().toISOString();
  const updatedReview = {
    reviewedBy: pmUser.uid,
    reviewerName: pmUser.displayName || pmUser.username,
    reviewedAt: now,
    decision: input.decision,
    remarks: input.remarks?.trim() || '',
  };

  const updatedSubmission: ContractorSubmission = {
    ...submission,
    status: input.decision,
    review: updatedReview,
    updatedAt: now,
  };

  // ==========================================
  // APPROVAL: ATOMICALLY UPDATE OFFICIAL RECORD
  // ==========================================
  if (input.decision === 'Approved') {
    const project = await getProjectById(submission.projectId);
    if (!project) {
      throw new Error('Associated project record not found.');
    }

    if (isFirebaseConfigured && db) {
      try {
        await runTransaction(db, async (transaction) => {
          const subRef = doc(db!, 'projectSubmissions', submission.id);
          const prjRef = doc(db!, 'projects', submission.projectId);

          const projectUpdates: Partial<Project> = {
            updatedAt: now,
          };

          if (submission.progress !== undefined) {
            projectUpdates.progress = submission.progress;
          }

          if (submission.delay?.isDelayed && submission.delay.expectedDelayDays) {
            projectUpdates.delayDays = (project.delayDays || 0) + submission.delay.expectedDelayDays;
          }

          transaction.update(subRef, updatedSubmission as unknown as Record<string, unknown>);
          transaction.update(prjRef, projectUpdates as unknown as Record<string, unknown>);
        });
      } catch {
        // Fallback to update methods
        await updateDoc(doc(db, 'projectSubmissions', submission.id), updatedSubmission as unknown as Record<string, unknown>);
        if (submission.progress !== undefined) {
          await updateProject(submission.projectId, { progress: submission.progress }, pmUser);
        }
      }
    } else {
      // Local storage path
      if (submission.progress !== undefined) {
        await updateProject(submission.projectId, { progress: submission.progress }, pmUser);
      }
      if (submission.delay?.isDelayed && submission.delay.expectedDelayDays) {
        await updateProject(
          submission.projectId,
          { delayDays: (project.delayDays || 0) + submission.delay.expectedDelayDays },
          pmUser
        );
      }
    }

    // 1. Create official Public Project Update
    const updateTitle =
      input.publicUpdateTitle?.trim() ||
      `Verified Worksite Update: ${submission.title}`;
    const updateContent =
      input.publicUpdateContent?.trim() ||
      (submission.progress !== undefined
        ? `Official progress verified and updated to ${submission.progress}%. Contractor remarks: "${submission.description}"`
        : `Verified field update: ${submission.description}`);

    await addProjectUpdate(
      submission.projectId,
      {
        title: updateTitle,
        content: updateContent,
        visibility: 'Public',
        pinned: false,
        attachments: submission.attachments.map((a) => a.downloadURL),
      },
      pmUser
    );

    // 2. If milestone was updated, update official milestone
    if (submission.milestoneId) {
      try {
        await updateMilestone(
          submission.projectId,
          submission.milestoneId,
          {
            progressPercentage: submission.milestoneProgress ?? submission.progress ?? 100,
            status: (submission.milestoneStatus as MilestoneStatus) || 'Completed',
            actualDate: submission.actualCompletionDate || now.split('T')[0],
          },
          pmUser
        );
      } catch {
        // milestone update optional
      }
    }
  } else {
    // Rejection or Changes Requested: Project official record is NOT touched!
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(
          doc(db, 'projectSubmissions', submission.id),
          updatedSubmission as unknown as Record<string, unknown>
        );
      } catch {
        // fallback
      }
    }
  }

  // Update local memory/session store
  const local = getLocalSubmissions();
  local[submission.id] = updatedSubmission;
  saveLocalSubmissions(local);

  // Trigger decision notification to Contractor
  void createNotification({
    recipientId: submission.contractorId,
    type:
      input.decision === 'Approved'
        ? 'contractor_submission_approved'
        : input.decision === 'Rejected'
        ? 'contractor_submission_rejected'
        : 'contractor_submission_changes_requested',
    category: 'contractor',
    title: `Submission ${input.decision}: ${submission.submissionNumber}`,
    message:
      input.remarks?.trim() ||
      `Your submission for ${submission.projectName} was marked as ${input.decision}.`,
    entityType: 'submission',
    entityId: submission.id,
    entityNumber: submission.submissionNumber,
    actionUrl: `/dashboard/contractor/submissions/${submission.id}`,
    priority: input.decision === 'Approved' ? 'normal' : 'high',
  });

  return updatedSubmission;
}

export const reviewContractorSubmission = reviewSubmission;

/**
 * Calculates high-level real KPI metrics for authenticated contractor.
 */
export async function getContractorDashboardMetrics(
  contractorId: string
): Promise<ContractorDashboardMetrics> {
  const [assignedProjects, submissions] = await Promise.all([
    getAssignedProjects(contractorId),
    getContractorSubmissionsList(contractorId),
  ]);

  const activeProjects = assignedProjects.filter(
    (p) => p.status.toLowerCase() === 'ongoing' || p.status.toLowerCase() === 'at risk'
  ).length;

  const delayedProjects = assignedProjects.filter(
    (p) => p.status.toLowerCase() === 'delayed' || (p.delayDays && p.delayDays > 0)
  ).length;

  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'Submitted' || s.status === 'Under Review'
  ).length;

  const approvedSubmissions = submissions.filter((s) => s.status === 'Approved').length;
  const changesRequestedSubmissions = submissions.filter(
    (s) => s.status === 'Changes Requested'
  ).length;
  const rejectedSubmissions = submissions.filter((s) => s.status === 'Rejected').length;

  return {
    assignedProjects: assignedProjects.length,
    activeProjects,
    pendingSubmissions,
    approvedSubmissions,
    changesRequestedSubmissions,
    rejectedSubmissions,
    delayedProjects,
  };
}
