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
	Mail,
	Settings,
	BarChart,
	Notifications,
	Height
} from "@mui/icons-material";

import ManageUsers from "./Admin/ManageUsers";
import Invitations from "./Admin/Invitations";

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
		<Box sx={{ height: 'calc(100vh - 58px - env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
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
					<Tab icon={<Mail />} label='Invitations' />
					{/* <Tab icon={<Settings />} label='Settings' /> */}
				</Tabs>
			</Paper>
			<Box sx={{ flex: 1, overflow: "hidden", display: 'flex', flexDirection: 'column' }}>
				{/* Users Tab */}
				<TabPanel value={tabValue} index={0}>
					<ManageUsers />
				</TabPanel>
				<TabPanel value={tabValue} index={1}>
					<Invitations />
				</TabPanel>
			</Box>
		</Box>
	);
};

export default Admin;
