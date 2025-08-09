import React from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Grid,
	Button,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Divider
} from "@mui/material";
import {
	Dashboard,
	People,
	Settings,
	BarChart,
	Security,
	Notifications
} from "@mui/icons-material";

const Admin = () => {
	return (
		<Box sx={{ p: 3, pb: 12 }}>
			<Typography
				variant='h4'
				component='h1'
				gutterBottom
				sx={{ fontWeight: "bold" }}>
				Admin Dashboard
			</Typography>

			<Grid container spacing={3}>
				{/* Overview Cards */}
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography variant='h6' color='textSecondary'>
								Total Users
							</Typography>
							<Typography variant='h4' sx={{ fontWeight: "bold" }}>
								1,234
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography variant='h6' color='textSecondary'>
								Active Matches
							</Typography>
							<Typography variant='h4' sx={{ fontWeight: "bold" }}>
								56
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography variant='h6' color='textSecondary'>
								Courts Available
							</Typography>
							<Typography variant='h4' sx={{ fontWeight: "bold" }}>
								12
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography variant='h6' color='textSecondary'>
								Reports
							</Typography>
							<Typography variant='h4' sx={{ fontWeight: "bold" }}>
								3
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				{/* Admin Actions */}
				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography
								variant='h6'
								component='h2'
								gutterBottom
								sx={{ fontWeight: "bold" }}>
								User Management
							</Typography>
							<List>
								<ListItem>
									<ListItemIcon>
										<People />
									</ListItemIcon>
									<ListItemText
										primary='Manage Users'
										secondary='View, edit, and manage user accounts'
									/>
									<Button variant='outlined' size='small'>
										Manage
									</Button>
								</ListItem>
								<Divider />
								<ListItem>
									<ListItemIcon>
										<Security />
									</ListItemIcon>
									<ListItemText
										primary='User Permissions'
										secondary='Set user roles and permissions'
									/>
									<Button variant='outlined' size='small'>
										Configure
									</Button>
								</ListItem>
							</List>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography
								variant='h6'
								component='h2'
								gutterBottom
								sx={{ fontWeight: "bold" }}>
								System Management
							</Typography>
							<List>
								<ListItem>
									<ListItemIcon>
										<BarChart />
									</ListItemIcon>
									<ListItemText
										primary='Analytics'
										secondary='View app usage and statistics'
									/>
									<Button variant='outlined' size='small'>
										View
									</Button>
								</ListItem>
								<Divider />
								<ListItem>
									<ListItemIcon>
										<Notifications />
									</ListItemIcon>
									<ListItemText
										primary='Notifications'
										secondary='Send system-wide notifications'
									/>
									<Button variant='outlined' size='small'>
										Send
									</Button>
								</ListItem>
							</List>
						</CardContent>
					</Card>
				</Grid>

				{/* Quick Actions */}
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Typography
								variant='h6'
								component='h2'
								gutterBottom
								sx={{ fontWeight: "bold" }}>
								Quick Actions
							</Typography>
							<Grid container spacing={2} sx={{ mt: 1 }}>
								<Grid item xs={12} sm={6} md={3}>
									<Button
										variant='contained'
										fullWidth
										startIcon={<Dashboard />}>
										System Status
									</Button>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<Button
										variant='outlined'
										fullWidth
										startIcon={<Settings />}>
										App Settings
									</Button>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<Button
										variant='outlined'
										fullWidth
										startIcon={<People />}>
										User Reports
									</Button>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<Button
										variant='outlined'
										fullWidth
										startIcon={<BarChart />}>
										Export Data
									</Button>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
};

export default Admin;