import { useState } from "react";
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
	Divider,
	Typography,
	Paper
} from "@mui/material";
import { Lock, Email, Logout, Security, Devices } from "@mui/icons-material";

import NotificationPermissionModal from "../components/NotificationPermissionModal";

const Settings = () => {
	const { user } = useAuth();
	const auth = getAuth();
	const navigate = useNavigate();

	const [notificationsChecked, setNotificationsChecked] = useState(false);
	const [openNotifications, setOpenNotifications] = useState(false);

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

	const handleMyDevices = () => {
		navigate("/MyDevices");
	};

	return (
		<>
			<Paper
				sx={{
					borderRadius: 0,
					bgcolor: "#b88f34",
					color: "white",
					/* Push header below iOS notch */
					pt: "env(safe-area-inset-top)"
				}}>
				<Box sx={{ py: 3, px: 2 }}>
					<Typography
						variant='h4'
						component='h1'
						sx={{ fontWeight: "bold", mb: 1 }}>
						⚙️ Settings
					</Typography>
					<Typography variant='body1' sx={{ opacity: 0.9, pl: 1 }}>
						Manage your account and preferences
					</Typography>
				</Box>
			</Paper>

			<Box
				sx={{
					p: 3,
					/* Remove huge extra space; container already pads for bottom nav */
					pb: 3
				}}>
				{/* Account Settings */}
				<Typography
					variant='h6'
					component='h2'
					gutterBottom
					sx={{ fontWeight: "bold" }}>
					Account Settings
				</Typography>
				<Card sx={{ mb: 3 }}>
					<List>
						<ListItem>
							<ListItemText
								sx={{ width: "60%", flex: "unset !important" }}
								primary='Change Password'
								secondary='Update your account password'
							/>
							<Button
								sx={{ ml: "auto" }}
								variant='outlined'
								startIcon={<Lock />}
								onClick={handleChangePassword}>
								Change
							</Button>
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
						<ListItem>
							<ListItemText
								sx={{ width: "95%", flex: "unset !important" }}
								primary='Push Notifications'
								secondary='Receive push notifications on your device'
							/>

							<Switch
								sx={{ ml: "auto" }}
								checked={notificationsChecked}
								onChange={(e) => {									
									if (e.target.checked) {
										setOpenNotifications(true);
									}else {
										// import firebase from "../firebase-config"; and set to false
									}
								}}
							/>
						</ListItem>

						<Divider />

						<ListItem>
							<ListItemText
								sx={{ width: "95%", flex: "unset !important" }}
								primary='My Devices'
								secondary='View and manage logged-in devices'
							/>
							<Button
								sx={{ ml: "auto" }}
								variant='outlined'
								startIcon={<Devices />}
								onClick={handleMyDevices}>
								Open
							</Button>
						</ListItem>
					</List>
				</Card>

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
			<NotificationPermissionModal
				open={openNotifications}
				onClose={(accepted) => {
					setOpenNotifications(false);
					if (accepted) {
						setNotificationsChecked(true);
					} else {
						setNotificationsChecked(false);
					}
				}}></NotificationPermissionModal>
		</>
	);
};

export default Settings;
