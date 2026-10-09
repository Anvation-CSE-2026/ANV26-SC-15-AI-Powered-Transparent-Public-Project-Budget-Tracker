import { describe, it, expect, beforeEach } from 'vitest';
import {
  logAuditEvent,
  getAuditLogs,
  getProjectAuditHistory,
  resetAuditStoreForTesting,
} from '../api/auditService';

describe('Phase 13: Audit Logs and Activity History System', () => {
  beforeEach(() => {
    resetAuditStoreForTesting();
  });

  describe('1. Audit Event Creation & Metadata Integrity', () => {
    it('creates a verified audit log entry with actor, role, entity, and timestamp', async () => {
      const entry = await logAuditEvent({
        actorUid: 'pm-test-1',
        actorName: 'Er. Rajesh Deshmukh',
        actorRole: 'project_manager',
        actionType: 'project_created',
        actionTitle: 'Capital Project Sanctioned',
        entityType: 'project',
        entityId: 'prj-test-101',
        entityNumber: 'PRJ-2026-00101',
        summary: 'Charter sanctioned for City Road Improvement',
        beforeState: null,
        afterState: { approvedBudget: 10.0, status: 'Ongoing' },
      });

      expect(entry.id).toBeDefined();
      expect(entry.id.startsWith('aud_')).toBe(true);
      expect(entry.actorName).toBe('Er. Rajesh Deshmukh');
      expect(entry.actorRole).toBe('project_manager');
      expect(entry.actionType).toBe('project_created');
      expect(entry.entityType).toBe('project');
      expect(entry.entityId).toBe('prj-test-101');
      expect(entry.entityNumber).toBe('PRJ-2026-00101');
      expect(entry.isPublic).toBe(true);
      expect(entry.timestamp).toBeDefined();
    });

    it('records before and after states for critical governance changes', async () => {
      const entry = await logAuditEvent({
        actorUid: 'pm-test-1',
        actorName: 'Er. Rajesh Deshmukh',
        actorRole: 'project_manager',
        actionType: 'contractor_submission_approved',
        actionTitle: 'Milestone 3 Work Approved',
        entityType: 'submission',
        entityId: 'sub-test-101',
        summary: 'Compaction test verified, physical progress approved.',
        beforeState: { verifiedProgress: 70, status: 'Pending' },
        afterState: { verifiedProgress: 82, status: 'Approved' },
      });

      expect(entry.beforeState).toEqual({ verifiedProgress: 70, status: 'Pending' });
      expect(entry.afterState).toEqual({ verifiedProgress: 82, status: 'Approved' });
    });
  });

  describe('2. Security & Secret Redaction Guarantee', () => {
    it('strictly sanitizes and redacts passwords, tokens, and API keys from audit payloads', async () => {
      const entry = await logAuditEvent({
        actorUid: 'admin-1',
        actorName: 'System Admin',
        actorRole: 'project_manager',
        actionType: 'user_profile_updated',
        actionTitle: 'Account Settings Updated',
        entityType: 'user',
        entityId: 'usr-1',
        summary: 'Profile credentials rotated',
        beforeState: { username: 'testuser', passwordHash: 'superSecret123', token: 'jwt_abc_999' },
        afterState: { username: 'testuser', passwordHash: 'newSecret456', apiKey: 'AIzaSyA_secret_key' },
        metadata: { authorizationToken: 'bearer_xyz_789' },
      });

      // Verify passwords and tokens are never preserved in audit history
      expect(entry.beforeState?.passwordHash).toBe('[REDACTED_CONFIDENTIAL]');
      expect(entry.beforeState?.token).toBe('[REDACTED_CONFIDENTIAL]');
      expect(entry.afterState?.passwordHash).toBe('[REDACTED_CONFIDENTIAL]');
      expect(entry.afterState?.apiKey).toBe('[REDACTED_CONFIDENTIAL]');
      expect(entry.metadata?.authorizationToken).toBe('[REDACTED_CONFIDENTIAL]');
      expect(entry.beforeState?.username).toBe('testuser');
    });
  });

  describe('3. Query Filtering & Search Boundaries', () => {
    it('filters audit records by entityType and actorRole', async () => {
      await logAuditEvent({
        actorUid: 'cont-1',
        actorName: 'Apex Contractor',
        actorRole: 'contractor',
        actionType: 'contractor_submission_created',
        actionTitle: 'Work Report Uploaded',
        entityType: 'submission',
        entityId: 'sub-99',
        summary: 'Poured concrete for Retaining Wall',
      });

      await logAuditEvent({
        actorUid: 'cit-1',
        actorName: 'Citizen Rahul',
        actorRole: 'citizen',
        actionType: 'complaint_created',
        actionTitle: 'Pothole Reported',
        entityType: 'complaint',
        entityId: 'cmp-99',
        summary: 'Pothole on Senapati Bapat Road',
      });

      const submissionLogs = await getAuditLogs({ entityType: 'submission' });
      expect(submissionLogs.every((l) => l.entityType === 'submission')).toBe(true);

      const contractorLogs = await getAuditLogs({ actorRole: 'contractor' });
      expect(contractorLogs.every((l) => l.actorRole === 'contractor')).toBe(true);
    });

    it('searches audit trail across title, summary, actor name, and entity number', async () => {
      await logAuditEvent({
        actorUid: 'pm-1',
        actorName: 'Er. Rajesh Deshmukh',
        actorRole: 'project_manager',
        actionType: 'risk_audit_flag_issued',
        actionTitle: 'Anomaly Alert Flagged',
        entityType: 'project',
        entityId: 'prj-seed-2',
        entityNumber: 'PRJ-2026-00102',
        summary: 'Urban Drainage Upgrade schedule slippage audit notice',
      });

      const searchByPrj = await getAuditLogs({ searchQuery: 'PRJ-2026-00102' });
      expect(searchByPrj.length).toBeGreaterThan(0);
      expect(searchByPrj[0].entityNumber).toBe('PRJ-2026-00102');

      const searchBySummary = await getAuditLogs({ searchQuery: 'schedule slippage' });
      expect(searchBySummary.length).toBeGreaterThan(0);
    });
  });

  describe('4. Citizen Privacy & Role Boundary Enforcement', () => {
    it('restricts non-public governance actions from citizen audit views', async () => {
      await logAuditEvent({
        actorUid: 'pm-internal',
        actorName: 'Internal Auditor',
        actorRole: 'project_manager',
        actionType: 'risk_audit_flag_issued',
        actionTitle: 'Internal Vigilance Note',
        entityType: 'project',
        entityId: 'prj-internal-1',
        summary: 'Confidential administrative review meeting',
        isPublic: false,
      });

      await logAuditEvent({
        actorUid: 'pm-public',
        actorName: 'Er. Rajesh Deshmukh',
        actorRole: 'project_manager',
        actionType: 'project_status_changed',
        actionTitle: 'Project Progress Certified',
        entityType: 'project',
        entityId: 'prj-internal-1',
        summary: 'Stage 2 certified for public use',
        isPublic: true,
      });

      const publicOnlyLogs = await getAuditLogs({ isPublicOnly: true });
      expect(publicOnlyLogs.some((l) => l.actionTitle === 'Internal Vigilance Note')).toBe(false);
      expect(publicOnlyLogs.some((l) => l.actionTitle === 'Project Progress Certified')).toBe(true);

      const projectHistory = await getProjectAuditHistory('prj-internal-1', true);
      expect(projectHistory.some((l) => l.isPublic === false)).toBe(false);
    });
  });
});
