import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Grid, Card, CardContent, CardActions, Button, useTheme, Divider
} from '@mui/material';
import {
    AccountCircle, EventNote, FitnessCenter as ClassIcon, Dashboard as DashboardIcon
} from '@mui/icons-material'; // Added icons
import AuthContext from '../../context/AuthContext';

// Helper component for dashboard items
const DashboardItemCard = ({ to, icon, title, description, disabled = false }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
                transform: disabled ? 'none' : 'translateY(-4px)',
                boxShadow: disabled ? 'none' : 6,
            }
        }}>
            <CardContent sx={{ textAlign: 'center' }}>
                {icon && React.cloneElement(icon, { sx: { fontSize: 48, mb: 2, color: disabled ? 'action.disabled' : 'primary.main' } })}
                <Typography variant="h6" component="div" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', p:2 }}>
                <Button
                    component={disabled ? undefined : RouterLink} // Only apply RouterLink if not disabled
                    to={disabled ? undefined : to}
                    variant={disabled ? "outlined" : "contained"}
                    color="primary"
                    fullWidth
                    disabled={disabled}
                >
                    {disabled ? "Coming Soon" : "Go to " + title.split(' ')[0]}
                </Button>
            </CardActions>
        </Card>
    </Grid>
);


function TrainerDashboardPage() {
  const { authState } = useContext(AuthContext);
  const theme = useTheme();

  const dashboardItems = [
    {
      to: "/trainer/profile",
      icon: <AccountCircle />,
      title: "My Profile",
      description: "Update your personal details, specializations, and availability."
    },
    {
      // to: "/trainer/schedule",
      icon: <EventNote />,
      title: "My Schedule",
      description: "View your upcoming classes and appointments.",
      disabled: true
    },
    {
      // to: "/trainer/my-classes",
      icon: <ClassIcon />,
      title: "My Classes",
      description: "Manage attendees and details for your assigned classes.",
      disabled: true
    },
  ];

  return (
    <Container
        maxWidth="lg"
        sx={{
            mt: 4,
            mb: 4,
            py: 3,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
            borderRadius: 2
        }}
    >
      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DashboardIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom sx={{flexGrow: 1}}>
            Welcome, {authState.user?.firstName || authState.user?.username}!
            </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          This is your dashboard. From here, you can manage your profile and view your schedule.
        </Typography>
        <Divider sx={{my: 2}} />

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {dashboardItems.map(item => (
              <DashboardItemCard
                key={item.title}
                to={item.to}
                icon={item.icon}
                title={item.title}
                description={item.description}
                disabled={item.disabled}
              />
            ))}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default TrainerDashboardPage;
