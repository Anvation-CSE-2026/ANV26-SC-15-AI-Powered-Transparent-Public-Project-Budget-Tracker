import type { UserProfile, UserRole } from './index';

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface LoginFormData {
  identifier: string; // Email or Username
  password: string;
}

export interface AuthContextType {
  currentUser: import('firebase/auth').User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirebaseConfigured: boolean;
  profileMissing: boolean;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  register: (data: RegisterFormData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

export interface UsernameDoc {
  uid: string;
  username: string;
  email: string;
  createdAt: string;
}
