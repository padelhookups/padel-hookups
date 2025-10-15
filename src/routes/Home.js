import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import useAuth from "../utils/useAuth";
import { addDoc, arrayUnion, collection, doc, getFirestore, Timestamp, updateDoc } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents, selectEvents, selectEventsLoading } from "../redux/slices/eventsSlice";

import { Box, Button, CircularProgress, Chip, Fab, Paper, SwipeableDrawer, Typography, FormControl, InputAdornment, TextField, Switch, FormControlLabel, MenuItem } from "@mui/material";
import {
  Add
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
  left: "calc(50% - 15px)"
}));

const StyledBox = styled("div")(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.applyStyles("dark", {
    backgroundColor: grey[800]
  })
}));


const Home = () => {
  const dispatch = useDispatch();
  const db = getFirestore();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [open, setOpen] = useState(false);

  // Form state for new event
  const [evtName, setEvtName] = useState("");
  const [evtType, setEvtType] = useState("🏆 Tournament");
  const [evtDate, setEvtDate] = useState(""); // store as ISO string for now
  const [evtLocation, setEvtLocation] = useState("");
  const [eventSelectedId, setEventSelectedId] = useState("");
  const [hasPrices, setHasPrices] = useState(false);
  const [hasWelcomeKit, setHasWelcomeKit] = useState(false);
  const [recordGames, setRecordGames] = useState(false);

  const initialFetchDone = useRef(false);

  const events = useSelector(selectEvents);
  const loading = useSelector(selectEventsLoading);

  useEffect(() => {
    // Only fetch if we haven't done initial fetch and don't have benefits
    if (!initialFetchDone.current) {
      console.log("Fetch events using Redux with caching");
      initialFetchDone.current = true;
      dispatch(fetchEvents({ db, forceRefresh: false }));
    }
  }, [dispatch, db, events.length]); // include dispatch

  const registerEvent = async () => {
    console.log("Registering user for event", eventSelectedId);
    setShowSuccess(false);

    const eventRef = doc(db, `Events/${eventSelectedId}`);

    await addDoc(collection(db, `Events/${eventSelectedId}/Players`), {
      UserId: doc(db, `Users/${user.uid}`),
      EventId: eventRef,
      createdAt: Timestamp.fromDate(new Date()),
    });

    await updateDoc(eventRef, {
      PlayersIds: arrayUnion(user.uid)
    });

    // Show success modal after updating the event
    setShowJoinSuccess(true);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder: implement Firestore add here later
    console.log('Submit event form', { evtName, evtType, evtDate, evtLocation, hasPrices, hasWelcomeKit, recordGames });
    // Reset / close for now
    setEvtName("");
    setEvtType("Tournament");
    setEvtDate("");
    setEvtLocation("");
    setHasPrices(false);
    setHasWelcomeKit(false);
    setRecordGames(false);
    setOpen(false);
  }

  if (loading && events.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const getColor = (type) => {
    switch (type) {
      case 'Tournament':
        return 'error';
      case 'Friendly':
        return 'success';
      case 'Training':
        return 'info';
      default:
        return 'default';
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'Tournament':
        return '🏆';
      case 'Friendly':
        return '🤝';
      case 'Training':
        return '📚';
      default:
        return '❓';
    }
  }

  return (
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
          {events.map((event, index) => (
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
                    navigate("/Event");
                  }}
                >
                  <Typography variant="h6">{getIcon(event.Type)}{event.Name}</Typography>
                  <Typography variant="body2">⌚
                    {Timestamp.fromMillis(event.Date).toDate().getHours()}
                    :
                    {Timestamp.fromMillis(event.Date).toDate().getMinutes().toString().padStart(2, '0')}
                  </Typography>
                  <Box sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    alignItems: 'end',
                    justifyContent: 'end',
                  }}>
                    <Chip
                      variant="solid"
                      color={getColor(event.Type)}
                      size="small"
                      label={event.Type}
                      sx={{ width: '100%' }}
                    />
                    {event.RecordGames && <span>🎥</span>}
                  </Box>
                  {/* Hide Join button if user already signed up for this event */}
                  {user && !event?.PlayersIds?.includes(user?.uid) && (
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      variant="outlined"
                      onClick={(e) => {
                        console.log("Button 1 clicked - going to join page", event.id);
                        setEventSelectedId(event.id);
                        setShowSuccess(true);
                        e.stopPropagation();
                      }}
                    >
                      Join
                    </Button>
                  )}
                  {user && event?.PlayersIds?.includes(user?.uid) && <Chip label="💪 You already In!" color="primary" sx={{ color: 'white', mt: 1 }} size="small" />}
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
          {/* <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot
                sx={{
                  bgcolor: "error.main",
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
                  28
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
                  navigate("/Event");
                }}
              >
                <Typography variant="h6">🏆 Masters V</Typography>
                <Typography variant="body2">⌚ 18:00</Typography>
                <Chip
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  variant="solid"
                  color="error"
                  size="small"
                  label="Tournament"
                />
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={(e) => {
                    console.log("Button 1 clicked - going to join page");
                    setShowSuccess(true);
                    e.stopPropagation();
                  }}
                >
                  Join
                </Button>
              </Box>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot
                sx={{
                  bgcolor: "success.main",
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
                  17
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
                  console.log("Box 2 clicked - going to event details");
                  navigate("/Event");
                }}
              >
                <Typography variant="h6">🏆 Mix November</Typography>
                <Typography variant="body2" component="span"></Typography>
                <Typography variant="body2">⌚ 12:00</Typography>
                <Chip
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  variant="solid"
                  color="success"
                  size="small"
                  label="Social"
                />
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={(e) => {
                    console.log("Button 2 clicked - going to join page");
                    e.stopPropagation();
                    navigate("/Join");
                  }}
                >
                  Join
                </Button>
              </Box>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot
                sx={{
                  bgcolor: "info.main",
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
                  12
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
                  console.log("Box 3 clicked - going to event details");
                  navigate("/Event");
                }}
              >
                <Typography variant="h6">🎯 Training Class</Typography>
                <Typography variant="body2">⌚ 20:00</Typography>
                <Chip
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  variant="solid"
                  color="info"
                  size="small"
                  label="Training"
                />
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={(e) => {
                    console.log("Button 3 clicked - going to join page");
                    e.stopPropagation();
                    navigate("/Join");
                  }}
                >
                  Join
                </Button>
              </Box>
            </TimelineContent>
          </TimelineItem> */}
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
      </Box>
      <ConfirmationModal
        open={showSuccess}
        title="You wanna join this event?"
        description=""
        negativeText="Cancel"
        positiveText="Yes"
        onClose={() => setShowSuccess(false)}
        onConfirm={() => {
          registerEvent();
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
        anchor='bottom'
        open={open}
        onClose={() => setOpen(false)}
        disableSwipeToOpen={true}
        keepMounted>
        <Puller />
        <StyledBox
          sx={{ px: 2, pb: 2, height: "100%", overflow: "auto" }}>
          <Box
            component='form'
            onSubmit={handleSubmit}
            sx={{
              "& > :not(style)": { mt: 3 },
              pt: 4,
              pb: 4,
              px: 2
            }}>
            {/* Name */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                required
                label='Name'
                id='EventName'
                value={evtName}
                onChange={(e) => setEvtName(e.target.value)}
                autoComplete='off'
              />
            </FormControl>
            {/* Type */}
            <FormControl fullWidth>
              <TextField
                select
                fullWidth
                label='Type'
                id='EventType'
                value={evtType}
                onChange={(e) => setEvtType(e.target.value)}
              >
                {['🏆 Tournament', '🤝 Friendly', '📚 Training'].map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </FormControl>
            {/* Date (local datetime) */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                required
                type='datetime-local'
                label='Date & Time'
                InputLabelProps={{ shrink: true }}
                id='EventDate'
                value={evtDate}
                onChange={(e) => setEvtDate(e.target.value)}
              />
            </FormControl>
            {/* Location */}
            <FormControl fullWidth>
              <TextField
                fullWidth
                label='Location'
                id='EventLocation'
                value={evtLocation}
                onChange={(e) => setEvtLocation(e.target.value)}
                autoComplete='off'
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>📍</InputAdornment>
                    )
                  }
                }}
              />
            </FormControl>
            {/* Toggles */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <FormControlLabel
                control={<Switch checked={hasPrices} onChange={(e) => setHasPrices(e.target.checked)} />}
                label='Has Prizes'
              />
              <FormControlLabel
                control={<Switch checked={hasWelcomeKit} onChange={(e) => setHasWelcomeKit(e.target.checked)} />}
                label='Has Welcome Kit'
              />
              <FormControlLabel
                control={<Switch checked={recordGames} onChange={(e) => setRecordGames(e.target.checked)} />}
                label='Record Games'
              />
            </Box>
            <Button
              type='submit'
              variant='contained'
              sx={{ mt: 2 }}
              fullWidth
            >
              Save Event
            </Button>
          </Box>
        </StyledBox>
      </SwipeableDrawer>
    </>
  );
};

export default Home;
