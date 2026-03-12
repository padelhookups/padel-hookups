import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import {
	doc,
	getFirestore,
	updateDoc,
	setDoc,
	onSnapshot
} from "firebase/firestore";
import useAuth from "../utils/useAuth";

import { selectEvents } from "../redux/slices/eventsSlice";

import { Box, Container, Tabs, Tab } from "@mui/material";

import Details from "../components/PremierPadel/Details";
import Header from "../components/PremierPadel/Header";
import Schedule from "../components/PremierPadel/Schedule";
import Results from "../components/PremierPadel/Results";

export const BG = "#f5f4f0";
export const BORDER = "#e0dbd0";

const PremierPadelMatch = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const db = getFirestore();
	const { user } = useAuth();

	const eventId = location.state?.eventId || "";
	const initialMatch = location.state?.match || "";
	const mainColor = location.state?.mainColor || "";

	const events = useSelector(selectEvents);

	const [activeTab, setActiveTab] = useState(0);
	const [event, setEvent] = useState(null);
	const [match, setMatch] = useState(initialMatch);
	const [summaryDate, setSummaryDate] = useState(null);
	const [summaryTime, setSummaryTime] = useState(null);
	const [summaryLocation, setSummaryLocation] = useState(null);
	const [allPlayersIds, setAllPlayersIds] = useState(null);
	const [teamA, setTeamA] = useState(null);
	const [teamB, setTeamB] = useState(null);
	const [currentTeam, setCurrentTeam] = useState(null);

	const onBack = () => {
		// Implement navigation back to matches list
		navigate(-1);
	};

	// Set up real-time listener for match updates
	useEffect(() => {
		if (!eventId || !event?.TournamentId || !initialMatch?.id) return;

		const matchRef = doc(
			db,
			`Events/${eventId}/TournamentData/${event.TournamentId}/matches/${initialMatch.id}`
		);

		const unsubscribe = onSnapshot(
			matchRef,
			(snapshot) => {
				if (snapshot.exists()) {
					const updatedMatch = {
						id: snapshot.id,
						...snapshot.data()
					};
					setMatch(updatedMatch);

					// Update summary fields if they were set by this or the other team
					if (updatedMatch.ChoosenDate)
						setSummaryDate(updatedMatch.ChoosenDate);
					if (updatedMatch.ChoosenTime)
						setSummaryTime(updatedMatch.ChoosenTime);
					if (updatedMatch.location)
						setSummaryLocation(updatedMatch.location);
          if (updatedMatch.Location) {
            setSummaryLocation(updatedMatch.Location);
          }
				}
			},
			(error) => {
				console.error("Error listening to match updates:", error);
			}
		);

		return () => unsubscribe();
	}, [eventId, event?.TournamentId, initialMatch?.id, db]);

	useEffect(() => {
		// get event from redux
		setEvent(events.filter((i) => i.id === eventId)[0]);
	}, [events]);

	useEffect(() => {
		if (match && event && user) {
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

			setTeamA(teamAPlayers);
			setTeamB(teamBPlayers);
			setAllPlayersIds([...teamAIds, ...teamBIds]);

			if (!match.teams && event?.TournamentId && match?.id) {
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

				match.teams = teamsPayload; // Update local match object to avoid re-rendering issues
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

			if (teamAIds.includes(user.uid)) {
				setCurrentTeam("teamA");
			} else if (teamBIds.includes(user.uid)) {
				setCurrentTeam("teamB");
			} else {
				setCurrentTeam(null);
			}
		}
	}, [match, event, user]);

	const handleSubmitAvailability = async (payload) => {
		if (!eventId || !event?.TournamentId || !match?.id || !currentTeam) {
			throw new Error("Missing data to update scheduling");
		}

		await setDoc(
			doc(
				db,
				`Events/${eventId}/TournamentData/${event.TournamentId}/matches/${match.id}`
			),
			{
				...match,
				scheduling: {
					...match.scheduling,
					[currentTeam]: payload
				}
			}
		);
	};

	const handleLocationUpdate = async (loc) => {
		if (!eventId || !event?.TournamentId || !match?.id) {
			throw new Error("Missing data to update location");
		}
		var matchRef = doc(
			db,
			`Events/${eventId}/TournamentData/${event.TournamentId}/matches/${match.id}`
		);

		const updates = {
			Location: loc
		};

		await updateDoc(matchRef, updates);
	};

	const handleResults = async (resultsPayload) => {
		if (!eventId || !event?.TournamentId || !match?.id) {
			throw new Error("Missing data to update results");
		}
		var matchRef = doc(
			db,
			`Events/${eventId}/TournamentData/${event.TournamentId}/matches/${match.id}`
		);
		const updates = {
			results: resultsPayload
		};
		console.log(updates);
		
		/* await updateDoc(matchRef, updates); */
	};

	return (
		<>
			<Header
				match={match}
				onBack={onBack}
				mainColor={mainColor}
				event={event}
			/>
			<Box sx={{ backgroundColor: BG }}>
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
						height: 50,
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
					{user?.isAdmin || currentTeam ? (
						<Tab label='Schedule' />
					) : null}
					<Tab label='Results' />
				</Tabs>

				<Container maxWidth='sm'>
					<Box
						sx={{
							height: "calc(100vh - 320px)",
							overflowY: "auto"
						}}>
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
									onSubmitAvailability={
										handleSubmitAvailability
									}
									onConfirmed={async (
										date,
										time,
										overlaps,
										chosenOverlaps
									) => {
										console.log(overlaps);

										// remove chosen overlaps from the overlaps array to avoid showing them as conflicts in the match details

										const finalOverlaps = overlaps
											.map((o) => {
												if (
													o.date ===
													chosenOverlaps.date
												) {
													// Remove the chosen slot from this date's slots
													const filteredSlots =
														o.slots.filter(
															(slot) =>
																slot !==
																chosenOverlaps.slot
														);
													return {
														date: o.date,
														slots: filteredSlots
													};
												}
												return o;
											})
											.filter((o) => o.slots.length > 0); // Remove dates with no slots left // remove dates with no overlapping slots

										console.log(finalOverlaps);

										// update match in firebase with confirmed date and time
										var matchRef = doc(
											db,
											`Events/${eventId}/TournamentData/${event.TournamentId}/matches/${match.id}`
										);

										const updates = {
											ChoosenDate: date,
											ChoosenTime: time,
											Overlaps: finalOverlaps
										};

										await updateDoc(matchRef, updates);
									}}
									onLocationUpdated={(loc) =>
										handleLocationUpdate(loc)
									}
									mainColor={mainColor}
								/>
							</>
						)}
						{activeTab === 2 && <Results match={match} mainColor={mainColor} onSubmit={handleResults}/>}
					</Box>
				</Container>
			</Box>
		</>
	);
};

export default PremierPadelMatch;
