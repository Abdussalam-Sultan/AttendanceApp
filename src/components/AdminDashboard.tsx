import React, { useEffect, useState, useRef } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, Search, MoreVertical, Filter, Download, BellPlus, X, Send, Megaphone, Settings, ShieldCheck, Trash2, Edit2, UserX, Tag, Building2, MapPin, UserPlus, Shield, ArrowRight, User, Eye, Mail, Table, CheckSquare, Square, ChevronDown, Check, Crown, AlertCircle, Calendar, FileText, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Move map helpers outside for stability and better performance
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const LocationPickerMap = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

import { CustomDropdown } from './CustomDropdown';
import { api } from '../services/api';

import { useToast } from './ToastProvider';

export const AdminDashboard: React.FC = () => {
  const { toast, confirm } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    activeToday: 0,
    late: 0,
    absent: 0,
    leave: 0
  });
  const [records, setRecords] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchStats, setBranchStats] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [selectedDeptsForComp, setSelectedDeptsForComp] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'workforce' | 'approvals' | 'announcements' | 'employees' | 'branches' | 'departments' | 'settings'>('workforce');
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  
  // Branch state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '', code: '', latitude: null as number | null, longitude: null as number | null });
  const [branchLoading, setBranchLoading] = useState(false);
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [isSpecificEnough, setIsSpecificEnough] = useState(true);

  // Department state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', code: '' });
  const [deptLoading, setDeptLoading] = useState(false);
  const [compareDepts, setCompareDepts] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  // User edit state (for admin)
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userUpdateLoading, setUserUpdateLoading] = useState(false);

  // Settings states
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Announcement states
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', category: 'General' });
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(true);

  const fetchData = async () => {
    try {
      const userData = await api.getUser();
      setUser(userData);
      setLoading(false); // Move this up to show the layout immediately

      // Fire subsequent requests in parallel without blocking the main UI
      // Use individual setters to populate data as it arrives
      api.getAdminStats().then(setStats).catch(console.error);
      api.getAllAttendanceRecords().then(setRecords).catch(console.error);
      api.getAdminLeaveRequests().then(setLeaveRequests).catch(console.error);
      api.getAttendanceSettings().then(setSettings).catch(console.error);
      api.getAnnouncements().then(setAnnouncements).catch(console.error);
      api.getAdminUsers().then(setUsers).catch(console.error);
      api.getAdminBranchStats(dateRange.start, dateRange.end).then(setBranchStats).catch(console.error);
      api.getAdminDepartmentStats(dateRange.start, dateRange.end).then(setDepartmentStats).catch(console.error);
      api.getDepartments().then(setDepartments).catch(console.error);

      if (userData.role === 'Admin') {
        api.getBranches().then(setBranches).catch(console.error);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setLoading(false);
    }
  };

  const generateEmployeeId = (role: string) => {
    let prefix = 'EMP-';
    if (role === 'Manager') prefix = 'MGR-';
    if (role === 'Admin') prefix = 'ADM-';
    
    let newId = '';
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 100) {
      const num = Math.floor(1000 + Math.random() * 9000);
      newId = `${prefix}${num}`;
      exists = users.some(u => u.employeeId === newId);
      attempts++;
    }
    return newId;
  };

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) return;
    setSearchingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const data = await res.json();
      setLocationResults(data);
      if (data.length > 0) {
        // Just a hint, don't auto-set yet
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSelectLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Check specificity: Nominatim results have an 'importance' and 'type'
    // 'house', 'secondary', 'tertiary' are usually good. 'city', 'administrative' are too broad.
    const broadTypes = ['administrative', 'city', 'state', 'country', 'continent', 'region'];
    const specific = !broadTypes.includes(result.type) && parseFloat(result.importance) > 0.4;
    
    setIsSpecificEnough(specific);
    setNewBranch({
      ...newBranch,
      location: result.display_name,
      latitude: lat,
      longitude: lon
    });
    setMapCenter([lat, lon]);
    setLocationResults([]);
    
    if (!specific) {
      toast("This location seems a bit broad. Please try to be more specific (street address) or fine-tune on the map.", "info");
    } else {
      toast("Location matched!", "success");
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) return;
    setBranchLoading(true);
    try {
      const data = await api.createBranch(newBranch);
      setBranches(prev => [...prev, data]);
      setShowBranchModal(false);
      setNewBranch({ name: '', location: '', code: '', latitude: null, longitude: null });
      toast("Branch created successfully!", "success");
    } catch (error) {
      toast("Failed to create branch", "error");
    } finally {
      setBranchLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    const confirmed = await confirm("Delete Branch", "Are you sure? This will unassign all users from this branch.");
    if (!confirmed) return;
    try {
      await api.deleteBranch(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast("Branch deleted", "success");
    } catch (error) {
      toast("Failed to delete branch", "error");
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name) return;
    setDeptLoading(true);
    try {
      const data = await api.createDepartment(newDept);
      setDepartments(prev => [...prev, data]);
      setShowDeptModal(false);
      setNewDept({ name: '', description: '', code: '' });
      toast("Department created successfully!", "success");
      // Refresh stats
      api.getAdminDepartmentStats(dateRange.start, dateRange.end).then(setDepartmentStats).catch(console.error);
    } catch (error) {
      toast("Failed to create department", "error");
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    const confirmed = await confirm("Delete Department", "Are you sure? This will unassign all users from this department.");
    if (!confirmed) return;
    try {
      await api.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast("Department deleted", "success");
      // Refresh stats
      api.getAdminDepartmentStats().then(setDepartmentStats).catch(console.error);
    } catch (error) {
      toast("Failed to delete department", "error");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserUpdateLoading(true);
    try {
      if (editingUser.isNew) {
        // Create new user
        const newUser = await api.createAdminUser({
          name: editingUser.name,
          email: editingUser.email,
          password: editingUser.password,
          role: editingUser.role,
          branchId: editingUser.branchId || null,
          department: editingUser.department,
          departmentId: editingUser.departmentId || null,
          employeeId: editingUser.employeeId
        });
        setUsers(prev => [newUser, ...prev]);
        toast("New employee added successfully!", "success");
      } else {
        // Find existing user to check for changes
        const existing = users.find(u => u.id === editingUser.id);
        if (existing && existing.role !== editingUser.role) {
          const confirmed = await confirm(
            "Change Access Role", 
            `Are you sure you want to change ${editingUser.name}'s role from ${existing.role} to ${editingUser.role}? This will modify their system permissions.`
          );
          if (!confirmed) {
            setUserUpdateLoading(false);
            return;
          }
        }

        // Update existing user
        const updated = await api.updateAdminUser(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          branchId: editingUser.branchId || null,
          department: editingUser.department,
          departmentId: editingUser.departmentId || null,
          employeeId: editingUser.employeeId,
          phone: editingUser.phone,
          address: editingUser.address,
          status: editingUser.status
        });
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        toast("User updated successfully!", "success");
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error: any) {
      toast(error?.message || "Failed to save user", "error");
    } finally {
      setUserUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      api.getAdminBranchStats(dateRange.start, dateRange.end).then(setBranchStats).catch(console.error);
      api.getAdminDepartmentStats(dateRange.start, dateRange.end).then(setDepartmentStats).catch(console.error);
    }
  }, [dateRange]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const confirmed = await confirm(
      "Update Policies", 
      "Are you sure you want to update the attendance policies? These changes will apply to all future records."
    );
    if (!confirmed) return;

    setSettingsLoading(true);
    try {
      await api.updateAttendanceSettings(settings);
      toast("Settings updated successfully!", "success");
    } catch (error) {
      toast("Failed to update settings", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLeaveAction = async (id: string | number, status: 'Approved' | 'Rejected') => {
    const confirmed = await confirm(
      `${status} Leave Request`, 
      `Are you sure you want to mark this leave request as ${status}?`
    );
    if (!confirmed) return;

    setUpdatingId(id);
    try {
      await api.updateLeaveStatus(id, status);
      setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      const statsData = await api.getAdminStats();
      setStats(statsData);
      toast(`Leave request ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'warning');
    } catch (error) {
      toast("Failed to update leave request", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    
    setAnnounceLoading(true);
    try {
      if (editingAnnouncement) {
        await api.updateAnnouncement(editingAnnouncement.id, newAnnouncement);
        toast("Announcement updated successfully!", "success");
      } else {
        await api.createAnnouncement(newAnnouncement);
        toast("Announcement published successfully!", "success");
      }
      setShowAnnounceModal(false);
      setNewAnnouncement({ title: '', content: '', category: 'General' });
      setEditingAnnouncement(null);
      
      // Refresh announcements
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      toast("Failed to save announcement", "error");
    } finally {
      setAnnounceLoading(false);
    }
  };

  const handleEditAnnouncement = (ann: any) => {
    setEditingAnnouncement(ann);
    setNewAnnouncement({
      title: ann.title,
      content: ann.content,
      category: ann.category || 'General'
    });
    setShowAnnounceModal(true);
  };

  const handleDeleteAnnouncement = async (id: number | string) => {
    const confirmed = await confirm("Delete Announcement", "Are you sure you want to permanently delete this announcement?");
    if (!confirmed) return;

    try {
      await api.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast("Announcement deleted", "success");
    } catch (error) {
      toast("Failed to delete announcement", "error");
    }
  };

  const handleDeleteUser = async (user: any) => {
    const confirmed = await confirm("Delete Employee", `Are you sure you want to delete ${user.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast("Employee profile deleted", "success");
    } catch (error) {
      toast("Failed to delete user", "error");
    }
  };

  const handleUnbindDevice = async (userId: string, userName: string) => {
    const confirmed = await confirm(
      "Unbind Device",
      `Are you sure you want to unbind the device for ${userName}? They will be able to log in from a new device.`
    );
    if (!confirmed) return;

    try {
      await api.unbindUserDevice(userId);
      toast("Device unbound successfully", "success");
      // Update local state if needed
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, deviceId: null } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, deviceId: null });
      }
    } catch (error) {
      toast("Failed to unbind device", "error");
    }
  };

  const handleDownloadReport = () => {
    if (filteredRecords.length === 0) {
      toast("No records to download", "warning");
      return;
    }

    const headers = ["Employee Name", "Employee ID", "Department", "Check-In", "Check-Out", "Status", "Date"];
    const rows = filteredRecords.map(record => [
      `"${record.User?.name || 'Unknown'}"`,
      `"${record.User?.employeeId || 'N/A'}"`,
      `"${record.User?.department || 'N/A'}"`,
      `"${record.checkIn || '--:--'}"`,
      `"${record.checkOut || '--:--'}"`,
      `"${record.status || 'Unknown'}"`,
      `"${record.date || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendance_Report_${dateRange.start}_to_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast("Report downloaded successfully", "success");
  };

  const handleBulkUpdate = async (updates: any, actionName: string) => {
    if (selectedUserIds.length === 0) return;
    
    const confirmed = await confirm(
      `Bulk ${actionName}`, 
      `Are you sure you want to ${actionName.toLowerCase()} ${selectedUserIds.length} users?`
    );
    if (!confirmed) return;

    try {
      await api.bulkUpdateUsers(selectedUserIds, updates);
      toast(`Successfully applied ${actionName.toLowerCase()} to ${selectedUserIds.length} users`, "success");
      setSelectedUserIds([]);
      // Refresh user list
      const updatedUsers = await api.getAdminUsers();
      setUsers(updatedUsers);
    } catch (error) {
      toast(`Failed to perform bulk ${actionName.toLowerCase()}`, "error");
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.User?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.User?.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Managers can't see admin records
    const isVisible = user?.role === 'Admin' || record.User?.role !== 'Admin';
    
    return matchesSearch && isVisible;
  });

  const pendingLeaves = leaveRequests.filter(req => req.status === 'Pending');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Management Console...</p>
      </div>
    );
  }

  const totalEmployees = stats?.totalEmployees || 0;
  const activeToday = stats?.activeToday || 0;
  const lateCount = stats?.late || 0;
  const absentLeave = (stats?.absent || 0) + (stats?.leave || 0);

  const renderLauncher = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid - Moved inside launcher for a cleaner cockpit feel */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Staff', value: totalEmployees, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: activeToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Late', value: lateCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Absent', value: absentLeave, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${stat.bg} dark:bg-opacity-10 flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-0.5">{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Team Operations Group */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Team Operations</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'workforce', label: 'Attendance', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Live status' },
            { id: 'approvals', label: 'Requests', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Leave center', badge: pendingLeaves.length },
            { id: 'employees', label: 'Employees', icon: User, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Member files' },
          ].map(module => (
            <button
              key={module.id}
              onClick={() => {
                setActiveTab(module.id as any);
                setIsLauncherOpen(false);
              }}
              className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] text-left hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-none transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${module.bg} dark:bg-opacity-10 group-hover:scale-110 transition-transform`}>
                <module.icon className={`w-4 h-4 ${module.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{module.label}</p>
                  {module.badge > 0 ? (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  ) : null}
                </div>
                <p className="text-[9px] font-medium text-slate-400">{module.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Organization Group */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Organization</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'branches', label: 'Branches', icon: Building2, role: 'Admin', color: 'text-purple-600', bg: 'bg-purple-50' },
            { id: 'departments', label: 'Departments', icon: Tag, role: 'Admin', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { id: 'announcements', label: 'Newsroom', icon: Megaphone, role: 'Any', color: 'text-blue-600', bg: 'bg-blue-50' },
            { id: 'settings', label: 'Settings', icon: Settings, role: 'Admin', color: 'text-slate-600', bg: 'bg-slate-100' },
          ].filter(m => m.role === 'Any' || user?.role === m.role).map(module => (
            <button
              key={module.id}
              onClick={() => {
                setActiveTab(module.id as any);
                setIsLauncherOpen(false);
              }}
              className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] text-left hover:shadow-lg hover:shadow-slate-500/5 dark:hover:shadow-none transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${module.bg} dark:bg-opacity-10`}>
                <module.icon className={`w-4 h-4 ${module.color}`} />
              </div>
              <p className="text-[11px] font-bold text-slate-900 dark:text-white">{module.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Direct Quick Approval Card if pending */}
      {pendingLeaves.length > 0 && (
        <div className="p-4 bg-indigo-600 rounded-[28px] text-white flex items-center justify-between gap-4 mt-2">
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Pending Action</p>
            <p className="text-xs font-bold leading-tight">{pendingLeaves.length} leave requests need review</p>
          </div>
          <button 
            onClick={() => { setActiveTab('approvals'); setIsLauncherOpen(false); }}
            className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Review
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {isLauncherOpen ? (user?.role === 'Manager' ? 'Operations' : 'Management') : (activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
          </h1>
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {isLauncherOpen ? (user?.role === 'Manager' ? 'Branch Oversight' : 'System Console') : 'Active Module'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isLauncherOpen && (
            <button 
              onClick={() => setIsLauncherOpen(true)}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-bold uppercase tracking-widest text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"
            >
              Back to Hub
            </button>
          )}
          <button 
            onClick={() => {
              setEditingAnnouncement(null);
              setNewAnnouncement({ title: '', content: '', category: 'General' });
              setShowAnnounceModal(true);
            }}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl active:scale-95 transition-all"
          >
            <BellPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Announcement Modal */}
      <AnimatePresence>
        {showAnnounceModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnounceModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-slate-900 z-[101] rounded-t-[40px] shadow-2xl dark:shadow-none p-8 flex flex-col"
            >
              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-8"></div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setShowAnnounceModal(false);
                    setEditingAnnouncement(null);
                  }} 
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="flex flex-col gap-4">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <CustomDropdown
                    options={[
                      { value: 'General', label: 'General', icon: <Megaphone className="w-3 h-3" /> },
                      { value: 'Policy', label: 'Policy', icon: <Shield className="w-3 h-3" /> },
                      { value: 'Event', label: 'Event', icon: <Calendar className="w-3 h-3" /> },
                      { value: 'Urgent', label: 'Urgent', icon: <AlertCircle className="w-3 h-3 text-red-500" /> }
                    ]}
                    value={newAnnouncement.category || 'General'}
                    onChange={cat => setNewAnnouncement(prev => ({ ...prev, category: cat }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Headline</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Office Relocation Update"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                  <textarea 
                    rows={4}
                    placeholder="Provide full details of the announcement..."
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={announceLoading || !newAnnouncement.title || !newAnnouncement.content}
                  className="mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-5 rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-[0.25em] disabled:opacity-50"
                >
                  {announceLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {editingAnnouncement ? 'Save Changes' : 'Publish Now'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Branch Modal */}
      <AnimatePresence>
        {showBranchModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBranchModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 z-[101] rounded-t-[40px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> New Branch
                </h2>
                <button onClick={() => setShowBranchModal(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Manchester Hub"
                    value={newBranch.name}
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Physical Address / Location</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search for exact location..."
                      value={newBranch.location}
                      onChange={e => {
                        setNewBranch({...newBranch, location: e.target.value});
                        searchLocation(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {searchingLocation ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {locationResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden max-h-48 overflow-y-auto z-[200] relative"
                      >
                        {locationResults.map((res, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectLocation(res)}
                            className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700 last:border-0"
                          >
                            <p className="font-bold text-slate-800 dark:text-slate-200">{res.display_name.split(',')[0]}</p>
                            <p className="text-[10px] text-slate-500 truncate">{res.display_name}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isSpecificEnough && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">Location broadness detected</p>
                      <p className="text-[9px] text-amber-600 dark:text-amber-400 leading-tight">The selected location is not specific enough for geofencing. Please select a specific street address or click/tap exactly on the map below.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precision Map Picker</label>
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner z-[50]">
                    <MapContainer 
                      center={mapCenter[0] === 0 ? [51.505, -0.09] : mapCenter} 
                      zoom={mapCenter[0] === 0 ? 2 : 18} 
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      />
                      <MapUpdater center={mapCenter} zoom={mapCenter[0] === 0 ? 2 : 18} />
                      {newBranch.latitude && newBranch.longitude && (
                        <Marker position={[newBranch.latitude, newBranch.longitude]} />
                      )}
                      <LocationPickerMap onSelect={(lat, lon) => {
                        setNewBranch(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lon
                        }));
                        setIsSpecificEnough(true);
                      }} />
                    </MapContainer>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[9px] text-slate-400 italic">Click on map to fine-tune exact entry point coordinates.</p>
                    <div className="flex gap-2 text-[9px] font-bold text-indigo-500">
                      <span>{newBranch.latitude?.toFixed(5) || '0.000'}</span>
                      <span>{newBranch.longitude?.toFixed(5) || '0.000'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Branch Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MAN-01"
                    value={newBranch.code}
                    onChange={e => setNewBranch({...newBranch, code: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={branchLoading}
                  className="w-full bg-indigo-600 text-white font-bold py-5 rounded-3xl active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 mt-4"
                >
                  {branchLoading ? 'Creating...' : 'Register Branch'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Department Modal */}
      <AnimatePresence>
        {showDeptModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeptModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 z-[101] rounded-t-[40px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" /> New Department
                </h2>
                <button onClick={() => setShowDeptModal(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateDept} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sales & Marketing"
                    value={newDept.name}
                    onChange={e => setNewDept({...newDept, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Handles customer relations"
                    value={newDept.description}
                    onChange={e => setNewDept({...newDept, description: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dept Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MKT-01"
                    value={newDept.code}
                    onChange={e => setNewDept({...newDept, code: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={deptLoading}
                  className="w-full bg-indigo-600 text-white font-bold py-5 rounded-3xl active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 mt-4"
                >
                  {deptLoading ? 'Creating...' : 'Create Department'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Edit Modal */}
      <AnimatePresence>
        {showUserModal && editingUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-white dark:bg-slate-900 z-[101] rounded-t-[40px] shadow-2xl dark:shadow-none p-8 overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingUser.isNew ? 'Register Employee' : 'Edit Personnel File'}
                  </h2>
                  <p className="text-[11px] font-medium text-slate-400">
                    {editingUser.isNew ? 'Create a secure account for new staff' : `Managing profile for ${editingUser.name}`}
                  </p>
                </div>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-95 transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6">
                {/* Identity Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Identity & Access</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editingUser.name}
                        onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                      <input 
                        type="email" 
                        required
                        value={editingUser.email}
                        onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="john.doe@company.com"
                      />
                    </div>
                    {!editingUser.isNew && (
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                        <div className="flex gap-2">
                          {['Active', 'Deactivated'].map(status => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setEditingUser({...editingUser, status})}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                editingUser.status === status 
                                  ? (status === 'Active' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-600 border-red-600 text-white')
                                  : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {editingUser.isNew && (
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                        <input 
                          type="text" 
                          required
                          value={editingUser.password}
                          onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                          className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="Welcome123!"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Corporate Details */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Corporate Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                      <input 
                        type="text" 
                        required
                        readOnly
                        value={editingUser.employeeId}
                        className="bg-slate-100 dark:bg-slate-800/80 border-none rounded-2xl p-4 text-sm font-medium focus:ring-0 cursor-not-allowed opacity-70"
                        placeholder="Generating..."
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                      <CustomDropdown
                        options={[
                          { value: 'General', label: 'General', icon: <Tag className="w-3 h-3" /> },
                          ...departments.map(d => ({ value: d.name, label: d.name, icon: <Tag className="w-3 h-3" /> }))
                        ]}
                        value={editingUser.department || ''}
                        onChange={val => {
                          const dept = departments.find(d => d.name === val);
                          setEditingUser({
                            ...editingUser, 
                            department: val,
                            departmentId: dept ? dept.id : null
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                  <CustomDropdown
                    options={[
                      { value: 'Staff', label: 'Staff', icon: <Users className="w-3 h-3" /> },
                      { value: 'Manager', label: 'Manager', icon: <Shield className="w-3 h-3" /> },
                      ...(user?.role === 'Admin' ? [{ value: 'Admin', label: 'Admin', icon: <Crown className="w-3 h-3 text-amber-500" /> }] : [])
                    ]}
                    value={editingUser.role}
                    onChange={newRole => {
                      let newId = editingUser.employeeId;
                      
                      if (editingUser.isNew) {
                        newId = generateEmployeeId(newRole);
                      } else if (newId.startsWith('EMP-') || newId.startsWith('MGR-') || newId.startsWith('ADM-')) {
                        let newPrefix = newId.substring(0, 4);
                        if (newRole === 'Manager') newPrefix = 'MGR-';
                        else if (newRole === 'Staff') newPrefix = 'EMP-';
                        else if (newRole === 'Admin') newPrefix = 'ADM-';

                        if (newPrefix !== newId.substring(0, 4)) {
                          newId = newPrefix + newId.substring(4);
                        }
                      }
                      
                      setEditingUser({...editingUser, role: newRole, employeeId: newId});
                    }}
                  />
                </div>

                 {user?.role === 'Admin' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Branch</label>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'No Branch Assigned', icon: <Building2 className="w-3 h-3" /> },
                        ...branches.map(b => ({ value: b.id, label: b.name, icon: <Building2 className="w-3 h-3" /> }))
                      ]}
                      value={editingUser.branchId || ''}
                      onChange={val => setEditingUser({...editingUser, branchId: val})}
                    />
                  </div>
                )}

                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed flex gap-3 items-start">
                   <Shield className="w-4 h-4 shrink-0 mt-0.5" /> 
                   <p>
                     {user?.role === 'Manager' 
                       ? "As a Manager, you are registering this staff member directly into your assigned branch. You cannot move staff across branches."
                       : "Branch assignment is required for automated attendance logs and area-restricted access permissions."}
                   </p>
                </div>

                <button 
                  type="submit"
                  disabled={userUpdateLoading}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-5 rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-xl dark:shadow-none"
                >
                  {userUpdateLoading ? <Clock className="w-4 h-4 animate-spin mx-auto" /> : (editingUser.isNew ? 'Create New Profile' : 'Update Personnel File')}
                </button>
                <div className="h-4" />
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedUser(null);
              }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-slate-50 dark:bg-slate-950 z-[101] rounded-t-[40px] shadow-2xl dark:shadow-none overflow-y-auto no-scrollbar"
            >
              <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10 px-8 py-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">{selectedUser.name}</h2>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">{selectedUser.role} Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Employee Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm dark:shadow-none">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{selectedUser.employeeId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{selectedUser.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {branches.find(b => b.id === selectedUser.branchId)?.name || 'General HQ'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-sm font-black text-emerald-500 uppercase tracking-tighter">Active Staff</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Contact Details</h3>
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-2 shadow-sm dark:shadow-none space-y-1">
                    {[
                      { icon: Mail, label: 'Email Address', value: selectedUser.email },
                      { icon: MapPin, label: 'Resident Address', value: selectedUser.address || 'Manchester, UK' },
                      { icon: Tag, label: 'Contact Number', value: selectedUser.phone || '+44 (0) 770 000 0000' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Metadata */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Personnel Metadata</h3>
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Emergency Contact</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                            {selectedUser.emergencyContact || 'Not Provided'}
                          </p>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date of Birth</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedUser.birthDate || 'August 15, 1992'}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        <span>Secure Record</span>
                        <div className="flex items-center gap-1 text-emerald-500">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Binding Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">App Security</h3>
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedUser.deviceId ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                          <Navigation className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Device Binding</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedUser.deviceId ? 'Account Bound to Active Device' : 'No Device Bound'}
                          </p>
                        </div>
                      </div>
                      {selectedUser.deviceId && (
                        <button 
                          onClick={() => handleUnbindDevice(selectedUser.id, selectedUser.name)}
                          className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest text-red-500 rounded-xl active:scale-95 transition-all"
                        >
                          Unbind Device
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="h-4" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attachment Viewer */}
      <AnimatePresence>
        {viewingAttachment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingAttachment(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-6 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white dark:bg-slate-900 z-[151] rounded-[40px] shadow-2xl dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {viewingAttachment}
                  </h2>
                </div>
                <button onClick={() => setViewingAttachment(null)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                <div className="w-full h-full max-h-[500px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden p-2 border-2 border-dashed border-slate-200 dark:border-slate-700">
                  {viewingAttachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={viewingAttachment} 
                      alt="Attachment Preview"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg dark:shadow-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : viewingAttachment.match(/\.pdf$/i) ? (
                    <iframe 
                      src={`${viewingAttachment}#toolbar=0`} 
                      className="w-full h-[400px] rounded-xl border-none"
                      title="PDF Preview"
                    />
                  ) : viewingAttachment.startsWith('http') ? (
                     <div className="flex flex-col items-center p-8">
                      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 animate-bounce">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 tracking-widest uppercase">File Link Detected</p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-6 italic leading-relaxed mb-4">
                        This file cannot be previewed directly. You can open it in a new tab.
                      </p>
                      <button 
                        onClick={() => window.open(viewingAttachment, '_blank')}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg dark:shadow-none"
                      >
                        Open In New Tab
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-8">
                      <Eye className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">Document Preview</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600 px-6 italic leading-relaxed">
                        This is a secure preview. In a production environment, the actual {viewingAttachment.split('.').pop()?.toUpperCase()} file would be rendered here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                 <button 
                  onClick={() => {
                    if (viewingAttachment.startsWith('http')) {
                      window.open(viewingAttachment, '_blank');
                    } else {
                      toast("File download initiated", "info");
                    }
                    setViewingAttachment(null);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-xl dark:shadow-none"
                 >
                   {viewingAttachment.startsWith('http') ? 'View Full File' : 'Download File'}
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLauncherOpen ? (
          <motion.div
            key="launcher"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
          >
            {renderLauncher()}
          </motion.div>
        ) : (
          <motion.div
            key="module"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            className="space-y-6 animate-in fade-in duration-500"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsLauncherOpen(true)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 group transition-all"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management Dashboard</p>
                  </div>
                </div>

                {['workforce', 'departments', 'branches'].includes(activeTab) && (
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 px-3 border-r border-slate-50 dark:border-slate-800 group">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                        <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                        className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 p-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-3 group">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-all" />
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                        className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {activeTab === 'workforce' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Real-time Attendance</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCompareDepts(!compareDepts)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  compareDepts 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Compare Depts
              </button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDownloadReport}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                title="Download CSV Report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {compareDepts ? (
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 mb-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Select departments to compare</p>
                {departmentStats.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      if (selectedDeptsForComp.includes(dept.id)) {
                        setSelectedDeptsForComp(prev => prev.filter(id => id !== dept.id));
                      } else {
                        setSelectedDeptsForComp(prev => [...prev, dept.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                      selectedDeptsForComp.includes(dept.id)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
                {selectedDeptsForComp.length === 0 && (
                  <p className="text-[10px] text-amber-500 font-medium italic">Showing all departments. Select specifically to filter comparison.</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                      <th className="p-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Staff</th>
                      <th className="p-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Late</th>
                      <th className="p-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Absent</th>
                      <th className="p-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Leave</th>
                      <th className="p-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Presence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {departmentStats
                      .filter(d => selectedDeptsForComp.length === 0 || selectedDeptsForComp.includes(d.id))
                      .map((dept, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">{dept.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{dept.code || 'DEPT'}</p>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{dept.totalEmployees}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] font-black text-amber-600">{(dept as any).lateCount || 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] font-black text-red-600">{(dept as any).absentCount || 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] font-black text-indigo-600">{(dept as any).leaveCount || 0}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${dept.averageAttendance}%` }}></div>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-600">{dept.averageAttendance}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or employee ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="p-2 flex flex-col gap-1 max-h-[500px] overflow-y-auto no-scrollbar">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                      <div className="relative">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden text-slate-400">
                          {record.User?.avatar ? (
                            <img src={record.User.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                          record.status === 'present' ? 'bg-emerald-500' : record.status === 'late' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{record.User?.name}</p>
                          <span className="text-[10px] font-bold text-slate-400">{record.checkIn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-500">{record.User?.department}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{record.User?.employeeId}</span>
                        </div>
                        {record.checkOut !== '--:--' && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">OUT: {record.checkOut}</span>
                            {record.checkOutStatus && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                record.checkOutStatus === 'Overtime' ? 'bg-indigo-100 text-indigo-600' : 
                                record.checkOutStatus === 'Early Leave' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>{record.checkOutStatus}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <MoreVertical className="w-4 h-4 text-slate-300 lg:opacity-0 lg:group-hover:opacity-100 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Search className="w-10 h-10 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest italic">No matches found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'approvals' ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Leave Requests</h2>
            <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
              {pendingLeaves.length} Waiting
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((req, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-all hover:border-indigo-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden">
                        {req.User?.avatar ? (
                          <img src={req.User.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{req.User?.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 truncate">{req.User?.department} • {req.User?.employeeId}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                      {req.type}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 mb-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-slate-900 dark:text-slate-200">{req.date}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Reason</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-2">
                        "{req.reason}"
                      </p>
                    </div>
                    {req.attachment && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <FileText className="w-3 h-3 text-indigo-500" />
                           <span className="text-[9px] font-bold text-slate-500 truncate max-w-[120px]">{req.attachment}</span>
                        </div>
                        <button 
                          onClick={() => setViewingAttachment(req.attachment)}
                          className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all"
                        >
                          View File
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLeaveAction(req.id, 'Approved')}
                      disabled={updatingId === req.id}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-emerald-100 dark:shadow-none"
                    >
                      {updatingId === req.id ? 'Updating...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handleLeaveAction(req.id, 'Rejected')}
                      disabled={updatingId === req.id}
                      className="flex-1 py-3 bg-white border border-slate-100 dark:border-slate-800 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Queue is empty!</p>
                  <p className="text-[10px] font-medium text-slate-400 italic">No leave requests pending your approval.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'employees' ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Employee List</h2>
              <button 
                onClick={() => {
                  const allVisibleIds = users
                    .filter(emp => user?.role === 'Admin' || emp.role !== 'Admin')
                    .map(emp => emp.id);
                  if (selectedUserIds.length === allVisibleIds.length && allVisibleIds.length > 0) {
                    setSelectedUserIds([]);
                  } else {
                    setSelectedUserIds(allVisibleIds);
                  }
                }}
                className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800/50 py-1.5 px-2.5 rounded-lg border border-slate-100 dark:border-slate-800"
              >
                {selectedUserIds.length === users.filter(emp => user?.role === 'Admin' || emp.role !== 'Admin').length && selectedUserIds.length > 0 ? (
                  <>
                    <CheckSquare className="w-3 h-3 text-indigo-600" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3 h-3" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setEditingUser({ 
                    isNew: true, 
                    name: '', 
                    email: '', 
                    employeeId: generateEmployeeId('Staff'), 
                    department: 'General', 
                    role: 'Staff', 
                    branchId: user?.branchId || '',
                    password: ''
                  });
                  setShowUserModal(true);
                }}
                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 p-2 rounded-xl transition-all"
              >
                <UserPlus className="w-4 h-4" /> Add Employee
              </button>
              <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                {users.length} Total
              </span>
            </div>
          </div>

          <AnimatePresence>
            {selectedUserIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-indigo-600 p-4 rounded-[28px] text-white flex items-center justify-between shadow-2xl shadow-indigo-500/20 dark:shadow-none sticky top-4 z-30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                    {selectedUserIds.length}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Selected</p>
                </div>
                <div className="flex items-center gap-2">
                  <CustomDropdown
                    variant="indigo"
                    placeholder="Choose Bulk Action"
                    options={[
                      { value: 'activate', label: 'Activate All', icon: <CheckCircle2 className="w-3 h-3" />, group: 'Account Status' },
                      { value: 'deactivate', label: 'Deactivate All', icon: <UserX className="w-3 h-3" />, group: 'Account Status', className: 'text-red-500' },
                      ...departments.map(dept => ({
                        value: `dept:${dept.id}`,
                        label: `Assign to ${dept.name}`,
                        icon: <Tag className="w-3 h-3" />,
                        group: 'Assign Department'
                      }))
                    ]}
                    value=""
                    onChange={(val) => {
                      if (val === 'deactivate') {
                        handleBulkUpdate({ status: 'Deactivated' }, 'Deactivate');
                      } else if (val === 'activate') {
                        handleBulkUpdate({ status: 'Active' }, 'Activate');
                      } else if (val.startsWith('dept:')) {
                        const deptId = val.split(':')[1];
                        const dept = departments.find(d => d.id === deptId);
                        handleBulkUpdate({ departmentId: deptId, department: dept?.name }, `Assign to ${dept?.name}`);
                      }
                    }}
                    className="w-48"
                  />
                  <button 
                    onClick={() => setSelectedUserIds([])}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            {users
              .filter(emp => user?.role === 'Admin' || emp.role !== 'Admin')
              .map((emp, i) => (
                <div 
                  key={i} 
                  className={`bg-white dark:bg-slate-900 p-4 rounded-3xl border ${selectedUserIds.includes(emp.id) ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-slate-100 dark:border-slate-800 shadow-sm'} dark:shadow-none flex items-center gap-4 transition-all`}
                >
                  <button 
                    onClick={() => toggleUserSelection(emp.id)}
                    className={`p-1 rounded-lg transition-colors ${selectedUserIds.includes(emp.id) ? 'text-indigo-600' : 'text-slate-300'}`}
                  >
                    {selectedUserIds.includes(emp.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden text-slate-400 relative">
                    {emp.avatar ? <img src={emp.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User className="w-6 h-6" />}
                    {emp.status === 'Deactivated' && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate pr-1">{emp.name}</p>
                      {emp.status === 'Deactivated' && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-500 text-[8px] font-bold uppercase rounded">Deactivated</span>
                      )}
                      {emp.deviceId && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 text-[8px] font-bold uppercase rounded flex items-center gap-1">
                          <Navigation className="w-2 h-2" />
                          Bound
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{emp.role} • {emp.department}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{emp.email}</p>
                  </div>
                <div className="flex gap-1">
                   <button 
                    onClick={() => {
                      setSelectedUser(emp);
                      setShowDetailsModal(true);
                    }}
                    className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                    title="View Full Profile"
                   >
                     <Eye className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => {
                      setEditingUser({ ...emp, isNew: false });
                      setShowUserModal(true);
                    }}
                    className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                   >
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => handleDeleteUser(emp)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                   >
                     <UserX className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'branches' && user?.role === 'Admin' ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Branch Statistics</h2>
            <button 
              onClick={() => setShowBranchModal(true)}
              className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" /> + New Branch
            </button>
          </div>

          {/* Branch Stats Grid */}
          <div className="grid gap-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-4 min-w-[600px]">
              {branchStats.map((bStats, i) => (
                <div key={i} className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none min-w-[280px]">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">{bStats.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {bStats.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-bold">
                      {bStats.averageAttendance}% Att.
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <p className="text-[14px] font-black text-slate-900 dark:text-white leading-none mb-1">{bStats.totalEmployees}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total Staff</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl">
                      <p className="text-[14px] font-black text-amber-600 dark:text-amber-400 leading-none mb-1">{bStats.onLeaveToday}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">On Leave</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl">
                      <p className="text-[14px] font-black text-purple-600 dark:text-purple-400 leading-none mb-1">{bStats.averageLeaveBalance}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Avg Leave</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center px-2 mt-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Enterprise Branches</h2>
          </div>

          <div className="grid gap-4">
            {branches.map((branch, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{branch.name}</h3>
                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{branch.location || 'Remote'}</span> • {branch.code || 'NO-CODE'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Staff</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{branch.Users?.length || 0}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {branches.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                <Building2 className="w-12 h-12" />
                <p className="text-[10px] font-bold uppercase tracking-widest italic">No branches configured yet</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'departments' && user?.role === 'Admin' ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Department Performance</h2>
            <button 
              onClick={() => setShowDeptModal(true)}
              className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1"
            >
              <Tag className="w-3.5 h-3.5" /> + New Department
            </button>
          </div>

          {/* Department Stats Grid */}
          <div className="grid gap-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-4 min-w-[600px]">
              {departmentStats.map((dStats, i) => (
                <div key={i} className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none min-w-[280px]">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{dStats.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">DEPT-{dStats.id.toString().slice(0, 4)}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-bold">
                      {dStats.averageAttendance}% Present
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <p className="text-[14px] font-black text-slate-900 dark:text-white leading-none mb-1">{dStats.totalEmployees}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total Staff</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl">
                      <p className="text-[14px] font-black text-amber-600 dark:text-amber-400 leading-none mb-1">{dStats.lateCount}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Late</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                      <p className="text-[14px] font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">{dStats.onLeaveToday}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">On Leave</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center px-2 mt-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">All Departments</h2>
          </div>

          <div className="grid gap-4">
            {departments.map((dept, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{dept.name}</h3>
                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 truncate">
                       <span className="truncate">{dept.description || 'No description'}</span> • {dept.code || 'DEPT'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Employees</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{dept.Users?.length || 0}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteDept(dept.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'announcements' ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Published Announcements</h2>
            <button 
              onClick={() => {
                setEditingAnnouncement(null);
                setNewAnnouncement({ title: '', content: '', category: 'General' });
                setShowAnnounceModal(true);
              }}
              className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest"
            >
              + Create New
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {announcements.map((ann, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider ${
                        ann.category === 'Urgent' ? 'bg-red-100 text-red-600' : 
                        ann.category === 'Event' ? 'bg-indigo-100 text-indigo-600' :
                        ann.category === 'Policy' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ann.category || 'General'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{ann.date}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{ann.title}</h3>
                  </div>
                  <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleEditAnnouncement(ann)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {ann.content}
                </p>
              </div>
            ))}
            
            {announcements.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                <Megaphone className="w-12 h-12" />
                <p className="text-[10px] font-bold uppercase tracking-widest italic">No announcements published yet</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              Attendance Policies
            </h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 focus-within:text-indigo-600 transition-colors">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="time" 
                      value={settings?.workStartTime || ''}
                      onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 focus-within:text-indigo-600 transition-colors">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="time" 
                      value={settings?.workEndTime || ''}
                      onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Grace Period (Minutes)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings?.graceMinutes || 0}
                    onChange={(e) => setSettings({ ...settings, graceMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
                </div>
                <p className="text-[10px] text-slate-400 italic ml-1">Staff can check-in up to this many minutes after start time without being marked "Late".</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Overtime Threshold</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings?.overtimeStartMinutes || 0}
                    onChange={(e) => setSettings({ ...settings, overtimeStartMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
                </div>
                <p className="text-[10px] text-slate-400 italic ml-1">Additional time after "Work End Time" before overtime is calculated.</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Days</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const isSelected = settings?.workingDays?.split(',').includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const currentDays = settings?.workingDays?.split(',') || [];
                          let newDays;
                          if (currentDays.includes(day)) {
                            newDays = currentDays.filter(d => d !== day);
                          } else {
                            newDays = [...currentDays, day];
                          }
                          setSettings({ ...settings, workingDays: newDays.join(',') });
                        }}
                        className={`flex items-center gap-2 p-3 rounded-2xl border transition-all text-left ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' 
                            : 'bg-white border-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-[11px] font-bold">{day}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 italic ml-1">Select the days that are considered official working days for the organization.</p>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Automations & AI</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Auto-Check-Out', desc: 'Automatically check out staff at end of work day', active: false },
                    { label: 'Smart Scheduling', desc: 'AI-suggested shift rotations based on demand', active: false },
                    { label: 'Alert Manager', desc: 'Notify managers when team absence exceeds 20%', active: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 group">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-[9px] font-medium text-slate-400">{item.desc}</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${item.active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'left-6' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Security & Privacy</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'biometricEnabled', label: 'Biometric Access', desc: 'Enable facial recognition for check-ins' },
                    { key: 'geofencingEnabled', label: 'Location Guard', desc: `Geofence check-ins within ${settings?.geofencingRadius || 500}m of branch` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 group">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-[9px] font-medium text-slate-400">{item.desc}</p>
                      </div>
                      <div 
                        onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${settings?.[item.key] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings?.[item.key] ? 'left-6' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                  {settings?.geofencingEnabled && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                      <label className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Geofence Radius (meters)</label>
                      <div className="flex items-center gap-4 mt-1">
                        <input 
                          type="range" 
                          min="10" 
                          max="2000" 
                          step="10"
                          value={settings?.geofencingRadius || 500}
                          onChange={(e) => setSettings({ ...settings, geofencingRadius: parseInt(e.target.value) })}
                          className="flex-1 h-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-[10px] font-black text-indigo-600 min-w-[40px]">{settings?.geofencingRadius || 500}m</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Regional & Display</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                     <div>
                       <p className="text-xs font-bold text-slate-800 dark:text-slate-200">System Language</p>
                       <p className="text-[9px] font-medium text-slate-400">Apply to all UI translations</p>
                     </div>
                     <span className="text-[10px] font-black text-indigo-600">ENGLISH (UK)</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                     <div>
                       <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Timezone Persistence</p>
                       <p className="text-[9px] font-medium text-slate-400">Lock logs to branch local time</p>
                     </div>
                     <span className="text-[10px] font-black text-indigo-600">AUTO-DETECT</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={settingsLoading}
                className="w-full bg-indigo-600 text-white font-bold py-5 rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-[0.25em] shadow-lg shadow-indigo-500/20 dark:shadow-none disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Update Policies'}
              </button>
            </form>
          </div>

          <div className="p-5 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-20 h-20" />
             </div>
             <h4 className="text-xs font-bold mb-2 uppercase tracking-widest text-indigo-400">Security Note</h4>
             <p className="text-[11px] text-slate-300 leading-relaxed">
               Changes to attendance policies only reflect on new check-in/out actions and do not affect historical records unless manually re-synced.
             </p>
          </div>
        </div>
      )}

      {/* Quick Action Link to Approvals if not active */}
      {activeTab === 'workforce' && pendingLeaves.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl text-white shadow-lg dark:shadow-none relative overflow-hidden mt-2">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-20 h-20" />
          </div>
          <h3 className="text-sm font-bold mb-1">Action Required</h3>
          <p className="text-[11px] text-indigo-100 font-medium mb-4">You have {pendingLeaves.length} leave requests waiting for your review.</p>
          <button 
            onClick={() => setActiveTab('approvals')}
            className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Review Requests
          </button>
        </div>
      )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
