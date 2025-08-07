import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function NotFound() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true/false = determined
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log(!!user ? "User authenticated - redirecting to /Home" : "User not authenticated - redirecting to /");
    });

    return () => unsubscribe();
  }, [auth]);

  // Show loading while checking auth state
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Navigate to="/Home" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
}
