import type { SLAStatus } from '../types/complaint';

export interface SLACalculation {
  status: SLAStatus;
  hoursRemaining: number;
  isOverdue: boolean;
  formattedRemaining: string;
}

/**
 * Calculates real-time SLA status and time remaining given a deadline and current complaint status.
 */
export function calculateSLAStatus(deadlineIso: string, isCompleted: boolean): SLACalculation {
  if (isCompleted) {
    return {
      status: 'on_track',
      hoursRemaining: 0,
      isOverdue: false,
      formattedRemaining: 'Resolved within SLA',
    };
  }

  const deadline = new Date(deadlineIso);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(hoursRemaining);
    return {
      status: 'breached',
      hoursRemaining,
      isOverdue: true,
      formattedRemaining: `Breached by ${overdueHours}h`,
    };
  }

  if (hoursRemaining <= 12) {
    return {
      status: 'approaching',
      hoursRemaining,
      isOverdue: false,
      formattedRemaining: `${hoursRemaining}h remaining (Approaching SLA)`,
    };
  }

  const daysRemaining = Math.floor(hoursRemaining / 24);
  const formatted =
    daysRemaining >= 1
      ? `${daysRemaining}d ${hoursRemaining % 24}h remaining`
      : `${hoursRemaining}h remaining`;

  return {
    status: 'on_track',
    hoursRemaining,
    isOverdue: false,
    formattedRemaining: formatted,
  };
}
