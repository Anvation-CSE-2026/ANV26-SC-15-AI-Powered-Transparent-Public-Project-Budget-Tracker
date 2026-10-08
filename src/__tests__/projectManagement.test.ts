import { describe, it, expect, beforeEach } from 'vitest';
import { generateProjectNumber, isValidProjectNumber } from '../utils/projectIdGenerator';
import { calculateBudgetDeviation, calculateDelayDays, calculateCivicSightRisk } from '../utils/calculations';
import {
  createProject,
  updateProject,
  getProjectById,
  getProjects,
  addMilestone,
  updateMilestone,
  getProjectMilestones,
  addProjectUpdate,
  getProjectUpdates,
  addProjectIssue,
  updateProjectIssue,
  getProjectIssues,
} from '../api/projectService';
import type { UserProfile } from '../types';

const mockPmUser: UserProfile = {
  uid: 'pm-test-uid-1',
  username: 'pm_engineer',
  email: 'pm@civicsight.gov.in',
  role: 'project_manager',
  displayName: 'Er. Test PM',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

describe('Phase 6: Project Management System Unit Tests', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  describe('1. Project Identifier Generation (PRJ-YYYY-XXXXX)', () => {
    it('generates valid project numbers matching PRJ-YYYY-XXXXX pattern', () => {
      const prjId = generateProjectNumber();
      expect(prjId).toMatch(/^PRJ-\d{4}-\d{5}$/);
      expect(isValidProjectNumber(prjId)).toBe(true);
    });

    it('formats sequential numbers with leading zeroes correctly', () => {
      const prjId = generateProjectNumber(2026, 42);
      expect(prjId).toBe('PRJ-2026-00042');
      expect(isValidProjectNumber(prjId)).toBe(true);

      const prjIdZero = generateProjectNumber(2027, 0);
      expect(prjIdZero).toBe('PRJ-2027-00000');
      expect(isValidProjectNumber(prjIdZero)).toBe(true);
    });

    it('rejects invalid or malformed project numbers', () => {
      expect(isValidProjectNumber('')).toBe(false);
      expect(isValidProjectNumber('PRJ-26-001')).toBe(false);
      expect(isValidProjectNumber('PRJ-2026-1234')).toBe(false);
      expect(isValidProjectNumber('CMP-2026-00001')).toBe(false);
      expect(isValidProjectNumber('prj-2026-00001')).toBe(false);
    });
  });

  describe('2. Budget Transparency & Variance Calculation', () => {
    it('calculates under-budget variance accurately', () => {
      // Approved 10.0 Cr, Actual 9.2 Cr -> ((9.2 - 10) / 10) * 100 = -8%
      const deviation = calculateBudgetDeviation(10.0, 9.2);
      expect(deviation).toBe(-8);
    });

    it('calculates cost overrun variance accurately', () => {
      // Approved 8.0 Cr, Actual 10.1 Cr -> ((10.1 - 8.0) / 8.0) * 100 = 26.25%
      const deviation = calculateBudgetDeviation(8.0, 10.1);
      expect(deviation).toBe(26.25);
    });

    it('safely handles zero or negative approved budget without producing NaN or Infinity', () => {
      expect(calculateBudgetDeviation(0, 5.0)).toBe(0);
      expect(calculateBudgetDeviation(-10, 5.0)).toBe(0);
      expect(calculateBudgetDeviation(0, 0)).toBe(0);
    });

    it('evaluates civic risk factors objectively and neutrally', () => {
      // Normal project
      const normalRisk = calculateCivicSightRisk(10.0, 9.2, 80, 80, 0, 0);
      expect(normalRisk.level).toBe('Normal');
      expect(normalRisk.score).toBeLessThanOrEqual(1);

      // Attention needed: 26.25% budget deviation, 45 days delay
      const highRisk = calculateCivicSightRisk(8.0, 10.1, 50, 80, 45, 3);
      expect(highRisk.level).toBe('High Attention');
      expect(highRisk.factors.budgetDeviationTriggered).toBe(true);
      expect(highRisk.factors.delayDaysTriggered).toBe(true);
    });
  });

  describe('3. Schedule Delay Calculation', () => {
    it('returns 0 delay for future planned completion dates', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const delay = calculateDelayDays(future.toISOString());
      expect(delay).toBe(0);
    });

    it('calculates exact delay days when an actual date is provided', () => {
      const planned = '2026-01-01';
      const actual = '2026-01-11';
      const delay = calculateDelayDays(planned, actual);
      expect(delay).toBe(10);
    });
  });

  describe('4. Project Creation & Immutability', () => {
    it('creates a project with auto-generated PRJ number and initial milestones', async () => {
      const newProj = await createProject(
        {
          name: 'North Ring Bypass Storm Conduit',
          description: 'High capacity drainage conduit along northern ring road sector 5.',
          category: 'Drainage',
          department: 'Stormwater & Drainage',
          location: {
            address: 'North Ring Road',
            ward: 'Ward 8',
            city: 'Pune Metro',
            latitude: 18.53,
            longitude: 73.85,
          },
          startDate: '2026-03-01',
          plannedCompletionDate: '2026-12-31',
          approvedBudget: 6.5,
          estimatedCost: 6.3,
          actualSpending: 1.2,
          isPublic: true,
          initialMilestones: [
            {
              title: 'Canal Excavation',
              description: 'Trench digging',
              targetDate: '2026-06-30',
              weight: 50,
            },
            {
              title: 'Concrete Lining',
              description: 'Lining conduits',
              targetDate: '2026-12-31',
              weight: 50,
            },
          ],
        },
        mockPmUser
      );

      expect(newProj.id).toBeDefined();
      expect(isValidProjectNumber(newProj.projectNumber)).toBe(true);
      expect(newProj.approvedBudget).toBe(6.5);
      expect(newProj.actualSpending).toBe(1.2);
      expect(newProj.milestonesCount).toBe(2);

      // Verify milestones were seeded
      const ms = await getProjectMilestones(newProj.id);
      expect(ms.length).toBe(2);
      expect(ms[0].title).toBe('Canal Excavation');
    });

    it('protects immutable fields (id, projectNumber) during updates', async () => {
      const project = await createProject(
        {
          name: 'Immutable Test Project',
          description: 'Testing immutable identifier protection.',
          category: 'Roads & Transport',
          department: 'Roads & Infrastructure',
          location: { address: 'Test St', city: 'Pune' },
          startDate: '2026-01-01',
          plannedCompletionDate: '2026-08-01',
          approvedBudget: 5.0,
          estimatedCost: 4.8,
          isPublic: true,
        },
        mockPmUser
      );

      const originalId = project.id;
      const originalNumber = project.projectNumber;

      const updated = await updateProject(
        project.id,
        {
          name: 'Renamed Project Title',
          actualSpending: 3.2,
          progress: 60,
        },
        mockPmUser
      );

      expect(updated.id).toBe(originalId);
      expect(updated.projectNumber).toBe(originalNumber);
      expect(updated.name).toBe('Renamed Project Title');
      expect(updated.actualSpending).toBe(3.2);
      expect(updated.progress).toBe(60);
    });
  });

  describe('5. Citizen Transparency & Strict Update Privacy Isolation', () => {
    it('strictly isolates internal updates so citizens never receive confidential notes', async () => {
      const project = await createProject(
        {
          name: 'Privacy Isolation Test Project',
          description: 'Testing public vs internal update isolation.',
          category: 'Street Lighting',
          department: 'Electrical & Street Lighting',
          location: { address: 'Main Blvd', city: 'Pune' },
          startDate: '2026-01-01',
          plannedCompletionDate: '2026-06-01',
          approvedBudget: 3.0,
          estimatedCost: 2.9,
          isPublic: true,
        },
        mockPmUser
      );

      // Add 1 Public bulletin and 1 Internal memo
      await addProjectUpdate(
        project.id,
        {
          title: 'Public Streetlight Installation Complete',
          content: 'Citizens can now enjoy well-lit walkways along Main Blvd.',
          visibility: 'Public',
        },
        mockPmUser
      );

      await addProjectUpdate(
        project.id,
        {
          title: 'Internal Audit: Minor Cable Voltage Variance',
          content: 'Internal contractor notice for transformer replacement.',
          visibility: 'Internal',
        },
        mockPmUser
      );

      // Citizen view: isAuthority = false
      const citizenUpdates = await getProjectUpdates(project.id, false);
      expect(citizenUpdates.length).toBe(1);
      expect(citizenUpdates[0].title).toBe('Public Streetlight Installation Complete');
      expect(citizenUpdates[0].visibility).toBe('Public');

      // Authority view: isAuthority = true
      const authorityUpdates = await getProjectUpdates(project.id, true);
      expect(authorityUpdates.length).toBe(2);
      const internalUpdate = authorityUpdates.find((u) => u.visibility === 'Internal');
      expect(internalUpdate).toBeDefined();
      expect(internalUpdate?.title).toBe('Internal Audit: Minor Cable Voltage Variance');
    });

    it('hides private/draft projects from citizen query results', async () => {
      // Create a private draft project
      const draftProj = await createProject(
        {
          name: 'Secret Municipal Plan Draft',
          description: 'Draft planning for internal corporation review only.',
          category: 'Public Buildings',
          department: 'General Public Works',
          location: { address: 'Plot 9', city: 'Pune' },
          startDate: '2026-10-01',
          plannedCompletionDate: '2027-10-01',
          approvedBudget: 25.0,
          estimatedCost: 24.5,
          isPublic: false, // Internal private draft
        },
        mockPmUser
      );

      // Citizen getProjectById should return null
      const citizenFetch = await getProjectById(draftProj.id, false);
      expect(citizenFetch).toBeNull();

      // Authority getProjectById should return the project
      const authorityFetch = await getProjectById(draftProj.id, true);
      expect(authorityFetch).not.toBeNull();
      expect(authorityFetch?.id).toBe(draftProj.id);

      // Citizen public list should NOT contain the private draft
      const publicProjects = await getProjects({ isAuthority: false });
      const foundInPublic = publicProjects.find((p) => p.id === draftProj.id);
      expect(foundInPublic).toBeUndefined();
    });
  });

  describe('6. Milestone Lifecycle & Auto-Progress Tracking', () => {
    it('updates milestone status and updates completed milestone counters', async () => {
      const proj = await createProject(
        {
          name: 'Milestone Tracking Test',
          description: 'Verifying completion counters and progress calculations.',
          category: 'Roads & Transport',
          department: 'Roads & Infrastructure',
          location: { address: 'Road 5', city: 'Pune' },
          startDate: '2026-01-01',
          plannedCompletionDate: '2026-12-01',
          approvedBudget: 4.0,
          estimatedCost: 3.8,
          isPublic: true,
        },
        mockPmUser
      );

      const ms1 = await addMilestone(
        proj.id,
        {
          title: 'Stage 1: Paving',
          description: 'Paving roads',
          targetDate: '2026-06-01',
          status: 'Pending',
          progressPercentage: 0,
        },
        mockPmUser
      );

      expect(ms1.status).toBe('Pending');

      // Update to completed
      const updatedMs = await updateMilestone(
        proj.id,
        ms1.id,
        {
          status: 'Completed',
          progressPercentage: 100,
        },
        mockPmUser
      );

      expect(updatedMs.status).toBe('Completed');
      expect(updatedMs.progressPercentage).toBe(100);

      // Verify updated project counters
      const updatedProj = await getProjectById(proj.id, true);
      expect(updatedProj?.completedMilestonesCount).toBe(1);
      expect(updatedProj?.progress).toBe(100);
    });
  });

  describe('7. Project Issues Lifecycle', () => {
    it('creates and resolves issues with resolution notes', async () => {
      const proj = await createProject(
        {
          name: 'Issue Lifecycle Test',
          description: 'Verifying issue tracking.',
          category: 'Water Supply',
          department: 'Water Supply & Sewerage',
          location: { address: 'Sector 3', city: 'Pune' },
          startDate: '2026-01-01',
          plannedCompletionDate: '2026-10-01',
          approvedBudget: 2.0,
          estimatedCost: 1.9,
          isPublic: true,
        },
        mockPmUser
      );

      const issue = await addProjectIssue(
        proj.id,
        {
          title: 'Pipe Leakage Obstacle',
          description: 'High pressure burst during testing.',
          severity: 'High',
        },
        mockPmUser
      );

      expect(issue.status).toBe('Open');
      expect(issue.severity).toBe('High');

      const issuesList = await getProjectIssues(proj.id);
      expect(issuesList.length).toBe(1);

      // Verify project unresolved issues count
      let p = await getProjectById(proj.id, true);
      expect(p?.unresolvedIssuesCount).toBe(1);

      // Resolve issue
      const resolved = await updateProjectIssue(
        proj.id,
        issue.id,
        {
          status: 'Resolved',
          resolutionNotes: 'Replaced bypass valve with reinforced flange.',
        },
        mockPmUser
      );

      expect(resolved.status).toBe('Resolved');
      expect(resolved.resolutionNotes).toBe('Replaced bypass valve with reinforced flange.');
      expect(resolved.resolvedAt).toBeDefined();

      p = await getProjectById(proj.id, true);
      expect(p?.unresolvedIssuesCount).toBe(0);
    });
  });
});
