import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { CircularProgress, Box, Typography, Container, Button } from '@mui/material'; // Added Button

const TrainerRoute = () => {
  const { authState } = useContext(AuthContext);

  if (authState.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authState.user?.role !== 'trainer') {
    // Authenticated but not a trainer
    return (
        <Container sx={{textAlign: 'center', marginTop: 5}}>
            <Typography variant="h4" color="error">Access Denied</Typography>
            <Typography variant="body1">You do not have permission to view this page. This area is for trainers only.</Typography>
            <Button component={Navigate} to="/dashboard" variant="contained" sx={{mt: 2}}>Go to My Dashboard</Button>
        </Container>
    );
  }

  // Authenticated and is a trainer
  return <Outlet />;
};

export default TrainerRoute;
