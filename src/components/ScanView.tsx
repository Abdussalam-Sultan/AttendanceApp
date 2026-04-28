import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, Zap, ChevronRight, CheckCircle2, ShieldCheck, Lock, Loader2, XCircle, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { AttendanceRecord } from '../types';

interface ScanViewProps {
  preferences: {
    hapticFeedback: boolean;
    autoGeofence: boolean;
  };
}

export const ScanView: React.FC<ScanViewProps> = ({ preferences }) => {
  const [flashOn, setFlashOn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'failed' | 'invalid' | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCurrentlyCheckedIn, setIsCurrentlyCheckedIn] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const records = await api.getAttendanceRecords();
        setRecentRecords(records.slice(0, 3));
        
        // Check if currently checked in
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
        const y = now.getFullYear();
        const todayStr = `${d} ${m} ${y}`;
        
        const todayRecord = records.find(r => r.date === todayStr);
        setIsCurrentlyCheckedIn(!!(todayRecord && (todayRecord.checkOut === '--:--' || !todayRecord.checkOut)));
      } catch (error) {
        console.error("Failed to fetch recent records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleSimulatedScan = async () => {
    if (checkingIn || scanResult) return;
    setCheckingIn(true);
    setScanResult(null);
    try {
      const wasCheckedIn = isCurrentlyCheckedIn;
      // Simulate scan process delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const random = Math.random();
      if (random > 0.05) { // Increased success rate for demo
        if (wasCheckedIn) {
          await api.checkOut();
        } else {
          await api.checkIn();
        }
        
        // Haptic Feedback
        if (preferences.hapticFeedback && navigator.vibrate) {
          navigator.vibrate([40, 60, 40]); 
        }

        // Refresh records and status
        const records = await api.getAttendanceRecords();
        setRecentRecords(records.slice(0, 3));
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
        const y = now.getFullYear();
        const todayStr = `${d} ${m} ${y}`;
        
        const todayRecord = records.find(r => r.date === todayStr);
        setIsCurrentlyCheckedIn(!!(todayRecord && (todayRecord.checkOut === '--:--' || !todayRecord.checkOut)));
        
        setScanResult('success');
      } else if (random > 0.02) {
        setScanResult('failed');
      } else {
        setScanResult('invalid');
      }
    } catch (error) {
      console.error("Scan action failed:", error);
      setScanResult('failed');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center h-14">
        <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex flex-col items-center">
           <h1 className="text-base font-bold text-slate-900 dark:text-white">QR Scanner</h1>
           <p className="text-[10px] font-medium text-slate-400">
             Scan door QR to {isCurrentlyCheckedIn ? 'check-out' : 'check-in'}
           </p>
        </div>
        <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-600 p-6 rounded-[40px] text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-500 rounded-xl">
               <ShieldCheck className="w-5 h-5 text-indigo-100" />
             </div>
             <p className="text-xs font-bold text-indigo-100 leading-tight uppercase tracking-widest">Security Access</p>
          </div>
          <h2 className="text-lg font-bold mb-2">Internal Door Entry</h2>
          <p className="text-indigo-100/70 text-[11px] leading-relaxed font-medium">Position the official QR code within the highlighted frame below to verify your identity and {isCurrentlyCheckedIn ? 'clock out' : 'clock in'}.</p>
        </div>
      </div>

      {/* Scanner Viewport */}
      <div 
        onClick={handleSimulatedScan}
        className="relative aspect-square w-full bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl flex items-center justify-center group cursor-pointer border-4 border-white dark:border-slate-800"
      >
        {/* Placeholder for camera preview */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        
        {/* Animated Scan Line */}
        {!checkingIn && (
          <motion.div 
            animate={{ top: ['20%', '80%', '20%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 -translate-x-1/2 w-[70%] h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] z-20"
          />
        )}
        
        {/* Highlighted Scan Zone */}
        <div className={`relative z-10 w-[70%] h-[70%] border-2 rounded-[40px] flex items-center justify-center transition-all duration-500 ${
          checkingIn ? 'scale-95 border-emerald-400 bg-emerald-500/10' : scanResult === 'success' ? 'border-emerald-500 bg-emerald-500/20' : scanResult === 'failed' ? 'border-red-500 bg-red-500/20' : scanResult === 'invalid' ? 'border-amber-500 bg-amber-500/20' : 'border-white/20'
        }`}>
            {/* Corners with Precision Markers */}
            <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-[40px] transition-colors duration-300 ${checkingIn || scanResult === 'success' ? 'border-emerald-400' : scanResult === 'failed' ? 'border-red-500' : scanResult === 'invalid' ? 'border-amber-500' : 'border-white'}`}></div>
            <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-[40px] transition-colors duration-300 ${checkingIn || scanResult === 'success' ? 'border-emerald-400' : scanResult === 'failed' ? 'border-red-500' : scanResult === 'invalid' ? 'border-amber-500' : 'border-white'}`}></div>
            <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-[40px] transition-colors duration-300 ${checkingIn || scanResult === 'success' ? 'border-emerald-400' : scanResult === 'failed' ? 'border-red-500' : scanResult === 'invalid' ? 'border-amber-500' : 'border-white'}`}></div>
            <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-[40px] transition-colors duration-300 ${checkingIn || scanResult === 'success' ? 'border-emerald-400' : scanResult === 'failed' ? 'border-red-500' : scanResult === 'invalid' ? 'border-amber-500' : 'border-white'}`}></div>
            
            {/* Feedback Overlays */}
            <AnimatePresence mode="wait">
              {checkingIn && (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-[38px] z-30"
                >
                  <Loader2 className="w-12 h-12 text-white animate-spin mb-3" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/20">Verifying...</span>
                </motion.div>
              )}

              {scanResult === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-[38px] z-30 bg-emerald-500/80 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-3"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">
                    {isCurrentlyCheckedIn ? 'Checked In' : 'Checked Out'}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setScanResult(null); }}
                    className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {scanResult === 'failed' && (
                <motion.div 
                  key="failed"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-[38px] z-30 bg-red-500/80 backdrop-blur-md"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">Unauthorized</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setScanResult(null); }}
                    className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

              {scanResult === 'invalid' && (
                <motion.div 
                  key="invalid"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-[38px] z-30 bg-amber-500/80 backdrop-blur-md"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
                    <Info className="w-10 h-10 text-amber-500" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest text-center px-4">Invalid QR Code</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setScanResult(null); }}
                    className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                  >
                    Scan Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QR Placeholder / UI when not scanning */}
            {!checkingIn && !scanResult && (
              <div className="w-[80%] aspect-square glass-morphism rounded-3xl flex items-center justify-center p-8 opacity-90 transition-opacity">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DoorLogCheckIn" alt="QR Code" className="w-full h-full mix-blend-multiply opacity-80" />
              </div>
            )}
        </div>

        {/* Viewport Labels */}
        <div className="absolute top-8 left-8 flex flex-col gap-1 z-20 opacity-40">
           <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Viewport Active</span>
           <span className="text-[9px] font-bold text-white uppercase tracking-widest">ID-9420-CORE</span>
        </div>

        {/* Action Toggle - Flash */}
        <button 
          onClick={(e) => { e.stopPropagation(); setFlashOn(!flashOn); }}
          className={`absolute bottom-8 px-6 py-3 rounded-2xl flex items-center gap-2.5 transition-all duration-300 z-30 shadow-2xl active:scale-95 ${
            flashOn 
              ? 'bg-amber-400 text-slate-900 border-none' 
              : 'bg-white/10 backdrop-blur-xl text-white border border-white/20 hover:bg-white/20'
          }`}
        >
          <Zap className={`w-4 h-4 ${flashOn ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{flashOn ? 'Flash On' : 'Torch Off'}</span>
        </button>
        
        {/* Interaction Hint */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">Align QR Code</span>
           </div>
        </div>

        {/* Darkness Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
      </div>

      {/* Recent Check-Ins */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Check-Ins</h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-700">View All</button>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
             <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-slate-200 dark:text-slate-700 animate-spin" /></div>
          ) : recentRecords.length > 0 ? (
            recentRecords.map((record) => (
              <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">Checked in</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
                    {record.date} <span className="opacity-30">•</span> {record.checkIn}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full group-hover:bg-emerald-100 transition-colors">Office</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No recent check-ins</p>
          )}
        </div>
      </div>

      {/* Secure & Private Badge */}
      <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-4 mt-2 mb-4">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-100 mb-0.5">Secure & Private</h3>
          <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/50 font-medium">Your attendance data is encrypted and secure.</p>
        </div>
        <div className="opacity-20 dark:opacity-10">
          <Lock className="w-8 h-8 text-indigo-900 dark:text-white" />
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
