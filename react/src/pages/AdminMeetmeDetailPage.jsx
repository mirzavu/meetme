import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Input, Button, message, Spin, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import api from '../utils/api';

const statusColors = {
  pending: 'orange',
  approved: 'blue',
  in_progress: 'cyan',
  delayed: 'red',
  awaiting_reply: 'purple',
  rejected: 'default',
  completed: 'green'
};

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In Progress',
  delayed: 'Delayed',
  awaiting_reply: 'Awaiting Reply',
  rejected: 'Rejected',
  completed: 'Completed'
};

function AdminMeetmeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meetme, setMeetme] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/meetmes/${id}`);
      setMeetme(response.data);
      setMessages(response.data.messages || []);
      setStatusValue(response.data.status);
    } catch (error) {
      message.error('Failed to load meetme');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!statusValue) {
      message.warning('Please select a status');
      return;
    }

    try {
      setUpdatingStatus(true);
      await api.patch(`/admin/meetmes/${id}/status`, {
        status: statusValue
      });
      message.success('Status updated');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      message.warning('Please enter a message');
      return;
    }

    try {
      setSending(true);
      await api.post(`/admin/meetmes/${id}/messages`, {
        message: messageText,
        status: statusValue // Include current status or let backend decide
      });
      setMessageText('');
      message.success('Message sent');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/meetmes')}
          className="mb-4"
        >
          Back to Admin Dashboard
        </Button>

        <Card className="mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Meetme Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Request ID</div>
              <div className="text-lg font-semibold text-gray-900">
                #{String(meetme.requestId || 0).padStart(5, '0')}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Status</div>
              <div>
                <Tag color={statusColors[meetme.status]} className="text-sm px-3 py-1">
                  {statusLabels[meetme.status]}
                </Tag>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">User Email</div>
              <div className="text-base text-gray-900">{meetme.userEmail}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Name</div>
              <div className="text-base text-gray-900">{meetme.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Phone</div>
              <div className="text-base text-gray-900">{meetme.phone}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Subject</div>
              <div className="text-base text-gray-900">{meetme.subject || 'Hidden'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Created</div>
              <div className="text-base text-gray-900">
                {meetme.created ? (() => {
                  const dateObj = new Date(meetme.created);
                  return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleString();
                })() : '-'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Updated</div>
              <div className="text-base text-gray-900">
                {meetme.updated ? (() => {
                  const dateObj = new Date(meetme.updated);
                  return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleString();
                })() : '-'}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Change Status" className="mb-6">
          <div className="flex gap-4 items-center">
            <Select
              style={{ width: 200 }}
              value={statusValue}
              onChange={setStatusValue}
            >
              {Object.keys(statusLabels).map((status) => (
                <Select.Option key={status} value={status}>
                  {statusLabels[status]}
                </Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              onClick={updateStatus}
              loading={updatingStatus}
            >
              Update Status
            </Button>
          </div>
        </Card>

        <Card title="Conversation" className="mb-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.authorType === 'admin'
                      ? 'bg-green-50 ml-auto max-w-[80%]'
                      : 'bg-blue-50 mr-auto max-w-[80%]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">
                      {msg.authorType === 'admin' ? 'Admin' : 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {msg.created ? (() => {
                        const dateObj = new Date(msg.created);
                        return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleString();
                      })() : '-'}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <Input.TextArea
              rows={4}
              placeholder="Type your reply..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <Button
              type="primary"
              onClick={sendMessage}
              loading={sending}
              block
            >
              Send Reply
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminMeetmeDetailPage;


