import React from "react";
import { useDispatch } from "react-redux";
import { getFirestore } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { fetchEvents } from "../redux/slices/eventsSlice";

import {
  Box,
  Chip,
  Fab,
  IconButton,
  Typography,
} from "@mui/material";
import { Add, CalendarMonth, Delete as DeleteIcon } from "@mui/icons-material";

import useEventActions from "../utils/EventsUtils";
import {
  Timeline,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";

import PullToRefresh from "react-simple-pull-to-refresh";

import ConfirmationModal from "../components/ConfirmationModal";

const Tour2026 = ({
  groupedEvents,
  onRefresh,
  getColor,
  getIcon,
  user,
  navigate,
  setOpen,
}) => {
  const db = getFirestore();
  const dispatch = useDispatch();
  const { deleteEvent } = useEventActions();

  const [selectedEventId, setSelectedEventId] = React.useState(null);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [type, setType] = React.useState("");
  const [confirmationTitle, setConfirmationTitle] = React.useState("");
  const [confirmationDescription, setConfirmationDescription] = React.useState("");

  const handleConfirmationConfirm = async () => {
    if (type === "deleteEvent") {
      await deleteEvent(selectedEventId);
    }
    setShowConfirmation(false);
    onRefresh();
  };

  return (
    <>
      <Timeline
        sx={{
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        <PullToRefresh onRefresh={onRefresh}>
          {Object.entries(groupedEvents).map(([monthKey, { label, events: monthEvents }]) => (
            <Box key={monthKey}>
              {/* Month Header */}
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot sx={{ bgcolor: "primary.main", width: 20, height: 20, borderWidth: 4 }}>
                    <CalendarMonth sx={{ fontSize: 20, color: "white" }} />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: "12px", px: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    {label}
                  </Typography>
                </TimelineContent>
              </TimelineItem>

              {/* Events for this month */}
              {monthEvents.map((event, index) => {
                const alreadyRegistered = event?.PlayersIds?.includes(user?.uid);
                return (
                  <TimelineItem key={`${monthKey}-${index}`}>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot
                        sx={{
                          bgcolor: `${getColor(event.Type)}.main`,
                          color: "white",
                          fontWeight: "bold",
                          width: 24,
                          height: 24,
                        }}
                      >
                        <Typography
                          variant="span"
                          sx={{
                            fontWeight: "bold",
                            width: "100%",
                            textAlign: "center",
                            px: 0.2,
                          }}
                        >
                          {new Date(event.Date).getDate()}
                        </Typography>
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: "12px", px: 2 }}>
                      <Box
                        sx={{
                          border: "2px dashed grey",
                          borderRadius: 2,
                          p: 1,
                          position: "relative",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          navigate("/Event", { state: { eventId: event.id } });
                        }}
                      >
                        <Typography variant="h6" sx={{ width: "Calc(100% - 100px)" }}>
                          {getIcon(event.Type)}
                          {event.Name}
                        </Typography>
                        <Typography variant="body2">
                          ⌚
                          {Timestamp.fromMillis(event.Date)
                            .toDate()
                            .getHours()
                          }
                          :
                          {Timestamp.fromMillis(event.Date)
                            .toDate()
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}
                        </Typography>
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            display: "flex",
                            flexWrap: "wrap",
                            flexDirection: "row",
                            alignItems: "end",
                            justifyContent: "end",
                          }}
                        >
                          <Chip
                            variant="solid"
                            color={getColor(event.Type)}
                            size="small"
                            label={event.Type}
                            sx={{ width: "100%" }}
                          />
                          {event.RecordGames && <span>🎥</span>}
                        </Box>
                        {user && alreadyRegistered && (
                          <Chip
                            label="💪 You already In!"
                            color="primary"
                            sx={{ color: "white", mt: 1 }}
                            size="small"
                          />
                        )}
                        {
                          user?.IsAdmin && (
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              sx={{ position: "absolute", bottom: 0, right: 12 }}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedEventId(event.id);
                                setType("deleteEvent");
                                setConfirmationTitle("Delete Event");
                                setConfirmationDescription("Are you sure you want to delete this event?");
                                setShowConfirmation(true);
                              }}
                            >
                              <DeleteIcon color="error" />
                            </IconButton>
                          )
                        }
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Box>
          ))}
        </PullToRefresh>
      </Timeline>
      {user?.IsAdmin && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: "fixed", bottom: 76, right: 16 }}
          onClick={() => {
            setOpen(true);
          }}
        >
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
        negativeText="Cancel"
      />
    </>
  );
};

export default Tour2026;
