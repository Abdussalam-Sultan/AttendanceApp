
const STORAGE_KEYS = {
  USER: 'doorlog_user',
  STATS: 'doorlog_stats',
  RECORDS: 'doorlog_records',
  LEAVE_HISTORY: 'doorlog_leave_history',
  ANNOUNCEMENTS: 'doorlog_announcements',
  SYNC_QUEUE: 'doorlog_sync_queue',
  ONBOARDING_COMPLETE: 'doorlog_onboarding_complete',
  AUTH_TOKEN: 'doorlog_auth_token',
  THEME: 'doorlog_theme',
  PREFERENCES: 'doorlog_preferences'
};

export const storage = {
  save(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  get(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  addToQueue(action: 'checkIn' | 'submitLeave', data?: any) {
    const queue = this.get(STORAGE_KEYS.SYNC_QUEUE) || [];
    queue.push({ action, data, id: Date.now() });
    this.save(STORAGE_KEYS.SYNC_QUEUE, queue);
  },

  getQueue() {
    return this.get(STORAGE_KEYS.SYNC_QUEUE) || [];
  },

  clearQueue() {
    this.save(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  removeFromQueue(id: number) {
    const queue = this.getQueue();
    const newQueue = queue.filter((item: any) => item.id !== id);
    this.save(STORAGE_KEYS.SYNC_QUEUE, newQueue);
  },

  KEYS: STORAGE_KEYS
};
