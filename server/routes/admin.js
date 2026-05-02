import express from 'express';
import { authenticate, isAdmin, isManager } from '../middleware/auth.js';
import { User, Branch, Attendance, LeaveRequest, Department } from '../models/associations.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get branch stats
router.get('/branch-stats', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filters
    const attendanceDateFilter = {};
    if (startDate && endDate) {
      attendanceDateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const branches = await Branch.findAll({
      include: [{ 
        model: User,
        attributes: ['id', 'leaveBalance']
      }]
    });

    const allUserIds = branches.flatMap(b => b.Users.map(u => u.id));
    
    const [allAttendance, allApprovedLeaves] = await Promise.all([
      Attendance.findAll({
        where: { 
          userId: { [Op.in]: allUserIds },
          ...attendanceDateFilter
        },
        attributes: ['userId', 'status', 'createdAt']
      }),
      LeaveRequest.findAll({
        where: { 
          userId: { [Op.in]: allUserIds },
          status: 'Approved',
          [Op.or]: [
            { startDate: { [Op.between]: [new Date(startDate || '2000-01-01'), new Date(endDate || '2100-01-01')] } },
            { endDate: { [Op.between]: [new Date(startDate || '2000-01-01'), new Date(endDate || '2100-01-01')] } }
          ]
        }
      })
    ]);

    const attendanceMap = new Map();
    allAttendance.forEach(a => {
      if (!attendanceMap.has(a.userId)) attendanceMap.set(a.userId, []);
      attendanceMap.get(a.userId).push(a);
    });

    const leaveMap = new Map();
    allApprovedLeaves.forEach(l => {
      if (!leaveMap.has(l.userId)) leaveMap.set(l.userId, []);
      leaveMap.get(l.userId).push(l);
    });

    const stats = branches.map(branch => {
      const users = branch.Users || [];
      const userIds = users.map(u => u.id);

      let branchPresentCount = 0;
      let branchTotalAttendance = 0;
      let branchOnLeaveToday = 0;
      let branchTotalLeaveBalance = 0;

      userIds.forEach(uid => {
        const userAttendance = attendanceMap.get(uid) || [];
        branchTotalAttendance += userAttendance.length;
        branchPresentCount += userAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;

        const userLeaves = leaveMap.get(uid) || [];
        // simplified logic for display
        branchOnLeaveToday += userLeaves.length;

        const userObj = users.find(u => u.id === uid);
        branchTotalLeaveBalance += (userObj?.leaveBalance || 0);
      });

      const averageAttendance = branchTotalAttendance > 0 ? (branchPresentCount / branchTotalAttendance) * 100 : 0;
      const averageLeaveBalance = users.length > 0 ? branchTotalLeaveBalance / users.length : 0;

      return {
        id: branch.id,
        name: branch.name,
        totalEmployees: users.length,
        averageAttendance: Math.round(averageAttendance),
        onLeaveToday: branchOnLeaveToday,
        averageLeaveBalance: Math.round(averageLeaveBalance)
      };
    });

    res.send(stats);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Get department stats
router.get('/department-stats', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filters
    const attendanceDateFilter = {};
    const leaveDateFilter = {};
    if (startDate && endDate) {
      attendanceDateFilter.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      // For leave, we'll check if the leave was active during this period (simplified for this context)
    }

    const departments = await Department.findAll({
      include: [{ 
        model: User,
        attributes: ['id', 'leaveBalance', 'name', 'role']
      }]
    });

    const allUserIds = departments.flatMap(d => d.Users.map(u => u.id));
    
    const [allAttendance, allApprovedLeaves] = await Promise.all([
      Attendance.findAll({
        where: { 
          userId: { [Op.in]: allUserIds },
          ...attendanceDateFilter
        },
        attributes: ['userId', 'status', 'createdAt']
      }),
      LeaveRequest.findAll({
        where: { 
          userId: { [Op.in]: allUserIds },
          status: 'Approved',
          [Op.or]: [
            { startDate: { [Op.between]: [new Date(startDate || '2000-01-01'), new Date(endDate || '2100-01-01')] } },
            { endDate: { [Op.between]: [new Date(startDate || '2000-01-01'), new Date(endDate || '2100-01-01')] } }
          ]
        }
      })
    ]);

    const attendanceMap = new Map();
    allAttendance.forEach(a => {
      if (!attendanceMap.has(a.userId)) attendanceMap.set(a.userId, []);
      attendanceMap.get(a.userId).push(a);
    });

    const leaveMap = new Map();
    allApprovedLeaves.forEach(l => {
      if (!leaveMap.has(l.userId)) leaveMap.set(l.userId, []);
      leaveMap.get(l.userId).push(l);
    });

    const stats = departments.map(dept => {
      const users = dept.Users || [];
      const userIds = users.map(u => u.id);

      let presentCount = 0;
      let lateCount = 0;
      let totalAttendance = 0;
      let onLeaveToday = 0;
      let totalLeaveBalance = 0;

      userIds.forEach(uid => {
        const userAttendance = attendanceMap.get(uid) || [];
        totalAttendance += userAttendance.length;
        const present = userAttendance.filter(a => a.status === 'Present' || a.status === 'Late');
        presentCount += present.length;
        lateCount += userAttendance.filter(a => a.status === 'Late').length;

        const userLeaves = leaveMap.get(uid) || [];
        // simplified logic for display
        onLeaveToday += userLeaves.length;

        const userObj = users.find(u => u.id === uid);
        totalLeaveBalance += (userObj?.leaveBalance || 0);
      });

      const averageAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
      const averageLeaveBalance = users.length > 0 ? totalLeaveBalance / users.length : 0;

      return {
        id: dept.id,
        name: dept.name,
        totalEmployees: users.length,
        averageAttendance: Math.round(averageAttendance),
        lateCount: lateCount,
        onLeaveToday: onLeaveToday,
        averageLeaveBalance: Math.round(averageLeaveBalance)
      };
    });

    res.send(stats);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Get all branches
router.get('/branches', authenticate, isAdmin, async (req, res) => {
  try {
    const branches = await Branch.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'role'] }]
    });
    res.send(branches);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create a branch
router.post('/branches', authenticate, isAdmin, async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).send(branch);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a branch
router.delete('/branches/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).send({ error: 'Branch not found' });
    await branch.destroy();
    res.send({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all departments
router.get('/departments', authenticate, async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'role'] }]
    });
    res.send(departments);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create a department
router.post('/departments', authenticate, isAdmin, async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).send(department);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a department
router.delete('/departments/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).send({ error: 'Department not found' });
    await department.destroy();
    res.send({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all users
router.get('/users', authenticate, (req, res, next) => {
  if (req.user.role === 'Admin' || req.user.role === 'Manager') {
    next();
  } else {
    res.status(403).send({ error: 'Access denied' });
  }
}, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'Manager') {
      where.role = { [Op.ne]: 'Admin' };
      if (req.user.branchId) {
        where.branchId = req.user.branchId;
      }
    }

    const users = await User.findAll({
      where,
      include: [
        { model: Branch, attributes: ['id', 'name'] },
        { model: Department, attributes: ['id', 'name'] }
      ],
      attributes: { exclude: ['password'] }
    });
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create employee - Admin or Manager (of branch)
router.post('/users', authenticate, isManager, async (req, res) => {
  try {
    const { email, password, name, role, branchId, department, departmentId, employeeId } = req.body;
    
    // Check if user has permission to create in this branch
    if (req.user.role === 'Manager' && branchId !== req.user.branchId) {
      return res.status(403).send({ error: 'Managers can only create employees for their own branch.' });
    }

    const user = await User.create({
      email,
      password: password || 'Welcome123!', // Default password
      name,
      role: role || 'Employee',
      branchId: branchId || (req.user.role === 'Manager' ? req.user.branchId : null),
      department: department || 'General',
      departmentId,
      employeeId
    });

    const userResponse = user.toJSON();
    delete userResponse.password;
    res.status(201).send(userResponse);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update user details (role, branch, details) - ADMIN or MANAGER
router.patch('/users/:id', authenticate, isManager, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send({ error: 'User not found' });

    // Prevent Managers from interacting with Admins
    if (req.user.role === 'Manager' && user.role === 'Admin') {
      return res.status(403).send({ error: 'Managers cannot modify administrator accounts.' });
    }

    // Last admin protection
    if (req.body.role && user.role === 'Admin' && req.body.role !== 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).send({ error: 'Cannot demote the last administrator. There must be at least one Admin.' });
      }
    }

    // Permissions check
    if (req.user.role === 'Manager') {
      if (user.branchId !== req.user.branchId) {
        return res.status(403).send({ error: 'Managers can only edit employees from their branch.' });
      }
      // Managers cannot change branch or elevate to Admin
      if (req.body.branchId && req.body.branchId !== req.user.branchId) {
        return res.status(403).send({ error: 'Managers cannot change employee branch assignment.' });
      }
      if (req.body.role === 'Admin') {
        return res.status(403).send({ error: 'Managers cannot elevate users to Admin role.' });
      }
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['role', 'branchId', 'department', 'departmentId', 'name', 'employeeId', 'email', 'phone', 'address', 'status'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    // Role specific logic
    const role = req.body.role || user.role;
    const branchId = req.body.hasOwnProperty('branchId') ? req.body.branchId : user.branchId;

    if (role !== 'Admin' && !branchId) {
      return res.status(400).send({ error: 'Branch assignment is mandatory for Staff and Managers.' });
    }

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;
    res.send(userResponse);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete user - Admin or Manager (of branch)
router.delete('/users/:id', authenticate, isManager, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send({ error: 'User not found' });

    // Prevent Managers from interacting with Admins
    if (req.user.role === 'Manager' && user.role === 'Admin') {
      return res.status(403).send({ error: 'Managers cannot delete administrator accounts.' });
    }

    // Last admin protection
    if (user.role === 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).send({ error: 'Cannot delete the last administrator. There must be at least one Admin.' });
      }
    }

    if (req.user.role === 'Manager' && user.branchId !== req.user.branchId) {
      return res.status(403).send({ error: 'Managers can only delete employees from their branch.' });
    }

    await user.destroy();
    res.send({ message: 'User deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Bulk update users
router.post('/users/bulk-update', authenticate, isManager, async (req, res) => {
  try {
    const { userIds, updates } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).send({ error: 'No user IDs provided' });
    }

    // Identify users to update
    const usersToUpdate = await User.findAll({
      where: { id: { [Op.in]: userIds } }
    });

    if (usersToUpdate.length === 0) {
      return res.status(404).send({ error: 'No users found for provided IDs' });
    }

    // Permission and safety checks for each user
    for (const u of usersToUpdate) {
      // Prevent Managers from interacting with Admins
      if (req.user.role === 'Manager' && u.role === 'Admin') {
        continue; // Skip or error? Let's skip for bulk but could be more granular
      }

      // Permissions check for Managers
      if (req.user.role === 'Manager' && u.branchId !== req.user.branchId) {
        continue;
      }

      // Apply updates selectively
      const allowedUpdates = ['role', 'branchId', 'department', 'departmentId', 'status'];
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          // Additional safety: Managers cannot elevate role or change branch
          if (req.user.role === 'Manager') {
            if (key === 'role' || key === 'branchId') return;
          }
          
          // Last admin protection for status change
          if (key === 'status' && updates.status === 'Deactivated' && u.role === 'Admin') {
            // This is complex in bulk, maybe simplified or prevent deactivating admins via bulk
            return;
          }

          u[key] = updates[key];
        }
      });

      await u.save();
    }

    res.send({ message: 'Bulk update completed', count: usersToUpdate.length });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Bulk update failed' });
  }
});

export default router;
