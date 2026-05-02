import React from 'react';
import { Home, ClipboardList, LogIn, LogOut, Loader2, Plane, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptics } from '../lib/haptics';

type TabType = 'home' | 'attendance' | 'leave' | 'profile' | 'admin';

interface BottomNavProps {
  user: any;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCheckedIn: boolean;
  isDayCompleted: boolean;
  onGlobalAction: () => void;
  isLoading: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  isCheckedIn, 
  isDayCompleted, 
  onGlobalAction, 
  isLoading 
}) => {
  const handleTabClick = (id: TabType) => {
    setActiveTab(id);
    haptics.impact();
  };

  const handleAction = () => {
    if (isDayCompleted) return;
    onGlobalAction();
    haptics.impact();
  };

  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'attendance' as TabType, label: 'Logs', icon: ClipboardList },
    { 
      id: 'action' as any, 
      label: isCheckedIn ? 'Out' : 'In', 
      icon: isCheckedIn ? LogOut : LogIn, 
      isAction: true 
    },
    (user?.role === 'Admin' || user?.role === 'Manager')
      ? { id: 'admin' as TabType, label: user?.role === 'Manager' ? 'Operations' : 'Admin', icon: ShieldCheck }
      : { id: 'leave' as TabType, label: 'Leave', icon: Plane },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 grid grid-cols-5 items-center px-2 pt-2 pb-5 z-50 transition-all shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
      {tabs.map((tab) => (
        tab.isAction ? (
          <div key="global-action-container" className="flex justify-center relative">
            <motion.button
              key="global-action"
              whileTap={{ scale: 0.85 }}
              onClick={handleAction}
              disabled={isDayCompleted || isLoading}
              className={`flex flex-col items-center justify-center relative -translate-y-6 transition-all duration-500 rounded-full p-0.5 ${
                isDayCompleted ? 'opacity-50 grayscale' : ''
              }`}
            >
              <div className={`p-4 rounded-full shadow-2xl transition-all duration-500 border-4 border-white dark:border-slate-900 ${
                isCheckedIn 
                  ? 'bg-rose-500 shadow-rose-500/40' 
                  : 'bg-indigo-600 shadow-indigo-600/40'
              }`}>
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <tab.icon className="w-6 h-6 text-white" />
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest mt-1 absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap transition-colors duration-300 ${
                isCheckedIn ? 'text-rose-600' : 'text-indigo-600'
              }`}>
                {tab.label}
              </span>
            </motion.button>
          </div>
        ) : (
          <motion.button
            id={`nav-tab-${tab.id}`}
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTabClick(tab.id as TabType)}
            className="flex flex-col items-center justify-center relative transition-all duration-300 py-1"
          >
            <tab.icon
              className={`w-5 h-5 mb-1 transition-all duration-300 ${
                activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span
              className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                activeTab === tab.id ? 'text-indigo-600 font-black' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {tab.label}
            </span>
            <AnimatePresence>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.button>
        )
      ))}
    </div>
  );
};
