import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../../redux/actions/authActions';

const POSRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const token = localStorage.getItem('token');

  // Load user on mount if token exists
  useEffect(() => {
    if (token && !isAuthenticated && !user) {
      dispatch(loadUser());
    }
  }, [dispatch, token, isAuthenticated, user]);

  // Show loading while checking authentication
  if (isLoading || (token && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has proper role
  if (isAuthenticated && (user?.role === 'pos' || user?.role === 'admin' || user?.isAdmin)) {
    return children;
  }

  // Redirect to POS login if not authenticated
  return <Navigate to="/pos/login" replace />;
};

export default POSRoute;
