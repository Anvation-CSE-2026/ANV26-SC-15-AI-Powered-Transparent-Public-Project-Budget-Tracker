import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type {
  Poll,
  PollVote,
  PollStatus,
  CitizenPollView,
  CreatePollInput,
} from '../types/poll';
import type { UserProfile } from '../types';
import { validatePollInput, isPollOpenForVoting } from '../utils/pollCalculator';
import { createNotification } from './notificationService';

const LOCAL_STORAGE_POLLS = 'civicsight_local_polls';
const LOCAL_STORAGE_VOTES = 'civicsight_local_poll_votes';

const pollMemoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return pollMemoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  pollMemoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

function getLocalPolls(): Record<string, Poll> {
  try {
    const raw = safeGetItem(LOCAL_STORAGE_POLLS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPolls(data: Record<string, Poll>) {
  try {
    safeSetItem(LOCAL_STORAGE_POLLS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getLocalVotes(): Record<string, Record<string, PollVote>> {
  // Map of pollId -> { userId: PollVote }
  try {
    const raw = safeGetItem(LOCAL_STORAGE_VOTES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalVotes(data: Record<string, Record<string, PollVote>>) {
  try {
    safeSetItem(LOCAL_STORAGE_VOTES, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Creates a new civic decision poll (Authority action).
 */
export async function createPoll(
  input: CreatePollInput,
  authorityUser: UserProfile
): Promise<Poll> {
  const validation = validatePollInput({
    title: input.title,
    description: input.description,
    options: input.options,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid poll configuration.');
  }

  const nowIso = new Date().toISOString();
  let pollId: string;

  if (isFirebaseConfigured && db) {
    const newDocRef = doc(collection(db, 'polls'));
    pollId = newDocRef.id;
  } else {
    pollId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const cleanOptions = input.options.map((label, index) => ({
    id: `opt_${index + 1}_${Math.random().toString(36).substring(2, 6)}`,
    label: label.trim(),
    text: label.trim(),
    voteCount: 0,
    percentage: 0,
  }));

  let initialStatus: PollStatus = 'draft';
  if (input.publishImmediately) {
    const now = Date.now();
    const start = new Date(input.startsAt).getTime();
    initialStatus = now >= start ? 'active' : 'scheduled';
  }

  const newPoll: Poll = {
    id: pollId,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category || 'General Civic Planning',
    targetArea: input.targetArea?.trim() || undefined,
    options: cleanOptions,
    status: initialStatus,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    startDate: input.startsAt,
    endDate: input.endsAt,
    totalVotes: 0,
    createdBy: authorityUser.uid,
    createdByName: authorityUser.displayName || authorityUser.username,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'polls', pollId), {
      ...newPoll,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
  } else {
    const local = getLocalPolls();
    local[pollId] = newPoll;
    saveLocalPolls(local);
  }

  return newPoll;
}

/**
 * Fetches all polls visible to citizens and enriches them with whether the user has voted.
 */
export async function getPollsForCitizen(
  userId?: string,
  filters?: {
    status?: string;
    category?: string;
    searchQuery?: string;
  }
): Promise<CitizenPollView[]> {
  let list: Poll[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Poll);
    } catch (err) {
      console.warn('[CivicSight] Error querying polls from Firestore:', err);
    }
  }

  if (list.length === 0) {
    const local = getLocalPolls();
    list = Object.values(local);
  }

  // Citizens can only see published polls (scheduled, active, closed) - drafts are hidden
  list = list.filter((p) => p.status !== 'draft');

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((p) => p.category === filters.category);
  }
  if (filters?.searchQuery) {
    const qLower = filters.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.description.toLowerCase().includes(qLower) ||
        (p.category && p.category.toLowerCase().includes(qLower))
    );
  }

  // Enrich with user vote records
  const enrichedList: CitizenPollView[] = [];

  for (const p of list) {
    let hasVoted = false;
    let userVotedOptionId: string | undefined;

    if (userId) {
      if (isFirebaseConfigured && db) {
        try {
          const voteSnap = await getDoc(doc(db, 'polls', p.id, 'votes', userId));
          if (voteSnap.exists()) {
            hasVoted = true;
            userVotedOptionId = voteSnap.data()?.optionId;
          }
        } catch {
          // ignore
        }
      } else {
        const localVotes = getLocalVotes();
        if (localVotes[p.id] && localVotes[p.id][userId]) {
          hasVoted = true;
          userVotedOptionId = localVotes[p.id][userId].optionId;
        }
      }
    }

    enrichedList.push({
      ...p,
      hasVoted,
      userVotedOptionId,
    });
  }

  return enrichedList;
}

export const getCitizenPolls = getPollsForCitizen;

/**
 * Authority: Queries all municipal polls (including drafts).
 */
export async function getAllPollsForAuthority(filters?: {
  status?: string;
  category?: string;
  searchQuery?: string;
}): Promise<Poll[]> {
  let list: Poll[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Poll);
    } catch (err) {
      console.warn('[CivicSight] Error querying all polls for authority:', err);
    }
  }

  if (list.length === 0) {
    const local = getLocalPolls();
    list = Object.values(local);
  }

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((p) => p.category === filters.category);
  }
  if (filters?.searchQuery) {
    const qLower = filters.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.description.toLowerCase().includes(qLower)
    );
  }

  return list;
}

/**
 * Fetches a single poll by ID.
 */
export async function getPollById(
  pollId: string,
  userId?: string
): Promise<CitizenPollView | null> {
  let poll: Poll | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'polls', pollId));
      if (snap.exists()) {
        poll = snap.data() as Poll;
      }
    } catch (err) {
      console.warn('[CivicSight] Error fetching poll by ID:', err);
    }
  }

  if (!poll) {
    const local = getLocalPolls();
    poll = local[pollId] || null;
  }

  if (!poll) return null;

  let hasVoted = false;
  let userVotedOptionId: string | undefined;

  if (userId) {
    if (isFirebaseConfigured && db) {
      try {
        const voteSnap = await getDoc(doc(db, 'polls', pollId, 'votes', userId));
        if (voteSnap.exists()) {
          hasVoted = true;
          userVotedOptionId = voteSnap.data()?.optionId;
        }
      } catch {
        // ignore
      }
    } else {
      const localVotes = getLocalVotes();
      if (localVotes[pollId] && localVotes[pollId][userId]) {
        hasVoted = true;
        userVotedOptionId = localVotes[pollId][userId].optionId;
      }
    }
  }

  return {
    ...poll,
    hasVoted,
    userVotedOptionId,
  };
}

/**
 * Casts a vote on an active poll.
 * CRITICAL: Enforces One-User-One-Vote both via document path polls/{pollId}/votes/{userId}
 * and atomic Firestore transactions!
 */
export async function castVote(
  pollId: string,
  optionId: string,
  user: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    const pollRef = doc(db, 'polls', pollId);
    const voteRef = doc(db, 'polls', pollId, 'votes', user.uid);

    await runTransaction(db, async (transaction) => {
      // 1. Check if vote document already exists for this user
      const existingVoteDoc = await transaction.get(voteRef);
      if (existingVoteDoc.exists()) {
        throw new Error('You have already voted in this poll. Duplicate voting is prohibited.');
      }

      // 2. Fetch current poll state
      const pollDoc = await transaction.get(pollRef);
      if (!pollDoc.exists()) {
        throw new Error('Poll not found or has been removed.');
      }

      const pollData = pollDoc.data() as Poll;

      // 3. Verify poll is open for voting
      if (!isPollOpenForVoting(pollData)) {
        throw new Error('Voting is closed for this poll.');
      }

      // 4. Verify option exists
      const optionIndex = pollData.options.findIndex((opt) => opt.id === optionId);
      if (optionIndex === -1) {
        throw new Error('Selected voting option does not exist.');
      }

      // 5. Update options array with incremented count
      const updatedOptions = [...pollData.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        voteCount: (updatedOptions[optionIndex].voteCount || 0) + 1,
      };

      const updatedTotalVotes = (pollData.totalVotes || 0) + 1;

      // 6. Write vote document (polls/{pollId}/votes/{userId})
      const voteData: PollVote = {
        userId: user.uid,
        userName: user.displayName || user.username,
        optionId,
        votedAt: nowIso,
      };

      transaction.set(voteRef, voteData);

      // 7. Update poll aggregate counters atomically
      transaction.update(pollRef, {
        options: updatedOptions,
        totalVotes: updatedTotalVotes,
        updatedAt: nowIso,
      });
    });

    return;
  }

  // Local fallback with identical transactional guarantees
  const localPolls = getLocalPolls();
  const poll = localPolls[pollId];

  if (!poll) {
    throw new Error('Poll not found.');
  }

  if (!isPollOpenForVoting(poll)) {
    throw new Error('Voting is closed for this poll.');
  }

  const localVotes = getLocalVotes();
  if (!localVotes[pollId]) {
    localVotes[pollId] = {};
  }

  if (localVotes[pollId][user.uid]) {
    throw new Error('You have already voted in this poll. Duplicate voting is prohibited.');
  }

  const optionIndex = poll.options.findIndex((opt) => opt.id === optionId);
  if (optionIndex === -1) {
    throw new Error('Selected option does not exist.');
  }

  // Increment option count
  poll.options[optionIndex].voteCount = (poll.options[optionIndex].voteCount || 0) + 1;
  poll.totalVotes = (poll.totalVotes || 0) + 1;
  poll.updatedAt = nowIso;
  saveLocalPolls(localPolls);

  // Record vote
  localVotes[pollId][user.uid] = {
    userId: user.uid,
    userName: user.displayName || user.username,
    optionId,
    votedAt: nowIso,
  };
  saveLocalVotes(localVotes);
}

/**
 * Authority: Updates poll status (e.g. Schedule -> Active -> Closed).
 */
export async function updatePollStatus(
  pollId: string,
  newStatus: PollStatus,
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'polls', pollId), {
      status: newStatus,
      updatedAt: nowIso,
      updatedBy: authorityUser.uid,
    });
  } else {
    const local = getLocalPolls();
    if (local[pollId]) {
      local[pollId].status = newStatus;
      local[pollId].updatedAt = nowIso;
      saveLocalPolls(local);
    }
  }

  // Trigger notification if poll is opened for voting
  if (newStatus === 'active') {
    const p = await getPollById(pollId);
    if (p) {
      void createNotification({
        recipientId: 'cit-seed-1',
        type: 'poll_published',
        category: 'poll',
        title: `Public Poll Live: ${p.title}`,
        message: `Voting is now open for "${p.title}". Make your voice count!`,
        entityType: 'poll',
        entityId: pollId,
        actionUrl: `/dashboard/citizen/voting/${pollId}`,
        priority: 'normal',
      });
    }
  }
}
