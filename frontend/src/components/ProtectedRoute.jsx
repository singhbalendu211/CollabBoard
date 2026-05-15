import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // 1. While the authentication status is loading, show a loading message.
  // This prevents a flicker/redirect before the user status is confirmed.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // 2. If loading is finished and there's a user, render the child route.
  // <Outlet /> is a placeholder for the actual page component.
  if (user) {
    return <Outlet />;
  }

  // 3. If loading is finished and there's no user, redirect to the login page.
  // `replace` prevents the user from navigating back to the protected page.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;