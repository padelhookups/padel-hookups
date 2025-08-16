import { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import { Devices } from "@mui/icons-material";

const MyDevices = () => {
  const ua = useMemo(() => {
    try {
      return navigator.userAgent || "Unknown device";
    } catch {
      return "Unknown device";
    }
  }, []);

  const platform = useMemo(() => {
    try {
      return navigator.platform || "Unknown platform";
    } catch {
      return "Unknown platform";
    }
  }, []);

  return (
    <>
      <Paper
        sx={{
          borderRadius: 0,
          bgcolor: "#b88f34",
          color: "white",
          pt: "env(safe-area-inset-top)"
        }}
      >
        <Box sx={{ py: 3, px: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
            📱 My Devices
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, pl: 1 }}>
            View and manage where your account is signed in
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ p: 3, pb: 3 }}>
        <Card>
          <List>
            <ListItem>
              <ListItemText
                primary="This device"
                secondary={`${platform} • ${ua}`}
              />
              <Devices color="action" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Other devices"
                secondary="No other devices detected"
              />
            </ListItem>
          </List>
        </Card>
      </Box>
    </>
  );
};

export default MyDevices;
