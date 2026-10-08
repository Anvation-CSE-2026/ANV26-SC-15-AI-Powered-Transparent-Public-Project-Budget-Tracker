import type { Poll, PollOption } from '../types/poll';

export interface CalculatedPollOption extends PollOption {
  percentage: number;
  formattedPercentage: string;
}

export interface PollResultsCalculation {
  totalVotes: number;
  options: CalculatedPollOption[];
  winningOption?: CalculatedPollOption;
  hasVotes: boolean;
}

/**
 * Calculates option percentages and summary statistics safely without NaN or division-by-zero errors.
 */
export function calculatePollResults(options: PollOption[], totalVotes: number): PollResultsCalculation {
  const safeTotal = typeof totalVotes === 'number' && totalVotes > 0 ? totalVotes : 0;

  const calculatedOptions: CalculatedPollOption[] = options.map((opt) => {
    const votes = typeof opt.voteCount === 'number' && opt.voteCount > 0 ? opt.voteCount : 0;
    const percentage = safeTotal > 0 ? Math.round((votes / safeTotal) * 100) : 0;

    return {
      ...opt,
      voteCount: votes,
      percentage,
      formattedPercentage: `${percentage}%`,
    };
  });

  // Determine top winning option if there are votes
  let winningOption: CalculatedPollOption | undefined;
  if (safeTotal > 0 && calculatedOptions.length > 0) {
    winningOption = [...calculatedOptions].sort((a, b) => b.voteCount - a.voteCount)[0];
  }

  return {
    totalVotes: safeTotal,
    options: calculatedOptions,
    winningOption,
    hasVotes: safeTotal > 0,
  };
}

/**
 * Determines whether a poll is currently open for voting based on status and scheduled start/end dates.
 */
export function isPollOpenForVoting(poll: Poll): boolean {
  if (poll.status !== 'active') return false;

  const now = Date.now();
  const start = new Date(poll.startsAt).getTime();
  const end = new Date(poll.endsAt).getTime();

  return now >= start && now <= end;
}

/**
 * Validates poll creation input.
 */
export function validatePollInput(data: {
  title: string;
  description: string;
  options: string[];
  startsAt: string;
  endsAt: string;
}): { isValid: boolean; error?: string } {
  if (!data.title || data.title.trim().length < 5) {
    return { isValid: false, error: 'Poll title must be at least 5 characters long.' };
  }

  if (!data.description || data.description.trim().length < 10) {
    return { isValid: false, error: 'Poll description must be at least 10 characters long.' };
  }

  const cleanOptions = data.options.map((o) => o.trim()).filter((o) => o.length > 0);
  if (cleanOptions.length < 2) {
    return { isValid: false, error: 'A poll requires at least 2 distinct voting options.' };
  }

  // Check duplicate options
  const optionSet = new Set(cleanOptions.map((o) => o.toLowerCase()));
  if (optionSet.size !== cleanOptions.length) {
    return { isValid: false, error: 'All poll options must be unique. Duplicate options found.' };
  }

  const startDate = new Date(data.startsAt);
  const endDate = new Date(data.endsAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { isValid: false, error: 'Please specify valid start and end dates.' };
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return { isValid: false, error: 'The voting deadline (end date) must be after the start date.' };
  }

  return { isValid: true };
}
