import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    // Preserve the intended destination so login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      // Redirect to the home page if the user doesn't have the right role
      return <Navigate to="/" state={{ authError: 'You do not have access to that page.' }} replace />;
    }
  }

  return children;
}
