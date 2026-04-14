import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyBranding } from '../contexts/CompanyBrandingContext';
import { Building2, X, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, resetPassword, configError } = useAuth();
  const { branding } = useCompanyBranding();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setResetEmail('');
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {configError && (
          <div className="mb-6 bg-red-900 border-2 border-red-600 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-200 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-red-100 font-bold mb-2">Configuration Error</h2>
                <p className="text-red-100 text-sm mb-3">{configError}</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mb-4 flex flex-col items-center gap-3">
              <img src="/logo1.png" alt="Cybaem Tech" className="h-20 w-auto object-contain" />
              <h1
                className="text-3xl font-bold"
                style={{ color: branding?.primary_color || '#0f172a' }}
              >
                CYBAEM TECH
              </h1>
            </div>
            <p className="text-slate-600">Daily Reporting & Attendance</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: branding
                  ? `linear-gradient(to right, ${branding.primary_color}, ${branding.secondary_color})`
                  : 'linear-gradient(to right, #3b82f6, #2563eb)',
                boxShadow: branding ? `0 0 0 0 ${branding.primary_color}` : '0 0 0 0 #3b82f6',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Demo Credentials</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@company.com');
                    setPassword('password123');
                  }}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Admin</p>
                  <p className="text-[10px] text-slate-500 truncate">admin@company.com</p>
                  <p className="text-[10px] text-slate-400">password123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('hr@company.com');
                    setPassword('password123');
                  }}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">HR Manager</p>
                  <p className="text-[10px] text-slate-500 truncate">hr@company.com</p>
                  <p className="text-[10px] text-slate-400">password123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('engineer@company.com');
                    setPassword('password123');
                  }}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Engineer</p>
                  <p className="text-[10px] text-slate-500 truncate">engineer@company.com</p>
                  <p className="text-[10px] text-slate-400">password123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('client@company.com');
                    setPassword('password123');
                  }}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">Client</p>
                  <p className="text-[10px] text-slate-500 truncate">client@company.com</p>
                  <p className="text-[10px] text-slate-400">password123</p>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess(false);
                  setResetError('');
                  setResetEmail('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                Password reset email sent! Check your inbox for instructions.
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {resetError}
                  </div>
                )}

                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: branding
                      ? `linear-gradient(to right, ${branding.primary_color}, ${branding.secondary_color})`
                      : 'linear-gradient(to right, #3b82f6, #2563eb)',
                  }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
