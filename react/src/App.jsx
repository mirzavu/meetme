import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from './utils/auth';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateMeetmePage from './pages/CreateMeetmePage';
import MeetmeDetailPage from './pages/MeetmeDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMeetmeDetailPage from './pages/AdminMeetmeDetailPage';

function PrivateRoute({ children, requireAdmin = false }) {
  if (!isAuthenticated()) {
    if (requireAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/meetmes/new"
          element={
            <PrivateRoute>
              <CreateMeetmePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/meetmes/:id"
          element={
            <PrivateRoute>
              <MeetmeDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/meetmes"
          element={
            <PrivateRoute requireAdmin>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/meetmes/:id"
          element={
            <PrivateRoute requireAdmin>
              <AdminMeetmeDetailPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

