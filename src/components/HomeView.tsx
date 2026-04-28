import React, { useEffect, useState } from 'react';
import { User as UserIcon, Menu, Bell, Clock, Briefcase, Calendar, BarChart3, Settings, ChevronRight, MapPin, Loader2, ArrowRight, ShieldCheck, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { User, AttendanceStats, AttendanceRecord, Announcement, BranchStats } from '../types';
import { haptics } from '../lib/haptics';
import { Logo } from './Logo';

interface HomeViewProps {
  onNavigate: (tab: any) => void;
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
import { LogOut } from 'lucide-react';

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

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const quickActions = [
    { label: 'My Attendance', icon: Briefcase, color: 'bg-emerald-50 text-emerald-600', tab: 'attendance' },
    user?.role === 'Manager' 
      ? { label: 'Request Leave', icon: Plane, color: 'bg-indigo-50 text-indigo-600', tab: 'leave' }
      : { label: 'Calendar', icon: Calendar, color: 'bg-purple-50 text-purple-600', tab: 'home' },
    { label: 'Reports', icon: BarChart3, color: 'bg-orange-50 text-orange-600', tab: 'attendance' },
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

  const handleActionWithHaptic = (tab: any) => {
    onNavigate(tab);
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
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900 scale-110 shadow-sm shadow-red-200"></span>
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
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white dark:bg-slate-900 z-[101] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
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
                  { icon: MapPin, label: 'Office Map', sub: 'Locate facilities', tab: 'home' },
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
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
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
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Good morning, 👋</p>
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
      </div>

      {/* Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 p-6 rounded-3xl shadow-lg text-white">
        {/* Background Decoration */}
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-20 transform scale-150 pointer-events-none text-white/50">
          <Calendar className="w-32 h-32" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start">
             <div>
               <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Today's Date</p>
               <p className="text-base font-bold mb-6 border-b border-white/10 pb-2 w-fit pr-4">{todayDate}</p>
             </div>
             {todayRecord && (
               <div className="flex flex-col items-end gap-1">
                 <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-wider">
                    In: {todayRecord.checkIn}
                 </div>
                 {todayRecord.checkOut !== '--:--' && (
                    <div className={`px-3 py-1.5 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-wider ${
                      todayRecord.checkOutStatus === 'Overtime' ? 'bg-indigo-400' : 
                      todayRecord.checkOutStatus === 'Early Leave' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}>
                      Out: {todayRecord.checkOut} • {todayRecord.checkOutStatus}
                    </div>
                 )}
               </div>
             )}
          </div>
          
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Current Time</p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-4xl font-bold font-display tracking-tight leading-none">{currentTime.split(' ')[0]}</span>
            <span className="text-xl font-medium opacity-80">{currentTime.split(' ')[1]}</span>
          </div>

          <div className="mt-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-700/40 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 shadow-sm">
              <div className={`w-1.5 h-1.5 ${isCheckedIn ? 'bg-emerald-400 animate-pulse' : isDayCompleted ? 'bg-slate-400' : 'bg-red-400'} rounded-full`}></div>
              <span className="text-[10px] font-bold tracking-tight">
                {isCheckedIn ? 'Status: Active' : isDayCompleted ? 'Shift Completed' : "You haven't checked in yet"}
              </span>
            </div>

            <button 
              onClick={handleAction}
              disabled={isActionLoading || isDayCompleted}
              className={`py-3 px-5 rounded-2xl flex items-center gap-2 shadow-xl hover:bg-slate-50 dark:hover:bg-slate-200 active:scale-95 transition-all font-extrabold text-sm whitespace-nowrap ${
                isCheckedIn ? 'bg-white text-orange-500' : isDayCompleted ? 'bg-slate-50/50 text-slate-400 cursor-not-allowed' : 'bg-white text-indigo-600'
              }`}
            >
               {isActionLoading ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <div className={`p-1 px-1.5 rounded-full ${isCheckedIn ? 'bg-orange-50' : isDayCompleted ? 'bg-slate-100' : 'bg-indigo-50 dark:bg-indigo-100'}`}>
                   <MapPin className="w-4 h-4" />
                 </div>
               )}
               <span>{isCheckedIn ? 'Check Out' : isDayCompleted ? 'Closed' : 'Check In'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {quickActions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => handleActionWithHaptic(action.tab)}
            className="flex flex-col items-center gap-2 group min-w-0"
          >
            <div className={`p-4 rounded-2xl ${action.color} dark:bg-opacity-10 transition-all duration-300 group-active:scale-90 shadow-sm border border-slate-100 dark:border-slate-800`}>
              <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-center font-bold text-slate-700 dark:text-slate-300 leading-tight truncate w-full px-1">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Monthly Overview Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">This Month Overview</h2>
          <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            May 2024 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex justify-around items-center">
          {[
            { label: 'Present', value: stats?.present ?? 0, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', iconColor: 'bg-emerald-500' },
            { label: 'Late', value: stats?.late ?? 0, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400', iconColor: 'bg-amber-500' },
            { label: 'Absent', value: stats?.absent ?? 0, color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400', iconColor: 'bg-red-500' },
            { label: 'Leave', value: stats?.leave ?? 0, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', iconColor: 'bg-indigo-500' },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${stat.color} relative`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] z-10 ${stat.iconColor}`}>
                   ✓
                </div>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 mb-0.5">{stat.value}</span>
              <span className={`text-[10px] font-bold ${stat.color.split(' ')[1]}`}>{stat.label}</span>
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
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Announcements</h2>
          <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">View All</button>
        </div>
        
        {announcements.map((ann, idx) => (
          <div key={idx} className="flex items-center gap-4 group cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
            <div className={`p-3 rounded-2xl ${idx % 2 === 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mb-1 truncate uppercase tracking-tight">{ann.title}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{ann.content}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-200 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};
