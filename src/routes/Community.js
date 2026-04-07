import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
    fetchUsers,
    selectUsers,
    selectUsersLoading
} from "../redux/slices/usersSlice";
import useAuth from "../utils/useAuth";
import {
    doc,
    getFirestore,
    collection,
    addDoc,
    increment,
    getDocs,
    query,
    orderBy,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    where
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import FullscreenImageDialog from "../components/FullscreenImageDialog";

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
    CardHeader,
    CardMedia,
    CardActions,
    IconButton,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Alert,
    Menu,
    MenuItem
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import {
    LocalOffer,
    Notifications,
    Person,
    FavoriteBorder,
    Comment,
    Share,
    MoreVert,
    Add,
    Delete
} from "@mui/icons-material";

import { styled, alpha } from "@mui/material/styles";

const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.25)
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(1),
        width: "auto"
    }
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
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
                width: "20ch"
            }
        }
    }
}));

const getNotificationStatusLabel = (status) => {
    switch (status) {
    case "sent":
        return "Delivered";
    case "failed":
        return "Failed";
    case "not_sent":
        return "Saved only";
    default:
        return "Pending";
    }
};

const getNotificationStatusStyles = (status) => {
    switch (status) {
    case "sent":
        return {
            color: "#fff",
            backgroundColor: "success.light"
        };
    case "failed":
        return {
            color: "#fff",
            backgroundColor: "error.light"
        };
    case "not_sent":
        return {
            color: "#fff",
            backgroundColor: "warning.light"
        };
    default:
        return {
            color: "#fff",
            backgroundColor: "info.light"
        };
    }
};


const Community = () => {
    const db = getFirestore();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const users = useSelector(selectUsers);
    const usersLoading = useSelector(selectUsersLoading);
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // **Persistent caches — DO NOT RESET**
    const [loadingImages, setLoadingImages] = useState({});
    const [imageErrors, setImageErrors] = useState({});

    // Admin post creation
    const [openPostDialog, setOpenPostDialog] = useState(false);
    const [newPost, setNewPost] = useState({ content: "", image: "" });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingPost, setUploadingPost] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    // News feed data
    const [newsItems, setNewsItems] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);

    // Likes dialog
    const [likesDialogOpen, setLikesDialogOpen] = useState(false);
    const [selectedPostLikes, setSelectedPostLikes] = useState([]);

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsItems, setNotificationsItems] = useState([]);

    // Post menu
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    /** -----------------------------
     *  FETCH USERS ONCE
     *  ----------------------------- */
    useEffect(() => {
        dispatch(fetchUsers({ db, forceRefresh: false }));
    }, [dispatch, db]);

    /** -----------------------------
     *  FETCH NEWS POSTS
     *  ----------------------------- */
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const newsQuery = query(
                    collection(db, "News"),
                    where("IsDeleted", "==", false),
                    orderBy("CreatedDate", "desc")
                );
                const newsSnapshot = await getDocs(newsQuery);
                const newsList = newsSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    let timestamp = "Just now";

                    if (data.CreatedDate) {
                        const now = new Date();
                        const createdDate = data.CreatedDate.toDate();
                        const diffInMs = now - createdDate;
                        const diffInHours = Math.floor(
                            diffInMs / (1000 * 60 * 60)
                        );
                        const diffInDays = Math.floor(
                            diffInMs / (1000 * 60 * 60 * 24)
                        );

                        if (diffInHours < 1) {
                            timestamp = "Just now";
                        } else if (diffInHours < 24) {
                            timestamp = `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
                        } else {
                            timestamp = `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
                        }
                    }

                    // Check if current user has liked this post
                    const likedBy = data.LikedBy || [];
                    const isLiked = user?.uid
                        ? likedBy.includes(user.uid)
                        : false;

                    return {
                        id: doc.id,
                        ...data,
                        timestamp,
                        isLiked,
                        Likes: likedBy.length // Calculate likes from array length
                    };
                });
                console.log(newsList);

                setNewsItems(newsList);
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setLoadingNews(false);
            }
        };
        fetchNews();
    }, [db, user?.uid]);

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

    /** -----------------------------
     *  IMAGE FILE HANDLING
     *  ----------------------------- */
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setSnackbar({
                    open: true,
                    message: "Please select an image file",
                    severity: "error"
                });
                return;
            }

            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const openFullscreenImage = (imageSrc, alt) => {
        if (!imageSrc) {
            return;
        }

        setFullscreenImage({ src: imageSrc, alt });
    };

    /** -----------------------------
     *  ADMIN - CREATE NEWS POST
     *  ----------------------------- */
    const handleCreatePost = async () => {
        if (!newPost.content.trim()) {
            setSnackbar({
                open: true,
                message: "Content is required",
                severity: "error"
            });
            return;
        }

        setUploadingPost(true);

        try {
            let imageUrl = "";

            // Create a temporary document to get the ID
            const tempNewsRef = await addDoc(collection(db, "News"), {
                Author: doc(db, "Users", user.uid),
                Body: newPost.content,
                Image: "",
                IsDeleted: false,
                CreatedDate: new Date(),
                LikedBy: [],
                Likes: 0,
                Comments: 0
            });

            const newPostId = tempNewsRef.id;

            // Upload image if selected
            if (selectedImage) {
                const storage = getStorage();
                const imageRef = ref(
                    storage,
                    `News/${newPostId}/${selectedImage.name}`
                );

                await uploadBytes(imageRef, selectedImage);
                imageUrl = await getDownloadURL(imageRef);

                // Update the document with the image URL
                await updateDoc(tempNewsRef, {
                    Image: imageUrl
                });
            }

            // Refresh news list
            const newsQuery = query(
                collection(db, "News"),
                where("IsDeleted", "==", false),
                orderBy("CreatedDate", "desc")
            );
            const newsSnapshot = await getDocs(newsQuery);
            const newsList = newsSnapshot.docs.map((doc) => {
                const data = doc.data();
                let timestamp = "Just now";

                if (data.CreatedDate) {
                    const now = new Date();
                    const createdDate = data.CreatedDate.toDate();
                    const diffInMs = now - createdDate;
                    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                    const diffInDays = Math.floor(
                        diffInMs / (1000 * 60 * 60 * 24)
                    );

                    if (diffInHours < 1) {
                        timestamp = "Just now";
                    } else if (diffInHours < 24) {
                        timestamp = `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
                    } else {
                        timestamp = `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
                    }
                }

                const likedBy = data.LikedBy || [];
                const isLiked = user?.uid ? likedBy.includes(user.uid) : false;

                return {
                    id: doc.id,
                    ...data,
                    timestamp,
                    isLiked,
                    Likes: likedBy.length
                };
            });

            setNewsItems(newsList);

            setSnackbar({
                open: true,
                message: "News posted successfully!",
                severity: "success"
            });
            setOpenPostDialog(false);
            setNewPost({ content: "", image: "" });
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Error creating post:", error);
            setSnackbar({
                open: true,
                message: "Failed to create post",
                severity: "error"
            });
        } finally {
            setUploadingPost(false);
        }
    };

    const handleLike = async (postId, isLiked) => {
        if (!user?.uid) {
            setSnackbar({
                open: true,
                message: "You must be logged in to like posts",
                severity: "error"
            });
            return;
        }

        try {
            const postRef = doc(db, "News", postId);

            // Update the LikedBy array in Firestore
            await updateDoc(postRef, {
                LikedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });

            // Update the local state to reflect the change
            setNewsItems((prevNewsItems) =>
                prevNewsItems.map((item) => {
                    if (item.id === postId) {
                        const newLikedBy = isLiked
                            ? (item.LikedBy || []).filter(
                                (id) => id !== user.uid
                            )
                            : [...(item.LikedBy || []), user.uid];

                        return {
                            ...item,
                            LikedBy: newLikedBy,
                            Likes: newLikedBy.length,
                            isLiked: !isLiked
                        };
                    }
                    return item;
                })
            );
        } catch (error) {
            console.error("Error updating likes:", error);
            setSnackbar({
                open: true,
                message: "Failed to update like",
                severity: "error"
            });
        }
    };

    const handleShowLikes = (likedByIds) => {
        if (!likedByIds || likedByIds.length === 0) {
            return;
        }

        // Map user IDs to user objects
        const likedByUsers = likedByIds
            .map((userId) => users.find((u) => u.id === userId))
            .filter((user) => user); // Filter out undefined

        setSelectedPostLikes(likedByUsers);
        setLikesDialogOpen(true);
    };

    const formatRelativeTimestamp = (timestamp) => {
        if (!timestamp?.toDate) {
            return "Just now";
        }

        const now = new Date();
        const createdDate = timestamp.toDate();
        const diffInMs = now - createdDate;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return "Just now";
        }

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
        }

        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
        }

        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    };

    const handleNotificationsOpen = async () => {
        if (!user?.uid) {
            setSnackbar({
                open: true,
                message: "You must be logged in to view notifications",
                severity: "error"
            });
            return;
        }

        setNotificationsOpen(true);
        setNotificationsLoading(true);

        try {
            const notificationsQuery = query(
                collection(db, "Notifications"),
                where("UserId", "==", doc(db, "Users", user.uid))
            );
            const notificationsSnapshot = await getDocs(notificationsQuery);
            const notificationList = notificationsSnapshot.docs
                .map((notificationDoc) => {
                    const data = notificationDoc.data();

                    return {
                        id: notificationDoc.id,
                        ...data,
                        relativeDate: formatRelativeTimestamp(data.CreatedDate),
                        createdDateMs: data.CreatedDate?.toMillis?.() || 0
                    };
                })
                .sort((a, b) => b.createdDateMs - a.createdDateMs);

            setNotificationsItems(
                notificationList
            );
        } catch (error) {
            console.error("Error fetching notifications:", error);
            setNotificationsItems([]);
            setSnackbar({
                open: true,
                message: "Failed to fetch notifications",
                severity: "error"
            });
        } finally {
            setNotificationsLoading(false);
        }
    };

    const handleMarkNotificationAsRead = async (event, notificationId) => {
        event.stopPropagation();

        const notification = notificationsItems.find(
            (item) => item.id === notificationId
        );

        if (!notification || notification.MarkedAsRead) {
            return;
        }

        setNotificationsItems((prevItems) =>
            prevItems.map((item) =>
                item.id === notificationId
                    ? { ...item, MarkedAsRead: true }
                    : item
            )
        );

        if (String(notificationId).startsWith("mock-")) {
            return;
        }

        try {
            await updateDoc(doc(db, "Notifications", notificationId), {
                MarkedAsRead: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            setNotificationsItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === notificationId
                        ? { ...item, MarkedAsRead: false }
                        : item
                )
            );
            setSnackbar({
                open: true,
                message: "Failed to mark notification as read",
                severity: "error"
            });
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification?.Link) {
            return;
        }

        try {
            const parsedUrl = new URL(notification.Link, window.location.origin);
            if (parsedUrl.origin === window.location.origin) {
                navigate(
                    `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
                );
            } else {
                window.open(parsedUrl.toString(), "_blank", "noopener,noreferrer");
            }
        } catch {
            navigate(notification.Link);
        }

        setNotificationsOpen(false);
    };

    const handleMenuOpen = (event, postId) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedPostId(postId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleDeletePost = () => {
        handleMenuClose();
        setDeleteModalOpen(true);
    };

    const confirmDeletePost = async () => {
        if (!selectedPostId) return;

        try {
            const postRef = doc(db, "News", selectedPostId);
            await updateDoc(postRef, {
                IsDeleted: true
            });

            // Remove from local state
            setNewsItems((prevNewsItems) =>
                prevNewsItems.filter((item) => item.id !== selectedPostId)
            );

            setSnackbar({
                open: true,
                message: "Post deleted successfully",
                severity: "success"
            });
        } catch (error) {
            console.error("Error deleting post:", error);
            setSnackbar({
                open: true,
                message: "Failed to delete post",
                severity: "error"
            });
        } finally {
            setSelectedPostId(null);
        }
    };

    // Simple, safe markdown-like renderer for basic formatting.
    // Supports: **bold** or *bold*, _italic_ or *italic*, [text](url), and newlines.
    const renderRichText = (input) => {
        if (!input) return { __html: "" };

        const escapeHtml = (unsafe) =>
            unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#039;");

        let out = escapeHtml(String(input));

        // Links: [text](url)
        out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
            const safeUrl = url.replace(/\"/g, "%22");
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        });

        // Bold: **text** or *text*
        out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        out = out.replace(/\*(.+?)\*/g, "<strong>$1</strong>");

        // Italic: _text_ or ~text~
        out = out.replace(/_(.+?)_/g, "<em>$1</em>");
        out = out.replace(/~(.+?)~/g, "<em>$1</em>");

        // Preserve line breaks
        out = out.replace(/\r?\n/g, "<br/>\n");

        return { __html: out };
    };

    return (
        <>
            <Paper
                sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    textAlign: "start",
                    height: 80,
                    pt: "env(safe-area-inset-top)"
                }}>
                <Box
                    sx={{
                        py: 3,
                        px: 2,
                        display: "flex",
                        alignItems: "center"
                    }}>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon color="secondary"/>
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder='Search…'
                            inputProps={{ "aria-label": "search" }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Search>
                    <LocalOffer
                        sx={{ ml: 2, color: "secondary.main" }}
                        onClick={() => {
                            navigate("/Benefits");
                        }}
                    />
                    <Notifications
                        sx={{ ml: 2, color: "secondary.main", cursor: "pointer" }}
                        onClick={handleNotificationsOpen}
                    />
                </Box>
            </Paper>

            <Box
                sx={{
                    px: 0,
                    pt: 0,
                    height: "calc(100vh - 140px - env(safe-area-inset-bottom))",
                    overflow: "auto"
                }}>
                {showResults ? (
                    <Box sx={{ p: 2 }}>
                        {usersLoading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 4
                                }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredUsers.length === 0 ? (
                            <Typography
                                color='text.secondary'
                                align='center'
                                sx={{ py: 4 }}>
                                No users found matching "{searchQuery}"
                            </Typography>
                        ) : (
                            <Card>
                                <CardContent sx={{ p: "0 !important" }}>
                                    <List>
                                        {filteredUsers.map(
                                            (filteredUser, index) => {
                                                // Initialize loading state only once
                                                if (
                                                    filteredUser.PhotoURL &&
                                                    loadingImages[
                                                    filteredUser.id
                                                    ] === undefined
                                                ) {
                                                    setLoadingImages(
                                                        (prev) => ({
                                                            ...prev,
                                                            [filteredUser.id]: true
                                                        })
                                                    );
                                                }

                                                return (
                                                    <React.Fragment
                                                        key={filteredUser.id}>
                                                        <ListItem
                                                            sx={{
                                                                py: 2,
                                                                cursor: "pointer",
                                                                "&:hover": {
                                                                    bgcolor:
                                                                        "action.hover"
                                                                }
                                                            }}
                                                            onClick={() =>
                                                                navigate(
                                                                    `/Profile/${filteredUser.id}`
                                                                )
                                                            }>
                                                            <Box
                                                                sx={{
                                                                    position:
                                                                        "relative",
                                                                    mr: 2
                                                                }}>
                                                                {/* Image loading spinner */}
                                                                {filteredUser.PhotoURL &&
                                                                    loadingImages[
                                                                    filteredUser
                                                                        .id
                                                                    ] &&
                                                                    !imageErrors[
                                                                    filteredUser
                                                                        .id
                                                                    ] && (
                                                                        <Box
                                                                            sx={{
                                                                                position:
                                                                                    "absolute",
                                                                                top: 0,
                                                                                left: 0,
                                                                                right: 0,
                                                                                bottom: 0,
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "center",
                                                                                zIndex: 1
                                                                            }}>
                                                                            <CircularProgress
                                                                                size={
                                                                                    20
                                                                                }
                                                                            />
                                                                        </Box>
                                                                    )}

                                                                <Avatar
                                                                    src={
                                                                        filteredUser.PhotoURL &&
                                                                            !imageErrors[
                                                                            filteredUser
                                                                                .id
                                                                            ]
                                                                            ? filteredUser.PhotoURL
                                                                            : undefined
                                                                    }
                                                                    sx={{
                                                                        bgcolor:
                                                                            filteredUser.PhotoURL &&
                                                                                !imageErrors[
                                                                                filteredUser
                                                                                    .id
                                                                                ]
                                                                                ? "transparent"
                                                                                : "primary.main",
                                                                        opacity:
                                                                            loadingImages[
                                                                                filteredUser
                                                                                    .id
                                                                            ] &&
                                                                                filteredUser.PhotoURL &&
                                                                                !imageErrors[
                                                                                filteredUser
                                                                                    .id
                                                                                ]
                                                                                ? 0
                                                                                : 1,
                                                                        cursor:
                                                                            filteredUser.PhotoURL &&
                                                                                !imageErrors[
                                                                                filteredUser
                                                                                    .id
                                                                                ]
                                                                                ? "pointer"
                                                                                : "default",
                                                                        transition:
                                                                            "opacity 0.3s ease-in-out"
                                                                    }}
                                                                    onClick={(event) => {
                                                                        if (filteredUser.PhotoURL && !imageErrors[filteredUser.id]) {
                                                                            event.stopPropagation();
                                                                            openFullscreenImage(
                                                                                filteredUser.PhotoURL,
                                                                                `${filteredUser.Name || "User"} profile photo`
                                                                            );
                                                                        }
                                                                    }}
                                                                    imgProps={{
                                                                        onLoad: () =>
                                                                            handleImageLoad(
                                                                                filteredUser.id
                                                                            ),
                                                                        onError:
                                                                            () =>
                                                                                handleImageError(
                                                                                    filteredUser.id
                                                                                )
                                                                    }}>
                                                                    {(!filteredUser.PhotoURL ||
                                                                        imageErrors[
                                                                        filteredUser
                                                                            .id
                                                                        ]) && (
                                                                            <Person />
                                                                        )}
                                                                </Avatar>
                                                            </Box>

                                                            <ListItemText
                                                                primary={
                                                                    <Typography
                                                                        variant='h6'
                                                                        sx={{
                                                                            fontWeight:
                                                                                "bold"
                                                                        }}>
                                                                        {filteredUser.Name ||
                                                                            "No Name"}
                                                                    </Typography>
                                                                }
                                                            />
                                                            <Box>
                                                                <Button
                                                                    variant='outlined'
                                                                    sx={{
                                                                        py: 0
                                                                    }}>
                                                                    <Typography
                                                                        variant='button'
                                                                        color='primary'>
                                                                        Follow
                                                                    </Typography>
                                                                </Button>
                                                            </Box>
                                                        </ListItem>

                                                        {index <
                                                            filteredUsers.length -
                                                            1 && (
                                                                <Divider />
                                                            )}
                                                    </React.Fragment>
                                                );
                                            }
                                        )}
                                    </List>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                ) : (
                    // News Feed
                    <Box sx={{ p: 2 }}>
                        <Typography
                            variant='h5'
                            sx={{ fontWeight: "bold", mb: 2 }}>
                            Community News
                        </Typography>
                        {loadingNews ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 4
                                }}>
                                <CircularProgress />
                            </Box>
                        ) : newsItems.length === 0 ? (
                            <Typography
                                color='text.secondary'
                                align='center'
                                sx={{ py: 4 }}>
                                No news posts yet.{" "}
                                {user?.IsAdmin && "Create the first post!"}
                            </Typography>
                        ) : (
                            newsItems.map((item) => {
                                const userPhoto =
                                    users.find((u) => u.id === item.Author.id)
                                        ?.PhotoURL || "";
                                const userName =
                                    users.find((u) => u.id === item.Author.id)
                                        ?.Name || "";
                                const isLiked = item.isLiked || false; // Use item.isLiked instead of item.IsLiked
                                return (
                                    <Card key={item.id} sx={{ mb: 2 }}>
                                        <CardHeader
                                            avatar={
                                                <Avatar
                                                    src={userPhoto || undefined}
                                                    onClick={() =>
                                                        openFullscreenImage(
                                                            userPhoto,
                                                            `${userName || "User"} profile photo`
                                                        )
                                                    }
                                                    sx={{
                                                        bgcolor: "primary.main",
                                                        cursor: userPhoto ? "pointer" : "default",
                                                    }}></Avatar>
                                            }
                                            action={
                                                user?.IsAdmin ? (
                                                    <IconButton
                                                        aria-label='settings'
                                                        onClick={(e) =>
                                                            handleMenuOpen(
                                                                e,
                                                                item.id
                                                            )
                                                        }>
                                                        <MoreVert />
                                                    </IconButton>
                                                ) : null
                                            }
                                            title={
                                                <Typography
                                                    variant='subtitle1'
                                                    fontWeight='bold'>
                                                    {userName}
                                                </Typography>
                                            }
                                        /* subheader={item.CreatedDate} */
                                        />
                                        {item.Image && (
                                            <CardMedia
                                                component='img'
                                                image={item.Image}
                                                alt='News image'
                                                onClick={() =>
                                                    openFullscreenImage(
                                                        item.Image,
                                                        `${userName || "Community"} post image`
                                                    )
                                                }
                                                sx={{ cursor: "pointer" }}
                                            />
                                        )}
                                        <CardContent>
                                            <Typography
                                                variant='body1'
                                                component='div'
                                                sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}
                                                dangerouslySetInnerHTML={
                                                    renderRichText(item.Body)
                                                }
                                            />
                                        </CardContent>
                                        <Divider />
                                        <CardActions disableSpacing>
                                            <IconButton
                                                aria-label='like'
                                                onClick={() =>
                                                    handleLike(item.id, isLiked)
                                                }
                                                color={
                                                    isLiked
                                                        ? "primary"
                                                        : "default"
                                                }>
                                                <FavoriteBorder />
                                            </IconButton>
                                            <Typography
                                                variant='body2'
                                                color='text.secondary'
                                                onClick={() =>
                                                    handleShowLikes(
                                                        item.LikedBy
                                                    )
                                                }
                                                sx={{
                                                    cursor:
                                                        item.Likes > 0
                                                            ? "pointer"
                                                            : "default",
                                                    "&:hover":
                                                        item.Likes > 0
                                                            ? {
                                                                textDecoration:
                                                                    "underline"
                                                            }
                                                            : {}
                                                }}>
                                                {item.Likes}
                                            </Typography>
                                            {/* <IconButton aria-label="comment" sx={{ ml: 2 }}>
                                                <Comment />
                                            </IconButton> */}
                                            {/* <Typography
                                                variant='body2'
                                                color='text.secondary'>
                                                {item.Comments}
                                            </Typography> */}
                                            <IconButton
                                                aria-label='share'
                                                sx={{ ml: "auto" }}>
                                                <Share />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                );
                            })
                        )}
                    </Box>
                )}
            </Box>

            {/* Admin Floating Action Button */}
            {user?.IsAdmin && !showResults && (
                <Fab
                    color='secondary'
                    aria-label='add'
                    sx={{
                        position: "fixed",
                        bottom: 80,
                        right: 16,
                        bgcolor: "primary.main",
                        "&:hover": {
                            bgcolor: "primary.main"
                        }
                    }}
                    onClick={() => setOpenPostDialog(true)}>
                    <Add sx={{ color: "white" }} />
                </Fab>
            )}

            {/* Create Post Dialog */}
            <Dialog
                open={openPostDialog}
                onClose={() => {
                    if (!uploadingPost) {
                        setOpenPostDialog(false);
                        setNewPost({ content: "", image: "" });
                        setSelectedImage(null);
                        setImagePreview(null);
                    }
                }}
                maxWidth='sm'
                fullWidth>
                <DialogTitle>Create News Post</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin='dense'
                        label='Content'
                        fullWidth
                        multiline
                        rows={4}
                        variant='outlined'
                        value={newPost.content}
                        onChange={(e) =>
                            setNewPost({ ...newPost, content: e.target.value })
                        }
                        disabled={uploadingPost}
                        sx={{ mt: 2 }}
                    />

                    <Box sx={{ mt: 2 }}>
                        <input
                            accept='image/*'
                            style={{ display: "none" }}
                            id='post-image-upload'
                            type='file'
                            onChange={handleImageSelect}
                            disabled={uploadingPost}
                        />
                        <label htmlFor='post-image-upload'>
                            <Button
                                variant='outlined'
                                component='span'
                                disabled={uploadingPost}
                                fullWidth>
                                {selectedImage
                                    ? "Change Image"
                                    : "Upload Image (Optional)"}
                            </Button>
                        </label>
                    </Box>

                    {imagePreview && (
                        <Box sx={{ mt: 2, position: "relative" }}>
                            <CardMedia
                                component='img'
                                height='200'
                                image={imagePreview}
                                alt='Preview'
                                sx={{ borderRadius: 1 }}
                            />
                            {!uploadingPost && (
                                <IconButton
                                    sx={{
                                        position: "absolute",
                                        top: 8,
                                        right: 8,
                                        bgcolor: "rgba(0, 0, 0, 0.6)",
                                        "&:hover": {
                                            bgcolor: "rgba(0, 0, 0, 0.8)"
                                        }
                                    }}
                                    onClick={handleRemoveImage}>
                                    <Typography
                                        color='white'
                                        sx={{ fontSize: 20 }}>
                                        ×
                                    </Typography>
                                </IconButton>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setOpenPostDialog(false);
                            setNewPost({ content: "", image: "" });
                            setSelectedImage(null);
                            setImagePreview(null);
                        }}
                        disabled={uploadingPost}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreatePost}
                        variant='contained'
                        sx={{ bgcolor: "primary.main" }}
                        disabled={uploadingPost}>
                        {uploadingPost ? (
                            <CircularProgress size={24} color='inherit' />
                        ) : (
                            <Typography variant='button' color='white'>
                                Post
                            </Typography>
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Likes Dialog */}
            <Dialog
                open={likesDialogOpen}
                onClose={() => setLikesDialogOpen(false)}
                maxWidth='xs'
                fullWidth>
                <DialogTitle>Liked by</DialogTitle>
                <DialogContent>
                    {selectedPostLikes.length === 0 ? (
                        <Typography color='text.secondary' align='center'>
                            No likes yet
                        </Typography>
                    ) : (
                        <List sx={{ pt: 0 }}>
                            {selectedPostLikes.map((likedUser, index) => (
                                <React.Fragment key={likedUser.id}>
                                    <ListItem
                                        sx={{
                                            cursor: "pointer",
                                            "&:hover": {
                                                bgcolor: "action.hover"
                                            }
                                        }}
                                        onClick={() => {
                                            setLikesDialogOpen(false);
                                            navigate(
                                                `/Profile/${likedUser.id}`
                                            );
                                        }}>
                                        <Avatar
                                            src={
                                                likedUser.PhotoURL || undefined
                                            }
                                            sx={{ bgcolor: "primary.main", mr: 2 }}>
                                            {!likedUser.PhotoURL && <Person color="primary" />}
                                        </Avatar>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant='body1'
                                                    fontWeight='bold'>
                                                    {likedUser.Name ||
                                                        "Unknown User"}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    {index < selectedPostLikes.length - 1 && (
                                        <Divider />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLikesDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                maxWidth='sm'
                fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant='h6' fontWeight='bold'>
                        Notifications
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Updates related to your matches, scheduling and community activity.
                    </Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 2, py: 1.5 }}>
                    {notificationsLoading ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 4
                            }}>
                            <CircularProgress />
                        </Box>
                    ) : notificationsItems.length === 0 ? (
                        <Box
                            sx={{
                                py: 6,
                                textAlign: "center",
                                color: "text.secondary"
                            }}>
                            <Typography variant='subtitle1' fontWeight='bold'>
                                No notifications yet
                            </Typography>
                            <Typography variant='body2' sx={{ mt: 1 }}>
                                When something important happens, it will show up here.
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ pt: 0, display: "grid", gap: 1.25 }}>
                            {notificationsItems.map((notification, index) => (
                                <React.Fragment key={notification.id}>
                                    <ListItem
                                        sx={{
                                            alignItems: "stretch",
                                            display: "block",
                                            px: 0,
                                            py: 0,
                                            cursor: notification.Link ? "pointer" : "default",
                                            borderRadius: 3,
                                            border: "1px solid",
                                            borderColor: notification.MarkedAsRead
                                                ? "divider"
                                                : "secondary.light",
                                            background: notification.MarkedAsRead
                                                ? "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,249,251,0.96) 100%)"
                                                : "linear-gradient(180deg, #E3F77E 0%, #E3F77E 50%)",
                                            boxShadow: notification.MarkedAsRead
                                                ? "0 6px 18px rgba(15, 23, 42, 0.06)"
                                                : "0 10px 24px rgba(15, 23, 42, 0.12)",
                                            transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                                            "&:hover": notification.Link
                                                ? {
                                                    transform: "translateY(-1px)",
                                                    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.14)",
                                                    borderColor: "secondary.main"
                                                }
                                                : undefined
                                        }}
                                        onClick={() => handleNotificationClick(notification)}>
                                        <Box sx={{ p: 2 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    gap: 1.5,
                                                    mb: 1.25
                                                }}>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 0.75
                                                        }}>
                                                        {!notification.MarkedAsRead && (
                                                            <Box
                                                                sx={{
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: "50%",
                                                                    backgroundColor: "primary.main",
                                                                    boxShadow: "0 0 0 4px #fff",
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                        )}
                                                        <Typography
                                                            variant='subtitle1'
                                                            fontWeight='bold'
                                                            sx={{ lineHeight: 1.25 }}>
                                                            {notification.Title || "Notification"}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        variant='body2'
                                                        color='text.primary'
                                                        sx={{
                                                            lineHeight: 1.6,
                                                            pr: 1
                                                        }}>
                                                        {notification.Message}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        px: 1.1,
                                                        py: 0.4,
                                                        borderRadius: 999,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        letterSpacing: 0.2,
                                                        whiteSpace: "nowrap",
                                                        ...getNotificationStatusStyles(notification.DeliveryStatus)
                                                    }}>
                                                    {getNotificationStatusLabel(notification.DeliveryStatus)}
                                                </Box>
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 1,
                                                    mt: 1.5
                                                }}>
                                                <Typography
                                                    variant='caption'
                                                    color='text.secondary'
                                                    sx={{ display: "block" }}>
                                                    {notification.relativeDate}
                                                </Typography>
                                                {!notification.MarkedAsRead && (
                                                    <Box
                                                        component='button'
                                                        type='button'
                                                        onClick={(event) =>
                                                            handleMarkNotificationAsRead(
                                                                event,
                                                                notification.id
                                                            )
                                                        }
                                                        sx={{
                                                            border: "1px solid",
                                                            borderColor: "primary.main",
                                                            backgroundColor: "rgba(255,255,255,0.92)",
                                                            color: "primary.main",
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            letterSpacing: 0.2,
                                                            lineHeight: 1,
                                                            px: 1.2,
                                                            py: 0.75,
                                                            borderRadius: 999,
                                                            cursor: "pointer",
                                                            transition: "all 0.18s ease",
                                                            fontFamily: "inherit",
                                                            "&:hover": {
                                                                backgroundColor: "primary.main",
                                                                color: "white"
                                                            }
                                                        }}>
                                                        Mark as read
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </ListItem>
                                    {index < notificationsItems.length - 1 && <Divider sx={{ opacity: 0 }} />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNotificationsOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                open={deleteModalOpen}
                onClose={() => {
                    setSelectedPostId(null);
                    setDeleteModalOpen(false);
                }}
                onConfirm={confirmDeletePost}
                _title='Delete Post'
                _description='Are you sure you want to delete this post? This action cannot be undone.'
                _confirmText='Delete'
                _cancelText='Cancel'
            />

            {/* Post Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}>
                <MenuItem onClick={handleDeletePost}>
                    <Delete sx={{ mr: 1 }} />
                    Delete Post
                </MenuItem>
            </Menu>

            <FullscreenImageDialog
                open={Boolean(fullscreenImage)}
                imageSrc={fullscreenImage?.src}
                alt={fullscreenImage?.alt}
                onClose={() => setFullscreenImage(null)}
            />

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Community;
