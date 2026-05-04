import express from 'express';
import { SupportContact, SupportRequest, Notification, User } from '../models/associations.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Submit a support request (Message)
router.post('/request', authenticate, async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const request = await SupportRequest.create({
      userId: req.user.id,
      subject,
      message,
      category: category || 'General',
      status: 'pending'
    });

    // Notify Admins
    try {
      const admins = await User.findAll({ where: { role: 'Admin' } });
      for (const admin of admins) {
        await Notification.create({
          userId: admin.id,
          type: 'support_request',
          title: 'New Support Request',
          content: `User ${req.user.name || 'Staff Member'} submitted a request: ${subject}`,
          isRead: false
        });
      }
    } catch (notifError) {
      console.error('Failed to notify admins of support request:', notifError);
    }

    res.status(201).send(request);
  } catch (error) {
    console.error('Error submitting support request:', error);
    res.status(500).send({ error: 'Failed to submit support request' });
  }
});

// Public: Get active support contacts
router.get('/', authenticate, async (req, res) => {
  try {
    const contacts = await SupportContact.findAll({
      where: { isActive: true },
      order: [['id', 'ASC']]
    });
    res.send(contacts);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all support requests
router.get('/requests/all', authenticate, isAdmin, async (req, res) => {
  try {
    const requests = await SupportRequest.findAll({
      include: [{ model: User, attributes: ['name', 'email', 'employeeId', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    res.send(requests);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Update support request status
router.patch('/requests/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const request = await SupportRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ error: 'Request not found' });
    
    await request.update({ status: req.body.status });
    res.send(request);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete support request
router.delete('/requests/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const request = await SupportRequest.findByPk(req.params.id);
    if (!request) return res.status(404).send({ error: 'Request not found' });
    
    await request.destroy();
    res.send({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all support contacts
router.get('/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const contacts = await SupportContact.findAll({
      order: [['id', 'ASC']]
    });
    res.send(contacts);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Add new support contact
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const contact = await SupportContact.create(req.body);
    res.status(201).send(contact);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Update support contact
router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const contact = await SupportContact.findByPk(req.params.id);
    if (!contact) return res.status(404).send({ error: 'Contact not found' });
    
    await contact.update(req.body);
    res.send(contact);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete support contact
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const contact = await SupportContact.findByPk(req.params.id);
    if (!contact) return res.status(404).send({ error: 'Contact not found' });
    
    await contact.destroy();
    res.send({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
