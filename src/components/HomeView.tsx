import React, { useEffect, useState } from 'react';
import { User as UserIcon, Menu, Bell, Clock, Briefcase, Calendar, BarChart3, Settings, ChevronRight, MapPin, Loader2, ArrowRight, ShieldCheck, Plane, LogIn, LogOut, X, HelpCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { User, AttendanceStats, AttendanceRecord, Announcement, BranchStats } from '../types';
import { haptics } from '../lib/haptics';
import { Logo } from './Logo';
import { SupportOverlay } from './SupportOverlay';

interface HomeViewProps {
  onNavigate: (tab: any, subTab?: any) => void;
  onLogout: () => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  unreadCount: number;
  todayRecord: AttendanceRecord | null;
  onRefreshData: () => void;
  handleGlobalAction: () => void;
  isActionLoading: boolean;
}

import { useToast } from './ToastProvider';

export const HomeView: React.FC<HomeViewProps> = ({ 
  onNavigate, 
  onLogout, 
  showNotifications, 
  setShowNotifications, 
  unreadCount,
  todayRecord,
  onRefreshData,
  handleGlobalAction,
  isActionLoading
}) => {
  const { confirm } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [branchStats, setBranchStats] = useState<BranchStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // New UI states
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // This might be used elsewhere for display if needed

  const fetchData = async () => {
    try {
      const userData = await api.getUser();
      setUser(userData);
      setLoading(false); // Show layout immediately

      // Fire subsequent requests in parallel without blocking
      api.getAttendanceStats().then(setStats).catch(console.error);
      onRefreshData();
      api.getAnnouncements().then(setAnnouncements).catch(console.error);
      api.getBranchStats().then(setBranchStats).catch(console.error);
      api.getNotifications().then(setNotifications).catch(console.error);
      
    } catch (error) {
      console.error("Failed to fetch home data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async () => {
    handleGlobalAction();
    onRefreshData();
  };

// Removing old notification helpers

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const hours = currentTime.getHours();
  let greeting = 'Good morning';
  if (hours >= 12 && hours < 17) greeting = 'Good afternoon';
  if (hours >= 17) greeting = 'Good evening';

  const todayDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const monthYear = currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const quickActions = [
    { label: 'Reports', icon: BarChart3, color: 'bg-orange-50 text-orange-600', tab: 'attendance', subTab: 'Analytics' },
    { label: 'Request Leave', icon: Plane, color: 'bg-indigo-50 text-indigo-600', tab: 'leave' },
    { label: 'Settings', icon: Settings, color: 'bg-emerald-50 text-emerald-600', tab: 'profile' },
    { label: 'Support', icon: MessageSquare, color: 'bg-slate-50 text-slate-600', action: () => {
      setShowSupport(true);
    } },
  ];

  if (loading || !user) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="w-24 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="space-y-3">
          <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
          <div className="w-48 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-[40px]"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-[32px]"></div>
          ))}
        </div>
      </div>
    );
  }

  const isCheckedIn = todayRecord && (todayRecord.checkOut === '--:--' || !todayRecord.checkOut);
  const isDayCompleted = todayRecord && (todayRecord.checkOut !== '--:--' && !!todayRecord.checkOut);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 25
      }
    }
  };

  const handleActionWithHaptic = (action: any) => {
    if (action.action) {
      action.action();
    } else {
      onNavigate(action.tab, action.subTab);
    }
    haptics.impact();
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <button 
          onClick={() => {
            setShowDrawer(true);
            haptics.impact();
          }}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
        >
          <Menu className="w-6 h-6 text-slate-900 dark:text-slate-100" />
        </button>
        
        <Logo size={40} />

        <button 
          onClick={() => {
            setShowNotifications(true);
            haptics.impact();
          }}
          className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
        >
          <Bell className="w-6 h-6 text-slate-900 dark:text-slate-100" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900 scale-110 shadow-sm shadow-red-200 dark:shadow-none"></span>
          )}
        </button>
      </motion.div>

      {/* Greeting */}
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{greeting}, 👋</p>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white transition-colors">{user.name}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Let's make today productive!</p>
        </div>
        <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-800 shadow-soft overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserIcon className="w-8 h-8 text-slate-400" />
          )}
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 p-8 rounded-[40px] shadow-2xl text-white">
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Background Calendar Icon */}
        <div className="absolute -bottom-6 -right-6 text-white opacity-[0.07] pointer-events-none rotate-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-32 h-32" aria-hidden="true">
            <path d="M8 2v4"></path>
            <path d="M16 2v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18"></path>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onNavigate('attendance', 'Calendar');
              haptics.impact();
            }}
            className="flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 transition-all cursor-pointer shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-200" />
            <p className="text-[11px] font-bold uppercase tracking-wider">{todayDate}</p>
          </motion.div>
          
          <div className="flex flex-col items-center gap-1 mb-8">
            <span className="text-6xl font-bold font-display tracking-tighter leading-none">{timeString.split(' ')[0]}</span>
            {timeString.split(' ')[1] && (
              <span className="text-xl font-medium opacity-80 uppercase tracking-widest">{timeString.split(' ')[1]}</span>
            )}
          </div>

          <div className="grid grid-cols-2 w-full gap-4 mb-8">
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-[24px] border border-white/10 transition-colors hover:bg-white/10">
              <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-widest mb-1">Check In</p>
              <div className="flex items-center gap-2">
                <LogIn className="w-3" />
                <span className="text-lg font-bold">{todayRecord?.checkIn || '--:--'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-[24px] border border-white/10 transition-colors hover:bg-white/10">
              <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-widest mb-1">Check Out</p>
              <div className="flex items-center gap-2">
                <LogOut className="w-3" />
                <span className="text-lg font-bold">{todayRecord?.checkOut || '--:--'}</span>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ y: 0, scale: 0.98 }}
            onClick={handleAction}
            disabled={isActionLoading || isDayCompleted}
            className={`w-full py-4 px-6 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl transition-all font-black text-sm uppercase tracking-widest ${
              isCheckedIn 
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' 
                : isDayCompleted 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10' 
                  : 'bg-white text-indigo-600 hover:bg-slate-50 shadow-white/10'
            }`}
          >
             {isActionLoading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
               <MapPin className="w-5 h-5" />
             )}
             <span>{isCheckedIn ? 'Check Out Now' : isDayCompleted ? 'Shift Completed' : 'Check In Now'}</span>
          </motion.button>

          {isCheckedIn && (
            <div className="mt-4 text-[10px] font-bold text-indigo-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
              Shift in progress
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2 sm:gap-4 px-1">
        {quickActions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => handleActionWithHaptic(action)}
            className="flex flex-col items-center gap-2 group min-w-0"
          >
            <div className={`w-full aspect-square flex items-center justify-center rounded-[28px] ${action.color} dark:bg-opacity-10 transition-all duration-300 active:scale-90 shadow-sm border border-slate-100 dark:border-slate-800`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-center font-bold text-slate-700 dark:text-slate-300 leading-tight truncate w-full px-1">
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Monthly Overview Summary */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Monthly Performance</h2>
          <button 
            onClick={() => onNavigate('attendance')}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
          >
            {monthYear} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Present', value: stats?.present ?? 0, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Late', value: stats?.late ?? 0, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Absent', value: stats?.absent ?? 0, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-500/10' },
            { label: 'Leave', value: stats?.leave ?? 0, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-full aspect-square max-w-[48px] rounded-[22px] flex items-center justify-center mb-2 ${stat.bgColor} ${stat.color} shadow-sm transition-transform active:scale-95`}>
                <span className="text-xl font-black">{stat.value}</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Branch Performance Summary */}
      {branchStats && (
        <motion.div variants={itemVariants} className="bg-slate-900 dark:bg-slate-900/50 p-6 rounded-[32px] text-white overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h2 className="text-sm font-bold text-white/90">Branch Presence</h2>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{branchStats.branchName || 'My Branch'}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold uppercase tracking-wider">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-white/5 border border-white/10 p-4 rounded-[24px]">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Attendance Ratio</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-display">{branchStats.averageAttendance}%</span>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-[24px]">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Active Today</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-display">{branchStats.activeToday}</span>
                <span className="text-[9px] font-bold text-white/40">/ {branchStats.totalEmployees}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Announcements */}
      <motion.div variants={itemVariants} className="p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Updates</h2>
          {announcements.length > 0 && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg text-[9px] font-bold">{announcements.length}</span>}
        </div>
        
        {announcements.length > 0 ? announcements.map((ann, idx) => (
          <motion.div 
            key={idx} 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedAnnouncement(ann);
              haptics.impact();
            }}
            className="flex items-center gap-4 group border-b border-slate-50 dark:border-slate-800 last:border-0 pb-4 last:pb-0 cursor-pointer"
          >
            <div className={`p-3 rounded-[20px] ${idx % 2 === 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'} shadow-sm`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 mb-1 truncate uppercase tracking-tight">{ann.title}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{ann.content}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:text-indigo-600 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        )) : (
          <p className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase">No active announcements</p>
        )}
      </motion.div>

      {/* Announcement Detail Overlay */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnnouncement(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[210]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-5 top-1/2 -translate-y-1/2 max-h-[70vh] bg-white dark:bg-slate-900 z-[211] rounded-[40px] shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 shadow-sm">
                  <Bell className="w-8 h-8" />
                </div>
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                     {selectedAnnouncement.category || 'Announcement'}
                   </span>
                   <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     {selectedAnnouncement.date}
                   </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed border-l-4 border-indigo-100 dark:border-indigo-500/20 pl-4 py-1">
                  {selectedAnnouncement.content}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SupportOverlay show={showSupport} onClose={() => setShowSupport(false)} />

      {/* Navigation Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[300px] bg-white dark:bg-slate-900 z-[201] shadow-2xl flex flex-col rounded-r-[40px] bg-clip-border overflow-hidden border-r border-slate-100 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="px-8 pt-14 pb-6 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Logo size={36} />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">Attendance</span>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Pro v2.0</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Main content */}
              <div className="flex-1 px-4 py-8 space-y-8 overflow-y-auto no-scrollbar">
                {/* User Info Section */}
                <div className="px-2">
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
                     <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md transition-transform group-hover:scale-105">
                       {user.avatar ? (
                         <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <UserIcon className="w-6 h-6 m-3 text-slate-400" />
                       )}
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{user.name}</p>
                       <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.role}</p>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Main Navigation */}
                <nav className="space-y-1.5 px-2">
                  <p className="px-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                  {[
                    { label: 'Dashboard', icon: BarChart3, tab: 'home' },
                    { label: 'System Logs', icon: Clock, tab: 'attendance' },
                    { label: 'Leave Center', icon: Plane, tab: 'leave' },
                    { label: 'My Profile', icon: UserIcon, tab: 'profile' },
                    { label: 'Account Settings', icon: Settings, tab: 'profile' },
                    ...(user.role === 'Admin' || user.role === 'Manager' ? [{ label: 'Admin Terminal', icon: ShieldCheck, tab: 'admin' }] : []),
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onNavigate(item.tab);
                        setShowDrawer(false);
                        haptics.selection();
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-[0.98] group"
                    >
                      <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </nav>

                {/* Today's Glance Section */}
                <div className="px-2">
                  <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[32px] border border-indigo-100/50 dark:border-indigo-500/10">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-3">Today's Glance</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Check In</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{todayRecord?.checkIn || '--:--'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Late Diff</span>
                        <span className={`text-xs font-black font-mono ${todayRecord?.lateMinutes ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {todayRecord?.lateMinutes ? `+${todayRecord.lateMinutes}m` : '0m'}
                        </span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-indigo-100/50 dark:border-indigo-500/10">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate">
                            {todayRecord?.branchName || 'Analyzing location...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer - Strictly Fixed */}
              <div className="px-6 pt-4 pb-14 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowSupport(true);
                      setShowDrawer(false);
                      haptics.impact();
                    }}
                    className="flex items-center gap-3 w-full p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Support Portal</span>
                  </button>
                  <button 
                    onClick={async () => {
                      const confirmed = await confirm(
                        "Logout Session", 
                        "Are you sure you want to end your session? You will need to sign in again."
                      );
                      if (confirmed) {
                        onLogout();
                        setShowDrawer(false);
                      }
                      haptics.impact();
                    }}
                    className="flex items-center gap-3 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
