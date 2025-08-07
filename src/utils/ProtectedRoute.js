// ProtectedRoute.jsx
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true/false = determined
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is authenticated:", user);  // Log user details if needed        
        setIsAuthenticated(true);
      } else {
        console.log("User is not authenticated");
        setIsAuthenticated(false);
      }      
    });

    return () => unsubscribe();
  }, [auth]);

  // Show the protected content while checking auth state
  if (isAuthenticated === null) {
    return children; // Show the requested page while authentication is being determined
  }
  
  if (!isAuthenticated) {
    // Redirect to login and remember the route
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
