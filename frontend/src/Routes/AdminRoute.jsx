import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ background: '#272822', minHeight: '100vh' }}></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <Outlet />;
}