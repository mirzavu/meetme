import jwt from 'jsonwebtoken';
import pb, { initPocketBaseAdmin } from './pocketbase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId, isAdmin = false) {
  return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    console.log('[AUTH UTILS] verifyToken() called');
    console.log('[AUTH UTILS] Token to verify:', token ? `${token.substring(0, 20)}...` : 'NULL');
    console.log('[AUTH UTILS] JWT_SECRET:', JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...` : 'NULL');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[AUTH UTILS] Token verified successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('[AUTH UTILS] Token verification failed');
    console.error('[AUTH UTILS] Error name:', error.name);
    console.error('[AUTH UTILS] Error message:', error.message);
    return null;
  }
}

export async function authenticateUser(req, res, next) {
  try {
    console.log('[AUTH MIDDLEWARE] ========================================');
    console.log('[AUTH MIDDLEWARE] Authentication middleware called');
    console.log('[AUTH MIDDLEWARE] Request method:', req.method);
    console.log('[AUTH MIDDLEWARE] Request path:', req.path);
    console.log('[AUTH MIDDLEWARE] Request URL:', req.url);
    console.log('[AUTH MIDDLEWARE] Request headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    console.log('[AUTH MIDDLEWARE] Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NULL');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[AUTH MIDDLEWARE] ERROR: No valid authorization header');
      console.error('[AUTH MIDDLEWARE] Auth header value:', authHeader);
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('[AUTH MIDDLEWARE] Extracted token:', token ? `${token.substring(0, 20)}...` : 'NULL');
    console.log('[AUTH MIDDLEWARE] Token length:', token ? token.length : 0);
    
    console.log('[AUTH MIDDLEWARE] Verifying token with JWT_SECRET...');
    const decoded = verifyToken(token);
    console.log('[AUTH MIDDLEWARE] Token decoded result:', decoded);

    if (!decoded) {
      console.error('[AUTH MIDDLEWARE] ERROR: Token verification failed');
      console.error('[AUTH MIDDLEWARE] Token that failed:', token ? `${token.substring(0, 50)}...` : 'NULL');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[AUTH MIDDLEWARE] Token decoded successfully');
    console.log('[AUTH MIDDLEWARE] Decoded userId:', decoded.userId);
    console.log('[AUTH MIDDLEWARE] Decoded isAdmin:', decoded.isAdmin);

    // Verify user still exists in PocketBase
    try {
      console.log('[AUTH MIDDLEWARE] Fetching user from PocketBase...');
      console.log('[AUTH MIDDLEWARE] PocketBase URL:', pb.baseUrl);
      console.log('[AUTH MIDDLEWARE] PocketBase admin auth status:', pb.authStore.isValid);
      console.log('[AUTH MIDDLEWARE] PocketBase admin token:', pb.authStore.token ? `${pb.authStore.token.substring(0, 20)}...` : 'NULL');
      
      // Ensure admin is authenticated before querying
      if (!pb.authStore.isValid) {
        console.warn('[AUTH MIDDLEWARE] PocketBase admin not authenticated, attempting to authenticate...');
        try {
          await initPocketBaseAdmin();
          console.log('[AUTH MIDDLEWARE] PocketBase admin authenticated successfully');
        } catch (authError) {
          console.error('[AUTH MIDDLEWARE] ERROR: Failed to authenticate PocketBase admin');
          console.error('[AUTH MIDDLEWARE] Auth error:', authError.message);
          console.error('[AUTH MIDDLEWARE] Auth error stack:', authError.stack);
          return res.status(500).json({ error: 'Server authentication error' });
        }
      }
      
      console.log('[AUTH MIDDLEWARE] Querying PocketBase for user ID:', decoded.userId);
      let user;
      try {
        user = await pb.collection('users').getOne(decoded.userId);
      } catch (queryError) {
        // Handle auto-cancellation - retry once
        if (queryError.isAbort || queryError.status === 0) {
          console.warn('[AUTH MIDDLEWARE] Request was auto-cancelled, retrying...');
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          user = await pb.collection('users').getOne(decoded.userId);
        } else {
          throw queryError;
        }
      }
      console.log('[AUTH MIDDLEWARE] User found in PocketBase!');
      console.log('[AUTH MIDDLEWARE] User ID:', user.id);
      console.log('[AUTH MIDDLEWARE] User email:', user.email);
      console.log('[AUTH MIDDLEWARE] User isAdmin from DB:', user.isAdmin);
      console.log('[AUTH MIDDLEWARE] Full user object:', JSON.stringify(user, null, 2));
      
      req.user = {
        id: decoded.userId,
        isAdmin: decoded.isAdmin || user.isAdmin || false
      };
      console.log('[AUTH MIDDLEWARE] req.user set:', req.user);
      console.log('[AUTH MIDDLEWARE] Authentication successful, calling next()');
      next();
    } catch (error) {
      console.error('[AUTH MIDDLEWARE] ERROR: Failed to fetch user from PocketBase');
      console.error('[AUTH MIDDLEWARE] Error name:', error.name);
      console.error('[AUTH MIDDLEWARE] Error message:', error.message);
      console.error('[AUTH MIDDLEWARE] Error status:', error.status);
      console.error('[AUTH MIDDLEWARE] Error response:', error.response);
      console.error('[AUTH MIDDLEWARE] Error data:', error.data);
      console.error('[AUTH MIDDLEWARE] UserId that was searched:', decoded.userId);
      console.error('[AUTH MIDDLEWARE] PocketBase admin auth status:', pb.authStore.isValid);
      console.error('[AUTH MIDDLEWARE] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // More specific error messages
      if (error.status === 404) {
        return res.status(401).json({ error: 'User not found' });
      } else if (error.status === 403 || error.status === 401) {
        return res.status(500).json({ error: 'Server authentication error' });
      } else {
        return res.status(401).json({ error: 'User verification failed' });
      }
    }
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] ERROR: Authentication failed with exception');
    console.error('[AUTH MIDDLEWARE] Error:', error);
    console.error('[AUTH MIDDLEWARE] Error stack:', error.stack);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

