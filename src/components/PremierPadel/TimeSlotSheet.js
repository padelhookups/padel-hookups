import { useState, useEffect } from "react";
import { SwipeableDrawer, Box, Typography, Stack, Button } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import CheckIcon from "@mui/icons-material/Check";

import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import { BORDER, BG } from "../../routes/PremierPadelMatch";

export const SLOTS = [
	{
		key: "morning_9_12",
		label: "Morning",
		time: "9h – 12h",
		icon: WbSunnyIcon
	},
	{
		key: "afternoon_14_17",
		label: "Afternoon",
		time: "14h – 17h",
		icon: WbTwilightIcon
	},
	{
		key: "evening_19_21",
		label: "Evening",
		time: "19h – 21h",
		icon: NightsStayIcon
	},
	{ key: "night_21", label: "Night", time: "21h+", icon: DarkModeIcon }
];

const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];

const TimeSlotSheet = ({
	open,
	dateKey,
	currentSlots,
	onDone,
	onClose,
	mainColor
}) => {
	const [selected, setSelected] = useState(new Set());
	const DARK = `color-mix(in srgb, ${mainColor}, black 20%)`;

	useEffect(() => {
		setSelected(new Set(currentSlots || []));
	}, [dateKey, open]);

	function toggle(key) {
    console.log('toggle');
    
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(key) ? next.delete(key) : next.add(key);
			return next;
		});
	}

	const dayLabel = dateKey
		? (() => {
				const d = new Date(dateKey + "T12:00:00");
				return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
			})()
		: "";

	const Puller = styled(Box)(({ theme }) => ({
		width: 30,
		height: 6,
		backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
		borderRadius: 3,
		position: "absolute",
		top: 8,
		left: "calc(50% - 15px)"
	}));

	return (
		<SwipeableDrawer
			anchor='bottom'
			open={open}
			onClose={(e) => e.preventDefault()}
			onOpen={() => {}}
			disableSwipeToOpen
			sx={{ zIndex: 1300 }}>
			<Puller />

			{/* Header */}
			<Box px={2.5} py={2} borderBottom={`1px solid ${mainColor}`}>
				<Typography
					sx={{
						fontFamily: "Barlow Condensed, sans-serif",
						fontWeight: 700,
						fontSize: 18
					}}>
					{dayLabel}
				</Typography>
				<Typography sx={{ fontSize: 12, color: "#888", mt: 0.25 }}>
					Select all time slots you're available
				</Typography>
			</Box>

			{/* Slots */}
			<Stack gap={1.25} p={2.5}>
				{SLOTS.map(({ key, label, time, icon: Icon }) => {
					const active = selected.has(key);
					return (
						<Box
							key={key}
							onClick={() => toggle(key)}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								p: 1.75,
								borderRadius: 2,
								border: `1.5px solid ${active ? mainColor : "#ccc"}`,
								bgcolor: active ? "#fdf0d0" : "#f9f9f9",
								cursor: "pointer",
								transition: "all 0.15s",
								userSelect: "none",
								"&:active": { transform: "scale(0.98)" }
							}}>
							<Stack
								direction='row'
								alignItems='center'
								gap={1.5}>
								<Icon
									sx={{
										fontSize: 20,
										color: active ? mainColor : "#aaa"
									}}
								/>
								<Box>
									<Typography
										sx={{
											fontSize: 14,
											fontWeight: 500,
											color: active ? "#222" : "#555"
										}}>
										{label}
									</Typography>
									<Typography
										sx={{ fontSize: 12, color: "#aaa" }}>
										{time}
									</Typography>
								</Box>
							</Stack>
							<Box
								sx={{
									width: 24,
									height: 24,
									borderRadius: "50%",
									border: `2px solid ${active ? mainColor : BORDER}`,
									bgcolor: active ? mainColor : "transparent",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									transition: "all 0.15s",
									flexShrink: 0
								}}>
								{active && (
									<CheckIcon
										sx={{ fontSize: 14, color: "white" }}
									/>
								)}
							</Box>
						</Box>
					);
				})}
			</Stack>

			<Box px={2.5} pb={2.5}>
				<Button
					fullWidth
					variant='contained'
					onClick={() => onDone(selected)}
					sx={{
						py: 1.75,
						background: `linear-gradient(135deg, ${DARK}, ${mainColor})`,
						fontFamily: "Barlow Condensed, sans-serif",
						fontSize: 15,
						fontWeight: 700,
						letterSpacing: 1,
						borderRadius: 2,
						boxShadow: "none",
						"&:hover": { boxShadow: "none", opacity: 0.9 }
					}}>
					<Typography variant='button' sx={{ color: "white", fontWeight: 'bold' }}>
						Done
					</Typography>
				</Button>
			</Box>
		</SwipeableDrawer>
	);
};

export default TimeSlotSheet;
