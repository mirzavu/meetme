import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3016/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  console.log('[API INTERCEPTOR REQUEST] Starting request interceptor');
  console.log('[API INTERCEPTOR REQUEST] URL:', config.url);
  console.log('[API INTERCEPTOR REQUEST] Method:', config.method);
  console.log('[API INTERCEPTOR REQUEST] Base URL:', config.baseURL);
  console.log('[API INTERCEPTOR REQUEST] Full URL:', `${config.baseURL}${config.url}`);
  
  const token = localStorage.getItem('token');
  console.log('[API INTERCEPTOR REQUEST] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NULL');
  console.log('[API INTERCEPTOR REQUEST] Token length:', token ? token.length : 0);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API INTERCEPTOR REQUEST] Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.warn('[API INTERCEPTOR REQUEST] WARNING: No token found in localStorage!');
  }
  
  console.log('[API INTERCEPTOR REQUEST] Request headers:', JSON.stringify(config.headers, null, 2));
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => {
    console.log('[API INTERCEPTOR RESPONSE] Success response received');
    console.log('[API INTERCEPTOR RESPONSE] Status:', response.status);
    console.log('[API INTERCEPTOR RESPONSE] URL:', response.config.url);
    return response;
  },
  (error) => {
    console.error('[API INTERCEPTOR RESPONSE] Error response received');
    console.error('[API INTERCEPTOR RESPONSE] Error status:', error.response?.status);
    console.error('[API INTERCEPTOR RESPONSE] Error URL:', error.config?.url);
    console.error('[API INTERCEPTOR RESPONSE] Error message:', error.message);
    console.error('[API INTERCEPTOR RESPONSE] Error response data:', error.response?.data);
    console.error('[API INTERCEPTOR RESPONSE] Request headers sent:', error.config?.headers);
    
    if (error.response?.status === 401) {
      console.error('[API INTERCEPTOR RESPONSE] 401 Unauthorized detected!');
      console.error('[API INTERCEPTOR RESPONSE] Clearing auth and redirecting to login');
      const tokenBefore = localStorage.getItem('token');
      console.error('[API INTERCEPTOR RESPONSE] Token before removal:', tokenBefore ? `${tokenBefore.substring(0, 20)}...` : 'NULL');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

