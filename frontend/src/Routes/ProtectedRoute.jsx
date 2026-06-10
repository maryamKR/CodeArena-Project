import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ background: '#272822', minHeight: '100vh' }}></div>;
  return user ? <Outlet /> : <Navigate to="/login" />;
}