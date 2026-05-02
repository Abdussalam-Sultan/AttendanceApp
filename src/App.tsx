/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { AttendanceView } from './components/AttendanceView';
import { LeaveView } from './components/LeaveView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { OnboardingView } from './components/OnboardingView';
import { LoginView } from './components/LoginView';
import { NotificationOverlay } from './components/NotificationOverlay';

import { AnimatePresence, motion } from 'motion/react';
import { api } from './services/api';
import { storage } from './services/storage';
import { notificationService } from './services/notifications';
import { WifiOff, RefreshCcw } from 'lucide-react';

type TabType = 'home' | 'attendance' | 'leave' | 'profile' | 'admin';

import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [attendanceTab, setAttendanceTab] = useState<'Logs' | 'Calendar' | 'Analytics'>('Logs');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!storage.get(storage.KEYS.AUTH_TOKEN));
  const [user, setUser] = useState<any>(storage.get(storage.KEYS.USER));
  const [onboardingComplete, setOnboardingComplete] = useState(!!storage.get(storage.KEYS.ONBOARDING_COMPLETE));
  const [theme, setTheme] = useState<'light' | 'dark'>(storage.get(storage.KEYS.THEME) || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  const isCheckedIn = todayRecord && (todayRecord.checkOut === '--:--' || !todayRecord.checkOut);
  const isDayCompleted = todayRecord && (todayRecord.checkOut !== '--:--' && !!todayRecord.checkOut);

  const refreshAttendance = async () => {
    try {
      const records = await api.getAttendanceRecords();
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
      const y = now.getFullYear();
      const todayStr = `${d} ${m} ${y}`;
      const record = Array.isArray(records) ? records.find((r: any) => r.date === todayStr) : null;
      setTodayRecord(record || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGlobalCheckInOut = async () => {
    if (isDayCompleted) return;
    setIsAttendanceLoading(true);
    try {
      if (isCheckedIn) {
        await api.checkOut();
      } else {
        let lat, lng;
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (e) {}
        await api.checkIn(lat, lng);
      }
      await refreshAttendance();
      refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => {
    if (!n.isRead) {
      if (user?.notifSettings) {
        if (n.type === 'ATTENDANCE_STATUS' && !user.notifSettings.attendance) return false;
        if (n.type === 'LEAVE_STATUS' && !user.notifSettings.leave) return false;
        if ((n.type === 'ANNOUNCEMENT' || n.type === 'POLICY_CHANGE') && !user.notifSettings.announcements) return false;
      }
      return true;
    }
    return false;
  }).length;

  const refreshNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.save(storage.KEYS.THEME, theme);
  }, [theme]);

  // Background Logic for Geofence and Auto-Checkout
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const interval = setInterval(async () => {
      // 1. Fetch current background settings
      const settings = user.appSettings || {};
      
      // 2. Handle Auto-Geofence / Auto-Checkout
      if (settings.geofence || settings.autoCheckout) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          
          // Simplified distance check (real implementation would use distance formula)
          // For demo, assume fixed radius
          const branch = user.branch || { latitude: 0, longitude: 0 };
          const dist = Math.sqrt(Math.pow(latitude - branch.latitude, 2) + Math.pow(longitude - branch.longitude, 2));
          
          const isInside = dist < 0.01; // Roughly within a few hundred meters

          if (settings.geofence && isInside) {
             // Logic for auto check-in if within geofence (omitted for safety, usually needs manual confirmation)
          }

          if (settings.autoCheckout && !isInside) {
            // Check if currently checked in
            const records = await api.getAttendanceRecords();
            const todayRecord = records[0];
            if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
              await api.checkOut();
              refreshNotifications();
            }
          }
        });
      }
    }, 300000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (user?.notifSettings) {
      notificationService.setSettings(user.notifSettings);
    }
  }, [user]);

  useEffect(() => {
    // Initial Auth Check
    const verifyUser = async () => {
      if (isLoggedIn) {
        try {
          const userData = await api.getUser();
          setUser(userData);
        } catch (err) {
          console.error("Session verification failed", err);
          handleLogout();
        }
      }
    };
    verifyUser();

    // Request notification permission
    notificationService.requestPermission();
    refreshNotifications();
    refreshAttendance();

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await api.syncQueue();
      setIsSyncing(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check if online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnboardingComplete = () => {
    storage.save(storage.KEYS.ONBOARDING_COMPLETE, true);
    setOnboardingComplete(true);
  };

  const handleLoginSuccess = (user: any) => {
    setUser(user);
    setIsLoggedIn(true);
    setActiveTab('home'); // Redirect to home on login
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const renderView = () => {
    if (!onboardingComplete) {
      return <OnboardingView onComplete={handleOnboardingComplete} />;
    }

    if (!isLoggedIn) {
      return <LoginView onSuccess={handleLoginSuccess} />;
    }

    switch (activeTab) {
      case 'home': return (
        <HomeView 
          onNavigate={(tab: TabType, subTab?: any) => {
            setActiveTab(tab);
            if (tab === 'attendance' && subTab) {
              setAttendanceTab(subTab);
            } else if (tab === 'attendance') {
              setAttendanceTab('Logs');
            }
          }} 
          onLogout={handleLogout} 
          showNotifications={showNotifications} 
          setShowNotifications={setShowNotifications} 
          unreadCount={unreadCount}
          todayRecord={todayRecord}
          onRefreshData={refreshAttendance}
          handleGlobalAction={handleGlobalCheckInOut}
          isActionLoading={isAttendanceLoading}
        />
      );
      case 'attendance': return <AttendanceView initialTab={attendanceTab} />;
      case 'leave': return <LeaveView />;
      case 'profile': return (
        <ProfileView 
          user={user}
          onUserUpdate={(userData: any) => setUser(userData)}
          onLogout={handleLogout} 
          theme={theme} 
          setTheme={setTheme} 
          showNotifications={showNotifications} 
          setShowNotifications={setShowNotifications} 
          unreadCount={unreadCount}
        />
      );
      case 'admin': return <AdminDashboard />;
      default: return (
        <HomeView 
          onNavigate={(tab: TabType, subTab?: any) => {
            setActiveTab(tab);
            if (tab === 'attendance' && subTab) {
              setAttendanceTab(subTab);
            } else if (tab === 'attendance') {
              setAttendanceTab('Logs');
            }
          }} 
          onLogout={handleLogout}
          showNotifications={showNotifications} 
          setShowNotifications={setShowNotifications} 
          unreadCount={unreadCount}
          todayRecord={todayRecord}
          onRefreshData={refreshAttendance}
          handleGlobalAction={handleGlobalCheckInOut}
          isActionLoading={isAttendanceLoading}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center selection:bg-blue-100 transition-colors duration-300 overflow-x-hidden">
      {/* Mobile-like frame wrapper */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen relative overflow-hidden flex flex-col transition-colors duration-300">
        
        {/* Content Area */}
        <AnimatePresence>
          {(!isOnline || isSyncing) && onboardingComplete && isLoggedIn && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-6 py-2 flex items-center justify-center gap-2 text-white text-[10px] font-bold uppercase tracking-wider relative z-30 shadow-md ${
                isSyncing ? 'bg-indigo-500' : 'bg-red-500'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCcw className="w-3 h-3 animate-spin" />
                  <span>Syncing data...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline Mode - Data will sync later</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main id="main-content" className="flex-1 px-5 pt-2 pb-32 overflow-y-auto no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={onboardingComplete ? (isLoggedIn ? activeTab : 'auth') : 'onboarding'}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              className="h-full flex flex-col"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        <NotificationOverlay 
          show={showNotifications} 
          userSettings={user?.notifSettings}
          onClose={() => {
            setShowNotifications(false);
            refreshNotifications();
          }} 
        />

        {onboardingComplete && isLoggedIn && (
          <BottomNav 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={(tab: TabType) => {
              setActiveTab(tab);
              if (tab === 'attendance') {
                setAttendanceTab('Logs');
              }
            }} 
            isCheckedIn={isCheckedIn}
            isDayCompleted={isDayCompleted}
            onGlobalAction={handleGlobalCheckInOut}
            isLoading={isAttendanceLoading}
          />
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
