import React, { useEffect, useState } from 'react';
import { User as UserIcon, Menu, Bell, Clock, Briefcase, Calendar, BarChart3, Settings, ChevronRight, MapPin, Loader2, ArrowRight, ShieldCheck, Plane, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { User, AttendanceStats, AttendanceRecord, Announcement, BranchStats } from '../types';
import { haptics } from '../lib/haptics';
import { Logo } from './Logo';

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
  onOpenDetail: (item: any) => void;
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
  isActionLoading,
  onOpenDetail
}) => {
  const { confirm } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [branchStats, setBranchStats] = useState<BranchStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New UI states
  const [showDrawer, setShowDrawer] = useState(false);
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
    { label: 'Calendar', icon: Calendar, color: 'bg-purple-50 text-purple-600', tab: 'attendance', subTab: 'Calendar' },
    { label: 'My Logs', icon: Briefcase, color: 'bg-emerald-50 text-emerald-600', tab: 'attendance' },
    { label: 'Request Leave', icon: Plane, color: 'bg-indigo-50 text-indigo-600', tab: 'leave' },
    { label: 'Settings', icon: Settings, color: 'bg-indigo-50 text-indigo-600', tab: 'profile' },
  ];

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  const isCheckedIn = todayRecord && (todayRecord.checkOut === '--:--' || !todayRecord.checkOut);
  const isDayCompleted = todayRecord && (todayRecord.checkOut !== '--:--' && !!todayRecord.checkOut);

    const handleActionWithHaptic = (tab: any, subTab?: any) => {
    onNavigate(tab, subTab);
    haptics.impact();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
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
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white dark:bg-slate-900 z-[101] shadow-2xl dark:shadow-none p-6 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg dark:shadow-none">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">DoorLog</h3>
                  <p className="text-xs font-medium text-slate-400">Enterprise Access</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: Clock, label: 'Daily Log', sub: 'View time entries', tab: 'attendance' },
                  { icon: BarChart3, label: 'Analytics', sub: 'Attendance trends', tab: 'attendance' },
                  { icon: Settings, label: 'App Settings', sub: 'Customize behavior', tab: 'profile' },
                  ...(user?.role === 'Admin' || user?.role === 'Manager'
                    ? [{ icon: ShieldCheck, label: user.role === 'Manager' ? 'Operations' : 'Admin Panel', sub: 'Management console', tab: 'admin' }] 
                    : []),
                  ...(user?.role !== 'Admin'
                    ? [{ icon: Plane, label: 'Leave Request', sub: 'Submit time off', tab: 'leave' }]
                    : [])
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setShowDrawer(false);
                      onNavigate(item.tab);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                  >
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <button 
                  onClick={async () => {
                    const confirmed = await confirm("Sign Out", "Are you sure you want to log out of your account?");
                    if (confirmed) onLogout();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 transition-all active:scale-95 text-left"
                >
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Sign Out</p>
                    <p className="text-[10px] opacity-70 font-medium">Clear session and exit</p>
                  </div>
                </button>
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center">Version 1.0.4</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications logic handled by App.tsx through showNotifications prop */}

      {/* Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{greeting}, 👋</p>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white transition-colors">{user.name}</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Let's make today productive!</p>
        </div>
        <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-800 shadow-soft dark:shadow-none overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
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
      </div>

      {/* Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 p-8 rounded-[40px] shadow-xl dark:shadow-none text-white">
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <button 
            onClick={() => handleActionWithHaptic('attendance', 'Calendar')}
            className="flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 active:scale-95 transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-200" />
            <p className="text-[11px] font-bold uppercase tracking-wider">{todayDate}</p>
          </button>
          
          <div className="flex flex-col items-center gap-1 mb-8">
            <span className="text-6xl font-bold font-display tracking-tighter leading-none">{timeString.split(' ')[0]}</span>
            {timeString.split(' ')[1] && (
              <span className="text-xl font-medium opacity-80 uppercase tracking-widest">{timeString.split(' ')[1]}</span>
            )}
          </div>

          <div className="grid grid-cols-2 w-full gap-4 mb-8">
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-widest mb-1">Check In</p>
              <div className="flex items-center gap-2">
                <LogIn className="w-3 h-3 text-emerald-400" />
                <span className="text-lg font-bold">{todayRecord?.checkIn || '--:--'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-widest mb-1">Check Out</p>
              <div className="flex items-center gap-2">
                <LogOut className="w-3 h-3 text-rose-400" />
                <span className="text-lg font-bold">{todayRecord?.checkOut || '--:--'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAction}
            disabled={isActionLoading || isDayCompleted}
            className={`w-full py-4 px-6 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl dark:shadow-none active:scale-95 transition-all font-black text-sm uppercase tracking-widest ${
              isCheckedIn 
                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                : isDayCompleted 
                  ? 'bg-slate-200/20 text-slate-300 cursor-not-allowed border border-white/10' 
                  : 'bg-white text-indigo-600 hover:bg-slate-50'
            }`}
          >
             {isActionLoading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
               <MapPin className="w-5 h-5" />
             )}
             <span>{isCheckedIn ? 'Check Out Now' : isDayCompleted ? 'Shift Completed' : 'Check In Now'}</span>
          </button>

          {isCheckedIn && (
            <p className="mt-4 text-[10px] font-bold text-indigo-100 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              Shift in progress
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 px-1">
        {quickActions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => handleActionWithHaptic(action.tab, (action as any).subTab)}
            className="flex flex-col items-center gap-2 group min-w-0"
          >
            <div className={`w-full aspect-square flex items-center justify-center rounded-3xl ${action.color} dark:bg-opacity-10 transition-all duration-300 group-active:scale-90 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-center font-bold text-slate-700 dark:text-slate-300 leading-tight truncate w-full px-1">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Monthly Overview Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">This Month Summary</h2>
          <button 
            onClick={() => onNavigate('attendance')}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
          >
            {monthYear} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Present', value: stats?.present ?? 0, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Late', value: stats?.late ?? 0, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Absent', value: stats?.absent ?? 0, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10' },
            { label: 'Leave', value: stats?.leave ?? 0, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${stat.bgColor} ${stat.color}`}>
                <span className="text-lg font-bold">{stat.value}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${stat.color}`}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Branch Performance Summary */}
      {branchStats && (
        <div className="bg-slate-900 p-6 rounded-[32px] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h2 className="text-sm font-bold text-white/90">Branch Performance</h2>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{branchStats.branchName || 'My Branch'}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold uppercase tracking-wider">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Avg. Attendance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-display">{branchStats.averageAttendance}%</span>
                <span className="text-[9px] font-bold text-emerald-400">↑ 1.2%</span>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">On Leave Today</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-display">{branchStats.onLeaveToday}</span>
                <span className="text-[9px] font-bold text-white/40">/ {branchStats.totalEmployees}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Active Staff</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-display">{branchStats.activeToday}</span>
                <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden ml-2 mb-1">
                  <div className="h-full bg-indigo-500" style={{ width: `${(branchStats.activeToday / branchStats.totalEmployees) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Leave Balance Avg</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-display">{branchStats.leaveBalanceAverage}</span>
                <span className="text-[9px] font-bold text-white/40">DAYS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Announcements</h2>
        </div>
        
        {announcements.length > 0 ? announcements.map((ann, idx) => (
          <div 
            key={idx} 
            onClick={() => {
              onOpenDetail({
                title: ann.title,
                content: ann.content,
                date: ann.date,
                category: ann.category,
                type: 'announcement'
              });
              haptics.impact();
            }}
            className="flex items-center gap-4 group border-b border-slate-50 dark:border-slate-800 last:border-0 pb-3 last:pb-0 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className={`p-3 rounded-2xl ${idx % 2 === 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mb-1 truncate uppercase tracking-tight">{ann.title}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{ann.content}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-200 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          </div>
        )) : (
          <p className="text-[10px] text-slate-400 text-center py-4">No active announcements</p>
        )}
      </div>
    </div>
  );
};
