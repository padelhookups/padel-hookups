import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebase from "../firebase-config";
import useAuth from "../utils/useAuth";
import {
	Box,
	Typography,
	Card,
	Button,
	Avatar,
	Chip,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Divider,
	SwipeableDrawer,
	TextField,
	FormControl,
	InputAdornment,
	Paper
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import dayjs from "dayjs";
import {
	Email,
	Person,
	VerifiedUser,
	CalendarToday,
	Edit,
	Cake
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import SuccessModal from "../components/SuccessModal";
import ConfirmEditModal from "../components/ConfirmEditModal";

/* const iOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const Puller = styled(Box)(({ theme }) => ({
	width: 30,
	height: 6,
	backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
	borderRadius: 3,
	position: "absolute",
	top: 8,
	left: "calc(50% - 15px)"
}));

const StyledBox = styled("div")(({ theme }) => ({
	backgroundColor: "#fff",
	...theme.applyStyles("dark", {
		backgroundColor: grey[800]
	})
})); */

const Profile = () => {
	/* const db = firebase.db;
	const auth = getAuth();
	const currentUser = auth.currentUser;
	const { user } = useAuth();

	const [open, setOpen] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [displayName, setDisplayName] = useState(null);
	const [dateOfBirth, setDateOfBirth] = useState(null);

	const handleUpdateProfile = () => {
		setEditModalOpen(true);
	};

	useEffect(() => {
		if (user) {
			console.log("User data:", user);
			setDisplayName(user?.displayName || "");
			setDateOfBirth(user?.DateOfBirth ? dayjs(user.DateOfBirth.toDate()) : null);
		}
	}, [user]);

	const handleConfirmUpdate = async () => {
		try {
			await updateProfile(currentUser, {
				displayName: displayName
			});

			// Update date of birth in Firestore or another database
			const userRef = doc(db, "Users", user.uid);
			await updateDoc(userRef, {
				DateOfBirth: dateOfBirth
					? Timestamp.fromDate(dateOfBirth.toDate())
					: null,
				BirthdayMonth: dateOfBirth ? dateOfBirth.month() + 1 : null,
				BirthdayDay: dateOfBirth ? dateOfBirth.date() : null
			});
			// Note: Firebase Auth doesn't store custom fields like dateOfBirth
			// You would need to store this in Firestore or another database
			console.log("Profile updated successfully");
			console.log("Date of birth:", dateOfBirth);
			setOpen(false);
			setEditModalOpen(false);
			setShowSuccess(true);
		} catch (error) {
			console.error("Error updating profile:", error);
		}
	}; */

	return (
		<>
			{/* <Paper
				sx={{
					borderRadius: 0,
					bgcolor: "white",
					color: "b88f34",
					textAlign: "center",
					pt: "env(safe-area-inset-top, 0px)",
				}}>
				
				<Box sx={{ py: 3, px: 2 }}>
					<Avatar
						sx={{
							width: 100,
							height: 100,
							mx: "auto",
							mb: 2,
							fontSize: "2rem",
							bgcolor: "primary.main"
						}}>
						{user?.displayName
							? user?.displayName
								.split(" ")
								.map((word) => word.charAt(0))
								.join("")
							: "?"}
					</Avatar>
					<Typography variant='h4' component='h1' gutterBottom>
						{user?.displayName || "Player"}
					</Typography>
					<Typography
						variant='body1'
						color='text.secondary'
						gutterBottom>
						{user?.email}
					</Typography>
					<Box sx={{ mt: 2 }}>
						<Chip
							icon={<VerifiedUser />}
							label={
								user?.emailVerified
									? "Email Verified"
									: "Email Not Verified"
							}
							color={user?.emailVerified ? "success" : "warning"}
							variant='outlined'
						/>
					</Box>
				</Box>
			</Paper> */}
			{/* <Box
				sx={{
					p: 3,
					pb: 12,
					height: "100%"
				}}>
				
				<Typography
					variant='h5'
					component='h2'
					gutterBottom
					sx={{ fontWeight: "bold" }}>
					Your Information
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
					</List>
				</Card>
				<Button
					variant='contained'
					size='large'
					startIcon={<Edit />}
					fullWidth
					sx={{ mt: 2, color: "white" }}
					onClick={() => setOpen(true)}>
					<Typography variant='button'>Edit Profile</Typography>
				</Button>

			</Box>
			<SwipeableDrawer
				sx={{ zIndex: 1300 }}
				anchor='bottom'
				open={open}
				onClose={() => setOpen(false)}
				disableDiscovery
				disableSwipeToOpen={true}
				disableBackdropTransition={!iOS}
				keepMounted>
				<Puller />
				<StyledBox
					sx={{ px: 2, pb: 2, height: "100%", overflow: "auto" }}>

					<Box
						component='form'
						sx={{
							"& > :not(style)": { mt: 4 },
							pt: 4,
							pb: 2,
							px: 2
						}}
						onSubmit={(e) => {
							// Let browser handle HTML5 validation first
							if (!e.target.checkValidity()) {
								return; // Let browser show validation messages
							}
							e.preventDefault();
							handleUpdateProfile();
						}}>
						<Box sx={{ width: "100%" }}>
							<FormControl
								sx={{
									width: "100%",
									"&:focus-within": {
										borderColor: "primary.main",
										borderWidth: "2px"
									}
								}}>
								<TextField
									fullWidth
									id='displayName'
									type='text'
									required
									autoComplete='off'
									value={displayName}
									label='Display Name'
									onChange={(e) =>
										setDisplayName(e.target.value)
									}
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position='start'>
													<Person
														sx={{
															".Mui-focused &":
															{
																color: "primary.main"
															},
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
													/>
												</InputAdornment>
											),
											endAdornment: (
												<InputAdornment position='end'>
													<Box
														sx={{
															width: 30
														}}
													/>
												</InputAdornment>
											)
										}
									}}
								/>
							</FormControl>
						</Box>
						<Box sx={{ width: "100%" }}>
							<DatePicker
								label='Date of Birth'
								value={dateOfBirth}
								onChange={(newValue) =>
									setDateOfBirth(newValue)
								}
								slotProps={{
									textField: {
										fullWidth: true,
										InputProps: {
											startAdornment: (
												<InputAdornment position='start'>
													<Cake
														sx={{
															".Mui-focused &":
															{
																color: "primary.main"
															},
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
													/>
												</InputAdornment>
											)
										}
									}
								}}
							/>
						</Box>
						<Button
							variant='contained'
							fullWidth
							type='submit'
							disabled={!displayName}>
							<Typography
								variant='button'
								color='white'
								sx={{ fontWeight: "bold" }}>
								Update Profile
							</Typography>
						</Button>
					</Box>
				</StyledBox>
			</SwipeableDrawer>

			<SuccessModal
				open={showSuccess}
				_title='Profile Updated!'
				onClose={() => setShowSuccess(false)}
				_description='Your profile has been updated successfully.'
				_buttonText='Continue'
				_navigate={false}
			/>

			<ConfirmEditModal
				open={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				onConfirm={handleConfirmUpdate}
				_title='Update Profile'
				_description={`Are you sure you want to save the changes to your profile?`}
				_confirmText='Save Changes'
				_cancelText='Cancel'
			/> */}
		</>
	);
};

export default Profile;
