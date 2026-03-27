import React from "react";
import { useDispatch } from "react-redux";
import { getFirestore } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { fetchEvents } from "../redux/slices/eventsSlice";

import { Box, Chip, Fab, IconButton, Typography } from "@mui/material";
import {
	Add,
	CalendarMonth,
	Delete as DeleteIcon,
	EmojiEvents
} from "@mui/icons-material";
import Button from "@mui/material/Button";

import useEventActions from "../utils/EventsUtils";
import {
	Timeline,
	TimelineSeparator,
	TimelineConnector,
	TimelineContent,
	TimelineDot
} from "@mui/lab";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";

import PullToRefresh from "react-simple-pull-to-refresh";

import ConfirmationModal from "../components/ConfirmationModal";

const DEFAULT_EVENT_DURATION_MINUTES = 120;

const getEventDate = (value) => {
	if (!value) {
		return null;
	}

	if (typeof value?.toDate === "function") {
		return value.toDate();
	}

	return new Date(value);
};

const formatCalendarDate = (date) => {
	return date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}Z$/, "Z");
};

const escapeIcsText = (value = "") => {
	return String(value)
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");
};

const Tour2026 = ({
	groupedEvents,
	onRefresh,
	getColor,
	getIcon,
	user,
	navigate,
	setOpen
}) => {
	const db = getFirestore();
	const dispatch = useDispatch();
	const { deleteEvent } = useEventActions();

	const [selectedEventId, setSelectedEventId] = React.useState(null);
	const [showConfirmation, setShowConfirmation] = React.useState(false);
	const [type, setType] = React.useState("");
	const [confirmationTitle, setConfirmationTitle] = React.useState("");
	const [confirmationDescription, setConfirmationDescription] =
		React.useState("");

	const handleAddToCalendar = (event, clickEvent) => {
		clickEvent.preventDefault();
		clickEvent.stopPropagation();

		const startDate = getEventDate(event?.Date);

		if (!startDate || Number.isNaN(startDate.getTime())) {
			return;
		}

		const endDate = new Date(
			startDate.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000
		);
		const descriptionParts = [event?.Description, event?.Type ? `Type: ${event.Type}` : ""]
			.filter(Boolean)
			.join("\n\n");
		const fileName = `${event?.Name || "tour-2026-event"}`
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		const icsContent = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Padel Hookups//Tour 2026//EN",
			"CALSCALE:GREGORIAN",
			"BEGIN:VEVENT",
			`UID:${event?.id || startDate.getTime()}@padelhookups`,
			`DTSTAMP:${formatCalendarDate(new Date())}`,
			`DTSTART:${formatCalendarDate(startDate)}`,
			`DTEND:${formatCalendarDate(endDate)}`,
			`SUMMARY:${escapeIcsText(event?.Name || "Padel Event")}`,
			`DESCRIPTION:${escapeIcsText(descriptionParts)}`,
			`LOCATION:${escapeIcsText(event?.Location || "Padel Hookups")}`,
			"END:VEVENT",
			"END:VCALENDAR"
		].join("\r\n");

		const blob = new Blob([icsContent], {
			type: "text/calendar;charset=utf-8"
		});
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = downloadUrl;
		link.download = `${fileName || "tour-2026-event"}.ics`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(downloadUrl);
	};

	const handleConfirmationConfirm = async () => {
		if (type === "deleteEvent") {
			await deleteEvent(selectedEventId);
		}
		setShowConfirmation(false);
		onRefresh();
	};

	return (
		<>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					mt: 2,
				}}>
				<Button
					variant='contained'
					startIcon={<EmojiEvents />}
					onClick={() =>
						window.open("https://lookerstudio.google.com/reporting/33196c50-caf7-47ab-90ce-a048c148c603", "_blank")
					}
					sx={{
						borderRadius: 1,
						fontWeight: "bold",
						textTransform: "none",
						px: 3,
            bgcolor: "primary.main",
					}}>
					Tour Ranking
				</Button>
			</Box>
			<Timeline
				sx={{
          marginTop: 0,
					[`& .${timelineItemClasses.root}:before`]: {
						flex: 0,
						padding: 0
					}
				}}>
				<PullToRefresh onRefresh={onRefresh}>
					{Object.entries(groupedEvents).map(
						([monthKey, { label, events: monthEvents }]) => (
							<Box key={monthKey}>
								{/* Month Header */}
								<TimelineItem>
									<TimelineSeparator>
										<TimelineConnector />
										<TimelineDot
											sx={{
												bgcolor: "primary.main",
												width: 20,
												height: 20,
												borderWidth: 4
											}}>
											<CalendarMonth
												sx={{
													fontSize: 20,
													color: "white"
												}}
											/>
										</TimelineDot>
										<TimelineConnector />
									</TimelineSeparator>
									<TimelineContent sx={{ py: "12px", px: 2 }}>
										<Typography
											variant='h6'
											sx={{
												fontWeight: "bold",
												color: "primary.main"
											}}>
											{label}
										</Typography>
									</TimelineContent>
								</TimelineItem>

								{/* Events for this month */}
								{monthEvents.map((event, index) => {
									const alreadyRegistered =
										event?.PlayersIds?.includes(user?.uid);
									const eventDate = getEventDate(event.Date);
									return (
										<TimelineItem
											key={`${monthKey}-${index}`}>
											<TimelineSeparator>
												<TimelineConnector />
												<TimelineDot
													sx={{
														bgcolor: `${getColor(event.Type)}.main`,
														color: "white",
														fontWeight: "bold",
														width: 24,
														height: 24
													}}>
													<Typography
														variant='span'
														sx={{
															fontWeight: "bold",
															width: "100%",
															textAlign: "center",
															px: 0.2
														}}>
														{eventDate?.getDate?.() ?? "-"}
													</Typography>
												</TimelineDot>
												<TimelineConnector />
											</TimelineSeparator>
											<TimelineContent
												sx={{ py: "12px", px: 2 }}>
													{(() => {
														const eventHours = eventDate?.getHours?.() ?? 0;
														const eventMinutes = eventDate?.getMinutes?.() ?? 0;

														return (
												<Box
													sx={{
														border: "2px dashed grey",
														borderRadius: 2,
														p: 1,
														position: "relative",
														cursor: "pointer"
													}}
													onClick={() => {
														navigate("/Event", {
															state: {
																eventId:
																	event.id
															}
														});
													}}>
													<Typography
														variant='h6'
														sx={{
															width: "Calc(100% - 100px)"
														}}>
														{getIcon(event.Type)}
														{event.Name}
													</Typography>
													<Typography variant='body2'>
														⌚
														{eventHours}
														:
														{eventMinutes.toString().padStart(2, "0")}
													</Typography>
													<IconButton
														aria-label='Add event to calendar'
														onClick={(clickEvent) =>
															handleAddToCalendar(event, clickEvent)
														}
														sx={{
															mt: 1,
															border: "1px solid",
															borderColor: "primary.main",
															borderRadius: 1,
															color: "primary.main",
															p:.5,
															mr: 1
														}}>
														<CalendarMonth fontSize='small' />
													</IconButton>
													<Box
														sx={{
															position:
																"absolute",
															top: 8,
															right: 8,
															display: "flex",
															flexWrap: "wrap",
															flexDirection:
																"row",
															alignItems: "end",
															justifyContent:
																"end"
														}}>
														<Chip
															variant='solid'
															color={getColor(
																event.Type
															)}
															size='small'
															label={event.Type}
															sx={{
																width: "100%",
																color: "white"
															}}
														/>
														{event.RecordGames && (
															<span>🎥</span>
														)}
													</Box>
													{user &&
														alreadyRegistered && (
															<Chip
																label='💪 You already In!'
																color='primary'
																sx={{
																	color: "white",
																	mt: 1
																}}
																size='small'
															/>
														)}
													{user?.IsAdmin && (
														<IconButton
															edge='end'
															aria-label='delete'
															sx={{
																position:
																	"absolute",
																bottom: 0,
																right: 12
															}}
															onClick={async (
																e
															) => {
																e.preventDefault();
																e.stopPropagation();
																setSelectedEventId(
																	event.id
																);
																setType(
																	"deleteEvent"
																);
																setConfirmationTitle(
																	"Delete Event"
																);
																setConfirmationDescription(
																	"Are you sure you want to delete this event?"
																);
																setShowConfirmation(
																	true
																);
															}}>
															<DeleteIcon color='error' />
														</IconButton>
													)}
												</Box>
												);
											})()}
											</TimelineContent>
										</TimelineItem>
									);
								})}
							</Box>
						)
					)}
				</PullToRefresh>
			</Timeline>
			{user?.IsAdmin && (
				<Fab
					color='primary'
					aria-label='add'
					sx={{ position: "fixed", bottom: 76, right: 16 }}
					onClick={() => {
						setOpen(true);
					}}>
					<Add sx={{ color: "white" }} />
				</Fab>
			)}
			<ConfirmationModal
				open={showConfirmation}
				onClose={() => setShowConfirmation(false)}
				onConfirm={handleConfirmationConfirm}
				type={type}
				title={confirmationTitle}
				description={confirmationDescription}
				positiveText={type === "exitGame" ? "Unregister" : "Yes"}
				negativeText='Cancel'
			/>
		</>
	);
};

export default Tour2026;
