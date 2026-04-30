import { storage } from '../services/storage';

const DEVICE_ID_KEY = 'doorlog_device_identity';

export const deviceService = {
  getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a simple UUID-like string
      deviceId = 'dl-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  },

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString()
    };
  },

  isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || false;
  }
};
