import React from "react";
import {
	Box,
	Typography,
	Grid,
	Card,
	CardContent,
	Chip
} from "@mui/material";
import {
	EmojiEvents,
	Star,
	LocalFireDepartment,
	Group,
	SportsScore,
	Favorite,
	FlashOn,
	WorkspacePremium
} from "@mui/icons-material";

const AVAILABLE_BADGES = [
	{
		id: "first_match",
		name: "First Match",
		description: "Play your first match",
		icon: SportsScore,
		color: "#4CAF50"
	},
	{
		id: "early_bird",
		name: "Early Bird",
		description: "Join 5 morning matches",
		icon: FlashOn,
		color: "#FF9800"
	},
	{
		id: "social_player",
		name: "Social Player",
		description: "Play with 10 different partners",
		icon: Group,
		color: "#2196F3"
	},
	{
		id: "on_fire",
		name: "On Fire",
		description: "Play 3 matches in one week",
		icon: LocalFireDepartment,
		color: "#F44336"
	},
	{
		id: "loyal_player",
		name: "Loyal Player",
		description: "Play for 30 consecutive days",
		icon: Favorite,
		color: "#E91E63"
	},
	{
		id: "champion",
		name: "Champion",
		description: "Complete 50 matches",
		icon: EmojiEvents,
		color: "#FFD700"
	},
	{
		id: "rising_star",
		name: "Rising Star",
		description: "Receive 10 positive reviews",
		icon: Star,
		color: "#9C27B0"
	},
	{
		id: "premium_player",
		name: "Premium Player",
		description: "Unlock premium features",
		icon: WorkspacePremium,
		color: "#673AB7"
	}
];

const Badges = ({ earnedBadges = [] }) => {
	const BadgeIcon = ({ badge, isEarned }) => {
		const Icon = badge.icon;
		return (
			<Box
				sx={{
					width: 60,
					height: 60,
					borderRadius: "50%",
					bgcolor: isEarned ? badge.color : "grey.300",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					mb: 1,
					opacity: isEarned ? 1 : 0.4,
					transition: "all 0.3s ease"
				}}>
				<Icon
					sx={{
						fontSize: 32,
						color: isEarned ? "white" : "grey.500"
					}}
				/>
			</Box>
		);
	};

	return (
		<Box sx={{ mb: 3 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2
				}}>
				<Typography
					variant='h5'
					component='h2'
					sx={{ fontWeight: "bold" }}>
					Badges
				</Typography>
				<Chip
					label={`${earnedBadges.length}/${AVAILABLE_BADGES.length}`}
					color='primary'
					size='small'
                    sx={{color: 'white'}}
				/>
			</Box>
			<Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
				{AVAILABLE_BADGES.map((badge) => {
					const isEarned = earnedBadges.includes(badge.id);
					return (
						<Grid 
							item 
                            size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
							key={badge.id}
							sx={{ display: "flex"}}>
							<Card
								sx={{
									height: 180,
                                    width: "100%",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "space-between",
									p: 2,
									opacity: isEarned ? 1 : 0.6,
									border: isEarned
										? `2px solid ${badge.color}`
										: "2px solid transparent",
									transition: "all 0.3s ease",
									"&:hover": {
										transform: isEarned
											? "scale(1.05)"
											: "none",
										boxShadow: isEarned ? 4 : 1
									}
								}}>
								<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
									<BadgeIcon badge={badge} isEarned={isEarned} />
									<Typography
										variant='subtitle2'
										sx={{
											fontWeight: "bold",
											textAlign: "center",
											mb: 0.5,
											lineHeight: 1.2
										}}>
										{badge.name}
									</Typography>
									<Typography
										variant='caption'
										color='text.secondary'
										sx={{
											textAlign: "center",
											fontSize: "0.7rem",
											lineHeight: 1.3
										}}>
										{badge.description}
									</Typography>
								</Box>
								{isEarned && (
									<Chip
										label='Earned'
										size='small'
										sx={{
											mt: 1,
											bgcolor: badge.color,
											color: "white",
											fontSize: "0.65rem",
											height: 20
										}}
									/>
								)}
							</Card>
						</Grid>
					);
				})}
			</Grid>
		</Box>
	);
};

export default Badges;
