import React from "react";
import { useLocation, useNavigate } from "react-router";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { Home, Person, Settings, Group } from "@mui/icons-material";

const BottomBar = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const menuItems = [
		{
			path: "/Home",
			icon: <Home color='inherit' />,
			label: "Home"
		},
		{
			path: "/Community",
			icon: <Group color='inherit' />,
			label: "Community"
		},
		{
			path: "/Profile",
			icon: <Person color='inherit' />,
			label: "Profile"
		},
		{
			path: "/Settings",
			icon: <Settings color='inherit' />,
			label: "Settings"
		}
	];

	const currentValue = menuItems.findIndex(
		(item) => item.path === location.pathname
	);

	const handleChange = (event, newValue) => {
		navigate(menuItems[newValue].path);
	};

	return (
		<Paper
			sx={{
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 1000
			}}
			elevation={8}>
			<BottomNavigation
				value={currentValue !== -1 ? currentValue : false}
				onChange={handleChange}
				showLabels
				sx={{
					bgcolor: "primary.main",
					height: 60,
					minHeight: 60,
					"& .MuiBottomNavigationAction-root": {
						minWidth: "auto"
					}
				}}>
				{menuItems.map((item, index) => (
					<BottomNavigationAction
						key={item.path}
						label={item.label}
						icon={item.icon}
						sx={{
							color: "secondary.main",
							"&.Mui-selected": { color: "primary.main", bgcolor: "secondary.main" },
						}}
					/>
				))}
			</BottomNavigation>
		</Paper>
	);
};

export default BottomBar;
