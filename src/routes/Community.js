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

    // Post menu
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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

    return (
        <>
            <Paper
                sx={{
                    bgcolor: "#b88f34",
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
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder='Search…'
                            inputProps={{ "aria-label": "search" }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Search>
                    <LocalOffer
                        sx={{ ml: 2 }}
                        onClick={() => {
                            navigate("/Benefits");
                        }}
                    />
                    <Notifications sx={{ ml: 2 }} />
                </Box>
            </Paper>

            <Box
                sx={{
                    px: 0,
                    pt: 0,
                    height: "Calc(100vh - 140px)",
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
                                                                        transition:
                                                                            "opacity 0.3s ease-in-out"
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
                                                    sx={{
                                                        bgcolor: "#b88f34"
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
                                                height='200'
                                                image={item.Image}
                                                alt='News image'
                                            />
                                        )}
                                        <CardContent>
                                            <Typography
                                                variant='body1'
                                                sx={{ whiteSpace: "pre-line" }}>
                                                {item.Body}
                                            </Typography>
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
                    color='primary'
                    aria-label='add'
                    sx={{
                        position: "fixed",
                        bottom: 80,
                        right: 16,
                        bgcolor: "#b88f34",
                        "&:hover": {
                            bgcolor: "#9a7628"
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
                        sx={{ bgcolor: "#b88f34" }}
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
                                            sx={{ bgcolor: "#b88f34", mr: 2 }}>
                                            {!likedUser.PhotoURL && <Person />}
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
