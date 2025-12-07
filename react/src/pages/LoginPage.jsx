import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, message } from 'antd';
import pb from '../utils/pocketbase';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Initiate OAuth flow with PocketBase using Popup
      // This will open a popup window for Google login
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google'
      });

      console.log('[LOGIN PAGE] PocketBase OAuth successful');
      console.log('[LOGIN PAGE] PocketBase token received:', authData.token ? `${authData.token.substring(0, 20)}...` : 'NULL');
      console.log('[LOGIN PAGE] PocketBase token length:', authData.token ? authData.token.length : 0);
      console.log('[LOGIN PAGE] PocketBase record:', authData.record);
      
      // Exchange PocketBase token for our JWT if needed
      // Or just use the PocketBase user/token directly
      
      // In this app, we seem to wrap PocketBase auth with our own backend JWT
      // So we send the PB token to our backend
      console.log('[LOGIN PAGE] Sending OAuth callback to backend...');
      const response = await api.post('/auth/oauth-callback', {
        token: authData.token,
        record: authData.record
      });

      console.log('[LOGIN PAGE] Backend response received');
      console.log('[LOGIN PAGE] JWT token from backend:', response.data.token ? `${response.data.token.substring(0, 20)}...` : 'NULL');
      console.log('[LOGIN PAGE] JWT token length:', response.data.token ? response.data.token.length : 0);
      console.log('[LOGIN PAGE] User data from backend:', response.data.user);

      setAuth(response.data.token, response.data.user);
      
      console.log('[LOGIN PAGE] Auth data stored in localStorage');
      console.log('[LOGIN PAGE] Verifying token in localStorage:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'NULL');
      console.log('[LOGIN PAGE] Verifying user in localStorage:', localStorage.getItem('user'));
      
      message.success('Login successful!');
      console.log('[LOGIN PAGE] Navigating to dashboard...');
      navigate('/');
      
    } catch (error) {
      console.error('Google login error:', error);
      // Handle popup cancellation (error.isAbort)
      if (error.isAbort) {
        message.info('Login cancelled');
      } else {
        message.error(error.message || 'Failed to login with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">User Login</h1>
        <p className="text-center text-gray-600 mb-8">Meetme Request System</p>
        <Card>
          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleGoogleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '48px',
              fontSize: '16px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;

