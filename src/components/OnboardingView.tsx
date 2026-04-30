import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Scan, Calendar, ArrowRight, Check, Bell, 
  MapPin, Globe, Layout, BarChart3, Smartphone, Laptop, 
  User, Users, Briefcase, Camera, ChevronRight
} from 'lucide-react';
import { Logo } from './Logo';

interface OnboardingViewProps {
  onComplete: () => void;
}

type OnboardingStep = 
  | 'welcome' 
  | 'feature_checkin' 
  | 'feature_stats' 
  | 'feature_insights' 
  | 'feature_notif' 
  | 'feature_global' 
  | 'feature_secure' 
  | 'role_selection' 
  | 'permissions' 
  | 'success';

const steps: OnboardingStep[] = [
  'welcome',
  'feature_checkin',
  'feature_stats',
  'feature_insights',
  'feature_notif',
  'feature_global',
  'feature_secure',
  'role_selection',
  'permissions',
  'success'
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [role, setRole] = useState<'individual' | 'member' | 'admin' | null>(null);
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    notifications: false
  });

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[currentStepIndex];

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10"
      >
        <Logo size={120} className="drop-shadow-2xl" />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4"
      >
        Smarter Attendance <span className="text-indigo-600">for Every Workplace</span>
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-slate-400 mb-12 max-w-[280px]"
      >
        Modern. Reliable. Effortless. Built for every place that matters.
      </motion.p>
      <motion.button 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={nextStep}
        className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
      >
        Get Started
      </motion.button>
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onComplete}
        className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
      >
        Already have an account? Log In
      </motion.button>
    </div>
  );

  const renderFeature = (title: string, sub: string, desc: string, icon: any, color: string, bg: string) => (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center pt-10">
      <motion.div 
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        className={`w-40 h-40 mb-12 rounded-[48px] ${bg} flex items-center justify-center relative`}
      >
        <div className={`absolute inset-0 ${bg} rounded-[48px] blur-2xl opacity-30`}></div>
        {React.createElement(icon, { className: `w-16 h-16 ${color}` })}
        {/* Animated accent dots */}
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className={`absolute -top-4 -right-4 w-8 h-8 rounded-full ${bg} opacity-50`} />
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.5 }} className={`absolute -bottom-2 -left-6 w-6 h-6 rounded-full ${bg} opacity-30`} />
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="text-[13px] font-bold text-indigo-600 uppercase tracking-[0.3em] mb-2">{title}</h2>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">{sub}</h3>
        <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-[260px] mx-auto italic">
          {desc}
        </p>
      </motion.div>
    </div>
  );

  const renderRoleSelection = () => (
    <div className="flex flex-col h-full px-8 pt-16">
      <div className="text-center mb-10">
        <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Tell Us</h2>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">About You</h3>
      </div>
      <div className="space-y-4">
        {[
          { id: 'individual', title: 'Individual', sub: 'Tracking my own attendance', icon: User, color: 'text-indigo-500' },
          { id: 'member', title: 'Team Member', sub: 'Part of an organization', icon: Users, color: 'text-emerald-500' },
          { id: 'admin', title: 'Administrator', sub: 'Managing a team or organization', icon: ShieldCheck, color: 'text-rose-500' }
        ].map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRole(item.id as any)}
            className={`w-full p-6 rounded-[32px] border text-left flex items-center gap-5 transition-all ${
              role === item.id 
                ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-xl shadow-indigo-100/50 dark:shadow-none' 
                : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className={`p-3 rounded-2xl ${role === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 ' + item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.title}</h4>
              <p className="text-[10px] font-medium text-slate-400">{item.sub}</p>
            </div>
            {role === item.id && (
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
      <button 
        disabled={!role}
        onClick={nextStep}
        className={`mt-10 w-full py-5 rounded-[28px] text-xs font-bold uppercase tracking-[0.2em] transition-all ${
          role 
            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  );

  const renderPermissions = () => (
    <div className="flex flex-col h-full px-8 pt-16">
      <div className="text-center mb-10">
        <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Allow</h2>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Permissions</h3>
        <p className="text-[11px] font-medium text-slate-400 mt-2">To make the app work perfectly, we need access to a few things.</p>
      </div>
      <div className="space-y-4">
        {[
          { id: 'location', title: 'Location', sub: 'For accurate check-in', icon: MapPin, color: 'text-indigo-500' },
          { id: 'camera', title: 'Camera', sub: 'To scan QR codes', icon: Camera, color: 'text-emerald-500' },
          { id: 'notifications', title: 'Notifications', sub: 'To keep you updated', icon: Bell, color: 'text-rose-500' }
        ].map((item) => (
          <div
            key={item.id}
            className="w-full p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.title}</h4>
                <p className="text-[10px] font-medium text-slate-400">{item.sub}</p>
              </div>
            </div>
            <button 
              onClick={() => setPermissions(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              className={`p-1.5 rounded-full transition-colors ${permissions[item.id as keyof typeof permissions] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <Check className={`w-3 h-3 text-white transition-opacity ${permissions[item.id as keyof typeof permissions] ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </div>
        ))}
      </div>
      <button 
        onClick={nextStep}
        className="mt-10 w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
      >
        Complete Setup
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center pt-10">
      <motion.div 
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-32 h-32 mb-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none"
      >
        <Check className="w-16 h-16" />
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">You're All Set! 🎉</h3>
        <p className="text-sm font-medium text-slate-400 max-w-[240px] mx-auto leading-relaxed">
          Let's make attendance tracking smarter together.
        </p>
      </motion.div>
      <motion.button 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onComplete}
        className="mt-12 w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 transition-all"
      >
        Go to Dashboard
      </motion.button>
    </div>
  );

  const getContent = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcome();
      case 'feature_checkin': return renderFeature("Quick & Easy", "Check-In", "Scan a QR code or use location check-in. Fast, simple and accurate.", Scan, "text-indigo-600", "bg-indigo-50 dark:bg-indigo-500/10");
      case 'feature_stats': return renderFeature("All Your", "Attendance in One Place", "Track your attendance, history and leave — all in one smart dashboard.", Layout, "text-emerald-600", "bg-emerald-50 dark:bg-emerald-500/10");
      case 'feature_insights': return renderFeature("Insights that", "Drive You Forward", "Get detailed reports and analytics to understand your performance better.", BarChart3, "text-rose-600", "bg-rose-50 dark:bg-rose-500/10");
      case 'feature_notif': return renderFeature("Stay Notified,", "Always", "Real-time alerts and updates so you never miss what matters.", Bell, "text-amber-600", "bg-amber-50 dark:bg-amber-500/10");
      case 'feature_global': return renderFeature("Works Where", "You Work", "From offices to hospitals, schools to remote sites — Doorlog fits everywhere.", Globe, "text-purple-600", "bg-purple-50 dark:bg-purple-500/10");
      case 'feature_secure': return renderFeature("Your Data,", "Always Protected", "Enterprise-grade security to keep your data safe and private.", ShieldCheck, "text-indigo-600", "bg-indigo-50 dark:bg-indigo-900/10");
      case 'role_selection': return renderRoleSelection();
      case 'permissions': return renderPermissions();
      case 'success': return renderSuccess();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[200] flex flex-col overflow-x-hidden overflow-y-auto transition-colors font-sans no-scrollbar pb-10">
      {/* Top Progress bar for features */}
      {currentStep !== 'welcome' && currentStep !== 'success' && (
        <div className="absolute top-12 inset-x-8 h-1 flex gap-2 z-[210]">
          {steps.slice(1, -1).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-full transition-all duration-500 ${
                i + 1 <= currentStepIndex ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
              }`} 
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="flex-1 h-full"
        >
          {getContent()}
        </motion.div>
      </AnimatePresence>

      {/* Footer Controls for features */}
      {currentStep.startsWith('feature_') && (
        <div className="px-8 pb-10 flex justify-between items-center">
          <button 
            onClick={onComplete}
            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2"
          >
            Skip
          </button>
          
          <div className="flex gap-1.5">
             {steps.slice(1, 7).map((_, i) => (
               <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i + 1 === currentStepIndex ? 'w-4 bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
             ))}
          </div>

          <button 
            onClick={nextStep}
            className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none active:scale-90 transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
