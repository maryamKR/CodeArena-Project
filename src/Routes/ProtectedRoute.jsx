import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ background: '#272822', minHeight: '100vh' }}></div>;
  return user ? <Outlet /> : <Navigate to="/login" />;
}