import { useState, useEffect, useRef, use } from "react";
import { useNavigate } from "react-router";

import useAuth from "../utils/useAuth";
import useEventActions from "../utils/EventsUtils";

import {
  addDoc,
  collection,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
import { getRemoteConfig, getBoolean, getNumber } from "firebase/remote-config";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEvents,
  selectEvents,
  selectEventsLoading,
} from "../redux/slices/eventsSlice";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Chip,
  Fab,
  Paper,
  SwipeableDrawer,
  Typography,
  FormControl,
  InputAdornment,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
} from "@mui/material";
import {
  Add,
  CalendarMonth,
  Construction,
  ShoppingCart,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import {
  Timeline,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";

import ConfirmationModal from "../components/ConfirmationModal";
import SuccessModal from "../components/SuccessModal";

const Puller = styled(Box)(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
  borderRadius: 3,
  position: "absolute",
  top: 8,
  left: "calc(50% - 15px)",
}));

const StyledBox = styled("div")(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.applyStyles("dark", {
    backgroundColor: grey[800],
  }),
}));

const Home = () => {
  const dispatch = useDispatch();
  const db = getFirestore();
  const remoteConfig = getRemoteConfig();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerFromEvent } = useEventActions();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [open, setOpen] = useState(false);

  // Form state for new event
  const [evtName, setEvtName] = useState("");
  const [evtClass, setEvtClass] = useState("");
  const [evtType, setEvtType] = useState("");
  const [evtDate, setEvtDate] = useState(""); // store as ISO string for now
  const [evtLocation, setEvtLocation] = useState("");
  const [evtDescription, setEvtDescription] = useState("");
  const [evtPrice, setEvtPrice] = useState("");
  const [eventSelectedId, setEventSelectedId] = useState("");
  const [hasPrices, setHasPrices] = useState(false);
  const [hasWelcomeKit, setHasWelcomeKit] = useState(false);
  const [recordGames, setRecordGames] = useState(false);

  const initialFetchDone = useRef(false);

  const events = useSelector(selectEvents);
  const loading = useSelector(selectEventsLoading);

  const NewHomeForEveryOne = getBoolean(remoteConfig, "NewHomeForEveryOne");
  const ForceRefresh = getNumber(remoteConfig, "ForceRefresh");
  console.log(ForceRefresh);

  useEffect(() => {
    // Only fetch if we haven't done initial fetch and don't have benefits
    if (!initialFetchDone.current) {
      console.log("Fetch events using Redux with caching");
      initialFetchDone.current = true;
      if (ForceRefresh > Number(localStorage.getItem("ForceRefresh"))) {
        dispatch(fetchEvents({ db, forceRefresh: true }));
      } else {
        dispatch(fetchEvents({ db, forceRefresh: false }));
      }
      localStorage.setItem("ForceRefresh", ForceRefresh);
    }
  }, [dispatch, db, events.length]); // include dispatch

  useEffect(() => {
    console.log("user", user);
  }, [user]);

  useEffect(() => {
    console.log("NewHomeForEveryOne", NewHomeForEveryOne);
  }, [NewHomeForEveryOne]);

  /* const registerEvent = async () => {
    console.log("Registering user for event", eventSelectedId);
    setShowSuccess(false);

    const eventRef = doc(db, `Events/${eventSelectedId}`);

    await setDoc(doc(db, `Events/${eventSelectedId}/Players/`, user.uid), {
      UserId: doc(db, `Users/${user.uid}`),
      EventId: eventRef,
      createdAt: Timestamp.fromDate(new Date()),
    });

    await updateDoc(eventRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersIds: arrayUnion(user.uid)
    });

    // Show success modal after updating the event
    setShowJoinSuccess(true);
  } */

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Placeholder: implement Firestore add here later
    console.log("Submit event form", {
      evtName,
      evtClass,
      evtType,
      evtDate,
      evtLocation,
      hasPrices,
      hasWelcomeKit,
      recordGames,
    });

    // add event to Firestore
    const eventsCollection = collection(db, "Events");
    await addDoc(eventsCollection, {
      Name: evtName,
      Type: evtClass.replace("🏆 ", "").replace("🤝 ", "").replace("📚 ", ""),
      TypeOfTournament: evtType,
      Date: Timestamp.fromDate(new Date(evtDate)),
      Location: evtLocation,
      Description: evtDescription,
      Price: evtPrice,
      HasPrices: hasPrices,
      HasWelcomeKit: hasWelcomeKit,
      RecordGames: recordGames,
      ModifiedAt: Timestamp.fromDate(new Date()),
    });

    // Reset / close for now
    setEvtName("");
    setEvtType("Tournament");
    setEvtDate("");
    setEvtLocation("");
    setHasPrices(false);
    setHasWelcomeKit(false);
    setRecordGames(false);
    setOpen(false);
  };

  if (loading && events.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const getColor = (type) => {
    switch (type) {
      case "Tournament":
        return "error";
      case "Friendly":
        return "success";
      case "Training":
        return "info";
      default:
        return "default";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "Tournament":
        return "🏆";
      case "Friendly":
        return "🤝";
      case "Training":
        return "📚";
      default:
        return "❓";
    }
  };

  return (
    <>
      {NewHomeForEveryOne || user?.IsAdmin ? (
        <>
          <Paper
            sx={{
              bgcolor: "#b88f34",
              color: "white",
              textAlign: "start",
              /* Push header below iOS notch */
              pt: "env(safe-area-inset-top)",
            }}
          >
            {/* Welcome Header */}
            <Box sx={{ py: 3, px: 2 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                📌 Community Events
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Tournaments, training & social hookups
              </Typography>
            </Box>
          </Paper>
          <Box
            sx={{
              px: 0,
              pt: 0,
              flex: 1, // match BottomBar height, no extra safe-area padding
              maxHeight: "Calc(100vh - 180px)",
              overflow: "auto",
            }}
          >
            <Timeline
              sx={{
                [`& .${timelineItemClasses.root}:before`]: {
                  flex: 0,
                  padding: 0,
                },
              }}
            >
              {events.map((event, index) => {
                const alreadyRegistered = event?.PlayersIds?.includes(
                  user?.uid
                );
                return (
                  <TimelineItem key={index}>
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
                          console.log("Box 1 clicked - going to event details");
                          navigate("/Event", { state: { eventId: event.id } });
                        }}
                      >
                        <Typography variant="h6">
                          {getIcon(event.Type)}
                          {event.Name}
                        </Typography>
                        <Typography variant="body2">
                          ⌚
                          {Timestamp.fromMillis(event.Date).toDate().getHours()}
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
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
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
          </Box>
        </>
      ) : (
        <>
          <Paper
            sx={{
              bgcolor: "#b88f34",
              color: "white",
              textAlign: "center",
              height: "14em",
              /* Push header below iOS notch */
              pt: "env(safe-area-inset-top)",
            }}
          >
            {/* Welcome Header */}
            <Box sx={{ py: 3, px: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "rgba(255,255,255,0.2)",
                }}
              >
                {user?.displayName
                  ? user?.displayName
                      .split(" ")
                      .map((word) => word.charAt(0))
                      .join("")
                  : "?"}
              </Avatar>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome back,{" "}
                {user?.displayName || user?.email?.split("@")[0] || "Player"}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Ready for your next padel adventure? 🎾
              </Typography>
            </Box>
          </Paper>
          <Box
            sx={{
              px: 0,
              pt: 0,
              flex: 1, // match BottomBar height, no extra safe-area padding
            }}
          >
            {/* Work in Progress Section */}
            <Box
              sx={{
                height: "Calc(100vh - 60px - 14rem + 20px)",
                px: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                textAlign: "center",
                background:
                  "linear-gradient(135deg, rgba(184, 143, 52, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  animation: "shimmer 3s infinite",
                },
              }}
            >
              <Construction
                sx={{
                  fontSize: 60,
                  color: "primary.main",
                  mb: 2,
                  animation: "bounce 2s infinite",
                  "@keyframes bounce": {
                    "0%, 20%, 50%, 80%, 100%": {
                      transform: "translateY(0)",
                    },
                    "40%": { transform: "translateY(-10px)" },
                    "60%": { transform: "translateY(-5px)" },
                  },
                }}
              />

              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                Work in Progress
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                We're building something amazing for you!
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  mb: 3,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  icon={<CalendarMonth />}
                  label="Tour 2025"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.9rem" }}
                />
                <Chip
                  label="Player Rankings"
                  icon={<Timeline />}
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.9rem" }}
                />
                <Chip
                  icon={<ShoppingCart />}
                  label="Marketplace"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.9rem" }}
                />
              </Box>

              <Typography
                variant="h5"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                🚀 Stay Tuned! 🚀
              </Typography>
            </Box>
          </Box>
        </>
      )}

      <ConfirmationModal
        open={showSuccess}
        title="You wanna join this event?"
        description=""
        negativeText="Cancel"
        positiveText="Yes"
        onClose={() => setShowSuccess(false)}
        onConfirm={async () => {
          await registerFromEvent(eventSelectedId);
          setShowJoinSuccess(true);
          dispatch(fetchEvents({ db, forceRefresh: false }));
        }}
      />
      <SuccessModal
        open={showJoinSuccess}
        onClose={() => setShowJoinSuccess(false)}
        _title="You're in!"
        _description="You've successfully joined the event. See you on the court!"
        _buttonText="Awesome"
      />
      <SwipeableDrawer
        sx={{ zIndex: 1300 }}
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        disableSwipeToOpen={true}
        keepMounted
      >
        <Puller />
        <StyledBox sx={{ px: 2, pb: 2, height: "100%", overflow: "auto" }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              "& > :not(style)": { mt: 3 },
              pt: 4,
              pb: 4,
              px: 2,
            }}
          >
            {/* Name */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                required
                label="Name"
                id="EventName"
                value={evtName}
                onChange={(e) => setEvtName(e.target.value)}
                autoComplete="off"
              />
            </FormControl>
            {/* Class */}
            <FormControl fullWidth>
              <TextField
                select
                fullWidth
                label="Class"
                id="EventClass"
                value={evtClass}
                onChange={(e) => setEvtClass(e.target.value)}
              >
                {/* , '📚 Training' */}
                {["🏆 Tournament", "🤝 Friendly"].map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
            {/* Type */}
            <FormControl fullWidth>
              <TextField
                select
                fullWidth
                label="Type"
                id="EventType"
                value={evtType}
                onChange={(e) => setEvtType(e.target.value)}
              >
                {/* , '📚 Training' */}
                {["Masters", "SecretMix"].map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
            {/* Date (local datetime) */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                required
                type="datetime-local"
                label="Date & Time"
                InputLabelProps={{ shrink: true }}
                id="EventDate"
                value={evtDate}
                onChange={(e) => setEvtDate(e.target.value)}
              />
            </FormControl>
            {/* Location */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                label="Location"
                id="EventLocation"
                value={evtLocation}
                onChange={(e) => setEvtLocation(e.target.value)}
                autoComplete="off"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">📍</InputAdornment>
                    ),
                  },
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                fullWidth
                label="Description"
                id="Description"
                value={evtDescription}
                onChange={(e) => setEvtDescription(e.target.value)}
                autoComplete="off"
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                fullWidth
                label="Price"
                id="Price"
                value={evtPrice}
                onChange={(e) => setEvtPrice(e.target.value)}
                autoComplete="off"
              />
            </FormControl>
            {/* Toggles */}
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={hasPrices}
                    onChange={(e) => setHasPrices(e.target.checked)}
                  />
                }
                label="Has Prizes"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={hasWelcomeKit}
                    onChange={(e) => setHasWelcomeKit(e.target.checked)}
                  />
                }
                label="Has Welcome Kit"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={recordGames}
                    onChange={(e) => setRecordGames(e.target.checked)}
                  />
                }
                label="Record Games"
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 2,
                backgroundColor: "primary.main",
                color: "white",
              }}
              fullWidth
            >
              <Typography variant="button" sx={{ fontWeight: "bold" }}>
                Save
              </Typography>
            </Button>
          </Box>
        </StyledBox>
      </SwipeableDrawer>
    </>
  );
};

export default Home;
