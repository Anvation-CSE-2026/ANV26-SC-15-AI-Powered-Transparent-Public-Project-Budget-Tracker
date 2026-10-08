import { describe, it, expect } from 'vitest';
import {
  calculateOverdueDuration,
  isComplaintOverdue,
  getAuthorityDashboardData,
} from '../api/authorityDashboardService';
import type { Complaint } from '../types/complaint';

describe('Phase 7: Project Manager / High Authority Dashboard Tests', () => {
  describe('1. calculateOverdueDuration logic', () => {
    it('returns "Due soon" when deadline is in the future', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString();
      expect(calculateOverdueDuration(futureDate)).toBe('Due soon');
    });

    it('returns hours overdue when deadline passed within 24 hours', () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      const fourHoursAgo = new Date('2026-06-15T08:00:00.000Z').toISOString();
      expect(calculateOverdueDuration(fourHoursAgo, now)).toBe('4h overdue');
    });

    it('returns days overdue when deadline passed more than 24 hours ago', () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      const threeDaysAgo = new Date('2026-06-12T12:00:00.000Z').toISOString();
      expect(calculateOverdueDuration(threeDaysAgo, now)).toBe('3d overdue');
    });
  });

  describe('2. isComplaintOverdue logic', () => {
    const fixedNow = new Date('2026-06-15T12:00:00.000Z');

    const baseComplaint: Complaint = {
      id: 'cmp-test-1',
      complaintNumber: 'CMP-2026-00001',
      citizenId: 'cit-1',
      citizenName: 'Citizen Test',
      citizenEmail: 'cit@test.com',
      title: 'Water Leak',
      description: 'Major leak',
      category: 'Water',
      priority: 'high',
      severity: 'high',
      status: 'submitted',
      departmentName: 'Water Supply Department',
      location: { address: 'Main Road', ward: 'Ward 4' },
      attachments: [],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      sla: {
        deadline: '2026-06-10T00:00:00.000Z', // In the past relative to fixedNow
        status: 'on_track',
      },
    };

    it('flags uncompleted complaints as overdue when current time exceeds deadline', () => {
      expect(isComplaintOverdue(baseComplaint, fixedNow)).toBe(true);
    });

    it('flags complaints as overdue when sla.status is explicitly "breached"', () => {
      const breachedComplaint: Complaint = {
        ...baseComplaint,
        sla: {
          ...baseComplaint.sla!,
          deadline: '2026-06-20T00:00:00.000Z', // Future deadline, but status breached
          status: 'breached',
        },
      };
      expect(isComplaintOverdue(breachedComplaint, fixedNow)).toBe(true);
    });

    it('does NOT flag resolved or closed complaints as overdue even if deadline passed', () => {
      const resolvedComplaint: Complaint = {
        ...baseComplaint,
        status: 'resolved',
      };
      expect(isComplaintOverdue(resolvedComplaint, fixedNow)).toBe(false);

      const closedComplaint: Complaint = {
        ...baseComplaint,
        status: 'closed',
      };
      expect(isComplaintOverdue(closedComplaint, fixedNow)).toBe(false);

      const rejectedComplaint: Complaint = {
        ...baseComplaint,
        status: 'rejected',
      };
      expect(isComplaintOverdue(rejectedComplaint, fixedNow)).toBe(false);
    });

    it('returns false when deadline is in the future and SLA is not breached', () => {
      const futureComplaint: Complaint = {
        ...baseComplaint,
        sla: {
          ...baseComplaint.sla!,
          deadline: '2026-06-20T00:00:00.000Z',
          status: 'on_track',
        },
      };
      expect(isComplaintOverdue(futureComplaint, fixedNow)).toBe(false);
    });
  });

  describe('3. getAuthorityDashboardData aggregation', () => {
    it('aggregates live metrics, attention items, breakdowns, and activities', async () => {
      const data = await getAuthorityDashboardData();

      expect(data).toBeDefined();
      expect(data.metrics).toBeDefined();

      // Metrics validation
      expect(typeof data.metrics.totalProjects).toBe('number');
      expect(typeof data.metrics.activeProjects).toBe('number');
      expect(typeof data.metrics.delayedProjects).toBe('number');
      expect(typeof data.metrics.atRiskProjects).toBe('number');
      expect(typeof data.metrics.completedProjects).toBe('number');
      expect(typeof data.metrics.totalComplaints).toBe('number');
      expect(typeof data.metrics.pendingComplaints).toBe('number');
      expect(typeof data.metrics.emergencyComplaints).toBe('number');
      expect(typeof data.metrics.overdueComplaints).toBe('number');
      expect(typeof data.metrics.activePolls).toBe('number');
      expect(typeof data.metrics.pendingSuggestions).toBe('number');
      expect(typeof data.metrics.totalSanctionedBudget).toBe('number');
      expect(typeof data.metrics.totalActualSpending).toBe('number');

      // Attention items array check
      expect(Array.isArray(data.attentionItems)).toBe(true);
      data.attentionItems.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.identifier).toBeDefined();
        expect(item.title).toBeDefined();
        expect(['emergency', 'critical', 'high', 'warning', 'info']).toContain(item.severity);
        expect(item.actionLabel).toBeDefined();
        expect(item.actionUrl).toBeDefined();
      });

      // Breakdowns check
      expect(Array.isArray(data.complaintStatusBreakdown)).toBe(true);
      expect(Array.isArray(data.projectStatusBreakdown)).toBe(true);
      expect(data.suggestionsSummary).toBeDefined();
      expect(data.pollsSummary).toBeDefined();

      // Recent lists check
      expect(Array.isArray(data.recentActivities)).toBe(true);
      expect(Array.isArray(data.recentProjectUpdates)).toBe(true);
    });

    it('filters data accurately when a specific department is provided', async () => {
      const allData = await getAuthorityDashboardData('all');
      const deptFilteredData = await getAuthorityDashboardData('roads-bridges');

      expect(deptFilteredData).toBeDefined();
      expect(deptFilteredData.metrics.totalProjects).toBeLessThanOrEqual(
        allData.metrics.totalProjects
      );
    });
  });
});
