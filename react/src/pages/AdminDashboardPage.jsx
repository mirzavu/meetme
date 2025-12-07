import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Card, Select, Button, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
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

function AdminDashboardPage() {
  const [meetmes, setMeetmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    fetchMeetmes();
  }, [statusFilter]);

  const fetchMeetmes = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/admin/meetmes', { params });
      setMeetmes(response.data.meetmes);
    } catch (error) {
      message.error('Failed to load meetmes');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'requestId',
      key: 'requestId',
      render: (requestId) => `#${String(requestId || 0).padStart(5, '0')}`
    },
    {
      title: 'User Email',
      dataIndex: 'userEmail',
      key: 'userEmail'
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
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
    },
    {
      title: 'Updated',
      dataIndex: 'updated',
      key: 'updated',
      render: (date) => {
        if (!date) return '-';
        const dateObj = new Date(date);
        return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
      }
    }
  ];

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4 items-center">
            <span className="text-gray-600">{user?.email}</span>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <div className="flex gap-4 items-center">
            <span>Filter by Status:</span>
            <Select
              style={{ width: 200 }}
              placeholder="All Statuses"
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
            >
              {Object.keys(statusLabels).map((status) => (
                <Select.Option key={status} value={status}>
                  {statusLabels[status]}
                </Select.Option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={meetmes}
            loading={loading}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => navigate(`/admin/meetmes/${record.id}`),
              style: { cursor: 'pointer' }
            })}
            locale={{ emptyText: 'No meetmes found' }}
          />
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

