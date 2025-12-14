import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getAuth, signOut } from "firebase/auth";
import {
	getFirestore,
	doc,
	getDoc,
	setDoc,
	Timestamp,
	updateDoc
} from "firebase/firestore";
import firebase from "../firebase-config";
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
import { Lock, Logout, Security, Devices } from "@mui/icons-material";

import NotificationPermissionModal from "../components/NotificationPermissionModal";

const Settings = () => {
	const { user } = useAuth();
	const auth = getAuth();
	const navigate = useNavigate();
	const db = getFirestore();

	const [notificationsChecked, setNotificationsChecked] = useState(false);
	const [openNotifications, setOpenNotifications] = useState(false);
	const [messagingToken, setMessagingToken] = useState(() =>
		firebase.messagingToken
	);

	useEffect(() => {
		const messagingToken = localStorage.getItem("messagingToken");
		console.log("Messaging Token:", messagingToken);

		if (!user) return;
		if (!messagingToken) {
			return;
		}
		const ref = doc(db, "Users", user?.uid);
		getDoc(ref)
			.then((snap) => {
				if (snap.exists()) {
					const devices = snap.data().Devices || [];
					Object.values(devices).forEach((device) => {
						if (device.Token === messagingToken) {
							setNotificationsChecked(
								Boolean(device.SendNotifications)
							);
						}
					});
				}
			})
			.catch((err) =>
				console.error("Error loading notification setting:", err)
			);
	}, [db, user]);

	const handleSignOut = async () => {
		try {
			if (user) {
				const userRef = doc(db, "Users", user.uid);
				const tokenToDelete = localStorage.getItem("messagingToken");
				
				if (tokenToDelete) {
					const snap = await getDoc(userRef);
					if (snap.exists()) {
						const devices = snap.data().Devices || {};
						delete devices[tokenToDelete];
						await updateDoc(userRef, { Devices: devices });
					}
				}
			}
			localStorage.removeItem("messagingToken");
			localStorage.removeItem("messagingTokenPending");
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
					height: 150,
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
					height: "Calc(100vh - 258px - env(safe-area-inset-bottom))",
					overflow: "auto",
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
									const isOn = e.target.checked;
									if (isOn) {
										setOpenNotifications(true);
									} else {
										setNotificationsChecked(false);
										if (user) {
											const userRef = doc(
												db,
												"Users",
												user?.uid
											);
											setDoc(
												userRef,
												{
													Devices: {
														[localStorage.getItem(
															"messagingToken"
														)]: {
															SendNotifications: false,
															UpdatedAt:
																Timestamp.now()
														}
													}
												},
												{ merge: true }
											);
										}
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
				notificationsChecked={notificationsChecked}
				onClose={(accepted) => {
					setOpenNotifications(false);
					setNotificationsChecked(accepted);
				}}></NotificationPermissionModal>
		</>
	);
};

export default Settings;
