import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShieldCheck, Calendar, Clock, X, Check, ArrowLeft, Filter, Trash2, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

interface NotificationOverlayProps {
  show: boolean;
  onClose: () => void;
  userSettings?: {
    attendance: boolean;
    leave: boolean;
    announcements: boolean;
    marketing: boolean;
    [key: string]: any;
  };
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ show, onClose, userSettings }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ALERTS' | 'UPDATES' | 'SYSTEM'>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setLoading(true);
      api.getNotifications().then(data => {
        setNotifications(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [show]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const getNotifConfig = (type: string) => {
    switch (type) {
      case 'POLICY_CHANGE': return { icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", category: 'SYSTEM' };
      case 'ANNOUNCEMENT': return { icon: Bell, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", category: 'UPDATES' };
      case 'LEAVE_STATUS': return { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", category: 'ALERTS' };
      case 'ATTENDANCE_STATUS': return { icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", category: 'ALERTS' };
      case 'support_request': return { icon: HelpCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", category: 'ALERTS' };
      default: return { icon: Bell, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-500/10", category: 'UPDATES' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const filteredNotifications = notifications.filter(n => {
    // 1. Filter by User Settings
    if (userSettings) {
      if (n.type === 'ATTENDANCE_STATUS' && !userSettings.attendance) return false;
      if (n.type === 'LEAVE_STATUS' && !userSettings.leave) return false;
      if ((n.type === 'ANNOUNCEMENT' || n.type === 'POLICY_CHANGE') && !userSettings.announcements) return false;
    }

    // 2. Filter by UI Filter Category
    if (activeFilter === 'ALL') return true;
    const config = getNotifConfig(n.type);
    return config.category === activeFilter;
  });

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-lg max-h-[85vh] bg-slate-50 dark:bg-slate-950 z-[201] rounded-[40px] shadow-2xl dark:shadow-none flex flex-col overflow-hidden"
          >
            <div className="px-8 pb-4 flex justify-between items-center bg-inherit shrink-0 mt-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{unreadCount} unread messages</p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl active:scale-95 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="px-8 py-4 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
              {['ALL', 'ALERTS', 'UPDATES', 'SYSTEM'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeFilter === f 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none translate-y-[-2px]' 
                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 no-scrollbar">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fetching alerts...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif, i) => {
                  const config = getNotifConfig(notif.type);
                  return (
                    <motion.div 
                      key={notif.id || i}
                      layoutId={`notif-${notif.id}`}
                      onClick={() => {
                        setSelectedNotif(notif);
                        if (!notif.isRead) handleMarkRead(notif.id);
                      }}
                      className={`group relative flex gap-4 p-5 rounded-[28px] border transition-all cursor-pointer ${
                        notif.isRead 
                          ? 'bg-white/50 dark:bg-slate-900/30 border-transparent' 
                          : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-500/20 shadow-sm active:scale-[0.98]'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center shrink-0 shadow-sm`}>
                        <config.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-[13px] font-bold truncate pr-4 ${notif.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>
                            {notif.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-1 mb-2">
                          {notif.content}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${config.color} ${config.bg}`}>
                            {notif.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                    <Bell className="w-10 h-10 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">No notifications</p>
                    <p className="text-[10px] font-medium text-slate-400/60 max-w-[200px]">You're all caught up with your updates and alerts.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 pt-4 bg-white dark:bg-slate-900 rounded-t-[40px] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] shrink-0">
               <button 
                  onClick={onClose}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-5 rounded-[24px] active:scale-95 transition-all text-xs uppercase tracking-[0.25em] shadow-xl shadow-slate-200 dark:shadow-none"
               >
                 Dismiss
               </button>
            </div>
          </motion.div>

          {/* Details Sub-Overlay */}
          <AnimatePresence>
            {selectedNotif && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedNotif(null)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[210]"
                />
                <motion.div 
                  layoutId={`notif-${selectedNotif.id}`}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-lg max-h-[70vh] bg-white dark:bg-slate-900 z-[211] rounded-[40px] shadow-2xl dark:shadow-none p-8 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-3xl ${getNotifConfig(selectedNotif.type).bg} ${getNotifConfig(selectedNotif.type).color} shadow-sm`}>
                      {React.createElement(getNotifConfig(selectedNotif.type).icon, { className: "w-8 h-8" })}
                    </div>
                    <button 
                      onClick={() => setSelectedNotif(null)}
                      className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full hover:text-slate-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                         {selectedNotif.type.replace('_', ' ')}
                       </span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         {getTimeAgo(selectedNotif.createdAt)}
                       </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedNotif.title}
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-indigo-100 dark:border-indigo-500/20 pl-4 py-1">
                      {selectedNotif.content}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex gap-4">
                    <button 
                      onClick={() => setSelectedNotif(null)}
                      className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                    >
                      Understood
                    </button>
                    <button 
                      onClick={() => {
                        // In a real app, delete notification
                        setSelectedNotif(null);
                      }}
                      className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
