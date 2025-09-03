import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface LoginProps {
  onLogin?: (email: string, password: string) => Promise<void> | void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setLoading(true);
    try {
      if (onLogin) {
        await onLogin(email, password);
      } else {
        const res = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || 'Login failed');
        }
        window.location.href = '/';
      }
    } catch (err: any) {
      setErrMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-950 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <img src="src/uploads/squareone_logo.png" alt="Logo" className="h-24" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Modern Healthcare<br />Management
            </h2>
            <p className="text-xl text-blue-200/80 leading-relaxed">
              Streamline your practice with our comprehensive management system designed for modern healthcare providers.
            </p>
            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full grid place-items-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-blue-100/90">Patient Management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full grid place-items-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-blue-100/90">Appointment Scheduling</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full grid place-items-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span className="text-blue-100/90">Billing & Payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute bottom-20 right-32 w-20 h-20 bg-white/5 rounded-full" />
        <div className="absolute top-40 right-40 w-16 h-16 bg-purple-400/20 rounded-full" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-100 mb-2">Welcome to SquareOne Portal</h2>
            <p className="text-gray-400">Your comprehensive practice management solution</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-gray-900 border border-gray-800 ring-1 ring-white/5 rounded-2xl p-6 shadow-lg"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-800 bg-gray-950 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-800 bg-gray-950 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-950 focus:ring-blue-500/40"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-400">
                Remember me
              </label>
            </div>

            {errMsg && (
              <div className="text-sm text-red-400 -mt-2" role="alert" aria-live="polite">
                {errMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
              <span aria-hidden>→</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
