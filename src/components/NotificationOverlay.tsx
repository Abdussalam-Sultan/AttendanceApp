import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShieldCheck, Calendar, Clock, X, Check, ArrowLeft, Filter, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface NotificationOverlayProps {
  show: boolean;
  onClose: () => void;
  onOpenDetail: (notif: any) => void;
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ show, onClose, onOpenDetail }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifConfig = (type: string) => {
    switch (type) {
      case 'POLICY_CHANGE': return { icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", category: 'SYSTEM' };
      case 'ANNOUNCEMENT': return { icon: Bell, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", category: 'UPDATES' };
      case 'LEAVE_STATUS': return { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", category: 'ALERTS' };
      case 'ATTENDANCE_STATUS': return { icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", category: 'ALERTS' };
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
    if (activeFilter === 'ALL') return true;
    const config = getNotifConfig(n.type);
    return config.category === activeFilter;
  });

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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-slate-50 dark:bg-slate-950 z-[201] rounded-t-[40px] shadow-2xl dark:shadow-none flex flex-col overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-4"></div>
            
            <div className="px-8 pb-4 flex justify-between items-center bg-inherit">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{unreadCount} unread messages</p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl active:scale-95 transition-all shadow-sm dark:shadow-none"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl active:scale-95 transition-all shadow-sm dark:shadow-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="px-8 py-4 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
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
                        onOpenDetail({
                          title: notif.title,
                          content: notif.content,
                          date: notif.createdAt,
                          iconType: notif.type,
                          category: 'Notification'
                        });
                        if (!notif.isRead) handleMarkRead(notif.id);
                      }}
                      className={`group relative flex gap-4 p-5 rounded-[28px] border transition-all cursor-pointer ${
                        notif.isRead 
                          ? 'bg-white/50 dark:bg-slate-900/30 border-transparent' 
                          : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-500/20 shadow-sm dark:shadow-none active:scale-[0.98]'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center shrink-0 shadow-sm dark:shadow-none`}>
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
                        <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm dark:shadow-none animate-pulse"></div>
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

            <div className="px-8 pb-8 pt-4 bg-white dark:bg-slate-900 rounded-t-[40px] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-none">
               <button 
                  onClick={onClose}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-5 rounded-[24px] active:scale-95 transition-all text-xs uppercase tracking-[0.25em] shadow-xl shadow-slate-200 dark:shadow-none"
               >
                 Dismiss
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
