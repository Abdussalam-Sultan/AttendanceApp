import Attendance from '../models/Attendance.js';
import SystemSettings from '../models/SystemSettings.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { sendEmail, emailTemplates } from './emailService.js';
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
    const companies = await Company.findAll({ where: { status: 'Active' } });
    const today = new Date();
    const todayStr = formatDate(today);
    const currentDay = today.toLocaleDateString([], { weekday: 'long' });

    for (const company of companies) {
      const settings = await SystemSettings.findOne({ where: { companyId: company.id } });
      if (!settings) continue;

      // Only run on working days
      const workingDays = settings.workingDays.split(',').map(d => d.trim());
      if (!workingDays.includes(currentDay)) continue;

      const currentTimeMinutes = today.getHours() * 60 + today.getMinutes();
      const endTimeMinutes = timeToMinutes(settings.workEndTime);

      // Run only after business hours
      if (currentTimeMinutes < endTimeMinutes) continue;

      // Get all active employees who are not Admins for THIS company
      const employees = await User.findAll({
        where: {
          companyId: company.id,
          status: 'Active',
          role: { [Op.ne]: 'Admin' }
        }
      });

      for (const employee of employees) {
        const record = await Attendance.findOne({
          where: { userId: employee.id, date: todayStr, companyId: company.id }
        });

        if (!record) {
          // Create absence record
          await Attendance.create({
            userId: employee.id,
            companyId: company.id,
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
            companyId: company.id,
            title: 'Daily Attendance Alert',
            content: `You were marked as absent for today (${todayStr}) as we noticed no sign-in activity.`,
            type: 'ATTENDANCE_STATUS'
          });

          // Send email alert
          if (employee.email) {
            const template = emailTemplates.absenceAlert(employee, todayStr);
            sendEmail({
              to: employee.email,
              ...template
            }).catch(err => console.error('Error sending absence alert email:', err));
          }
        }
      }
    }
    console.log(`[Absence-Tracker] Check completed for all companies on ${todayStr}.`);
  } catch (error) {
    console.error('[Absence-Tracker] Error:', error);
  }
};

export const runAutoCheckout = async () => {
  try {
    const companies = await Company.findAll({ where: { status: 'Active' } });
    const today = new Date();
    const todayStr = formatDate(today);

    for (const company of companies) {
      const settings = await SystemSettings.findOne({ where: { companyId: company.id } });
      if (!settings || !settings.autoCheckoutEnabled) continue;

      const currentTimeMinutes = today.getHours() * 60 + today.getMinutes();
      const endTimeMinutes = timeToMinutes(settings.workEndTime);

      // Run only after business hours
      if (currentTimeMinutes < endTimeMinutes) continue;

      // Find sessions that are still open for today for THIS company
      const openSessions = await Attendance.findAll({
        where: {
          companyId: company.id,
          date: todayStr,
          checkOut: '--:--'
        }
      });

      if (openSessions.length > 0) {
        const checkOutTime12h = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ...settings.workEndTime.split(':').map(Number))
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        for (const session of openSessions) {
          session.checkOut = checkOutTime12h;
          session.checkOutStatus = 'Auto Checkout';
          
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
            companyId: company.id,
            title: 'System Auto-Checkout',
            content: `You were automatically checked out at ${checkOutTime12h} (end of working hours).`,
            type: 'ATTENDANCE_STATUS'
          });

          // Send email notification
          const sessionUser = await User.findByPk(session.userId);
          if (sessionUser && sessionUser.email) {
            sendEmail({
              to: sessionUser.email,
              subject: 'System Auto-Checkout Notification',
              html: `
                <h3>Auto-Checkout Alert</h3>
                <p>You were automatically checked out today at <strong>${checkOutTime12h}</strong> as your shift ended and no manual sign-out was recorded.</p>
                <p>Status: Auto Checkout</p>
                <p>Thank you.</p>
              `
            }).catch(err => console.error('Error sending auto-checkout email:', err));
          }
        }
      }
    }
    console.log(`[Auto-Checkout] Check completed for all companies on ${todayStr}.`);
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
