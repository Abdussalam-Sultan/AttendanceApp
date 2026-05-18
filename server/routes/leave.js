import express from 'express';
import { authenticate, isAdmin, isManager } from '../middleware/auth.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Department from '../models/Department.js';
import SystemSettings from '../models/SystemSettings.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { attachmentUpload } from '../config/cloudinary.js';
import { Op } from 'sequelize';

const router = express.Router();

router.patch('/approve/:id', authenticate, isManager, async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      where: { id: req.params.id, companyId: req.companyId },
      include: [{ model: User, attributes: ['branchId', 'role'] }]
    });
    
    if (!leave) return res.status(404).send({ error: 'Leave request not found' });
    
    // Safety check for Managers
    if (req.user.role === 'Manager') {
      // Manager cannot approve their own leave
      if (leave.userId === req.user.id) {
        return res.status(403).send({ error: 'You cannot approve your own leave request.' });
      }
      
      // Managers cannot approve higher or equal level roles (Admin/Manager)
      if (leave.User.role === 'Admin' || leave.User.role === 'Manager') {
        return res.status(403).send({ error: 'Only administrators can approve leave requests for management roles.' });
      }

      // Branch isolation
      if (leave.User.branchId !== req.user.branchId) {
        return res.status(403).send({ error: 'Access denied. You can only approve leave for employees in your branch.' });
      }
    }
    
    leave.status = req.body.status; // 'Approved' or 'Rejected'
    leave.archived = true; // Auto-archive on status change
    await leave.save();

    // Create notification for user
    await Notification.create({
      userId: leave.userId,
      title: `Leave ${req.body.status}`,
      content: `Your leave request for ${leave.date} (${leave.type}) has been ${req.body.status.toLowerCase()}.`,
      type: 'LEAVE_STATUS'
    });

    // Send email to user
    const recipientUser = await User.findByPk(leave.userId);
    if (recipientUser && recipientUser.email) {
      const template = emailTemplates.leaveStatusUpdate(leave, req.body.status);
      sendEmail({
        to: recipientUser.email,
        ...template
      }).catch(err => console.error('Error sending leave status email:', err));
    }

    res.send({ success: true, leave });
  } catch (error) {
    console.error('Leave Approval Error:', error);
    res.status(400).send({ error: error.message || 'Failed to update leave status' });
  }
});

router.patch('/bulk-update', authenticate, isManager, async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ error: 'No IDs provided' });
    }
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).send({ error: 'Invalid status' });
    }

    const leaves = await LeaveRequest.findAll({
      where: { id: ids, companyId: req.companyId },
      include: [{ model: User, attributes: ['branchId', 'role'] }]
    });

    const updatedLeaves = [];
    const errors = [];

    for (const leave of leaves) {
      if (leave.status !== 'Pending') continue;

      // Safety check for Managers
      if (req.user.role === 'Manager') {
        if (leave.userId === req.user.id) {
          errors.push(`Leave ${leave.id}: Access denied.`);
          continue;
        }
        if (leave.User.role === 'Admin' || leave.User.role === 'Manager') {
           errors.push(`Leave ${leave.id}: Management level restricted.`);
           continue;
        }
        if (leave.User.branchId !== req.user.branchId) {
           errors.push(`Leave ${leave.id}: Branch mismatch.`);
           continue;
        }
      }

      leave.status = status;
      leave.archived = true;
      await leave.save();
      updatedLeaves.push(leave);

      await Notification.create({
        userId: leave.userId,
        title: `Leave ${status}`,
        content: `Your leave request for ${leave.date} (${leave.type}) has been ${status.toLowerCase()}.`,
        type: 'LEAVE_STATUS'
      });

      // Send email to user
      const recipientUser = await User.findByPk(leave.userId);
      if (recipientUser && recipientUser.email) {
        const template = emailTemplates.leaveStatusUpdate(leave, status);
        sendEmail({
          to: recipientUser.email,
          ...template
        }).catch(err => console.error('Error sending bulk leave status email:', err));
      }
    }

    res.send({ 
      success: true, 
      count: updatedLeaves.length, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error('Bulk Approval Error:', error);
    res.status(500).send({ error: 'Failed to update leave requests' });
  }
});

router.get('/admin/all', authenticate, isManager, async (req, res) => {
  try {
    const userWhere = { companyId: req.companyId };
    if (req.user.role === 'Manager') {
      userWhere.role = 'Staff'; // Managers only see Staff leave requests
      if (req.user.branchId) {
        userWhere.branchId = req.user.branchId;
      }
    }

    const { includeArchived } = req.query;
    const leaveWhere = { companyId: req.companyId };
    if (includeArchived !== 'true') {
      leaveWhere.archived = false;
    }

    const history = await LeaveRequest.findAll({
      where: leaveWhere,
      include: [{ 
        model: User, 
        attributes: ['name', 'employeeId', 'department', 'branchId', 'avatar', 'role'],
        where: userWhere,
        include: [
          { model: Department, attributes: ['name'] }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.send(history);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).send({ error: 'Failed to fetch leave requests' });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await LeaveRequest.findAll({
      where: { userId: req.user.id, companyId: req.companyId },
      order: [['createdAt', 'DESC']]
    });
    res.send(history);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch history' });
  }
});

router.get('/pending-count', authenticate, isManager, async (req, res) => {
  try {
    const userWhere = { companyId: req.companyId };
    if (req.user.role === 'Manager') {
      userWhere.branchId = req.user.branchId;
    }

    const count = await LeaveRequest.count({
      where: { status: 'Pending', archived: false, companyId: req.companyId },
      include: [{ 
        model: User, 
        where: userWhere
      }]
    });
    res.send({ count });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch pending count' });
  }
});

router.patch('/archive/:id', authenticate, isManager, async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      where: { id: req.params.id, companyId: req.companyId }
    });
    if (!leave) return res.status(404).send({ error: 'Leave request not found' });
    
    // Safety check for archiving: must be the owner OR an admin/manager (who already passed middleware)
    // Managers can archive staff leaves in their branch
    if (req.user.role === 'Manager' && leave.userId !== req.user.id) {
       const user = await User.findOne({ where: { id: leave.userId, companyId: req.companyId } });
       if (!user || user.branchId !== req.user.branchId) {
         return res.status(403).send({ error: 'Access denied.' });
       }
    } else if (req.user.role === 'Staff' && leave.userId !== req.user.id) {
      return res.status(403).send({ error: 'Access denied.' });
    }

    leave.archived = req.body.archived !== undefined ? req.body.archived : true;
    await leave.save();
    res.send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/request', authenticate, attachmentUpload.single('attachment'), async (req, res) => {
  try {
    const leaveData = { ...req.body };
    const user = await User.findOne({ where: { id: req.user.id, companyId: req.companyId } });
    if (!user) return res.status(404).send({ error: 'User not found' });

    let settings = await SystemSettings.findOne({ where: { companyId: req.companyId } });
    if (!settings) settings = await SystemSettings.create({ companyId: req.companyId });

    // Parse duration from string like "5 Days"
    const requestedDays = parseInt(leaveData.duration) || 1;
    const leaveType = leaveData.type;

    // Get limit based on type
    let limit = 0;
    if (leaveType === 'Annual Leave') limit = settings.annualLeaveLimit;
    else if (leaveType === 'Sick Leave') limit = settings.sickLeaveLimit;
    else if (leaveType === 'Casual Leave') limit = settings.casualLeaveLimit;
    else if (leaveType === 'Unpaid Leave') limit = settings.unpaidLeaveLimit;
    else limit = 999; // Default for others like Maternity if no limit set

    // Count used days for this type in current year
    const currentYear = new Date().getFullYear().toString();
    const existingApprovedLeaves = await LeaveRequest.findAll({
      where: {
        userId: req.user.id,
        type: leaveType,
        status: 'Approved',
        // Simple year check on the date string or createdAt
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1),
          [Op.lt]: new Date(new Date().getFullYear() + 1, 0, 1)
        }
      }
    });

    const usedDays = existingApprovedLeaves.reduce((sum, leave) => {
      return sum + (parseInt(leave.duration) || 0);
    }, 0);

    const leave = await LeaveRequest.create({
      ...leaveData,
      userId: req.user.id,
      companyId: req.companyId,
      date: `${leaveData.startDate} - ${leaveData.endDate}`,
      status: 'Pending'
    });

    // Notify Admins/Managers via Email
    try {
      // Find managers for the same branch or Admins for the company
      const recipients = await User.findAll({
        where: {
          companyId: req.companyId,
          role: { [Op.in]: ['Admin', 'Manager'] },
          status: 'Active'
        }
      });

      const filteredRecipients = recipients.filter(r => {
        if (r.role === 'Admin') return true;
        if (r.role === 'Manager' && r.branchId === user.branchId) return true;
        return false;
      });

      const template = emailTemplates.leaveRequest(user, leave);
      for (const recipient of filteredRecipients) {
        if (recipient.email) {
          sendEmail({
            to: recipient.email,
            ...template
          }).catch(err => console.error('Error sending leave request alert:', err));
        }
      }
    } catch (emailErr) {
      console.error('Failed to process email notifications for leave request:', emailErr);
    }

    res.status(201).send(leave);
  } catch (error) {
    console.error('Leave Request Error:', error);
    res.status(400).send({ error: error.message || 'Failed to submit leave request' });
  }
});

export default router;
