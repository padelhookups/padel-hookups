import React from 'react';
import { useLocation } from 'react-router';
import BottomBar from './BottomBar';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Define routes where the bottom bar should NOT appear
  const excludedRoutes = ['/', '/SignUp', '/verifyEmail'];
  
  // Check if current route should show the bottom bar
  const showBottomBar = !excludedRoutes.includes(location.pathname);

  return (
    <>
      {children}
      {showBottomBar && <BottomBar />}
    </>
  );
};

export default Layout;
