import React, { useEffect, useState, useTransition } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../api/firebase';
import {
  registerUser,
  loginUser,
  fetchUserProfile,
  resetPassword as apiResetPassword,
  logoutUser,
} from '../api/authService';
import type { UserProfile, UserRole } from '../types';
import type { RegisterFormData } from '../types/auth';
import { AuthContext, LOCAL_SESSION_KEY } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (!isFirebaseConfigured) {
      try {
        const stored = sessionStorage.getItem(LOCAL_SESSION_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole | null>(() => {
    if (!isFirebaseConfigured) {
      try {
        const stored = sessionStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return (parsed.role as UserRole) || null;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured);
  const [profileMissing, setProfileMissing] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Listen to Firebase Authentication State Changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          if (profile) {
            startTransition(() => {
              setUserProfile(profile);
              setRole(profile.role);
              setProfileMissing(false);
            });
          } else {
            // Firebase Auth succeeds but Firestore profile is missing
            startTransition(() => {
              setUserProfile(null);
              setRole(null);
              setProfileMissing(true);
            });
            console.warn(
              `[CivicSight Auth] Authenticated UID ${firebaseUser.uid} has no corresponding Firestore profile in users collection.`
            );
          }
        } catch (err) {
          console.error('[CivicSight Auth] Failed to fetch user profile:', err);
          setUserProfile(null);
          setRole(null);
          setProfileMissing(true);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
        setProfileMissing(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (data: RegisterFormData): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await registerUser(data);
      setUserProfile(profile);
      setRole(profile.role);
      setProfileMissing(false);
      if (!isFirebaseConfigured) {
        sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
      }
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await loginUser(identifier, password);
      setUserProfile(profile);
      setRole(profile.role);
      setProfileMissing(false);
      if (!isFirebaseConfigured) {
        sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
      }
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutUser();
      sessionStorage.removeItem(LOCAL_SESSION_KEY);
      setCurrentUser(null);
      setUserProfile(null);
      setRole(null);
      setProfileMissing(false);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await apiResetPassword(email);
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    const uid = currentUser?.uid || userProfile?.uid;
    if (!uid) return null;
    const profile = await fetchUserProfile(uid);
    if (profile) {
      setUserProfile(profile);
      setRole(profile.role);
    }
    return profile;
  };

  const isAuthenticated = Boolean(userProfile && role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        isAuthenticated,
        isFirebaseConfigured,
        profileMissing,
        login,
        register,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
