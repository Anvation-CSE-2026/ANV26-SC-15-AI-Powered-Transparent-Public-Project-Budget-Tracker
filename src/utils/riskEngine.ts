import type { Project } from '../types/project';
import type { Complaint } from '../types/complaint';
import type {
  DetailedProjectRisk,
  RiskFactorDetail,
  RiskSummaryMetrics,
  DepartmentAnalyticsItem,
  WardRiskHeatmapItem,
  PublicTransparencyMetrics,
} from '../types/analytics';
import { calculateBudgetDeviation, calculateDelayDays } from './calculations';

/**
 * CivicSight Advanced Multi-Factor Risk & Anomaly Engine
 * 
 * Evaluates projects against 5 core civic governance dimensions:
 * 1. Financial Deviation (Cost Overrun)
 * 2. Schedule Delay (Timeline Slippage)
 * 3. Physical S-Curve Variance (Expected vs Actual Progress)
 * 4. Citizen Grievance Density (Unresolved Complaints Concentration)
 * 5. Milestone Execution Bottlenecks
 */
export function evaluateProjectRiskDetailed(
  project: Project,
  unresolvedComplaints = 0
): DetailedProjectRisk {
  const deviation = calculateBudgetDeviation(project.approvedBudget, project.actualSpending);
  const delayDays = project.delayDays !== undefined
    ? project.delayDays
    : calculateDelayDays(project.plannedCompletionDate, project.actualCompletionDate);

  const expectedProgress = project.expectedProgress !== undefined
    ? project.expectedProgress
    : project.progress;
  const progressGap = Math.max(0, expectedProgress - project.progress);

  const factors: RiskFactorDetail[] = [];
  const reasons: string[] = [];
  const recommendedActions: string[] = [];
  let totalScore = 0;

  // 1. Financial Overrun Factor
  if (deviation >= 25) {
    totalScore += 1.5;
    factors.push({
      id: 'budget_extreme_overrun',
      name: 'Severe Budget Overrun',
      triggered: true,
      scoreContribution: 1.5,
      threshold: '>= 25%',
      actualValue: `+${deviation.toFixed(1)}%`,
      severity: 'critical',
      explanation: `Actual spending of ₹${project.actualSpending.toFixed(2)} Cr exceeds sanctioned budget of ₹${project.approvedBudget.toFixed(2)} Cr by ${deviation.toFixed(1)}%.`,
    });
    reasons.push(`Severe capital budget overrun of +${deviation.toFixed(1)}% (critical threshold >= 25%)`);
    recommendedActions.push('Initiate statutory financial audit and freeze unapproved contingency disbursements.');
  } else if (deviation >= 15) {
    totalScore += 1.0;
    factors.push({
      id: 'budget_overrun',
      name: 'Budget Overrun',
      triggered: true,
      scoreContribution: 1.0,
      threshold: '>= 15%',
      actualValue: `+${deviation.toFixed(1)}%`,
      severity: 'high',
      explanation: `Actual spending exceeds sanctioned allocation by ${deviation.toFixed(1)}%.`,
    });
    reasons.push(`Budget overrun of +${deviation.toFixed(1)}% exceeds standard 15% tolerance`);
    recommendedActions.push('Request immediate financial reconciliation statement from the contractor.');
  } else if (deviation >= 10) {
    totalScore += 0.5;
    factors.push({
      id: 'budget_warning',
      name: 'Budget Threshold Warning',
      triggered: true,
      scoreContribution: 0.5,
      threshold: '>= 10%',
      actualValue: `+${deviation.toFixed(1)}%`,
      severity: 'medium',
      explanation: `Expenditure is tracking slightly above sanction (+${deviation.toFixed(1)}%).`,
    });
    reasons.push(`Budget expenditure is trending +${deviation.toFixed(1)}% above initial sanction`);
  } else {
    factors.push({
      id: 'budget_normal',
      name: 'Budget Variance',
      triggered: false,
      scoreContribution: 0,
      threshold: 'Within 10%',
      actualValue: deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`,
      severity: 'low',
      explanation: 'Expenditure is tracking within statutory financial sanction limits.',
    });
  }

  // 2. Schedule Delay Factor
  if (delayDays >= 60) {
    totalScore += 1.5;
    factors.push({
      id: 'delay_critical',
      name: 'Critical Schedule Slippage',
      triggered: true,
      scoreContribution: 1.5,
      threshold: '>= 60 days',
      actualValue: `${delayDays} days`,
      severity: 'critical',
      explanation: `Worksite completion is delayed by ${delayDays} days beyond sanctioned target date.`,
    });
    reasons.push(`Severe timeline delay of ${delayDays} calendar days (critical threshold >= 60 days)`);
    recommendedActions.push('Issue formal Show-Cause notice to contractor regarding statutory timeline default.');
  } else if (delayDays >= 30) {
    totalScore += 1.0;
    factors.push({
      id: 'delay_high',
      name: 'Significant Milestone Delay',
      triggered: true,
      scoreContribution: 1.0,
      threshold: '>= 30 days',
      actualValue: `${delayDays} days`,
      severity: 'high',
      explanation: `Project schedule is delayed by ${delayDays} calendar days.`,
    });
    reasons.push(`Milestone completion delayed by ${delayDays} days (threshold >= 30 days)`);
    recommendedActions.push('Require contractor to submit an accelerated schedule recovery plan within 7 days.');
  } else if (delayDays >= 15) {
    totalScore += 0.5;
    factors.push({
      id: 'delay_moderate',
      name: 'Moderate Timeline Lag',
      triggered: true,
      scoreContribution: 0.5,
      threshold: '>= 15 days',
      actualValue: `${delayDays} days`,
      severity: 'medium',
      explanation: `Minor worksite delay of ${delayDays} calendar days detected.`,
    });
    reasons.push(`Worksite delayed by ${delayDays} days past planned target`);
  } else {
    factors.push({
      id: 'delay_normal',
      name: 'Schedule Compliance',
      triggered: false,
      scoreContribution: 0,
      threshold: 'On schedule',
      actualValue: '0 days delay',
      severity: 'low',
      explanation: 'Project execution timeline is on track with planned completion schedule.',
    });
  }

  // 3. Physical Execution Gap Factor
  if (progressGap >= 20) {
    totalScore += 1.0;
    factors.push({
      id: 'progress_gap_severe',
      name: 'Severe Progress Deficit',
      triggered: true,
      scoreContribution: 1.0,
      threshold: '>= 20% gap',
      actualValue: `${progressGap}% deficit`,
      severity: 'high',
      explanation: `Physical progress (${project.progress}%) is severely behind expected benchmark (${expectedProgress}%).`,
    });
    reasons.push(`Physical completion gap of ${progressGap}% between actual (${project.progress}%) and benchmark (${expectedProgress}%)`);
    recommendedActions.push('Conduct unannounced on-site physical engineering verification audit.');
  } else if (progressGap >= 10) {
    totalScore += 0.5;
    factors.push({
      id: 'progress_gap_moderate',
      name: 'Progress Gap Warning',
      triggered: true,
      scoreContribution: 0.5,
      threshold: '>= 10% gap',
      actualValue: `${progressGap}% deficit`,
      severity: 'medium',
      explanation: `Actual physical progress (${project.progress}%) is lagging behind schedule expectation.`,
    });
    reasons.push(`Physical progress lags expected schedule by ${progressGap}%`);
  } else {
    factors.push({
      id: 'progress_normal',
      name: 'Physical Progress Alignment',
      triggered: false,
      scoreContribution: 0,
      threshold: 'Aligned with schedule',
      actualValue: `${project.progress}% completed`,
      severity: 'low',
      explanation: 'Physical execution is aligned with planned stage-gate velocity.',
    });
  }

  // 4. Citizen Grievance Concentration Factor
  if (unresolvedComplaints >= 5) {
    totalScore += 1.0;
    factors.push({
      id: 'grievance_severe',
      name: 'Critical Grievance Concentration',
      triggered: true,
      scoreContribution: 1.0,
      threshold: '>= 5 complaints',
      actualValue: `${unresolvedComplaints} open issues`,
      severity: 'high',
      explanation: `High concentration of ${unresolvedComplaints} unresolved citizen complaints logged in worksite perimeter.`,
    });
    reasons.push(`Heavy cluster of ${unresolvedComplaints} unresolved civic complaints in worksite corridor`);
    recommendedActions.push('Deploy municipal field liaison team to inspect worksite hazards and expedite grievance resolution.');
  } else if (unresolvedComplaints >= 3) {
    totalScore += 0.5;
    factors.push({
      id: 'grievance_moderate',
      name: 'Elevated Grievance Volume',
      triggered: true,
      scoreContribution: 0.5,
      threshold: '>= 3 complaints',
      actualValue: `${unresolvedComplaints} open issues`,
      severity: 'medium',
      explanation: `Elevated volume of ${unresolvedComplaints} active citizen complaints recorded.`,
    });
    reasons.push(`${unresolvedComplaints} active citizen complaints reported regarding worksite impacts`);
    recommendedActions.push('Direct supervising engineer to inspect citizen complaints during weekly worksite walkthrough.');
  } else {
    factors.push({
      id: 'grievance_normal',
      name: 'Civic Grievance Health',
      triggered: false,
      scoreContribution: 0,
      threshold: '< 3 complaints',
      actualValue: `${unresolvedComplaints} complaints`,
      severity: 'low',
      explanation: 'Low citizen grievance density in worksite vicinity.',
    });
  }

  // 5. Unresolved Issues & Blockers
  const unresolvedIssues = project.unresolvedIssuesCount || 0;
  if (unresolvedIssues >= 2) {
    totalScore += 0.5;
    factors.push({
      id: 'blockers_active',
      name: 'Critical Site Blockers',
      triggered: true,
      scoreContribution: 0.5,
      threshold: '>= 2 site blockers',
      actualValue: `${unresolvedIssues} blockers`,
      severity: 'medium',
      explanation: `Worksite has ${unresolvedIssues} active engineering blockers or inter-departmental utility disputes.`,
    });
    reasons.push(`${unresolvedIssues} unresolved internal obstacles logged on worksite`);
    recommendedActions.push('Convene inter-departmental coordination session to resolve utility conflicts.');
  }

  // Normalize final score
  const finalScore = Math.min(5, Math.round(totalScore * 10) / 10);

  let riskLevel: 'Normal' | 'Attention' | 'High Attention';
  if (finalScore >= 3.0) {
    riskLevel = 'High Attention';
  } else if (finalScore >= 1.5) {
    riskLevel = 'Attention';
  } else {
    riskLevel = 'Normal';
  }

  // If no specific recommendations were triggered, provide default reassurance
  if (recommendedActions.length === 0) {
    recommendedActions.push('Continue standard bi-weekly milestone monitoring and contractor progress verification.');
  }

  return {
    projectId: project.id,
    projectNumber: project.projectNumber,
    projectName: project.name,
    category: project.category,
    department: project.department,
    ward: project.location?.ward || 'General',
    contractorName: project.contractorName,
    approvedBudget: project.approvedBudget,
    actualSpending: project.actualSpending,
    budgetDeviationPercentage: deviation,
    progress: project.progress,
    expectedProgress,
    progressGap,
    delayDays,
    unresolvedComplaintsCount: unresolvedComplaints,
    totalScore: finalScore,
    riskLevel,
    factors,
    reasons,
    recommendedActions,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates city-wide aggregated risk summary metrics.
 */
export function calculateRiskSummaryMetrics(
  evaluatedProjects: DetailedProjectRisk[]
): RiskSummaryMetrics {
  const total = evaluatedProjects.length;
  if (total === 0) {
    return {
      totalProjects: 0,
      normalProjectsCount: 0,
      attentionProjectsCount: 0,
      highAttentionProjectsCount: 0,
      totalSanctionedBudgetCr: 0,
      totalActualSpendingCr: 0,
      budgetAtRiskCr: 0,
      averageScheduleDelayDays: 0,
      averageProgressGap: 0,
      highestRiskDepartment: 'None',
      flaggedProjectsRatio: 0,
    };
  }

  let normal = 0;
  let attention = 0;
  let highAttention = 0;
  let sanctionedBudget = 0;
  let actualSpending = 0;
  let budgetAtRisk = 0;
  let totalDelayDays = 0;
  let totalProgressGap = 0;

  const deptRiskMap: Record<string, number> = {};

  for (const p of evaluatedProjects) {
    sanctionedBudget += p.approvedBudget;
    actualSpending += p.actualSpending;
    totalDelayDays += p.delayDays;
    totalProgressGap += p.progressGap;

    if (p.riskLevel === 'High Attention') {
      highAttention += 1;
      budgetAtRisk += p.approvedBudget;
      deptRiskMap[p.department] = (deptRiskMap[p.department] || 0) + 1;
    } else if (p.riskLevel === 'Attention') {
      attention += 1;
      deptRiskMap[p.department] = (deptRiskMap[p.department] || 0) + 0.5;
    } else {
      normal += 1;
    }
  }

  let highestRiskDept = 'None';
  let maxRiskWeight = 0;
  for (const [dept, weight] of Object.entries(deptRiskMap)) {
    if (weight > maxRiskWeight) {
      maxRiskWeight = weight;
      highestRiskDept = dept;
    }
  }

  const flaggedCount = attention + highAttention;
  const flaggedRatio = Math.round((flaggedCount / total) * 100);

  return {
    totalProjects: total,
    normalProjectsCount: normal,
    attentionProjectsCount: attention,
    highAttentionProjectsCount: highAttention,
    totalSanctionedBudgetCr: Math.round(sanctionedBudget * 100) / 100,
    totalActualSpendingCr: Math.round(actualSpending * 100) / 100,
    budgetAtRiskCr: Math.round(budgetAtRisk * 100) / 100,
    averageScheduleDelayDays: Math.round(totalDelayDays / total),
    averageProgressGap: Math.round((totalProgressGap / total) * 10) / 10,
    highestRiskDepartment: highestRiskDept,
    flaggedProjectsRatio: flaggedRatio,
  };
}

/**
 * Aggregates analytics grouped by municipal department.
 */
export function aggregateDepartmentAnalytics(
  evaluatedProjects: DetailedProjectRisk[],
  complaints: Complaint[] = []
): DepartmentAnalyticsItem[] {
  const map: Record<string, {
    approvedBudget: number;
    actualSpending: number;
    progressSum: number;
    count: number;
    highRisk: number;
  }> = {};

  for (const p of evaluatedProjects) {
    if (!map[p.department]) {
      map[p.department] = {
        approvedBudget: 0,
        actualSpending: 0,
        progressSum: 0,
        count: 0,
        highRisk: 0,
      };
    }
    const bucket = map[p.department];
    bucket.approvedBudget += p.approvedBudget;
    bucket.actualSpending += p.actualSpending;
    bucket.progressSum += p.progress;
    bucket.count += 1;
    if (p.riskLevel === 'High Attention') {
      bucket.highRisk += 1;
    }
  }

  const result: DepartmentAnalyticsItem[] = [];

  for (const [department, stats] of Object.entries(map)) {
    const deviation = calculateBudgetDeviation(stats.approvedBudget, stats.actualSpending);
    const avgProg = stats.count > 0 ? Math.round(stats.progressSum / stats.count) : 0;
    const relatedComplaints = complaints.filter(
      (c) => c.departmentName?.toLowerCase().includes(department.toLowerCase()) ||
             c.category.toLowerCase().includes(department.toLowerCase())
    ).length;

    result.push({
      department,
      totalProjects: stats.count,
      approvedBudgetCr: Math.round(stats.approvedBudget * 100) / 100,
      actualSpendingCr: Math.round(stats.actualSpending * 100) / 100,
      budgetDeviationPercentage: deviation,
      averageProgress: avgProg,
      highRiskCount: stats.highRisk,
      complaintsCount: relatedComplaints,
    });
  }

  return result.sort((a, b) => b.approvedBudgetCr - a.approvedBudgetCr);
}

/**
 * Aggregates risk heatmap scores across municipal wards.
 */
export function aggregateWardRiskHeatmap(
  evaluatedProjects: DetailedProjectRisk[],
  complaints: Complaint[] = []
): WardRiskHeatmapItem[] {
  const wards = new Set<string>();

  for (const p of evaluatedProjects) {
    if (p.ward) wards.add(p.ward);
  }
  for (const c of complaints) {
    if (c.location?.ward) wards.add(c.location.ward);
  }

  const result: WardRiskHeatmapItem[] = [];

  for (const ward of wards) {
    const wardProjects = evaluatedProjects.filter((p) => p.ward === ward);
    const wardComplaints = complaints.filter((c) => c.location?.ward === ward);
    const highRiskCount = wardProjects.filter((p) => p.riskLevel === 'High Attention').length;
    const emergencyComplaints = wardComplaints.filter((c) => c.priority === 'emergency').length;
    const totalBudget = wardProjects.reduce((sum, p) => sum + p.approvedBudget, 0);

    // Composite Risk Index (0 - 100)
    const projectFactor = wardProjects.length > 0 ? (highRiskCount / wardProjects.length) * 50 : 0;
    const emergencyFactor = Math.min(30, emergencyComplaints * 10);
    const complaintFactor = Math.min(20, wardComplaints.length * 2);
    const riskIndex = Math.min(100, Math.round(projectFactor + emergencyFactor + complaintFactor));

    result.push({
      ward,
      totalProjects: wardProjects.length,
      highRiskProjects: highRiskCount,
      totalComplaints: wardComplaints.length,
      emergencyComplaints,
      totalBudgetCr: Math.round(totalBudget * 100) / 100,
      riskIndex,
    });
  }

  return result.sort((a, b) => b.riskIndex - a.riskIndex);
}

/**
 * Calculates citizen transparency metrics for public portal.
 */
export function calculatePublicTransparencyMetrics(
  projects: Project[],
  complaints: Complaint[]
): PublicTransparencyMetrics {
  const totalInvestment = projects.reduce((sum, p) => sum + p.approvedBudget, 0);
  const totalSpending = projects.reduce((sum, p) => sum + p.actualSpending, 0);

  const completed = projects.filter(
    (p) => p.status === 'Completed' || p.status === 'completed'
  ).length;

  const ongoing = projects.filter(
    (p) => p.status === 'Ongoing' || p.status === 'ongoing' || p.status === 'Delayed'
  ).length;

  const onTimeProjects = projects.filter((p) => (p.delayDays || 0) <= 0).length;
  const onTimeRate = projects.length > 0 ? Math.round((onTimeProjects / projects.length) * 100) : 100;

  const resolvedComplaints = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;

  const resolutionRate =
    complaints.length > 0 ? Math.round((resolvedComplaints / complaints.length) * 100) : 100;

  const wards = new Set(
    [...projects.map((p) => p.location?.ward), ...complaints.map((c) => c.location?.ward)].filter(Boolean)
  );

  const budgetUtil =
    totalInvestment > 0 ? Math.min(100, Math.round((totalSpending / totalInvestment) * 100)) : 0;

  return {
    totalPublicInvestmentCr: Math.round(totalInvestment * 100) / 100,
    totalCompletedProjects: completed,
    totalOngoingProjects: ongoing,
    onTimeCompletionRate: onTimeRate,
    grievanceResolutionRate: resolutionRate,
    totalResolvedGrievances: resolvedComplaints,
    activeWardsCount: wards.size,
    averageBudgetUtilization: budgetUtil,
  };
}
