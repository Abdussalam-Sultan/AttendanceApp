import React, { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { User as UserIcon, ChevronRight, Edit3, Camera, Building2, Mail, CreditCard, Users2, Briefcase, Shield, Bell, Settings, LogOut, MapPin, BadgeCheck, Loader2, ArrowLeft, ToggleLeft, ToggleRight, X, Check, Lock, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Navigation, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { User } from '../types';
import { getCroppedImg, getCroppedBlob } from '../lib/cropImage';
import Cropper, { Area } from 'react-easy-crop';
import { useToast } from './ToastProvider';
import { haptics } from '../lib/haptics';
import { storage } from '../services/storage';
import { CopyButton } from './CopyButton';

interface ProfileViewProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  unreadCount: number;
  user: any;
  onUserUpdate: (userData: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout, theme, setTheme, showNotifications, setShowNotifications, unreadCount, user: propUser, onUserUpdate }) => {
  const { toast, confirm } = useToast();
  const [user, setUser] = useState<User | null>(propUser);
  const [loading, setLoading] = useState(true);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showWorkInfo, setShowWorkInfo] = useState(false);
  const [showAttendanceSummary, setShowAttendanceSummary] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState({
    phone: propUser?.phone || '',
    address: propUser?.address || '',
    emergencyContact: propUser?.emergencyContact || '',
    birthDate: propUser?.birthDate || ''
  });

  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);

  const [notifSettings, setNotifSettings] = useState(propUser?.notifSettings || {
    attendance: true,
    leave: true,
    announcements: true,
    marketing: false,
    sound: 'chime',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });

  const [securitySettings, setSecuritySettings] = useState(propUser?.securitySettings || {
    stayLoggedIn: true,
    locationPrivacy: true
  });
  const [appPrefs, setAppPrefs] = useState(propUser?.appSettings || {
    haptic: true,
    geofence: false,
    autoCheckout: false
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Avatar Upload & Crop State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const efficiency = stats ? Math.round(((stats.present || 0) + (stats.late || 0)) / Math.max(1, ((stats.present || 0) + (stats.late || 0) + (stats.absent || 0) + (stats.leave || 0))) * 100) : 0;
  const pieData = stats ? [
    { name: 'Present', value: stats.present || 0, color: '#10b981' },
    { name: 'Late', value: stats.late || 0, color: '#f59e0b' },
    { name: 'Absent', value: stats.absent || 0, color: '#ef4444' },
    { name: 'Leave', value: stats.leave || 0, color: '#6366f1' },
  ].filter(d => d.value > 0) : [];

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result?.toString() || null);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const blob = await getCroppedBlob(imageToCrop, croppedAreaPixels);
      
      if (blob && user) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        const updatedUser = await api.updateProfile({}, file);
        setUser(updatedUser);
        onUserUpdate(updatedUser);
        setImageToCrop(null);
        toast("Profile picture updated", "success");
      }
    } catch (e) {
      console.error(e);
      toast("Failed to crop image. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleNotif = async (key: keyof typeof notifSettings) => {
    if (key !== 'quietHours' && key !== 'sound') {
      const newSettings = { ...notifSettings, [key]: !notifSettings[key] };
      setNotifSettings(newSettings);
      haptics.impact();
      try {
        const updatedUser = await api.updateProfile({ notifSettings: JSON.stringify(newSettings) });
        onUserUpdate(updatedUser);
      } catch (error) {
        console.error("Failed to save notification settings:", error);
      }
    }
  };

  const togglePreference = async (key: keyof typeof appPrefs) => {
    const newPrefs = { ...appPrefs, [key]: !appPrefs[key] };
    setAppPrefs(newPrefs);
    haptics.impact();
    localStorage.setItem('app_preferences', JSON.stringify(newPrefs));
    try {
      const updatedUser = await api.updateProfile({ appSettings: JSON.stringify(newPrefs) });
      onUserUpdate(updatedUser);
    } catch (error) {
       console.error("Failed to save app preferences:", error);
    }
  };



  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Fetch stats
        const statsData = await api.getAttendanceStats();
        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch profile stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const menuItems = [
    { label: 'Personal Information', sub: 'Update your personal details', icon: CreditCard, color: 'bg-indigo-50 text-indigo-500', onClick: () => setShowPersonalInfo(true) },
    { label: 'Work Information', sub: 'View your work and job details', icon: Briefcase, color: 'bg-emerald-50 text-emerald-500', onClick: () => setShowWorkInfo(true) },
    { label: 'Attendance Summary', sub: 'View your attendance statistics', icon: BadgeCheck, color: 'bg-orange-50 text-orange-500', onClick: () => setShowAttendanceSummary(true) },
    { label: 'Security', sub: 'Change password and security options', icon: Shield, color: 'bg-purple-50 text-purple-500', onClick: () => setShowSecuritySettings(true) },
    { label: 'Settings', sub: 'App preferences and notifications', icon: Settings, color: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400', onClick: () => setShowAppSettings(true) },
  ];

  const toggleSecurity = async (key: keyof typeof securitySettings) => {
    const newSettings = { ...securitySettings, [key]: !securitySettings[key] };
    setSecuritySettings(newSettings);
    try {
      const updatedUser = await api.updateProfile({ securitySettings: JSON.stringify(newSettings) });
      onUserUpdate(updatedUser);
    } catch (error) {
      console.error("Failed to save security settings:", error);
    }
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const updatedUser = await api.updateProfile(personalInfoForm);
      setUser(updatedUser);
      onUserUpdate(updatedUser);
      setInfoSuccess(true);
      toast("Personal information updated successfully", "success");
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      toast("Failed to update information", "error");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const validatePassword = (password: string) => {
    if (!password) return false;
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast("New passwords do not match", "error");
      return;
    }
    
    const passValid = validatePassword(passwordForm.new);
    if (passValid !== true) {
      toast(passValid as string, "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword(passwordForm.current, passwordForm.new);
      setPasswordSuccess(true);
      toast("Password updated successfully", "success");
      setTimeout(() => setPasswordSuccess(false), 3000);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Failed to update password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutConfirm = async () => {
    const confirmed = await confirm("Log Out", "Are you sure you want to sign out? Your current session will be cleared.");
    if (confirmed) {
      onLogout();
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center h-14">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Profile</h1>
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
        >
          <Bell className="w-6 h-6 text-slate-900 dark:text-slate-100" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900 scale-110 shadow-sm shadow-red-200 dark:shadow-none"></span>
          )}
        </button>
      </div>

      <div className="-mt-3 mb-1">
        <p className="text-slate-400 text-sm font-medium">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="relative bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-slate-900 overflow-hidden rounded-[40px] shadow-sm border border-white dark:border-slate-800 p-6 pt-8 pb-10">
         {/* Background Decoration */}
         <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
         <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-400/10 dark:bg-indigo-900/10 rounded-full blur-2xl font-display"></div>

         <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={triggerFileInput}
                className="w-28 h-28 rounded-[32px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-soft group cursor-pointer transition-all active:scale-95 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-30' : 'opacity-100'}`} referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-400" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[32px]">
                   <Camera className="w-8 h-8 text-white/80" />
                </div>
              </div>
              <button 
                onClick={triggerFileInput}
                className="absolute -bottom-1.5 -right-1.5 w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg active:scale-90 transition-transform"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start">
               <div className="flex flex-col md:flex-row items-center md:items-center gap-4 mb-3">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center md:text-left">{user.name}</h2>
                 <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold shadow-sm border border-indigo-50 dark:border-slate-700 hover:bg-indigo-50 transition-all">
                   <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                 </button>
               </div>
               
               <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-6 opacity-70 leading-none">{user.role}</p>

               <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-none">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 group">
                    <div className="p-2 bg-white/60 dark:bg-white/5 rounded-xl group-hover:bg-white dark:group-hover:bg-white/10 transition-colors border border-white/50 dark:border-slate-700">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-[13px] font-semibold">
                      {user.role === 'Admin' ? 'Management' : (user.Department?.name || user.department)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 group">
                    <div className="p-2 bg-white/60 dark:bg-white/5 rounded-xl group-hover:bg-white dark:group-hover:bg-white/10 transition-colors border border-white/50 dark:border-slate-700">
                      <Mail className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[13px] font-semibold truncate max-w-[160px] md:max-w-[200px]">{user.email}</span>
                      <CopyButton value={user.email} label="Email" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Info Badges */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Employee ID', value: user.employeeId, icon: CreditCard, color: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
          { label: 'Department', value: user.role === 'Admin' ? 'MGT' : (user.Department?.name || user.department).slice(0, 11), icon: Users2, color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { label: 'Branch', value: user.branch?.name || user.location || 'Studio', icon: MapPin, color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
          { label: 'Role', value: user.role, icon: Briefcase, color: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        ].map((info, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer relative">
            {idx < 3 && <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-slate-100 dark:bg-slate-800"></div>}
            <div className={`p-3 rounded-2xl ${info.color} transition-all duration-300 group-hover:scale-110 shadow-sm border border-white dark:border-slate-800`}>
              <info.icon className="w-5 h-5 mx-auto" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{info.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 text-center">{info.value}</span>
                {info.label === 'Employee ID' && <CopyButton value={String(info.value)} label={info.label} className="scale-75" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Options */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
        {menuItems.map((item: any, idx) => (
          <button 
            key={idx} 
            onClick={item.onClick}
            className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10 transition-colors group"
          >
            <div className={`p-3.5 rounded-2xl ${item.color} transition-transform group-hover:scale-105 shadow-sm`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5 leading-none transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.label}</h3>
              <p className="text-[11px] font-medium text-slate-400 leading-none">{item.sub}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* Log Out */}
      <button 
        onClick={handleLogoutConfirm}
        className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-500/5 group transition-all duration-300 active:scale-[0.98]"
      >
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 group-hover:bg-red-100 transition-colors duration-300 shadow-sm border border-red-50 dark:border-red-500/20">
          <LogOut className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-0.5 leading-none group-hover:tracking-wide transition-all">Log Out</h3>
          <p className="text-[11px] font-medium text-slate-400 leading-none">Sign out from your account</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-200 dark:text-slate-700 group-hover:text-red-300 transition-all" />
      </button>

      {/* Personal Info Overlay */}
      <AnimatePresence>
        {showPersonalInfo && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setShowPersonalInfo(false)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">Personal Info</h2>
                <p className="text-[11px] font-medium text-slate-400">Manage your private details</p>
              </div>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-8 pb-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Details</h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={personalInfoForm.phone}
                        onChange={(e) => setPersonalInfoForm({...personalInfoForm, phone: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="e.g. +234 8057 0243 55"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Home Address</label>
                      <textarea 
                        rows={3}
                        value={personalInfoForm.address}
                        onChange={(e) => setPersonalInfoForm({...personalInfoForm, address: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 resize-none" 
                        placeholder="e.g. 15, Adeola Odeku St, Victoria Island, Lagos"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Emergency & Personal</h3>
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Emergency Contact</label>
                      <input 
                        type="text" 
                        value={personalInfoForm.emergencyContact}
                        onChange={(e) => setPersonalInfoForm({...personalInfoForm, emergencyContact: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="e.g. Ngozi Obi (+234 802 000 0000)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Date of Birth</label>
                      <input 
                        type="date" 
                        value={personalInfoForm.birthDate}
                        onChange={(e) => setPersonalInfoForm({...personalInfoForm, birthDate: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {infoSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center"
                >
                  Personal information successfully updated!
                </motion.div>
              )}

              <div className="pt-4 space-y-4">
                <button 
                  type="submit"
                  disabled={isSavingInfo}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 dark:shadow-none"
                >
                  {isSavingInfo ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save Changes <Check className="w-4 h-4" /></>}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPersonalInfo(false)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold py-4 rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Work Information Overlay */}
      <AnimatePresence>
        {showWorkInfo && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setShowWorkInfo(false)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">Work Information</h2>
                <p className="text-[11px] font-medium text-slate-400">View your job and employment details</p>
              </div>
            </div>

            <div className="space-y-6 pb-10">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="grid gap-6">
                   {[
                     { label: 'Employee ID', value: user?.employeeId, icon: CreditCard },
                     { label: 'Role / Designation', value: user?.role, icon: Briefcase },
                     { label: 'Department', value: user?.role === 'Admin' ? 'Executive Management' : (user?.Department?.name || user?.department), icon: Users2 },
                     { label: 'Location', value: user?.location, icon: MapPin },
                     { label: 'Manager', value: user?.manager || 'HR Admin', icon: Shield },
                     { label: 'Join Date', value: user?.joinDate || 'Jan 15, 2024', icon: BadgeCheck },
                     { label: 'Contract Type', value: user?.contractType || 'Full-Time', icon: Lock },
                   ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                         <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                           <item.icon className="w-5 h-5" />
                         </div>
                         <div className="flex-1 overflow-hidden">
                           <div className="flex items-center justify-between">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                             {(item.label === 'Employee ID' || item.label === 'Manager') && (
                               <CopyButton value={String(item.value)} label={item.label} className="opacity-0 group-hover:opacity-100 scale-75" />
                             )}
                           </div>
                           <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{item.value}</p>
                         </div>
                      </div>
                   ))}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 p-5 rounded-[32px] space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Office Policy</span>
                </div>
                <p className="text-[11px] text-indigo-700/70 dark:text-indigo-400/60 font-medium leading-relaxed">
                  You are part of the standard core-time shifts. Please ensure to check-in before 09:00 AM to avoid late status.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <button 
                onClick={() => setShowWorkInfo(false)}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-3xl active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Summary Overlay */}
      <AnimatePresence>
        {showAttendanceSummary && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setShowAttendanceSummary(false)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">Attendance Summary</h2>
                <p className="text-[11px] font-medium text-slate-400">Total career performance</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {!stats ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">Checking Records</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crunching your career data...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-10">
                  {/* Pie Chart Card */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                    <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Attendance Mix</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Overview</p>
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
                        <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                          {efficiency}%
                        </span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full mt-2 shadow-sm dark:shadow-none">Efficiency Score</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                       {[
                         { name: 'Present', val: stats.present || 0, color: '#10b981' },
                         { name: 'Late', val: stats.late || 0, color: '#f59e0b' },
                         { name: 'Absent', val: stats.absent || 0, color: '#ef4444' },
                         { name: 'Leave', val: stats.leave || 0, color: '#6366f1' },
                       ].map((d, i) => (
                         <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                             <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{d.name}</span>
                           </div>
                           <span className="text-[12px] font-black text-slate-800 dark:text-white">{d.val}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Improved Summary Badges */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-500 dark:bg-emerald-600 p-6 rounded-[32px] text-white shadow-lg shadow-emerald-500/20 dark:shadow-none relative overflow-hidden group">
                        <ArrowUpRight className="absolute -top-1 -right-1 w-16 h-16 opacity-10 transition-transform group-hover:scale-125" />
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mb-1">On Time</p>
                          <div className="flex items-baseline gap-1">
                            <h4 className="text-3xl font-black">{stats.present || 0}</h4>
                            <span className="text-xs font-bold opacity-60">days</span>
                          </div>
                        </div>
                     </div>
                     <div className="bg-amber-500 dark:bg-amber-600 p-6 rounded-[32px] text-white shadow-lg shadow-amber-500/20 dark:shadow-none relative overflow-hidden group">
                        <Clock className="absolute -top-1 -right-1 w-16 h-16 opacity-10 transition-transform group-hover:scale-125" />
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100 mb-1">Late In</p>
                          <div className="flex items-baseline gap-1">
                            <h4 className="text-3xl font-black">{stats.late || 0}</h4>
                            <span className="text-xs font-bold opacity-60">days</span>
                          </div>
                        </div>
                     </div>
                     <div className="bg-red-500 dark:bg-red-600 p-6 rounded-[32px] text-white shadow-lg shadow-red-500/20 dark:shadow-none relative overflow-hidden group">
                        <X className="absolute -top-1 -right-1 w-16 h-16 opacity-10 transition-transform group-hover:scale-125" />
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-red-100 mb-1">Missed</p>
                          <div className="flex items-baseline gap-1">
                            <h4 className="text-3xl font-black">{stats.absent || 0}</h4>
                            <span className="text-xs font-bold opacity-60">days</span>
                          </div>
                        </div>
                     </div>
                     <div className="bg-slate-900 dark:bg-indigo-900 p-6 rounded-[32px] text-white shadow-lg dark:shadow-none relative overflow-hidden group">
                        <Calendar className="absolute -top-1 -right-1 w-16 h-16 opacity-10 transition-transform group-hover:scale-125" />
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">On Leave</p>
                          <div className="flex items-baseline gap-1">
                            <h4 className="text-3xl font-black">{stats.leave || 0}</h4>
                            <span className="text-xs font-bold opacity-60">days</span>
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Efficiency Milestone */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Performance Score</h4>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Target: 95% Consistency</p>
                        </div>
                     </div>
                     
                     <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${efficiency}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${efficiency >= 95 ? 'bg-emerald-500' : efficiency >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                        />
                     </div>
                     
                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">0%</span>
                        <span className={efficiency >= 95 ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}>{efficiency}% REACHED</span>
                        <span className="text-slate-400">100%</span>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4">
              <button 
                onClick={() => setShowAttendanceSummary(false)}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-3xl active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl dark:shadow-none"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Settings Overlay */}
      <AnimatePresence>
        {showSecuritySettings && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setShowSecuritySettings(false)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">Security</h2>
                <p className="text-[11px] font-medium text-slate-400">Protect your account access</p>
              </div>
            </div>

            <div className="space-y-8 pb-10">
              {/* Account Security Toggles */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Access Privacy</h3>
                {[
                  { key: 'locationPrivacy', label: 'Location Privacy', sub: 'Only track location during scans', icon: MapPin },
                  { key: 'stayLoggedIn', label: 'Persistent Session', sub: 'Keep me logged in on this device', icon: CreditCard },
                ].map((item) => (
                  <div 
                    key={item.key}
                    onClick={() => toggleSecurity(item.key as keyof typeof securitySettings)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.label}</h4>
                        <p className="text-[10px] font-medium text-slate-400">{item.sub}</p>
                      </div>
                    </div>
                    <div className={`transition-colors duration-300 ${securitySettings[item.key as keyof typeof securitySettings] ? 'text-indigo-600' : 'text-slate-200'}`}>
                      {securitySettings[item.key as keyof typeof securitySettings] ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Password Change Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password Update</h3>
                <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  {passwordSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-[10px] font-bold text-center"
                    >
                      Password successfully updated!
                    </motion.div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Current Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        passwordForm.new && passwordForm.new.length < 8 ? 'ring-2 ring-amber-500/50' : ''
                      }`} 
                      placeholder="••••••••"
                    />
                    {passwordForm.new && (
                      <div className="flex flex-wrap gap-2 px-1 mt-2">
                        {[
                          { label: '8+ Chars', met: passwordForm.new.length >= 8 },
                          { label: 'Uppercase', met: /[A-Z]/.test(passwordForm.new) },
                          { label: 'Number', met: /[0-9]/.test(passwordForm.new) }
                        ].map((req, i) => (
                          <div key={i} className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider ${req.met ? 'text-emerald-500' : 'text-slate-400'}`}>
                            <div className={`w-1 h-1 rounded-full ${req.met ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <button 
                    disabled={isChangingPassword}
                    className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 p-5 rounded-[32px] space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Privacy Tip</span>
                </div>
                <p className="text-[11px] text-amber-700/70 dark:text-amber-400/60 font-medium leading-relaxed">
                   We recommend changing your password every 90 days for optimal security. Your password must be at least 8 characters long.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6">
                <button 
                  onClick={() => setShowSecuritySettings(false)}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-3xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Done
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Settings Overlay - Consolidated */}
      <AnimatePresence>
        {showAppSettings && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setShowAppSettings(false)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">Settings</h2>
                <p className="text-[11px] font-medium text-slate-400">Manage your app experience</p>
              </div>
            </div>

            <div className="space-y-8 pb-10">
              {/* Appearance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Appearance</h3>
                </div>
                <div 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between group cursor-pointer hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-indigo-500">
                      {theme === 'dark' ? <Clock className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Dark Mode</h4>
                      <p className="text-[10px] font-medium text-slate-400">Use a darker color theme</p>
                    </div>
                  </div>
                  <div className={`transition-colors duration-300 ${theme === 'dark' ? 'text-indigo-600' : 'text-slate-200'}`}>
                    {theme === 'dark' ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-emerald-500">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Language</h4>
                      <p className="text-[10px] font-medium text-slate-400">English (United Kingdom)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Bell className="w-3.5 h-3.5 text-rose-500" />
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Notifications</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'attendance', label: 'Attendance Alerts', sub: 'Reminders for check-in/out', icon: BadgeCheck, color: 'text-indigo-500' },
                    { key: 'leave', label: 'Leave Updates', sub: 'Status changes for requests', icon: Briefcase, color: 'text-emerald-500' },
                    { key: 'announcements', label: 'Announcements', sub: 'Office policy updates', icon: Bell, color: 'text-rose-500' },
                  ].map((notif) => (
                    <div 
                      key={notif.key}
                      onClick={() => toggleNotif(notif.key as keyof typeof notifSettings)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 ${notif.color}`}>
                          <notif.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{notif.label}</h4>
                          <p className="text-[10px] font-medium text-slate-400">{notif.sub}</p>
                        </div>
                      </div>
                      <div className={`transition-colors duration-300 ${notifSettings[notif.key as keyof typeof notifSettings] ? 'text-indigo-600' : 'text-slate-200'}`}>
                        {notifSettings[notif.key as keyof typeof notifSettings] ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Preferences */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Preferences</h3>
                </div>
                
                <div 
                  onClick={() => togglePreference('haptic')}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-amber-500">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Haptic Feedback</h4>
                      <p className="text-[10px] font-medium text-slate-400">Vibrate on interactions</p>
                    </div>
                  </div>
                  <div className={`transition-colors duration-300 ${appPrefs.haptic ? 'text-indigo-600' : 'text-slate-200'}`}>
                    {appPrefs.haptic ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </div>
                </div>

                <div 
                  onClick={() => togglePreference('geofence')}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-indigo-500">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Auto-Geofence</h4>
                      <p className="text-[10px] font-medium text-slate-400">Automatic check-in detection</p>
                    </div>
                  </div>
                  <div className={`transition-colors duration-300 ${appPrefs.geofence ? 'text-indigo-600' : 'text-slate-200'}`}>
                    {appPrefs.geofence ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </div>
                </div>

                <div 
                  onClick={() => togglePreference('autoCheckout')}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-rose-500">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Auto-Checkout</h4>
                      <p className="text-[10px] font-medium text-slate-400">Auto checkout when leaving area</p>
                    </div>
                  </div>
                  <div className={`transition-colors duration-300 ${appPrefs.autoCheckout ? 'text-indigo-600' : 'text-slate-200'}`}>
                    {appPrefs.autoCheckout ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 p-5 rounded-[32px]">
                <p className="text-[10px] text-indigo-700/70 dark:text-indigo-400/60 font-medium leading-relaxed text-center italic">
                  App Version 2.4.0 (Build 992) • Studio Attendance System
                </p>
              </div>
            </div>

            <div className="mt-auto pb-4">
               <button 
                 onClick={() => setShowAppSettings(false)}
                 className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-indigo-100/50 dark:shadow-none active:scale-95 transition-all text-sm uppercase tracking-widest"
               >
                 Close Settings
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Cropping Modal Overlay */}
      <AnimatePresence>
        {imageToCrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col"
          >
            <div className="p-6 flex items-center justify-between text-white safe-top">
              <button 
                onClick={() => setImageToCrop(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">Adjust Avatar</h2>
              <div className="w-10"></div>
            </div>

            <div className="relative flex-1 bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 pb-12 bg-slate-900 rounded-t-[40px] flex flex-col gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zoom</span>
                  <span className="text-[10px] font-bold text-indigo-400">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 range-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="py-4 px-6 rounded-2xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCroppedImage}
                  disabled={isUploading}
                  className="py-4 px-6 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 overflow-hidden"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
