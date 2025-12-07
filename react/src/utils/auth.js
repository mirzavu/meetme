export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function setAuth(token, user) {
  console.log('[AUTH UTILS] setAuth() called');
  console.log('[AUTH UTILS] Token to store:', token ? `${token.substring(0, 20)}...` : 'NULL');
  console.log('[AUTH UTILS] Token length:', token ? token.length : 0);
  console.log('[AUTH UTILS] User to store:', user);
  
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  console.log('[AUTH UTILS] Token stored in localStorage');
  console.log('[AUTH UTILS] Verifying token was stored:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'NULL');
  console.log('[AUTH UTILS] Verifying user was stored:', localStorage.getItem('user'));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return !!getToken();
}

export function isAdmin() {
  const user = getUser();
  return user?.isAdmin || false;
}

