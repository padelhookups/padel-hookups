import { useNavigate } from "react-router";
import { getAuth, signOut } from "firebase/auth";
import useAuth from "../utils/useAuth";
import {
	Alert,
	Box,
	Card,
	Button,
	Switch,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Divider,
	Typography
} from "@mui/material";
import { Lock, Email, Logout, Security } from "@mui/icons-material";

const Settings = () => {
	const { user } = useAuth();
	const auth = getAuth();
	const navigate = useNavigate();

	const handleSignOut = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	const handleAdminSettings = () => {
		navigate("/Admin");
	};

	const handleChangePassword = () => {
		navigate("/ChangePassword");
	};

	return (
		<Box sx={{ p: 3, pb: 12 }}>
			<Typography
				variant='h4'
				component='h1'
				gutterBottom
				sx={{ fontWeight: "bold" }}>
				Settings
			</Typography>

			{/* Account Settings */}
			<Typography
				variant='h6'
				component='h2'
				gutterBottom
				sx={{ mt: 3, fontWeight: "bold" }}>
				Account Settings
			</Typography>
			<Card sx={{ mb: 3 }}>
				<List>
					<ListItem sx={{ flex: "unset !important" }}>
						<ListItemText
							sx={{ width: "60%" }}
							primary='Change Password'
							secondary='Update your account password'
						/>
						<ListItemSecondaryAction>
							<Button
								variant='outlined'
								startIcon={<Lock />}
								onClick={handleChangePassword}>
								Change
							</Button>
						</ListItemSecondaryAction>
					</ListItem>
				</List>
			</Card>

			{/* Notification Settings */}
			<Typography
				variant='h6'
				component='h2'
				gutterBottom
				sx={{ fontWeight: "bold" }}>
				Notifications
			</Typography>
			<Card sx={{ mb: 3 }}>
				<List>
					<ListItem sx={{ flex: "unset !important" }}>
						<ListItemText
							sx={{ width: "80%" }}
							primary='Push Notifications'
							secondary='Receive push notifications on your device'
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
			{user?.IsAdmin && (
				<Button
					variant='outlined'
					fullWidth
					startIcon={<Security />}
					onClick={handleAdminSettings}
					sx={{ py: 1.5 }}>
					Admin Settings
				</Button>
			)}
			{/* Danger Zone */}
			<Alert severity='warning' color='error' sx={{ my: 2 }}>
				<Typography variant='subtitle2' gutterBottom>
					Danger Zone
				</Typography>
				<Typography variant='body2'>
					This action will sign you out of your account.
				</Typography>
			</Alert>

			<Button
				variant='contained'
				color='error'
				size='large'
				startIcon={<Logout />}
				fullWidth
				onClick={handleSignOut}
				sx={{ mt: 1 }}>
				Sign Out
			</Button>
		</Box>
	);
};

export default Settings;
