import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      companyId: req.companyId,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      timestamp: 'Just now'
    });

    // Broadcast notification for all users in THIS company
    await Notification.create({
      userId: null, 
      companyId: req.companyId,
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
    const announcement = await Announcement.findOne({ where: { id: req.params.id, companyId: req.companyId } });
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
    const announcement = await Announcement.findOne({ where: { id: req.params.id, companyId: req.companyId } });
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
    const { includeArchived } = req.query;
    const where = { companyId: req.companyId };
    if (includeArchived !== 'true') {
      where.archived = false;
    }

    // Only show announcements created after the user registered (for non-admins)
    if (req.user.role !== 'Admin' && req.user.createdAt) {
      where.createdAt = {
        [Op.gte]: req.user.createdAt
      };
    }

    const announcements = await Announcement.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    res.send(announcements);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/archive/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!announcement) {
      return res.status(404).send({ error: 'Announcement not found' });
    }
    announcement.archived = req.body.archived !== undefined ? req.body.archived : true;
    await announcement.save();
    res.send(announcement);
  } catch (error) {
    res.status(400).send(error);
  }
});

export default router;
