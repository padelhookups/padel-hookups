import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents, selectEvents } from "../redux/slices/eventsSlice";

import { getFirestore, Timestamp } from "firebase/firestore";

import useAuth from "../utils/useAuth";
import useEventActions from "../utils/EventsUtils";

import ConfirmationModal from "../components/ConfirmationModal";
import SuccessModal from "../components/SuccessModal";

import {
    Box,
    Container,
    Paper,
    Typography,
    Chip,
    Button,
    Stack,
    Divider,
    Tab,
    Tabs
} from "@mui/material";
import {
    CalendarMonth as CalendarIcon,
    AccessTime as TimeIcon,
    Place as PlaceIcon
} from "@mui/icons-material";


const Event = () => {
    const { user } = useAuth();
    const { state } = useLocation();
    const db = getFirestore();
    const dispatch = useDispatch();
    const { registerFromEvent, unregisterFromEvent } = useEventActions();

    const { eventId: paramEventId } = useParams();
    const eventId = state?.eventId ?? paramEventId;
    const events = useSelector(selectEvents);


    const [event, setEvent] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showJoinSuccess, setShowJoinSuccess] = useState(false);
    const [tab, setTab] = useState("details");

    const initialFetchDone = useRef(false);

    useEffect(() => {
        // Only fetch if we haven't done initial fetch and don't have benefits
        if (!initialFetchDone.current) {
            console.log("Fetch events using Redux with caching");
            initialFetchDone.current = true;
            dispatch(fetchEvents({ db, forceRefresh: false }));
        }
    }, [dispatch, db, events.length]); // include dispatch

    useEffect(() => {
        const foundEvent = events.find(e => e.id === eventId);
        setEvent(foundEvent);
        console.log("Event Selected:", foundEvent);
    }, [events, eventId]);

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

    if (!event) {
        return (
            <Box minHeight="100vh" display="flex" flexDirection="column" bgcolor="background.default">
                <Box sx={{
                    background: `linear-gradient(to right, hsl(var(--padel-primary)), hsl(var(--padel-primary)))`,
                    color: "white",
                    py: 3,
                    px: 2,
                }}>
                    <Container maxWidth="sm">
                        <Typography variant="h6" fontWeight={700}>Event not found</Typography>
                    </Container>
                </Box>
                <Container maxWidth="sm" sx={{ py: 3 }}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                        <Typography color="text.secondary">
                            We couldn't find this event. It may have been removed or the link is incorrect.
                        </Typography>
                    </Paper>
                </Container>
            </Box>
        );
    }

    const dt = Timestamp.fromMillis(event.Date).toDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = dt.getDate();
    const monthName = monthNames[dt.getMonth()];
    const year = dt.getFullYear();
    const hour = dt.getHours();
    const minute = dt.getMinutes().toString().padStart(2, '0');

    return (<>
        <Paper
            sx={{
                bgcolor: "#b88f34",
                color: "white",
                textAlign: "start",
                /* Push header below iOS notch */
                pt: "env(safe-area-inset-top)",
            }}
        >
            {/* Header */}
            <Box sx={{ py: 3, px: 2 }}>
                <Container maxWidth="sm">
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{event.Name}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5} sx={{ color: "rgba(255,255,255,0.9)" }}>
                                <CalendarIcon fontSize="small" />
                                <Typography variant="body2">{monthName} {day}, {year}</Typography>
                            </Stack>
                        </Box>
                        <Chip label={event.Type} color={getColor(event.Type)} sx={{ color: "white" }} />
                    </Box>
                </Container>
            </Box>
            <Box bgcolor="background.default" sx={{ pt: 2 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab value="details" label="Details" />
                    <Tab value="brackets" label="Brackets" />
                </Tabs>
            </Box>
            <Box minHeight="100vh" display="flex" flexDirection="column" bgcolor="background.default">
                {/* Content */}
                <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
                    <Stack spacing={2.5}>
                        <Paper elevation={1} sx={{ p: 2.5 }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <PlaceIcon fontSize="small" sx={{ color: "hsl(var(--padel-primary))" }} />
                                    <Typography color="text.primary">{event.Location}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <TimeIcon fontSize="small" sx={{ color: "hsl(var(--padel-primary))" }} />
                                    <Typography color="text.primary">{hour}:{minute}</Typography>
                                </Stack>
                                {event.Price && (
                                    <Typography color="text.primary">💰 {event.Price}</Typography>
                                )}
                                <Divider sx={{ my: 0.5 }} />
                                <Typography color="text.secondary" lineHeight={1.7}>{event.Description}</Typography>
                            </Stack>
                        </Paper>

                        <Stack direction="row" spacing={1.5}>
                            {user && !event?.PlayersIds?.includes(user?.uid) && <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    "&:hover": { bgcolor: "white", color: "primary.main" },
                                }}
                                onClick={async () => {
                                    setShowSuccess(true);
                                }}
                            >
                                Register
                            </Button>}
                            {user && event?.PlayersIds?.includes(user?.uid) &&
                                <Button
                                    disableElevation
                                    disableRipple
                                    disableFocusRipple
                                    disableTouchRipple
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        bgcolor: "primary.main",
                                        color: "white",
                                        "&:hover": { bgcolor: "white", color: "primary.main" },
                                    }}
                                >
                                    Good Luck 🤞
                                </Button>}

                            <Button fullWidth variant="outlined" sx={{
                                bgcolor: "white",
                                color: "error.main",
                                borderColor: "error.main",
                                "&:hover": { bgcolor: "error.main", color: "white" },
                            }}
                                onClick={() => unregisterFromEvent(event.id)}>
                                Unregister
                            </Button>
                        </Stack>

                        {/*  <Paper elevation={1} sx={{ p: 2.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                <b>Organizer:</b> Padel Hookups
                            </Typography>
                        </Paper> */}
                    </Stack>
                </Container>
                <ConfirmationModal
                    open={showSuccess}
                    title="You wanna join this event?"
                    description=""
                    negativeText="Cancel"
                    positiveText="Yes"
                    onClose={() => setShowSuccess(false)}
                    onConfirm={async () => {
                        await registerFromEvent(event.id);
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
            </Box>
        </Paper >
    </>)
}

export default Event