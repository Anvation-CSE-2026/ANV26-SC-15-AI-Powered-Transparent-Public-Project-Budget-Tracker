import { describe, it, expect } from 'vitest';
import { generateSuggestionNumber, isValidSuggestionNumber } from '../utils/suggestionIdGenerator';
import {
  calculatePollResults,
  isPollOpenForVoting,
  validatePollInput,
} from '../utils/pollCalculator';
import type { Poll, PollOption } from '../types/poll';
import {
  createPoll,
  castVote,
  getPollById,
} from '../api/pollService';
import {
  createSuggestion,
  getSuggestionUpdates,
  addSuggestionInternalNote,
  addSuggestionAuthorityResponse,
} from '../api/suggestionService';
import type { UserProfile } from '../types';

describe('Phase 5 — Suggestion ID Generator', () => {
  it('generates a suggestion ID adhering strictly to SGG-YYYY-XXXXX format', () => {
    const id = generateSuggestionNumber();
    const currentYear = new Date().getFullYear();

    expect(id).toMatch(new RegExp(`^SGG-${currentYear}-\\d{5}$`));
    expect(isValidSuggestionNumber(id)).toBe(true);
  });

  it('validates correct and invalid suggestion tracking numbers', () => {
    expect(isValidSuggestionNumber('SGG-2026-10492')).toBe(true);
    expect(isValidSuggestionNumber('CMP-2026-10492')).toBe(false);
    expect(isValidSuggestionNumber('SGG-26-104')).toBe(false);
    expect(isValidSuggestionNumber('')).toBe(false);
  });

  it('generates unique numbers across sequential calls', () => {
    const ids = new Set([
      generateSuggestionNumber(),
      generateSuggestionNumber(),
      generateSuggestionNumber(),
      generateSuggestionNumber(),
    ]);
    expect(ids.size).toBe(4);
  });
});

describe('Phase 5 — Poll Calculator & Division-by-Zero Safety', () => {
  const mockOptions: PollOption[] = [
    { id: 'opt_1', label: 'Option A: Bike Lanes', voteCount: 0 },
    { id: 'opt_2', label: 'Option B: Bus Lanes', voteCount: 0 },
  ];

  it('handles zero total votes safely without producing NaN or Infinity', () => {
    const result = calculatePollResults(mockOptions, 0);

    expect(result.totalVotes).toBe(0);
    expect(result.hasVotes).toBe(false);
    expect(result.winningOption).toBeUndefined();

    result.options.forEach((opt) => {
      expect(opt.percentage).toBe(0);
      expect(opt.formattedPercentage).toBe('0%');
      expect(Number.isNaN(opt.percentage)).toBe(false);
    });
  });

  it('accurately calculates percentages and determines the winning choice', () => {
    const optionsWithVotes: PollOption[] = [
      { id: 'opt_1', label: 'Option A', voteCount: 75 },
      { id: 'opt_2', label: 'Option B', voteCount: 25 },
    ];

    const result = calculatePollResults(optionsWithVotes, 100);

    expect(result.totalVotes).toBe(100);
    expect(result.hasVotes).toBe(true);
    expect(result.options[0].percentage).toBe(75);
    expect(result.options[1].percentage).toBe(25);
    expect(result.winningOption?.id).toBe('opt_1');
  });

  it('correctly assesses if a poll is open for voting', () => {
    const now = Date.now();
    const activePoll: Poll = {
      id: 'p1',
      title: 'Active Poll',
      description: 'Testing active',
      options: mockOptions,
      status: 'active',
      startsAt: new Date(now - 10000).toISOString(),
      endsAt: new Date(now + 10000).toISOString(),
      totalVotes: 0,
      createdBy: 'u1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(isPollOpenForVoting(activePoll)).toBe(true);

    // If status is closed
    expect(isPollOpenForVoting({ ...activePoll, status: 'closed' })).toBe(false);

    // If deadline has passed
    expect(
      isPollOpenForVoting({
        ...activePoll,
        endsAt: new Date(now - 1000).toISOString(),
      })
    ).toBe(false);

    // If poll has not started yet
    expect(
      isPollOpenForVoting({
        ...activePoll,
        startsAt: new Date(now + 50000).toISOString(),
      })
    ).toBe(false);
  });
});

describe('Phase 5 — Poll Input Validation', () => {
  it('rejects polls with short titles or descriptions', () => {
    const res1 = validatePollInput({
      title: 'Hey',
      description: 'Long enough description here for validation',
      options: ['A', 'B'],
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(res1.isValid).toBe(false);
    expect(res1.error).toContain('title');

    const res2 = validatePollInput({
      title: 'Valid Title Here',
      description: 'Too short',
      options: ['A', 'B'],
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(res2.isValid).toBe(false);
    expect(res2.error).toContain('description');
  });

  it('requires at least 2 distinct options and disallows duplicates', () => {
    const res1 = validatePollInput({
      title: 'Valid Poll Title',
      description: 'This is a sufficiently long description for testing purposes.',
      options: ['Only One Option'],
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(res1.isValid).toBe(false);
    expect(res1.error).toContain('at least 2');

    const res2 = validatePollInput({
      title: 'Valid Poll Title',
      description: 'This is a sufficiently long description for testing purposes.',
      options: ['Option A', 'Option A'],
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(res2.isValid).toBe(false);
    expect(res2.error).toContain('unique');
  });

  it('validates that end date is strictly after start date', () => {
    const now = Date.now();
    const res = validatePollInput({
      title: 'Valid Poll Title',
      description: 'This is a sufficiently long description for testing purposes.',
      options: ['Option 1', 'Option 2'],
      startsAt: new Date(now + 100000).toISOString(),
      endsAt: new Date(now).toISOString(),
    });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('deadline');
  });
});

describe('Phase 5 — One-User-One-Vote & Transaction Lifecycle', () => {
  const citizenUser: UserProfile = {
    uid: 'citizen_test_001',
    email: 'citizen1@civicsight.org',
    username: 'citizen1',
    displayName: 'Citizen One',
    role: 'citizen',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  const authorityUser: UserProfile = {
    uid: 'pm_test_001',
    email: 'pm1@civicsight.org',
    username: 'pm1',
    displayName: 'Project Manager 1',
    role: 'project_manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  it('creates an active poll and enables voting', async () => {
    const now = Date.now();
    const poll = await createPoll(
      {
        title: 'Central Park Solar Lamp Upgrade',
        description: 'Vote on whether solar LED lamps should be prioritized in Central Park.',
        category: 'Environment & Energy',
        options: ['Agree with Solar', 'Prioritize Pavement First'],
        startsAt: new Date(now - 1000).toISOString(),
        endsAt: new Date(now + 86400000).toISOString(),
        publishImmediately: true,
      },
      authorityUser
    );

    expect(poll.id).toBeDefined();
    expect(poll.options.length).toBe(2);
    expect(poll.status).toBe('active');
    expect(poll.totalVotes).toBe(0);

    // Citizen casts a vote
    await castVote(poll.id, poll.options[0].id, citizenUser);

    const refreshed = await getPollById(poll.id, citizenUser.uid);
    expect(refreshed?.totalVotes).toBe(1);
    expect(refreshed?.hasVoted).toBe(true);
    expect(refreshed?.userVotedOptionId).toBe(poll.options[0].id);
  });

  it('strictly rejects duplicate vote submissions by the same user', async () => {
    const now = Date.now();
    const poll = await createPoll(
      {
        title: 'Downtown Speed Limit Reduction',
        description: 'Proposal to reduce speed limit from 50km/h to 30km/h in school zones.',
        category: 'Urban Mobility',
        options: ['Yes, Reduce to 30km/h', 'No, Maintain 50km/h'],
        startsAt: new Date(now - 1000).toISOString(),
        endsAt: new Date(now + 86400000).toISOString(),
        publishImmediately: true,
      },
      authorityUser
    );

    // First vote succeeds
    await castVote(poll.id, poll.options[0].id, citizenUser);

    // Second vote by the same citizen must fail
    await expect(castVote(poll.id, poll.options[1].id, citizenUser)).rejects.toThrow(
      /Duplicate voting is prohibited/i
    );
  });
});

describe('Phase 5 — Suggestion Updates & Internal Notes Privacy', () => {
  const citizen: UserProfile = {
    uid: 'citizen_sgg_01',
    email: 'citizen_sgg@civicsight.org',
    username: 'citizen_sgg',
    displayName: 'Civic Proposer',
    role: 'citizen',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  const authority: UserProfile = {
    uid: 'pm_sgg_01',
    email: 'pm_sgg@civicsight.org',
    username: 'pm_sgg',
    displayName: 'Urban Engineer',
    role: 'project_manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  it('filters out confidential internal memos from citizen view', async () => {
    const suggestion = await createSuggestion(
      {
        title: 'Rainwater Harvesting at Civic Center',
        description: 'Proposal to install modular rainwater retention tanks under Civic Center.',
        category: 'environment',
      },
      citizen
    );

    expect(suggestion.suggestionNumber).toMatch(/^SGG-\d{4}-\d{5}$/);

    // Authority adds an official response (public)
    await addSuggestionAuthorityResponse(
      suggestion.id,
      'Approved for technical assessment by hydrological team.',
      authority,
      'Water Resources'
    );

    // Authority adds a confidential internal note
    await addSuggestionInternalNote(
      suggestion.id,
      'Internal budget check: Estimated cost $45,000, requires council subsidy.',
      authority
    );

    // Citizen queries updates
    const citizenUpdates = await getSuggestionUpdates(suggestion.id, 'citizen');
    // Internal note MUST NOT be visible to citizen
    const hasInternalNoteForCitizen = citizenUpdates.some((u) => u.isInternal);
    expect(hasInternalNoteForCitizen).toBe(false);

    // Authority queries updates
    const authorityUpdates = await getSuggestionUpdates(suggestion.id, 'project_manager');
    // Internal note MUST be visible to authority
    const hasInternalNoteForAuthority = authorityUpdates.some((u) => u.isInternal);
    expect(hasInternalNoteForAuthority).toBe(true);
  });
});
