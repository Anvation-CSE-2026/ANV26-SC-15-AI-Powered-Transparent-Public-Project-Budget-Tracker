import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  ShieldCheck,
  Building2,
  Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CivicSightLogo } from '../brand/CivicSightLogo';
import { Toast } from '../common/Toast';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';
import { getDashboardRouteForRole } from '../../routes/routeConfig';

export type LoginMode = 'citizen' | 'admin';

const REMEMBER_ME_KEY = 'civicsight_remembered_identifier';

export const LoginCard: React.FC = () => {
  const { login, isAuthenticated, role, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<LoginMode>('citizen');
  const [identifier, setIdentifier] = useState<string>(() => {
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

  // Redirect if already authenticated
  useEffect(() => {
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
      setErrorMessage(
        mode === 'citizen'
          ? 'Please enter your email or mobile number.'
          : 'Please enter your authority email or username.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Persist or clear remember me preference
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, trimmedIdentifier);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    setIsLoading(true);
    try {
      const profile = await login(trimmedIdentifier, password);

      // Validate admin mode attempt against role
      if (mode === 'admin' && profile.role === 'citizen') {
        // Logged in as citizen while selecting Admin tab
        // We still route them to their citizen dashboard or show guidance
        const destination = getDashboardRouteForRole(profile.role);
        navigate(destination, { replace: true });
        return;
      }

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
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <CivicSightLogo
            size="lg"
            subtitle="Smart City Management Platform"
            variant="dark"
            orientation="vertical"
          />
        </div>

        {/* Mode Selector Pills: [ Citizen ]  [ Admin ] */}
        <div
          role="tablist"
          aria-label="Login Mode"
          className="p-1 bg-slate-100/90 rounded-2xl flex items-center mb-6 border border-slate-200/60"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'citizen'}
            onClick={() => {
              setMode('citizen');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              mode === 'citizen'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'admin'}
            onClick={() => {
              setMode('admin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              mode === 'admin'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Error Notification */}
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

        {/* Authority / Admin Mode Guidance Banner */}
        {mode === 'admin' && (
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">Project Manager &amp; Authority Access</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Authorized municipal officers and project managers authenticate using official municipal credentials.
              </p>
            </div>
          </div>
        )}

        {/* Dev Mode Notification if Firebase not configured */}
        {!isFirebaseConfigured && (
          <div className="mb-4 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold">Local Session Store:</strong> Firebase keys not set in environment. Demo credentials work directly.
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Mobile Number Input */}
          <div className="space-y-1">
            <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {mode === 'citizen' ? (
                  <Mail className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <input
                type={mode === 'citizen' ? 'text' : 'text'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  mode === 'citizen' ? 'Email or Mobile Number' : 'Authority Email or Username'
                }
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden bg-transparent"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
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

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
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

          {/* Primary Action Button: [ -> Sign In ] */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'citizen'
                  ? 'bg-gradient-to-r from-blue-600 via-sky-500 to-teal-500 hover:from-blue-700 hover:via-sky-600 hover:to-teal-600 shadow-blue-500/25'
                  : 'bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 hover:from-slate-950 hover:to-blue-950 shadow-slate-900/25'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
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

        {/* Registration Footer */}
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
