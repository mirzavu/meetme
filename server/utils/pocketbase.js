import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8096');

// Mutex to prevent concurrent admin authentication
let authPromise = null;
let isAuthenticating = false;

// Admin auth for backend operations
export async function initPocketBaseAdmin() {
  // If already authenticating, wait for that promise
  if (isAuthenticating && authPromise) {
    console.log('[POCKETBASE] Admin auth already in progress, waiting...');
    return authPromise;
  }

  // If already authenticated, return immediately
  if (pb.authStore.isValid) {
    console.log('[POCKETBASE] Admin already authenticated');
    return Promise.resolve();
  }

  // Start authentication
  isAuthenticating = true;
  authPromise = (async () => {
    try {
      console.log('[POCKETBASE] Initializing admin authentication...');
      console.log('[POCKETBASE] PocketBase URL:', process.env.POCKETBASE_URL || 'http://127.0.0.1:8096');
      console.log('[POCKETBASE] Admin email:', process.env.POCKETBASE_ADMIN_EMAIL || 'meetme@demotesting.co.uk');
      
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'meetme@demotesting.co.uk',
        process.env.POCKETBASE_ADMIN_PASSWORD || '1212123412'
      );
      console.log('[POCKETBASE] Admin authenticated successfully');
      console.log('[POCKETBASE] Admin token:', pb.authStore.token ? `${pb.authStore.token.substring(0, 20)}...` : 'NULL');
    } catch (error) {
      console.error('[POCKETBASE] Failed to authenticate PocketBase admin:', error);
      console.error('[POCKETBASE] Error details:', error.message);
      console.error('[POCKETBASE] Error stack:', error.stack);
      throw error;
    } finally {
      isAuthenticating = false;
      authPromise = null;
    }
  })();

  return authPromise;
}

// Check if admin is authenticated
export function isAdminAuthenticated() {
  const isAuth = pb.authStore.isValid;
  console.log('[POCKETBASE] Admin auth check:', isAuth);
  console.log('[POCKETBASE] Admin token present:', !!pb.authStore.token);
  return isAuth;
}

// Initialize admin auth on module load (non-blocking)
// Will retry on first API call if it fails
initPocketBaseAdmin().catch((error) => {
  console.warn('[POCKETBASE] Admin auth failed on init. Will retry on first request:', error.message);
});

export default pb;

