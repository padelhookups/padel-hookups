import React from 'react';
import { getAuth } from 'firebase/auth';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Paper
} from '@mui/material';
import {
  CalendarMonth,
  People,
  Star
} from '@mui/icons-material';

const Home = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  console.log("HOME");

  return (
    <Box sx={{ p: 0, pb: 12 }}>
      {/* Welcome Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #b88f34 0%, #d4af37 50%, #b8860b 100%)', color: 'white' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'P'}
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Player'}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Ready for your next padel adventure? 🎾
          </Typography>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {/* <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            fullWidth
            sx={{ 
              py: 2, 
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            Find a Match
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<CalendarMonth />}
            sx={{ 
              py: 2,
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' }
            }}
          >
            Book a Court
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<People />}
            sx={{ 
              py: 2,
              backgroundColor: '#0288d1',
              '&:hover': { backgroundColor: '#0277bd' }
            }}
          >
            Invite Friends
          </Button>
        </Grid>
      </Grid> */}

      {/* Recent Activity */}
      {/* <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Recent Activity
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.light' }}>
              🎾
            </Avatar>
            <Box>
              <Typography variant="h6" component="h3">
                Welcome to Padel Hookups!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete your profile to start finding matches
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card> */}

      {/* Stats Dashboard */}
      <Typography variant="h5" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Your Stats
      </Typography>
      <Grid container spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" component="div" color="primary.main" sx={{ fontWeight: 'bold' }}>
              0
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Matches Played
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" component="div" color="success.main" sx={{ fontWeight: 'bold' }}>
              0
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Wins
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Star sx={{ fontSize: 40, color: 'warning.main', mb: 0.5 }} />
            <Typography variant="caption" color="text.secondary" display="block">
              Skill Level
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
