import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import type { UserProfile, UserRole } from '../types';
import type { RegisterFormData, UsernameDoc } from '../types/auth';

/**
 * Normalizes username by trimming and converting to lowercase for consistent case-insensitive uniqueness.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * In-memory / sessionStorage fallback store for local development
 * when Firebase keys are not yet provided in .env.local
 */
const LOCAL_STORAGE_KEY_USERS = 'civicsight_local_users';
const LOCAL_STORAGE_KEY_USERNAMES = 'civicsight_local_usernames';

function getInitialSeedUsers(): Record<string, UserProfile & { passwordHash?: string }> {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    'cit-seed-1': {
      uid: 'cit-seed-1',
      username: 'aarav',
      email: 'aarav@citizen.org',
      displayName: 'Aarav Sharma',
      role: 'citizen',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash: '123456',
    },
    'citizen-demo': {
      uid: 'citizen-demo',
      username: 'citizen',
      email: 'citizen@civicsight.org',
      displayName: 'Demo Citizen',
      role: 'citizen',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash: '123456',
    },
    'pm-seed-1': {
      uid: 'pm-seed-1',
      username: 'pm_authority',
      email: 'pm@civicsight.gov.in',
      displayName: 'Er. Rajesh Deshmukh',
      role: 'project_manager',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash: '123456',
    },
    'admin-demo': {
      uid: 'admin-demo',
      username: 'admin',
      email: 'admin@civicsight.gov.in',
      displayName: 'Municipal Commissioner',
      role: 'project_manager',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash: '123456',
    },
    'cont-01': {
      uid: 'cont-01',
      username: 'contractor_apex',
      email: 'apex@contractor.org',
      displayName: 'Apex Urban Infra Tech Ltd',
      role: 'contractor',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash: '123456',
    },
    'contractor-demo': {
      uid: 'contractor-demo',
      username: 'contractor',
      email: 'contractor@civicsight.org',
      displayName: 'Demo Contractor',
      role: 'contractor',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash: '123456',
    },
  };
}

function getInitialSeedUsernames(): Record<string, UsernameDoc> {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    aarav: { uid: 'cit-seed-1', username: 'aarav', email: 'aarav@citizen.org', createdAt: now },
    citizen: { uid: 'citizen-demo', username: 'citizen', email: 'citizen@civicsight.org', createdAt: now },
    pm_authority: { uid: 'pm-seed-1', username: 'pm_authority', email: 'pm@civicsight.gov.in', createdAt: now },
    admin: { uid: 'admin-demo', username: 'admin', email: 'admin@civicsight.gov.in', createdAt: now },
    contractor_apex: { uid: 'cont-01', username: 'contractor_apex', email: 'apex@contractor.org', createdAt: now },
    contractor: { uid: 'contractor-demo', username: 'contractor', email: 'contractor@civicsight.org', createdAt: now },
  };
}

function getLocalUsers(): Record<string, UserProfile & { passwordHash?: string }> {
  try {
    const raw = sessionStorage.getItem(LOCAL_STORAGE_KEY_USERS);
    if (!raw) {
      const seed = getInitialSeedUsers();
      saveLocalUsers(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialSeedUsers();
  }
}

function saveLocalUsers(users: Record<string, UserProfile & { passwordHash?: string }>) {
  try {
    sessionStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getLocalUsernames(): Record<string, UsernameDoc> {
  try {
    const raw = sessionStorage.getItem(LOCAL_STORAGE_KEY_USERNAMES);
    if (!raw) {
      const seed = getInitialSeedUsernames();
      saveLocalUsernames(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialSeedUsernames();
  }
}

function saveLocalUsernames(usernames: Record<string, UsernameDoc>) {
  try {
    sessionStorage.setItem(LOCAL_STORAGE_KEY_USERNAMES, JSON.stringify(usernames));
  } catch {
    // ignore
  }
}

/**
 * Checks whether a normalized username is available.
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);

  if (isFirebaseConfigured && db) {
    const usernameDocRef = doc(db, 'usernames', normalized);
    const snap = await getDoc(usernameDocRef);
    return !snap.exists();
  }

  // Fallback dev mode check
  const localUsernames = getLocalUsernames();
  return !localUsernames[normalized];
}

/**
 * Registers a new user with Firebase Authentication and creates their Cloud Firestore profile.
 */
export async function registerUser(data: RegisterFormData): Promise<UserProfile> {
  const normalizedUsername = normalizeUsername(data.username);
  const trimmedEmail = data.email.trim().toLowerCase();

  // 1. Verify username availability
  const isAvailable = await checkUsernameAvailability(normalizedUsername);
  if (!isAvailable) {
    throw new Error('auth/username-already-taken');
  }

  if (isFirebaseConfigured && auth && db) {
    // 2. Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, data.password);
    const uid = cred.user.uid;

    // 3. Set display name in Auth
    await updateProfile(cred.user, { displayName: data.username.trim() });

    // 4. Construct Firestore profile
    const nowIso = new Date().toISOString();
    const userProfile: UserProfile = {
      uid,
      username: data.username.trim(),
      email: trimmedEmail,
      role: data.role,
      displayName: data.username.trim(),
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 5. Write users/{uid} document
    await setDoc(doc(db, 'users', uid), {
      ...userProfile,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });

    // 6. Write usernames/{normalizedUsername} document for fast, secure lookup and uniqueness
    const usernameData: UsernameDoc = {
      uid,
      username: data.username.trim(),
      email: trimmedEmail,
      createdAt: nowIso,
    };
    await setDoc(doc(db, 'usernames', normalizedUsername), usernameData);

    return userProfile;
  }

  // Fallback Dev Mode (when Firebase credentials are not yet entered)
  const mockUid = `dev_uid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: mockUid,
    username: data.username.trim(),
    email: trimmedEmail,
    role: data.role,
    displayName: data.username.trim(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const users = getLocalUsers();
  users[mockUid] = { ...profile, passwordHash: data.password };
  saveLocalUsers(users);

  const usernames = getLocalUsernames();
  usernames[normalizedUsername] = {
    uid: mockUid,
    username: data.username.trim(),
    email: trimmedEmail,
    createdAt: now,
  };
  saveLocalUsernames(usernames);

  return profile;
}

/**
 * Logs in a user using Email or Username + Password.
 */
export async function loginUser(identifier: string, password: string): Promise<UserProfile> {
  const trimmed = identifier.trim();
  let emailToAuth = trimmed;

  // Determine if identifier is an email or username
  const isEmail = trimmed.includes('@');

  if (isFirebaseConfigured && auth && db) {
    if (!isEmail) {
      // Resolve normalized username from Firestore
      const normalized = normalizeUsername(trimmed);
      const usernameDocRef = doc(db, 'usernames', normalized);
      const usernameSnap = await getDoc(usernameDocRef);

      if (!usernameSnap.exists()) {
        throw new Error('auth/user-not-found');
      }

      const usernameData = usernameSnap.data() as UsernameDoc;
      emailToAuth = usernameData.email;
    }

    // Authenticate with Firebase Authentication
    const cred = await signInWithEmailAndPassword(auth, emailToAuth, password);
    const uid = cred.user.uid;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      throw new Error('auth/profile-not-found');
    }

    const data = userSnap.data();
    return {
      uid,
      username: data.username || 'User',
      email: data.email || cred.user.email || '',
      role: data.role as UserRole,
      displayName: data.displayName || cred.user.displayName || '',
      photoURL: data.photoURL || cred.user.photoURL || undefined,
      phone: data.phone,
      isActive: data.isActive !== false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt,
    };
  }

  // Fallback Dev Mode
  const users = getLocalUsers();
  const usernames = getLocalUsernames();

  let targetUid: string | null = null;
  if (isEmail) {
    const found = Object.values(users).find(
      (u) => u.email.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) targetUid = found.uid;
  } else {
    const normalized = normalizeUsername(trimmed);
    const usernameDoc = usernames[normalized];
    if (usernameDoc) targetUid = usernameDoc.uid;
  }

  if (!targetUid || !users[targetUid]) {
    throw new Error('auth/invalid-credential');
  }

  const user = users[targetUid];
  if (user.passwordHash && user.passwordHash !== password) {
    throw new Error('auth/wrong-password');
  }

  return user;
}

/**
 * Retrieves the user profile from Cloud Firestore by UID.
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid,
      username: data.username,
      email: data.email,
      role: data.role as UserRole,
      displayName: data.displayName,
      photoURL: data.photoURL,
      phone: data.phone,
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  // Dev fallback
  const users = getLocalUsers();
  return users[uid] || null;
}

/**
 * Sends a password reset email via Firebase Authentication.
 */
export async function resetPassword(email: string): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return;
  }
  // In dev mode, simulate successful trigger
  await new Promise((res) => setTimeout(res, 500));
}

/**
 * Signs out the authenticated user.
 */
export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}
