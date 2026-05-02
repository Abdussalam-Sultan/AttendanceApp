import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, ShieldCheck, Calendar, Clock, Trash2 } from 'lucide-react';
import { Announcement, AppNotification } from '../types';

interface DetailOverlayProps {
  item: Announcement | AppNotification | null;
  onClose: () => void;
  onDelete?: (id: string | number) => void;
}

export const DetailOverlay: React.FC<DetailOverlayProps> = ({ item, onClose, onDelete }) => {
  if (!item) return null;

  // Determine if it's a notification or announcement
  const isNotification = 'type' in item;
  
  const getIcon = () => {
    if (!isNotification) return { icon: Bell, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", label: (item as Announcement).category };
    
    const notif = item as AppNotification;
    switch (notif.type) {
      case 'POLICY_CHANGE': return { icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", label: 'Policy Update' };
      case 'ANNOUNCEMENT': return { icon: Bell, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", label: 'Announcement' };
      case 'LEAVE_STATUS': return { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", label: 'Leave Update' };
      case 'ATTENDANCE_STATUS': return { icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", label: 'Attendance' };
      default: return { icon: Bell, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-500/10", label: 'Notification' };
    }
  };

  const config = getIcon();
  const date = isNotification ? (item as AppNotification).createdAt : (item as Announcement).date;

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[300]"
          />
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-4 bottom-10 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md max-h-[80vh] bg-white dark:bg-slate-900 z-[301] rounded-[40px] shadow-2xl p-8 flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-3xl ${config.bg} ${config.color} shadow-sm border border-black/5 dark:border-white/5`}>
                <config.icon className="w-8 h-8" />
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                 <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${config.color}`}>
                   {config.label}
                 </span>
                 <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                 <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   {new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                 </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight font-display tracking-tight">
                {item.title}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed border-l-4 border-indigo-100 dark:border-indigo-500/20 pl-4 py-1">
                {item.content.split('\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-3' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Got it
              </button>
              {onDelete && isNotification && (
                <button 
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                  className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                  title="Delete notification"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
