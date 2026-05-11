import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Scan, ArrowRight, Check, Bell, 
  MapPin, Smartphone, User, Briefcase, Camera, 
  ChevronRight, Mail, Phone, Home, Calendar,
  Shield, Lock, Fingerprint
} from 'lucide-react';
import { Logo } from './Logo';
import { api } from '../services/api';

interface OnboardingViewProps {
  user: any;
  onComplete: (updatedUser: any) => void;
}

type OnboardingStep = 
  | 'welcome' 
  | 'profile_setup' 
  | 'notifications' 
  | 'security' 
  | 'success';

export const OnboardingView: React.FC<OnboardingViewProps> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    emergencyContact: user?.emergencyContact || '',
    birthDate: user?.birthDate || '',
    notifSettings: user?.notifSettings || {
      attendance: true,
      leave: true,
      announcements: true,
      reminders: true
    },
    securitySettings: user?.securitySettings || {
      deviceBinding: true
    }
  });

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep === 'welcome') {
      setCurrentStep('profile_setup');
    } else if (currentStep === 'profile_setup') {
      setCurrentStep('notifications');
    } else if (currentStep === 'notifications') {
      if (user?.role === 'Admin') {
        setCurrentStep('security');
      } else {
        await finishOnboarding();
      }
    } else if (currentStep === 'security') {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const updatedUser = await api.updateProfile({
        ...formData,
        onboardingCompleted: true
      });
      setCurrentStep('success');
      setTimeout(() => {
        onComplete(updatedUser);
      }, 2000);
    } catch (error) {
      console.error("Onboarding setup failed", error);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center pt-20">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10"
      >
        <Logo size={100} className="drop-shadow-2xl" />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4"
      >
        Welcome to the Team, <br/><span className="text-indigo-600">{user?.name}!</span>
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-slate-400 mb-12 max-w-[280px]"
      >
        We're excited to have you. Let's get your workspace ready in just a few steps.
      </motion.p>
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={handleNext}
        className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
      >
        Start Setup <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );

  const renderProfileSetup = () => (
    <div className="flex flex-col h-full px-8 pt-10">
      <div className="mb-8">
        <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Step 1</h2>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Profile Setup</h3>
        <p className="text-xs font-medium text-slate-400 mt-1">Make sure your contact information is correct.</p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 ring-indigo-500/20 transition-all outline-none"
              placeholder="Your full name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 ring-indigo-500/20 transition-all outline-none"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">Address</label>
          <div className="relative">
            <Home className="absolute left-5 top-4 w-4 h-4 text-slate-400" />
            <textarea 
              value={formData.address}
              onChange={(e) => updateFormData({ address: e.target.value })}
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 ring-indigo-500/20 transition-all outline-none resize-none"
              placeholder="Home or office address"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">Emergency Contact</label>
          <div className="relative">
            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={formData.emergencyContact}
              onChange={(e) => updateFormData({ emergencyContact: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 ring-indigo-500/20 transition-all outline-none"
              placeholder="Name and phone"
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 pb-10">
        <button 
          onClick={handleNext}
          disabled={!formData.name}
          className="w-full bg-indigo-600 disabled:opacity-50 text-white font-bold py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="flex flex-col h-full px-8 pt-10">
      <div className="mb-8">
        <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Step 2</h2>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h3>
        <p className="text-xs font-medium text-slate-400 mt-1">Control how you want to be notified.</p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'attendance', title: 'Attendance Alerts', desc: 'Confirmations for check-ins and check-outs', icon: Scan },
          { id: 'leave', title: 'Leave Updates', desc: 'Status updates for your leave requests', icon: Briefcase },
          { id: 'announcements', title: 'Company News', desc: 'Stay updated with site-wide announcements', icon: Bell },
          { id: 'reminders', title: 'Daily Reminders', desc: 'Helpful nudges for your shifts', icon: Calendar }
        ].map((item) => (
          <div 
            key={item.id}
            onClick={() => updateFormData({ 
              notifSettings: { ...formData.notifSettings, [item.id]: !formData.notifSettings[item.id as keyof typeof formData.notifSettings] }
            })}
            className={`p-5 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between ${
              formData.notifSettings[item.id as keyof typeof formData.notifSettings]
                ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-xl shadow-indigo-100/50 dark:shadow-none'
                : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                formData.notifSettings[item.id as keyof typeof formData.notifSettings] ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-[10px] font-medium text-slate-400">{item.desc}</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              formData.notifSettings[item.id as keyof typeof formData.notifSettings] ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {formData.notifSettings[item.id as keyof typeof formData.notifSettings] && <Check className="w-3 h-3" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 pb-10">
        <button 
          onClick={handleNext}
          className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="flex flex-col h-full px-8 pt-10">
      <div className="mb-8">
        <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Step 3</h2>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Security Settings</h3>
        <p className="text-xs font-medium text-slate-400 mt-1">Keep your account safe and secure.</p>
      </div>

      <div className="space-y-4">
        <div 
          onClick={() => updateFormData({ 
            securitySettings: { ...formData.securitySettings, deviceBinding: !formData.securitySettings.deviceBinding }
          })}
          className={`p-6 rounded-[32px] border transition-all cursor-pointer ${
            formData.securitySettings.deviceBinding
              ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-xl shadow-indigo-100/50 dark:shadow-none'
              : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-5 mb-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              formData.securitySettings.deviceBinding ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">Device Binding</h4>
              <p className="text-[10px] font-medium text-slate-400">Lock access to your specific device</p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              formData.securitySettings.deviceBinding ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {formData.securitySettings.deviceBinding && <Check className="w-3 h-3" />}
            </div>
          </div>
          <p className="text-[10px] font-medium text-slate-400 leading-relaxed pl-1">
            This prevents others from logging into your account from unauthorized phones. Highy recommended for secure attendance.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 pb-10">
        <button 
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Setting up...' : 'Complete'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center pt-20">
      <motion.div 
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-32 h-32 mb-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-100 dark:shadow-none"
      >
        <Check className="w-16 h-16" />
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">All Set! 🎉</h3>
        <p className="text-sm font-medium text-slate-400 max-w-[240px] mx-auto leading-relaxed">
          Your account is now ready. Redirecting you to your dashboard...
        </p>
      </motion.div>
    </div>
  );

  const getContent = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcome();
      case 'profile_setup': return renderProfileSetup();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'success': return renderSuccess();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[200] flex flex-col overflow-hidden transition-colors font-sans no-scrollbar">
      {/* Progress Bar */}
      {currentStep !== 'welcome' && currentStep !== 'success' && (
        <div className="absolute top-0 inset-x-0 h-1.5 flex gap-0.5 z-[210]">
          {(user?.role === 'Admin' 
            ? ['profile_setup', 'notifications', 'security'] 
            : ['profile_setup', 'notifications']
          ).map((step, i, arr) => {
            const currentIndex = arr.indexOf(currentStep);
            return (
              <div 
                key={step} 
                className={`flex-1 transition-all duration-700 ${
                  i <= currentIndex ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
                }`} 
              />
            );
          })}
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
    </div>
  );
};

