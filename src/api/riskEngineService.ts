import { getProjects, logProjectActivity } from './projectService';
import { getAllComplaints } from './complaintService';
import type { UserProfile } from '../types';
import type { Project } from '../types/project';
import type { Complaint } from '../types/complaint';
import type {
  DetailedProjectRisk,
  RiskSummaryMetrics,
  DepartmentAnalyticsItem,
  WardRiskHeatmapItem,
  PublicTransparencyMetrics,
} from '../types/analytics';
import {
  evaluateProjectRiskDetailed,
  calculateRiskSummaryMetrics,
  aggregateDepartmentAnalytics,
  aggregateWardRiskHeatmap,
  calculatePublicTransparencyMetrics,
} from '../utils/riskEngine';

export interface AuthorityRiskEngineData {
  evaluatedProjects: DetailedProjectRisk[];
  summaryMetrics: RiskSummaryMetrics;
  departmentAnalytics: DepartmentAnalyticsItem[];
  wardHeatmap: WardRiskHeatmapItem[];
  rawProjects: Project[];
  complaints: Complaint[];
}

export interface CitizenTransparencyData {
  transparencyMetrics: PublicTransparencyMetrics;
  departmentAnalytics: DepartmentAnalyticsItem[];
  wardDistribution: WardRiskHeatmapItem[];
  projects: Project[];
  complaints: Complaint[];
}

/**
 * Counts unresolved complaints correlated with a specific project.
 * Matches by explicit projectId, or by overlapping Ward and Department.
 */
export function countProjectUnresolvedComplaints(
  project: Project,
  complaints: Complaint[]
): number {
  return complaints.filter((c) => {
    const isUnresolved = c.status !== 'resolved' && c.status !== 'closed';
    if (!isUnresolved) return false;

    // Explicit correlation if available
    const correlatedByProject = (c as unknown as { projectId?: string }).projectId === project.id;
    if (correlatedByProject) return true;

    // Ward and Department corridor correlation
    const matchesWard = project.location?.ward && c.location?.ward === project.location.ward;
    const matchesDept =
      project.department &&
      (c.departmentName?.toLowerCase().includes(project.department.toLowerCase()) ||
        c.category.toLowerCase().includes(project.category.toLowerCase()));

    return Boolean(matchesWard && matchesDept);
  }).length;
}

/**
 * Retrieves comprehensive multi-factor risk engine analytics for Project Managers and Municipal Authorities.
 */
export async function getAuthorityRiskEngineData(): Promise<AuthorityRiskEngineData> {
  const [projects, complaints] = await Promise.all([
    getProjects({ isAuthority: true }),
    getAllComplaints(),
  ]);

  const evaluatedProjects: DetailedProjectRisk[] = projects.map((p) => {
    const unresolvedCount = countProjectUnresolvedComplaints(p, complaints);
    return evaluateProjectRiskDetailed(p, unresolvedCount);
  });

  const summaryMetrics = calculateRiskSummaryMetrics(evaluatedProjects);
  const departmentAnalytics = aggregateDepartmentAnalytics(evaluatedProjects, complaints);
  const wardHeatmap = aggregateWardRiskHeatmap(evaluatedProjects, complaints);

  return {
    evaluatedProjects,
    summaryMetrics,
    departmentAnalytics,
    wardHeatmap,
    rawProjects: projects,
    complaints,
  };
}

/**
 * Retrieves privacy-safe public transparency metrics and civic investment data for citizens.
 */
export async function getCitizenTransparencyData(): Promise<CitizenTransparencyData> {
  const [projects, complaints] = await Promise.all([
    getProjects({ isAuthority: false }),
    getAllComplaints(),
  ]);

  const transparencyMetrics = calculatePublicTransparencyMetrics(projects, complaints);

  // Evaluate projects for department aggregates
  const evaluatedProjects = projects.map((p) => {
    const unresolvedCount = countProjectUnresolvedComplaints(p, complaints);
    return evaluateProjectRiskDetailed(p, unresolvedCount);
  });

  const departmentAnalytics = aggregateDepartmentAnalytics(evaluatedProjects, complaints);
  const wardDistribution = aggregateWardRiskHeatmap(evaluatedProjects, complaints);

  return {
    transparencyMetrics,
    departmentAnalytics,
    wardDistribution,
    projects,
    complaints,
  };
}

/**
 * Flags a high-risk project for official municipal engineering and financial audit.
 */
export async function flagProjectForRiskAudit(
  projectId: string,
  auditReason: string,
  officer: UserProfile
): Promise<void> {
  await logProjectActivity(
    projectId,
    'RISK_AUDIT_INITIATED',
    `Official Municipal Risk Audit initiated by ${officer.displayName || officer.username} (${officer.role}): ${auditReason.trim()}`,
    officer
  );
}
