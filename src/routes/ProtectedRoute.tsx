import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, profileMissing, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border border-slate-200/80 shadow-md">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-800 font-heading">
            Verifying Municipal Credentials...
          </p>
          <p className="text-xs text-slate-400">Loading secure Firestore profile</p>
        </div>
      </div>
    );
  }

  // If Firebase Auth succeeded but Firestore profile record is missing
  if (profileMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">Profile Record Missing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your authentication session is active, but your municipal profile could not be verified in Cloud Firestore.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="danger" size="sm" onClick={() => logout()}>
              Log Out &amp; Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination path in router state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
