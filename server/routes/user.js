import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  res.send(req.user);
});

router.get('/login-history', authenticate, async (req, res) => {
  try {
    const history = await LoginHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    res.send(history);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/login-history/:id', authenticate, async (req, res) => {
  try {
    const entry = await LoginHistory.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!entry) return res.status(404).send({ error: 'Entry not found' });
    await entry.destroy();
    res.send({ message: 'Session record removed' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/admin/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).send({ error: 'Cannot delete yourself' });
    
    await user.destroy();
    res.send({ message: 'User deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/admin/reset-device/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send({ error: 'User not found' });
    
    await user.update({ deviceId: null });
    res.send({ message: 'Device binding reset successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/profile', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'department', 'phone', 'address', 'emergencyContact', 'birthDate', 'notifSettings', 'securitySettings'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation && !req.file) {
      // Allow only specific fields or avatar
    }

    updates.forEach((update) => {
      if ((update === 'notifSettings' || update === 'securitySettings') && typeof req.body[update] === 'string') {
        try {
          req.user[update] = JSON.parse(req.body[update]);
        } catch (e) {
          req.user[update] = req.body[update];
        }
      } else {
        req.user[update] = req.body[update];
      }
    });
    
    if (req.file) {
      req.user.avatar = req.file.path; // Cloudinary URL
    }

    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).send({ error: 'Current and new passwords are required' });
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).send({ error: 'Current password is incorrect' });
    }

    req.user.password = newPassword;
    await req.user.save();
    
    res.send({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
