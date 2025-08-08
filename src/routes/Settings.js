import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Card,
  Button,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Grid
} from '@mui/material';
import {
  Lock,
  Email,
  Logout,
  Security,
  NotificationsActive
} from '@mui/icons-material';

const Settings = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>

      {/* Account Settings */}
      <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>
        Account Settings
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Change Password" 
              secondary="Update your account password"
            />
            <ListItemSecondaryAction>
              <Button variant="outlined" startIcon={<Lock />}>
                Change
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Update Email" 
              secondary="Change your email address"
            />
            <ListItemSecondaryAction>
              <Button variant="outlined" startIcon={<Email />}>
                Update
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Card>

      {/* Notification Settings */}
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Notifications
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Push Notifications" 
              secondary="Receive push notifications on your device"
            />
            <ListItemSecondaryAction>
              <Switch defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Card>

      {/* Privacy Settings */}
      {/* <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Privacy
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Profile Visibility" 
              secondary="Show your profile to other players"
            />
            <ListItemSecondaryAction>
              <Switch defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Match Invitations" 
              secondary="Allow other players to invite you to matches"
            />
            <ListItemSecondaryAction>
              <Switch defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Card> */}

      {/* Quick Actions */}
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<Security />}
            sx={{ py: 1.5 }}
          >
            Security Settings
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<NotificationsActive />}
            sx={{ py: 1.5 }}
          >
            Notification Center
          </Button>
        </Grid>
      </Grid>

      {/* Danger Zone */}
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Danger Zone
        </Typography>
        <Typography variant="body2">
          This action will sign you out of your account.
        </Typography>
      </Alert>
      
      <Button 
        variant="contained" 
        color="error" 
        size="large"
        startIcon={<Logout />}
        fullWidth
        onClick={handleSignOut}
        sx={{ mt: 1 }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default Settings;
