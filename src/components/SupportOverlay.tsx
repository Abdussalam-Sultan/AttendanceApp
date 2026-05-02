import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Phone, Mail, HelpCircle, X, Send, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from './ToastProvider';

interface SupportOverlayProps {
  show: boolean;
  onClose: () => void;
}

export const SupportOverlay: React.FC<SupportOverlayProps> = ({ show, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'General'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
    toast("Support request submitted successfully", "success");
  };

  const categories = ['General', 'Technical Issue', 'Attendance Correction', 'Billing/Account', 'Feedback'];

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-slate-50 dark:bg-slate-950 z-[201] rounded-t-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-2"></div>
            
            <div className="px-8 py-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Help Center</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">24/7 Virtual Assistance</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 active:scale-95 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-32 no-scrollbar">
              {!submitted ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Quick Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 text-center transition-all active:scale-95 group">
                      <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                        <Phone className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Call Support</span>
                    </button>
                    <button className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 text-center transition-all active:scale-95 group">
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Live Chat</span>
                    </button>
                  </div>

                  {/* FAQ Search */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Popular Topics</h3>
                    <div className="space-y-3">
                      {[
                        "How to reset my PIN?",
                        "Forgotten check-out correction",
                        "Leave request pending too long",
                        "Sync error: Offline data fix"
                      ].map((topic, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 px-5 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{topic}</span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Send a Message</h3>
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <input 
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          placeholder="Brief summary of issue"
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Message</label>
                        <textarea 
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          placeholder="Provide as much detail as possible..."
                          rows={4}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Request</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-[40px] flex items-center justify-center mb-8 relative">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                      className="absolute inset-0 bg-emerald-500/20 rounded-[40px]"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Request Received</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-[240px] mb-8 leading-relaxed italic">
                    Your support ticket #SL-29402 has been created. A representative will contact you via email shortly.
                  </p>
                  <button 
                    onClick={() => { setSubmitted(false); onClose(); }}
                    className="bg-slate-900 dark:bg-slate-800 px-8 py-4 rounded-3xl text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Got it, Thanks
                  </button>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50 dark:via-slate-950/90 to-transparent pt-12 flex flex-col gap-4">
               <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-400 mb-2">
                 <Mail className="w-3 h-3" />
                 <span>support@doorlog.com</span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
