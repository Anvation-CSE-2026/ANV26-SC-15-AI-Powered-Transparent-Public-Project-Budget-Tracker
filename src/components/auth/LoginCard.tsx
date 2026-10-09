import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CivicSightLogo } from '../brand/CivicSightLogo';
import { Toast } from '../common/Toast';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';
import { getDashboardRouteForRole } from '../../routes/routeConfig';

const REMEMBER_ME_KEY = 'civicsight_remembered_username';

export const LoginCard: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState<string>(() => {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBER_ME_KEY));
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && role) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || getDashboardRouteForRole(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('Please enter your username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, trimmedUsername);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    setIsLoading(true);
    try {
      const profile = await login(trimmedUsername, password);
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
    <div className="w-full max-w-[440px] mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-950/25 border border-white/80">
        <div className="flex flex-col items-center text-center mb-7">
          <CivicSightLogo
            size="lg"
            subtitle="Smart City Management Platform"
            variant="dark"
            orientation="vertical"
          />
        </div>

        {errorMessage && (
          <div className="mb-5 animate-in fade-in duration-200">
            <Toast
              type="error"
              title="Sign In Failed"
              message={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-slate-700"
            >
              Username
            </label>
            <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-sky-500 to-teal-500 hover:from-blue-700 hover:via-sky-600 hover:to-teal-600 shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:text-blue-500 hover:underline ml-1"
            >
              New Registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
