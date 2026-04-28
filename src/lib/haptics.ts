
export const haptics = {
  vibrate: (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      const preferences = JSON.parse(localStorage.getItem('app_preferences') || '{}');
      if (preferences.haptic !== false) {
        window.navigator.vibrate(pattern);
      }
    }
  },
  success: () => haptics.vibrate([10, 30, 20]),
  error: () => haptics.vibrate([50, 100, 50]),
  impact: () => haptics.vibrate(10),
  notification: () => haptics.vibrate([20, 40, 20]),
};
