import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Button, Paper, Grid } from '@mui/material';
import AuthContext from '../../context/AuthContext';

function TrainerDashboardPage() {
  const { authState } = useContext(AuthContext);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: {xs: 2, md: 4} }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, Trainer {authState.user?.firstName || authState.user?.username}!
        </Typography>
        <Typography variant="body1" paragraph>
          This is your dashboard. From here, you can manage your profile, view your schedule,
          and interact with assigned members or classes (features coming soon).
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component={RouterLink}
                to="/trainer/profile"
                variant="contained"
                color="primary"
                fullWidth
                sx={{py: 2}}
              >
                Manage My Profile & Availability
              </Button>
            </Grid>
            {/* Placeholder for future features */}
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="outlined"
                fullWidth
                sx={{py: 2}}
                disabled
                // component={RouterLink} to="/trainer/schedule"
              >
                View My Schedule (Coming Soon)
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="outlined"
                fullWidth
                sx={{py: 2}}
                disabled
                // component={RouterLink} to="/trainer/my-classes"
              >
                Manage My Classes (Coming Soon)
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default TrainerDashboardPage;
