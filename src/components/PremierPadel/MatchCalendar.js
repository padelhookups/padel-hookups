import { Box, Typography, Stack } from "@mui/material";

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

const MatchCalendar = ({
	year,
	month,
	windowStart,
	windowEnd,
	team1Avail,
	team2Avail,
	onDayTap,
	interactive,
	mainColor
}) => {
	console.log(team1Avail, team2Avail, interactive);
	
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	function dateKey(d) {
		return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
	}

	const days = [];
	for (let d = 1; d <= daysInMonth; d++) {
		const key = dateKey(d);
		const outside = key < windowStart || key > windowEnd;
		const inT1 = !!team1Avail?.[key];
		const inT2 = !!(team2Avail?.[key]?.size > 0);
		if(!outside){
			days.push({ d, key, outside, inT1, inT2 });
		}
	}

	return (
		<Box px={2} pb={1.5}>
			<Typography
				sx={{
					fontFamily: "Barlow Condensed, sans-serif",
					fontWeight: 700,
					fontSize: 13,
					textTransform: "uppercase",
					letterSpacing: 1,
					color: mainColor,
					my: 2
				}}>
				{MONTH_NAMES[month]} {year}
			</Typography>

			{/* Week day headers */}
			<Box
				display='grid'
				gridTemplateColumns='repeat(7,1fr)'
				gap={0.5}
				mb={0.75}>
				{DAY_NAMES.map((d, i) => (
					<Typography
						key={i}
						sx={{
							textAlign: "center",
							fontSize: 10,
							fontWeight: 600,
							color: "#aaa",
							textTransform: "uppercase"
						}}>
						{d}
					</Typography>
				))}
			</Box>

			{/* Day cells */}
			<Box display='grid' gridTemplateColumns='repeat(7,1fr)' gap={0.5}>
				{days.map((cell) => {
					if (cell.empty) return <Box key={cell.key} />;
					const { d, key, inT1, inT2 } = cell;
					//console.log(d, key, inT1, inT2);
					
					const bothSelected = inT1 && inT2;
					const canTap = interactive;

					let bgcolor = "transparent";
					let color = "#222";
					let border = "1px solid transparent";

					if (bothSelected) {
						bgcolor = mainColor;
						color = "white";
						border = `1px solid ${mainColor}`;
					} else if (inT2 && interactive) {
						bgcolor = mainColor;
						color = "white";
						border = `1px solid ${mainColor}`;
					} else if (inT1) {
						bgcolor = "#e8f4f8";
						color = "#0c6ea1";
						border = "1px solid #90c9e8";
					}

					return (
						<Box
							key={key}
							onClick={canTap ? () => onDayTap(key) : undefined}
							sx={{
								aspectRatio: "1",
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 12,
								fontWeight: 500,
								cursor: canTap ? "pointer" : "default",
								bgcolor,
								color,
								border,
								position: "relative",
								transition: "all 0.15s",
								"&:hover": canTap
									? {
											bgcolor: inT2
												? mainColor
												: "#f5ecd6",
											border: `1px solid ${mainColor}`
										}
									: {}
							}}>
							{d}
							{bothSelected && (
								<Box
									sx={{
										position: "absolute",
										bottom: 2,
										left: "50%",
										transform: "translateX(-50%)",
										width: 4,
										height: 4,
										borderRadius: "50%",
										bgcolor: "white"
									}}
								/>
							)}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export default MatchCalendar;
