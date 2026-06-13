import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowRight, Eye, EyeOff, ArrowLeft, Brain, Target, TrendingUp } from 'lucide-react';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { useAppReset } from '../hooks/useAppReset';
import StatusCapsule from '../components/StatusCapsule';

export default function AuthPage({ onAuthSuccess }) {
  const { login, loading: authLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // New state for OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for premium grid
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  
  const inputRefs = useRef([]); // Refs for OTP auto-focus
  const resetAppContext = useAppReset();

  useEffect(() => {
    if (!authLoading) resetAppContext();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [error]);

  const resetForm = () => {
    setFormData({ fullName: '', email: '', password: '' });
  };

  // --- Auth Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isRegister) {
        // Switch to OTP screen smoothly upon registration
        await authService.register(formData.fullName, formData.email, formData.password);
        setIsVerifying(true);
      } else {
        const responseData = await authService.login(formData.email, formData.password);
        if (responseData?.token) {
          const { token, ...userMetadata } = responseData;
          resetForm();
          await login(userMetadata, token);
          onAuthSuccess?.();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- Premium OTP Logic ---
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return; // Only allow numbers
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    
    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Auto-backspace to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.verifyOtp(formData.email, otp.join(''));
      const responseData = await authService.login(formData.email, formData.password);
      if (responseData?.token) {
        const { token, ...userMetadata } = responseData;
        resetForm();
        await login(userMetadata, token);
        onAuthSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh h-dvh w-full bg-[var(--color-dark-bg)] flex overflow-hidden transition-colors duration-300">

      {/* Autofill CSS Fix */}
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0px 1000px var(--color-dark-bg) inset !important;
            -webkit-text-fill-color: var(--color-zinc-100) !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}
      </style>

      <StatusCapsule
        message={error ? { text: error, type: 'error' } : null}
      />

      {/* ===== Desktop brand panel (lg+) ===== */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between lg:w-[46%] xl:w-1/2 relative border-r border-[var(--color-dark-border)] p-12 xl:p-16 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 w-[60%] h-[60%] bg-[var(--color-blue-600)] opacity-[0.07] blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 w-[50%] h-[50%] bg-[var(--color-blue-500)] opacity-[0.05] blur-[120px] rounded-full" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] flex items-center justify-center text-[var(--color-blue-400)]">
            <Brain size={20} strokeWidth={1.7} />
          </div>
          <span className="text-[var(--color-zinc-100)] font-semibold text-lg tracking-tight">Reminiscence</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight text-[var(--color-zinc-100)] leading-[1.1]">
            Turn daily notes into lasting memory.
          </h2>
          <p className="text-[var(--color-zinc-500)] text-sm leading-relaxed mt-5">
            A focused spaced-repetition workspace. Log what you learn, and the engine resurfaces it exactly when you're about to forget.
          </p>

          <div className="mt-10 space-y-5">
            {[
              { icon: Brain, title: 'Contextual synthesis', desc: 'Raw thoughts distilled into precise revision anchors.' },
              { icon: Target, title: 'Active recall loops', desc: 'Reviews trigger only when concepts are ready to decay.' },
              { icon: TrendingUp, title: 'Retention you can see', desc: 'Streaks, mastery and a 365-day activity matrix.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] text-[var(--color-blue-400)] shrink-0">
                  <Icon size={15} />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--color-zinc-200)]">{title}</div>
                  <div className="text-xs text-[var(--color-zinc-500)] mt-0.5 leading-normal">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-zinc-600)]">
          Engineered for deep retention
        </div>
      </div>

      {/* ===== Form side ===== */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-start lg:justify-center pt-24 lg:pt-0 px-6 overflow-y-auto">
      <div className="w-full max-w-[320px] lg:max-w-[360px]">
        
        <div className="flex justify-start mb-10">
          <div className="flex items-center gap-2 bg-[var(--color-dark-card)] px-3 py-1.5 rounded-lg border border-[var(--color-dark-border)]">
            <Terminal className="text-[var(--color-blue-500)]" size={16} />
            <span className="text-[var(--color-zinc-100)] font-medium text-sm tracking-tight">reminiscence</span>
          </div>
        </div>

        {isVerifying ? (
          /* --- PREMIUM OTP SCREEN --- */
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-[var(--color-zinc-100)] mb-2">Verify email</h1>
              <p className="text-[var(--color-zinc-500)] text-sm">Code sent to {formData.email}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="flex justify-between gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 bg-transparent border-b border-[var(--color-dark-border)] text-center text-2xl text-[var(--color-zinc-100)] focus:outline-none focus:border-[var(--color-zinc-300)] transition-colors duration-300"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="w-full bg-[var(--color-blue-600)] text-[var(--color-zinc-100)] text-sm font-medium py-3 rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-blue-500)] transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <button
              onClick={() => setIsVerifying(false)}
              className="w-full mt-6 text-xs text-[var(--color-zinc-500)] hover:text-[var(--color-zinc-400)] transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft size={12} /> Back to register
            </button>
          </div>
        ) : (
          /* --- ORIGINAL FORM SCREEN --- */
          <div className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-[var(--color-zinc-100)] mb-2">
                {isRegister ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="text-[var(--color-zinc-500)] text-sm">
                {isRegister ? 'Start your journey today.' : 'Sign in to access your dashboard.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-transparent border-b border-[var(--color-dark-border)] py-2 text-sm text-[var(--color-zinc-100)] placeholder-[var(--color-zinc-600)] focus:outline-none focus:border-[var(--color-zinc-300)] transition-colors"
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-transparent border-b border-[var(--color-dark-border)] py-2 text-sm text-[var(--color-zinc-100)] placeholder-[var(--color-zinc-600)] focus:outline-none focus:border-[var(--color-zinc-300)] transition-colors"
              />

              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-transparent border-b border-[var(--color-dark-border)] py-2 pr-8 text-sm text-[var(--color-zinc-100)] placeholder-[var(--color-zinc-600)] focus:outline-none focus:border-[var(--color-zinc-300)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-zinc-600)] hover:text-[var(--color-zinc-400)] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-blue-600)] text-[var(--color-zinc-100)] text-sm font-medium py-3 rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-blue-500)] transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : (isRegister ? 'Register' : 'Sign in')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <button
              onClick={() => { setIsRegister(!isRegister); setError(null); resetForm(); }}
              className="w-full mt-6 text-xs text-[var(--color-zinc-500)] hover:text-[var(--color-zinc-400)] transition-colors text-center"
            >
              {isRegister ? 'Already have an account? Log in' : 'Don\'t have an account? Register'}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}