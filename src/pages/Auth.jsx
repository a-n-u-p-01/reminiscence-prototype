import React, { useState, useEffect } from 'react';
import { Terminal, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { useAppReset } from '../hooks/useAppReset';

export default function AuthPage({ onAuthSuccess }) {
  const { login, loading: authLoading,getCookie } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const resetAppContext = useAppReset();

  // Structural Fallback Safety: Sanitize address path parameters instantly on layout mount
  useEffect(() => {
    if (!authLoading) {
      resetAppContext();
    }
    if (window.location.hash) {
      window.location.hash = '';
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let responseData;
      if (isRegister) {
        responseData = await authService.register(formData.fullName, formData.email, formData.password);
      } else {
        responseData = await authService.login(formData.email, formData.password);
      }

      if (responseData?.token) {
        const { token, ...userMetadata } = responseData;

        await login(userMetadata, token);
        setFormData({ fullName: '', email: '', password: '' });

        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } else {
        setError('Authentication succeeded, but no token payload was returned by the server.');
      }

    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'An error occurred during authentication.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-dark-bg flex flex-col justify-center px-6 pb-12 -translate-y-8">

      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <Terminal className="text-blue-500" size={26} />
        <h1 className="text-xl font-bold tracking-tight font-mono">
          reminiscence_
        </h1>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-dark-card border border-zinc-800 rounded-2xl p-6 shadow-xl">

        <h2 className="text-lg font-semibold mb-1 text-zinc-200">
          {isRegister ? 'Create your developer account' : 'Welcome back'}
        </h2>

        <p className="text-xs text-zinc-500 mb-6">
          {isRegister
            ? 'Sign up to start tracking your knowledge anchors.'
            : 'Sign in to access your daily revision queue.'}
        </p>

        {/* Dynamic Axios Network Error Banner */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Conditional Registration Field */}
          {isRegister && (
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Full Name
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <User size={16} />
                </span>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Somyo"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full bg-dark-bg border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Address Input */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email Address
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Mail size={16} />
              </span>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="somu@esspl.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                className="w-full bg-dark-bg border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Password
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Lock size={16} />
              </span>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                className="w-full bg-dark-bg border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Action Submit Control */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? 'Register Account' : 'Sign In'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Dynamic Form Toggle Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setFormData({
                fullName: '',
                email: '',
                password: '',
              });
            }}
            className="text-xs text-zinc-500 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            {isRegister
              ? 'Already have an account? Log In'
              : "Don't have an account? Register"}
          </button>
        </div>

      </div>
    </div>
  );
}