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
      ModifiedAt: Timestamp.fromDate(new Date()),
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
					textAlign: "center",
					/* Push header below iOS notch */
					pt: "env(safe-area-inset-top)"
				}}>
				{/* Welcome Header */}
				<Box sx={{ py: 3, px: 2 }}>
					<Avatar
						sx={{
							width: 64,
							height: 64,
							mx: "auto",
							mb: 2,
							bgcolor: "rgba(255,255,255,0.2)"
						}}>
						{user?.displayName
							? user?.displayName
									.split(" ")
									.map((word) => word.charAt(0))
									.join("")
							: "?"}
					</Avatar>
					<Typography variant='h4' component='h1' gutterBottom>
						Welcome back,{" "}
						{user?.displayName ||
							user?.email?.split("@")[0] ||
							"Player"}
						!
					</Typography>
					<Typography variant='body1' sx={{ opacity: 0.9 }}>
						Ready for your next padel adventure? 🎾
					</Typography>
				</Box>
			</Paper>
			<Box
				sx={{
					px: 0,
					pt: 0,
					flex: 1 // match BottomBar height, no extra safe-area padding
				}}>
				{/* Work in Progress Section */}
				<Box
					sx={{
						height: '100%',
						mt: '-40px',
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
							animation: "shimmer 3s infinite"
						}
					}}>
					<Construction
						sx={{
							fontSize: 60,
							color: "primary.main",
							mb: 2,
							animation: "bounce 2s infinite",
							"@keyframes bounce": {
								"0%, 20%, 50%, 80%, 100%": {
									transform: "translateY(0)"
								},
								"40%": { transform: "translateY(-10px)" },
								"60%": { transform: "translateY(-5px)" }
							}
						}}
					/>

					<Typography
						variant='h4'
						component='h2'
						gutterBottom
						sx={{
							fontWeight: "bold",
							color: "primary.main",
							textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
						}}>
						Work in Progress
					</Typography>

					<Typography
						variant='h6'
						sx={{
							mb: 3,
							color: "text.secondary",
							fontStyle: "italic"
						}}>
						We're building something amazing for you!
					</Typography>

					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							gap: 1,
							mb: 3,
							flexWrap: "wrap"
						}}>
						<Chip
							icon={<CalendarMonth />}
							label='Tour 2025'
							variant='outlined'
							color='primary'
							sx={{ fontSize: "0.9rem" }}
						/>
						<Chip
							label='Player Rankings'
							icon={<Timeline />}
							variant='outlined'
							color='primary'
							sx={{ fontSize: "0.9rem" }}
						/>
						<Chip
							icon={<ShoppingCart />}
							label='Marketplace'
							variant='outlined'
							color='primary'
							sx={{ fontSize: "0.9rem" }}
						/>
					</Box>

					<Typography
						variant='h5'
						sx={{
							color: "primary.main",
							fontWeight: "bold",
							letterSpacing: 1,
							textTransform: "uppercase"
						}}>
						🚀 Stay Tuned! 🚀
					</Typography>
				</Box>
			</Box>
		</>
	);
};

export default Home;
