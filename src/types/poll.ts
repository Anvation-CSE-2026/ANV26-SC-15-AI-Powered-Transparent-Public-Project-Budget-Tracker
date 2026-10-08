export type PollStatus = 'draft' | 'scheduled' | 'active' | 'closed';

export interface PollOption {
  id: string;
  label: string;
  text?: string;
  voteCount: number;
  percentage?: number;
}

export interface PollVote {
  userId: string;
  userName?: string;
  optionId: string;
  votedAt: string;
}

export interface Poll {
  id: string; // Firestore document ID
  title: string;
  description: string;
  category?: string;
  targetArea?: string;

  options: PollOption[];
  status: PollStatus;

  startsAt: string; // ISO date-time string
  endsAt: string; // ISO date-time string
  startDate?: string;
  endDate?: string;

  totalVotes: number;

  createdBy: string;
  createdByName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CitizenPollView extends Poll {
  hasVoted: boolean;
  userVotedOptionId?: string;
}

export interface CreatePollInput {
  title: string;
  description: string;
  category?: string;
  targetArea?: string;
  options: string[]; // labels
  startsAt: string;
  endsAt: string;
  publishImmediately?: boolean;
}
