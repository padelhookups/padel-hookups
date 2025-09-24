// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router';

export default function ProtectedRoute({ user, children }) {
  
  const location = useLocation();

  if (!user && location.pathname !== '/SignUp') {
    // Redirect to login and remember the route
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
