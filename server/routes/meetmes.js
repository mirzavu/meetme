import express from 'express';
import pb from '../utils/pocketbase.js';
import { authenticateUser } from '../utils/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// List user's meetmes
router.get('/', async (req, res) => {
  try {
    console.log('[MEETMES ROUTE] GET / - List meetmes called');
    console.log('[MEETMES ROUTE] req.user:', req.user);
    console.log('[MEETMES ROUTE] req.user.id:', req.user?.id);
    
    // Ensure admin is authenticated
    if (!pb.authStore.isValid) {
      console.log('[MEETMES ROUTE] Admin not authenticated, initializing...');
      const { initPocketBaseAdmin } = await import('../utils/pocketbase.js');
      await initPocketBaseAdmin();
    }
    
    console.log('[MEETMES ROUTE] PocketBase admin auth status:', pb.authStore.isValid);
    
    // Fetch meetmes with filter
    // Note: Using manual sorting as PocketBase sort parameter causes 400 errors
    const filterString = `user = "${req.user.id}"`;
    console.log('[MEETMES ROUTE] Filter string:', filterString);
    
    const meetmes = await pb.collection('meetmes').getList(1, 100, {
      filter: filterString
    });
    
    // Sort manually by created date (newest first)
    meetmes.items.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    console.log('[MEETMES ROUTE] Meetmes fetched:', meetmes.items.length);

    res.json({
      meetmes: meetmes.items.map(mt => ({
        id: mt.id,
        requestId: mt.requestId,
        name: mt.name,
        phone: mt.phone,
        message: mt.message,
        status: mt.status,
        subject: mt.subject,
        created: mt.created,
        updated: mt.updated
      }))
    });
  } catch (error) {
    console.error('[MEETMES ROUTE] Error fetching meetmes:', error);
    console.error('[MEETMES ROUTE] Error name:', error.name);
    console.error('[MEETMES ROUTE] Error message:', error.message);
    console.error('[MEETMES ROUTE] Error status:', error.status);
    console.error('[MEETMES ROUTE] Error response:', error.response);
    console.error('[MEETMES ROUTE] Error data:', error.data);
    console.error('[MEETMES ROUTE] Error URL:', error.url);
    if (error.data) {
      console.error('[MEETMES ROUTE] Error data details:', JSON.stringify(error.data, null, 2));
    }
    res.status(500).json({ error: 'Failed to fetch meetmes', details: error.message });
  }
});

// Get single meetme
router.get('/:id', async (req, res) => {
  try {
    // Ensure admin is authenticated
    if (!pb.authStore.isValid) {
      console.log('[MEETMES ROUTE] Admin not authenticated, initializing...');
      const { initPocketBaseAdmin } = await import('../utils/pocketbase.js');
      await initPocketBaseAdmin();
    }

    let meetme;
    try {
      meetme = await pb.collection('meetmes').getOne(req.params.id);
    } catch (queryError) {
      // Handle auto-cancellation - retry once
      if (queryError.isAbort || queryError.status === 0) {
        console.warn('[MEETMES ROUTE] Request was auto-cancelled, retrying...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        meetme = await pb.collection('meetmes').getOne(req.params.id);
      } else {
        throw queryError;
      }
    }

    // Verify ownership
    if (meetme.user !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: meetme.id,
      requestId: meetme.requestId,
      name: meetme.name,
      phone: meetme.phone,
      message: meetme.message,
      status: meetme.status,
      subject: meetme.subject,
      created: meetme.created,
      updated: meetme.updated
    });
  } catch (error) {
    console.error('[MEETMES ROUTE] Error fetching meetme:', error);
    console.error('[MEETMES ROUTE] Error name:', error.name);
    console.error('[MEETMES ROUTE] Error message:', error.message);
    console.error('[MEETMES ROUTE] Error status:', error.status);
    if (error.status === 404) {
      res.status(404).json({ error: 'Meetme not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch meetme', details: error.message });
    }
  }
});

// Create new meetme
router.post('/', async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'Name, phone, and message are required' });
    }

    // Check for existing open meetme
    const openStatuses = ['pending', 'approved', 'in_progress', 'delayed', 'awaiting_reply'];
    const statusFilter = openStatuses.map(s => `status = "${s}"`).join(' || ');
    const openMeetmes = await pb.collection('meetmes').getList(1, 1, {
      filter: `user = "${req.user.id}" && (${statusFilter})`
    });

    if (openMeetmes.items.length > 0) {
      return res.status(400).json({
        error: 'You already have an open meetme. You can create a new one only after the current one is completed or rejected.',
        existingMeetmeId: openMeetmes.items[0].id
      });
    }

    // Get the next requestId (find max requestId and add 1, or start at 1)
    const allMeetmes = await pb.collection('meetmes').getList(1, 1, {
      sort: '-requestId'
    });
    const nextRequestId = allMeetmes.items.length > 0 && allMeetmes.items[0].requestId
      ? allMeetmes.items[0].requestId + 1
      : 1;

    // Create meetme
    const meetme = await pb.collection('meetmes').create({
      user: req.user.id,
      name,
      phone,
      message,
      status: 'pending',
      subject: 'Hidden',
      requestId: nextRequestId
    });

    // Create initial message
    await pb.collection('meetme_messages').create({
      meetme: meetme.id,
      authorType: 'user',
      message
    });

    res.status(201).json({
      id: meetme.id,
      requestId: meetme.requestId,
      name: meetme.name,
      phone: meetme.phone,
      message: meetme.message,
      status: meetme.status,
      subject: meetme.subject,
      created: meetme.created
    });
  } catch (error) {
    console.error('Error creating meetme:', error);
    res.status(500).json({ error: 'Failed to create meetme' });
  }
});

// Get messages for a meetme
router.get('/:id/messages', async (req, res) => {
  try {
    // Ensure admin is authenticated
    if (!pb.authStore.isValid) {
      console.log('[MEETMES ROUTE] Admin not authenticated, initializing...');
      const { initPocketBaseAdmin } = await import('../utils/pocketbase.js');
      await initPocketBaseAdmin();
    }

    // Verify ownership
    let meetme;
    try {
      meetme = await pb.collection('meetmes').getOne(req.params.id);
    } catch (queryError) {
      // Handle auto-cancellation - retry once
      if (queryError.isAbort || queryError.status === 0) {
        console.warn('[MEETMES ROUTE] Request was auto-cancelled, retrying...');
        await new Promise(resolve => setTimeout(resolve, 100));
        meetme = await pb.collection('meetmes').getOne(req.params.id);
      } else {
        throw queryError;
      }
    }

    if (meetme.user !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch messages without sort parameter, then sort manually
    const messages = await pb.collection('meetme_messages').getList(1, 100, {
      filter: `meetme = "${req.params.id}"`
    });

    // Sort manually by created date (oldest first)
    messages.items.sort((a, b) => new Date(a.created) - new Date(b.created));

    res.json({
      messages: messages.items.map(msg => ({
        id: msg.id,
        meetme: msg.meetme,
        authorType: msg.authorType,
        message: msg.message,
        created: msg.created
      }))
    });
  } catch (error) {
    console.error('[MEETMES ROUTE] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// Send a message
router.post('/:id/messages', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify ownership
    const meetme = await pb.collection('meetmes').getOne(req.params.id);
    if (meetme.user !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow messages when status is awaiting_reply
    if (meetme.status !== 'awaiting_reply') {
      return res.status(400).json({ 
        error: 'You can only send messages when the meetme status is "Awaiting Reply". Please wait for admin response.' 
      });
    }

    // Create message
    const newMessage = await pb.collection('meetme_messages').create({
      meetme: req.params.id,
      authorType: 'user',
      message: message.trim()
    });

    // Update meetme status if needed
    const closedStatuses = ['approved', 'rejected', 'completed'];
    if (!closedStatuses.includes(meetme.status)) {
      await pb.collection('meetmes').update(req.params.id, {
        status: 'awaiting_reply'
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
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;


