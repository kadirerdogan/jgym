import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { CircularProgress, Box, Typography, Container } from '@mui/material';

const AdminRoute = () => {
  const { authState } = useContext(AuthContext);

  if (authState.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!authState.isAuthenticated) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (authState.user?.role !== 'admin') {
    // Authenticated but not an admin, redirect to a 'Not Authorized' page or dashboard
    // For simplicity, redirecting to user's dashboard.
    // A dedicated "Not Authorized" page would be better UX.
    return (
        <Container sx={{textAlign: 'center', marginTop: 5}}>
            <Typography variant="h4" color="error">Access Denied</Typography>
            <Typography variant="body1">You do not have permission to view this page.</Typography>
            <Button component={Navigate} to="/dashboard" variant="contained" sx={{mt: 2}}>Go to Dashboard</Button>
        </Container>
    ); // Or <Navigate to="/dashboard" replace />;
  }

  // Authenticated and is an admin, render the child routes
  return <Outlet />;
};

export default AdminRoute;
