import React, { useEffect, useState, useRef, useMemo } from "react";

import { useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getFirestore, updateDoc, doc } from "firebase/firestore";
import { fetchEvents, selectEvents } from "../redux/slices/eventsSlice";
import { fetchUsers, selectUsers } from "../redux/slices/usersSlice";
import useAuth from "../utils/useAuth";
import useEventActions from "../utils/EventsUtils";

import {
  Box,
  Chip,
  Fab,
  Paper,
  Typography,
  Avatar,
  Stack,
  Button,
  Container,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar as MAvatar,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

import { Add, Group } from "@mui/icons-material";

import ConfirmationModal from "../components/ConfirmationModal";
import SuccessModal from "../components/SuccessModal";
import SearchPlayer from "../components/SearchPlayer";
import RobinHoodBracket from "../components/RobinHoodBracket";
import CupBrackets from "../components/CupBrackets";
import { Person, Delete as DeleteIcon } from "@mui/icons-material";

const SponsorBanner = ({ mainSponsor, logoSponsor }) => (
  <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Main Sponsor
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {mainSponsor}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Logo Sponsor
        </Typography>
        <Avatar
          sx={{ bgcolor: "transparent", width: 56, height: 56, fontSize: 20 }}
        >
          {logoSponsor?.charAt(0) || "L"}
        </Avatar>
      </Box>
    </Stack>
  </Paper>
);

const EventCup = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const cup = state?.cup || {};

  const dispatch = useDispatch();
  const db = getFirestore();
  const events = useSelector(selectEvents);
  const users = useSelector(selectUsers);
  const { user } = useAuth();
  const {
    unregisterFromEvent,
    addSinglePair,
    deletePairFromEvent,
    registerFromEvent,
  } = useEventActions();

  const initialFetchDone = useRef(false);
  const [tab, setTab] = useState(0);
  const [event, setEvent] = useState(null);
  const [openSearchPlayer, setOpenSearchPlayer] = useState(false);
  const [pairSlots, setPairSlots] = useState({ player1: null, player2: null });
  const [usersBeingPairedIds, setUsersBeingPairedIds] = useState([]);
  const [createPairDisabled, setCreatePairDisabled] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationDescription, setConfirmationDescription] = useState("");
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [showExitSuccess, setShowExitSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successDescription, setSuccessDescription] = useState("");
  const [type, setType] = useState("joinGame");
  const [modeToSearchPlayer, setModeToSearchPlayer] = useState("single");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorColor, setSponsorColor] = useState("#b88f34");
  const [sponsorLogoFile, setSponsorLogoFile] = useState(null);
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState("");
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [manageSponsorOpen, setManageSponsorOpen] = useState(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      dispatch(fetchEvents({ db, forceRefresh: false }));
      dispatch(fetchUsers({ db, forceRefresh: false }));
    }
  }, [dispatch, db]);

  useEffect(() => {
    const eventId = cup.id;
    const found = events.find((e) => e.id === eventId);
    setEvent(found || null);
  }, [events, cup]);

  useEffect(() => {
    // Prefill sponsor fields from event or cup
    const main = event?.mainSponsor || "";
    const color = event?.SponsorColor || "#b88f34";
    const logo = event?.logoSponsor || "";
    setSponsorName(main);
    setSponsorColor(color);
    setSponsorLogoPreview(logo);
  }, [event]);

  useEffect(() => {
    setCreatePairDisabled(!pairSlots.player1 || !pairSlots.player2);
  }, [pairSlots]);

  const handleListItemClick = (player) => {
    const ids = [player.id, player.UserId, player.Name].filter(Boolean);
    if (ids.some((i) => usersBeingPairedIds.includes(i))) return;

    setPairSlots((prev) => {
      if (!prev.player1) return { ...prev, player1: player };
      if (!prev.player2) return { ...prev, player2: player };
      return { ...prev, player2: player };
    });
    setUsersBeingPairedIds((prev) => {
      const toAdd = ids.filter((i) => !prev.includes(i));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  };

  const handleConfirmationConfirm = async () => {
    const eventId = event?.id || event.eventId;
    setShowConfirmation(false);
    try {
      if (type === "joinGame") {
        await registerFromEvent(eventId, null, false, true);
        dispatch(fetchEvents({ db, forceRefresh: false }));
        setShowJoinSuccess(true);
      } else if (type === "joinGameInPairs") {
        setModeToSearchPlayer("pairs");
        setOpenSearchPlayer(true);
      } else if (type === "exitGame") {
        let partnerId, pair;
        pair = event?.Pairs?.find(
          (p) => p.Player1Id === user.uid || p.Player2Id === user.uid,
        );

        if (pair.Player1Id === user.uid) {
          partnerId = pair.Player2Id;
        } else {
          partnerId = pair.Player1Id;
        }

        await deletePairFromEvent(event.id, user.uid, partnerId);
        dispatch(
          fetchEvents({
            db,
            forceRefresh: false,
          }),
        );
        dispatch(fetchEvents({ db, forceRefresh: false }));
        setShowExitSuccess(true);
      }
    } catch (err) {
      console.error("confirmation action error", err);
    }
  };

  const removeFromPair = (slot) => {
    const player = pairSlots[slot];
    if (player) {
      setPairSlots((prev) => ({ ...prev, [slot]: null }));
      setUsersBeingPairedIds((prev) =>
        prev.filter(
          (id) =>
            id !== player.id && id !== player.UserId && id !== player.Name,
        ),
      );
    }
  };

  const filteredUsers = [...(users || []), ...(event?.Guests || [])]
    .filter(
      (u) =>
        !event?.PlayersWithPairsIds?.includes(u.id) &&
        !event?.PlayersWithPairsIds?.includes(u.UserId),
    )
    .filter(
      (u) =>
        event?.PlayersIds?.includes(u.id) ||
        (u.IsGuest && event?.PlayersIds?.includes(u.UserId)),
    )
    .filter(
      (u) =>
        !usersBeingPairedIds.includes(u.id) &&
        !usersBeingPairedIds.includes(u.Name),
    );

  const playersToExclude = useMemo(() => {
    if (!event || !user) return [];

    let playersToExclude = users.filter(
      (u) =>
        event?.PlayersWithPairsIds?.includes(u.id) ||
        event?.PlayersIds?.includes(u.id) ||
        user?.uid === u.id,
    );
    let playersToExcludeIds = playersToExclude.map((p) => p.id);
    return playersToExcludeIds;
  }, [event?.PlayersIds, event?.PlayersWithPairsIds, user]);

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

  if (event === null || user === null || user === undefined) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  const alreadyRegistered = event?.PlayersIds?.includes(user?.uid);

  return (
    <>
      <Paper
        sx={{
          bgcolor: sponsorColor || sponsorColor || "#b88f34",
          color: "white",
          textAlign: "start",
          pt: "env(safe-area-inset-top)",
        }}
      >
        <Box sx={{ py: 3, px: 2 }}>
          <Container maxWidth="sm">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {event.title || "Event Cup"}
                </Typography>
              </Box>
            </Stack>
          </Container>
        </Box>
        <Box bgcolor="background.default" sx={{ pt: 2 }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              "& .MuiTabs-indicator": {
                bgcolor:
                  sponsorColor || sponsorColor || "primary.main",
              },
              "& .MuiTab-root": {
                color:
                  sponsorColor || sponsorColor || "primary.main",
              },
            }}
          >
            <Tab label="Details" />
            <Tab label="Players" />
            <Tab label="Brackets" />
          </Tabs>
        </Box>
      </Paper>

      <Box
        height="100vh"
        maxHeight="calc(100vh - 230px - env(safe-area-inset-bottom))"
        display="flex"
        flexDirection="column"
        bgcolor="background.default"
      >
        <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
          <TabPanel value={tab} index={0}>
            <SponsorBanner
              mainSponsor={event.mainSponsor}
              logoSponsor={event.logoSponsor}
            />
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="body1" color="text.secondary">
                {event.description || "Cup overview and details."}
              </Typography>
            </Paper>

            {user && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {!alreadyRegistered && (
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      bgcolor:
                        sponsorColor ||
                        sponsorColor ||
                        "primary.main",
                      color: "white",
                    }}
                    onClick={async () => {
                      if ((event?.TypeOfTournament || event.type) === "Mix") {
                        setType("joinGame");
                        setConfirmationTitle("Register");
                        setConfirmationDescription(
                          "Do you want to register for this cup?",
                        );
                        setShowConfirmation(true);
                      } else {
                        setType("joinGameInPairs");
                        setModeToSearchPlayer("pairs");
                        setConfirmationTitle("Find Partner");
                        setConfirmationDescription(
                          "You'll be able to pick a partner to form a pair for this event. Continue?",
                        );
                        setShowConfirmation(true);
                      }
                    }}
                  >
                    Register
                  </Button>
                )}

                {alreadyRegistered && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        bgcolor:
                          sponsorColor ||
                          sponsorColor ||
                          "primary.main",
                        color: "white",
                      }}
                    >
                      Good Luck 🤞
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        bgcolor: "white",
                        color:
                          sponsorColor ||
                          sponsorColor ||
                          "primary.main",
                        borderColor:
                          sponsorColor ||
                          sponsorColor ||
                          "primary.main",
                      }}
                      onClick={() => {
                        setType("exitGame");
                        setConfirmationTitle("Unregister");
                        setConfirmationDescription(
                          "Are you sure you want to unregister from this cup?",
                        );
                        setShowConfirmation(true);
                      }}
                    >
                      Unregister
                    </Button>
                  </>
                )}
              </Stack>
            )}

            {user?.IsAdmin && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor:
                      sponsorColor ||
                      sponsorColor ||
                      "primary.main",
                    color:
                      sponsorColor ||
                      sponsorColor ||
                      "primary.main",
                  }}
                  onClick={() => setManageSponsorOpen(true)}
                >
                  Manage Sponsor
                </Button>
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Group />}
                fullWidth
                sx={{
                  borderColor:
                    sponsorColor ||
                    sponsorColor ||
                    "primary.main",
                  color:
                    sponsorColor ||
                    sponsorColor ||
                    "primary.main",
                }}
                disabled={event.TournamentStarted}
                onClick={async () => {
                  if (
                    !event.Pairs ||
                    event.Pairs.length % 2 !== 0 ||
                    event.Pairs.length < 4
                  ) {
                    alert("No pairs available to create matches.");
                    return;
                  }
                  if (event.TypeOfTournament === "Mix") {
                    setType("createMatchesRobinHood");
                    setConfirmationTitle("Create matches?");
                    setConfirmationDescription("");
                    setShowConfirmation(true);
                  } else {
                    setType("createMasters");
                    setConfirmationTitle("Create Groups?");
                    setConfirmationDescription("");
                    setShowConfirmation(true);
                  }
                  dispatch(fetchEvents({ db, forceRefresh: false }));
                }}
              >
                Create Groups & Matches
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Stack spacing={2}>
              {!event?.PairsCreated && user?.IsAdmin && (
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
                      onClick={() => removeFromPair("player1")}
                    >
                      {pairSlots.player1 ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor:
                                sponsorColor ||
                                sponsorColor ||
                                "primary.main",
                            }}
                          >
                            <Person fontSize="small" />
                          </Avatar>
                          <Typography variant="p" fontWeight="bold">
                            {pairSlots.player1.Name || "No Name"}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography color="text.secondary">Player 1</Typography>
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
                      onClick={() => removeFromPair("player2")}
                    >
                      {pairSlots.player2 ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor:
                                sponsorColor ||
                                sponsorColor ||
                                "primary.main",
                            }}
                          >
                            <Person fontSize="small" />
                          </Avatar>
                          <Typography variant="p" fontWeight="bold">
                            {pairSlots.player2.Name || "No Name"}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography color="text.secondary">Player 2</Typography>
                      )}
                    </Box>
                  </Box>
                  <Button
                    disabled={createPairDisabled}
                    variant="contained"
                    sx={{
                      bgcolor:
                        sponsorColor ||
                        sponsorColor ||
                        "primary.main",
                      color: "white",
                    }}
                    onClick={async () => {
                      const newPairName = `${pairSlots.player1.Name} & ${pairSlots.player2.Name}`;
                      const newPair = {
                        DisplayName: newPairName,
                        Player1Id:
                          pairSlots.player1.id || pairSlots.player1.UserId,
                        Player2Id:
                          pairSlots.player2.id || pairSlots.player2.UserId,
                        CreatedAt: new Date().toISOString(),
                      };
                      await addSinglePair(newPair, event.id, false);
                      setPairSlots({ player1: null, player2: null });
                      dispatch(fetchEvents({ db, forceRefresh: false }));
                    }}
                  >
                    Create Pair
                  </Button>
                  {filteredUsers.length > 0 && (
                    <>
                      <Typography variant="title1" fontWeight="bold">
                        Single players registered
                      </Typography>
                      <Divider />
                      <List
                        sx={{
                          margin: "0 !important",
                          padding: "0 !important",
                        }}
                      >
                        {filteredUsers.map((player, index) => (
                          <React.Fragment key={player.id || player.Name}>
                            <ListItem
                              onClick={() => handleListItemClick(player)}
                              sx={{
                                py: 2,
                                cursor: "pointer",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                              }}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={async () => {
                                    await unregisterFromEvent(
                                      event.id,
                                      player.id || player.UserId,
                                      player.IsGuest,
                                    );
                                    dispatch(
                                      fetchEvents({ db, forceRefresh: false }),
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
                                  bgcolor:
                                    sponsorColor ||
                                    sponsorColor ||
                                    "primary.main",
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
                    </>
                  )}
                </>
              )}
              <Typography variant="title1" fontWeight="bold">
                Pairs registered
              </Typography>
              <Divider />
              {event?.Pairs && event.Pairs.length > 0 && (
                <Box sx={{ px: 4, py: 4 }}>
                  <Grid container spacing={3}>
                    {event.Pairs.map((pair, index) => {
                      const player1Name = pair.DisplayName.split(" & ")[0];
                      const player2Name = pair.DisplayName.split(" & ")[1];

                      const player1PhotoURL = users.find(
                        (u) => u.id === pair.Player1Id,
                      )?.PhotoURL;
                      const player2PhotoURL = users.find(
                        (u) => u.id === pair.Player2Id,
                      )?.PhotoURL;

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
                                        pair.Player2Id,
                                      );
                                      dispatch(
                                        fetchEvents({
                                          db,
                                          forceRefresh: false,
                                        }),
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
                                      bgcolor:
                                        sponsorColor ||
                                        sponsorColor ||
                                        "primary.main",
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
                                      bgcolor:
                                        sponsorColor ||
                                        sponsorColor ||
                                        "primary.main",
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

              {/* <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="h6">Registered Players</Typography>
                                <List>
                                    {filteredUsers.map((player, index) => (
                                        <React.Fragment key={player.id || player.Name}>
                                            <ListItem sx={{ py: 2, cursor: 'pointer' }} onClick={() => handleListItemClick(player)} secondaryAction={
                                                <IconButton edge="end" aria-label="delete" onClick={async () => {
                                                    await unregisterFromEvent(event?.id || event.eventId, player.id || player.UserId, player.IsGuest);
                                                    dispatch(fetchEvents({ db, forceRefresh: false }));
                                                }}>
                                                    <DeleteIcon color="error" />
                                                </IconButton>
                                            }>
                                                <MAvatar sx={{ mr: 2, bgcolor: 'primary.main' }}><Person /></MAvatar>
                                                <ListItemText primary={<Typography variant="h6" fontWeight="bold">{player.Name || 'No Name'}</Typography>} />
                                            </ListItem>
                                            {index < filteredUsers.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper> */}
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Paper sx={{ p: 2 }} elevation={1}>
              {event.type === "Mix" ? (
                <RobinHoodBracket
                  eventId={event?.id || event.eventId}
                  tournamentId={event.tournamentId}
                />
              ) : (
                <CupBrackets
                  eventId={event?.id || event.eventId}
                  tournamentId={event.tournamentId}
                />
              )}
            </Paper>
          </TabPanel>
        </Container>
      </Box>
      {/* Confirmation and success modals */}
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

      <SuccessModal
        open={showJoinSuccess}
        onClose={() => setShowJoinSuccess(false)}
        _title={successTitle}
        _description={successDescription}
        _buttonText="Great"
      />

      <SuccessModal
        open={showExitSuccess}
        onClose={() => setShowExitSuccess(false)}
        _title="Unregistered"
        _description="You have been unregistered from this event. Sorry to see you go!"
        _buttonText="OK"
      />
      {/* Manage Sponsor Dialog */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={manageSponsorOpen}
        onClose={() => setManageSponsorOpen(false)}
      >
        <DialogTitle>Manage Sponsor</DialogTitle>
        <DialogContent>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Sponsor Name"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                fullWidth
              />

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  label="Sponsor Color"
                  type="color"
                  value={sponsorColor}
                  onChange={(e) => setSponsorColor(e.target.value)}
                  sx={{ width: 120 }}
                />

                <Box>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="sponsor-logo-input-modal"
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      setSponsorLogoFile(f || null);
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = (ev) =>
                          setSponsorLogoPreview(ev.target.result);
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                  <label htmlFor="sponsor-logo-input-modal">
                    <Button
                      variant="outlined"
                      component="span"
                      sx={{
                        borderColor:
                          sponsorColor ||
                          "primary.main",
                        color:
                          sponsorColor ||
                          "primary.main",
                      }}
                    >
                      Upload Logo
                    </Button>
                  </label>
                </Box>

                {sponsorLogoPreview && (
                  <Avatar
                    src={sponsorLogoPreview}
                    sx={{ width: 56, height: 56 }}
                  />
                )}
              </Box>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Stack direction="column" spacing={2} sx={{ width: "100%", px: 0 }}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ borderColor: sponsorColor || "primary.main", color: sponsorColor || "primary.main" }}
              onClick={() => setManageSponsorOpen(false)}
            >
              <Typography color={sponsorColor || "primary.main"}>Cancel</Typography>
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ borderColor: "error.main", color: "error.main" }}
              onClick={async () => {
                if (!event?.id) return;
                try {
                  const eventRef = doc(db, `Events/${event.id}`);
                  await updateDoc(eventRef, {
                    MainSponsor: null,
                    SponsorLogo: null,
                    SponsorColor: null,
                    ModifiedAt: new Date(),
                  });
                  setSponsorName("");
                  setSponsorLogoPreview("");
                  setSponsorColor(sponsorColor || "#b88f34");
                  dispatch(fetchEvents({ db, forceRefresh: false }));
                  setManageSponsorOpen(false);
                } catch (err) {
                  console.error("remove sponsor error", err);
                }
              }}
            >
              Remove Sponsor
            </Button>
            <Button
              fullWidth
              variant="contained"
              sx={{ bgcolor: sponsorColor || sponsorColor || "primary.main", color: "white" }}
              onClick={async () => {
                if (!event?.id) return;
                setSavingSponsor(true);
                try {
                  const eventRef = doc(db, `Events/${event.id}`);
                  await updateDoc(eventRef, {
                    MainSponsor: sponsorName || null,
                    SponsorLogo: sponsorLogoPreview || null,
                    SponsorColor: sponsorColor || null,
                    ModifiedAt: new Date(),
                  });
                  dispatch(fetchEvents({ db, forceRefresh: false }));
                  setManageSponsorOpen(false);
                } catch (err) {
                  console.error("save sponsor error", err);
                }
                setSavingSponsor(false);
              }}
            >
              <Typography color="white">Save Sponsor</Typography>
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      {user?.IsAdmin && (
        <Fab
          sx={{
            bgcolor:
              sponsorColor || sponsorColor || "primary.main",
            color: "white",
          }}
          aria-label="add"
          style={{ position: "fixed", bottom: 76, right: 16 }}
          onClick={() => {
            setModeToSearchPlayer("single");
            setOpenSearchPlayer(true);
          }}
        >
          <Add sx={{ color: "white" }} />
        </Fab>
      )}
      <SearchPlayer
        open={openSearchPlayer}
        playersIds={playersToExclude}
        mode={modeToSearchPlayer}
        sponsorColor={sponsorColor || sponsorColor || "primary.main"}
        onClose={async (selectedPlayer, pairMode) => {
          setOpenSearchPlayer(false);
          // If closing with a selected partner for pairs mode, create a pair
          if (pairMode && selectedPlayer) {
            try {
              const partnerId =
                selectedPlayer.id || selectedPlayer.UserId || null;
              const partnerName =
                selectedPlayer.label ||
                selectedPlayer.Name ||
                selectedPlayer ||
                "Partner";
              if (!partnerId) {
                console.warn(
                  "Selected partner has no id; skipping pair creation",
                );
              } else {
                const newPairName = `${user.Name} & ${partnerName}`;
                const newPair = {
                  DisplayName: newPairName,
                  Player1Id: user.uid,
                  Player2Id: partnerId,
                  CreatedAt: new Date().toISOString(),
                };
                await addSinglePair(newPair, event.id, true);
                setSuccessTitle("Pair Created Successfully");
                setSuccessDescription(
                  `You have been paired with ${partnerName} for this event.`,
                );
                setShowJoinSuccess(true);
              }
            } catch (err) {
              console.error("Error creating pair from SearchPlayer", err);
            }
          }

          if (
            selectedPlayer &&
            typeof selectedPlayer === "object" &&
            !pairMode
          ) {
            // registration handled in SearchPlayer callback in original event.js; keep simple here
            await registerFromEvent(event.id, selectedPlayer.id, false, false);
          } else if (selectedPlayer && typeof selectedPlayer === "string") {
            await registerFromEvent(event.id, selectedPlayer, true, false);
          }

          dispatch(fetchEvents({ db, forceRefresh: false }));
        }}
      />
    </>
  );
};

export default EventCup;
