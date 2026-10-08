import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Toast } from '../../components/common/Toast';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(trimmedEmail);
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorCode = err instanceof Error ? err.message : 'auth/unknown';
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

        <h2 className="mt-4 text-center text-lg font-bold text-white tracking-tight font-heading">
          Reset Your Password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enter your registered email to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {errorMessage && (
            <div className="mb-5">
              <Toast
                type="error"
                title="Reset Request Failed"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Instructions Dispatched
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                If an account exists for <strong className="text-slate-800">{email}</strong>, a password reset link has been dispatched. Please check your inbox and spam folder.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Registered Email Address"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  {isLoading ? 'Sending Reset Email...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
