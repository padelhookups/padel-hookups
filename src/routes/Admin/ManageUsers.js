import React, { useEffect, useState, useCallback } from "react";
import { updateProfile } from "firebase/auth";
import {
	collection,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	Timestamp
} from "firebase/firestore";
import firebase from "../../firebase-config";
import useAuth from "../../utils/useAuth";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import ConfirmEditModal from "../../components/ConfirmEditModal";
import SuccessModal from "../../components/SuccessModal";
import AnimatedPadelIcon from "../../components/AnimatedPadelIcon";
import AddBadges from "./AddBadges";

import {
	Box,
	CircularProgress,
	Typography,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemText,
	IconButton,
	Fab,
	TextField,
	Button,
	Avatar,
	Divider,
	Alert,
	Chip,
	SwipeableDrawer,
	InputAdornment,
	FormControl,
	InputLabel,
	OutlinedInput,
	Switch,
	FormControlLabel
} from "@mui/material";
import {
	Add,
	Email,
	Person,
	Search,
	Settings,
	Edit,
	Delete,
	MilitaryTech
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

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
}));

const ManageUsers = () => {
	const db = firebase.db;
	const auth = firebase.auth;
	const { user } = useAuth();

	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [editDrawerOpen, setEditDrawerOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [userToDelete, setUserToDelete] = useState(null);
	const [openAddBadges, setOpenAddBadges] = useState(false);
	const [successModalOpen, setSuccessModalOpen] = useState(false);
	const [successModalData, setSuccessModalData] = useState({
		title: "",
		description: "",
		buttonText: "OK"
	});
	const [newUser, setNewUser] = useState({
		Name: "",
		Email: "",
		Status: "Pending",
		IsAdmin: false, // Changed to boolean for admin status
		IsTester: false,
	});
	const [editUser, setEditUser] = useState({
		Name: "",
		Email: "",
		IsAdmin: false, // Changed to boolean for admin status
		IsTester: false,
	});
	const [loadingImages, setLoadingImages] = useState({});
	const [imageErrors, setImageErrors] = useState({});

	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			const querySnapshot = await getDocs(collection(db, "Users"));
			const usersList = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));
			setUsers(usersList);
		} catch (error) {
			console.error("Error fetching users: ", error);
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleAddUser = async () => {
		try {
			await addDoc(collection(db, "Invites"), newUser);
			setNewUser({ Name: "", Email: "", IsAdmin: false });
			setDrawerOpen(false);
			setSuccessModalData({
				title: "User Invited Successfully!",
				description: `${newUser.Name} has been invited to join the platform. They will receive an email invitation.`,
				buttonText: "Continue"
			});
			setSuccessModalOpen(true);
			fetchUsers(); // Refresh the list
		} catch (error) {
			console.error("Error adding user: ", error);
		}
	};

	const handleEditUser = (user) => {
		setSelectedUser(user);
		setEditUser({
			Name: user.Name || "",
			Email: user.Email || "",
			IsAdmin: user.IsAdmin === "admin" || user.IsAdmin === true
		});
		setEditDrawerOpen(true);
	};

	const handleUpdateUser = () => {
		setEditModalOpen(true);
	};

	const handleConfirmUpdate = async () => {
		try {
			editUser.LastModifiedAt = Timestamp.now();
			if (user && user.uid) {
				editUser.LastModifiedBy = doc(db, "Users", user.uid);
			}

			await updateDoc(doc(db, "Users", selectedUser.id), editUser);
			updateProfile(auth.currentUser, {
				displayName: editUser.Name
			})
				.then(() => {
					console.log("Display name updated successfully");
					setEditDrawerOpen(false);
					setSelectedUser(null);
					setEditModalOpen(false);
					setSuccessModalData({
						title: "User Updated Successfully!",
						description: `${editUser.Name}'s information has been updated successfully.`,
						buttonText: "Continue"
					});
					setSuccessModalOpen(true);
					fetchUsers(); // Refresh the list
				})
				.catch((error) => {
					setEditDrawerOpen(false);
					setSelectedUser(null);
					setEditModalOpen(false);
					setSuccessModalData({
						title: "User Updated!",
						description: `${editUser.Name}'s information has been updated successfully.`,
						buttonText: "Continue"
					});
					setSuccessModalOpen(true);
					fetchUsers(); // Refresh the list
					console.error("Error updating display name:", error);
				});
		} catch (error) {
			console.error("Error updating user: ", error);
		}
	};

	const handleDeleteUser = (user) => {
		setUserToDelete(user);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		try {
			if (userToDelete) {
				await deleteDoc(doc(db, "Users", userToDelete.id));
				setDeleteModalOpen(false);
				setUserToDelete(null);
				setEditDrawerOpen(false);
				setSelectedUser(null);
				setSuccessModalData({
					title: "User Deleted Successfully!",
					description: `${userToDelete.Name} has been permanently removed from the system.`,
					buttonText: "Continue"
				});
				setSuccessModalOpen(true);
				fetchUsers(); // Refresh the list
			}
		} catch (error) {
			console.error("Error deleting user: ", error);
		}
	};

	const handleNewUserChange = (field, value) => {
		setNewUser((prev) => ({
			...prev,
			[field]: value
		}));
	};

	const handleEditUserChange = (field, value) => {
		setEditUser((prev) => ({
			...prev,
			[field]: value
		}));
	};

	const handleImageLoad = (userId) => {
		setLoadingImages(prev => ({ ...prev, [userId]: false }));
	};

	const handleImageError = (userId) => {
		setLoadingImages(prev => ({ ...prev, [userId]: false }));
		setImageErrors(prev => ({ ...prev, [userId]: true }));
	};

	useEffect(() => {
		// Initialize loading states for users with photos
		if (users.length > 0) {
			const initialLoadingState = {};
			users.forEach(user => {
				if (user.PhotoURL) {
					initialLoadingState[user.id] = true;
				}
			});
			setLoadingImages(initialLoadingState);
		}
	}, [users]);

	// Filter users based on search query
	const filteredUsers = users.filter((user) => {
		const searchLower = searchQuery.toLowerCase();
		return (
			(user.Name && user.Name.toLowerCase().includes(searchLower)) ||
			(user.Email && user.Email.toLowerCase().includes(searchLower))
		);
	});

	if (loading) {
		return (
			<Box sx={{ p: 3, pb: 12 }}>
				<Typography
					variant='h4'
					component='h1'
					gutterBottom
					sx={{ fontWeight: "bold" }}>
					Manage Users
				</Typography>
				<Typography>Loading users...</Typography>
			</Box>
		);
	}

	return (
		<>
			<Box sx={{ p: 2, pb: 10 }}>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: 2
					}}>
					<Typography alignContent="start" variant='h5' sx={{ fontWeight: "bold" }}>
						Users ({users.length})
					</Typography>
				</Box>

				{/* Search Bar */}
				<TextField
					fullWidth
					placeholder='Search invitations by name or email'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					variant='outlined'
					size='small'
					InputProps={{
						startAdornment: (
							<InputAdornment position='start'>
								<Search />
							</InputAdornment>
						)
					}}
					sx={{ mb: 3 }}
				/>

				{/* Users List */}
				{filteredUsers.length > 0 && (
					<>
						<Card style={{ flex: 1 }}>
							<CardContent sx={{ p: "0 !important" }}>
								<List>
									{filteredUsers.map((user, index) => (
										<React.Fragment key={user.id}>
											<ListItem
												sx={{ py: 2 }}
												onClick={() =>
													handleEditUser(user)
												}
												secondaryAction={
													<>
														<IconButton
															onClick={(ev) => {
																console.log('badge Action');
																ev.stopPropagation();
																ev.preventDefault();
																setOpenAddBadges(true);
															}}
															edge='end'
															color='primary'>
															<MilitaryTech />
														</IconButton>
														{/* <IconButton
															edge='end'
															color='primary'>
															<Settings />
														</IconButton> */}
													</>
												}>
												<Box sx={{ position: 'relative', mr: 2 }}>
													{user.PhotoURL && loadingImages[user.id] && !imageErrors[user.id] && (
														<Box
															sx={{
																position: 'absolute',
																top: 0,
																left: 0,
																right: 0,
																bottom: 0,
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																zIndex: 1,
															}}>
															<CircularProgress size={20} />
														</Box>
													)}
													<Avatar
														src={user.PhotoURL && !imageErrors[user.id] ? user.PhotoURL : undefined}
														sx={{
															bgcolor: user.PhotoURL && !imageErrors[user.id] ? "transparent" : "primary.main",
															opacity: loadingImages[user.id] && user.PhotoURL && !imageErrors[user.id] ? 0 : 1,
															transition: 'opacity 0.3s ease-in-out',
														}}
														imgProps={{
															onLoad: () => handleImageLoad(user.id),
															onError: () => handleImageError(user.id)
														}}>
														{(!user.PhotoURL || imageErrors[user.id]) && <Person />}
													</Avatar>
												</Box>
												<ListItemText
													primary={
														<Typography
															variant='h6'
															sx={{
																fontWeight:
																	"bold"
															}}>
															{user.Name ||
																"No Name"}
															{user.IsAdmin && (
																<Chip
																	label='Admin'
																	size='small'
																	variant='filled'
																	sx={{
																		mt: 0.5,
																		ml: 1,
																		backgroundColor:
																			"primary.main",
																		color: "white"
																	}}
																/>
															)}
														</Typography>
													}
												/>
											</ListItem>
											{index <
												filteredUsers.length - 1 && (
													<Divider />
												)}
										</React.Fragment>
									))}
								</List>
							</CardContent>
						</Card>
					</>
				)
				}

				{
					users.length === 0 && (
						<Alert severity='warning' color='primary' sx={{ mt: 2 }}>
							No users found. Click the + button to add the first
							user.
						</Alert>
					)
				}

				{
					users.length > 0 && filteredUsers.length === 0 && (
						<Alert severity='warning' color='primary' sx={{ mt: 2 }}>
							No users match your search criteria.
						</Alert>
					)
				}

				{/* Floating Action Button */}
				<Fab
					color='primary'
					aria-label='add user'
					sx={{
						position: "fixed",
						bottom: 80,
						right: 16
					}}
					onClick={() => setDrawerOpen(true)}>
					<Add sx={{ color: "white" }} />
				</Fab>

				{/* Add User Drawer */}
				<SwipeableDrawer
					sx={{ zIndex: 1300 }}
					anchor='bottom'
					open={drawerOpen}
					disableSwipeToOpen={true}
					keepMounted
					onClose={() => setDrawerOpen(false)}>
					<Puller />
					<StyledBox sx={{ px: 2, pb: 2 }}>
						{/* Animated Header with Icon */}
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								pt: 3,
								pb: 2
							}}>
							<Typography
								variant='h5'
								component='h2'
								sx={{
									fontWeight: "bold",
									textAlign: "center",
									color: "primary.main",
									textShadow: "0 2px 4px rgba(0,0,0,0.1)",
									letterSpacing: "0.5px"
								}}>
								Invite a new Player!
							</Typography>
							<AnimatedPadelIcon
								size={100}
								containerSx={{ ml: 2 }}
							/>
						</Box>

						<Box
							component='form'
							sx={{
								"& > :not(style)": { mt: 4 },
								pb: 2,
								px: 2
							}}
							onSubmit={(e) => {
								e.preventDefault();
								handleAddUser();
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
										id='Name'
										type='text'
										required
										autoComplete='off'
										value={newUser.Name}
										label='Name'
										onChange={(e) =>
											handleNewUserChange(
												"Name",
												e.target.value
											)
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
															sx={{ width: 30 }}
														/>
													</InputAdornment>
												)
											}
										}}
									/>
								</FormControl>
							</Box>
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "primary.main",
											borderWidth: "2px"
										}
									}}>
									<InputLabel htmlFor='Email'>
										Email
									</InputLabel>
									<OutlinedInput
										fullWidth
										id='Email'
										type='email'
										required
										autoComplete='off'
										value={newUser.Email}
										onChange={(e) =>
											handleNewUserChange(
												"Email",
												e.target.value
											)
										}
										startAdornment={
											<InputAdornment position='start'>
												<Email
													sx={{
														".Mui-focused &": {
															color: "primary.main"
														},
														mr: 1,
														my: 0.5,
														cursor: "pointer"
													}}
												/>
											</InputAdornment>
										}
										endAdornment={
											<InputAdornment position='end'>
												<Box sx={{ width: 30 }} />
											</InputAdornment>
										}
										label='Email'
									/>
								</FormControl>
							</Box>
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "primary.main",
											borderWidth: "2px"
										}
									}}>
									<FormControlLabel
										control={
											<Switch
												checked={newUser.IsAdmin}
												onChange={(e) =>
													handleNewUserChange(
														"IsAdmin",
														e.target.checked
													)
												}
												color='primary'
											/>
										}
										label='Administrator'
										sx={{
											ml: 0,
											"& .MuiFormControlLabel-label": {
												fontSize: "1rem",
												fontWeight: "bold"
											}
										}}
									/>
								</FormControl>
							</Box>
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "primary.main",
											borderWidth: "2px"
										}
									}}>
									<FormControlLabel
										control={
											<Switch
												checked={newUser.IsTester}
												onChange={(e) =>
													handleNewUserChange(
														"IsTester",
														e.target.checked
													)
												}
												color='primary'
											/>
										}
										label='Tester'
										sx={{
											ml: 0,
											"& .MuiFormControlLabel-label": {
												fontSize: "1rem",
												fontWeight: "bold"
											}
										}}
									/>
								</FormControl>
							</Box>
							<Button
								variant='contained'
								fullWidth
								type='submit'
								disabled={!newUser.Name || !newUser.Email}>
								<Typography
									variant='button'
									color='white'
									sx={{ fontWeight: "bold" }}>
									Add New User
								</Typography>
							</Button>
						</Box>
					</StyledBox>
				</SwipeableDrawer>

				{/* Edit User Drawer */}
				<SwipeableDrawer
					sx={{ zIndex: 1300 }}
					anchor='bottom'
					open={editDrawerOpen}
					onClose={() => setEditDrawerOpen(false)}
					disableSwipeToOpen={true}
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
								e.preventDefault();
								handleUpdateUser();
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
										id='EditName'
										type='text'
										required
										autoComplete='off'
										value={editUser.Name}
										label='Name'
										onChange={(e) =>
											handleEditUserChange(
												"Name",
												e.target.value
											)
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
															sx={{ width: 30 }}
														/>
													</InputAdornment>
												)
											}
										}}
									/>
								</FormControl>
							</Box>
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "primary.main",
											borderWidth: "2px"
										}
									}}>
									<InputLabel htmlFor='EditEmail'>
										Email
									</InputLabel>
									<OutlinedInput
										fullWidth
										id='EditEmail'
										type='email'
										required
										autoComplete='off'
										value={editUser.Email}
										onChange={(e) =>
											handleEditUserChange(
												"Email",
												e.target.value
											)
										}
										startAdornment={
											<InputAdornment position='start'>
												<Email
													sx={{
														".Mui-focused &": {
															color: "primary.main"
														},
														mr: 1,
														my: 0.5,
														cursor: "pointer"
													}}
												/>
											</InputAdornment>
										}
										endAdornment={
											<InputAdornment position='end'>
												<Box sx={{ width: 30 }} />
											</InputAdornment>
										}
										label='Email'
									/>
								</FormControl>
							</Box>
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "primary.main",
											borderWidth: "2px"
										}
									}}>
									<FormControlLabel
										control={
											<Switch
												checked={editUser.IsAdmin}
												onChange={(e) =>
													handleEditUserChange(
														"IsAdmin",
														e.target.checked
													)
												}
												color='primary'
											/>
										}
										label='Administrator'
										sx={{
											ml: 0,
											"& .MuiFormControlLabel-label": {
												fontSize: "1rem",
												fontWeight: "bold"
											}
										}}
									/>
								</FormControl>
							</Box>
							<Button
								variant='contained'
								fullWidth
								sx={{
									mt: 2
								}}
								type='submit'
								disabled={
									editUser.Name && editUser.Email
										? false
										: true
								}
								startIcon={<Edit sx={{ color: "white" }} />}>
								<Typography
									variant='button'
									color='white'
									sx={{ fontWeight: "bold" }}>
									Edit User
								</Typography>
							</Button>
							<Button
								variant='outlined'
								fullWidth
								color='error'
								sx={{
									mt: "1rem !important",
									color: "white"
								}}
								type='button'
								disabled={!editUser.Name || !editUser.Email}
								startIcon={<Delete color='error' />}
								onClick={() => handleDeleteUser(selectedUser)}>
								<Typography
									variant='button'
									color='error.main'
									sx={{ fontWeight: "bold" }}>
									Delete User
								</Typography>
							</Button>
						</Box>
					</StyledBox>
				</SwipeableDrawer>

				{/* Confirm Delete Modal */}
				<ConfirmDeleteModal
					open={deleteModalOpen}
					onClose={() => setDeleteModalOpen(false)}
					onConfirm={handleConfirmDelete}
					_title='Delete User'
					_description={`Are you sure you want to delete ${userToDelete?.Name || "this user"}? This action cannot be undone and will permanently remove the user from the system.`}
					_confirmText='Delete User'
					_cancelText='Cancel'
				/>

				{/* Confirm Edit Modal */}
				<ConfirmEditModal
					open={editModalOpen}
					onClose={() => setEditModalOpen(false)}
					onConfirm={handleConfirmUpdate}
					_title='Save Changes'
					_description={`Are you sure you want to save the changes to ${selectedUser?.Name || "this user"}?`}
					_confirmText='Save Changes'
					_cancelText='Cancel'
				/>

				{/* Success Modal */}
				<SuccessModal
					open={successModalOpen}
					onClose={() => setSuccessModalOpen(false)}
					_title={successModalData.title}
					_description={successModalData.description}
					_buttonText={successModalData.buttonText}
				/>
				{
					openAddBadges && (<AddBadges onClose={() => setOpenAddBadges(false)} open={openAddBadges} />)
				}
			</Box >
		</>
	);
};

export default ManageUsers;
