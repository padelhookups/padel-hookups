import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import useAuth from "../utils/useAuth";

import { selectEvents } from "../redux/slices/eventsSlice";

import { Box, Container, Tabs, Tab } from "@mui/material";

import Details from "../components/PremierPadel/Details";
import Header from "../components/PremierPadel/Header";
import Schedule from "../components/PremierPadel/Schedule";

export const BG = "#f5f4f0";
export const BORDER = "#e0dbd0";

const PremierPadelMatch = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const db = getFirestore();
	const { user } = useAuth();

	const eventId = location.state?.eventId || "";
	const match = location.state?.match || "";
	const mainColor = location.state?.mainColor || "";

	const events = useSelector(selectEvents);

	const [activeTab, setActiveTab] = useState(0);
	const [event, setEvent] = useState(null);
	const [summaryDate, setSummaryDate] = useState(null);
	const [summaryTime, setSummaryTime] = useState(null);
	const [summaryLocation, setSummaryLocation] = useState(null);
	const [teamA, setTeamA] = useState(null);
	const [teamB, setTeamB] = useState(null);
	const [currentTeam, setCurrentTeam] = useState(null);

	const onBack = () => {
		// Implement navigation back to matches list
		navigate(-1);
	};

	useEffect(() => {
		// get event from redux
		setEvent(events.filter((i) => i.id === eventId)[0]);
	}, [events]);

	useEffect(() => {
		if (match && event) {
			const teamAPair = event.Pairs[match.opponent1.id - 1];
			const teamBPair = event.Pairs[match.opponent2.id - 1];
			const teamAPlayers = teamAPair?.DisplayName || "";
			const teamBPlayers = teamBPair?.DisplayName || "";

			const teamAIds = [
				teamAPair?.Player1Id,
				teamAPair?.Player2Id
			].filter(Boolean);

			const teamBIds = [
				teamBPair?.Player1Id,
				teamBPair?.Player2Id
			].filter(Boolean);

			console.log("Team A players:", teamAPlayers);
			console.log("Team B players:", teamBPlayers);
			setTeamA(teamAPlayers);
			setTeamB(teamBPlayers);

			if (
				!match.teams &&
				event?.TournamentId &&
				match?.id
			) {
				// Update match in firebase to add teams info (player ids) if not already present, this is needed to identify which team the user logged in is in and show the schedule tab accordingly
				const teamsPayload = {
					teamA: {
						name: teamAPlayers,
						player1Id: teamAPair?.Player1Id || null,
						player2Id: teamAPair?.Player2Id || null
					},
					teamB: {
						name: teamBPlayers,
						player1Id: teamBPair?.Player1Id || null,
						player2Id: teamBPair?.Player2Id || null
					}
				};

				setDoc(
					doc(
						db,
						`Events/${eventId}/TournamentData/${event.TournamentId}/matches/${match.id}`
					),
					{ teams: teamsPayload },
					{ merge: true }
				).catch((error) => {
					console.error("Error updating match teams:", error);
				});
			}
			// identify which team the user logged id is in or if not in any team, hide the schedule, show de details tab and and results tabs
			// current user id comes from firebase auth
			if (user) {
				if (teamAIds.includes(user.uid)) {
					setCurrentTeam("teamA");
				} else if (teamBIds.includes(user.uid)) {
					setCurrentTeam("teamB");
				} else {
					setCurrentTeam(null);
				}
			}
		}
	}, [match, event]);

	console.log("PremierPadelMatch", match);

	return (
		<>
			<Header
				match={match}
				onBack={onBack}
				mainColor={mainColor}
				event={event}
			/>
			<Box sx={{ backgroundColor: BG, height: "calc(100vh - 270px)" }}>
				{/* Tabs */}
				<Tabs
					value={activeTab}
					onChange={(_, v) => setActiveTab(v)}
					variant='fullWidth'
					textColor='inherit'
					sx={{
						color: mainColor,
						bgcolor: "white",
						position: "sticky",
						top: 0,
						zIndex: 10,
						borderBottom: `1px solid ${BORDER}`,
						"& .MuiTab-root": {
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: 0.5,
							textTransform: "uppercase",
							color: "#888",
							fontFamily: "Barlow, sans-serif"
						},
						"& .MuiTab-root.Mui-selected": {
							color: `${mainColor} !important`
						},
						"& .MuiTab-root.Mui-focusVisible": {
							color: `${mainColor} !important`
						},
						"& .MuiTabs-indicator": { bgcolor: mainColor }
					}}>
					<Tab label='Summary' />
					<Tab label='Schedule' />
					<Tab label='Results' />
				</Tabs>

				<Container maxWidth='sm'>
					<Box>
						{activeTab === 0 && (
							<Details
								match={match}
								event={event}
								summaryDate={summaryDate}
								summaryTime={summaryTime}
								summaryLocation={summaryLocation}
								mainColor={mainColor}
							/>
						)}
						{activeTab === 1 && (
							<>
								<Schedule
									match={match}
									currentTeamId={currentTeam}
									onConfirmed={(date, time) => {
										setSummaryDate(date);
										setSummaryTime(time);
										setSummaryLocation("Court TBD");
									}}
									onLocationUpdated={(loc) =>
										setSummaryLocation(loc)
									}
									mainColor={mainColor}
								/>
							</>
						)}
						{/* {activeTab === 2 && <ResultsTab />} */}
					</Box>
				</Container>
			</Box>
		</>
	);
};

export default PremierPadelMatch;
