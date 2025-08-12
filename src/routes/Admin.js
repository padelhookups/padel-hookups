import React, { useState } from "react";
import { useNavigate } from "react-router";
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
	Divider,
	Paper,
	Tab,
	Tabs
} from "@mui/material";
import {
	People,
	Settings,
	BarChart,
	Notifications,
	Height
} from "@mui/icons-material";

import ManageUsers from "./Admin/ManageUsers";

const Admin = () => {
	const navigate = useNavigate();

	const [tabValue, setTabValue] = useState(0);

	const handleTabChange = (newValue) => {
		setTabValue(newValue);
	};

	const handleManageUsersClick = () => {
		// Navigate to manage users page - you can change this path as needed
		navigate("/ManageUsers");
	};

	const TabPanel = ({ children, value, index }) => (
		<div hidden={value !== index} style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}>
			{value === index && <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>}
		</div>
	);

	return (
		<Box sx={{ height: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column' }}>
			<Paper sx={{ borderRadius: 0, bgcolor: "#b88f34", color: "white" }}>
				<Box sx={{ py: 3, px: 2 }}>
					<Typography
						variant='h4'
						component='h1'
						sx={{ fontWeight: "bold", mb: 1 }}>
						🔧 Admin Dashboard
					</Typography>
					<Typography variant='body1' sx={{ opacity: 0.9, pl: 1 }}>
						Manage your padel community
					</Typography>
				</Box>
			</Paper>
			<Paper sx={{ borderRadius: 0 }}>
				<Tabs
					value={tabValue}
					onChange={(event, newValue) => handleTabChange(newValue)}
					variant='fullWidth'>
					<Tab icon={<People />} label='Users' />
					{/* <Tab icon={<Settings />} label='Settings' /> */}
				</Tabs>
			</Paper>
			<Box sx={{ flex: 1, overflow: "hidden", display: 'flex', flexDirection: 'column' }}>
				{/* Users Tab */}
				<TabPanel value={tabValue} index={0}>
					<ManageUsers />
				</TabPanel>
				{/* <TabPanel value={tabValue} index={1}>
					<Grid container spacing={3}>
						<Grid sx={{ width: "100%" }} item xs={12} md={6}>
							<Card>
								<CardContent>
									<Typography
										variant='h6'
										component='h2'
										gutterBottom
										sx={{
											fontWeight: "bold",
											cursor: "pointer",
											"&:hover": {
												color: "primary.main"
											}
										}}>
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
											<Button
												variant='outlined'
												size='small'>
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
											<Button
												variant='outlined'
												size='small'>
												Send
											</Button>
										</ListItem>
									</List>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</TabPanel> */}
			</Box>
		</Box>
	);
};

export default Admin;
