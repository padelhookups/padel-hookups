import React, { useEffect, useState, useCallback } from "react";
import {
	collection,
	getDocs,
	addDoc,
	updateDoc,
	doc
} from "firebase/firestore";
import firebase from "../../firebase-config";

import {
	Box,
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
	Grid,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	SwipeableDrawer,
	InputAdornment
} from "@mui/material";
import {
	Edit,
	Add,
	Person,
	Email,
	Phone,
	Save,
	Cancel,
	Search
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

const ManageUsers = () => {
	const db = firebase.db;

	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [newUser, setNewUser] = useState({
		Name: "",
		Email: "",
		Phone: "",
		Role: "user"
	});
	const [editUser, setEditUser] = useState({
		Name: "",
		Email: "",
		Phone: "",
		Role: "user"
	});

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

	const  handleAddUser = async () => {
		try {
			await addDoc(collection(db, "Users"), newUser);
			setNewUser({ Name: "", Email: "", Phone: "", Role: "user" });
			setDrawerOpen(false);
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
			Phone: user.Phone || "",
			Role: user.Role || "user"
		});
		setEditDialogOpen(true);
	};

	const handleUpdateUser = async () => {
		try {
			await updateDoc(doc(db, "Users", selectedUser.id), editUser);
			setEditDialogOpen(false);
			setSelectedUser(null);
			fetchUsers(); // Refresh the list
		} catch (error) {
			console.error("Error updating user: ", error);
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

	// Filter users based on search query
	const filteredUsers = users.filter((user) => {
		const searchLower = searchQuery.toLowerCase();
		return (
			(user.Name && user.Name.toLowerCase().includes(searchLower)) ||
			(user.Email && user.Email.toLowerCase().includes(searchLower)) ||
			(user.Phone && user.Phone.toLowerCase().includes(searchLower))
		);
	});

	const Puller = styled(Box)(({ theme }) => ({
		width: 30,
		height: 6,
		backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
		borderRadius: 3,
		position: "absolute",
		top: 8,
		left: "calc(50% - 15px)"
	}));

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
		<Box sx={{ p: 3, pb: 12 }}>
			<Typography textAlign='center' variant='body1' sx={{ mb: 3 }}>
				Total Users: {users.length}
			</Typography>

			{/* Search Bar */}
			<Box sx={{ mb: 3 }}>
				<TextField
					fullWidth
					placeholder='Search users by name, email, or phone...'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					variant='outlined'
					InputProps={{
						startAdornment: (
							<InputAdornment position='start'>
								<Search />
							</InputAdornment>
						)
					}}
				/>
			</Box>

			{/* Users List */}
			{filteredUsers.length > 0 && (
				<>
					<Card>
						<CardContent sx={{ p: "0 !important" }}>
							<List>
								{filteredUsers.map((user, index) => (
									<React.Fragment key={user.id}>
										<ListItem
											sx={{ py: 2 }}
											onClick={() => handleEditUser(user)}
											secondaryAction={
												<IconButton
													edge='end'
													color='primary'>
													<Edit />
												</IconButton>
											}>
											<Avatar
												sx={{
													mr: 2,
													bgcolor: "primary.main"
												}}>
												<Person />
											</Avatar>
											<ListItemText
												primary={
													<Typography
														variant='h6'
														sx={{
															fontWeight: "bold"
														}}>
														{user.Name || "No Name"}
														<Chip
															label={
																user.IsAdmin
																	? "Admin"
																	: "User"
															}
															size='small'
															variant='filled'
															sx={{
																mt: 0.5,
																ml: 1,
																backgroundColor:
																	user.IsAdmin
																		? "primary.main"
																		: "white",
																color: user.IsAdmin
																	? "white"
																	: "primary.main"
															}}
														/>
													</Typography>
												}
											/>
										</ListItem>
										{index < filteredUsers.length - 1 && (
											<Divider />
										)}
									</React.Fragment>
								))}
							</List>
						</CardContent>
					</Card>
				</>
			)}

			{users.length === 0 && (
				<Alert severity='info' sx={{ mt: 2 }}>
					No users found. Click the + button to add the first user.
				</Alert>
			)}

			{users.length > 0 && filteredUsers.length === 0 && (
				<Alert severity='info' sx={{ mt: 2 }}>
					No users match your search criteria.
				</Alert>
			)}

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
				anchor='bottom'
				open={drawerOpen}
				disableSwipeToOpen={true}
				keepMounted
				onClose={() => setDrawerOpen(false)}>
				<Puller />
				<Box sx={{ p: 3, minHeight: "50vh" }}>
					<Typography
						variant='h6'
						component='h2'
						gutterBottom
						sx={{ fontWeight: "bold" }}>
						Add New User
					</Typography>

					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label='Full Name'
								value={newUser.Name}
								onChange={(e) =>
									handleNewUserChange("Name", e.target.value)
								}
								variant='outlined'
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label='Email'
								type='email'
								value={newUser.Email}
								onChange={(e) =>
									handleNewUserChange("Email", e.target.value)
								}
								variant='outlined'
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label='Phone'
								value={newUser.Phone}
								onChange={(e) =>
									handleNewUserChange("Phone", e.target.value)
								}
								variant='outlined'
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								select
								label='Role'
								value={newUser.Role}
								onChange={(e) =>
									handleNewUserChange("Role", e.target.value)
								}
								variant='outlined'
								SelectProps={{
									native: true
								}}>
								<option value='user'>User</option>
								<option value='admin'>Admin</option>
							</TextField>
						</Grid>
					</Grid>

					<Box sx={{ mt: 3, display: "flex", gap: 2 }}>
						<Button
							variant='contained'
							startIcon={<Save />}
							onClick={handleAddUser}
							disabled={!newUser.Name || !newUser.Email}
							fullWidth>
							Add User
						</Button>
						<Button
							variant='outlined'
							startIcon={<Cancel />}
							onClick={() => setDrawerOpen(false)}
							fullWidth>
							Cancel
						</Button>
					</Box>
				</Box>
			</SwipeableDrawer>

			{/* Edit User Dialog */}
			<Dialog
				open={editDialogOpen}
				onClose={() => setEditDialogOpen(false)}
				maxWidth='sm'
				fullWidth>
				<DialogTitle>
					<Typography variant='h6' sx={{ fontWeight: "bold" }}>
						Edit User
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label='Full Name'
								value={editUser.Name}
								onChange={(e) =>
									handleEditUserChange("Name", e.target.value)
								}
								variant='outlined'
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label='Email'
								type='email'
								value={editUser.Email}
								onChange={(e) =>
									handleEditUserChange(
										"Email",
										e.target.value
									)
								}
								variant='outlined'
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label='Phone'
								value={editUser.Phone}
								onChange={(e) =>
									handleEditUserChange(
										"Phone",
										e.target.value
									)
								}
								variant='outlined'
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								select
								label='Role'
								value={editUser.Role}
								onChange={(e) =>
									handleEditUserChange("Role", e.target.value)
								}
								variant='outlined'
								SelectProps={{
									native: true
								}}>
								<option value='user'>User</option>
								<option value='admin'>Admin</option>
							</TextField>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions sx={{ p: 3 }}>
					<Button
						variant='outlined'
						onClick={() => setEditDialogOpen(false)}>
						Cancel
					</Button>
					<Button
						variant='contained'
						onClick={handleUpdateUser}
						disabled={!editUser.Name || !editUser.Email}>
						Save Changes
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ManageUsers;
