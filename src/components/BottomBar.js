import React from "react";
import { useLocation, useNavigate } from "react-router";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { Home, Person, Settings, LocalOffer } from "@mui/icons-material";

const BottomBar = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const menuItems = [
		{
			path: "/Home",
			icon: <Home />,
			label: "Home"
		},
		{
			path: "/Benefits",
			icon: <LocalOffer />,
			label: "Benefits"
		},
		{
			path: "/Profile",
			icon: <Person />,
			label: "Profile"
		},
		{
			path: "/Settings",
			icon: <Settings />,
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
				zIndex: 1200,
				paddingBottom: "env(safe-area-inset-bottom)",
				borderTop: "1px solid rgba(0, 0, 0, 0.12)",
				WebkitTransform: "translateZ(0)",
				transform: "translateZ(0)",
				willChange: "transform",
			}}
			elevation={8}>
			<BottomNavigation
				value={currentValue !== -1 ? currentValue : false}
				onChange={handleChange}
				showLabels
				sx={{
					height: 60,
					minHeight: 60,
					"& .MuiBottomNavigationAction-root": {
						minWidth: "auto",
					}
				}}>
				{menuItems.map((item, index) => (
					<BottomNavigationAction
						key={item.path}
						label={item.label}
						icon={item.icon}
					/>
				))}
			</BottomNavigation>
		</Paper>
	);
};

export default BottomBar;
