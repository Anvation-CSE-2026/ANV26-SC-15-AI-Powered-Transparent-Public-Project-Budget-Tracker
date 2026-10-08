import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, Lock, User, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toast } from '../../components/common/Toast';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';
import { getDashboardRouteForRole } from '../../routes/routeConfig';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to correct dashboard
  React.useEffect(() => {
    if (isAuthenticated && role) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || getDashboardRouteForRole(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setErrorMessage('Please enter your email or username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await login(trimmedIdentifier, password);
      const destination = getDashboardRouteForRole(profile.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const errorCode = err instanceof Error ? err.message : 'auth/invalid-credential';
      setErrorMessage(getFriendlyAuthErrorMessage(errorCode));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* CivicSight Brand Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-heading">
              Civic<span className="text-blue-400">Sight</span>
            </h1>
          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-300">
          “See the Project. Understand the Data. Make Your Voice Count.”
        </p>
        <h2 className="mt-4 text-center text-lg font-bold text-white tracking-tight font-heading">
          Sign In to Your Municipal Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Citizen &bull; Project Manager &bull; Contractor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Notification if Firebase config is not in .env */}
          {!isFirebaseConfigured && (
            <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Local Development Mode</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Firebase keys not yet set in <code className="bg-blue-100 px-1 py-0.5 rounded">.env.local</code>. Running session store. When keys are added, live Firebase Auth &amp; Firestore will activate automatically.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5">
              <Toast
                type="error"
                title="Authentication Error"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email or Username"
              type="text"
              required
              placeholder="e.g. rajesh.patel or citizen@city.gov"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px]">
                Role is detected automatically
              </span>
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New to CivicSight?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-500 hover:underline"
              >
                Register an Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Protected &bull; Cloud Firestore Verified</span>
        </div>
      </div>
    </div>
  );
};
