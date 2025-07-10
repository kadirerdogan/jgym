require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Basic Route
app.get('/', (req, res) => {
  res.send('Gym Management Backend API Running');
});

// Define Auth Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/users', require('./routes/users'));
app.use('/api/trainer-profiles', require('./routes/trainerProfiles'));
app.use('/api/classtypes', require('./routes/classTypes'));
app.use('/api/scheduledclasses', require('./routes/scheduledClasses'));
app.use('/api/bookings', require('./routes/bookings')); // Add Booking routes

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym_management_db_default';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1); // Exit process with failure
  });

// Global error handler (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app; // Export the app for supertest
