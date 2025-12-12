import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import {
    fetchUsers,
    selectUsers,
    selectUsersLoading,
} from "../redux/slices/usersSlice";
import useAuth from "../utils/useAuth";
import { getFirestore } from "firebase/firestore";

import {
    Avatar,
    Box,
    CircularProgress,
    Paper,
    InputBase,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Card,
    CardContent,
    Button,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import { LocalOffer, Notifications, Person } from "@mui/icons-material";

import { styled, alpha } from "@mui/material/styles";

const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(1),
        width: "auto",
    },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    width: "100%",
    "& .MuiInputBase-input": {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create("width"),
        [theme.breakpoints.up("sm")]: {
            width: "12ch",
            "&:focus": {
                width: "20ch",
            },
        },
    },
}));

const Community = () => {
    const db = getFirestore();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const users = useSelector(selectUsers);
    const usersLoading = useSelector(selectUsersLoading);

    const [searchQuery, setSearchQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // **Persistent caches — DO NOT RESET**
    const [loadingImages, setLoadingImages] = useState({});
    const [imageErrors, setImageErrors] = useState({});

    /** -----------------------------
     *  FETCH USERS ONCE
     *  ----------------------------- */
    useEffect(() => {
        dispatch(fetchUsers({ db, forceRefresh: false }));
    }, [dispatch, db]);

    /** -----------------------------
     *  FILTER SEARCH RESULTS
     *  ----------------------------- */
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUsers([]);
            setShowResults(false);
            return;
        }

        const searchLower = searchQuery.toLowerCase();
        const filtered = users.filter(
            (u) => u.Name && u.Name.toLowerCase().includes(searchLower)
        );

        setFilteredUsers(filtered);
        setShowResults(true);
    }, [searchQuery, users]);

    /** -----------------------------
     *  IMAGE LOAD + ERROR HANDLING
     *  ----------------------------- */

    const handleImageLoad = (userId) => {
        setLoadingImages((prev) => ({ ...prev, [userId]: false }));
    };

    const handleImageError = (userId) => {
        setLoadingImages((prev) => ({ ...prev, [userId]: false }));
        setImageErrors((prev) => ({ ...prev, [userId]: true }));
    };

    return (
        <>
            <Paper
                sx={{
                    bgcolor: "#b88f34",
                    color: "white",
                    textAlign: "start",
                    height: 80,
                    pt: "env(safe-area-inset-top)",
                }}
            >
                <Box sx={{ py: 3, px: 2, display: "flex", alignItems: "center" }}>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder="Search…"
                            inputProps={{ "aria-label": "search" }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Search>
                    <LocalOffer sx={{ ml: 2 }} onClick={() => { navigate("/Benefits") }} />
                    <Notifications sx={{ ml: 2 }} />
                </Box>
            </Paper>

            <Box
                sx={{
                    px: 0,
                    pt: 0,
                    height: "Calc(100vh - 140px)",
                    overflow: "auto",
                }}
            >
                {showResults && (
                    <Box sx={{ p: 2 }}>
                        {usersLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredUsers.length === 0 ? (
                            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                No users found matching "{searchQuery}"
                            </Typography>
                        ) : (
                            <Card>
                                <CardContent sx={{ p: "0 !important" }}>
                                    <List>
                                        {filteredUsers.map((filteredUser, index) => {
                                            // Initialize loading state only once
                                            if (
                                                filteredUser.PhotoURL &&
                                                loadingImages[filteredUser.id] === undefined
                                            ) {
                                                setLoadingImages((prev) => ({
                                                    ...prev,
                                                    [filteredUser.id]: true,
                                                }));
                                            }

                                            return (
                                                <React.Fragment key={filteredUser.id}>
                                                    <ListItem sx={{ py: 2 }}>
                                                        <Box sx={{ position: "relative", mr: 2 }}>
                                                            {/* Image loading spinner */}
                                                            {filteredUser.PhotoURL &&
                                                                loadingImages[filteredUser.id] &&
                                                                !imageErrors[filteredUser.id] && (
                                                                    <Box
                                                                        sx={{
                                                                            position: "absolute",
                                                                            top: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            bottom: 0,
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            zIndex: 1,
                                                                        }}
                                                                    >
                                                                        <CircularProgress size={20} />
                                                                    </Box>
                                                                )}

                                                            <Avatar
                                                                src={
                                                                    filteredUser.PhotoURL &&
                                                                        !imageErrors[filteredUser.id]
                                                                        ? filteredUser.PhotoURL
                                                                        : undefined
                                                                }
                                                                sx={{
                                                                    bgcolor:
                                                                        filteredUser.PhotoURL &&
                                                                            !imageErrors[filteredUser.id]
                                                                            ? "transparent"
                                                                            : "primary.main",
                                                                    opacity:
                                                                        loadingImages[filteredUser.id] &&
                                                                            filteredUser.PhotoURL &&
                                                                            !imageErrors[filteredUser.id]
                                                                            ? 0
                                                                            : 1,
                                                                    transition: "opacity 0.3s ease-in-out",
                                                                }}
                                                                imgProps={{
                                                                    onLoad: () =>
                                                                        handleImageLoad(filteredUser.id),
                                                                    onError: () =>
                                                                        handleImageError(filteredUser.id),
                                                                }}
                                                            >
                                                                {(!filteredUser.PhotoURL ||
                                                                    imageErrors[filteredUser.id]) && <Person />}
                                                            </Avatar>
                                                        </Box>

                                                        <ListItemText
                                                            primary={
                                                                <Typography
                                                                    variant="h6"
                                                                    sx={{ fontWeight: "bold" }}
                                                                >
                                                                    {filteredUser.Name || "No Name"}
                                                                </Typography>
                                                            }
                                                        />
                                                        <Box>
                                                            <Button variant="outlined" sx={{ py: 0 }}>
                                                                <Typography variant="button" color="primary">Follow</Typography>
                                                            </Button>
                                                        </Box>
                                                    </ListItem>

                                                    {index < filteredUsers.length - 1 && <Divider />}
                                                </React.Fragment>
                                            );
                                        })}
                                    </List>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </Box>
        </>
    );
};

export default Community;
