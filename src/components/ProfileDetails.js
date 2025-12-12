import {
  Typography,
  Card,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  Email,
  Person,
  CalendarToday,
  Edit,
  Cake,
  WavingHand,
  ShowChart,
} from "@mui/icons-material";

const ProfileDetails = ({ user, dateOfBirth, onEditClick }) => {
  return (
    <>
      <Typography
        variant='h5'
        component='h2'
        gutterBottom
        sx={{ fontWeight: "bold" }}>
        {onEditClick ? "Your Information" : "Player Information"}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText
              primary='Display Name'
              secondary={user?.displayName || "Not set"}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Email />
            </ListItemIcon>
            <ListItemText
              primary='Email'
              secondary={user?.email}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Cake />
            </ListItemIcon>
            <ListItemText
              primary='Date of Birth'
              secondary={
                dateOfBirth
                  ? dateOfBirth?.format("MM/DD/YYYY")
                  : "Not set"
              }
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <CalendarToday />
            </ListItemIcon>
            <ListItemText
              primary='Member Since'
              secondary={
                user?.metadata?.creationTime
                  ? new Date(
                    user.metadata.creationTime
                  ).toLocaleDateString()
                  : "Unknown"
              }
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <WavingHand />
            </ListItemIcon>
            <ListItemText
              primary="Best Hand"
              secondary={user?.BestHand || "Not set"}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <ShowChart />
            </ListItemIcon>
            <ListItemText
              primary="Player Level"
              secondary={user?.PlayerLevel || "Not set"}
            />
          </ListItem>
        </List>
      </Card>
      {onEditClick && (
        <Button
          variant='contained'
          size='large'
          startIcon={<Edit />}
          fullWidth
          sx={{ mt: 2, color: "white" }}
          onClick={onEditClick}>
          <Typography variant='button'>Edit Profile</Typography>
        </Button>
      )}
    </>
  );
};

export default ProfileDetails;
