// ProtectedRoute.jsx
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function ProtectedRoute({ user, children }) {
  const location = useLocation();
  
  if (!user) {
    // Redirect to login and remember the route
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
