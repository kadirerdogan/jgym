import React, { useContext } from 'react';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Box, CircularProgress,
  Paper, List, ListItemIcon, ListItemText, ListItemButton, Divider, useTheme // Added ListItemButton, Divider, useTheme
} from '@mui/material';

import AuthContext from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute'; // Import AdminRoute
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PlanListPage from './components/admin/plans/PlanListPage';
import PlanForm from './components/admin/plans/PlanForm';
import ViewPlansPage from './components/plans/ViewPlansPage';
import FacilityListPage from './components/admin/facilities/FacilityListPage';
import FacilityForm from './components/admin/facilities/FacilityForm';
import ViewFacilitiesPage from './components/facilities/ViewFacilitiesPage';
import UserListPage from './components/admin/users/UserListPage';
import UserEditForm from './components/admin/users/UserEditForm';
import ProfilePage from './components/user/ProfilePage';
import TrainerRoute from './components/routing/TrainerRoute';
import TrainerDashboardPage from './components/trainer/TrainerDashboardPage';
import TrainerProfileForm from './components/trainer/TrainerProfileForm';
import ClassTypeListPage from './components/admin/classTypes/ClassTypeListPage';
import ClassTypeForm from './components/admin/classTypes/ClassTypeForm';
import ScheduledClassListPage from './components/admin/scheduledClasses/ScheduledClassListPage';
import ScheduledClassForm from './components/admin/scheduledClasses/ScheduledClassForm';
import FacilityAvailabilityPage from './components/facilities/FacilityAvailabilityPage'; // Import FacilityAvailabilityPage
import MyBookingsPage from './components/user/MyBookingsPage'; // Import MyBookingsPage
import ViewScheduledClassesPage from './components/classes/ViewScheduledClassesPage'; // Import for class booking
import ScheduledClassDetailsPage from './components/classes/ScheduledClassDetailsPage';

import { Link as RouterLink } from 'react-router-dom';
// Paper, List, ListItem, ListItemText, ListItemIcon are already imported above if needed by other dashboards
// For AdminDashboardPage, specific icons are imported directly.
import {
  Settings, People, FitnessCenter, Description, Class as ClassIcon,
  Schedule as ScheduleIcon, BookOnline, EventAvailable, Dashboard as DashboardIcon
} from '@mui/icons-material';


// HomePage Component
function HomePage() {
  return (
    <Box sx={{ marginTop: 4, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        Welcome to GymPro!
      </Typography>
      <Typography variant="h6" color="textSecondary" paragraph>
        Your ultimate solution for gym management. Streamline memberships, facilities, and more.
      </Typography>
      <Button component={RouterLink} to="/plans" variant="contained" color="secondary" size="large" sx={{mr: 2}}>
        View Membership Plans
      </Button>
      <Button component={RouterLink} to="/facilities" variant="outlined" color="secondary" size="large">
        Explore Our Facilities
      </Button>
    </Box>
  );
}

// LoginPage and RegisterPage are now imported

// The first, older DashboardPage declaration was here and has been removed.

// Member Dashboard Component (DashboardPage) - This is the enhanced version to keep.
function DashboardPage() {
  const theme = useTheme();
  return (
    <Container maxWidth="lg" sx={{ mt: 4, py: 3, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100], borderRadius: 2 }}>
      <Paper elevation={4} sx={{ p: {xs: 2, md: 4} }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DashboardIcon color="primary" sx={{ fontSize: 40, mr: 2 }}/>
          <Typography variant="h4" component="h1" gutterBottom sx={{flexGrow: 1}}>
            Member Dashboard
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Welcome to your personal dashboard. Here you can manage your profile and view gym information.
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List component="nav" aria-label="member dashboard navigation">
          <ListItemButton component={RouterLink} to="/profile">
            <ListItemIcon><Settings color="primary" /></ListItemIcon>
            <ListItemText primary="My Profile" primaryTypographyProps={{fontWeight: 'medium'}} />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/my-bookings">
            <ListItemIcon><BookOnline color="primary" /></ListItemIcon>
            <ListItemText primary="My Bookings (Facilities & Classes)" primaryTypographyProps={{fontWeight: 'medium'}} />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/classes">
            <ListItemIcon><EventAvailable color="primary" /></ListItemIcon>
            <ListItemText primary="View & Book Classes" primaryTypographyProps={{fontWeight: 'medium'}}/>
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/plans">
            <ListItemIcon><Description color="primary" /></ListItemIcon>
            <ListItemText primary="View Membership Plans" primaryTypographyProps={{fontWeight: 'medium'}}/>
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/facilities">
            <ListItemIcon><FitnessCenter color="primary" /></ListItemIcon>
            <ListItemText primary="Explore Facilities" primaryTypographyProps={{fontWeight: 'medium'}}/>
          </ListItemButton>
        </List>
      </Paper>
    </Container>
  );
}

// Admin Dashboard Component
function AdminDashboardPage() {
  const theme = useTheme();
  return (
    <Container maxWidth="lg" sx={{ mt: 4, py: 3, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100], borderRadius: 2 }}>
      <Paper elevation={4} sx={{ p: {xs: 2, md: 4} }}> {/* Increased padding and elevation slightly */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DashboardIcon color="secondary" sx={{ fontSize: 40, mr: 2 }}/>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'secondary.main', flexGrow: 1 }}> {/* Use theme color */}
            Admin Dashboard
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Manage all aspects of the gym from this central hub.
        </Typography>
        <Divider sx={{my: 2}} />
        <List component="nav" aria-label="admin dashboard navigation">
          <ListItemButton component={RouterLink} to="/admin/users">
            <ListItemIcon><People color="secondary" /></ListItemIcon>
            <ListItemText primary="Manage Users" secondary="View, edit, and manage member and trainer accounts."/>
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/admin/plans">
            <ListItemIcon><Description color="secondary" /></ListItemIcon>
            <ListItemText primary="Manage Membership Plans" secondary="Create, update, and set visibility for plans."/>
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/admin/facilities">
            <ListItemIcon><FitnessCenter color="secondary" /></ListItemIcon>
            <ListItemText primary="Manage Facilities" secondary="Oversee gym areas, equipment, and their settings."/>
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/admin/classtypes">
            <ListItemIcon><ClassIcon color="secondary" /></ListItemIcon>
            <ListItemText primary="Manage Class Types" secondary="Define types of classes offered (e.g., Yoga, HIIT)."/>
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/admin/scheduledclasses">
            <ListItemIcon><ScheduleIcon color="secondary" /></ListItemIcon>
            <ListItemText primary="Manage Class Schedules" secondary="Schedule classes, assign trainers, and manage bookings."/>
          </ListItemButton>
          {/* Consider adding more direct links or summary data here in future */}
        </List>
      </Paper>
    </Container>
  );
}

// Main App Component
function App() {
  const { authState, logout } = useContext(AuthContext);
  const navigate = useNavigate(); // For programmatic navigation after logout

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page after logout
  };

  if (authState.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    // Router is already in index.js via AuthProvider,
    // but App is often where Router is placed if not using context providers that need it above.
    // For this structure, ensure Router is high enough. If AuthProvider is in index.js,
    // Router should wrap AuthProvider or be inside it, wrapping App.
    // Let's assume Router is correctly placed in index.js or here.
    // For simplicity with useNavigate hook, Router needs to be an ancestor.
    // It's conventional to have one top-level Router.
    // The current setup in index.js has <Router><AuthProvider><App/></AuthProvider></Router>.
    // App.js is now correctly a descendant of Router, so hooks like useNavigate work.
    // The <Router> declaration within App.js is no longer needed and should be removed.

      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              GymPro
            </Typography>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/plans">View Plans</Button>
            <Button color="inherit" component={Link} to="/facilities">View Facilities</Button>
            <Button color="inherit" component={Link} to="/classes">View Classes</Button>
            {authState.isAuthenticated ? (
              <>
                <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
                <Button color="inherit" component={Link} to="/profile">My Profile</Button>
                {authState.user?.role === 'admin' && (
                  <Button color="inherit" component={Link} to="/admin/dashboard">Admin Dashboard</Button>
                )}
                {authState.user?.role === 'trainer' && (
                  <Button color="inherit" component={Link} to="/trainer/dashboard">Trainer Dashboard</Button>
                )}
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">Login</Button>
                <Button color="inherit" component={Link} to="/register">Register</Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Container sx={{ marginTop: 3 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/plans" element={<ViewPlansPage />} />
            <Route path="/facilities" element={<ViewFacilitiesPage />} /> {/* Route for ViewFacilitiesPage */}

            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="/profile" element={<PrivateRoute />}>
              <Route index element={<ProfilePage />} />
            </Route>
            <Route path="/facilities/:facilityId/availability" element={<PrivateRoute />}> {/* Protected, as booking requires login */}
              <Route index element={<FacilityAvailabilityPage />} />
            </Route>
            <Route path="/my-bookings" element={<PrivateRoute />}>
              <Route index element={<MyBookingsPage />} />
            </Route>

            {/* Class Booking Routes for Members */}
            <Route path="/classes" element={<PrivateRoute />}> {/* Classes list should be private for members to book */}
              <Route index element={<ViewScheduledClassesPage />} />
            </Route>
            <Route path="/classes/:id" element={<PrivateRoute />}> {/* Class details and booking also private */}
              <Route index element={<ScheduledClassDetailsPage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<AdminRoute />}> {/* Base for admin section */}
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="plans" element={<PlanListPage />} />
              <Route path="plans/new" element={<PlanForm />} />
              <Route path="plans/edit/:planId" element={<PlanForm />} />
              <Route path="facilities" element={<FacilityListPage />} />
              <Route path="facilities/new" element={<FacilityForm />} />
              <Route path="facilities/edit/:facilityId" element={<FacilityForm />} />
              <Route path="users" element={<UserListPage />} />
              <Route path="users/edit/:userId" element={<UserEditForm />} />
              <Route path="classtypes" element={<ClassTypeListPage />} />
              <Route path="classtypes/new" element={<ClassTypeForm />} />
              <Route path="classtypes/edit/:classTypeId" element={<ClassTypeForm />} />
              <Route path="scheduledclasses" element={<ScheduledClassListPage />} />
              <Route path="scheduledclasses/new" element={<ScheduledClassForm />} />
              <Route path="scheduledclasses/edit/:scheduledClassId" element={<ScheduledClassForm />} />
            </Route>

            {/* Trainer Protected Routes */}
            <Route path="/trainer" element={<TrainerRoute />}>
              <Route path="dashboard" element={<TrainerDashboardPage />} />
              <Route path="profile" element={<TrainerProfileForm />} />
              {/* Add more trainer-specific routes here, e.g., for schedule, classes */}
            </Route>

            {/* TODO: Add more routes for other features */}
          </Routes>
        </Container>
      </>
  );
}

export default App;
