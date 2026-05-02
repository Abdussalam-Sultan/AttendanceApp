export const notificationService = {
  settings: {
    attendance: true,
    leave: true,
    announcements: true,
    marketing: false
  },

  setSettings(newSettings: any) {
    if (newSettings) {
      this.settings = { ...this.settings, ...newSettings };
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  show(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico', // Fallback icon
        ...options
      });
    }
  },

  notifyLeaveUpdate(status: string) {
    if (!this.settings.leave) return;
    this.show('Leave Request Updated', {
      body: `Your leave request has been ${status.toLowerCase()}.`,
      tag: 'leave-update'
    });
  },

  notifyAttendance(type: 'Check-In' | 'Check-Out', time: string) {
    if (!this.settings.attendance) return;
    this.show(`${type} Successful`, {
      body: `Recorded at ${time}. Have a great day!`,
      tag: 'attendance'
    });
  },

  notifyAnnouncement(title: string) {
    if (!this.settings.announcements) return;
    this.show('New Announcement', {
      body: title,
      tag: 'announcement'
    });
  },

  notifySyncComplete() {
    this.show('Sync Complete', {
      body: 'Your offline actions have been synced successfully.',
      tag: 'sync'
    });
  }
};
