import React from 'react';
import { getAuth } from 'firebase/auth';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Email,
  Person,
  VerifiedUser,
  CalendarToday,
  Edit
} from '@mui/icons-material';

const Profile = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Avatar 
            sx={{ 
              width: 100, 
              height: 100, 
              mx: 'auto', 
              mb: 2, 
              fontSize: '2rem',
              bgcolor: 'primary.main'
            }}
          >
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'P'}
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            {user?.displayName || 'Player'}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {user?.email}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip 
              icon={<VerifiedUser />}
              label={user?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
              color={user?.emailVerified ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* User Information */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Your Information
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText 
              primary="Display Name" 
              secondary={user?.displayName || 'Not set'} 
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Email />
            </ListItemIcon>
            <ListItemText 
              primary="Email" 
              secondary={user?.email} 
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <CalendarToday />
            </ListItemIcon>
            <ListItemText 
              primary="Member Since" 
              secondary={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'} 
            />
          </ListItem>
        </List>
      </Card>

      {/* Padel Stats */}
      {/* <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Padel Stats
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" component="div" color="primary.main" sx={{ fontWeight: 'bold' }}>
              0
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Matches Played
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" component="div" color="warning.main" sx={{ fontWeight: 'bold' }}>
              ⭐
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Beginner
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" component="div" color="info.main" sx={{ fontWeight: 'bold' }}>
              -
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Position
            </Typography>
          </Paper>
        </Grid>
      </Grid> */}

      {/* Action Button */}
      <Button 
        variant="contained" 
        size="large" 
        startIcon={<Edit />}
        fullWidth
        sx={{ mt: 2, color: 'white' }}
      >
        <Typography
          variant="button"
        >
          Edit Profile
        </Typography>
      </Button>
    </Box>
  );
};

export default Profile;
