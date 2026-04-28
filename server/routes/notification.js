import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all notifications for the current user (including broadcasts)
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { userId: req.user.id },
          { userId: null } // Broadcasts
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.send(notifications);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Mark a notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { userId: req.user.id },
          { userId: null }
        ]
      }
    });

    if (!notification) {
      return res.status(404).send({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();
    res.send(notification);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          [Op.or]: [
            { userId: req.user.id },
            { userId: null }
          ],
          isRead: false
        }
      }
    );
    res.send({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
