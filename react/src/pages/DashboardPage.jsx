import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Card, message, Tooltip } from 'antd';
import { PlusOutlined, LogoutOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { clearAuth, getUser } from '../utils/auth';

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

function DashboardPage() {
  const [meetmes, setMeetmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCreateMeetme, setCanCreateMeetme] = useState(true);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    console.log('[DASHBOARD PAGE] Component mounted, fetching meetmes...');
    console.log('[DASHBOARD PAGE] Current user from getUser():', user);
    console.log('[DASHBOARD PAGE] Token from localStorage:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'NULL');
    console.log('[DASHBOARD PAGE] User from localStorage:', localStorage.getItem('user'));
    fetchMeetmes();
  }, []);

  const fetchMeetmes = async () => {
    try {
      console.log('[DASHBOARD PAGE] fetchMeetmes() called');
      console.log('[DASHBOARD PAGE] Token before request:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'NULL');
      console.log('[DASHBOARD PAGE] User before request:', localStorage.getItem('user'));
      
      setLoading(true);
      console.log('[DASHBOARD PAGE] Making GET request to /meetmes...');
      const response = await api.get('/meetmes');
      console.log('[DASHBOARD PAGE] Request successful!');
      console.log('[DASHBOARD PAGE] Response status:', response.status);
      console.log('[DASHBOARD PAGE] Response data:', response.data);
      const fetchedMeetmes = response.data.meetmes;
      setMeetmes(fetchedMeetmes);
      
      // Check if user has an open meetme
      const openStatuses = ['pending', 'approved', 'in_progress', 'delayed', 'awaiting_reply'];
      const hasOpenMeetme = fetchedMeetmes.some(meetme => openStatuses.includes(meetme.status));
      setCanCreateMeetme(!hasOpenMeetme);
    } catch (error) {
      console.error('[DASHBOARD PAGE] Error in fetchMeetmes():', error);
      console.error('[DASHBOARD PAGE] Error response:', error.response);
      console.error('[DASHBOARD PAGE] Error status:', error.response?.status);
      console.error('[DASHBOARD PAGE] Error data:', error.response?.data);
      message.error('Failed to load meetmes');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleCreateClick = () => {
    if (!canCreateMeetme) {
      message.warning('You already have an open meetme. You can create a new one only after the current one is completed or rejected.');
      return;
    }
    navigate('/meetmes/new');
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'requestId',
      key: 'requestId',
      render: (requestId) => `#${String(requestId || 0).padStart(5, '0')}`
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Subject',
      key: 'subject',
      render: () => 'Hidden'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Meetmes</h1>
          <div className="flex gap-4 items-center">
            <span className="text-gray-600">{user?.email}</span>
            <Tooltip
              title={!canCreateMeetme ? 'You already have an open meetme. You can create a new one only after the current one is completed or rejected.' : ''}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateClick}
                disabled={!canCreateMeetme}
              >
                Create Meetme
              </Button>
            </Tooltip>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={meetmes}
            loading={loading}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => navigate(`/meetmes/${record.id}`),
              style: { cursor: 'pointer' }
            })}
            locale={{ emptyText: 'No meetmes yet' }}
          />
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;

