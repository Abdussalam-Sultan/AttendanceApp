import express from 'express';
import { authenticate, isAdmin, isManager } from '../middleware/auth.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import SystemSettings from '../models/SystemSettings.js';
import Notification from '../models/Notification.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

const router = express.Router();

// Helper to parse time string "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Robust date formatter to ensure client/server match
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper for 12h format to 24h conversion and then to minutes
const ampmToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (hours === 12) hours = 0;
  if (modifier === 'PM') hours += 12;
  return hours * 60 + minutes;
};

router.get('/settings', authenticate, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.send(settings);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/settings', authenticate, isAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create(req.body);
    } else {
      await settings.update(req.body);
    }

    // Broadcast notification about policy change
    await Notification.create({
      userId: null, // Broadcast
      title: 'Policy Update',
      content: 'Attendance policies (working hours or grace periods) have been updated by admin.',
      type: 'POLICY_CHANGE'
    });

    res.send(settings);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/admin/all-stats', authenticate, isManager, async (req, res) => {
  try {
    const userWhereClause = {};
    if (req.user.role === 'Manager') {
      userWhereClause.role = { [Op.ne]: 'Admin' };
      if (req.user.branchId) {
        userWhereClause.branchId = req.user.branchId;
      }
    }

    const [counts, totalEmployees] = await Promise.all([
      Attendance.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'count']
        ],
        include: [{ 
          model: User, 
          attributes: [],
          where: req.user.role === 'Manager' ? { branchId: req.user.branchId } : {} 
        }],
        group: ['status'],
        raw: true
      }),
      User.count({ where: userWhereClause })
    ]);

    const stats = {
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      totalEmployees,
      activeToday: 0
    };

    counts.forEach(c => {
      const status = c.status.toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status] = parseInt(c.count);
      }
    });

    stats.activeToday = stats.present + stats.late;
    
    res.send(stats);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/admin/all-records', authenticate, isManager, async (req, res) => {
  try {
    const userWhere = {};
    if (req.user.role === 'Manager') {
      userWhere.role = { [Op.ne]: 'Admin' };
      if (req.user.branchId) {
        userWhere.branchId = req.user.branchId;
      }
    }

    const records = await Attendance.findAll({
      include: [{ 
        model: User, 
        attributes: ['name', 'employeeId', 'department', 'branchId'],
        where: userWhere,
        include: [
          { model: Branch, attributes: ['name'] },
          { model: Department, attributes: ['name'] }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: 200 // Limit to last 200 records to ensure speed
    });
    res.send(records);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/branch-stats', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.branchId) {
      return res.status(404).send({ error: 'User branch not found' });
    }

    const branch = await Branch.findByPk(user.branchId);
    
    const [counts, totalEmployees] = await Promise.all([
      Attendance.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'count']
        ],
        include: [{ 
          model: User, 
          attributes: [],
          where: { branchId: user.branchId } 
        }],
        group: ['status'],
        raw: true
      }),
      User.count({ where: { branchId: user.branchId } })
    ]);

    const stats = {
      branchName: branch ? branch.name : 'Unknown',
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      totalEmployees,
      activeToday: 0,
      averageAttendance: 0,
      onLeaveToday: 0,
      leaveBalanceAverage: 18 // Mock or calculate if leave records exist
    };

    counts.forEach(c => {
      const status = c.status.toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status] = parseInt(c.count);
      }
    });

    stats.activeToday = stats.present + stats.late;
    stats.averageAttendance = totalEmployees > 0 ? Math.round((stats.activeToday / totalEmployees) * 100) : 0;
    
    // For "on leave today", we should check today's date
    const today = formatDate(new Date());
    stats.onLeaveToday = await Attendance.count({
      where: { date: today, status: 'leave' },
      include: [{ model: User, where: { branchId: user.branchId } }]
    });

    res.send(stats);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const counts = await Attendance.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { userId: req.user.id },
      group: ['status'],
      raw: true
    });

    const stats = {
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
      totalWorkingDays: 24 
    };

    counts.forEach(c => {
      const status = c.status.toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status] = parseInt(c.count);
      }
    });
    
    res.send(stats);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/records', authenticate, async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit user history to last 50 records
    });
    res.send(records);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Helper to calculate distance in meters between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

router.post('/check-in', authenticate, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const now = new Date();
    const today = formatDate(now);

    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});

    // Geofencing Check
    if (settings.geofencingEnabled) {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Branch }]
      });
      
      if (user && user.Branch && user.Branch.latitude && user.Branch.longitude) {
        if (!latitude || !longitude) {
          return res.status(400).send({ 
            error: 'Location access is required for attendance tracking at this branch.' 
          });
        }

        const distance = calculateDistance(
          latitude, 
          longitude, 
          user.Branch.latitude, 
          user.Branch.longitude
        );

        if (distance > settings.geofencingRadius) {
          return res.status(403).send({ 
            error: `Location out of range. You must be within ${settings.geofencingRadius}m of the ${user.Branch.name}. Current distance: ${Math.round(distance)}m.`
          });
        }
      }
    }

    // Check if user already has a record for today
    const existingRecord = await Attendance.findOne({
      where: { userId: req.user.id, date: today }
    });

    if (existingRecord) {
      return res.status(400).send({ 
        error: 'Attendance already recorded for today. You cannot clock in twice.' 
      });
    }

    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const time24Str = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const arrivalMinutes = timeToMinutes(time24Str);
    const startMinutes = timeToMinutes(settings.workStartTime);
    
    let status = 'present';
    let lateMinutes = 0;

    if (arrivalMinutes > (startMinutes + settings.graceMinutes)) {
      status = 'late';
      lateMinutes = arrivalMinutes - startMinutes;
    }

    const record = await Attendance.create({
      userId: req.user.id,
      date: today,
      day: now.toLocaleDateString([], { weekday: 'long' }),
      status: status,
      checkIn: timeStr,
      checkOut: '--:--',
      lateMinutes: lateMinutes
    });

    // Create notification for user
    await Notification.create({
      userId: req.user.id,
      title: status === 'late' ? 'Late Check-in' : 'Checked In',
      content: status === 'late' 
        ? `You checked in late at ${timeStr}. Delay: ${lateMinutes} mins.` 
        : `Successfully checked in at ${timeStr}. Have a great day!`,
      type: 'ATTENDANCE_STATUS'
    });
    
    res.status(201).send(record);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/check-out', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const time24Str = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = formatDate(now);

    const attendance = await Attendance.findOne({
      where: { userId: req.user.id, checkOut: '--:--' },
      order: [['createdAt', 'DESC']]
    });

    if (!attendance) {
      return res.status(404).send({ error: 'No active check-in found for today' });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});

    const departureMinutes = timeToMinutes(time24Str);
    const endMinutes = timeToMinutes(settings.workEndTime);
    const checkInMinutes = ampmToMinutes(attendance.checkIn);
    
    let checkOutStatus = 'On Time';
    if (departureMinutes < endMinutes) {
      checkOutStatus = 'Early Leave';
    } else if (departureMinutes > (endMinutes + settings.overtimeStartMinutes)) {
      checkOutStatus = 'Overtime';
    }

    attendance.checkOut = timeStr;
    attendance.checkOutStatus = checkOutStatus;
    attendance.workedMinutes = departureMinutes - checkInMinutes;
    await attendance.save();

    // Create notification for user
    await Notification.create({
      userId: req.user.id,
      title: 'Checked Out',
      content: `Successfully checked out at ${timeStr}. Status: ${checkOutStatus}. Total worked: ${Math.floor(attendance.workedMinutes / 60)}h ${attendance.workedMinutes % 60}m.`,
      type: 'ATTENDANCE_STATUS'
    });

    res.send(attendance);
  } catch (error) {
    res.status(400).send(error);
  }
});

export default router;
