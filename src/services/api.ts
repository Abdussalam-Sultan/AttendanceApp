import { storage } from './storage';
import { notificationService } from './notifications';

const isOnline = () => navigator.onLine;

const getHeaders = (isMultipart = false) => {
  const token = storage.get(storage.KEYS.AUTH_TOKEN);
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const api = {
  async getUser() {
    try {
      const res = await fetch('/api/user/me', {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      storage.save(storage.KEYS.USER, data);
      return data;
    } catch (error) {
      if (!isOnline()) return storage.get(storage.KEYS.USER);
      throw error;
    }
  },

  async getAttendanceStats() {
    try {
      const res = await fetch('/api/attendance/stats', {
        headers: getHeaders()
      });
      const data = await res.json();
      storage.save(storage.KEYS.STATS, data);
      return data;
    } catch (error) {
      if (!isOnline()) return storage.get(storage.KEYS.STATS);
      throw error;
    }
  },

  async getAttendanceRecords() {
    try {
      const res = await fetch('/api/attendance/records', {
        headers: getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      storage.save(storage.KEYS.RECORDS, data);
      return data;
    } catch (error) {
      return storage.get(storage.KEYS.RECORDS) || [];
    }
  },

  async checkIn(latitude?: number, longitude?: number) {
    if (!isOnline()) {
      storage.addToQueue('checkIn');
      const records = storage.get(storage.KEYS.RECORDS) || [];
      const now = new Date();
      const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const d = String(now.getDate()).padStart(2, '0');
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
      const y = now.getFullYear();
      const todayStr = `${d} ${m} ${y}`;

      const newRecord = {
        id: Date.now().toString(),
        checkIn: nowTime,
        date: todayStr,
        status: 'On Time',
        isOfflineSync: true
      };
      storage.save(storage.KEYS.RECORDS, [newRecord, ...records]);
      notificationService.notifyAttendance('Check-In', nowTime);
      return newRecord;
    }

    const res = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await res.json();
    notificationService.notifyAttendance('Check-In', data.checkIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return data;
  },

  async checkOut() {
    if (!isOnline()) {
      storage.addToQueue('checkOut' as any);
      notificationService.notifyAttendance('Check-Out', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return { success: true, offline: true };
    }
    const res = await fetch('/api/attendance/check-out', {
      method: 'POST',
      headers: getHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await res.json();
    notificationService.notifyAttendance('Check-Out', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return data;
  },

  async getLeaveHistory() {
    try {
      const res = await fetch('/api/leave/history', {
        headers: getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      
      const cached = storage.get(storage.KEYS.LEAVE_HISTORY);
      if (cached) {
        data.forEach((item: any) => {
          const old = cached.find((c: any) => c.id === item.id);
          if (old && old.status !== item.status) {
            notificationService.notifyLeaveUpdate(item.status);
          }
        });
      }
      
      storage.save(storage.KEYS.LEAVE_HISTORY, data);
      return data;
    } catch (error) {
      return storage.get(storage.KEYS.LEAVE_HISTORY) || [];
    }
  },

  async submitLeaveRequest(data: any, attachmentFile?: File) {
    if (!isOnline()) {
      storage.addToQueue('submitLeave', data);
      const history = storage.get(storage.KEYS.LEAVE_HISTORY) || [];
      const newItem = {
        id: Date.now(),
        ...data,
        status: 'Pending',
        isOfflineSync: true
      };
      storage.save(storage.KEYS.LEAVE_HISTORY, [newItem, ...history]);
      notificationService.show('Leave Request Saved', { body: 'Your request will be synced when online.' });
      return newItem;
    }

    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    const res = await fetch('/api/leave/request', {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    const result = await res.json();
    notificationService.show('Leave Request Sent', { body: 'Your request has been submitted for approval.' });
    return result;
  },

  async getAnnouncements() {
    try {
      const res = await fetch('/api/announcements', {
        headers: getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      
      const cached = storage.get(storage.KEYS.ANNOUNCEMENTS);
      if (cached && data.length > cached.length) {
        notificationService.notifyAnnouncement(data[0].title);
      }
      
      storage.save(storage.KEYS.ANNOUNCEMENTS, data);
      return data;
    } catch (error) {
      return storage.get(storage.KEYS.ANNOUNCEMENTS) || [];
    }
  },

  async getAdminStats() {
    const res = await fetch('/api/attendance/admin/all-stats', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return await res.json();
  },

  async getAttendanceSettings() {
    const res = await fetch('/api/attendance/settings', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  async updateAttendanceSettings(data: any) {
    const res = await fetch('/api/attendance/settings', {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },

  async getAllAttendanceRecords() {
    const res = await fetch('/api/attendance/admin/all-records', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch all records');
    return await res.json();
  },
  
  async getAdminLeaveRequests() {
    const res = await fetch('/api/leave/admin/all', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch leave requests');
    return await res.json();
  },

  async createAnnouncement(data: { title: string; content: string; category?: string }) {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create announcement');
    return await res.json();
  },

  async updateAnnouncement(id: string | number, data: { title: string; content: string; category?: string }) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update announcement');
    return await res.json();
  },

  async deleteAnnouncement(id: string | number) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete announcement');
    return await res.json();
  },

  async getAdminUsers() {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  async createAdminUser(data: any) {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create user');
    return await res.json();
  },

  async updateAdminUser(id: string, data: any) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update user');
    return await res.json();
  },
  
  async bulkUpdateUsers(userIds: string[], updates: any) {
    const res = await fetch('/api/admin/users/bulk-update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userIds, updates })
    });
    if (!res.ok) throw new Error('Bulk update failed');
    return await res.json();
  },

  async getBranches() {
    const res = await fetch('/api/admin/branches', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch branches');
    return await res.json();
  },

  async createBranch(data: any) {
    const res = await fetch('/api/admin/branches', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create branch');
    return await res.json();
  },

  async deleteBranch(id: string) {
    const res = await fetch(`/api/admin/branches/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete branch');
    return await res.json();
  },

  async getDepartments() {
    const res = await fetch('/api/admin/departments', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch departments');
    return await res.json();
  },

  async createDepartment(data: any) {
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create department');
    return await res.json();
  },

  async deleteDepartment(id: string) {
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete department');
    return await res.json();
  },

  async getAdminDepartmentStats(startDate?: string, endDate?: string) {
    let url = '/api/admin/department-stats';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await fetch(url, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch admin department stats');
    return await res.json();
  },

  async deleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return await res.json();
  },

  async updateLeaveStatus(id: string | number, status: 'Approved' | 'Rejected') {
    const res = await fetch(`/api/leave/approve/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update leave status');
    return await res.json();
  },

  async getBranchStats() {
    const res = await fetch('/api/attendance/branch-stats', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch branch stats');
    return await res.json();
  },

  async getAdminBranchStats(startDate?: string, endDate?: string) {
    let url = '/api/admin/branch-stats';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await fetch(url, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch admin branch stats');
    return await res.json();
  },

  saveAuthData(user: any, token: string) {
    storage.save(storage.KEYS.USER, user);
    storage.save(storage.KEYS.AUTH_TOKEN, token);
  },

  async login(credentials: any) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!res.ok) {
      throw new Error('Invalid credentials');
    }

    const { user, token } = await res.json();
    storage.save(storage.KEYS.USER, user);
    storage.save(storage.KEYS.AUTH_TOKEN, token);
    return user;
  },

  async register(data: any) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      throw new Error('Registration failed');
    }

    const { user, token } = await res.json();
    storage.save(storage.KEYS.USER, user);
    storage.save(storage.KEYS.AUTH_TOKEN, token);
    return user;
  },

  async updateProfile(data: any, avatarFile?: File) {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: getHeaders(true),
      body: formData
    });

    if (!res.ok) throw new Error('Update failed');
    
    const updatedUser = await res.json();
    storage.save(storage.KEYS.USER, updatedUser);
    return updatedUser;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update password');
    }
    
    return await res.json();
  },

  async getLoginHistory() {
    const res = await fetch('/api/user/login-history', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch login history');
    return await res.json();
  },

  async deleteLoginHistory(id: string | number) {
    const res = await fetch(`/api/user/login-history/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete login record');
    return await res.json();
  },

  async logout() {
    storage.save(storage.KEYS.USER, null);
    storage.save(storage.KEYS.AUTH_TOKEN, null);
    return { success: true };
  },

  async getNotifications() {
    const res = await fetch('/api/notifications', {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async markNotificationRead(id: number | string) {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return await res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: getHeaders()
    });
    return await res.json();
  },

  async syncQueue() {
    if (!isOnline()) return;
    const queue = storage.getQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        const headers = getHeaders();
        if (item.action === 'checkIn') {
          await fetch('/api/attendance/check-in', { method: 'POST', headers });
        } else if (item.action === 'submitLeave') {
          await fetch('/api/leave/request', {
            method: 'POST',
            headers,
            body: JSON.stringify(item.data)
          });
        }
        storage.removeFromQueue(item.id);
      } catch (e) {
        console.error("Failed to sync item", item, e);
      }
    }
    notificationService.notifySyncComplete();
  }
};

