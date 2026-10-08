import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Lock, Mail, User, ArrowRight, ShieldCheck, HardHat, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toast } from '../../components/common/Toast';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';
import { getDashboardRouteForRole } from '../../routes/routeConfig';
import type { UserRole } from '../../types';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field errors for inline validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    // Username validation
    if (!trimmedUsername) {
      errors.username = 'Username is required.';
    } else if (trimmedUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      errors.username = 'Username can only contain letters, numbers, dots, and underscores.';
    }

    // Email validation
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address.';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    // Confirm password
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // Role validation
    if (!['citizen', 'project_manager', 'contractor'].includes(role)) {
      errors.role = 'Please select a valid role.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const profile = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
      });

      const destination = getDashboardRouteForRole(profile.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const errorCode = err instanceof Error ? err.message : 'auth/unknown';
      setErrorMessage(getFriendlyAuthErrorMessage(errorCode));
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: Array<{
    id: UserRole;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'citizen',
      title: 'Citizen',
      description: 'Track public projects, report civic issues, budget transparency & vote.',
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      id: 'project_manager',
      title: 'Project Manager',
      description: 'Central command authority, oversee projects, assign SLA & approve updates.',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: 'contractor',
      title: 'Contractor',
      description: 'Manage assigned site work, submit progress updates & upload photos.',
      icon: <HardHat className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
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
        <h2 className="mt-3 text-center text-lg font-bold text-white tracking-tight font-heading">
          Create Your CivicSight Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Select your municipal role to configure your access privileges
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {errorMessage && (
            <div className="mb-5">
              <Toast
                type="error"
                title="Registration Failed"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Role Selection Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roleOptions.map((opt) => {
                  const isSelected = role === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setRole(opt.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg inline-flex ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.icon}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-2 font-heading">
                        {opt.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>
              {fieldErrors.role && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.role}</p>
              )}
            </div>

            {/* Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Input
                label="Username"
                type="text"
                required
                placeholder="e.g. aditi_sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={fieldErrors.username}
                leftIcon={<User className="w-4 h-4" />}
                helperText="Unique municipal username"
              />

              <Input
                label="Official Email"
                type="email"
                required
                placeholder="aditi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirm Password"
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={fieldErrors.confirmPassword}
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Creating Account & Setting Role...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role Assigned to Cloud Firestore &bull; No Passwords Stored in Database</span>
        </div>
      </div>
    </div>
  );
};
