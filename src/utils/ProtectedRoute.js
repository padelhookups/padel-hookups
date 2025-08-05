// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login and remember the route
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
