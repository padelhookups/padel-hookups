import { useState, useEffect } from "react";
import {
	Box,
	Paper,
	Typography,
	Card,
	List,
	ListItem,
	ListItemText,
	Switch,
	Divider,
	CircularProgress
} from "@mui/material";
import useAuth from "../utils/useAuth";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";

const NotificationPreferences = () => {
	const db = getFirestore();
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [preferences, setPreferences] = useState({
		Birthdays: false,
		Community_News: false,
	});

	useEffect(() => {
		const fetchPreferences = async () => {
			if (!user) {
				return;
			}

			try {
				const userDoc = await getDoc(doc(db, "Users", user.uid));
				if (userDoc.exists()) {
					const notificationPrefs = userDoc.data().NotificationPrefs || {};
					setPreferences({
						Birthdays: notificationPrefs.Birthdays || false,
						Community_News: notificationPrefs.Community_News || false,
					});
				}
			} catch (error) {
				console.error("Error fetching notification preferences:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchPreferences();
	}, [user, db]);

	const handleToggle = async (prefKey) => {
		if (!user) return;

		const newValue = !preferences[prefKey];
		setPreferences((prev) => ({
			...prev,
			[prefKey]: newValue
		}));

		try {
			await updateDoc(doc(db, "Users", user.uid), {
				[`NotificationPrefs.${prefKey}`]: newValue
			});
		} catch (error) {
			console.error("Error updating notification preference:", error);
			// Revert on error
			setPreferences((prev) => ({
				...prev,
				[prefKey]: !newValue
			}));
		}
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
						🔔 Notification Preferences
					</Typography>
					<Typography variant='body1' sx={{ opacity: 0.9, pl: 1 }}>
						Choose which notifications you want to receive
					</Typography>
				</Box>
			</Paper>

			<Box
				sx={{
					p: 3,
					height: "Calc(100vh - 258px - env(safe-area-inset-bottom))",
					overflow: "auto"
				}}>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%"
						}}>
						<CircularProgress />
					</Box>
				) : (
					<Card>
						<List>
							<ListItem>
								<ListItemText
									sx={{
										width: "95%",
										flex: "unset !important"
									}}
									primary='Birthday Notifications'
									secondary='Get notified on your birthday'
								/>
								<Switch
									sx={{ ml: "auto" }}
									checked={preferences.Birthdays}
									onChange={() => handleToggle("Birthdays")}
								/>
							</ListItem>
							<Divider />
							<ListItem>
								<ListItemText
									sx={{
										width: "95%",
										flex: "unset !important"
									}}
									primary='Community News'
									secondary='Get notified about new community posts'
								/>
								<Switch
									sx={{ ml: "auto" }}
									checked={preferences.Community_News}
									onChange={() => handleToggle("Community_News")}
								/>
							</ListItem>
						</List>
					</Card>
				)}
			</Box>
		</>
	);
};

export default NotificationPreferences;
