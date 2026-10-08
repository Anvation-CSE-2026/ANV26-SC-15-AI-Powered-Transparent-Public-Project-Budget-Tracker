import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSubmissionNumber,
  isValidSubmissionNumber,
} from '../utils/submissionIdGenerator';
import {
  getAssignedProjects,
  getContractorProjectById,
  createContractorSubmission,
  reviewSubmission,
  getContractorDashboardMetrics,
} from '../api/contractorService';
import {
  createProject,
  getProjectById,
  getProjectUpdates,
} from '../api/projectService';
import type { UserProfile } from '../types';

const mockPmUser: UserProfile = {
  uid: 'pm-auth-test-1',
  username: 'pm_authority',
  email: 'pm@civicsight.gov.in',
  role: 'project_manager',
  displayName: 'Er. Rajesh Deshmukh',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

const mockContractorUserA: UserProfile = {
  uid: 'cont-assigned-user-1',
  username: 'apex_infra',
  email: 'apex@cont.civicsight.org',
  role: 'contractor',
  displayName: 'Apex Urban Infrastructure',
  createdAt: '2026-01-02T00:00:00.000Z',
  isActive: true,
};

const mockContractorUserB: UserProfile = {
  uid: 'cont-other-user-2',
  username: 'bharat_builders',
  email: 'bharat@cont.civicsight.org',
  role: 'contractor',
  displayName: 'Bharat Heavy Works',
  createdAt: '2026-01-03T00:00:00.000Z',
  isActive: true,
};

const mockCitizenUser: UserProfile = {
  uid: 'cit-test-user-1',
  username: 'citizen_rahul',
  email: 'rahul@citizen.org',
  role: 'citizen',
  displayName: 'Rahul Verma',
  createdAt: '2026-01-04T00:00:00.000Z',
  isActive: true,
};

describe('Phase 8: Complete Contractor Portal & Workflow Tests', () => {
  let testProject1Id: string;
  let completedProjectId: string;

  beforeEach(async () => {
    // Clear storage before each test
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }

    // Seed test projects
    const p1 = await createProject(
      {
        name: 'Metro Flyover Overpass Construction',
        description: 'Construction of reinforced elevated flyover piers and roadbed.',
        category: 'Roads & Transport',
        department: 'Roads & Infrastructure',
        contractorId: mockContractorUserA.uid,
        contractorName: mockContractorUserA.displayName,
        location: {
          address: 'North Junction Outer Ring',
          city: 'Pune Metro',
          ward: 'Ward 8',
        },
        startDate: '2026-01-01',
        plannedCompletionDate: '2026-12-31',
        approvedBudget: 15.0,
        estimatedCost: 14.8,
        progress: 40,
        status: 'Ongoing',
        isPublic: true,
        initialMilestones: [
          {
            title: 'Substructure Pier Foundation',
            description: 'Piling and concrete foundation piers',
            targetDate: '2026-06-30',
          },
        ],
      },
      mockPmUser
    );
    testProject1Id = p1.id;

    // Seed a completed project
    const pCompleted = await createProject(
      {
        name: 'Historic Heritage Fountain Restoration',
        description: 'Delivered public park fountain restoration.',
        category: 'Parks & Public Spaces',
        department: 'Urban Landscaping',
        contractorId: mockContractorUserA.uid,
        contractorName: mockContractorUserA.displayName,
        location: {
          address: 'Central Park',
          city: 'Pune Metro',
        },
        startDate: '2025-01-01',
        plannedCompletionDate: '2025-06-30',
        approvedBudget: 1.2,
        estimatedCost: 1.1,
        progress: 100,
        status: 'Completed',
        isPublic: true,
      },
      mockPmUser
    );
    completedProjectId = pCompleted.id;
  });

  describe('1. Submission Number Generator (SUB-YYYY-XXXXX)', () => {
    it('generates unique valid identifiers matching SUB-YYYY-XXXXX pattern', () => {
      const subId = generateSubmissionNumber();
      expect(subId).toMatch(/^SUB-\d{4}-\d{5}$/);
      expect(isValidSubmissionNumber(subId)).toBe(true);
    });

    it('formats sequence numbers with leading zeroes correctly', () => {
      const formatted = generateSubmissionNumber(2026, 7);
      expect(formatted).toBe('SUB-2026-00007');
      expect(isValidSubmissionNumber(formatted)).toBe(true);
    });

    it('rejects invalid or malformed submission numbers', () => {
      expect(isValidSubmissionNumber('')).toBe(false);
      expect(isValidSubmissionNumber('SUB-26-001')).toBe(false);
      expect(isValidSubmissionNumber('PRJ-2026-00001')).toBe(false);
      expect(isValidSubmissionNumber('sub-2026-00001')).toBe(false);
    });
  });

  describe('2. Project Assignment & Access Boundaries', () => {
    it('returns only projects assigned to the specific contractor ID', async () => {
      const assignedToA = await getAssignedProjects(mockContractorUserA.uid);
      expect(assignedToA.length).toBeGreaterThan(0);
      assignedToA.forEach((p) => {
        expect(p.contractorId).toBe(mockContractorUserA.uid);
      });

      const assignedToB = await getAssignedProjects(mockContractorUserB.uid);
      expect(assignedToB.length).toBe(0);
    });

    it('allows assigned contractor to fetch project details', async () => {
      const project = await getContractorProjectById(testProject1Id, mockContractorUserA.uid);
      expect(project).toBeDefined();
      expect(project.id).toBe(testProject1Id);
    });

    it('strictly blocks unassigned contractor from accessing other contractor projects', async () => {
      await expect(
        getContractorProjectById(testProject1Id, mockContractorUserB.uid)
      ).rejects.toThrow(/Unauthorized/i);
    });
  });

  describe('3. Contractor Submissions Creation & Validation', () => {
    it('creates a progress update submission with status "Submitted"', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Pier Cap concreting completed for 12 sections',
          description: 'High tensile concrete cured and tested at certified municipal lab.',
          progress: 55,
        },
        mockContractorUserA
      );

      expect(submission).toBeDefined();
      expect(submission.id).toBeDefined();
      expect(submission.submissionNumber).toMatch(/^SUB-\d{4}-\d{5}$/);
      expect(submission.status).toBe('Submitted');
      expect(submission.progress).toBe(55);
      expect(submission.currentProgress).toBe(40);
      expect(submission.contractorId).toBe(mockContractorUserA.uid);

      // Verify official project progress has NOT changed yet (waiting for PM review)
      const officialProject = await getProjectById(testProject1Id);
      expect(officialProject?.progress).toBe(40);
    });

    it('rejects progress percentages outside 0 to 100 range', async () => {
      await expect(
        createContractorSubmission(
          {
            projectId: testProject1Id,
            type: 'Progress Update',
            title: 'Invalid High Progress',
            description: 'Test note',
            progress: 120,
          },
          mockContractorUserA
        )
      ).rejects.toThrow(/between 0% and 100%/i);

      await expect(
        createContractorSubmission(
          {
            projectId: testProject1Id,
            type: 'Progress Update',
            title: 'Invalid Negative Progress',
            description: 'Test note',
            progress: -10,
          },
          mockContractorUserA
        )
      ).rejects.toThrow(/between 0% and 100%/i);
    });

    it('blocks normal updates on projects marked as Completed', async () => {
      await expect(
        createContractorSubmission(
          {
            projectId: completedProjectId,
            type: 'Progress Update',
            title: 'Late Progress on Completed Work',
            description: 'Attempting update',
            progress: 100,
          },
          mockContractorUserA
        )
      ).rejects.toThrow(/completed and is not accepting/i);
    });

    it('creates a Delay Report without immediately changing official project status', async () => {
      const sub = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Delay Report',
          title: 'Monsoon flooding delaying foundation pit excavation',
          description: 'Pumping operations ongoing. Site temporarily waterlogged.',
          delay: {
            isDelayed: true,
            expectedDelayDays: 12,
            reason: 'Heavy monsoon storm',
          },
        },
        mockContractorUserA
      );

      expect(sub.status).toBe('Submitted');
      expect(sub.delay?.expectedDelayDays).toBe(12);

      // Verify official project record is NOT automatically marked as delayed
      const officialProject = await getProjectById(testProject1Id);
      expect(officialProject?.delayDays).toBe(0);
    });

    it('blocks non-contractor roles from creating contractor submissions', async () => {
      await expect(
        createContractorSubmission(
          {
            projectId: testProject1Id,
            type: 'Progress Update',
            title: 'Citizen trying contractor submission',
            description: 'Unauthorized attempt',
            progress: 50,
          },
          mockCitizenUser
        )
      ).rejects.toThrow(/Only authenticated contractors/i);
    });
  });

  describe('4. Project Manager Review & Approval Workflow', () => {
    it('allows Project Manager to approve submission and atomically updates project progress', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Pier Cap concreting certified',
          description: 'Official test certificates verified.',
          progress: 58,
        },
        mockContractorUserA
      );

      const reviewed = await reviewSubmission(
        {
          submissionId: submission.id,
          decision: 'Approved',
          remarks: 'Inspected on-site and verified quality test results.',
          publicUpdateTitle: 'Piers Concreting Milestone Complete',
          publicUpdateContent: 'Elevated flyover construction physical progress verified at 58%.',
        },
        mockPmUser
      );

      expect(reviewed.status).toBe('Approved');
      expect(reviewed.review?.decision).toBe('Approved');
      expect(reviewed.review?.reviewedBy).toBe(mockPmUser.uid);

      // Official project progress MUST now be updated to 58%!
      const updatedProject = await getProjectById(testProject1Id);
      expect(updatedProject?.progress).toBe(58);

      // Official public ProjectUpdate MUST now be recorded!
      const projectUpdates = await getProjectUpdates(testProject1Id, false);
      const publicUpdate = projectUpdates.find((u) => u.title.includes('Piers Concreting'));
      expect(publicUpdate).toBeDefined();
      expect(publicUpdate?.visibility).toBe('Public');
    });

    it('allows Project Manager to reject submission with mandatory remarks without changing project progress', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Claimed unverified progress',
          description: 'Attempted claim.',
          progress: 80,
        },
        mockContractorUserA
      );

      // Attempting rejection without remarks must fail
      await expect(
        reviewSubmission(
          {
            submissionId: submission.id,
            decision: 'Rejected',
            remarks: '',
          },
          mockPmUser
        )
      ).rejects.toThrow(/Rejection requires remarks/i);

      // Rejection with remarks succeeds
      const reviewed = await reviewSubmission(
        {
          submissionId: submission.id,
          decision: 'Rejected',
          remarks: 'Inspection team found incomplete curing and lack of lab test certificates.',
        },
        mockPmUser
      );

      expect(reviewed.status).toBe('Rejected');
      expect(reviewed.review?.remarks).toContain('lack of lab test certificates');

      // Official project progress MUST remain at previous value (40)
      const officialProject = await getProjectById(testProject1Id);
      expect(officialProject?.progress).toBe(40);
    });

    it('allows Project Manager to request changes with mandatory remarks', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Girders launched on Sector 8',
          description: 'Girders launched.',
          progress: 50,
        },
        mockContractorUserA
      );

      // Attempting changes requested without remarks must fail
      await expect(
        reviewSubmission(
          {
            submissionId: submission.id,
            decision: 'Changes Requested',
            remarks: '',
          },
          mockPmUser
        )
      ).rejects.toThrow(/requires detailed remarks/i);

      // Changes requested with remarks
      const reviewed = await reviewSubmission(
        {
          submissionId: submission.id,
          decision: 'Changes Requested',
          remarks: 'Please upload geo-tagged photos and structural engineer sign-off.',
        },
        mockPmUser
      );

      expect(reviewed.status).toBe('Changes Requested');
      expect(reviewed.review?.remarks).toContain('geo-tagged photos');

      // Official project progress MUST NOT change
      const officialProject = await getProjectById(testProject1Id);
      expect(officialProject?.progress).toBe(40);
    });

    it('enforces immutability: already finalized submissions cannot be re-reviewed', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Milestone delivery',
          description: 'Finalized test.',
          progress: 45,
        },
        mockContractorUserA
      );

      await reviewSubmission(
        {
          submissionId: submission.id,
          decision: 'Approved',
          remarks: 'Approved.',
        },
        mockPmUser
      );

      // Attempting to re-review an already Approved submission must fail
      await expect(
        reviewSubmission(
          {
            submissionId: submission.id,
            decision: 'Rejected',
            remarks: 'Attempting overwrite',
          },
          mockPmUser
        )
      ).rejects.toThrow(/already been finalized/i);
    });

    it('blocks unauthorized users from reviewing contractor submissions', async () => {
      const submission = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Contractor trying to self-approve',
          description: 'Self-approval test.',
          progress: 45,
        },
        mockContractorUserA
      );

      // Contractor cannot review or self-approve!
      await expect(
        reviewSubmission(
          {
            submissionId: submission.id,
            decision: 'Approved',
          },
          mockContractorUserA
        )
      ).rejects.toThrow(/Only authorized Project Managers/i);
    });
  });

  describe('5. Contractor Dashboard Metrics Calculation', () => {
    it('calculates real contractor dashboard KPIs accurately', async () => {
      // Create 2 submissions: 1 approved, 1 pending
      const sub1 = await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Test Sub 1',
          description: 'Notes',
          progress: 45,
        },
        mockContractorUserA
      );

      await reviewSubmission(
        {
          submissionId: sub1.id,
          decision: 'Approved',
        },
        mockPmUser
      );

      await createContractorSubmission(
        {
          projectId: testProject1Id,
          type: 'Progress Update',
          title: 'Test Sub 2',
          description: 'Notes',
          progress: 48,
        },
        mockContractorUserA
      );

      const metrics = await getContractorDashboardMetrics(mockContractorUserA.uid);

      expect(metrics.assignedProjects).toBeGreaterThanOrEqual(2); // p1 + completed
      expect(metrics.approvedSubmissions).toBeGreaterThanOrEqual(1);
      expect(metrics.pendingSubmissions).toBeGreaterThanOrEqual(1);
    });
  });
});
