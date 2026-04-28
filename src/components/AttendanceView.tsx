import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, ChevronDown, Check, Clock, X, Loader2, Info, TrendingUp, ArrowUpRight, ArrowDownRight, Users, Building2, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { AttendanceStatus, AttendanceStats, AttendanceRecord, User as UserType } from '../types';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval, 
  isWeekend
} from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const AttendanceView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Logs' | 'Calendar' | 'Summary'>('Logs');
  const [viewDate, setViewDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState<any>(null);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, statsRes, myRecordsRes, settingsRes] = await Promise.all([
          api.getUser(),
          api.getAttendanceStats(),
          api.getAttendanceRecords(),
          api.getAttendanceSettings()
        ]);
        
        setCurrentUser(userRes);
        setStats(statsRes);
        setSettings(settingsRes);
        
        if (userRes.role === 'Admin' || userRes.role === 'Manager') {
           const allRecords = await api.getAllAttendanceRecords();
           setRecords(allRecords);
           setViewMode('all'); // Default to global for admins
        } else {
           setRecords(myRecordsRes);
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRecords = useMemo(() => {
    let list = records.filter(record => {
      try {
        const recordDate = new Date(record.date);
        const matchesMonth = isSameMonth(recordDate, viewDate);
        
        const empId = (record as any).User?.employeeId || record.user?.employeeId;
        if (viewMode === 'personal' && empId && empId !== currentUser?.employeeId) {
          return false;
        }
        
        return matchesMonth;
      } catch (e) {
        return false;
      }
    });

    if (searchQuery && viewMode === 'all') {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => {
        const u = (r as any).User || r.user;
        return (
          u?.name.toLowerCase().includes(q) || 
          u?.employeeId.toLowerCase().includes(q) ||
          r.branchName?.toLowerCase().includes(q) ||
          r.departmentName?.toLowerCase().includes(q) ||
          (u?.Branch?.name && u.Branch.name.toLowerCase().includes(q)) ||
          (u?.Department?.name && u.Department.name.toLowerCase().includes(q))
        );
      });
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [records, viewDate, viewMode, currentUser, searchQuery]);

  const monthStats = useMemo(() => {
    if (!filteredRecords.length) return { present: 0, late: 0, absent: 0, leave: 0, total: 0 };
    
    return filteredRecords.reduce((acc, rec) => {
      if (rec.status in acc) {
        acc[rec.status as keyof typeof acc]++;
      }
      acc.total++;
      return acc;
    }, { present: 0, late: 0, absent: 0, leave: 0, total: 0 });
  }, [filteredRecords]);

  const nextMonth = () => {
    setViewDate(addMonths(viewDate, 1));
    setSelectedDay(null);
    setSelectedRecord(null);
  };
  const prevMonth = () => {
    setViewDate(subMonths(viewDate, 1));
    setSelectedDay(null);
    setSelectedRecord(null);
  };

  const handleDateClick = (day: Date, record?: AttendanceRecord) => {
    if (!isSameMonth(day, viewDate)) {
      setViewDate(day);
    }
    setSelectedDay(day);
    setSelectedRecord(record || null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981'; // emerald-500
      case 'late': return '#f59e0b';    // amber-500
      case 'absent': return '#ef4444';   // red-500
      case 'leave': return '#6366f1';    // indigo-500
      default: return '#94a3b8';
    }
  };

  const pieData = [
    { name: 'Present', value: monthStats.present, color: getStatusColor('present') },
    { name: 'Late', value: monthStats.late, color: getStatusColor('late') },
    { name: 'Absent', value: monthStats.absent, color: getStatusColor('absent') },
    { name: 'Leave', value: monthStats.leave, color: getStatusColor('leave') },
  ].filter(d => d.value > 0);

  const getStatusStyle = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'late': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'absent': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'leave': return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    }
  };

  const renderLogs = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto">
      {viewMode === 'all' && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Search by name, ID, branch or dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[32px] border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
             <CalendarIcon className="w-8 h-8" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No records found</p>
          <p className="text-[10px] font-medium text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-tight">Try adjusting your filters or search query</p>
        </div>
      ) : (
        filteredRecords.map((record) => {
          return (
            <div 
              key={record.id} 
              id={`record-${record.id}`}
              className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] group overflow-hidden"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 min-w-[64px] transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/5">
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{record.date.split(' ')[0]}</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-hidden">
                  {viewMode === 'all' && ((record as any).User || record.user) && (
                    <div className="flex items-center gap-2 mb-0.5">
                       <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                         {((record as any).User?.name || record.user?.name)}
                       </h3>
                       <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                         {((record as any).User?.employeeId || record.user?.employeeId)}
                       </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                     <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{record.date}</h3>
                     {record.status === 'present' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                     {viewMode === 'all' && (
                       <>
                         <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/5 rounded-md border border-indigo-100/50 dark:border-indigo-500/10 truncate">
                           <Building2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                           <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 truncate tracking-tight">
                              {(record as any).User?.Branch?.name || record.branchName || 'No Branch'}
                           </span>
                         </div>
                         <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                         <span className="text-[9px] font-bold text-slate-400 truncate">
                            {(record as any).User?.Department?.name || record.departmentName || 'General'}
                         </span>
                       </>
                     )}
                     <div className="flex items-center gap-1.5">
                       <Clock className="w-3 h-3 text-slate-300" />
                       <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">{record.checkIn} — {record.checkOut || '--:--'}</span>
                     </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(record.status)}`}>
                    {record.status}
                  </div>
                  {record.lateMinutes > 0 && (
                    <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">+{record.lateMinutes}m</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderCalendar = () => {
    const startM = startOfMonth(viewDate);
    const endM = endOfMonth(viewDate);
    const startW = startOfWeek(startM, { weekStartsOn: 0 });
    const endW = endOfWeek(endM, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startW, end: endW });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none p-4">
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const d = format(day, 'dd');
              const m = format(day, 'MMM');
              const y = format(day, 'yyyy');
              const dateStr = `${d} ${m} ${y}`;

              const dayRecords = records.filter(r => {
                try {
                  const rDate = new Date(r.date);
                  const matchesDate = isSameDay(rDate, day);
                  
                  if (viewMode === 'personal') {
                    const empId = (r as any).User?.employeeId || r.user?.employeeId;
                    return matchesDate && (!empId || empId === currentUser?.employeeId);
                  }
                  return matchesDate;
                } catch (e) {
                  return false;
                }
              });
              
              const myRecord = dayRecords[0]; // For personal, there's only 1. For all, we might want a specific one or first.
              
              const firstRecord = dayRecords[0];
              const isSelectedMonth = isSameMonth(day, viewDate);
              const isToday = isSameDay(day, new Date());
              const isSelectedDay = selectedDay && isSameDay(day, selectedDay);
              
              const dayName = format(day, 'EEEE');
              const isWorkingDay = settings?.workingDays?.split(',').includes(dayName);

              return (
                <div 
                  key={i} 
                  onClick={() => handleDateClick(day, myRecord || firstRecord)}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl transition-all cursor-pointer ${
                    !isSelectedMonth ? 'opacity-20 hover:opacity-100' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  } ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20' : ''} ${
                    isSelectedDay ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-950 scale-105 z-10' : ''
                  }`}
                >
                  {/* Subtle Background Tint for Status */}
                  {isSelectedMonth && myRecord && (
                    <div className={`absolute inset-1 rounded-xl opacity-[0.08] dark:opacity-[0.15] ${
                      myRecord.status === 'present' ? 'bg-emerald-500' : 
                      myRecord.status === 'late' ? 'bg-amber-500' : 
                      myRecord.status === 'leave' ? 'bg-indigo-500' : 'bg-red-500'
                    }`} />
                  )}

                  <span className={`relative z-10 text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayRecords.length > 0 ? (
                    <div className="absolute bottom-1.5 flex gap-0.5">
                      {viewMode === 'all' ? (
                        dayRecords.slice(0, 3).map((r, idx) => (
                          <div key={idx} className={`w-1 h-1 rounded-full ${
                            r.status === 'present' ? 'bg-emerald-500' : 
                            r.status === 'late' ? 'bg-amber-500' : 
                            r.status === 'leave' ? 'bg-indigo-500' : 'bg-red-500'
                          }`} />
                        ))
                      ) : (
                        myRecord && (
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            myRecord.status === 'present' ? 'bg-emerald-500' : 
                            myRecord.status === 'late' ? 'bg-amber-500' : 
                            myRecord.status === 'leave' ? 'bg-indigo-500' : 'bg-red-500'
                          }`} />
                        )
                      )}
                    </div>
                  ) : (
                    !isWorkingDay && isSelectedMonth && (
                      <span className="absolute bottom-1 text-[7px] font-bold text-slate-300 uppercase tracking-tighter">Off</span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail */}
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <motion.div
              key={selectedDay.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {format(selectedDay, 'EEEE, dd MMMM yyyy')}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Date Details</p>
                </div>
                <button 
                  onClick={() => { setSelectedDay(null); setSelectedRecord(null); }}
                  className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {records.filter(r => {
                try {
                  const rDate = new Date(r.date);
                  const matchesDate = isSameDay(rDate, selectedDay);

                  if (viewMode === 'personal') {
                     const empId = (r as any).User?.employeeId || r.user?.employeeId;
                     return matchesDate && (!empId || empId === currentUser?.employeeId);
                  }
                  return matchesDate;
                } catch (e) {
                  return false;
                }
              }).length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {records.filter(r => {
                    try {
                      const rDate = new Date(r.date);
                      const matchesDate = isSameDay(rDate, selectedDay);
                                          
                      if (viewMode === 'personal') {
                         const empId = (r as any).User?.employeeId || r.user?.employeeId;
                         return matchesDate && (!empId || empId === currentUser?.employeeId);
                      }
                      return matchesDate;
                    } catch (e) {
                      return false;
                    }
                  }).map((dayRec, idx) => (
                    <div key={dayRec.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      {viewMode === 'all' && (dayRec.user || (dayRec as any).User) && (
                        <div className="flex justify-between items-start mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                           <div>
                             <p className="text-xs font-black text-slate-900 dark:text-white">{(dayRec as any).User?.name || dayRec.user?.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{(dayRec as any).User?.employeeId || dayRec.user?.employeeId}</p>
                           </div>
                           <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0 ${getStatusStyle(dayRec.status)}`}>
                             {dayRec.status}
                           </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">In</p>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white">{dayRec.checkIn}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Out</p>
                            <p className="text-[10px] font-black text-slate-800 dark:text-white">{dayRec.checkOut || '--:--'}</p>
                          </div>
                        </div>
                      </div>
                      {viewMode === 'personal' && (
                        <div className="mt-3 flex justify-end">
                           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(dayRec.status)}`}>
                             {dayRec.status}
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-slate-300">
                    <Info className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No production logs for this date</p>
                  <p className="text-[10px] font-medium text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-tight">System synchronization pending or non-working day</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="mt-6 p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center">
               <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-4">
                 <CalendarIcon className="w-6 h-6 text-slate-300" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a day to view details</p>
            </div>
          )}
        </AnimatePresence>
        
        <div className="mt-8 flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: 'Present', color: 'bg-emerald-500' },
            { label: 'Late', color: 'bg-amber-500' },
            { label: 'Absent', color: 'bg-red-500' },
            { label: 'Leave', color: 'bg-indigo-500' },
          ].map(legend => (
            <div key={legend.label} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 whitespace-nowrap">
              <div className={`w-2 h-2 rounded-full ${legend.color}`} />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{legend.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const totalDays = monthStats.total || monthStats.present + monthStats.late + monthStats.absent + monthStats.leave;
    const efficiency = totalDays > 0 ? Math.round(((monthStats.present + monthStats.late) / totalDays) * 100) : 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Pie Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
           <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{viewMode === 'all' ? 'Team Performance' : 'Attendance Mix'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
           </div>

           <div className="h-64 w-full relative">
             {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={85}
                     paddingAngle={8}
                     dataKey="value"
                     animationBegin={0}
                     animationDuration={1500}
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', background: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="w-full h-full flex items-center justify-center border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-full opacity-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Records</p>
                </div>
             )}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{efficiency}%</span>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                 {viewMode === 'all' ? 'Team Score' : 'My Score'}
               </span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
              {[
                { name: 'Present', val: monthStats.present, color: getStatusColor('present') },
                { name: 'Late', val: monthStats.late, color: getStatusColor('late') },
                { name: 'Absent', val: monthStats.absent, color: getStatusColor('absent') },
                { name: 'Leave', val: monthStats.leave, color: getStatusColor('leave') },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{d.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-white">{d.val}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Efficiency Milestone */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Efficiency Goal</h4>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Target: 95% Monthly</p>
              </div>
           </div>
           
           <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${efficiency}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${efficiency >= 95 ? 'bg-emerald-500' : efficiency >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
              />
           </div>
           
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">0%</span>
              <span className={efficiency >= 95 ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}>{efficiency}% REACHED</span>
              <span className="text-slate-400">100%</span>
           </div>
        </div>
      </div>
    );
  };

  const handleDownloadReport = () => {
    if (filteredRecords.length === 0) return;

    const headers = ["Date", "Day", "Check-In", "Check-Out", "Status", "Late Minutes"];
    const rows = filteredRecords.map(record => [
      record.date,
      record.day,
      record.checkIn,
      record.checkOut || '--:--',
      record.status,
      record.lateMinutes
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_${format(viewDate, 'MMM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Compiling Records...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center h-14">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">Logs</h1>
        <button 
          onClick={handleDownloadReport}
          className="relative p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 shadow-sm dark:shadow-none active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Summary Bubble (Fixed Top Overview) */}
      <div className="bg-indigo-600 dark:bg-indigo-950 p-6 pt-7 pb-8 rounded-[40px] shadow-2xl dark:shadow-none relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl font-display" />

        <div className="relative z-10 flex flex-col gap-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Global Score</p>
               <h2 className="text-2xl font-black text-white">{format(viewDate, 'MMMM yyyy')}</h2>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-white">{monthStats.present + monthStats.late}<span className="text-xs font-bold text-indigo-400 ml-1">/ {monthStats.total || 0}</span></span>
                <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-60">Total Presence</span>
             </div>
           </div>

           <div className="flex gap-4">
              {[
                { label: 'Present', val: monthStats.present, icon: Check, color: 'bg-emerald-500/20 text-emerald-400' },
                { label: 'Late', val: monthStats.late, icon: Clock, color: 'bg-amber-500/20 text-amber-400' },
                { label: 'Absent', val: monthStats.absent, icon: X, color: 'bg-red-500/20 text-red-500' },
              ].map((s, i) => (
                <div key={i} className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                   <div className={`w-6 h-6 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                      <s.icon className="w-3.5 h-3.5" />
                   </div>
                   <p className="text-lg font-black text-white leading-none mb-1">{s.val}</p>
                   <p className="text-[8px] font-bold text-indigo-200/40 uppercase tracking-tighter">{s.label}</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Personal vs Company Toggle (Only for Admins/Managers) */}
      {isAdmin && (
        <div className="flex gap-2 bg-indigo-50/50 dark:bg-indigo-500/5 p-1 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10">
          <button
            onClick={() => setViewMode('personal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'personal' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-3 h-3" />
            My Logs
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'all' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-3 h-3" />
            Company Logs
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden min-h-[56px]">
        {(['Logs', 'Calendar', 'Summary'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute inset-0 bg-white/20 rounded-[22px] -z-10"
              />
            )}
          </button>
        ))}
      </div>

      {/* Sub-header with navigation */}
      <div className="flex justify-between items-center px-1 relative">
        <button 
          onClick={prevMonth}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all active:scale-90"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors shadow-sm dark:shadow-none hover:border-indigo-200 active:scale-95"
          >
            <CalendarIcon className="w-4 h-4 text-indigo-600" /> 
            {format(viewDate, 'MMMM yyyy')} 
            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${showMonthPicker ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showMonthPicker && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMonthPicker(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl z-50 p-4 grid grid-cols-3 gap-2 overflow-hidden"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const date = new Date(viewDate.getFullYear(), i, 1);
                    const isSelected = i === viewDate.getMonth();
                    return (
                        <button
                          key={i}
                          onClick={() => {
                            setViewDate(date);
                            setShowMonthPicker(false);
                          }}
                          className={`py-2 text-[10px] font-bold rounded-xl transition-all uppercase tracking-tight ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {format(date, 'MMM')}
                        </button>
                    );
                  })}
                  <div className="col-span-3 border-t border-slate-50 dark:border-slate-800 mt-2 pt-2 flex justify-between items-center px-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
                      }}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                    >
                      <ChevronLeft className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                    </button>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{viewDate.getFullYear()}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
                      }}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={nextMonth}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all active:scale-90"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'Logs' && renderLogs()}
        {activeTab === 'Calendar' && renderCalendar()}
        {activeTab === 'Summary' && renderSummary()}
      </div>
    </div>
  );
};
