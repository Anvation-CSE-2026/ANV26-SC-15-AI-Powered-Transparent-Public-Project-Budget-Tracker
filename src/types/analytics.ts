import type { RiskLevel, ProjectCategory } from './project';

export interface RiskFactorDetail {
  id: string;
  name: string;
  triggered: boolean;
  scoreContribution: number;
  threshold: string;
  actualValue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
}

export interface DetailedProjectRisk {
  projectId: string;
  projectNumber: string;
  projectName: string;
  category: ProjectCategory;
  department: string;
  ward: string;
  contractorName?: string;
  approvedBudget: number; // ₹ Cr
  actualSpending: number; // ₹ Cr
  budgetDeviationPercentage: number;
  progress: number;
  expectedProgress: number;
  progressGap: number;
  delayDays: number;
  unresolvedComplaintsCount: number;
  totalScore: number; // 0 - 5
  riskLevel: RiskLevel;
  factors: RiskFactorDetail[];
  reasons: string[];
  recommendedActions: string[];
  evaluatedAt: string;
}

export interface RiskSummaryMetrics {
  totalProjects: number;
  normalProjectsCount: number;
  attentionProjectsCount: number;
  highAttentionProjectsCount: number;
  totalSanctionedBudgetCr: number;
  totalActualSpendingCr: number;
  budgetAtRiskCr: number; // sum of budgets of High Attention projects
  averageScheduleDelayDays: number;
  averageProgressGap: number;
  highestRiskDepartment: string;
  flaggedProjectsRatio: number; // percentage
}

export interface DepartmentAnalyticsItem {
  department: string;
  totalProjects: number;
  approvedBudgetCr: number;
  actualSpendingCr: number;
  budgetDeviationPercentage: number;
  averageProgress: number;
  highRiskCount: number;
  complaintsCount: number;
}

export interface WardRiskHeatmapItem {
  ward: string;
  totalProjects: number;
  highRiskProjects: number;
  totalComplaints: number;
  emergencyComplaints: number;
  totalBudgetCr: number;
  riskIndex: number; // 0 - 100
}

export interface PublicTransparencyMetrics {
  totalPublicInvestmentCr: number;
  totalCompletedProjects: number;
  totalOngoingProjects: number;
  onTimeCompletionRate: number; // 0 - 100%
  grievanceResolutionRate: number; // 0 - 100%
  totalResolvedGrievances: number;
  activeWardsCount: number;
  averageBudgetUtilization: number;
}
