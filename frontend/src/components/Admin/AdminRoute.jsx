import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadUser } from '../../redux/actions/authActions';

const AdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        // If we have a token but user isn't loaded yet, load the user
        if (!isAuthenticated && !authLoading) {
          try {
            await dispatch(loadUser());
          } catch (error) {
            console.error('Failed to load user:', error);
          }
        }
      }

      // Wait a bit for state to settle
      setTimeout(() => {
        setIsChecking(false);
      }, 100);
    };

    checkAuth();
  }, [dispatch, isAuthenticated, authLoading]);

  // Show loading state while checking authentication
  if (isChecking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;