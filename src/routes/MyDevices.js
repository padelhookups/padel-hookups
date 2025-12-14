import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import useAuth from "../utils/useAuth";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";

const MyDevices = () => {
  const db = getFirestore();
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDevices = async () => {
      console.log('fetchDevices');
      
      if (!user) {
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const devicesData = userDoc.data().Devices || {};
          console.log(devicesData[Object.keys(devicesData)[0]].UpdatedAt);
          
          // Convert object to array of entries
          setDevices(Object.entries(devicesData).map(([key, value]) => ({ id: key, ...value })));
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [user]);

  const handleDeleteDevice = async (deviceId) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const devicesData = userDoc.data().Devices || {};
        delete devicesData[deviceId];
        
        await updateDoc(userDocRef, { Devices: devicesData });
        
        // Update local state
        setDevices(devices.filter(device => device.id !== deviceId));
      }
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card>
            <List>
              {devices.length > 0 ? (
                devices.map((device, index) => (
                  <div key={device.id || index}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleDeleteDevice(device.id)}>
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={device.name || `Device ${index + 1}`}
                        secondary={`${device.Platform || 'Unknown'} • Last active: ${device.UpdatedAt ? device.UpdatedAt.toDate().toLocaleDateString() : 'Unknown'}`}
                      />
                    </ListItem>
                    {index < devices.length - 1 && <Divider />}
                  </div>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="Other devices"
                    secondary="No other devices detected"
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}
      </Box>
    </>
  );
};

export default MyDevices;
