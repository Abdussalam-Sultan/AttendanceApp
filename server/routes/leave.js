import express from 'express';
import { authenticate, isAdmin, isManager } from '../middleware/auth.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Department from '../models/Department.js';
import { attachmentUpload } from '../config/cloudinary.js';

const router = express.Router();

router.patch('/approve/:id', authenticate, isManager, async (req, res) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id, {
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
    await leave.save();

    // Create notification for user
    await Notification.create({
      userId: leave.userId,
      title: `Leave ${req.body.status}`,
      content: `Your leave request for ${leave.date} (${leave.type}) has been ${req.body.status.toLowerCase()}.`,
      type: 'LEAVE_STATUS'
    });

    res.send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/admin/all', authenticate, isManager, async (req, res) => {
  try {
    const userWhere = {};
    if (req.user.role === 'Manager') {
      userWhere.role = 'Staff'; // Managers only see Staff leave requests
      if (req.user.branchId) {
        userWhere.branchId = req.user.branchId;
      }
    }

    const history = await LeaveRequest.findAll({
      include: [{ 
        model: User, 
        attributes: ['name', 'employeeId', 'department', 'branchId'],
        where: userWhere,
        include: [
          { model: Department, attributes: ['name'] }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.send(history);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await LeaveRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.send(history);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/request', authenticate, attachmentUpload.single('attachment'), async (req, res) => {
  try {
    const leaveData = { ...req.body };
    
    if (req.file) {
      leaveData.attachment = req.file.path; // Cloudinary URL
    }

    const leave = await LeaveRequest.create({
      ...leaveData,
      userId: req.user.id,
      date: `${leaveData.startDate} - ${leaveData.endDate}`,
      status: 'Pending'
    });
    res.status(201).send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

export default router;
