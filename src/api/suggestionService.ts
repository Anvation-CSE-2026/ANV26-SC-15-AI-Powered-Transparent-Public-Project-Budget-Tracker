import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebase';
import type {
  Suggestion,
  SuggestionUpdate,
  SuggestionAttachment,
  CreateSuggestionInput,
  SuggestionStatus,
} from '../types/suggestion';
import type { UserProfile } from '../types';
import { generateSuggestionNumber } from '../utils/suggestionIdGenerator';

const LOCAL_STORAGE_SUGGESTIONS = 'civicsight_local_suggestions';
const LOCAL_STORAGE_SUGGESTION_UPDATES = 'civicsight_local_suggestion_updates';

const suggestionMemoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return suggestionMemoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  suggestionMemoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

function getLocalSuggestions(): Record<string, Suggestion> {
  try {
    const raw = safeGetItem(LOCAL_STORAGE_SUGGESTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalSuggestions(data: Record<string, Suggestion>) {
  try {
    safeSetItem(LOCAL_STORAGE_SUGGESTIONS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getLocalSuggestionUpdates(): Record<string, SuggestionUpdate[]> {
  try {
    const raw = safeGetItem(LOCAL_STORAGE_SUGGESTION_UPDATES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalSuggestionUpdates(data: Record<string, SuggestionUpdate[]>) {
  try {
    safeSetItem(LOCAL_STORAGE_SUGGESTION_UPDATES, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Uploads an attachment to Firebase Storage or base64 fallback in offline dev mode.
 */
export async function uploadSuggestionAttachment(
  suggestionId: string,
  file: File,
  uploadedBy: string
): Promise<SuggestionAttachment> {
  const fileId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileName = file.name;
  const contentType = file.type;
  const size = file.size;
  const nowIso = new Date().toISOString();

  if (isFirebaseConfigured && storage) {
    const storagePath = `suggestions/${suggestionId}/attachments/${fileId}_${fileName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return {
      id: fileId,
      fileName,
      storagePath,
      downloadURL,
      contentType,
      size,
      uploadedBy,
      createdAt: nowIso,
    };
  }

  // Offline / local preview fallback using FileReader
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        id: fileId,
        fileName,
        storagePath: `local/suggestions/${fileName}`,
        downloadURL: (e.target?.result as string) || '',
        contentType,
        size,
        uploadedBy,
        createdAt: nowIso,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a new Citizen Suggestion.
 */
export async function createSuggestion(
  input: CreateSuggestionInput,
  user: UserProfile,
  attachmentFiles: File[] = []
): Promise<Suggestion> {
  const nowIso = new Date().toISOString();
  let suggestionId: string;
  const suggestionNumber = generateSuggestionNumber();

  if (isFirebaseConfigured && db) {
    const newDocRef = doc(collection(db, 'suggestions'));
    suggestionId = newDocRef.id;
  } else {
    suggestionId = `sgg_${Date.now()}`;
  }

  // Upload attachments
  const uploadedAttachments: SuggestionAttachment[] = [];
  for (const file of attachmentFiles) {
    const att = await uploadSuggestionAttachment(suggestionId, file, user.username);
    uploadedAttachments.push(att);
  }

  const newSuggestion: Suggestion = {
    id: suggestionId,
    suggestionNumber,
    citizenId: user.uid,
    citizenName: user.displayName || user.username,
    citizenEmail: user.email,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    location: input.location,
    attachments: uploadedAttachments,
    status: 'submitted',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const initialUpdate: SuggestionUpdate = {
    id: `upd_${Date.now()}`,
    suggestionId,
    actorId: user.uid,
    actorName: user.displayName || user.username,
    actorRole: 'citizen',
    action: 'Suggestion Submitted',
    status: 'submitted',
    message: 'Civic suggestion registered by citizen and queued for authority evaluation.',
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'suggestions', suggestionId), {
      ...newSuggestion,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'suggestions', suggestionId, 'updates', initialUpdate.id), initialUpdate);
  } else {
    const local = getLocalSuggestions();
    local[suggestionId] = newSuggestion;
    saveLocalSuggestions(local);

    const localUpdates = getLocalSuggestionUpdates();
    localUpdates[suggestionId] = [initialUpdate];
    saveLocalSuggestionUpdates(localUpdates);
  }

  return newSuggestion;
}

/**
 * Queries citizen's own suggestions.
 */
export async function getCitizenSuggestions(
  citizenId: string,
  filters?: {
    status?: string;
    category?: string;
    searchQuery?: string;
    sortBy?: 'latest' | 'oldest';
  }
): Promise<Suggestion[]> {
  let list: Suggestion[] = [];

  if (isFirebaseConfigured && db && citizenId) {
    try {
      const q = query(
        collection(db, 'suggestions'),
        where('citizenId', '==', citizenId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Suggestion);
    } catch (err) {
      console.warn('[CivicSight] Error querying citizen suggestions from Firestore:', err);
    }
  }

  if (list.length === 0) {
    const local = getLocalSuggestions();
    list = Object.values(local).filter((s) => s.citizenId === citizenId);
  }

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((s) => s.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((s) => s.category === filters.category);
  }
  if (filters?.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(queryLower) ||
        s.suggestionNumber.toLowerCase().includes(queryLower) ||
        s.description.toLowerCase().includes(queryLower)
    );
  }

  list.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return filters?.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  return list;
}

/**
 * Authority: Queries all municipal suggestions.
 */
export async function getAllSuggestions(filters?: {
  status?: string;
  category?: string;
  searchQuery?: string;
  sortBy?: 'latest' | 'oldest';
}): Promise<Suggestion[]> {
  let list: Suggestion[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => d.data() as Suggestion);
    } catch (err) {
      console.warn('[CivicSight] Error querying all suggestions from Firestore:', err);
    }
  }

  if (list.length === 0) {
    const local = getLocalSuggestions();
    list = Object.values(local);
  }

  // Apply filters
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((s) => s.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter((s) => s.category === filters.category);
  }
  if (filters?.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(queryLower) ||
        s.suggestionNumber.toLowerCase().includes(queryLower) ||
        s.description.toLowerCase().includes(queryLower) ||
        s.citizenName.toLowerCase().includes(queryLower)
    );
  }

  list.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return filters?.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  return list;
}

export const getAllSuggestionsForAuthority = getAllSuggestions;

/**
 * Fetches a single suggestion by ID.
 */
export async function getSuggestionById(suggestionId: string): Promise<Suggestion | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'suggestions', suggestionId));
      if (snap.exists()) {
        return snap.data() as Suggestion;
      }
    } catch (err) {
      console.warn('[CivicSight] Error fetching suggestion by ID:', err);
    }
  }

  const local = getLocalSuggestions();
  return local[suggestionId] || null;
}

/**
 * Fetches timeline updates for a suggestion.
 * For Citizens: strictly filters out internal authority notes (isInternal == false).
 * For Authority: includes both public and internal notes.
 */
export async function getSuggestionUpdates(
  suggestionId: string,
  userRole: string
): Promise<SuggestionUpdate[]> {
  let updates: SuggestionUpdate[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'suggestions', suggestionId, 'updates'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      updates = snap.docs.map((d) => d.data() as SuggestionUpdate);
    } catch (err) {
      console.warn('[CivicSight] Error querying suggestion updates:', err);
    }
  }

  if (updates.length === 0) {
    const localUpdates = getLocalSuggestionUpdates();
    updates = localUpdates[suggestionId] || [];
  }

  // Security isolation: Citizens must NEVER see internal authority memos
  if (userRole === 'citizen') {
    return updates.filter((u) => !u.isInternal);
  }

  return updates;
}

/**
 * Authority: Updates suggestion status with a public message.
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  newStatus: SuggestionStatus,
  message: string,
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  const updateLog: SuggestionUpdate = {
    id: `upd_${Date.now()}`,
    suggestionId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: `Status Updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
    status: newStatus,
    message: message.trim(),
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'suggestions', suggestionId), {
      status: newStatus,
      updatedAt: nowIso,
    });
    await setDoc(doc(db, 'suggestions', suggestionId, 'updates', updateLog.id), updateLog);
  } else {
    const local = getLocalSuggestions();
    if (local[suggestionId]) {
      local[suggestionId].status = newStatus;
      local[suggestionId].updatedAt = nowIso;
      saveLocalSuggestions(local);
    }
    const localUpdates = getLocalSuggestionUpdates();
    if (!localUpdates[suggestionId]) localUpdates[suggestionId] = [];
    localUpdates[suggestionId].push(updateLog);
    saveLocalSuggestionUpdates(localUpdates);
  }
}

/**
 * Authority: Adds official authority response visible to citizen.
 */
export async function addSuggestionAuthorityResponse(
  suggestionId: string,
  responseMessage: string,
  authorityUser: UserProfile,
  department?: string
): Promise<void> {
  const nowIso = new Date().toISOString();

  const authorityResponse = {
    message: responseMessage.trim(),
    respondedBy: authorityUser.displayName || authorityUser.username,
    department: department?.trim() || undefined,
    respondedAt: nowIso,
  };

  const updateLog: SuggestionUpdate = {
    id: `upd_${Date.now()}`,
    suggestionId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: 'Authority Official Response',
    message: responseMessage.trim(),
    isInternal: false,
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'suggestions', suggestionId), {
      authorityResponse,
      updatedAt: nowIso,
    });
    await setDoc(doc(db, 'suggestions', suggestionId, 'updates', updateLog.id), updateLog);
  } else {
    const local = getLocalSuggestions();
    if (local[suggestionId]) {
      local[suggestionId].authorityResponse = authorityResponse;
      local[suggestionId].updatedAt = nowIso;
      saveLocalSuggestions(local);
    }
    const localUpdates = getLocalSuggestionUpdates();
    if (!localUpdates[suggestionId]) localUpdates[suggestionId] = [];
    localUpdates[suggestionId].push(updateLog);
    saveLocalSuggestionUpdates(localUpdates);
  }
}

/**
 * Authority: Adds confidential internal note hidden from citizens.
 */
export async function addSuggestionInternalNote(
  suggestionId: string,
  note: string,
  authorityUser: UserProfile
): Promise<void> {
  const nowIso = new Date().toISOString();

  const noteLog: SuggestionUpdate = {
    id: `upd_${Date.now()}`,
    suggestionId,
    actorId: authorityUser.uid,
    actorName: authorityUser.displayName || authorityUser.username,
    actorRole: 'project_manager',
    action: 'Internal Authority Memo',
    message: note.trim(),
    isInternal: true, // Strictly hidden from citizens
    createdAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'suggestions', suggestionId, 'updates', noteLog.id), noteLog);
  } else {
    const localUpdates = getLocalSuggestionUpdates();
    if (!localUpdates[suggestionId]) localUpdates[suggestionId] = [];
    localUpdates[suggestionId].push(noteLog);
    saveLocalSuggestionUpdates(localUpdates);
  }
}
