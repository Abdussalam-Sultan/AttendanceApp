import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      timestamp: 'Just now'
    });

    // Broadcast notification for all users
    await Notification.create({
      userId: null, 
      title: `[${req.body.category || 'General'}] New Announcement`,
      content: req.body.title,
      type: 'ANNOUNCEMENT'
    });

    res.status(201).send(announcement);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).send({ error: 'Announcement not found' });
    }

    const updates = Object.keys(req.body);
    updates.forEach((update) => (announcement[update] = req.body[update]));
    await announcement.save();

    res.send(announcement);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).send({ error: 'Announcement not found' });
    }
    await announcement.destroy();
    res.send({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    res.send(announcements);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
