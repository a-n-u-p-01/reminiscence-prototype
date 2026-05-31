import React, { useState, useEffect } from 'react';
import { Terminal, ArrowRight } from 'lucide-react';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { useAppReset } from '../hooks/useAppReset';

export default function AuthPage({ onAuthSuccess }) {
  const { login, loading: authLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const resetAppContext = useAppReset();

  useEffect(() => {
    if (!authLoading) resetAppContext();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let responseData = isRegister 
        ? await authService.register(formData.fullName, formData.email, formData.password)
        : await authService.login(formData.email, formData.password);

      if (responseData?.token) {
        const { token, ...userMetadata } = responseData;
        await login(userMetadata, token);
        onAuthSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#09090b] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        
        {/* Logo Container (Matches image_a5bc03.png) */}
        <div className="flex justify-start mb-10">
          <div className="flex items-center gap-2 bg-[#18181b] px-3 py-1.5 rounded-lg border border-white/5">
            <Terminal className="text-white" size={16} />
            <span className="text-white font-medium text-sm tracking-tight">reminiscence</span>
          </div>
        </div>

        {/* Heading Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Welcome back</h1>
          <p className="text-zinc-500 text-sm">Sign in to access your dashboard.</p>
        </div>

        {/* Error Display */}
        {error && <p className="mb-4 text-xs text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <input
              type="text"
              placeholder="Full name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-sm font-medium py-3 rounded-md flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : (isRegister ? 'Register' : 'Sign in')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setError(null); }}
          className="w-full mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-center"
        >
          {isRegister ? 'Already have an account? Log in' : 'Don\'t have an account? Register'}
        </button>
      </div>
    </div>
  );
}