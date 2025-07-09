import { createTheme } from '@mui/material/styles';

// Define a simple custom theme for the application
const theme = createTheme({
  palette: {
    primary: {
      main: '#0052cc', // A deep blue, adjust as needed
      // light: '#3374d6',
      // dark: '#00398f',
      // contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffc107', // An amber/yellow, adjust as needed
      // light: '#ffcd38',
      // dark: '#b28704',
      // contrastText: '#000000',
    },
    background: {
      default: '#f4f6f8', // A light grey for page backgrounds
      paper: '#ffffff',    // White for Paper components like Cards, Tables
    },
    // You can also customize typography, spacing, breakpoints, etc.
    // typography: {
    //   fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    //   h4: {
    //     fontWeight: 600,
    //   },
    // },
  },
  // Example of component overrides (optional)
  // components: {
  //   MuiButton: {
  //     styleOverrides: {
  //       root: {
  //         borderRadius: 8, // Slightly more rounded buttons
  //       },
  //     },
  //   },
  //   MuiPaper: {
  //       styleOverrides: {
  //           elevation1: {
  //               boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.03)', // Softer shadow for elevation 1
  //           }
  //       }
  //   }
  // }
});

export default theme;
