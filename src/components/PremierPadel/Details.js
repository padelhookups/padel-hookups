import { useMemo } from "react";

import { useSelector } from "react-redux";
import { selectUsers } from "../../redux/slices/usersSlice";

import { Box, Typography, Stack, Avatar, Divider, Paper } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const BG = "#f5f4f0";
const BORDER = "#e0dbd0";

const resolvePlayer = (playerId, event, users) => {
	if (!playerId) return null;

	if (playerId.startsWith("guest_")) {
		return (
			event?.Guests?.find(
				(guest) => guest?.UserId === playerId || guest?.id === playerId
			) || null
		);
	}

	return (
		users?.find(
			(user) => user?.id === playerId || user?.UserId === playerId
		) || null
	);
};

const getPlayerName = (player) =>
	player?.DisplayName || player?.Name || player?.name || "Unknown player";

const Details = ({
	match,
	event,
	summaryDate,
	summaryTime,
	summaryLocation,
	mainColor
}) => {
	const users = useSelector(selectUsers);
	const finalDate = match?.FinalDateToPlay?.seconds
		? new Date(match.FinalDateToPlay.seconds * 1000)
		: match?.FinalDateToPlay?.toDate
			? match.FinalDateToPlay.toDate()
			: null;

	const players = useMemo(() => {
		if (!match || !event?.Pairs?.length) return [];

		const teamA = event.Pairs[match?.opponent1?.id - 1];
		const teamB = event.Pairs[match?.opponent2?.id - 1];
		if (!teamA || !teamB) return [];

		return [
			{
				id: teamA.Player1Id,
				teamLabel: "Team 1",
				color: `color-mix(in srgb, ${mainColor}, white 20%)`
			},
			{
				id: teamA.Player2Id,
				teamLabel: "Team 1",
				color: `color-mix(in srgb, ${mainColor}, white 20%)`
			},
			{
				id: teamB.Player1Id,
				teamLabel: "Team 2",
				color: `color-mix(in srgb, ${mainColor}, black 25%)`
			},
			{
				id: teamB.Player2Id,
				teamLabel: "Team 2",
				color: `color-mix(in srgb, ${mainColor}, black 25%)`
			}
		]
			.map((slot) => ({
				...slot,
				player: resolvePlayer(slot.id, event, users)
			}))
			.filter((slot) => slot.player);
	}, [match, event, users, mainColor]);

	console.log(players);
	console.log(match);

	return (
		<Stack gap={1.5} p={2}>
			{/* Match Info */}
			<InfoCard title='📋 Match Info' mainColor={mainColor}>
				<InfoRow
					icon={
						<EmojiEventsIcon
							sx={{ fontSize: 18, color: mainColor }}
						/>
					}
					label='Tournament'
					value={event?.Name}
				/>
				<InfoRow
					icon={<BoltIcon sx={{ fontSize: 18, color: mainColor }} />}
					label='Round'
					value={match?.metadata.label}
				/>
				<InfoRow
					icon={
						<CalendarTodayIcon
							sx={{ fontSize: 18, color: mainColor }}
						/>
					}
					label='Date'
					value={summaryDate || (finalDate ? `TBD – until ${finalDate.toLocaleDateString()}` : "TBD")}
					
				/>
				<InfoRow
					icon={
						<AccessTimeIcon
							sx={{ fontSize: 18, color: mainColor }}
						/>
					}
					label='Time'
					value={summaryTime || "TBD"}
					last
				/>
				<InfoRow
					icon={
						<LocationOnIcon
							sx={{ fontSize: 18, color: mainColor }}
						/>
					}
					label='Location'
					value={summaryLocation || "TBD – set by players"}
					last
				/>
			</InfoCard>

			{/* Players */}
			<InfoCard title='👥 Players' mainColor={mainColor}>
				<Box
					display='grid'
					gridTemplateColumns='repeat(2, minmax(0, 1fr))'
					gap={1}
					sx={{ width: "100%", minWidth: 0 }}
					pt={0.5}>
					{players.map((slot) => (
						<PlayerChip
							key={`${slot.teamLabel}-${slot.id}`}
							name={getPlayerName(slot.player)}
							teamLabel={slot.teamLabel}
							color={slot.color}
						/>
					))}
				</Box>
			</InfoCard>
		</Stack>
	);
};

function InfoCard({ title, children, mainColor }) {
	return (
		<Paper
			variant='outlined'
			sx={{ borderRadius: 2, borderColor: BORDER, overflow: "hidden" }}>
			<Box px={2} pt={2} pb={1.5}>
				<Typography
					sx={{
						pl: 0.2,
						fontSize: 10,
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: 1.5,
						color: mainColor,
						fontFamily: "Barlow Condensed, sans-serif",
						mb: 1.5
					}}>
					{title}
				</Typography>
				{children}
			</Box>
		</Paper>
	);
}

function InfoRow({ icon, label, value, last }) {
	return (
		<>
			<Stack direction='row' alignItems='center' gap={1.25} py={0.75}>
				<Box
					width={22}
					display='flex'
					justifyContent='center'
					flexShrink={0}>
					{icon}
				</Box>
				<Typography
					sx={{
						fontSize: 12,
						color: "#888",
						width: 80,
						flexShrink: 0
					}}>
					{label}
				</Typography>
				<Typography sx={{ fontSize: 14, fontWeight: 500 }}>
					{value}
				</Typography>
			</Stack>
			{!last && <Divider sx={{ borderColor: BORDER }} />}
		</>
	);
}

function PlayerChip({ name, teamLabel, color }) {
	const safeName = name || "Unknown player";
	const initial = safeName.charAt(0).toUpperCase();

	return (
		<Box
			display='flex'
			alignItems='center'
			gap={1}
			p={1.25}
			bgcolor={BG}
			borderRadius={2}
			sx={{ width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box" }}>
			<Avatar
				sx={{
					width: 30,
					height: 30,
					bgcolor: color,
					fontSize: 12,
					fontWeight: 700
				}}>
				{initial}
			</Avatar>
			<Box minWidth={0} sx={{ flex: 1, minWidth: 0 }}>
				<Typography
					sx={{
						fontSize: 13,
						fontWeight: 600,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap"
					}}>
					{safeName}
				</Typography>
				<Typography sx={{ fontSize: 10, color: "#888" }}>
					{teamLabel}
				</Typography>
			</Box>
		</Box>
	);
}

export default Details;
