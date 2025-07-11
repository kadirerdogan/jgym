import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, CircularProgress, Alert, Grid, Card, CardContent, CardActions, Button, Chip,
  CardMedia, useTheme, ListItem, ListItemIcon, ListItemText, Icon, Divider // Added Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
    FitnessCenter as FitnessCenterIcon, Pool as PoolIcon, SportsTennis as SportsTennisIcon,
    NaturePeople as YogaIcon, DevicesOther as OtherIcon, Groups as MeetingRoomIcon,
    Build as MaintenanceIcon, People as PeopleIcon // Added PeopleIcon
} from '@mui/icons-material'; // Example icons

// import AuthContext from '../../context/AuthContext'; // If needed for booking actions

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to get an icon based on facility type
const getFacilityTypeIcon = (type) => {
  const typeLower = type?.toLowerCase() || '';
  if (typeLower.includes('pool')) return <PoolIcon fontSize="inherit" />;
  if (typeLower.includes('court') || typeLower.includes('tennis') || typeLower.includes('squash')) return <SportsTennisIcon fontSize="inherit" />;
  if (typeLower.includes('yoga') || typeLower.includes('studio')) return <YogaIcon fontSize="inherit" />;
  if (typeLower.includes('meeting')) return <MeetingRoomIcon fontSize="inherit" />;
  if (typeLower.includes('gym') || typeLower.includes('equipment') || typeLower.includes('cardio') || typeLower.includes('weight')) return <FitnessCenterIcon fontSize="inherit" />;
  return <OtherIcon fontSize="inherit" />;
};

function ViewFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme(); // For consistent theme usage

  useEffect(() => {
    const fetchActiveFacilities = async () => {
      setLoading(true);
      setError('');
      try {
        // This endpoint GET /api/facilities returns active facilities
        const response = await axios.get(`${API_URL}/facilities`);
        setFacilities(response.data);
      } catch (err) {
        console.error("Error fetching active facilities:", err);
        setError(err.response?.data?.msg || 'Failed to fetch facilities.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveFacilities();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="xl" // Allow more width for cards
      sx={{
        mt: 4,
        mb: 4,
        py: 3,
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <FitnessCenterIcon color="primary" sx={{ fontSize: {xs: 30, md: 40}, mr: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', color: 'primary.main', mb:0 }}>
          Our Gym Facilities
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, mx: 'auto', width: 'fit-content' }}>{error}</Alert>}

      {facilities.length === 0 && !loading && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
          No facilities currently listed or available. Please check back later.
        </Typography>
      )}

      <Grid container spacing={3} justifyContent="center">
        {facilities.map((facility) => (
          <Grid item key={facility._id} xs={12} sm={6} md={4} lg={3}> {/* Adjusted grid sizing */}
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
              },
              border: facility.status !== 'Available' || !facility.isActive ? '1px dashed' : 'none',
              borderColor: facility.status !== 'Available' || !facility.isActive ? 'action.disabled' : 'transparent',
            }}>
              <CardMedia
                sx={{
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: facility.status === 'Available' && facility.isActive ? theme.palette.secondary.light : theme.palette.grey[300],
                  color: facility.status === 'Available' && facility.isActive ? theme.palette.secondary.contrastText : theme.palette.grey[700],
                  fontSize: '4rem' // Icon size
                }}
              >
                {getFacilityTypeIcon(facility.type)}
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom color="secondary.dark">
                  {facility.name}
                </Typography>

                <ListItem dense disableGutters sx={{py:0.5}}>
                  <ListItemIcon sx={{minWidth: '36px'}}><Icon component={getFacilityTypeIcon(facility.type).type} fontSize="small" color="action" /></ListItemIcon>
                  <ListItemText primary="Type" secondary={facility.type} />
                </ListItem>
                <ListItem dense disableGutters sx={{py:0.5}}>
                  <ListItemIcon sx={{minWidth: '36px'}}><PeopleIcon fontSize="small" color="action" /></ListItemIcon> {/* Assuming PeopleIcon is imported or use an alternative */}
                  <ListItemText primary="Capacity" secondary={facility.capacity} />
                </ListItem>

                <Chip
                    icon={facility.status === 'Under Maintenance' ? <MaintenanceIcon fontSize="small"/> : null}
                    label={facility.status}
                    color={facility.status === 'Available' ? 'success' : facility.status === 'Under Maintenance' ? 'warning' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, mb: 1.5, fontWeight:'medium' }}
                />
                <Typography variant="body2" color="text.secondary" paragraph sx={{minHeight: '40px'}}>
                  {facility.description.length > 100 ? facility.description.substring(0, 97) + "..." : facility.description}
                </Typography>
                {facility.notes && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{mt:1, fontStyle: 'italic'}}>
                        Note: {facility.notes}
                    </Typography>
                )}
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'flex-end', p: 1.5, backgroundColor: theme.palette.action.hover }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to={`/facilities/${facility._id}/availability`}
                  disabled={facility.status !== 'Available' || !facility.isActive}
                  size="small"
                >
                  View Availability & Book
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ViewFacilitiesPage;
