import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Input, Button, message, Spin } from 'antd';
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

function MeetmeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meetme, setMeetme] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meetmeRes, messagesRes] = await Promise.all([
        api.get(`/meetmes/${id}`),
        api.get(`/meetmes/${id}/messages`)
      ]);
      setMeetme(meetmeRes.data);
      setMessages(messagesRes.data.messages);
    } catch (error) {
      message.error('Failed to load meetme');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      message.warning('Please enter a message');
      return;
    }

    try {
      setSending(true);
      await api.post(`/meetmes/${id}/messages`, {
        message: messageText
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

  if (!meetme) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            className="mb-4"
          >
            Back to Dashboard
          </Button>
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-600">Failed to load meetme details</p>
              <Button type="primary" onClick={() => navigate('/')} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          className="mb-4"
        >
          Back to Dashboard
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
              <div className="text-sm font-medium text-gray-500">Name</div>
              <div className="text-base text-gray-900">{meetme.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Phone</div>
              <div className="text-base text-gray-900">{meetme.phone}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Subject</div>
              <div className="text-base text-gray-900">Hidden</div>
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
                    msg.authorType === 'user'
                      ? 'bg-blue-50 ml-auto max-w-[80%]'
                      : 'bg-gray-100 mr-auto max-w-[80%]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">
                      {msg.authorType === 'user' ? 'You' : 'Admin'}
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

        {meetme.status === 'awaiting_reply' ? (
          <Card>
            <div className="space-y-4">
              <Input.TextArea
                rows={4}
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <Button
                type="primary"
                onClick={sendMessage}
                loading={sending}
                block
              >
                Send Message
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">
                You can only send messages when the meetme status is <strong>"Awaiting Reply"</strong>.
              </p>
              <p className="text-sm text-gray-500">
                Current status: <Tag color={statusColors[meetme.status]} className="ml-1">
                  {statusLabels[meetme.status]}
                </Tag>
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default MeetmeDetailPage;


