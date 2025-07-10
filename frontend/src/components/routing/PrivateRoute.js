import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = () => {
  const { authState } = useContext(AuthContext);

  if (authState.isLoading) {
    // Show a loading spinner while auth state is being determined
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, render the child routes (Outlet).
  // If not authenticated, redirect to login page.
  // ` Navigate` component replaces the current entry in history, good for login redirects.
  return authState.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
