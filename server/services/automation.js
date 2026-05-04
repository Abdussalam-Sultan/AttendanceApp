import Attendance from '../models/Attendance.js';
import SystemSettings from '../models/SystemSettings.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const runAbsenceCheck = async () => {
  try {
    const settings = await SystemSettings.findOne();
    if (!settings) return;

    const now = new Date();
    const currentDay = now.toLocaleDateString([], { weekday: 'long' });
    
    // Only run on working days
    const workingDays = settings.workingDays.split(',').map(d => d.trim());
    if (!workingDays.includes(currentDay)) return;

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const endTimeMinutes = timeToMinutes(settings.workEndTime);

    // Run only after business hours
    if (currentTimeMinutes < endTimeMinutes) return;

    const todayStr = formatDate(now);
    
    // Get all active employees who are not Admins
    const employees = await User.findAll({
      where: {
        status: 'Active',
        role: { [Op.ne]: 'Admin' }
      }
    });

    console.log(`[Absence-Tracker] Running check for ${todayStr}. Total active employees: ${employees.length}`);

    for (const employee of employees) {
      const record = await Attendance.findOne({
        where: { userId: employee.id, date: todayStr }
      });

      if (!record) {
        // Create absence record
        await Attendance.create({
          userId: employee.id,
          date: todayStr,
          day: currentDay,
          status: 'absent',
          checkIn: '--:--',
          checkOut: '--:--',
          branchName: employee.location || 'Main Office',
          departmentName: employee.department || 'General'
        });

        // Notify employee
        await Notification.create({
          userId: employee.id,
          title: 'Daily Attendance Alert',
          content: `You were marked as absent for today (${todayStr}) as we noticed no sign-in activity.`,
          type: 'ATTENDANCE_STATUS'
        });
      }
    }
    
    console.log(`[Absence-Tracker] Absence check completed for ${todayStr}.`);
  } catch (error) {
    console.error('[Absence-Tracker] Error:', error);
  }
};

export const runAutoCheckout = async () => {
  try {
    const settings = await SystemSettings.findOne();
    if (!settings || !settings.autoCheckoutEnabled) return;

    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const endTimeMinutes = timeToMinutes(settings.workEndTime);

    // If it's early in the day, don't do anything
    // Usually auto-checkout should run after work end time
    if (currentTimeMinutes < endTimeMinutes) return;

    const todayStr = formatDate(now);

    // Find sessions that are still open for today
    const openSessions = await Attendance.findAll({
      where: {
        date: todayStr,
        checkOut: '--:--'
      }
    });

    if (openSessions.length > 0) {
      console.log(`[Auto-Checkout] Found ${openSessions.length} open sessions. Processing...`);
      
      const checkOutTime12h = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...settings.workEndTime.split(':').map(Number))
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      for (const session of openSessions) {
        session.checkOut = checkOutTime12h;
        session.checkOutStatus = 'Auto Checkout';
        // Calculate worked minutes based on check-in
        const [time, modifier] = session.checkIn.split(' ');
        let [inHours, inMinutes] = time.split(':').map(Number);
        if (inHours === 12) inHours = 0;
        if (modifier === 'PM') inHours += 12;
        const checkInMinutes = inHours * 60 + inMinutes;
        
        session.workedMinutes = Math.max(0, endTimeMinutes - checkInMinutes);
        await session.save();

        // Notify user
        await Notification.create({
          userId: session.userId,
          title: 'System Auto-Checkout',
          content: `You were automatically checked out at ${checkOutTime12h} (end of working hours).`,
          type: 'ATTENDANCE_STATUS'
        });
      }
      
      console.log(`[Auto-Checkout] Successfully processed ${openSessions.length} sessions.`);
    }
  } catch (error) {
    console.error('[Auto-Checkout] Error:', error);
  }
};

export const startAutomations = () => {
    // Run every 5 minutes
    console.log('[Automations] Starting background tasks...');
    setInterval(runAutoCheckout, 5 * 60 * 1000);
    setInterval(runAbsenceCheck, 15 * 60 * 1000); // Check absences every 15 minutes
    
    // Also run once on startup with staggered delays
    setTimeout(runAutoCheckout, 10000);
    setTimeout(runAbsenceCheck, 20000);
};
