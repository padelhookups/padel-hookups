import { useEffect, useState } from "react";
import {
	Box,
	Typography,
	Button,
	TextField,
	Paper,
	Stack,
	Divider
} from "@mui/material";
import { BORDER, BG } from "../../routes/PremierPadelMatch";

const BLUE = "#3a8fb5";
const GOLD_LIGHT = "#c9a84c";
const GOLD_DARK = "#7a6020";

const SETS = [
	{ key: 1, label: "Set 1", max: 7 },
	{ key: 2, label: "Set 2", max: 7 },
	{ key: 3, label: "Super TB", max: 99 }
];

const initialScores = () => ({
	1: { a: "", b: "" },
	2: { a: "", b: "" },
	3: { a: "", b: "" }
});

const Results = ({ match, onSubmit, mainColor }) => {
	const { teamA, teamB } = match?.teams;
	const styles = getStyles(mainColor);

	const [showResults, setShowResults] = useState(true);
	const [phase, setPhase] = useState("entry"); // entry | pending
	const [scores, setScores] = useState(initialScores());
	const [showSuperTB, setShowSuperTB] = useState(false);

	useEffect(() => {
		if (match.Location) {
			setShowResults(true);
		}
	}, [match]);

	function getVal(set, team) {
		const v = parseInt(scores[set][team]);
		return isNaN(v) ? 0 : v;
	}

	function getSetWinner(set) {
		const a = getVal(set, "a"),
			b = getVal(set, "b");
		if (a > b) return "a";
		if (b > a) return "b";
		return null;
	}

	// Auto-show super tiebreak when sets are split 1-1
	const s1w = getSetWinner(1),
		s2w = getSetWinner(2);
	const autoSuperTB = !!(s1w && s2w && s1w !== s2w);
	const superTBActive = showSuperTB || autoSuperTB;
	const setsToCount = superTBActive ? [1, 2, 3] : [1, 2];

	const winsA = setsToCount.filter((s) => getSetWinner(s) === "a").length;
	const winsB = setsToCount.filter((s) => getSetWinner(s) === "b").length;

	const hasAnyScore = setsToCount.some(
		(s) => getVal(s, "a") > 0 || getVal(s, "b") > 0
	);

	const winner = winsA > winsB ? "a" : winsB > winsA ? "b" : null;

	const scoreString = setsToCount
		.map((s) => `${getVal(s, "a")}-${getVal(s, "b")}`)
		.join(", ");

	// ── Handlers ───────────────────────────────────────────────────────────────
	function handleScoreChange(set, team, raw) {
		const s = SETS.find((s) => s.key === set);
		let val = raw.replace(/[^0-9]/g, "");
		if (val !== "" && parseInt(val) > s.max) val = String(s.max);
		setScores((prev) => ({
			...prev,
			[set]: { ...prev[set], [team]: val }
		}));
	}

	function handleSubmit() {
		if (!winner) return;
		const payload = {
			sets: setsToCount.map((s) => ({
				a: getVal(s, "a"),
				b: getVal(s, "b")
			})),
			winner: winner === "a" ? "teamA" : "teamB",
			scoreString
		};
		onSubmit?.(payload);
		setPhase("pending");
	}

	function handleCancel() {
		setScores(initialScores());
		setShowSuperTB(false);
		setPhase("entry");
	}

	return (
		<>
			{!showResults && (
				<Box p={2}>
					<Paper
						variant='outlined'
						sx={{
							borderRadius: 2,
							borderColor: BORDER,
							p: 5,
							textAlign: "center"
						}}>
						<Typography sx={{ fontSize: 48, mb: 1.5 }}>
							⏳
						</Typography>
						<Typography
							sx={{
								fontFamily: "Barlow Condensed, sans-serif",
								fontSize: 18,
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: 1,
								color: "#aaa"
							}}>
							Match Not Played Yet
						</Typography>
						<Typography
							sx={{
								fontSize: 13,
								color: "#aaa",
								mt: 1,
								lineHeight: 1.5
							}}>
							Results will appear here once the match has been
							played and scores submitted.
						</Typography>
					</Paper>
				</Box>
			)}
			{showResults && phase == "entry" && (
				<Box pb='70px'>
					{/* Title */}
					<Box px={2} pt={2} pb={0}>
						<Typography sx={styles.sectionLabel}>
							🎾 Submit Match Result
						</Typography>
						<Typography
							sx={{
								fontSize: 13,
								color: "#888",
								lineHeight: 1.5,
								mt: 0.5
							}}>
							Enter the score set by set. Both teams must confirm
							the result.
						</Typography>
					</Box>

					{/* Score card */}
					<Box
						mx={2}
						mt={2}
						sx={{
							background: "white",
							border: `1px solid ${BORDER}`,
							borderRadius: "12px",
							overflow: "hidden"
						}}>
						{/* Team header row */}
						<Box
							sx={styles.gridRow}
							borderBottom={`1px solid ${BORDER}`}>
							<Box sx={styles.setLabelCell} />
							<TeamCell team={teamA} />
							<VsDivider />
							<TeamCell team={teamB} />
						</Box>

						{/* Set rows */}
						{SETS.filter((s) => s.key < 3 || superTBActive).map(
							(set, idx, arr) => (
								<Box
									key={set.key}
									sx={styles.gridRow}
									borderBottom={
										idx < arr.length - 1
											? `1px solid ${BORDER}`
											: "none"
									}>
									<Box sx={styles.setLabelCell}>
										<Typography sx={styles.setLabel}>
											{set.label}
										</Typography>
									</Box>
									<ScoreCell
										value={scores[set.key].a}
										onChange={(v) =>
											handleScoreChange(set.key, "a", v)
										}
										winning={getSetWinner(set.key) === "a"}
									/>
									<VsDivider />
									<ScoreCell
										value={scores[set.key].b}
										onChange={(v) =>
											handleScoreChange(set.key, "b", v)
										}
										winning={getSetWinner(set.key) === "b"}
									/>
								</Box>
							)
						)}
					</Box>

					{/* Super tiebreak toggle */}
					{!autoSuperTB && (
						<Box px={2} pt={1.5}>
							<Button
								onClick={() => setShowSuperTB((v) => !v)}
								sx={{
									background: "none",
									border: `1px dashed ${BORDER}`,
									borderRadius: "20px",
									px: 2,
									py: 0.75,
									fontSize: 12,
									color: "#888",
									fontFamily: "Barlow, sans-serif",
									textTransform: "none",
									"&:hover": {
										borderColor: mainColor,
										color: mainColor,
										background: "#fdf8ee"
									}
								}}>
								{showSuperTB
									? "− Remove Super Tiebreak"
									: "+ Add Super Tiebreak"}
							</Button>
						</Box>
					)}

					{/* Winner preview */}
					{hasAnyScore && (
						<Box
							mx={2}
							mt={2}
							sx={{
								background: BG,
								border: `1px solid ${BORDER}`,
								borderRadius: "10px",
								p: "12px 14px"
							}}>
							<Typography
								sx={{
									fontSize: 10,
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: 1,
									color: "#888",
									mb: 0.75
								}}>
								Result Preview
							</Typography>
							<Box
								display='flex'
								alignItems='center'
								justifyContent='space-between'>
								<Typography
									sx={{
										fontFamily:
											"Barlow Condensed, sans-serif",
										fontSize: 16,
										fontWeight: 700,
										color:
											winner === "a"
												? GOLD_DARK
												: winner === "b"
													? BLUE
													: "#888"
									}}>
									{winner === "a"
										? `🏆 ${teamA.name} wins`
										: winner === "b"
											? `🏆 ${teamB.name} wins`
											: "⚖️ Tied — complete all sets"}
								</Typography>
								<Typography
									sx={{
										fontSize: 14,
										fontWeight: 600,
										color: "#888",
										fontFamily:
											"Barlow Condensed, sans-serif"
									}}>
									{scoreString}
								</Typography>
							</Box>
						</Box>
					)}

					{/* Submit */}
					<Box px={2} pt={2} pb={3}>
						<Button
							fullWidth
							disabled={!winner}
							onClick={handleSubmit}
							sx={{
								py: 1.75,
								background: winner
									? `linear-gradient(135deg, ${GOLD_DARK}, ${mainColor})`
									: undefined,
								fontFamily: "Barlow Condensed, sans-serif",
								fontSize: 15,
								fontWeight: 700,
								letterSpacing: 1,
								color: "white",
								borderRadius: "10px",
								boxShadow: "none",
								textTransform: "uppercase",
								"&:hover": { boxShadow: "none", opacity: 0.9 },
								"&.Mui-disabled": {
									background: "#ddd",
									color: "white"
								}
							}}>
							✅ Submit Result
						</Button>
						<Typography
							sx={{
								textAlign: "center",
								fontSize: 11,
								color: "#aaa",
								mt: 1,
								lineHeight: 1.5
							}}>
							The other team will be asked to confirm. Result is
							final once both sides agree.
						</Typography>
					</Box>
				</Box>
			)}
		</>
	);
};

// ── Sub-components ─────────────────────────────────────────────────────────

function TeamCell({ team }) {
	return (
		<Box sx={{ py: "14px", px: 1, textAlign: "center", flex: 1 }}>
			<Box
				sx={{
					width: 40,
					height: 40,
					borderRadius: "50%",
					bgcolor: team.color,
					color: "white",
					fontFamily: "Barlow Condensed, sans-serif",
					fontWeight: 700,
					fontSize: 14,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					mx: "auto",
					mb: "4px"
				}}>
				{team.initials}
			</Box>
			<Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
				{team.name}
			</Typography>
		</Box>
	);
}

function VsDivider() {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: 32,
				flexShrink: 0
			}}>
			<Typography
				sx={{
					fontFamily: "Barlow Condensed, sans-serif",
					fontWeight: 800,
					fontSize: 13,
					color: "#aaa"
				}}>
				VS
			</Typography>
		</Box>
	);
}

function ScoreCell({ value, onChange, winning, mainColor }) {
	return (
		<Box
			sx={{
				flex: 1,
				py: 1,
				px: 1,
				display: "flex",
				justifyContent: "center"
			}}>
			<Box
				component='input'
				type='number'
				inputMode='numeric'
				value={value}
				onChange={(e) => onChange(e.target.value)}
				sx={{
					width: "100%",
					maxWidth: 64,
					height: 52,
					borderRadius: "10px",
					border: `1.5px solid ${winning ? mainColor : BORDER}`,
					background: winning ? "#fdf0d0" : BG,
					fontFamily: "Barlow Condensed, sans-serif",
					fontSize: 28,
					fontWeight: 800,
					textAlign: "center",
					color: winning ? GOLD_DARK : "#222",
					outline: "none",
					transition: "all 0.15s",
					"&:focus": {
						borderColor: mainColor,
						background: "#fdf8ee",
						boxShadow: `0 0 0 3px rgba(154,125,46,0.1)`
					},
					"&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
						{ WebkitAppearance: "none", margin: 0 },
					MozAppearance: "textfield"
				}}
			/>
		</Box>
	);
}

// ── Styles ──────────────────────────────────────────────────────────────────
const getStyles = (mainColor) => ({
	sectionLabel: {
		fontFamily: "Barlow Condensed, sans-serif",
		fontSize: 11,
		fontWeight: 700,
		textTransform: "uppercase",
		letterSpacing: 1.5,
		color: mainColor
	},
	gridRow: {
		display: "grid",
		gridTemplateColumns: "64px 1fr 32px 1fr",
		alignItems: "center"
	},
	setLabelCell: {
		pl: "14px",
		py: "12px"
	},
	setLabel: {
		fontFamily: "Barlow Condensed, sans-serif",
		fontSize: 12,
		fontWeight: 700,
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#888"
	}
});

export default Results;
