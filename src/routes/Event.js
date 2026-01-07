import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents, selectEvents } from "../redux/slices/eventsSlice";
import { fetchUsers, selectUsers } from "../redux/slices/usersSlice";

import { getFirestore, Timestamp } from "firebase/firestore";

import useAuth from "../utils/useAuth";
import useEventActions from "../utils/EventsUtils";
import StatisticsActions from "../utils/StatisticsUtils";
import RobinHoodBracket from "../components/RobinHoodBracket";
import EliminationsBrackets from "../components/EliminationsBrackets";
import EventRankings from "../components/EventRankings";

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
  const {
    createMatchsRobinHood,
    createMatchsElimination,
    registerFromEvent,
    unregisterFromEvent,
    createPairsForEvent,
    addSinglePair,
    deleteAllGamesForEvent,
    deletePairFromEvent
  } = useEventActions();

  const {
    removeMixPlayed
  } = StatisticsActions();



  const { eventId: paramEventId } = useParams();
  const eventId = state?.eventId ?? paramEventId;
  const events = useSelector(selectEvents);
  const users = useSelector(selectUsers);

  const [event, setEvent] = useState(null);
  const [showConfirmation, setConfirmation] = useState(false);
  const [showExitSuccess, setShowExitSuccess] = useState(false);
  const [showCustomSuccess, setShowCustomSuccess] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [openSearchPlayer, setOpenSearchPlayer] = useState(false);
  const [createPairDisabled, setCreatePairDisabled] = useState(true);
  const [usersBeingPairedIds, setUsersBeingPairedIds] = useState([]);
  const [pairSlots, setPairSlots] = useState({ player1: null, player2: null });
  const [tab, setTab] = useState(0);
  const [type, setType] = useState("joinGame");
  const [modeToSearchPlayer, setModeToSearchPlayer] = useState("single");
  const [confirmationModalTitle, setConfirmationModalTitle] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [successDescription, setSuccessDescription] = useState("");
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const initialFetchDone = useRef(false);

  const filteredUsers = [...users, ...(event?.Guests || [])]
    .filter(
      (user) =>
        !event?.PlayersWithPairsIds?.includes(user.id) &&
        !event?.PlayersWithPairsIds?.includes(user.UserId)
    )
    .filter(
      (user) =>
        event?.PlayersIds?.includes(user.id) ||
        (user.IsGuest && event?.PlayersIds?.includes(user.UserId))
    )
    .filter(
      (user) =>
        !usersBeingPairedIds.includes(user.id) &&
        !usersBeingPairedIds.includes(user.Name)
    );

  const TabPanel = ({ children, value, index }) => (
    <div
      hidden={value !== index}
      style={{
        height: "100%",
        display: value === index ? "flex" : "none",
        flexDirection: "column",
        scrollBehavior: "smooth",
        overflowY: value === index && index === 2 ? "auto" : "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {value === index && (
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );

  const alreadyRegistered = event?.PlayersIds.includes(user?.uid);

  const dragstartHandler = (ev) => {
    const playerId = ev.target.childNodes[1].childNodes[0].id;
    ev.dataTransfer.setData("dropInfo", playerId);
    setDraggedPlayerId(playerId);
  };

  const dragoverHandler = (ev) => {
    ev.preventDefault();
  };

  const dropHandler = (ev, slot) => {
    ev.preventDefault();
    const playerId = ev.dataTransfer.getData("dropInfo") || draggedPlayerId;
    const player =
      users.find((u) => u.id === playerId) ||
      event.Guests.find((g) => g.Name === playerId);

    if (player) {
      setPairSlots((prev) => ({ ...prev, [slot]: player }));
      setUsersBeingPairedIds((prev) => [...prev, playerId]);
      setDraggedPlayerId(null);
    }
  };

  const touchStartHandler = (ev, playerId) => {
    setDraggedPlayerId(playerId);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  const touchEndHandler = (ev, slot) => {
    if (draggedPlayerId) {
      const player = users.find((u) => u.id === draggedPlayerId);
      if (player) {
        setPairSlots((prev) => ({ ...prev, [slot]: player }));
        setUsersBeingPairedIds((prev) => [...prev, draggedPlayerId]);
      }
      setDraggedPlayerId(null);
    }
    setIsDragging(false);
  };

  const removeFromPair = (slot) => {
    const player = pairSlots[slot];
    if (player) {
      setPairSlots((prev) => ({ ...prev, [slot]: null }));
      setUsersBeingPairedIds((prev) =>
        prev.filter((id) => id !== player.id && !player.IsGuest)
      );
    }
  };

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

  useEffect(() => {
    // Log pairSlots whenever it changes
    console.log("pairSlots updated:", pairSlots);

    // Enable "Create Pair" button only when both slots are filled
    setCreatePairDisabled(!pairSlots.player1 || !pairSlots.player2);
  }, [pairSlots]);

  useEffect(() => {
    if (type === "joinGame" || type === "joinGameInPairs") {
      setConfirmationModalTitle("You wanna join this event?");
    } else if (type === "exitGame") {
      setConfirmationModalTitle("You wanna leave this event?");
    }
  }, [type]);

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

  const deleteAllGames = async () => {
    // Confirmation
    const confirm = window.confirm(
      "Are you sure you want to delete all games?"
    );
    if (!confirm) {
      return;
    }
    // Delete all games logic here
    await deleteAllGamesForEvent(event.id);
    await removeMixPlayed(event.PlayersIds);
    await
      alert("All games deleted.");
    dispatch(fetchEvents({ db, forceRefresh: false }));
  };

  if (!event) {
    return (
      <Box
        height="100vh"
        maxHeight="100vh"
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
            {event.TypeOfTournament === "Mix" && <Tab label="Rankings" />}
          </Tabs>
        </Box>
        <Box
          height="100vh"
          maxHeight="calc(100vh - 230px - env(safe-area-inset-bottom))"
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
                        💰 {event.Price}€
                      </Typography>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <Typography color="text.secondary" lineHeight={1.7}>
                      {event.Description}
                    </Typography>
                  </Stack>
                </Paper>

                <Stack direction="row" spacing={1.5}>
                  {user && !alreadyRegistered && !event.TournamentStarted && (
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": { bgcolor: "white", color: "primary.main" },
                      }}
                      onClick={async () => {
                        if (event.TypeOfTournament === "Mix") {
                          //Register only it self
                          setConfirmation(true);
                          setType("joinGame");
                        } else if (event.TypeOfTournament !== "Mix") {
                          // Register in pairs
                          setConfirmation(true);
                          setType("joinGameInPairs");
                          setModeToSearchPlayer("pairs");
                        }
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
                      {!event.TournamentStarted && (
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
                      )}
                    </>
                  )}
                </Stack>
                {user?.IsAdmin && (
                  <>
                    <Divider />
                    <Stack spacing={2.5}>
                      {event.TypeOfTournament === "Mix" && (
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
                          Create Random Pairs
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        startIcon={<Group />}
                        fullWidth
                        sx={{ borderColor: "gray" }}
                        disabled={event.TournamentStarted}
                        onClick={async () => {
                          if (
                            !event.Pairs ||
                            event.Pairs.length % 2 !== 0 ||
                            event.Pairs.length < 4
                          ) {
                            alert("No players available to create matches.");
                            return;
                          }
                          if (event.TypeOfTournament === "Mix") {
                            setConfirmationModalTitle("Create matches?");
                            setType("createMatchesRobinHood");
                            setConfirmation(true);
                          } else {
                            setConfirmationModalTitle("Create Groups?");
                            setType("createMasters");
                            setConfirmation(true);
                          }
                          dispatch(fetchEvents({ db, forceRefresh: false }));
                        }}
                      >
                        {event.TypeOfTournament === "Mix"
                          ? "Create Matches"
                          : "Create Groups & Matches"}
                      </Button>
                      {event.TournamentStarted && user.IsAdmin && (
                        <Button
                          variant="contained"
                          startIcon={<Group />}
                          fullWidth
                          color="error"
                          onClick={deleteAllGames}
                        >
                          Delete All Games{" "}
                        </Button>
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </Container>
          </TabPanel>
          {/* Players/Pairs Details */}
          <TabPanel value={tab} index={1}>
            <Stack>
              {!event.PairsCreated && user?.IsAdmin && (
                <Paper elevation={1}>
                  <Stack spacing={2} sx={{ p: 2 }} direction="column">
                    {/* BOX to drag players and form new pairs */}
                    {event.TypeOfTournament === "Mix" || user?.IsAdmin ? (
                      <>
                        <Box
                          sx={{
                            height: "5rem",
                            paddingY: "0 !important",
                            border: "1px dashed #aaaaaa",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              width: "40%",
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              paddingX: "2 !important",
                              cursor: "pointer",
                            }}
                            onDrop={(e) => dropHandler(e, "player1")}
                            onDragOver={(e) => dragoverHandler(e)}
                            onTouchEnd={(e) => touchEndHandler(e, "player1")}
                            onClick={() => removeFromPair("player1")}
                          >
                            {pairSlots.player1 ? (
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: "primary.main",
                                  }}
                                >
                                  <Person fontSize="small" />
                                </Avatar>
                                <Typography variant="h6" fontWeight="bold">
                                  {pairSlots.player1.Name || "No Name"}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography color="text.secondary">
                                Player 1
                              </Typography>
                            )}
                          </Box>

                          <Divider
                            sx={{
                              height: "50%",
                              border: "1px solid #aaaaaa",
                              transform: "rotate(33deg)",
                            }}
                          />
                          <Box
                            sx={{
                              width: "40%",
                              height: "100%",
                              textAlign: "center",
                              flexDirection: "row",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              paddingX: "2 !important",
                              cursor: "pointer",
                            }}
                            onDrop={(e) => dropHandler(e, "player2")}
                            onDragOver={(e) => dragoverHandler(e)}
                            onTouchEnd={(e) => touchEndHandler(e, "player2")}
                            onClick={() => removeFromPair("player2")}
                          >
                            {pairSlots.player2 ? (
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: "primary.main",
                                  }}
                                >
                                  <Person fontSize="small" />
                                </Avatar>
                                <Typography variant="h6" fontWeight="bold">
                                  {pairSlots.player2.Name || "No Name"}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography color="text.secondary">
                                Player 2
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Button
                          disabled={createPairDisabled}
                          variant="contained"
                          sx={{ color: "white" }}
                          onClick={async () => {
                            const newPairName = `${pairSlots.player1.Name} & ${pairSlots.player2.Name}`;
                            const newPair = {
                              DisplayName: newPairName,
                              Player1Id:
                                pairSlots.player1.id ||
                                pairSlots.player1.UserId,
                              Player2Id:
                                pairSlots.player2.id ||
                                pairSlots.player2.UserId,
                              CreatedAt: new Date().toISOString(),
                            };
                            await addSinglePair(newPair, event.id);
                            setPairSlots({ player1: null, player2: null });
                            dispatch(fetchEvents({ db, forceRefresh: false }));
                          }}
                        >
                          Create Pair
                        </Button>
                        <Typography variant="title1" fontWeight="bold">
                          Single players registered
                        </Typography>
                        <Divider />
                        <div>
                          <List
                            sx={{
                              margin: "0 !important",
                              padding: "0 !important",
                            }}
                          >
                            {filteredUsers.map((player, index) => (
                              <React.Fragment key={player.id || player.Name}>
                                <ListItem
                                  draggable="true"
                                  onDragStart={(e) => dragstartHandler(e)}
                                  onTouchStart={(e) =>
                                    touchStartHandler(e, player.id || player.Name)
                                  }
                                  sx={{ py: 2, cursor: "grab" }}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      aria-label="delete"
                                      onClick={async () => {
                                        await unregisterFromEvent(
                                          event.id,
                                          player.id || player.UserId,
                                          player.IsGuest
                                        );
                                        dispatch(
                                          fetchEvents({ db, forceRefresh: false })
                                        );
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
                                        id={player.id || player.Name}
                                        variant="h6"
                                        sx={{
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {player.Name || "No Name"}
                                      </Typography>
                                    }
                                  />
                                  {/* FUTURE -- add inscription date */}
                                </ListItem>
                                {index < filteredUsers.length - 1 && <Divider />}
                              </React.Fragment>
                            ))}
                          </List>
                        </div>
                      </>
                    ) : null}
                  </Stack>
                </Paper>
              )}
            </Stack>
            <Stack>
              {event.Pairs && event.Pairs.length > 0 && (
                <Box sx={{ px: 4, py: 4 }}>
                  <Grid container spacing={3}>
                    {event.Pairs.map((pair, index) => {
                      const player1Name = pair.DisplayName.split(" & ")[0];
                      const player2Name = pair.DisplayName.split(" & ")[1];

                      const player1PhotoURL = users.find(
                        (u) =>
                          u.id === pair.Player1Id)?.PhotoURL;
                      const player2PhotoURL = users.find(
                        (u) =>
                          u.id === pair.Player2Id)?.PhotoURL;

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
                                justifyContent="start"
                                sx={{ mb: 2 }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  color="text.secondary"
                                >
                                  Pair
                                </Typography>
                                <Chip
                                  size="small"
                                  label={`#${index + 1}`}
                                  sx={{ marginLeft: "auto" }}
                                />
                                {user?.IsAdmin && (
                                  <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={async () => {
                                      await deletePairFromEvent(
                                        event.id,
                                        pair.Player1Id,
                                        pair.Player2Id
                                      );
                                      dispatch(
                                        fetchEvents({ db, forceRefresh: false })
                                      );
                                    }}
                                  >
                                    <DeleteIcon color="error" />
                                  </IconButton>
                                )}
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
                                    src={player1PhotoURL}
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: "primary.main",
                                      fontSize: 12,
                                    }}
                                  >
                                    {initials(player1Name)}
                                  </Avatar>
                                  {/* <Avatar
                                    src={user?.PhotoURL && !imageError ? user.PhotoURL : undefined}
                                    sx={{
                                      width: 100,
                                      height: 100,
                                      mx: "auto",
                                      mb: 2,
                                      fontSize: "2rem",
                                      bgcolor: "primary.main",
                                      border: '3px solid',
                                      borderColor: 'primary.main',
                                      opacity: imageLoading && user?.PhotoURL && !imageError ? 0 : 1,
                                      transition: 'opacity 0.3s ease-in-out',
                                    }}
                                    imgProps={{
                                      onLoad: () => setImageLoading(false),
                                      onError: () => {
                                        setImageLoading(false);
                                        setImageError(true);
                                      }
                                    }}>
                                    {user?.PhotoURL || getInitials()}
                                  </Avatar> */}
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
                                    src={player2PhotoURL}
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
                  setModeToSearchPlayer("single");
                  setOpenSearchPlayer(true);
                }}
              >
                <Add sx={{ color: "white" }} />
              </Fab>
            )}
          </TabPanel>
          {/* Brackets */}
          <TabPanel value={tab} index={2}>
            {event.TypeOfTournament === "Mix" ? (
              <RobinHoodBracket
                eventId={event.id}
                tournamentId={event.TournamentId}
              />
            ) : event.TypeOfTournament !== "Mix" ? (
              <EliminationsBrackets
                eventId={event.id}
                tournamentId={event.TournamentId}
              />
            ) : null}
          </TabPanel>
          {/* Rankings */}
          <TabPanel value={tab} index={3} sx={{ display: "flex" }}>
            <EventRankings
              eventId={event.id}
              tournamentId={event.TournamentId}
              wonStatisticsUpdated={event.WonStatisticsUpdated}
            />
          </TabPanel>
          <ConfirmationModal
            open={showConfirmation}
            title={confirmationModalTitle}
            description=""
            type={type}
            negativeText="Cancel"
            positiveText="Yes"
            onClose={() => setConfirmation(false)}
            onConfirm={async () => {
              if (type === "exitGame") {
                await unregisterFromEvent(event.id);
                setShowExitSuccess(true);
              } else if (type === "joinGame") {
                if (type === "joinGameInPairs") {
                  setOpenSearchPlayer(true);
                } else {
                  await registerFromEvent(event.id);
                  setShowJoinSuccess(true);
                }
              } else if (type === "createMatchesRobinHood") {
                await createMatchsRobinHood(eventId);
                setSuccessTitle("Matches Created!");
                setSuccessDescription(
                  "Check out the Brackets tab to see the matchups."
                );
                setShowCustomSuccess((prev) => {
                  return true;
                });
              } else if (type === "createMasters") {
                await createMatchsElimination(eventId);
                setSuccessTitle("Groups Created!");
                setSuccessDescription(
                  "Groups created successfully. Navigate to the Brackets tab to view them."
                );
                setShowCustomSuccess((prev) => {
                  return true;
                });
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
          <SuccessModal
            open={showCustomSuccess}
            onClose={() => setShowCustomSuccess(false)}
            _title={successTitle}
            _description={successDescription}
            _buttonText="Got it"
          />
          <SearchPlayer
            open={openSearchPlayer}
            playersIds={event.PlayersIds}
            mode={modeToSearchPlayer}
            onClose={async (selectedPlayer, pairMode) => {
              setOpenSearchPlayer(false);
              if (selectedPlayer && typeof selectedPlayer === "object") {
                if (!pairMode) {
                  await registerFromEvent(
                    event.id,
                    selectedPlayer.id,
                    false,
                    false
                  );
                } else {
                  //register it self as well as a pair
                  await registerFromEvent(
                    event.id,
                    selectedPlayer.id,
                    false,
                    true
                  );
                }
              } else if (selectedPlayer && typeof selectedPlayer === "string") {
                if (!pairMode) {
                  await registerFromEvent(
                    event.id,
                    selectedPlayer,
                    true,
                    false
                  );
                } else {
                  //register it self as well as a pair
                  await registerFromEvent(event.id, selectedPlayer, true, true);
                }
              }
              dispatch(fetchEvents({ db, forceRefresh: false }));
            }}
          />
        </Box>
      </Paper>
    </>
  );
};

export default Event;
