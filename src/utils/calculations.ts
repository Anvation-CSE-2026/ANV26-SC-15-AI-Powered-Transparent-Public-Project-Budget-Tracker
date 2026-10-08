import type { RiskLevel } from '../types';

/**
 * Calculates budget deviation percentage:
 * ((actualSpending - approvedBudget) / approvedBudget) * 100
 */
export function calculateBudgetDeviation(approvedBudget: number, actualSpending: number): number {
  if (approvedBudget <= 0) return 0;
  const deviation = ((actualSpending - approvedBudget) / approvedBudget) * 100;
  return Number(deviation.toFixed(2));
}

/**
 * Calculates delay in days between planned and actual/current dates
 */
export function calculateDelayDays(plannedDateStr: string, actualDateStr?: string): number {
  const planned = new Date(plannedDateStr);
  const actual = actualDateStr ? new Date(actualDateStr) : new Date();
  const diffTime = actual.getTime() - planned.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export interface RiskCalculationResult {
  score: number; // 0 - 4
  level: RiskLevel;
  factors: {
    budgetDeviationTriggered: boolean;
    delayDaysTriggered: boolean;
    behindScheduleTriggered: boolean;
    unresolvedComplaintsTriggered: boolean;
  };
  reasons: string[];
}

/**
 * CivicSight Risk Indicator calculation.
 * 
 * Rules:
 * - budgetDeviation >= 15% -> +1
 * - delayDays >= 30 -> +1
 * - progress < expectedProgress -> +1
 * - unresolvedComplaints >= 3 -> +1
 * 
 * Classification:
 * - 0 - 1: Normal
 * - 2: Attention
 * - 3 - 4: High Attention
 * 
 * Note: Uses neutral civic terminology (Potential Anomaly, Requires Attention, Potential Project Risk).
 */
export function calculateCivicSightRisk(
  approvedBudget: number,
  actualSpending: number,
  progress: number,
  expectedProgress: number,
  delayDays: number,
  unresolvedComplaints: number
): RiskCalculationResult {
  const deviation = calculateBudgetDeviation(approvedBudget, actualSpending);
  
  const budgetDeviationTriggered = deviation >= 15;
  const delayDaysTriggered = delayDays >= 30;
  const behindScheduleTriggered = progress < expectedProgress;
  const unresolvedComplaintsTriggered = unresolvedComplaints >= 3;

  let score = 0;
  const reasons: string[] = [];

  if (budgetDeviationTriggered) {
    score += 1;
    reasons.push(`Budget deviation is +${deviation.toFixed(1)}% (threshold >= 15%)`);
  }
  if (delayDaysTriggered) {
    score += 1;
    reasons.push(`Milestone delay is ${delayDays} days (threshold >= 30 days)`);
  }
  if (behindScheduleTriggered) {
    score += 1;
    reasons.push(`Current progress (${progress}%) is behind scheduled expectation (${expectedProgress}%)`);
  }
  if (unresolvedComplaintsTriggered) {
    score += 1;
    reasons.push(`Unresolved citizen complaints count is ${unresolvedComplaints} (threshold >= 3)`);
  }

  let level: RiskLevel;
  if (score >= 3) {
    level = 'High Attention';
  } else if (score === 2) {
    level = 'Attention';
  } else {
    level = 'Normal';
  }

  return {
    score,
    level,
    factors: {
      budgetDeviationTriggered,
      delayDaysTriggered,
      behindScheduleTriggered,
      unresolvedComplaintsTriggered,
    },
    reasons,
  };
}
