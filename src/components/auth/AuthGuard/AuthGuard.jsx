import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthLoading } from '../../../store/slices/authSlice';
import LoadingSpinner from '../../ui/LoadingSpinner/LoadingSpinner';

/**
 * AuthGuard component to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 */
const AuthGuard = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Short timeout to ensure auth state is loaded
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading || isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <LoadingSpinner size="large" text="Verifying authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location the user was trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected route
  return children;
};

export default AuthGuard;