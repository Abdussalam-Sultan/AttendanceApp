import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, MapPin, Building2, User, Calendar, ShieldCheck, AlertCircle, ArrowRight, Download } from 'lucide-react';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

interface AttendanceDetailModalProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
}

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({ record, isOpen, onClose }) => {
  if (!record) return null;

  const user = record.User || record.user;
  const statusColors = {
    present: 'bg-emerald-500',
    late: 'bg-amber-500',
    absent: 'bg-red-500',
    leave: 'bg-indigo-500'
  } as any;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed inset-x-0 bottom-0 max-h-[92vh] bg-slate-50 dark:bg-slate-950 z-[301] rounded-t-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${statusColors[record.status] || 'bg-slate-500'} flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">Attendance Detail</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Log Entry #{record.id.toString().slice(-6)}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl active:scale-90 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
              {/* User Overview */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700">
                  {user?.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-7 h-7 m-3.5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{user?.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.employeeId}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Time in</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{record.checkIn}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Time Out</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{record.checkOut || '--:--'}</p>
                  </div>
                </div>
              </div>

              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Verification Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{record.date}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Record Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[record.status] || 'bg-slate-400'}`} />
                    <p className={`text-xs font-black uppercase tracking-widest ${record.status === 'late' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {record.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Insight */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Verification Context</h3>
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Branch/Access Point</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{record.branchName || 'Remote Assignment'}</p>
                    </div>
                    {record.latitude && (
                      <div className="ml-auto px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        GPS Verified
                      </div>
                    )}
                  </div>
                  
                  {record.latitude && record.longitude && (
                    <div className="h-48 w-full z-0">
                      <MapContainer 
                        center={[record.latitude, record.longitude]} 
                        zoom={16} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                        scrollWheelZoom={false}
                        dragging={false}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <Marker position={[record.latitude, record.longitude]} icon={DefaultIcon} />
                      </MapContainer>
                    </div>
                  )}

                  <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Device Geolocation</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2">
                        {record.address || 'Coordinates logged at verification point. Access restricted to approved operational area.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrity Section */}
              <div className="p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-[32px] border border-emerald-100 dark:border-emerald-500/10 flex items-center gap-4">
                 <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                   <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Verified Digital Record</p>
                   <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">This log is cryptographically linked to the employee's ID and location signature at the time of check-in.</p>
                 </div>
              </div>

              <div className="h-8" />
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-100 dark:shadow-none"
              >
                Dismiss Entry
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
