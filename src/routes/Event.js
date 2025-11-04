import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents, selectEvents } from "../redux/slices/eventsSlice";
import { fetchUsers, selectUsers } from "../redux/slices/usersSlice";

import { getFirestore, Timestamp } from "firebase/firestore";

import useAuth from "../utils/useAuth";
import useEventActions from "../utils/EventsUtils";
import RobinHoodBracket from "../utils/RobinHoodBracket";
import EventRankings from "../utils/EventRankings";

import ConfirmationModal from "../components/ConfirmationModal";
import SuccessModal from "../components/SuccessModal";
import SearchPlayer from "../components/SearchPlayer";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Fab,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
  Paper,
} from "@mui/material";

import {
  Add,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Person,
  Group,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const Event = () => {
  const { user } = useAuth();
  const { state } = useLocation();
  const db = getFirestore();
  const dispatch = useDispatch();
  const { registerFromEvent, unregisterFromEvent, createPairsForEvent } =
    useEventActions();

  const { eventId: paramEventId } = useParams();
  const eventId = state?.eventId ?? paramEventId;
  const events = useSelector(selectEvents);
  const users = useSelector(selectUsers);

  const [event, setEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setConfirmation] = useState(false);
  const [showExitSuccess, setShowExitSuccess] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [openSearchPlayer, setOpenSearchPlayer] = useState(false);
  const [tab, setTab] = useState(0);
  const [type, setType] = useState("joinGame");

  const initialFetchDone = useRef(false);

  const filteredUsers = users
    .filter((u) => event?.PlayersIds?.includes(u.id))
    .filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (user.Name && user.Name.toLowerCase().includes(searchLower)) ||
        (user.Email && user.Email.toLowerCase().includes(searchLower))
      );
    });

  const TabPanel = ({ children, value, index }) => (
    <div
      hidden={value !== index}
      style={{
        height: "100%",
        display: value === index ? "flex" : "none",
        flexDirection: "column",
      }}
    >
      {value === index && (
        <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
      )}
    </div>
  );

  const alreadyRegistered = event?.PlayersIds.includes(user?.uid);

  useEffect(() => {
    // Only fetch if we haven't done initial fetch and don't have benefits
    if (!initialFetchDone.current) {
      console.log("Fetch events using Redux with caching");
      initialFetchDone.current = true;
      dispatch(fetchEvents({ db, forceRefresh: false }));
      dispatch(fetchUsers({ db, forceRefresh: false }));
    }
  }, [dispatch, db, events.length]); // include dispatch

  useEffect(() => {
    const foundEvent = events.find((e) => e.id === eventId);
    setEvent(foundEvent);
    console.log("Event Selected:", foundEvent);
  }, [events, eventId]);

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

  if (!event) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        bgcolor="background.default"
      >
        <Box
          sx={{
            background: `linear-gradient(to right, hsl(var(--padel-primary)), hsl(var(--padel-primary)))`,
            color: "white",
            py: 3,
            px: 2,
          }}
        >
          <Container maxWidth="sm">
            <Typography variant="h6" fontWeight={700}>
              Event not found
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography color="text.secondary">
              We couldn't find this event. It may have been removed or the link
              is incorrect.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  const dt = Timestamp.fromMillis(event.Date).toDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const day = dt.getDate();
  const monthName = monthNames[dt.getMonth()];
  const year = dt.getFullYear();
  const hour = dt.getHours();
  const minute = dt.getMinutes().toString().padStart(2, "0");

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
        {/* Header */}
        <Box sx={{ py: 3, px: 2 }}>
          <Container maxWidth="sm">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {event.Name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  mt={0.5}
                  sx={{ color: "rgba(255,255,255,0.9)" }}
                >
                  <CalendarIcon fontSize="small" />
                  <Typography variant="body2">
                    {monthName} {day}, {year}
                  </Typography>
                </Stack>
              </Box>
              <Chip
                label={event.Type}
                color={getColor(event.Type)}
                sx={{ color: "white" }}
              />
            </Box>
          </Container>
        </Box>
        <Box bgcolor="background.default" sx={{ pt: 2 }}>
          <Tabs
            value={tab}
            onChange={(event, newValue) => setTab(newValue)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Details" />
            <Tab label="Players" />
            <Tab label="Brackets" />
            {event.TypeOfTournament === "SecretMix" && <Tab label="Rankings" />}
          </Tabs>
        </Box>
        <Box
          minHeight="100vh"
          display="flex"
          flexDirection="column"
          bgcolor="background.default"
        >
          {/* Event Details */}
          <TabPanel value={tab} index={0}>
            <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
              <Stack spacing={2.5}>
                <Paper elevation={1} sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PlaceIcon
                        fontSize="small"
                        sx={{ color: "hsl(var(--padel-primary))" }}
                      />
                      <Typography color="text.primary">
                        {event.Location}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TimeIcon
                        fontSize="small"
                        sx={{ color: "hsl(var(--padel-primary))" }}
                      />
                      <Typography color="text.primary">
                        {hour}:{minute}
                      </Typography>
                    </Stack>
                    {event.Price && (
                      <Typography color="text.primary">
                        💰 {event.Price}
                      </Typography>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <Typography color="text.secondary" lineHeight={1.7}>
                      {event.Description}
                    </Typography>
                  </Stack>
                </Paper>

                <Stack direction="row" spacing={1.5}>
                  {user && !alreadyRegistered && (
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": { bgcolor: "white", color: "primary.main" },
                      }}
                      onClick={async () => {
                        setConfirmation(true);
                        setType("joinGame");
                      }}
                    >
                      Register
                    </Button>
                  )}
                  {user && alreadyRegistered && (
                    <>
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
                          "&:hover": {
                            bgcolor: "white",
                            color: "primary.main",
                          },
                        }}
                      >
                        Good Luck 🤞
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{
                          bgcolor: "white",
                          color: "error.main",
                          borderColor: "error.main",
                          "&:hover": { bgcolor: "error.main", color: "white" },
                        }}
                        onClick={() => {
                          setConfirmation(true);
                          setType("exitGame");
                        }}
                      >
                        Unregister
                      </Button>
                    </>
                  )}
                </Stack>
                {user?.IsAdmin && (
                  <>
                    <Divider />
                    <Stack spacing={2.5}>
                      <Button
                        variant="outlined"
                        startIcon={<Group />}
                        fullWidth
                        sx={{ borderColor: "gray" }}
                        disabled={
                          filteredUsers.length < 2 || event.PairsCreated
                        }
                        onClick={async () => {
                          // if filteredUsers is not even, block action
                          if (filteredUsers.length % 2 !== 0) {
                            alert("Please ensure an even number of players.");
                            return;
                          }
                          await createPairsForEvent(filteredUsers, eventId);
                          dispatch(fetchEvents({ db, forceRefresh: false }));
                        }}
                      >
                        Create Pairs
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Container>
          </TabPanel>
          {/* Players/Pairs Details */}
          <TabPanel value={tab} index={1}>
            <Stack>
              {!event.PairsCreated && (
                <Paper elevation={1}>
                  <Stack spacing={2} sx={{ p: 2 }} direction="column">
                    <Typography variant="title1" fontWeight="bold">
                      Single players registered
                    </Typography>
                    <Divider />
                    <List
                      sx={{ margin: "0 !important", padding: "0 !important" }}
                    >
                      {filteredUsers.map((user, index) => (
                        <React.Fragment key={user.id}>
                          <ListItem
                            sx={{ py: 2 }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={async () => {
                                    await unregisterFromEvent(event.id, user.id);
                                    dispatch(fetchEvents({ db, forceRefresh: false }));                                    
                                }}
                              >
                                <DeleteIcon color="error" />
                              </IconButton>
                            }
                          >
                            <Avatar
                              sx={{
                                mr: 2,
                                bgcolor: "primary.main",
                              }}
                            >
                              <Person />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: "bold",
                                  }}
                                >
                                  {user.Name || "No Name"}
                                </Typography>
                              }
                            />
                            {/* FUTURE -- add inscription date */}
                          </ListItem>
                          {index < filteredUsers.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              )}
            </Stack>
            <Stack>
              {event.PairsCreated && event.Pairs && event.Pairs.length > 0 && (
                <Box sx={{ px: 4, py: 4 }}>
                  <Grid container spacing={3}>
                    {event.Pairs.map((pair, index) => {
                      const player1Name = pair.DisplayName.split(" & ")[0];
                      const player2Name = pair.DisplayName.split(" & ")[1];
                      const initials = (name) =>
                        name
                          .split(" ")
                          .filter(Boolean)
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();
                      return (
                        <Grid
                          item
                          size={{ xs: 12, md: 6, lg: 3 }}
                          key={pair.id || index}
                        >
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              position: "relative",
                            }}
                          >
                            <CardContent sx={{ height: "100%" }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ mb: 2 }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  color="text.secondary"
                                >
                                  Pair
                                </Typography>
                                <Chip size="small" label={`#${index + 1}`} />
                              </Stack>
                              <Divider />
                              <Stack spacing={1} flexGrow={1} sx={{ mt: 2 }}>
                                <Stack
                                  key={player1Name + index}
                                  direction="row"
                                  alignItems="center"
                                  spacing={1.25}
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: "primary.main",
                                      fontSize: 12,
                                    }}
                                  >
                                    {initials(player1Name)}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={600}>
                                    {player1Name}
                                  </Typography>
                                </Stack>
                                <Stack
                                  key={player2Name + index}
                                  direction="row"
                                  alignItems="center"
                                  spacing={1.25}
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: "primary.main",
                                      fontSize: 12,
                                    }}
                                  >
                                    {initials(player2Name)}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={600}>
                                    {player2Name}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </Stack>
            {user?.IsAdmin && (
              <Fab
                color="primary"
                aria-label="add"
                sx={{ position: "fixed", bottom: 76, right: 16 }}
                onClick={() => {
                  setOpenSearchPlayer(true);
                }}
              >
                <Add sx={{ color: "white" }} />
              </Fab>
            )}
          </TabPanel>
          {/* Brackets */}
          <TabPanel value={tab} index={2}>
            <RobinHoodBracket
              eventId={event.id}
              tournamentId={event.TournamentId}
            />
          </TabPanel>
          {/* Rankings */}
          <TabPanel value={tab} index={3}>
            <EventRankings
              eventId={event.id}
              tournamentId={event.TournamentId}
            />
          </TabPanel>
          <ConfirmationModal
            open={showConfirmation}
            title={
              type === "joinGame"
                ? "You wanna join this event?"
                : "You wanna leave this event?"
            }
            description=""
            type={type}
            negativeText="Cancel"
            positiveText="Yes"
            onClose={() => setConfirmation(false)}
            onConfirm={async () => {
              if (type === "exitGame") {
                await unregisterFromEvent(event.id);
                setShowExitSuccess(true);
              } else {
                await registerFromEvent(event.id);
                setShowJoinSuccess(true);
              }
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
          <SuccessModal
            open={showExitSuccess}
            onClose={() => setShowExitSuccess(false)}
            _title="You're out!"
            _description="You've successfully left the event."
            _buttonText="Got it"
          />
          <SearchPlayer
            open={openSearchPlayer}
            playersIds={event.PlayersIds}
            onClose={async (selectedPlayer) => {
              setOpenSearchPlayer(false);
              if (selectedPlayer) {
                await registerFromEvent(event.id, selectedPlayer.id);
                console.log("last final");

                dispatch(fetchEvents({ db, forceRefresh: false }));
                console.log("Selected Player to add:", selectedPlayer);
              }
            }}
          />
        </Box>
      </Paper>
    </>
  );
};

export default Event;
