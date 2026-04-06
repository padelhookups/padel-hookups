import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { useSelector } from "react-redux";
import { BracketsManager } from "brackets-manager";
import {
	doc,
	getDoc,
	getFirestore,
	updateDoc,
	setDoc,
	onSnapshot
} from "firebase/firestore";
import useAuth from "../utils/useAuth";
import { FirestoreAdapter } from "../utils/FirestoreAdapter";
import { sendGroupsNotification } from "../firebase-config";

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
	const { eventId: eventIdParam, matchId: matchIdParam } = useParams();
	const db = getFirestore();
	const { user } = useAuth();

	const events = useSelector(selectEvents);

	const [activeTab, setActiveTab] = useState(0);
	const [event, setEvent] = useState(null);
	const [match, setMatch] = useState(null);
	const [summaryDate, setSummaryDate] = useState(null);
	const [summaryTime, setSummaryTime] = useState(null);
	const [summaryLocation, setSummaryLocation] = useState(null);
	const [allPlayersIds, setAllPlayersIds] = useState(null);
	const [teamA, setTeamA] = useState(null);
	const [teamB, setTeamB] = useState(null);
	const [currentTeam, setCurrentTeam] = useState(null);
	const [mainColor, setMainColor] = useState(null);

	// Determine tab indices based on schedule visibility
	const showScheduleTab = user?.IsAdmin || currentTeam;
	const SUMMARY_TAB = 0;
	const SCHEDULE_TAB = 1;
	const RESULTS_TAB = showScheduleTab ? 2 : 1;

	const onBack = () => {
		// Implement navigation back to matches list
		navigate(-1);
	};

	// Fallback: when the route is opened directly, location.state.match may be missing.
	useEffect(() => {
		const fetchMatch = async () => {
			if (match) return;

			try {
				// get event first
				const eventRef = doc(db, "Events", eventIdParam);
				const eventSnap = await getDoc(eventRef);
				if (eventSnap.exists()) {
					setEvent({ id: eventSnap.id, ...eventSnap.data() });
					setMainColor(eventSnap.data().SponsorColor);
				} else {
					console.error("Event not found for match:", eventIdParam);
					return;
				}

				const matchRef = doc(
					db,
					`Events/${eventIdParam}/TournamentData/${eventSnap.data().TournamentId}/matches/${matchIdParam}`
				);
				const matchSnap = await getDoc(matchRef);

				if (matchSnap.exists()) {
					setMatch({ id: matchSnap.id, ...matchSnap.data() });
				}
			} catch (error) {
				console.error("Error fetching match:", error);
			}
		};

		fetchMatch();
	}, [match]);

	// Set up real-time listener for match updates
	useEffect(() => {
		if (!eventIdParam || !event?.TournamentId || !matchIdParam) return;

		const matchRef = doc(
			db,
			`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${matchIdParam}`
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
	}, [db, eventIdParam, event?.TournamentId, matchIdParam]);

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

			if (
				(!match.teams ||
					match.teams.teamA.name === "" ||
					match.teams.teamB.name === "") &&
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

				match.teams = teamsPayload; // Update local match object to avoid re-rendering issues
				setDoc(
					doc(
						db,
						`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${match.id}`
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
		if (!eventIdParam || !event?.TournamentId || !match?.id) {
			throw new Error("Missing data to update scheduling");
		}

		const isAdminSchedulingPayload = !!payload?.teamA || !!payload?.teamB;
		const nextScheduling = isAdminSchedulingPayload
			? {
					...match.scheduling,
					...(payload.teamA ? { teamA: payload.teamA } : {}),
					...(payload.teamB ? { teamB: payload.teamB } : {})
				}
			: {
					...match.scheduling,
					[currentTeam]: payload
				};

		await setDoc(
			doc(
				db,
				`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${match.id}`
			),
			{
				...match,
				scheduling: nextScheduling
			}
		);

		if (isAdminSchedulingPayload) {
			return;
		}

		const otherTeamIds =
			currentTeam === "teamA"
				? [match.teams.teamB.player1Id, match.teams.teamB.player2Id]
				: [match.teams.teamA.player1Id, match.teams.teamA.player2Id];

		await sendGroupsNotification({
			title: `Match: ${teamA} vs ${teamB}`,
			body: `${currentTeam === "teamA" ? match.teams.teamA.name : match.teams.teamB.name} has submitted their availability for scheduling. Please review and confirm the match schedule.`,
			link: window.location.href,
			userIds: otherTeamIds
		});
	};

	const handleLocationUpdate = async (loc) => {
		if (!eventIdParam || !event?.TournamentId || !match?.id) {
			throw new Error("Missing data to update location");
		}
		var matchRef = doc(
			db,
			`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${match.id}`
		);

		const updates = {
			Location: loc
		};

		await updateDoc(matchRef, updates);
	};

	const handleResults = async (resultsPayload) => {
		if (!eventIdParam || !event?.TournamentId || !match?.id) {
			throw new Error("Missing data to update results");
		}

		// Admins bypass the two-team confirmation flow — treat as fully confirmed immediately
		if (user?.IsAdmin) {
			resultsPayload = {
				...resultsPayload,
				confirmedByTeams: ["teamA", "teamB"]
			};
		}

		const bothConfirmed =
			resultsPayload?.confirmedByTeams?.includes("teamA") &&
			resultsPayload?.confirmedByTeams?.includes("teamB");

		if (bothConfirmed) {
			const adapter = new FirestoreAdapter(
				db,
				`Events/${eventIdParam}/TournamentData/${event.TournamentId}`,
				event.TournamentId
			);
			const manager = new BracketsManager(adapter);

			const sets = resultsPayload?.sets || [];
			let team1Score = 0;
			let team2Score = 0;

			sets.forEach((setResult) => {
				const a = Number(setResult?.a) || 0;
				const b = Number(setResult?.b) || 0;

				if (a > b) team1Score += 1;
				if (b > a) team2Score += 1;
			});

			const opponent1Result =
				resultsPayload?.winner === "teamA"
					? "win"
					: resultsPayload?.winner === "teamB"
						? "lose"
						: "";
			const opponent2Result =
				resultsPayload?.winner === "teamB"
					? "win"
					: resultsPayload?.winner === "teamA"
						? "lose"
						: "";

			await manager.update.match({
				id: match.id,
				scoreTeam1: team1Score,
				scoreTeam2: team2Score,
				customStatus: 4,
				status: 4,
				opponent1: {
					result: opponent1Result,
					score: team1Score
				},
				opponent2: {
					result: opponent2Result,
					score: team2Score
				}
			});
		}

		var matchRef = doc(
			db,
			`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${match.id}`
		);
		const updates = {
			results: resultsPayload
		};
		console.log(updates);

		await updateDoc(matchRef, updates);

		if (!bothConfirmed && currentTeam && match?.teams) {
			const otherTeamIds =
				currentTeam === "teamA"
					? [
							match.teams.teamB?.player1Id,
							match.teams.teamB?.player2Id
						]
					: [
							match.teams.teamA?.player1Id,
							match.teams.teamA?.player2Id
						];

			const submitterName =
				currentTeam === "teamA"
					? match.teams.teamA?.name
					: match.teams.teamB?.name;

			await sendGroupsNotification({
				title: `Match: ${teamA} vs ${teamB}`,
				body: `${submitterName} has submitted the match result. Please review it.`,
				link: window.location.href,
				userIds: otherTeamIds
			});
		} else if (bothConfirmed) {
			await sendGroupsNotification({
				title: `Match Result Confirmed: ${teamA} vs ${teamB}`,
				body: `The match result has been confirmed by both teams. Please check the match details for the final result.`,
				link: window.location.href,
				userIds: [
					match.teams.teamA.player1Id,
					match.teams.teamA.player2Id,
					match.teams.teamB.player1Id,
					match.teams.teamB.player2Id
				]
			});
		}
	};

	const handleCancelResults = async () => {
		if (!eventIdParam || !event?.TournamentId || !match?.id) {
			throw new Error("Missing data to cancel results");
		}
		var matchRef = doc(
			db,
			`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${match.id}`
		);
		const updates = {
			results: null
		};

		await updateDoc(matchRef, updates);
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
					{user?.IsAdmin || currentTeam ? (
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
						{activeTab === SUMMARY_TAB && (
							<Details
								match={match}
								event={event}
								summaryDate={summaryDate}
								summaryTime={summaryTime}
								summaryLocation={summaryLocation}
								mainColor={mainColor}
							/>
						)}
						{activeTab === SCHEDULE_TAB && showScheduleTab && (
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
											`Events/${eventIdParam}/TournamentData/${event.TournamentId}/matches/${match.id}`
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
						{activeTab === RESULTS_TAB && (
							<Results
								match={match}
								mainColor={mainColor}
								currentTeamId={currentTeam}
								user={user}
								allPlayersIds={allPlayersIds}
								onSubmit={handleResults}
								onCancel={handleCancelResults}
							/>
						)}
					</Box>
				</Container>
			</Box>
		</>
	);
};

export default PremierPadelMatch;
