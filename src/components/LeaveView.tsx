import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Plus, FileText, ChevronRight, Clock, MapPin, Filter, ArrowLeft, Send, Upload, X, Camera, RefreshCw, Loader2, Plane, HeartPulse, Coffee, Baby } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { LeaveRequest } from '../types';
import { CustomDropdown } from './CustomDropdown';

import { useToast } from './ToastProvider';

export const LeaveView: React.FC = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Rejected' | 'Pending'>('All');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      api.getLeaveHistory().then(setLeaveHistory).catch(console.error);
    } catch (error) {
      console.error("Failed to fetch leave history:", error);
    }
  };

  const filteredHistory = filterStatus === 'All' 
    ? leaveHistory 
    : leaveHistory.filter(leave => leave.status === filterStatus);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) {
      toast("Please fix file issues before submitting", "error");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      // Calculate duration
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const durationStr = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;

      // In a real app, we might send the actual file. Here we just send the metadata.
      const payload = {
        title: formData.reason.slice(0, 20) + (formData.reason.length > 20 ? '...' : ''),
        ...formData,
        date: formData.startDate === formData.endDate 
          ? formData.startDate 
          : `${formData.startDate} - ${formData.endDate}`,
        duration: durationStr,
        attachment: fileName || undefined
      };
      
      const newRequest = await api.submitLeaveRequest(payload, selectedFile || undefined);
      setLeaveHistory(prev => [newRequest, ...prev]);
      setShowConfirmation(false);
      setShowForm(false);
      setFileName(null);
      setSelectedFile(null);
      toast("Leave request submitted successfully!", "success");
    } catch (error) {
      console.error("Submission failed:", error);
      toast("Failed to submit leave request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSize) {
        setFileError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max 5MB.`);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast("Could not access camera. Please check permissions.", "error");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `Captured_Photo_${new Date().getTime()}.jpg`, { type: "image/jpeg" });
          setSelectedFile(file);
          setFileName(file.name);
        }
      }, 'image/jpeg');
      stopCamera();
    }
  };

  if (showHistory) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center h-14">
          <button 
            onClick={() => setShowHistory(false)}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Leave History</h1>
          <div className="w-10"></div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['All', 'Approved', 'Pending', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === status 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* History List */}
        <div className="flex flex-col gap-4">
          {loading ? (
             <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((leave) => (
              <div key={leave.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold ${
                  leave.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  leave.status === 'Rejected' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                  'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  <span className="text-xl leading-none">{leave.duration.includes('Day') ? leave.duration.split(' ')[0] : '1'}</span>
                  <span className="text-[9px] uppercase tracking-tighter">Days</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{leave.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      leave.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                      leave.status === 'Rejected' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' :
                      'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    }`}>{leave.status}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-medium">
                      <Calendar className="w-3 h-3" /> {leave.date}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest opacity-60">{leave.type}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-1">No records found</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">There are no {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} leave requests to show.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center h-14">
          <button 
            onClick={() => setShowForm(false)}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Request Leave</h1>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handlePreSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Leave Type</label>
            <CustomDropdown
              options={[
                { value: 'Annual Leave', label: 'Annual Leave', icon: <Plane className="w-3 h-3" /> },
                { value: 'Sick Leave', label: 'Sick Leave', icon: <HeartPulse className="w-3 h-3 text-red-500" /> },
                { value: 'Casual Leave', label: 'Casual Leave', icon: <Coffee className="w-3 h-3 text-amber-500" /> },
                { value: 'Maternity/Paternity', label: 'Maternity/Paternity', icon: <Baby className="w-3 h-3 text-indigo-500" /> }
              ]}
              value={formData.type}
              onChange={(val) => setFormData({...formData, type: val})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition-all cursor-pointer"
                value={formData.startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setFormData(prev => ({
                    ...prev, 
                    startDate: newStart,
                    endDate: prev.endDate < newStart ? newStart : prev.endDate
                  }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">End Date</label>
              <input 
                type="date"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition-all cursor-pointer"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Reason for Leave</label>
            <textarea 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition-all min-h-[120px] resize-none"
              placeholder="Briefly explain the reason for your leave..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Supporting Documents</label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Upload doc</p>
              </div>

              <div 
                onClick={startCamera}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
              >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Take photo</p>
              </div>
            </div>

            {fileError && (
              <p className="text-[10px] text-red-500 font-bold ml-1 animate-pulse">{fileError}</p>
            )}

            {fileName && (
              <div className="flex items-center justify-between gap-2 p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900 mt-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate font-bold text-xs">{fileName}</span>
                </div>
                <X 
                  className="w-4 h-4 cursor-pointer hover:text-red-500 shrink-0" 
                  onClick={() => { setFileName(null); setSelectedFile(null); setFileError(null); }}
                />
              </div>
            )}
            
            {!fileName && !fileError && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">PDF, JPG up to 5MB</p>
            )}
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4 font-bold"
          >
            <Send className="w-5 h-5" />
            Submit Request
          </button>
        </form>

        <AnimatePresence>
          {showCamera && (
            <div className="fixed inset-0 z-[70] bg-black flex flex-col">
              <div className="p-6 flex items-center justify-between text-white border-b border-white/10">
                <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
                <span className="text-sm font-bold tracking-widest uppercase">Scanner</span>
                <button className="p-2 bg-white/10 rounded-full opacity-0">
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Visual Guides */}
                <div className="absolute inset-0 border-[40px] border-black/40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-indigo-400 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                   <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                   <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                   <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                   <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
              </div>

              <div className="p-10 flex items-center justify-center bg-black">
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white p-1"
                >
                  <div className="w-full h-full bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showConfirmation && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                   <h3 className="text-xl font-bold mb-1">Confirm Submission</h3>
                   <p className="text-indigo-100 text-xs font-medium">Please review your leave details</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formData.type}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Start</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formData.startDate}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">End</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formData.endDate}</span>
                    </div>
                    <div className="py-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Reason</span>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">"{formData.reason}"</p>
                    </div>
                    {fileName && (
                      <div className="flex justify-between items-center py-2 bg-indigo-50/50 dark:bg-indigo-500/10 px-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">Attached</span>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">{fileName}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => setShowConfirmation(false)}
                      className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                      disabled={submitting}
                    >
                      Wait, Edit
                    </button>
                    <button 
                      onClick={handleConfirmSubmit}
                      className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3" />}
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center h-14">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave</h1>
        <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      <div className="-mt-3 mb-1">
        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Manage and request your leaves</p>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-600 dark:bg-indigo-700 p-5 rounded-3xl text-white shadow-lg relative overflow-hidden group">
           <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Annual Leave</p>
           <div className="flex items-baseline gap-2">
             <span className="text-3xl font-bold font-display">12</span>
             <span className="text-indigo-100 text-[10px] font-bold">Days Left</span>
           </div>
        </div>
        <div className="bg-emerald-500 dark:bg-emerald-600 p-5 rounded-3xl text-white shadow-lg relative overflow-hidden group">
           <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
           <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Sick Leave</p>
           <div className="flex items-baseline gap-2">
             <span className="text-3xl font-bold font-display">08</span>
             <span className="text-emerald-100 text-[10px] font-bold">Days Left</span>
           </div>
        </div>
      </div>

      <button 
        onClick={() => setShowForm(true)}
        className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white p-4 rounded-3xl flex items-center justify-center gap-3 shadow-xl dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] mt-2 mb-2 group"
      >
        <div className="p-2 bg-indigo-500 rounded-2xl group-hover:rotate-90 transition-transform duration-500">
           <Plus className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm tracking-wide">Request New Leave</span>
      </button>

      {/* Leave History */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Requests</h2>
          <button 
            onClick={() => setShowHistory(true)}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-700"
          >
            History
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
             <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-slate-200 dark:text-slate-700 animate-spin" /></div>
          ) : leaveHistory.slice(0, 2).map((leave, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold ${
                leave.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                <span className="text-lg leading-none">{leave.duration.includes('Day') ? leave.duration.split(' ')[0] : '1'}</span>
                <span className="text-[8px] uppercase tracking-tighter">Days</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{leave.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                    leave.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  }`}>{leave.status}</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-medium mb-1">
                  <Calendar className="w-2.5 h-2.5" /> {leave.date}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest opacity-60">{leave.type}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
          {!loading && leaveHistory.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No recent requests</p>
          )}
        </div>
      </div>

      {/* Summary Card and Policy Link */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
           <div className="p-3 bg-white dark:bg-slate-900 w-fit mx-auto rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
              <FileText className="w-6 h-6 text-slate-400 dark:text-slate-600" />
           </div>
           <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">No leave documents</h3>
           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-4">Upload your medical certificates or travel documents for faster approvals.</p>
        </div>
        
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); toast("Opening BoardPolicy_Leave_2024.pdf", "info"); }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Company Leave Policy</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Read rules and guidelines</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </a>
      </div>
    </div>
  );
};
