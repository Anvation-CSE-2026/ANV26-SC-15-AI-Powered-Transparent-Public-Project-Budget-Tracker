import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { AuditLogEntry, AuditLogFilters, AuditActionType, AuditEntityType } from '../types/audit';
import type { UserRole } from '../types';

const LOCAL_STORAGE_KEY_AUDIT = 'civicsight_local_audit_logs';
const auditMemoryStore: AuditLogEntry[] = [];

/**
 * Sanitizes state objects to prevent any inadvertent leakage of credentials,
 * tokens, or sensitive user secrets into the public or authority audit trail.
 */
function sanitizeAuditPayload(data?: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;

  const forbiddenKeys = [
    'password',
    'passwordhash',
    'token',
    'refreshtoken',
    'apikey',
    'secret',
    'privatekey',
    'authorization',
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (forbiddenKeys.some((f) => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED_CONFIDENTIAL]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditPayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function getInitialSeedAuditLogs(): AuditLogEntry[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1 * 3600 * 1000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 72 * 3600 * 1000).toISOString();
  const fourDaysAgo = new Date(now.getTime() - 96 * 3600 * 1000).toISOString();

  return [
    {
      id: 'aud-001',
      actorUid: 'pm-seed-1',
      actorName: 'Er. Rajesh Deshmukh',
      actorRole: 'project_manager',
      actionType: 'contractor_submission_approved',
      actionTitle: 'Milestone 3 Work Submission Approved',
      entityType: 'submission',
      entityId: 'sub-seed-1',
      entityNumber: 'PRJ-2026-00101',
      summary: 'Verified Dense Bituminous Macadam compaction test report and approved stage progress release.',
      beforeState: { status: 'submitted', verifiedProgress: 70 },
      afterState: { status: 'approved', verifiedProgress: 82 },
      isPublic: true,
      timestamp: oneHourAgo,
    },
    {
      id: 'aud-002',
      actorUid: 'cont-01',
      actorName: 'Apex Urban Infra Tech Ltd',
      actorRole: 'contractor',
      actionType: 'contractor_submission_created',
      actionTitle: 'Milestone 3 Evidence Uploaded',
      entityType: 'submission',
      entityId: 'sub-seed-1',
      entityNumber: 'PRJ-2026-00101',
      summary: 'Submitted geotagged photos and compaction density reports for Arterial Ring Road Corridor.',
      beforeState: null,
      afterState: { progressClaimed: 82, photoCount: 4 },
      isPublic: true,
      timestamp: threeHoursAgo,
    },
    {
      id: 'aud-003',
      actorUid: 'pm-seed-1',
      actorName: 'Er. Rajesh Deshmukh',
      actorRole: 'project_manager',
      actionType: 'complaint_assigned',
      actionTitle: 'Grievance Assigned to Response Crew',
      entityType: 'complaint',
      entityId: 'cmp-seed-1',
      entityNumber: 'CMP-2026-00401',
      summary: 'Assigned emergency water main rupture to Municipal Water Distribution Division with 24h SLA target.',
      beforeState: { status: 'submitted', assignedOfficer: null },
      afterState: { status: 'assigned', assignedOfficer: 'Er. Rajesh Deshmukh' },
      isPublic: true,
      timestamp: oneDayAgo,
    },
    {
      id: 'aud-004',
      actorUid: 'pm-seed-1',
      actorName: 'Er. Rajesh Deshmukh',
      actorRole: 'project_manager',
      actionType: 'risk_audit_flag_issued',
      actionTitle: 'Municipal Risk Engine Anomaly Flagged',
      entityType: 'project',
      entityId: 'prj-seed-2',
      entityNumber: 'PRJ-2026-00102',
      summary: 'Flagged Urban Drainage Upgrade for +45 days timeline slippage and +26.25% budget deviation.',
      beforeState: { riskScore: 1.5, status: 'NORMAL' },
      afterState: { riskScore: 3.2, status: 'AT RISK' },
      isPublic: true,
      timestamp: twoDaysAgo,
    },
    {
      id: 'aud-005',
      actorUid: 'cit-seed-1',
      actorName: 'Aarav Sharma',
      actorRole: 'citizen',
      actionType: 'complaint_created',
      actionTitle: 'Public Grievance Registered',
      entityType: 'complaint',
      entityId: 'cmp-seed-1',
      entityNumber: 'CMP-2026-00401',
      summary: 'Reported severe pipeline leak with geotagged site photograph at Ward 12 Junction.',
      beforeState: null,
      afterState: { category: 'Water Supply', severity: 'Urgent' },
      isPublic: true,
      timestamp: threeDaysAgo,
    },
    {
      id: 'aud-006',
      actorUid: 'admin-demo',
      actorName: 'Municipal Commissioner',
      actorRole: 'project_manager',
      actionType: 'project_created',
      actionTitle: 'Capital Infrastructure Charter Sanctioned',
      entityType: 'project',
      entityId: 'prj-seed-1',
      entityNumber: 'PRJ-2026-00101',
      summary: 'Charter sanctioned for City Road Improvement with ₹10.00 Cr budget allocation.',
      beforeState: null,
      afterState: { approvedBudget: 10.0, contractor: 'Apex Urban Infra Tech Ltd' },
      isPublic: true,
      timestamp: fourDaysAgo,
    },
  ];
}

function getStoredLocalAuditLogs(): AuditLogEntry[] {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
      if (raw) return JSON.parse(raw);
      const seed = getInitialSeedAuditLogs();
      window.sessionStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(seed));
      return seed;
    }
  } catch {
    // fallback
  }

  if (auditMemoryStore.length === 0) {
    auditMemoryStore.push(...getInitialSeedAuditLogs());
  }
  return [...auditMemoryStore];
}

function saveStoredLocalAuditLogs(logs: AuditLogEntry[]): void {
  const cloned = [...logs];
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(cloned));
    }
  } catch {
    // fallback
  }
  auditMemoryStore.length = 0;
  auditMemoryStore.push(...cloned);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('civicsight_audit_logs_updated'));
  }
}

/**
 * Resets the in-memory audit store and session cache. Useful for test environments.
 */
export function resetAuditStoreForTesting(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(LOCAL_STORAGE_KEY_AUDIT);
    }
  } catch {
    // fallback
  }
  auditMemoryStore.length = 0;
}

/**
 * Records an immutable audit log entry for critical governance and project actions.
 */
export async function logAuditEvent(input: {
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  actionTitle: string;
  entityType: AuditEntityType;
  entityId: string;
  entityNumber?: string;
  summary: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  isPublic?: boolean;
}): Promise<AuditLogEntry> {
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newEntry: AuditLogEntry = {
    id: auditId,
    actorUid: input.actorUid,
    actorName: input.actorName.trim(),
    actorRole: input.actorRole,
    actionType: input.actionType,
    actionTitle: input.actionTitle.trim(),
    entityType: input.entityType,
    entityId: input.entityId,
    entityNumber: input.entityNumber,
    summary: input.summary.trim(),
    beforeState: sanitizeAuditPayload(input.beforeState),
    afterState: sanitizeAuditPayload(input.afterState),
    metadata: sanitizeAuditPayload(input.metadata) || undefined,
    isPublic: input.isPublic !== false, // default public unless explicitly restricted
    timestamp: nowIso,
  };

  // 1. Save in local store
  const existing = getStoredLocalAuditLogs();
  existing.unshift(newEntry);
  saveStoredLocalAuditLogs(existing);

  // 2. Persist to Cloud Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const auditDocRef = doc(db, 'audit_logs', auditId);
      await setDoc(auditDocRef, newEntry);
    } catch (err) {
      console.warn('[AuditService] Firestore write failed, stored in local cache:', err);
    }
  }

  return newEntry;
}

/**
 * Retrieves audit logs with optional filtering, search, and role boundaries.
 */
export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
  let list: AuditLogEntry[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, 'audit_logs');
      const q = query(col, orderBy('timestamp', 'desc'), firestoreLimit(filters?.limitCount || 100));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as AuditLogEntry);
    } catch {
      list = [];
    }
  }

  if (list.length === 0) {
    list = getStoredLocalAuditLogs();
  }

  // Apply filters in memory
  let filtered = [...list];

  if (filters?.isPublicOnly) {
    filtered = filtered.filter((e) => e.isPublic);
  }

  if (filters?.entityType) {
    filtered = filtered.filter((e) => e.entityType === filters.entityType);
  }

  if (filters?.actionType) {
    filtered = filtered.filter((e) => e.actionType === filters.actionType);
  }

  if (filters?.actorRole) {
    filtered = filtered.filter((e) => e.actorRole === filters.actorRole);
  }

  if (filters?.entityId) {
    filtered = filtered.filter((e) => e.entityId === filters.entityId);
  }

  if (filters?.startDate) {
    const start = new Date(filters.startDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= start);
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= end);
  }

  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.actionTitle.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        (e.entityNumber && e.entityNumber.toLowerCase().includes(q))
    );
  }

  if (filters?.limitCount && filters.limitCount > 0) {
    filtered = filtered.slice(0, filters.limitCount);
  }

  return filtered;
}

/**
 * Retrieves audit records specifically linked to a project.
 */
export async function getProjectAuditHistory(
  projectId: string,
  isPublicOnly = true
): Promise<AuditLogEntry[]> {
  const all = await getAuditLogs({ entityId: projectId, isPublicOnly });
  return all;
}
