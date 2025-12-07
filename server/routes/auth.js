import express from 'express';
import PocketBase from 'pocketbase';
import pb, { initPocketBaseAdmin } from '../utils/pocketbase.js';
import { generateToken } from '../utils/auth.js';

const router = express.Router();

// Exchange PocketBase OAuth token for JWT
router.post('/oauth-callback', async (req, res) => {
  try {
    console.log('[AUTH ROUTE] ========================================');
    console.log('[AUTH ROUTE] OAuth callback received');
    console.log('[AUTH ROUTE] Request body token:', req.body.token ? `${req.body.token.substring(0, 20)}...` : 'NULL');
    console.log('[AUTH ROUTE] Request body record:', req.body.record);
    
    const { token, record } = req.body;

    if (!token) {
      console.error('[AUTH ROUTE] ERROR: No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify token with PocketBase and get user info
    let user;
    try {
      console.log('[AUTH ROUTE] Verifying PocketBase token...');
      console.log('[AUTH ROUTE] PocketBase URL:', process.env.POCKETBASE_URL || 'http://127.0.0.1:8096');
      
      // Create a temporary PocketBase instance to verify the token
      const userPb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8096');
      userPb.authStore.save(token, record || null);
      console.log('[AUTH ROUTE] Token saved to temporary PocketBase instance');
      
      // Verify the token by getting the current user
      console.log('[AUTH ROUTE] Attempting authRefresh...');
      const authData = await userPb.collection('users').authRefresh();
      user = authData.record;
      console.log('[AUTH ROUTE] Auth refresh successful');
      console.log('[AUTH ROUTE] User from authRefresh:', user.id, user.email);
    } catch (error) {
      console.error('[AUTH ROUTE] Error verifying PocketBase token:', error);
      console.error('[AUTH ROUTE] Error name:', error.name);
      console.error('[AUTH ROUTE] Error message:', error.message);
      console.error('[AUTH ROUTE] Error status:', error.status);
      
      // If refresh fails, try to get user from record if provided
      if (record && record.id) {
        console.log('[AUTH ROUTE] Falling back to record.id:', record.id);
        try {
          console.log('[AUTH ROUTE] Checking PocketBase admin auth before querying...');
          console.log('[AUTH ROUTE] Admin auth status:', pb.authStore.isValid);
          if (!pb.authStore.isValid) {
            console.log('[AUTH ROUTE] Admin not authenticated, authenticating...');
            await initPocketBaseAdmin();
          }
          user = await pb.collection('users').getOne(record.id);
          console.log('[AUTH ROUTE] User fetched from record.id:', user.id, user.email);
        } catch (err) {
          console.error('[AUTH ROUTE] ERROR: Failed to get user from record.id');
          console.error('[AUTH ROUTE] Error:', err);
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
      } else {
        console.error('[AUTH ROUTE] ERROR: No record.id available');
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }

    // Generate JWT token
    console.log('[AUTH ROUTE] Generating JWT token for user:', user.id);
    console.log('[AUTH ROUTE] User isAdmin:', user.isAdmin || false);
    const jwtToken = generateToken(user.id, user.isAdmin || false);
    console.log('[AUTH ROUTE] JWT token generated:', jwtToken ? `${jwtToken.substring(0, 20)}...` : 'NULL');
    console.log('[AUTH ROUTE] JWT token length:', jwtToken ? jwtToken.length : 0);

    const responseData = {
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    };
    console.log('[AUTH ROUTE] Sending response with token and user data');
    console.log('[AUTH ROUTE] Response user:', responseData.user);
    res.json(responseData);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to process OAuth callback' });
  }
});

// Admin login (using email/password for admin)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if this is the admin email
    if (email === (process.env.POCKETBASE_ADMIN_EMAIL || 'meetme@demotesting.co.uk') &&
        password === (process.env.POCKETBASE_ADMIN_PASSWORD || '1212123412')) {
      
      // Get or create admin user
      let user;
      try {
        const result = await pb.collection('users').getList(1, 1, {
          filter: `email = "${email}"`
        });
        
        if (result.items.length > 0) {
          user = result.items[0];
          // Ensure admin flag is set
          if (!user.isAdmin) {
            user = await pb.collection('users').update(user.id, { isAdmin: true });
          }
        } else {
          // Create admin user
          user = await pb.collection('users').create({
            email: email,
            emailVisibility: true,
            verified: true,
            isAdmin: true,
            password: password,
            passwordConfirm: password
          });
        }
      } catch (error) {
        console.error('Error getting/creating admin user:', error);
        return res.status(500).json({ error: 'Failed to authenticate admin' });
      }

      const jwtToken = generateToken(user.id, true);

      res.json({
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: true
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Failed to authenticate admin' });
  }
});

export default router;

