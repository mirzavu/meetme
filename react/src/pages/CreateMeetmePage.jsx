import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import api from '../utils/api';

function CreateMeetmePage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await api.post('/meetmes', values);
      message.success('Your request is under process and may take upto 10 business days.');
      navigate('/');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create meetme';
      message.error(errorMsg);
      
      // If user has an open meetme, navigate to it
      if (error.response?.data?.existingMeetmeId) {
        setTimeout(() => {
          navigate(`/meetmes/${error.response.data.existingMeetmeId}`);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Meetme</h1>
        <Card>
          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input placeholder="Enter your name" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone"
              rules={[
                { required: true, message: 'Please enter your phone number' }
              ]}
            >
              <Input placeholder="Enter your phone number" />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: 'Please enter your message' }]}
            >
              <Input.TextArea
                rows={6}
                placeholder="Enter your message"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Submit Request
              </Button>
            </Form.Item>

            <Button onClick={() => navigate('/')} block>
              Cancel
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default CreateMeetmePage;


