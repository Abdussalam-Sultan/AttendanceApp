import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Calendar, Clock, ShieldCheck, Info } from 'lucide-react';

interface DetailOverlayProps {
  show: boolean;
  onClose: () => void;
  title: string;
  content: string;
  date?: string;
  category?: string;
  type?: 'announcement' | 'notification' | string;
  iconType?: string;
}

export const DetailOverlay: React.FC<DetailOverlayProps> = ({
  show,
  onClose,
  title,
  content,
  date,
  category,
  type = 'announcement',
  iconType
}) => {
  const getIcon = () => {
    const config: Record<string, { icon: any, color: string, bg: string }> = {
      POLICY_CHANGE: { icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
      ANNOUNCEMENT: { icon: Bell, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
      LEAVE_STATUS: { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
      ATTENDANCE_STATUS: { icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
      General: { icon: Info, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
      Policy: { icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
      Event: { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    };

    const key = (iconType || category || 'General');
    const item = config[key] || { icon: Info, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800" };
    return item;
  };

  const iconConfig = getIcon();

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed inset-x-5 top-1/2 -translate-y-1/2 max-h-[80vh] bg-white dark:bg-slate-900 z-[501] rounded-[40px] shadow-2xl dark:shadow-none p-8 flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-3xl ${iconConfig.bg} ${iconConfig.color} shadow-sm dark:shadow-none`}>
                <iconConfig.icon className="w-8 h-8" />
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full hover:text-slate-600 active:scale-90 transition-all font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold ${iconConfig.color} uppercase tracking-[0.2em]`}>
                  {category || type}
                </span>
                {formattedDate && (
                  <>
                    <span className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formattedDate}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-indigo-100 dark:border-indigo-500/20 pl-6 py-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-r-2xl">
                {content}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-5 rounded-[24px] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
