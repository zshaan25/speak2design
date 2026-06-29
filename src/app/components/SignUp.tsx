import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Github, Chrome, ChevronRight, ChevronLeft, RefreshCw, X, KeyRound, Mic, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '../design/GlassCard';
import { GradientButton } from '../design/GradientButton';
import { VoiceWave } from '../design/VoiceWave';
import { NeonText, GlowBadge } from '../design/NeonText';
import { Logo } from '../design/Logo';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';
const inputCls = 'w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-brand-violet/60 focus:border-transparent outline-none transition-all';

interface SignUpProps {
  onAuthSuccess: (token: string, user: any) => void;
  onBack?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onAuthSuccess, onBack }) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forgot-password flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState<{ message: string; devLink?: string } | null>(null);

  // Reset-password flow (token arrives via ?reset= in the URL)
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('reset');
    if (token) setResetToken(token);
  }, []);

  const clearResetParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    window.history.replaceState({}, '', url.toString());
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('Enter your email.'); return; }
    setForgotBusy(true);
    setForgotSent(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setForgotSent({ message: data.message, devLink: data.devLink });
        if (!data.devLink) toast.success('Reset link sent — check your email.');
      } else {
        toast.error(data.message || 'Could not start reset.');
      }
    } catch {
      toast.error('Unable to connect to the backend core system.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    setResetBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset! Please log in.');
        setResetToken(null);
        setNewPassword(''); setConfirmPassword('');
        clearResetParam();
        setIsLoginMode(true);
      } else {
        toast.error(data.message || 'Reset failed.');
      }
    } catch {
      toast.error('Unable to connect to the backend core system.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLoginMode && !name)) {
      toast.error('Please complete all form layout entry fields.');
      return;
    }

    setIsSubmitting(true);
    const targetUrl = isLoginMode
      ? `${API_BASE}/api/auth/login`
      : `${API_BASE}/api/auth/register`;

    const networkBody = isLoginMode 
      ? JSON.stringify({ email, password }) 
      : JSON.stringify({ name, email, password });

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: networkBody
      });
      
      const responseData = await response.json();
      
      if (response.ok || responseData.success) {
        toast.success(responseData.message || 'Authentication sequence complete.');
        onAuthSuccess(responseData.token, responseData.user);
      } else {
        toast.error(responseData.message || 'Authentication submission rejected.');
      }
    } catch (networkError) {
      console.error('API interaction workflow anomaly caught:', networkError);
      toast.error('Unable to connect to the backend core system.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white">

      {/* Back to landing */}
      {onBack && (
        <button onClick={onBack}
          className="absolute top-5 left-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-white/70 hover:text-white hover:border-white/25 transition-colors text-sm font-bold">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      )}

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong gradient-border rounded-2xl shadow-2xl w-full max-w-md text-white">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand-violet" /> Reset Password</h3>
                <button onClick={() => setShowForgot(false)} className="p-2 hover:bg-white/10 rounded-xl text-white/60"><X className="w-5 h-5" /></button>
              </div>
              {forgotSent ? (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-white/70">{forgotSent.message}</p>
                  {forgotSent.devLink && (
                    <div className="p-3 bg-brand-amber/10 border border-brand-amber/30 rounded-xl">
                      <p className="text-[11px] font-bold text-brand-amber uppercase tracking-wider mb-1">Dev reset link</p>
                      <a href={forgotSent.devLink} className="text-xs text-brand-cyan break-all hover:underline">{forgotSent.devLink}</a>
                    </div>
                  )}
                  <GradientButton full onClick={() => setShowForgot(false)}>Done</GradientButton>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
                  <p className="text-sm text-white/50">Enter your account email and we'll send you a link to reset your password.</p>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                  </div>
                  <GradientButton full type="submit" disabled={forgotBusy}>
                    {forgotBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </GradientButton>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal (opened via email link ?reset=token) */}
      <AnimatePresence>
        {resetToken && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong gradient-border rounded-2xl shadow-2xl w-full max-w-md text-white">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand-violet" /> Choose a New Password</h3>
                <button onClick={() => { setResetToken(null); clearResetParam(); }} className="p-2 hover:bg-white/10 rounded-xl text-white/60"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)" className={inputCls} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={inputCls} />
                </div>
                <GradientButton full type="submit" disabled={resetBusy}>
                  {resetBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </GradientButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong gradient-border w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[620px] shadow-2xl"
      >
        {/* Left Side: Branding/Visual */}
        <div className="md:w-1/2 p-12 flex flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(99,102,241,.22), rgba(139,92,246,.12) 45%, rgba(6,182,212,.14))' }}>
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-10">
              <Logo className="h-10 w-10" />
              <span className="font-display text-xl font-bold">Speak2Design</span>
            </div>
            <GlowBadge><Sparkles className="h-3.5 w-3.5 text-brand-amber" /> Powered by Voice AI</GlowBadge>
            <h1 className="font-display text-4xl font-bold leading-tight mt-6 mb-4">
              Transform Voice Into <NeonText>Beautiful Design</NeonText>
            </h1>
            <p className="text-white/55 text-base leading-relaxed max-w-sm">
              Join designers building stunning interfaces by simply speaking. From idea to live UI, instantly.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <VoiceWave active bars={22} height={64} />
            <p className="text-white/40 text-sm">Supported languages: English & اردو</p>
          </div>

          <div className="absolute -top-1/4 -left-1/4 w-72 h-72 bg-brand-violet/20 blur-[110px] rounded-full anim-float" />
          <div className="absolute -bottom-1/4 -right-1/4 w-72 h-72 bg-brand-cyan/20 blur-[110px] rounded-full anim-float" style={{ animationDelay: '-3s' }} />
        </div>

        {/* Right Side: Form Component */}
        <div className="md:w-1/2 p-10 sm:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="font-display text-3xl font-bold text-white">
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/50 mt-2">
              {isLoginMode ? 'Sign in to access your canvas dashboard' : 'Start designing with your voice today'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleFormSubmission}>
            {!isLoginMode && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Full name" />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls}
                placeholder={isLoginMode ? 'Enter your password' : 'Create a strong password'} />
            </div>

            {isLoginMode && (
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => { setForgotEmail(email); setForgotSent(null); setShowForgot(true); }}
                  className="text-xs font-bold text-brand-cyan hover:text-white transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <GradientButton full type="submit" disabled={isSubmitting} className="!py-3.5 mt-2 text-base">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                <>{isLoginMode ? 'Sign In to Account' : 'Create Account'} <ChevronRight className="w-5 h-5" /></>
              )}
            </GradientButton>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-transparent text-white/40 backdrop-blur-sm">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => { window.location.href = `${API_BASE}/api/auth/oauth/google`; }}
              className="flex items-center justify-center gap-2 py-3 px-4 glass rounded-xl hover:border-white/25 transition-all font-bold text-white/85">
              <Chrome className="w-5 h-5" /> Google
            </button>
            <button type="button" onClick={() => { window.location.href = `${API_BASE}/api/auth/oauth/github`; }}
              className="flex items-center justify-center gap-2 py-3 px-4 glass rounded-xl hover:border-white/25 transition-all font-bold text-white/85">
              <Github className="w-5 h-5" /> GitHub
            </button>
          </div>

          <p className="text-center text-white/50 mt-8 text-sm">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
            <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-brand-violet font-bold hover:text-white transition-colors cursor-pointer">
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};