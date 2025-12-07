import express from 'express';
import pb from '../utils/pocketbase.js';
import { authenticateUser, requireAdmin } from '../utils/auth.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticateUser);
router.use(requireAdmin);

// List all meetmes
router.get('/meetmes', async (req, res) => {
  try {
    const { status, page = 1, perPage = 50 } = req.query;
    
    let filter = '';
    if (status) {
      filter = `status = "${status}"`;
    }

    const meetmes = await pb.collection('meetmes').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'user'
    });

    res.json({
      meetmes: meetmes.items.map(mt => ({
        id: mt.id,
        requestId: mt.requestId,
        userId: mt.user,
        userEmail: mt.expand?.user?.email || '',
        name: mt.name,
        phone: mt.phone,
        message: mt.message,
        status: mt.status,
        subject: mt.subject,
        created: mt.created,
        updated: mt.updated
      })),
      page: meetmes.page,
      perPage: meetmes.perPage,
      totalItems: meetmes.totalItems,
      totalPages: meetmes.totalPages
    });
  } catch (error) {
    console.error('Error fetching meetmes:', error);
    res.status(500).json({ error: 'Failed to fetch meetmes' });
  }
});

// Get single meetme with messages
router.get('/meetmes/:id', async (req, res) => {
  try {
    const meetme = await pb.collection('meetmes').getOne(req.params.id, {
      expand: 'user'
    });

    const messages = await pb.collection('meetme_messages').getList(1, 100, {
      filter: `meetme = "${req.params.id}"`,
      sort: 'created'
    });

    res.json({
      id: meetme.id,
      requestId: meetme.requestId,
      userId: meetme.user,
      userEmail: meetme.expand?.user?.email || '',
      name: meetme.name,
      phone: meetme.phone,
      message: meetme.message,
      status: meetme.status,
      subject: meetme.subject,
      created: meetme.created,
      updated: meetme.updated,
      messages: messages.items.map(msg => ({
        id: msg.id,
        meetme: msg.meetme,
        authorType: msg.authorType,
        message: msg.message,
        created: msg.created
      }))
    });
  } catch (error) {
    console.error('Error fetching meetme:', error);
    if (error.status === 404) {
      res.status(404).json({ error: 'Meetme not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch meetme' });
    }
  }
});

// Update meetme status
router.patch('/meetmes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'in_progress', 'delayed', 'awaiting_reply', 'rejected', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const meetme = await pb.collection('meetmes').update(req.params.id, {
      status
    });

    res.json({
      id: meetme.id,
      status: meetme.status,
      updated: meetme.updated
    });
  } catch (error) {
    console.error('Error updating status:', error);
    if (error.status === 404) {
      res.status(404).json({ error: 'Meetme not found' });
    } else {
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
});

// Send admin message
router.post('/meetmes/:id/messages', async (req, res) => {
  try {
    const { message, status } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify meetme exists
    const meetme = await pb.collection('meetmes').getOne(req.params.id);

    // Create message
    const newMessage = await pb.collection('meetme_messages').create({
      meetme: req.params.id,
      authorType: 'admin',
      message: message.trim()
    });

    // Update status (default to in_progress if not specified)
    const newStatus = status || 'in_progress';
    const validStatuses = ['pending', 'approved', 'in_progress', 'delayed', 'awaiting_reply', 'rejected', 'completed'];
    if (validStatuses.includes(newStatus)) {
      await pb.collection('meetmes').update(req.params.id, {
        status: newStatus
      });
    }

    res.status(201).json({
      id: newMessage.id,
      meetme: newMessage.meetme,
      authorType: newMessage.authorType,
      message: newMessage.message,
      created: newMessage.created
    });
  } catch (error) {
    console.error('Error creating message:', error);
    if (error.status === 404) {
      res.status(404).json({ error: 'Meetme not found' });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

export default router;

