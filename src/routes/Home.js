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
  Box,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Tab,
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
  CalendarMonth,
  Construction,
  ShoppingCart,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import { TabContext, TabList, TabPanel } from "@mui/lab";

import ConfirmationModal from "../components/ConfirmationModal";
import SuccessModal from "../components/SuccessModal";

import Tour2026 from "../components/Tour2026";
import PremierPadel from "../components/PremierPadel";

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
  const [evtStartMonth, setEvtStartMonth] = useState("");
  const [evtEndMonth, setEvtEndMonth] = useState("");
  const [evtLocation, setEvtLocation] = useState("");
  const [evtDescription, setEvtDescription] = useState("");
  const [evtPrice, setEvtPrice] = useState("");
  const [eventSelectedId, setEventSelectedId] = useState("");
  const [hasPrices, setHasPrices] = useState(false);
  const [hasWelcomeKit, setHasWelcomeKit] = useState(false);
  const [recordGames, setRecordGames] = useState(false);

  const initialFetchDone = useRef(false);

  const [activeTab, setActiveTab] = useState("tour");
  const [sortedEvents, setSortedEvents] = useState([]);
  const [groupedEvents, setGroupedEvents] = useState({});

  const events = useSelector(selectEvents);
  const loading = useSelector(selectEventsLoading);

  const NewHomeForEveryOne = getBoolean(remoteConfig, "NewHomeForEveryOne");
  const ForceRefresh = getNumber(remoteConfig, "ForceRefresh");
  const PremierPadelForEveryOne = getBoolean(remoteConfig, "PremierPadelForEveryOne");

  useEffect(() => {
    // Only fetch if we haven't done initial fetch and don't have benefits
    if (!initialFetchDone.current) {
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
    // Sort events by date and group by month
    const tempSortedEvents = [...events].sort((a, b) => b.Date - a.Date);
    setSortedEvents(tempSortedEvents);

    const tempGroupedEvents = tempSortedEvents.reduce((acc, event) => {
      if (event.TypeOfTournament === 'Premier') return acc; // skip events premier 
      const eventDate = new Date(event.Date);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!acc[monthKey]) {
        acc[monthKey] = { label: monthLabel, events: [] };
      }
      acc[monthKey].events.push(event);
      return acc;
    }, {});
    setGroupedEvents(tempGroupedEvents);
  }, [events]);

  const onRefresh = async () => {
    await dispatch(fetchEvents({ db, forceRefresh: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // add event to Firestore
    const eventsCollection = collection(db, "Events");
    await addDoc(eventsCollection, {
      Name: evtName,
      Type: evtType === 'Premier' ? 'Tournament' : evtClass.replace("🏆 ", "").replace("🤝 ", "").replace("📚 ", ""),
      TypeOfTournament: evtType,
      Date: Timestamp.fromDate(new Date(evtDate)),
      // Premier-specific range
      StartMonth: evtType === "Premier" ? evtStartMonth || null : null,
      EndMonth: evtType === "Premier" ? evtEndMonth || null : null,
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
    setEvtStartMonth("");
    setEvtEndMonth("");
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
      {NewHomeForEveryOne || user?.IsAdmin || user?.IsTester ? (
        <>
          <Paper
            sx={{
              bgcolor: "#b88f34",
              color: "white",
              textAlign: "start",
              height: "125px",
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
              height: "Calc(100vh - 185px - env(safe-area-inset-bottom))",
              overflow: "auto",
            }}
          >
            <TabContext value={activeTab}>
              <TabList onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
                <Tab label="Tour 2026" value="tour" />
                {PremierPadelForEveryOne || user?.IsAdmin || user?.IsTester ? <Tab label="Premier Padel" value="premier" /> : null}
              </TabList>

              <TabPanel value="tour" sx={{ p: 0 }}>
                <Tour2026
                  groupedEvents={groupedEvents}
                  onRefresh={onRefresh}
                  getColor={getColor}
                  getIcon={getIcon}
                  user={user}
                  navigate={navigate}
                  dispatch={dispatch}
                  db={db}
                  setOpen={setOpen}
                  setEventSelectedId={setEventSelectedId}
                  setShowSuccess={setShowSuccess}
                  registerFromEvent={registerFromEvent}
                />
              </TabPanel>

              <TabPanel value="premier" sx={{ p: 0 }}>
                <PremierPadel events={sortedEvents} />
              </TabPanel>
            </TabContext>
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
              {/* <Avatar
                src={user?.PhotoURL}
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: user?.PhotoURL ? "transparent" : "rgba(255,255,255,0.2)",
                }}
              >
                {!user?.PhotoURL && (user?.displayName
                  ? user?.displayName
                    .split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                  : "?")}
              </Avatar> */}
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
                  icon={<TimelineIcon />}
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
                {["Masters", "Mix", "Premier"].map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
            {/* Class */}
            {evtType !== "Premier" ? <FormControl fullWidth>
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
            </FormControl> : null}

            {/* Date (local datetime) */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                required
                type={evtType !== "Premier" ? "datetime-local" : "date"}
                label={evtType !== "Premier" ? "Date & Time" : "Start Inscriptions Date"}
                InputLabelProps={{ shrink: true }}
                id="EventDate"
                value={evtDate}
                onChange={(e) => setEvtDate(e.target.value)}
              />
            </FormControl>
            {evtType === "Premier" && (
              <FormControl fullWidth>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Start Month"
                    type="month"
                    InputLabelProps={{ shrink: true }}
                    value={evtStartMonth}
                    onChange={(e) => setEvtStartMonth(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="End Month"
                    type="month"
                    InputLabelProps={{ shrink: true }}
                    value={evtEndMonth}
                    onChange={(e) => setEvtEndMonth(e.target.value)}
                  />
                </Box>
              </FormControl>
            )}
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
