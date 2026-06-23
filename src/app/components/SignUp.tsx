import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Github, Chrome, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

interface SignUpProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[630px]"
      >
        {/* Left Side: Branding/Visual */}
        <div className="md:w-1/2 bg-[#0d3b2e] p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Powered by Voice AI</span>
            <h1 className="text-4xl font-bold text-white mt-8 mb-4">Speak2Design</h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Transform Voice into Beautiful Designs. Join thousands of designers using voice commands to build stunning interfaces.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-1.5 h-32">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: [20, 60, 30, 80, 40][i % 5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                  className="w-2.5 bg-white/30 rounded-full"
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 text-white/40 text-sm text-center">
            Supported languages: English & Urdu
          </div>

          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-green-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-green-500/10 blur-[100px] rounded-full" />
        </div>

        {/* Right Side: Form Component */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 mt-2">
              {isLoginMode ? 'Sign in to access your canvas dashboard' : 'Start designing with your voice today'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleFormSubmission}>
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0052CC] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0052CC] focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0052CC] focus:border-transparent outline-none transition-all"
                  placeholder={isLoginMode ? 'Enter your account password' : 'Create a strong password'}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0d3b2e] hover:bg-[#092b21] disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : isLoginMode ? (
                'Sign In to Account'
              ) : (
                'Create Account'
              )}
              {!isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700">
              <Chrome className="w-5 h-5" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700">
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button" 
              onClick={() => setIsLoginMode(!isLoginMode)} 
              className="text-[#0052CC] font-bold hover:underline cursor-pointer"
            >
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};