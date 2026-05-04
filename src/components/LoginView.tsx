import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Logo } from './Logo';

interface LoginViewProps {
  onSuccess: (user: any) => void;
}

import { useToast } from './ToastProvider';

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    branchId: ''
  });

  useEffect(() => {
    if (!isLogin) {
      fetch('/api/auth/branches')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch branches');
          return res.json();
        })
        .then(data => setBranches(data))
        .catch(err => {
          console.error("Could not fetch branches", err);
          toast("Notice: Admin features might be limited. Branches could not be loaded.", "warning");
        });
    }
  }, [isLogin, toast]);

  const validatePassword = (password: string) => {
    if (!password) return false;
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      if (!formData.branchId) {
        setError("Please select a branch.");
        return;
      }
      const passValid = validatePassword(formData.password);
      if (passValid !== true) {
        setError(passValid as string);
        return;
      }
    }
    setLoading(true);
    setError(null);
    
    // Generate or fetch Device ID for binding
    let deviceId = localStorage.getItem('DOORLOG_DEVICE_ID');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('DOORLOG_DEVICE_ID', deviceId);
    }
    
    try {
      let user;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password, deviceId }
        : { 
            name: formData.name, 
            email: formData.email, 
            password: formData.password,
            branchId: formData.branchId,
            deviceId // Also send for registration so first device is bound
          };
        
      const res = await fetch(isLogin ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        let errorMessage = data.error || (isLogin ? 'Login failed' : 'Registration failed');
        if (data.details) {
          errorMessage += `: ${data.details}`;
        }
        throw new Error(errorMessage);
      }
      
      api.saveAuthData(data.user, data.token);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate reset email
    await new Promise(r => setTimeout(r, 1500));
    setResetSent(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[50] flex flex-col p-6 overflow-y-auto no-scrollbar transition-colors">
      {/* Header Section */}
      <div className="pt-12 pb-10 text-center">
        <Logo size={80} className="mb-8 drop-shadow-2xl" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-xs font-medium text-slate-500 max-w-[220px] mx-auto leading-relaxed">
          {isLogin 
            ? 'Sign in to access your secure workplace dashboard.' 
            : 'Join DoorLog to manage your access and attendance.'}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex-1 flex flex-col">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Full Name</label>
                <div className="relative mb-5">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Emeka Obi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                  />
                </div>

                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Working Branch</label>
                <div className="relative mb-5">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                  <select 
                    required 
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none" 
                  >
                    <option value="">Select your branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
              <input 
                type="email" 
                required 
                placeholder="emeka.obi@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center px-1 mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => setShowForgot(true)}
                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${
                  !isLogin && formData.password && formData.password.length < 8 ? 'border-amber-400' : ''
                }`} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" /> }
              </button>
            </div>
            {!isLogin && formData.password && (
              <div className="flex flex-wrap gap-2 px-1 mt-2">
                {[
                  { label: '8+ Chars', met: formData.password.length >= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(formData.password) },
                  { label: 'Number', met: /[0-9]/.test(formData.password) }
                ].map((req, i) => (
                  <div key={i} className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider ${req.met ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <div className={`w-1 h-1 rounded-full ${req.met ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-bold py-5 rounded-[28px] mt-4 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50 disabled:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-xs">
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-400 mb-1">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
          >
            {isLogin ? "Register now" : "Back to login"}
          </button>
        </div>
      </div>

      {/* Forgot Password Overlay */}
      <AnimatePresence>
        {showForgot && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 bg-white dark:bg-slate-950 z-[100] p-8 flex flex-col justify-center items-center text-center"
          >
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8">
              <Mail className="w-10 h-10 text-indigo-600" />
            </div>
            
            {!resetSent ? (
               <>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Reset Password</h2>
                 <p className="text-sm text-slate-500 mb-8 max-w-[280px]">Enter your work email and we'll send you a link to reset your password.</p>
                 
                 <form onSubmit={handleResetPassword} className="w-full space-y-4 max-w-[320px]">
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                     <input 
                       type="email" 
                       required 
                       placeholder="name@company.com"
                       value={resetEmail}
                       onChange={(e) => setResetEmail(e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                     />
                   </div>
                   <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] mt-4 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                   >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                   </button>
                 </form>
               </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Email Sent!</h2>
                <p className="text-sm text-slate-500 mb-8 max-w-[280px]">Check your inbox for a password reset link. It will expire in 30 minutes.</p>
                <div className="py-4 px-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-bold mb-8">
                  {resetEmail}
                </div>
              </motion.div>
            )}

            <button 
              onClick={() => { setShowForgot(false); setResetSent(false); }}
              className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Back to Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="mt-12 text-center pb-6">
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-800 uppercase tracking-[0.3em]">
          DoorLog Security v1.0
        </p>
      </div>
    </div>
  );
};
