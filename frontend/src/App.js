import React, { useContext } from 'react'; // Import useContext
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { AppBar, Toolbar, Typography, Button, Container, Box, CircularProgress } from '@mui/material'; // Import CircularProgress

import AuthContext from './context/AuthContext'; // Import AuthContext
import PrivateRoute from './components/routing/PrivateRoute'; // Import PrivateRoute
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
import ScheduledClassDetailsPage from './components/classes/ScheduledClassDetailsPage'; // Import for class booking

import { Link as RouterLink } from 'react-router-dom';
import { Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Settings, People, FitnessCenter, Description, Class as ClassIcon, Schedule as ScheduleIcon, BookOnline, EventAvailable } from '@mui/icons-material'; // Added BookOnline for MyBookings, EventAvailable for classes

// Placeholder Components (can be moved to separate files later)
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

function DashboardPage() { // Member Dashboard
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Member Dashboard</Typography>
        <Typography variant="body1" paragraph>
          Welcome to your personal dashboard. Here you can manage your profile and view gym information.
        </Typography>
        <List>
          <ListItem button component={RouterLink} to="/profile">
            <ListItemIcon><Settings /></ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItem>
          <ListItem button component={RouterLink} to="/plans">
            <ListItemIcon><Description /></ListItemIcon>
            <ListItemText primary="View Membership Plans" />
          </ListItem>
          <ListItem button component={RouterLink} to="/facilities">
            <ListItemIcon><FitnessCenter /></ListItemIcon>
            <ListItemText primary="View Facilities" />
          </ListItem>
           <ListItem button component={RouterLink} to="/my-bookings">
            <ListItemIcon><BookOnline /></ListItemIcon>
            <ListItemText primary="My Facility Bookings" />
          </ListItem>
          <ListItem button component={RouterLink} to="/classes">
            <ListItemIcon><EventAvailable /></ListItemIcon>
            <ListItemText primary="View & Book Classes" />
          </ListItem>
          {/* Add more member-specific links here */}
        </List>
      </Paper>
    </Container>
  );
}

function AdminDashboardPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
        <Typography variant="body1" paragraph>
          Manage all aspects of the gym from here.
        </Typography>
        <List>
          <ListItem button component={RouterLink} to="/admin/users">
            <ListItemIcon><People /></ListItemIcon>
            <ListItemText primary="Manage Users (Members/Trainers)" />
          </ListItem>
          <ListItem button component={RouterLink} to="/admin/plans">
            <ListItemIcon><Description /></ListItemIcon>
            <ListItemText primary="Manage Membership Plans" />
          </ListItem>
          <ListItem button component={RouterLink} to="/admin/facilities">
            <ListItemIcon><FitnessCenter /></ListItemIcon>
            <ListItemText primary="Manage Facilities" />
          </ListItem>
          <ListItem button component={RouterLink} to="/admin/classtypes">
            <ListItemIcon><ClassIcon /></ListItemIcon>
            <ListItemText primary="Manage Class Types" />
          </ListItem>
          <ListItem button component={RouterLink} to="/admin/scheduledclasses">
            <ListItemIcon><ScheduleIcon /></ListItemIcon>
            <ListItemText primary="Manage Class Schedules" />
          </ListItem>
          {/* Add more admin links here */}
        </List>
      </Paper>
    </Container>
  );
}


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
