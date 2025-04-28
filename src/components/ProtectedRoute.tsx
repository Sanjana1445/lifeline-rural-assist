
import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      navigate('/auth/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // Don't render anything while checking authentication
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  // If authenticated, render the child routes
  return user ? <Outlet /> : null;
};

export default ProtectedRoute;
