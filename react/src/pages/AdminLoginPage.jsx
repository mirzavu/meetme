import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onAdminLogin = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/admin-login', {
        email: values.email,
        password: values.password
      });
      setAuth(response.data.token, response.data.user);
      message.success('Admin login successful!');
      navigate('/admin/meetmes');
    } catch (error) {
      message.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Admin Login</h1>
        <p className="text-center text-gray-600 mb-8">Meetme Management System</p>
        <Card>
          <Form onFinish={onAdminLogin} layout="vertical">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="Enter admin email" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Login as Admin
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default AdminLoginPage;

