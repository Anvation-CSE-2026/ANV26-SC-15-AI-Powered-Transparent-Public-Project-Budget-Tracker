import { describe, it, expect, beforeEach } from 'vitest';
import type { Project } from '../types/project';
import type { Complaint } from '../types/complaint';
import type { UserProfile } from '../types';
import {
  evaluateProjectRiskDetailed,
  calculateRiskSummaryMetrics,
  aggregateDepartmentAnalytics,
  aggregateWardRiskHeatmap,
  calculatePublicTransparencyMetrics,
} from '../utils/riskEngine';
import {
  countProjectUnresolvedComplaints,
  getAuthorityRiskEngineData,
  getCitizenTransparencyData,
  flagProjectForRiskAudit,
} from '../api/riskEngineService';
import { getProjectActivities } from '../api/projectService';

const mockOfficer: UserProfile = {
  uid: 'pm-eval-01',
  username: 'er_deshmukh',
  email: 'deshmukh@pmc.gov.in',
  role: 'project_manager',
  displayName: 'Er. Rajesh Deshmukh',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

function createBaseProject(overrides?: Partial<Project>): Project {
  return {
    id: 'prj-test-1',
    projectNumber: 'PRJ-2026-00001',
    name: 'FC Road Pedestrian Pathway Modernization',
    description: 'Pedestrian walkway revitalization with tactile paving and stormwater gratings.',
    category: 'Roads & Transport',
    department: 'Roads & Infrastructure',
    departmentId: 'dept_roads',
    projectManagerId: 'pm-eval-01',
    projectManagerName: 'Er. Rajesh Deshmukh',
    contractorName: 'Apex Civil Infrastructure Ltd',
    location: {
      address: 'FC Road Corridor',
      ward: 'Ward 12',
      city: 'Pune Metro',
      latitude: 18.5285,
      longitude: 73.8425,
    },
    startDate: '2026-01-01',
    plannedCompletionDate: '2026-06-30',
    expectedCompletionDate: '2026-06-30',
    approvedBudget: 10.0, // 10 Cr
    estimatedCost: 10.0,
    actualSpending: 9.0, // within budget
    progress: 60,
    expectedProgress: 60,
    budgetDeviation: -10,
    delayDays: 0,
    status: 'Ongoing',
    isPublic: true,
    riskScore: 0,
    riskLabel: 'Normal',
    milestonesCount: 4,
    completedMilestonesCount: 2,
    issuesCount: 0,
    unresolvedIssuesCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createBaseComplaint(overrides?: Partial<Complaint>): Complaint {
  return {
    id: 'cmp-test-1',
    complaintNumber: 'CMP-2026-00001',
    citizenId: 'cit-1',
    citizenName: 'Citizen Tester',
    citizenEmail: 'tester@citizen.org',
    title: 'Test Complaint Title',
    description: 'Detailed description of the test civic complaint.',
    category: 'Water',
    priority: 'medium',
    severity: 'moderate',
    status: 'in_progress',
    location: {
      address: 'Test Street Corridor',
      ward: 'Ward 12',
      city: 'Pune Metro',
      latitude: 18.5285,
      longitude: 73.8425,
    },
    attachments: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Phase 10: CivicSight Risk Engine & Analytics Tests', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  describe('1. Multi-Factor Risk Calculation Engine (evaluateProjectRiskDetailed)', () => {
    it('evaluates ideal projects as Normal with 0 risk score', () => {
      const project = createBaseProject();
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.totalScore).toBe(0);
      expect(evaluation.riskLevel).toBe('Normal');
      expect(evaluation.factors.every((f) => !f.triggered)).toBe(true);
      expect(evaluation.recommendedActions[0]).toContain('bi-weekly milestone monitoring');
    });

    it('triggers budget warning for >= 10% overrun (+0.5 score)', () => {
      const project = createBaseProject({ approvedBudget: 10.0, actualSpending: 11.2 }); // +12%
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.budgetDeviationPercentage).toBe(12);
      expect(evaluation.totalScore).toBe(0.5);
      expect(evaluation.riskLevel).toBe('Normal');
      const factor = evaluation.factors.find((f) => f.id === 'budget_warning');
      expect(factor).toBeDefined();
      expect(factor?.triggered).toBe(true);
      expect(factor?.severity).toBe('medium');
    });

    it('triggers budget overrun for >= 15% overrun (+1.0 score)', () => {
      const project = createBaseProject({ approvedBudget: 10.0, actualSpending: 11.8 }); // +18%
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.budgetDeviationPercentage).toBe(18);
      expect(evaluation.totalScore).toBe(1.0);
      const factor = evaluation.factors.find((f) => f.id === 'budget_overrun');
      expect(factor).toBeDefined();
      expect(factor?.triggered).toBe(true);
      expect(factor?.severity).toBe('high');
      expect(evaluation.recommendedActions.some((a) => a.includes('reconciliation'))).toBe(true);
    });

    it('triggers severe budget overrun for >= 25% overrun (+1.5 score, critical severity)', () => {
      const project = createBaseProject({ approvedBudget: 10.0, actualSpending: 13.0 }); // +30%
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.budgetDeviationPercentage).toBe(30);
      expect(evaluation.totalScore).toBe(1.5);
      expect(evaluation.riskLevel).toBe('Attention');
      const factor = evaluation.factors.find((f) => f.id === 'budget_extreme_overrun');
      expect(factor).toBeDefined();
      expect(factor?.triggered).toBe(true);
      expect(factor?.severity).toBe('critical');
      expect(evaluation.reasons[0]).toContain('Severe capital budget overrun');
      expect(evaluation.recommendedActions.some((a) => a.includes('financial audit'))).toBe(true);
    });

    it('triggers moderate timeline lag for >= 15 days delay (+0.5 score)', () => {
      const project = createBaseProject({ delayDays: 20 });
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.delayDays).toBe(20);
      expect(evaluation.totalScore).toBe(0.5);
      const factor = evaluation.factors.find((f) => f.id === 'delay_moderate');
      expect(factor?.triggered).toBe(true);
    });

    it('triggers milestone delay for >= 30 days delay (+1.0 score)', () => {
      const project = createBaseProject({ delayDays: 35 });
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.totalScore).toBe(1.0);
      const factor = evaluation.factors.find((f) => f.id === 'delay_high');
      expect(factor?.triggered).toBe(true);
      expect(factor?.severity).toBe('high');
      expect(evaluation.recommendedActions.some((a) => a.includes('recovery plan'))).toBe(true);
    });

    it('triggers critical schedule slippage for >= 60 days delay (+1.5 score, critical severity)', () => {
      const project = createBaseProject({ delayDays: 75 });
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.totalScore).toBe(1.5);
      expect(evaluation.riskLevel).toBe('Attention');
      const factor = evaluation.factors.find((f) => f.id === 'delay_critical');
      expect(factor?.triggered).toBe(true);
      expect(factor?.severity).toBe('critical');
      expect(evaluation.recommendedActions.some((a) => a.includes('Show-Cause notice'))).toBe(true);
    });

    it('triggers physical progress gap for >= 10% lag (+0.5 score)', () => {
      const project = createBaseProject({ progress: 45, expectedProgress: 58 }); // 13% gap
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.progressGap).toBe(13);
      expect(evaluation.totalScore).toBe(0.5);
      const factor = evaluation.factors.find((f) => f.id === 'progress_gap_moderate');
      expect(factor?.triggered).toBe(true);
    });

    it('triggers severe physical progress deficit for >= 20% lag (+1.0 score)', () => {
      const project = createBaseProject({ progress: 30, expectedProgress: 55 }); // 25% gap
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.progressGap).toBe(25);
      expect(evaluation.totalScore).toBe(1.0);
      const factor = evaluation.factors.find((f) => f.id === 'progress_gap_severe');
      expect(factor?.triggered).toBe(true);
      expect(evaluation.recommendedActions.some((a) => a.includes('physical engineering verification'))).toBe(true);
    });

    it('triggers citizen grievance concentration factors', () => {
      // 3 grievances -> +0.5
      const project = createBaseProject();
      const evalMod = evaluateProjectRiskDetailed(project, 3);
      expect(evalMod.totalScore).toBe(0.5);
      expect(evalMod.factors.find((f) => f.id === 'grievance_moderate')?.triggered).toBe(true);

      // 6 grievances -> +1.0
      const evalSev = evaluateProjectRiskDetailed(project, 6);
      expect(evalSev.totalScore).toBe(1.0);
      expect(evalSev.factors.find((f) => f.id === 'grievance_severe')?.triggered).toBe(true);
      expect(evalSev.recommendedActions.some((a) => a.includes('municipal field liaison'))).toBe(true);
    });

    it('triggers worksite blockers factor for >= 2 unresolved issues (+0.5 score)', () => {
      const project = createBaseProject({ unresolvedIssuesCount: 2 });
      const evaluation = evaluateProjectRiskDetailed(project, 0);

      expect(evaluation.totalScore).toBe(0.5);
      const factor = evaluation.factors.find((f) => f.id === 'blockers_active');
      expect(factor?.triggered).toBe(true);
      expect(evaluation.recommendedActions.some((a) => a.includes('inter-departmental coordination'))).toBe(true);
    });

    it('combines multi-factor compound risks into High Attention classification (>= 3.0)', () => {
      const compoundProject = createBaseProject({
        approvedBudget: 10.0,
        actualSpending: 13.5, // +35% overrun -> +1.5 pts
        delayDays: 65, // +65 days delay -> +1.5 pts
        progress: 40,
        expectedProgress: 65, // 25% progress gap -> +1.0 pts
        unresolvedIssuesCount: 3, // -> +0.5 pts
      });

      const evaluation = evaluateProjectRiskDetailed(compoundProject, 6); // +1.0 pts
      // Total: 1.5 + 1.5 + 1.0 + 1.0 + 0.5 = 5.5 -> capped at 5.0
      expect(evaluation.totalScore).toBe(5.0);
      expect(evaluation.riskLevel).toBe('High Attention');
      expect(evaluation.reasons.length).toBeGreaterThanOrEqual(4);
      expect(evaluation.recommendedActions.length).toBeGreaterThanOrEqual(4);
    });

    it('classifies Attention correctly for scores between 1.5 and 2.9', () => {
      const attentionProject = createBaseProject({
        delayDays: 35, // +1.0 pts
        unresolvedIssuesCount: 2, // +0.5 pts
      });

      const evaluation = evaluateProjectRiskDetailed(attentionProject, 1);
      expect(evaluation.totalScore).toBe(1.5);
      expect(evaluation.riskLevel).toBe('Attention');
    });
  });

  describe('2. City-Wide Summary Metrics Calculation (calculateRiskSummaryMetrics)', () => {
    it('handles empty project collections gracefully', () => {
      const summary = calculateRiskSummaryMetrics([]);
      expect(summary.totalProjects).toBe(0);
      expect(summary.normalProjectsCount).toBe(0);
      expect(summary.budgetAtRiskCr).toBe(0);
      expect(summary.highestRiskDepartment).toBe('None');
      expect(summary.flaggedProjectsRatio).toBe(0);
    });

    it('accurately aggregates portfolio budget, budget at risk, and flagged ratios', () => {
      const p1 = evaluateProjectRiskDetailed(createBaseProject({ approvedBudget: 10, actualSpending: 8 }), 0); // Normal
      const p2 = evaluateProjectRiskDetailed(
        createBaseProject({ approvedBudget: 15, actualSpending: 18, delayDays: 45, department: 'Stormwater & Drainage' }),
        1
      ); // Attention
      const p3 = evaluateProjectRiskDetailed(
        createBaseProject({
          approvedBudget: 20,
          actualSpending: 28,
          delayDays: 70,
          progress: 30,
          expectedProgress: 65,
          department: 'Roads & Infrastructure',
        }),
        6
      ); // High Attention

      const summary = calculateRiskSummaryMetrics([p1, p2, p3]);

      expect(summary.totalProjects).toBe(3);
      expect(summary.normalProjectsCount).toBe(1);
      expect(summary.attentionProjectsCount).toBe(1);
      expect(summary.highAttentionProjectsCount).toBe(1);
      expect(summary.totalSanctionedBudgetCr).toBe(45); // 10 + 15 + 20
      expect(summary.totalActualSpendingCr).toBe(54); // 8 + 18 + 28
      // Budget at risk includes only High Attention projects (p3)
      expect(summary.budgetAtRiskCr).toBe(20);
      expect(summary.flaggedProjectsRatio).toBe(67); // 2 out of 3 = 67%
    });
  });

  describe('3. Department Analytics Aggregation (aggregateDepartmentAnalytics)', () => {
    it('aggregates budgets, deviations, and correlates municipal complaints by department', () => {
      const pRoads = evaluateProjectRiskDetailed(
        createBaseProject({ department: 'Roads & Infrastructure', approvedBudget: 10, actualSpending: 12 }),
        0
      );
      const pDrainage = evaluateProjectRiskDetailed(
        createBaseProject({ department: 'Stormwater & Drainage', approvedBudget: 8, actualSpending: 8 }),
        0
      );

      const mockComplaints: Complaint[] = [
        createBaseComplaint({
          id: 'cmp-1',
          complaintNumber: 'CMP-2026-00001',
          title: 'Pothole on Road',
          description: 'Big pothole',
          category: 'Roads',
          departmentName: 'Roads & Infrastructure',
          priority: 'medium',
          severity: 'moderate',
          status: 'in_progress',
        }),
      ];

      const deptAnalytics = aggregateDepartmentAnalytics([pRoads, pDrainage], mockComplaints);

      expect(deptAnalytics.length).toBe(2);
      const roadsDept = deptAnalytics.find((d) => d.department === 'Roads & Infrastructure');
      expect(roadsDept).toBeDefined();
      expect(roadsDept?.approvedBudgetCr).toBe(10);
      expect(roadsDept?.actualSpendingCr).toBe(12);
      expect(roadsDept?.budgetDeviationPercentage).toBe(20);
      expect(roadsDept?.complaintsCount).toBe(1);

      const drainageDept = deptAnalytics.find((d) => d.department === 'Stormwater & Drainage');
      expect(drainageDept?.complaintsCount).toBe(0);
    });
  });

  describe('4. Ward Risk Heatmap Index (aggregateWardRiskHeatmap)', () => {
    it('computes composite 0-100 risk index incorporating high risk projects and emergency grievances', () => {
      const highRiskProj = evaluateProjectRiskDetailed(
        createBaseProject({
          approvedBudget: 25,
          actualSpending: 35,
          delayDays: 60,
          progress: 20,
          expectedProgress: 60,
          location: { address: 'Main St', ward: 'Ward 12', city: 'Pune' },
        }),
        5
      ); // High Attention

      const complaints: Complaint[] = [
        createBaseComplaint({
          id: 'cmp-em',
          complaintNumber: 'CMP-2026-00002',
          title: 'Emergency Gas Leak Flooding',
          description: 'Emergency leak',
          category: 'Public Infrastructure',
          priority: 'emergency',
          severity: 'critical',
          status: 'in_progress',
          location: { address: 'Ward 12 junction', ward: 'Ward 12', city: 'Pune' },
        }),
      ];

      const wardHeatmap = aggregateWardRiskHeatmap([highRiskProj], complaints);
      const ward12 = wardHeatmap.find((w) => w.ward === 'Ward 12');

      expect(ward12).toBeDefined();
      expect(ward12?.totalProjects).toBe(1);
      expect(ward12?.highRiskProjects).toBe(1);
      expect(ward12?.emergencyComplaints).toBe(1);
      expect(ward12?.riskIndex).toBeGreaterThan(50); // 50 (project) + 10 (emergency) + 2 (complaint) = 62
      expect(ward12?.riskIndex).toBe(62);
    });
  });

  describe('5. Public Citizen Transparency Metrics (calculatePublicTransparencyMetrics)', () => {
    it('computes public investment metrics, on-time rate, and grievance resolution rate', () => {
      const projects: Project[] = [
        createBaseProject({ approvedBudget: 10, actualSpending: 7, status: 'Completed', delayDays: 0 }),
        createBaseProject({ approvedBudget: 15, actualSpending: 10, status: 'Ongoing', delayDays: 0 }),
        createBaseProject({ approvedBudget: 5, actualSpending: 6, status: 'Delayed', delayDays: 25 }),
      ];

      const complaints: Complaint[] = [
        createBaseComplaint({
          id: 'cmp-r1',
          complaintNumber: 'CMP-2026-00003',
          title: 'Fixed pipe',
          description: 'done',
          category: 'Water',
          priority: 'low',
          severity: 'low',
          status: 'resolved',
        }),
        createBaseComplaint({
          id: 'cmp-r2',
          complaintNumber: 'CMP-2026-00004',
          title: 'Broken streetlight',
          description: 'in progress',
          category: 'Street Lights',
          priority: 'medium',
          severity: 'moderate',
          status: 'in_progress',
        }),
      ];

      const transparency = calculatePublicTransparencyMetrics(projects, complaints);

      expect(transparency.totalPublicInvestmentCr).toBe(30); // 10 + 15 + 5
      expect(transparency.totalCompletedProjects).toBe(1);
      expect(transparency.totalOngoingProjects).toBe(2); // Ongoing + Delayed
      expect(transparency.onTimeCompletionRate).toBe(67); // 2 out of 3 on time = 67%
      expect(transparency.grievanceResolutionRate).toBe(50); // 1 of 2 resolved = 50%
      expect(transparency.totalResolvedGrievances).toBe(1);
      expect(transparency.averageBudgetUtilization).toBe(77); // 23 / 30 = 76.67% -> 77%
    });
  });

  describe('6. Risk Engine Service API Integration (riskEngineService.ts)', () => {
    it('counts unresolved complaints correlated by ward and department', () => {
      const project = createBaseProject({
        department: 'Water Supply',
        category: 'Water Supply',
        location: { address: 'Lane 1', ward: 'Ward 4', city: 'Pune' },
      });

      const complaints: Complaint[] = [
        createBaseComplaint({
          id: 'c-match',
          complaintNumber: 'CMP-1',
          title: 'Water pressure low',
          description: 'low',
          category: 'Water',
          departmentName: 'Water Supply',
          priority: 'medium',
          severity: 'moderate',
          status: 'in_progress',
          location: { address: 'Lane 1', ward: 'Ward 4', city: 'Pune' },
        }),
        createBaseComplaint({
          id: 'c-resolved',
          complaintNumber: 'CMP-2',
          title: 'Fixed tap',
          description: 'fixed',
          category: 'Water',
          departmentName: 'Water Supply',
          priority: 'low',
          severity: 'low',
          status: 'resolved', // should be excluded
          location: { address: 'Lane 1', ward: 'Ward 4', city: 'Pune' },
        }),
        createBaseComplaint({
          id: 'c-other-ward',
          complaintNumber: 'CMP-3',
          title: 'Road crack',
          description: 'crack',
          category: 'Roads',
          departmentName: 'Roads',
          priority: 'medium',
          severity: 'moderate',
          status: 'in_progress',
          location: { address: 'Lane 9', ward: 'Ward 9', city: 'Pune' },
        }),
      ];

      const count = countProjectUnresolvedComplaints(project, complaints);
      expect(count).toBe(1);
    });

    it('fetches full authority risk telemetry data with seed projects', async () => {
      const data = await getAuthorityRiskEngineData();

      expect(data).toBeDefined();
      expect(data.evaluatedProjects.length).toBeGreaterThan(0);
      expect(data.summaryMetrics.totalProjects).toBeGreaterThan(0);
      expect(data.departmentAnalytics.length).toBeGreaterThan(0);
      expect(data.wardHeatmap.length).toBeGreaterThan(0);
    });

    it('fetches citizen transparency data with public metrics', async () => {
      const citizenData = await getCitizenTransparencyData();

      expect(citizenData).toBeDefined();
      expect(citizenData.transparencyMetrics.totalPublicInvestmentCr).toBeGreaterThan(0);
      expect(citizenData.projects.length).toBeGreaterThan(0);
    });

    it('records official municipal risk audit flag to project activities', async () => {
      const project = createBaseProject();
      await flagProjectForRiskAudit(
        project.id,
        'Field inspection ordered for severe stormwater canal delay.',
        mockOfficer
      );

      const activities = await getProjectActivities(project.id);
      expect(activities.length).toBeGreaterThan(0);
      const auditActivity = activities.find((a) => a.action === 'RISK_AUDIT_INITIATED');
      expect(auditActivity).toBeDefined();
      expect(auditActivity?.description).toContain('Field inspection ordered');
      expect(auditActivity?.actorName).toBe(mockOfficer.displayName);
    });
  });
});
