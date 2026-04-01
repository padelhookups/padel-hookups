import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Chip,
  TextField,
  Alert,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleSendIcon from "@mui/icons-material/ScheduleSend";

import MatchCalendar from "./MatchCalendar";
import TimeSlotSheet, { SLOTS } from "./TimeSlotSheet";
import { BORDER } from "../../routes/PremierPadelMatch";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_MAP = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

function getSlotsCount(slots) {
  if (Array.isArray(slots)) return slots.length;
  return slots?.size || 0;
}

function getSharedSlots(leftSlots, rightSlots) {
  if (!leftSlots || !rightSlots) return [];

  const left = Array.isArray(leftSlots) ? leftSlots : [...leftSlots];
  const right = Array.isArray(rightSlots) ? rightSlots : [...rightSlots];

  return left.filter((slot) => right.includes(slot));
}

function formatDate(key) {
  const d = new Date(key + "T12:00:00");
  return `${DAY_NAMES[d.getDay()]} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
}

function getWindowMonths(startDate) {
  startDate = new Date(startDate.seconds * 1000);

  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + 14); // 2 weeks after tournament start

  const months = [];
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(deadline.getFullYear(), deadline.getMonth(), 1);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return { months, deadline };
}

const Schedule = ({
  match,
  currentTeamId,
  onSubmitAvailability,
  onConfirmed,
  onLocationUpdated,
  mainColor,
}) => {
  const isAdminView = !currentTeamId;
  const otherTeamId = currentTeamId === "teamA" ? "teamB" : "teamA";
  const currentTeam = match.teams[currentTeamId];
  const otherTeam = match.teams[otherTeamId];
  const teamASubmitted = !!match.scheduling?.teamA;
  const teamBSubmitted = !!match.scheduling?.teamB;
  const hasBothTeams = isAdminView
    ? !!match.teams?.teamA?.name && !!match.teams?.teamB?.name
    : !!currentTeam?.name && !!otherTeam?.name;
  const otherSubmitted = !!match.scheduling?.[otherTeamId];
  const finalOverlaps = match.Overlaps || [];

  const DARK = `color-mix(in srgb, ${mainColor}, black 20%)`;

  // Scheduling state
  const [myAvail, setMyAvail] = useState(
    match.scheduling?.[currentTeamId]?.availability || {},
  ); // { "2026-02-22": Set(["morning_9_12"]) }
  const [submitted, setSubmitted] = useState(
    isAdminView
      ? teamASubmitted && teamBSubmitted
      : !!match.scheduling?.[currentTeamId],
  );
  const [phase, setPhase] = useState("availability"); // availability | confirmed | court_booked

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDay, setSheetDay] = useState(null);

  // Overlap selection
  const [chosenOverlap, setChosenOverlap] = useState(null);

  // Court booking
  const [location, setLocation] = useState(match?.Location || "");
  const [confirmedSlot, setConfirmedSlot] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

    // Admin per-team avail state
    const [myAvailA, setMyAvailA] = useState(
      isAdminView ? match.scheduling?.teamA?.availability || {} : {},
    );
    const [myAvailB, setMyAvailB] = useState(
      isAdminView ? match.scheduling?.teamB?.availability || {} : {},
    );
    const [activeEditTeam, setActiveEditTeam] = useState(null);

  const { months, deadline } = useMemo(
    () => getWindowMonths(match.StartDateToPlay),
    [match],
  );

  useEffect(() => {
    setSubmitted(
      isAdminView
        ? teamASubmitted && teamBSubmitted
        : !!match.scheduling?.[currentTeamId],
    );

    if (match.Location) {
      setPhase("court_booked");
      setConfirmedSlot({
        date: match.ChoosenDate,
        slot: Object.keys(SLOT_MAP).find(
          (k) =>
            SLOT_MAP[k].key ===
            match.ChoosenTime.toLowerCase()
              .replaceAll(/\s/g, "_")
              .replaceAll(/[()+]/g, "")
              .replaceAll("_–_", "_")
              .replaceAll(/(\d)h/gi, "$1")
        ),
      });
    } else if (match.ChoosenDate && match.ChoosenTime) {
      setPhase("confirmed");
      setConfirmedSlot({
        date: match.ChoosenDate,
        slot: Object.keys(SLOT_MAP).find(
          (k) =>
            SLOT_MAP[k].key ===
            match.ChoosenTime.toLowerCase()
              .replaceAll(/\s/g, "_")
              .replaceAll(/[()+]/g, "")
              .replaceAll("_–_", "_")
              .replaceAll(/(\d)h/gi, "$1")
        ),
      });
    } else  {
      setPhase("availability");
    }
  }, [currentTeamId, isAdminView, match, teamASubmitted, teamBSubmitted]);

  const windowStart = new Date(match.StartDateToPlay.seconds * 1000)
    .toISOString()
    .slice(0, 10);
  const windowEnd = deadline.toISOString().slice(0, 10);

  const deadlineLabel = deadline.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  // Compute overlaps after both teams submit
  const overlaps = useMemo(() => {
    const primaryAvail = isAdminView ? myAvailA : myAvail;
    const secondaryAvail = isAdminView
      ? myAvailB
      : match.scheduling?.[otherTeamId]?.availability || {};

    if (!isAdminView && (!submitted || !otherSubmitted)) return [];

    const result = [];
    console.log("overlaps", primaryAvail, secondaryAvail);

    for (const [date, mySlots] of Object.entries(primaryAvail)) {
      const otherSlots = secondaryAvail[date] || [];
      const shared = getSharedSlots(mySlots, otherSlots);
      if (shared.length) result.push({ date, slots: shared });
    }
    console.log("overlaps", result);

    return result;
  }, [
    isAdminView,
    submitted,
    myAvail,
    myAvailA,
    myAvailB,
    match.scheduling,
    otherTeamId,
    otherSubmitted,
  ]);

  function handleDayTap(key) {
    console.log("handleDayTap", key);

    if (isAdminView && arguments[1]) {
      const teamId = arguments[1];
      const setAvail = teamId === "teamA" ? setMyAvailA : setMyAvailB;
      setAvail((prev) => {
        if (!prev[key]) return { ...prev, [key]: new Set() };
        return prev;
      });
      setActiveEditTeam(teamId);
    } else {
      if (!myAvail[key]) setMyAvail((prev) => ({ ...prev, [key]: new Set() }));
    }
    setSheetDay(key);
    setSheetOpen(true);
  }

  function handleSheetDone(selectedSlots) {
    console.log("handleSheetDone", selectedSlots);

      if (isAdminView) {
        const setAvail = activeEditTeam === "teamA" ? setMyAvailA : setMyAvailB;
        setAvail((prev) => {
          const next = { ...prev };
          if (selectedSlots.size === 0) delete next[sheetDay];
          else next[sheetDay] = selectedSlots;
          return next;
        });
      } else {
        setMyAvail((prev) => {
          const next = { ...prev };
          if (selectedSlots.size === 0) delete next[sheetDay];
          else next[sheetDay] = selectedSlots;
          return next;
        });
      }
    setHasPendingChanges(true);
    setSheetOpen(false);
  }

  function openSheetForDay(key) {
    if (isAdminView && arguments[1]) setActiveEditTeam(arguments[1]);
    setSheetDay(key);
    setSheetOpen(true);
  }

  const hasAnySlots = Object.values(myAvail).some((s) => getSlotsCount(s) > 0);
  const hasAnySlotsAdmin = isAdminView
    ? Object.values(myAvailA).some((s) => getSlotsCount(s) > 0) ||
      Object.values(myAvailB).some((s) => getSlotsCount(s) > 0)
    : false;
  const selectedDays = Object.keys(myAvail).sort();
  const selectedDaysA = isAdminView ? Object.keys(myAvailA).sort() : [];
  const selectedDaysB = isAdminView ? Object.keys(myAvailB).sort() : [];

  // Firestore payload (log here, in real app call updateDoc)
  function getFirestorePayload() {
    const serializeAvailability = (availabilityMap) => {
      const out = {};
      for (const [date, slots] of Object.entries(availabilityMap)) {
        out[date] = [...slots];
      }
      return out;
    };

    if (isAdminView) {
      return {
        teamA: {
          submittedAt: new Date(),
          availability: serializeAvailability(myAvailA),
        },
        teamB: {
          submittedAt: new Date(),
          availability: serializeAvailability(myAvailB),
        },
      };
    }

    return {
      submittedAt: new Date(),
      availability: serializeAvailability(myAvail),
    };
  }

  async function handleSubmit() {
    setSubmitLoading(true);
    try {
      const payload = getFirestorePayload();
      console.log(payload);
      await onSubmitAvailability?.(payload);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting availability:", error);
    } finally {
      setSubmitLoading(false);
      setHasPendingChanges(false);
    }
  }

  function handleConfirm() {
    if (!chosenOverlap) return;

    // Only allow confirming slots that are shared by both teams.
    const sourceOverlaps = phase === "confirmed" ? finalOverlaps : overlaps;
    const isSharedSlot = sourceOverlaps.some(
      ({ date, slots }) =>
        date === chosenOverlap.date && slots.includes(chosenOverlap.slot),
    );

    if (!isSharedSlot) return;

    setConfirmedSlot(chosenOverlap);
    const dateLabel = formatDate(chosenOverlap.date);
    const timeLabel =
      SLOT_MAP[chosenOverlap.slot]?.label +
      " (" +
      SLOT_MAP[chosenOverlap.slot]?.time +
      ")";
    onConfirmed(dateLabel, timeLabel, sourceOverlaps, chosenOverlap);
    setPhase("confirmed");
  }

  function handleUpdateLocation() {
    if (location.trim().length < 3) return;
    onLocationUpdated(location.trim());
    setPhase("court_booked");
  }

  // ── Phase: availability ──────────────────────────────────────────────────
  if (phase === "availability")
    return (
      <Stack gap={1.5} p={2}>
        {/* How it works */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            borderColor: BORDER,
            overflow: "hidden",
          }}
        >
          <Box px={2} pt={2} pb={1.5}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: mainColor,
                fontFamily: "Barlow Condensed, sans-serif",
                mb: 0.75,
              }}
            >
              📅 Step 1 — Set Availability
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: "#666",
                lineHeight: 1.5,
              }}
            >
              Tap a day to set your available time slots. Each day can have
              different times.
            </Typography>
          </Box>
        </Paper>

        {!hasBothTeams && (
          <Box px={2} pb={2}>
            <Alert
              severity="warning"
              sx={{
                borderRadius: 2,
                "& .MuiAlert-message": { fontSize: 13 },
              }}
            >
              Team information is incomplete for this match. Scheduling is
              unavailable until both teams are set.
            </Alert>
          </Box>
        )}

        {hasBothTeams && (
          <>
            {/* Notification: other team submitted */}
            {!isAdminView && otherSubmitted && !submitted && (
              <Box px={2} pb={1.5}>
                <Alert
                  icon={<NotificationsActiveIcon />}
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    "& .MuiAlert-message": { fontSize: 13 },
                  }}
                >
                  <strong>{otherTeam.name}</strong> submitted their
                  availability! Add yours to find a match slot.
                </Alert>
              </Box>
            )}

            {/* Deadline banner */}
            <Box px={2} pb={1.5}>
              <Box
                sx={{
                  bgcolor: "#fff3cd",
                  border: "1px solid #f0c040",
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#856404",
                  }}
                >
                  ⏳ Must be played by {deadlineLabel}
                </Typography>
              </Box>
            </Box>

            {/* Team A card */}
            <TeamCard
              team={match.teams.teamA}
              submitted={isAdminView ? teamASubmitted : currentTeamId === "teamA" ? submitted : teamASubmitted}
              availability={
                isAdminView
                  ? myAvailB
                  : currentTeamId === "teamA"
                    ? match.scheduling?.teamB?.availability || null
                    : match.scheduling?.teamA?.availability || null
              }
              months={months}
              windowStart={windowStart}
              windowEnd={windowEnd}
              myAvail={isAdminView ? myAvailA : currentTeamId === "teamA" ? myAvail : match.scheduling?.teamA?.availability || {}}
              interactive={isAdminView || currentTeamId === "teamA"}
              isOtherTeam={!isAdminView && currentTeamId !== "teamA"}
              onDayTap={isAdminView ? (key) => handleDayTap(key, "teamA") : currentTeamId === "teamA" ? handleDayTap : undefined}
              selectedDays={isAdminView ? selectedDaysA : currentTeamId === "teamA" ? selectedDays : undefined}
              onEditDay={isAdminView ? (key) => openSheetForDay(key, "teamA") : currentTeamId === "teamA" ? openSheetForDay : undefined}
              mainColor={mainColor}
            />

            {/* Team B card */}
            <TeamCard
              team={match.teams.teamB}
              submitted={isAdminView ? teamBSubmitted : currentTeamId === "teamB" ? submitted : teamBSubmitted}
              availability={
                isAdminView
                  ? myAvailA
                  : currentTeamId === "teamB"
                    ? match.scheduling?.teamA?.availability || null
                    : match.scheduling?.teamB?.availability || null
              }
              months={months}
              windowStart={windowStart}
              windowEnd={windowEnd}
              myAvail={isAdminView ? myAvailB : currentTeamId === "teamB" ? myAvail : match.scheduling?.teamB?.availability || {}}
              interactive={isAdminView || currentTeamId === "teamB"}
              isOtherTeam={!isAdminView && currentTeamId !== "teamB"}
              onDayTap={isAdminView ? (key) => handleDayTap(key, "teamB") : currentTeamId === "teamB" ? handleDayTap : undefined}
              selectedDays={isAdminView ? selectedDaysB : currentTeamId === "teamB" ? selectedDays : undefined}
              onEditDay={isAdminView ? (key) => openSheetForDay(key, "teamB") : currentTeamId === "teamB" ? openSheetForDay : undefined}
              mainColor={mainColor}
            />

            {/* Legend */}
            {!isAdminView && (
              <Stack direction="row" gap={1.5} px={2} pb={2} flexWrap="wrap">
                <LegendItem color={mainColor} label="Your selection" />
                <LegendItem
                  color="#e8f4f8"
                  border="1px solid #90c9e8"
                  label="Other team"
                />
                <LegendItem gradient label="Both available" color={mainColor} />
              </Stack>
            )}

            {/* Overlaps after submit */}
            {submitted && overlaps.length > 0 && !hasPendingChanges && (
              <Box px={2} pb={2}>
                <Paper
                  variant="outlined"
                  sx={{
                    bgcolor: "#d4edda",
                    borderColor: "#b8dacc",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      color: "#155724",
                      mb: 1,
                    }}
                  >
                    🎉 Slots that work for both!
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#155724",
                      mb: 1.5,
                    }}
                  >
                    Tap one to confirm the match slot:
                  </Typography>
                  <Stack gap={1} mb={2}>
                    {overlaps.map(({ date, slots }) =>
                      slots.map((slot) => {
                        const s = SLOT_MAP[slot];
                        const isChosen =
                          chosenOverlap?.date === date &&
                          chosenOverlap?.slot === slot;
                        return (
                          <Chip
                            key={`${date}-${slot}`}
                            label={`📅 ${formatDate(date)} · ${s?.label} (${s?.time})`}
                            onClick={() =>
                              setChosenOverlap({
                                date,
                                slot,
                              })
                            }
                            sx={{
                              bgcolor: isChosen ? "#155724" : "white",
                              color: isChosen ? "white" : "#155724",
                              border: "1px solid #b8dacc",
                              fontWeight: 600,
                              fontSize: 12,
                              height: "auto",
                              py: 0.5,
                              cursor: "pointer",
                              justifyContent: "flex-start",
                              "& .MuiChip-label": {
                                whiteSpace: "normal",
                              },
                            }}
                          />
                        );
                      }),
                    )}
                  </Stack>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={
                      !chosenOverlap ||
                      !overlaps.some(
                        ({ date, slots }) =>
                          date === chosenOverlap.date &&
                          slots.includes(chosenOverlap.slot),
                      )
                    }
                    sx={{
                      bgcolor: "#28a745",
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 700,
                      letterSpacing: 1,
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: "#218838" },
                      boxShadow: "none",
                    }}
                  >
                    <Typography
                      variant="button"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      ✅ Confirm This Slot
                    </Typography>
                  </Button>
                </Paper>
              </Box>
            )}

            {/* Submit button */}
            <Box px={2} pb={3}>
              <Button
                fullWidth
                variant="contained"
                disabled={!(isAdminView ? hasAnySlotsAdmin : hasAnySlots) || submitLoading}
                onClick={handleSubmit}
                sx={{
                  py: 1.75,
                  background: hasAnySlots
                    ? `linear-gradient(135deg, ${DARK}, ${mainColor})`
                    : undefined,
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none", opacity: 0.9 },
                  "&.Mui-disabled": {
                    bgcolor: "#ccc",
                    color: "white",
                  },
                }}
              >
                <Typography
                  variant="button"
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {submitLoading ? "Submitting..." : isAdminView ? "Save Changes" : "📤 Submit My Availability"}
                </Typography>
              </Button>
            </Box>

            {/* Bottom sheet */}
            <TimeSlotSheet
              open={sheetOpen}
              dateKey={sheetDay}
              currentSlots={sheetDay ? [...((isAdminView
                ? activeEditTeam === "teamA" ? myAvailA : myAvailB
                : myAvail)[sheetDay] || [])] : []}
              onDone={handleSheetDone}
              onClose={() => {
                /* console.log("onClose");
							setMyAvail((prev) => {
								const next = { ...prev };
								delete next[sheetDay];
								return next;
							}); */
                setSheetOpen(false);
              }}
              mainColor={mainColor}
            />
          </>
        )}
      </Stack>
    );

  // ── Phase: confirmed ─────────────────────────────────────────────────────
  if (phase === "confirmed")
    return (
      <Stack gap={1.5} p={2}>
        <ConfirmedCard
          slot={confirmedSlot}
          location={null}
          mainColor={mainColor}
        />
        <Paper
          variant="outlined"
          sx={{ borderRadius: 2, borderColor: BORDER, p: 2 }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: mainColor,
              fontFamily: "Barlow Condensed, sans-serif",
              mb: 1,
            }}
          >
            📍 Step 2 — Book a Court
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: "#666",
              lineHeight: 1.5,
              mb: 2,
            }}
          >
            Both teams are responsible for finding and booking a court. Once
            booked, update the location here so everyone knows where to show up.
          </Typography>
          <TextField
            fullWidth
            placeholder="e.g. Alto do Duque, Court 3"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            size="small"
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "Barlow, sans-serif",
                fontSize: 14,
              },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            disabled={location.trim().length < 3}
            onClick={handleUpdateLocation}
            sx={{
              py: 1.5,
              background:
                location.trim().length >= 3
                  ? `linear-gradient(135deg, ${DARK}, ${mainColor})`
                  : undefined,
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 700,
              letterSpacing: 1,
              borderRadius: 2,
              boxShadow: "none",
              "&.Mui-disabled": {
                bgcolor: "#ccc",
                color: "white",
              },
            }}
          >
            <Typography
              variant="button"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              📍 Update Location
            </Typography>
          </Button>
        </Paper>
        {finalOverlaps.length > 0 && (
          <Box px={2} pb={2}>
            <Paper
              variant="outlined"
              sx={{
                bgcolor: "#d4edda",
                borderColor: "#b8dacc",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#155724",
                  mb: 1,
                }}
              >
                Change the selected slot
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#155724",
                  mb: 1.5,
                }}
              >
                In case its not possible to find a court on this slot, or any
                major reason
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#155724",
                  mb: 1.5,
                }}
              >
                Make sure the other team still agrees to the new slot before updating!
              </Typography>
              <Stack gap={1} mb={2}>
                {finalOverlaps?.map(({ date, slots }) =>
                  slots.map((slot) => {
                    const s = SLOT_MAP[slot];
                    const isChosen =
                      chosenOverlap?.date === date &&
                      chosenOverlap?.slot === slot;
                    return (
                      <Chip
                        key={`${date}-${slot}`}
                        label={`📅 ${formatDate(date)} · ${s?.label} (${s?.time})`}
                        onClick={() =>
                          setChosenOverlap({
                            date,
                            slot,
                          })
                        }
                        sx={{
                          bgcolor: isChosen ? "#155724" : "white",
                          color: isChosen ? "white" : "#155724",
                          border: "1px solid #b8dacc",
                          fontWeight: 600,
                          fontSize: 12,
                          height: "auto",
                          py: 0.5,
                          cursor: "pointer",
                          justifyContent: "flex-start",
                          "& .MuiChip-label": {
                            whiteSpace: "normal",
                          },
                        }}
                      />
                    );
                  }),
                )}
              </Stack>
              <Button
                fullWidth
                variant="contained"
                onClick={handleConfirm}
                disabled={
                  !chosenOverlap ||
                  !finalOverlaps.some(
                    ({ date, slots }) =>
                      date === chosenOverlap.date &&
                      slots.includes(chosenOverlap.slot),
                  )
                }
                sx={{
                  bgcolor: "#28a745",
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "#218838" },
                  boxShadow: "none",
                }}
              >
                <Typography
                  variant="button"
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  ✅ Confirm This Slot
                </Typography>
              </Button>
            </Paper>
          </Box>
        )}
      </Stack>
    );

  // ── Phase: court_booked ──────────────────────────────────────────────────
  if (phase === "court_booked")
    return (
      <Stack gap={1.5} p={2}>
        <ConfirmedCard
          slot={confirmedSlot}
          location={location}
          mainColor={mainColor}
        />
        <Paper
          variant="outlined"
          sx={{
            bgcolor: "#d4edda",
            borderColor: "#b8dacc",
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#155724",
              mb: 1,
            }}
          >
            📍 Court Booked!
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#155724" }}>
            Both teams have been notified. See you there! 🎾
          </Typography>
        </Paper>
      </Stack>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TeamCard({
  team,
  submitted,
  availability,
  months,
  windowStart,
  windowEnd,
  myAvail,
  interactive,
  onDayTap,
  selectedDays,
  onEditDay,
  isOtherTeam,
  mainColor,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: BORDER,
        mx: 2,
        mb: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
        px={2}
        py={1.5}
        borderBottom={`1px solid ${BORDER}`}
      >
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
          {team?.name}
        </Typography>
        <Box ml="auto">
          {submitted ? (
            <Chip
              label="✓ Submitted"
              size="small"
              sx={{
                bgcolor: "#d4edda",
                color: "#155724",
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          ) : (
            <Chip
              label="Pending"
              size="small"
              sx={{
                bgcolor: "#fff3cd",
                color: "#856404",
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          )}
        </Box>
      </Stack>

      {/* Calendars */}
      {months.map((m, i) => (
        <MatchCalendar
          key={i}
          year={m.year}
          month={m.month}
          windowStart={windowStart}
          windowEnd={windowEnd}
          team1Avail={isOtherTeam ? availability : availability}
          team2Avail={isOtherTeam ? null : myAvail}
          onDayTap={onDayTap}
          interactive={interactive}
          mainColor={mainColor}
        />
      ))}

      {/* Other team's submitted slots summary */}
      {isOtherTeam && submitted && availability && (
        <Box px={2} pb={1.5}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              mb: 0.75,
            }}
          >
            Their availability
          </Typography>
          <Stack gap={0.5}>
            {Object.entries(availability).map(([date, slots]) => (
              <Stack key={date} direction="row" alignItems="flex-start" gap={1}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 80,
                    flexShrink: 0,
                  }}
                >
                  {formatDate(date)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#888" }}>
                  {slots.map((s) => SLOT_MAP[s]?.label).join(", ")}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {/* My selected days list */}
      {interactive && selectedDays?.length > 0 && (
        <Stack gap={0.75} px={2} pb={1.5}>
          {selectedDays.map((date) => {
            const slots = myAvail[date];
            const hasSlots = getSlotsCount(slots) > 0;
            return (
              <Stack
                key={date}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => onEditDay(date)}
                sx={{
                  bgcolor: hasSlots ? "#fdf0d0" : "white",
                  border: `1px solid ${hasSlots ? mainColor : BORDER}`,
                  borderRadius: 2,
                  px: 1.5,
                  py: 1.25,
                  cursor: "pointer",
                  "&:hover": { borderColor: mainColor },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    {formatDate(date)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: hasSlots ? mainColor : "#aaa",
                    }}
                  >
                    {hasSlots
                      ? [...slots].map((s) => SLOT_MAP[s]?.label).join(", ")
                      : "Tap to add times"}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mainColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {hasSlots ? "Edit" : "Add"} ›
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}

function ConfirmedCard({ slot, location, mainColor }) {
  const dateLabel = slot ? formatDate(slot.date) : "—";
  const s = slot ? SLOT_MAP[slot.slot] : null;
  const timeLabel = s ? `${s.label} (${s.time})` : "—";
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2, borderColor: BORDER, p: 2 }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: mainColor,
          fontFamily: "Barlow Condensed, sans-serif",
          mb: 1.5,
        }}
      >
        ✅ Match Scheduled
      </Typography>
      <Stack gap={0.75}>
        <InfoRow2 icon="📅" label="Date" value={dateLabel} />
        <InfoRow2 icon="🕐" label="Time" value={timeLabel} />
        <InfoRow2
          icon="📍"
          label="Court"
          value={location || "TBD – pending booking"}
        />
      </Stack>
    </Paper>
  );
}

function InfoRow2({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" gap={1.25}>
      <Typography sx={{ fontSize: 16, width: 22, textAlign: "center" }}>
        {icon}
      </Typography>
      <Typography
        sx={{ fontSize: 12, color: "#888", width: 60, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{value}</Typography>
    </Stack>
  );
}

function LegendItem({ color, border, gradient, label }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: 0.5,
          flexShrink: 0,
          bgcolor: gradient ? undefined : color,
          background: gradient
            ? `linear-gradient(135deg,${color} 50%, #9ab4df 50%)`
            : undefined,
          border: border || undefined,
        }}
      />
      <Typography sx={{ fontSize: 11, color: "#888" }}>{label}</Typography>
    </Stack>
  );
}

export default Schedule;
