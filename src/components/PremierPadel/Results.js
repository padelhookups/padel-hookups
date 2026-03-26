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

//const BLUE = "#3a8fb5";
/* const GOLD_LIGHT = "#c9a84c";
const GOLD_DARK = "#7a6020"; */

const SETS = [
	{ key: 1, label: "Set 1", max: 7 },
	{ key: 2, label: "Set 2", max: 7 },
	{ key: 3, label: "Super TB", max: 99 }
];


const Results = ({ match, onSubmit, onCancel, mainColor, currentTeamId, user, allPlayersIds }) => {
	const { teamA, teamB } = match?.teams;
	const styles = getStyles(mainColor);

	// Access control: only players in the match or admins can edit
	const canEditResults =
		user?.IsAdmin || (allPlayersIds && allPlayersIds.includes(user?.uid));

	// Confirm button: strictly match players only (not even admins)
	const isMatchPlayer = !!(allPlayersIds && allPlayersIds.includes(user?.uid));

	const [showResults, setShowResults] = useState(true);
	const [phase, setPhase] = useState("entry"); // entry | pending | toConfirm | confirmed
	const [scores, setScores] = useState(null);

	useEffect(() => {
		if (match.Location) {
			setShowResults(true);
		}
		if (match.results) {
			const set1 = match.results.sets?.[0] || { a: 0, b: 0 };
			const set2 = match.results.sets?.[1] || { a: 0, b: 0 };
			const set3 = match.results.sets?.[2] || { a: 0, b: 0 };
			const results = {
				1: { a: set1.a, b: set1.b },
				2: { a: set2.a, b: set2.b },
				3: { a: set3.a, b: set3.b }
			}
			setScores(results);
			
			// Determine phase based on submissions and confirmations
			const submittedBy = match.results.submittedByTeam;
			const confirmedBy = match.results.confirmedByTeams || [];
			const bothConfirmed = confirmedBy.includes("teamA") && confirmedBy.includes("teamB");
			const canUserConfirm =
				user?.IsAdmin ||
				(!!currentTeamId && !!submittedBy && submittedBy !== currentTeamId);
			
			if (bothConfirmed) {
				setPhase("confirmed");
			} else if (canUserConfirm) {
				// Other team (or admin) can review/confirm
				setPhase("toConfirm");
			} else {
				// Submitter (or non-eligible user) waits for confirmation
				setPhase("pending");
			}
		}
	}, [match, currentTeamId, user]);

	function getVal(set, team) {
		const setScore = scores?.[set];
		const v = parseInt(setScore?.[team], 10);
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
	const setsToCount = autoSuperTB ? [1, 2, 3] : [1, 2];

	const winsA = setsToCount.filter((s) => getSetWinner(s) === "a").length;
	const winsB = setsToCount.filter((s) => getSetWinner(s) === "b").length;

	const hasAnyScore = setsToCount.some(
		(s) => getVal(s, "a") > 0 || getVal(s, "b") > 0
	);

	const winner = winsA > winsB ? "a" : winsB > winsA ? "b" : null;

	const scoreString = setsToCount
		.map((s) => `${getVal(s, "a")}-${getVal(s, "b")}`)
		.join(", ");

	const submittedByTeam = match?.results?.submittedByTeam;
	const waitingTeamName =
		submittedByTeam === "teamA"
			? teamB?.name
			: submittedByTeam === "teamB"
				? teamA?.name
				: 'the other team';

	const submitedTeamName = submittedByTeam === "teamA"
		? teamA?.name
		: submittedByTeam === "teamB"
			? teamB?.name
			: "";

	const userSubmittedThisResult =
		!!currentTeamId && currentTeamId === submittedByTeam;

	// ── Handlers ───────────────────────────────────────────────────────────────
	function handleScoreChange(set, team, raw) {
		if (!canEditResults) return;
		const s = SETS.find((s) => s.key === set);
		let val = raw.replace(/[^0-9]/g, "");
		if (val !== "" && parseInt(val) > s.max) val = String(s.max);
		setScores((prev) => ({
			...(prev || {}),
			[set]: { ...(prev?.[set] || { a: "", b: "" }), [team]: val }
		}));
	}

	function handleSubmit() {
		if (!winner) return;
		const initialConfirmedBy = currentTeamId ? [currentTeamId] : [];
		const payload = {
			sets: setsToCount.map((s) => ({
				a: getVal(s, "a"),
				b: getVal(s, "b")
			})),
			winner: winner === "a" ? "teamA" : "teamB",
			scoreString,
			submittedByTeam: currentTeamId || 'Admin',
			confirmedByTeams: initialConfirmedBy // Start with submitting team self-confirmed
		};
		onSubmit?.(payload);
		setPhase("pending");
	}

	function handleConfirm() {
		if (!match?.results) return;
		const confirmedByTeams = match.results.confirmedByTeams || [];
		const newConfirmed = [...new Set([...confirmedByTeams, currentTeamId])];
		const payload = {
			...match.results,
			confirmedByTeams: newConfirmed,
			phase: newConfirmed.includes("teamA") && newConfirmed.includes("teamB") ? "confirmed" : "pending"
		};
		onSubmit?.(payload);
	}

	function handleModify() {
		const set1 = match.results.sets?.[0] || { a: 0, b: 0 };
		const set2 = match.results.sets?.[1] || { a: 0, b: 0 };
		const set3 = match.results.sets?.[2] || { a: 0, b: 0 };
		setPhase("entry");
		setScores({
			1: { a: set1.a, b: set1.b },
			2: { a: set2.a, b: set2.b },
			3: { a: set3.a, b: set3.b }
		});
	}

	function handleCancel() {
		setScores(null);
		setPhase("entry");
		onCancel?.();
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
							{canEditResults
								? "Enter the score set by set. Both teams must confirm the result."
								: "Only the 4 match players and admins can submit results."}
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
						{SETS.filter((s) => s.key < 3 || autoSuperTB).map(
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
										value={scores?.[set.key]?.a ?? ""}
										onChange={(v) =>
											handleScoreChange(set.key, "a", v)
										}
										winning={getSetWinner(set.key) === "a"}
										mainColor={mainColor}
										disabled={!canEditResults}
									/>
									<VsDivider />
									<ScoreCell
										value={scores?.[set.key]?.b ?? ""}
										onChange={(v) =>
											handleScoreChange(set.key, "b", v)
										}
										winning={getSetWinner(set.key) === "b"}
										mainColor={mainColor}
										disabled={!canEditResults}
									/>
								</Box>
							)
						)}
					</Box>

					{/* Super tiebreak toggle */}
					{/* {!autoSuperTB && (
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
							</Button>
						</Box>
					)} */}

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
										color: mainColor
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
						disabled={!winner || !canEditResults}
							onClick={handleSubmit}
							sx={{
								py: 1.75,
								background: winner ? mainColor : undefined,
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

			{showResults && phase == "pending" && (
				<Box
					p={2}
					pb='70px'
					display='flex'
					flexDirection='column'
					gap={1.5}>
					{/* Waiting card */}
					<Paper
						variant='outlined'
						sx={{
							borderRadius: "12px",
							borderColor: BORDER,
							textAlign: "center",
							p: "28px 20px"
						}}>
						<Typography sx={{ fontSize: 42, mb: 1.25 }}>
							⏳
						</Typography>
						<Typography
							sx={{
								fontFamily: "Barlow Condensed, sans-serif",
								fontSize: 17,
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: 1,
								mb: 0.75
							}}>
							Waiting for Confirmation
						</Typography>
						<Typography
							sx={{
								fontSize: 13,
								color: "#888",
								lineHeight: 1.5
							}}>
								{userSubmittedThisResult
									? "You submitted the result. Waiting for "
									: "Result submitted. Waiting for "}
								<strong>{waitingTeamName || "the other team"}</strong>{" "}
								to confirm.
						</Typography>
					</Paper>

					{/* Submitted score breakdown */}
					<Paper
						variant='outlined'
						sx={{
							borderRadius: "12px",
							borderColor: BORDER,
							p: 2
						}}>
						<Typography sx={styles.sectionLabel}>
							📊 Submitted Score
						</Typography>
						<Box
							mt={1}
							sx={{
								display: "grid",
								gridTemplateColumns: "1fr auto 1fr",
								alignItems: "center"
							}}>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 700,
									textAlign: "center",
									color: winner === "a" ? mainColor : "#888",
									fontFamily: "Barlow Condensed, sans-serif"
								}}>
								{teamA?.name}
							</Typography>
							<Typography
								sx={{
									fontSize: 11,
									fontWeight: 700,
									color: "#aaa",
									px: 1
								}}>
								VS
							</Typography>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 700,
									textAlign: "center",
									color: winner === "b" ? mainColor : "#888",
									fontFamily: "Barlow Condensed, sans-serif"
								}}>
								{teamB?.name}
							</Typography>
						</Box>
						<Stack
							mt={1}
							divider={<Divider sx={{ borderColor: BORDER }} />}>
							{setsToCount.map((s) => {
								const sw = getSetWinner(s);
								const label = s === 3 ? "Super TB" : `Set ${s}`;
								return (
									<Box
										key={s}
										display='flex'
										alignItems='center'
										justifyContent='space-between'
										py={0.875}>
										<Typography
											sx={{
												fontSize: 12,
												fontWeight: 600,
												textTransform: "uppercase",
												letterSpacing: 0.5,
												color: "#888"
											}}>
											{label}
										</Typography>
										<Typography
											sx={{
												fontFamily:
													"Barlow Condensed, sans-serif",
												fontSize: 20,
												fontWeight: 700,
												lineHeight: 1
											}}>
											<Box
												component='span'
												sx={{
													color:
														sw === "a"
															? mainColor
															: "inherit"
												}}>
												{getVal(s, "a")}
											</Box>
											<Box
												component='span'
												sx={{
													color: "#aaa",
													fontSize: 14,
													mx: "5px"
												}}>
												–
											</Box>
											<Box
												component='span'
												sx={{
													color:
														sw === "b"
															? mainColor
															: "inherit"
												}}>
												{getVal(s, "b")}
											</Box>
										</Typography>
									</Box>
								);
							})}
						</Stack>
						<Typography
							sx={{
								mt: 1,
								fontSize: 12,
								fontWeight: 700,
								textAlign: "center",
								color: winner ? mainColor : "#888",
								fontFamily: "Barlow Condensed, sans-serif"
							}}>
							{winner === "a"
								? `Winner: ${teamA?.name}`
								: winner === "b"
									? `Winner: ${teamB?.name}`
									: "Winner: Pending"}
						</Typography>
					</Paper>

					{/* Cancel */}
					<Button
						fullWidth
						onClick={handleCancel}
						sx={{
							py: 1.5,
							background: "none",
							border: `1px solid ${BORDER}`,
							borderRadius: "10px",
							fontFamily: "Barlow, sans-serif",
							fontSize: 13,
							color: "#888",
							textTransform: "none",
							"&:hover": {
								borderColor: "#aaa",
								background: "none"
							}
						}}>
						Cancel &amp; Re-enter
					</Button>
				</Box>
			)}

			{showResults && phase == "toConfirm" && (
				<Box
					p={2}
					pb='70px'
					display='flex'
					flexDirection='column'
					gap={1.5}>
					{/* Confirmation request card */}
					<Paper
						variant='outlined'
						sx={{
							borderRadius: "12px",
							borderColor: BORDER,
							textAlign: "center",
							p: "28px 20px"
						}}>
						<Typography sx={{ fontSize: 42, mb: 1.25 }}>
							✋
						</Typography>
						<Typography
							sx={{
								fontFamily: "Barlow Condensed, sans-serif",
								fontSize: 17,
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: 1,
								mb: 0.75
							}}>
							Review Result
						</Typography>
						<Typography
							sx={{
								fontSize: 13,
								color: "#888",
								lineHeight: 1.5
							}}>
							<strong>{userSubmittedThisResult ? "You" : submitedTeamName ? submitedTeamName : "Admin"}</strong> submitted a result. 
							Please review and confirm or edit.
						</Typography>
					</Paper>

					{/* Submitted score breakdown */}
					<Paper
						variant='outlined'
						sx={{
							borderRadius: "12px",
							borderColor: BORDER,
							p: 2
						}}>
						<Typography sx={styles.sectionLabel}>
							📊 Submitted Score
						</Typography>
						<Box
							mt={1}
							sx={{
								display: "grid",
								gridTemplateColumns: "1fr auto 1fr",
								alignItems: "center"
							}}>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 700,
									textAlign: "center",
									color: winner === "a" ? mainColor : "#888",
									fontFamily: "Barlow Condensed, sans-serif"
								}}>
								{teamA?.name}
							</Typography>
							<Typography
								sx={{
									fontSize: 11,
									fontWeight: 700,
									color: "#aaa",
									px: 1
								}}>
								VS
							</Typography>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 700,
									textAlign: "center",
									color: winner === "b" ? mainColor : "#888",
									fontFamily: "Barlow Condensed, sans-serif"
								}}>
								{teamB?.name}
							</Typography>
						</Box>
						<Stack
							mt={1}
							divider={<Divider sx={{ borderColor: BORDER }} />}>
							{setsToCount.map((s) => {
								const sw = getSetWinner(s);
								const label = s === 3 ? "Super TB" : `Set ${s}`;
								return (
									<Box
										key={s}
										display='flex'
										alignItems='center'
										justifyContent='space-between'
										py={0.875}>
										<Typography
											sx={{
												fontSize: 12,
												fontWeight: 600,
												textTransform: "uppercase",
												letterSpacing: 0.5,
												color: "#888"
											}}>
											{label}
										</Typography>
										<Typography
											sx={{
												fontFamily:
													"Barlow Condensed, sans-serif",
												fontSize: 20,
												fontWeight: 700,
												lineHeight: 1
											}}>
											<Box
												component='span'
												sx={{
													color:
														sw === "a"
															? mainColor
															: "inherit"
												}}>
												{getVal(s, "a")}
											</Box>
											<Box
												component='span'
												sx={{
													color: "#aaa",
													fontSize: 14,
													mx: "5px"
												}}>
												–
											</Box>
											<Box
												component='span'
												sx={{
													color:
														sw === "b"
															? mainColor
															: "inherit"
												}}>
												{getVal(s, "b")}
											</Box>
										</Typography>
									</Box>
								);
							})}
						</Stack>
						<Typography
							sx={{
								mt: 1,
								fontSize: 12,
								fontWeight: 700,
								textAlign: "center",
								color: winner ? mainColor : "#888",
								fontFamily: "Barlow Condensed, sans-serif"
							}}>
							{winner === "a"
								? `Winner: ${teamA?.name}`
								: winner === "b"
									? `Winner: ${teamB?.name}`
									: "Winner: Pending"}
						</Typography>
					</Paper>

					{/* Action buttons */}
					<Box display='flex' gap={1.5}>
						{isMatchPlayer && (
							<Button
								fullWidth
								onClick={handleConfirm}
								sx={{
									py: 1.5,
									background: mainColor,
									border: `1px solid ${mainColor}`,
									borderRadius: "10px",
									fontFamily: "Barlow, sans-serif",
									fontSize: 13,
									color: "white",
									fontWeight: 600,
									textTransform: "uppercase",
									"&:hover": {
										background: mainColor,
										opacity: 0.9
									}
								}}>
								✅ Confirm
							</Button>
						)}
						<Button
							fullWidth
							onClick={handleModify}
							sx={{
								py: 1.5,
								background: "none",
								border: `1px solid ${BORDER}`,
								borderRadius: "10px",
								fontFamily: "Barlow, sans-serif",
								fontSize: 13,
								color: "#888",
								fontWeight: 600,
								textTransform: "uppercase",
								"&:hover": {
									borderColor: "#aaa",
									background: "none"
								}
							}}>
							✏️ Modify
						</Button>
					</Box>
				</Box>
			)}

			{showResults && phase == "confirmed" && (
				<Box pb='70px'>
					{/* Confirmed header */}
					<Box px={2} pt={2} pb={0}>
						<Typography sx={styles.sectionLabel}>
							✅ Result Confirmed
						</Typography>
						<Typography
							sx={{
								fontSize: 13,
								color: "#888",
								lineHeight: 1.5,
								mt: 0.5
							}}>
							Both teams have confirmed. Match is complete.
						</Typography>
					</Box>

					{/* Score card (read-only) */}
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
						{SETS.filter((s) => s.key < 3 || autoSuperTB).map(
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
										value={scores?.[set.key]?.a ?? 0}
										onChange={() => {}}
										winning={getSetWinner(set.key) === "a"}
										mainColor={mainColor}
										disabled={true}
									/>
									<VsDivider />
									<ScoreCell
										value={scores?.[set.key]?.b ?? 0}
										onChange={() => {}}
										winning={getSetWinner(set.key) === "b"}
										mainColor={mainColor}
										disabled={true}
									/>
								</Box>
							)
						)}
					</Box>

					{/* Winner summary */}
					{hasAnyScore && (
						<Box
							mx={2}
							mt={2}
							sx={{
								background: "#fdf8ee",
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
								Match Winner
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
										color: mainColor
									}}>
									{winner === "a"
										? `🏆 ${teamA.name} wins`
										: winner === "b"
											? `🏆 ${teamB.name} wins`
											: "⚖️ Tied"}
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

function ScoreCell({ value, onChange, winning, mainColor, disabled }) {
	return (
		<Box
			sx={{
				flex: 1,
				py: 1,
				px: 1,
				display: "flex",
				justifyContent: "center",
				opacity: disabled ? 0.6 : 1
			}}>
			<Box
				component='input'
				type='number'
				inputMode='numeric'
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				sx={{
					width: "100%",
					maxWidth: 64,
					height: 52,
					borderRadius: "10px",
					border: `1.5px solid ${winning ? mainColor : BORDER}`,
					background: disabled ? "#f0f0f0" : winning ? "#fdf0d0" : BG,
					fontFamily: "Barlow Condensed, sans-serif",
					fontSize: 28,
					fontWeight: 800,
					textAlign: "center",
					color: winning ? mainColor : "#222",
					outline: "none",
					transition: "all 0.15s",
					cursor: disabled ? "not-allowed" : "text",
					"&:focus": disabled
						? {}
						: {
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
