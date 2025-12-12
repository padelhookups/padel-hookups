import { useEffect, useState, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getRemoteConfig, getBoolean, getNumber } from "firebase/remote-config";

import { getAuth } from "firebase/auth";
import firebase from "../firebase-config";
import useAuth from "../utils/useAuth";
import {
  Box,
  Typography,
  Card,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  SwipeableDrawer,
  TextField,
  FormControl,
  InputAdornment,
  Paper,
  IconButton,
  CircularProgress,
  InputLabel,
  Select,
  MenuItem,
  Tab,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import dayjs from "dayjs";
import PullToRefresh from 'react-simple-pull-to-refresh';
import {
  Person,
  VerifiedUser,
  Cake,
  PhotoCamera,
  WavingHand,
  ShowChart,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import SuccessModal from "../components/SuccessModal";
import ConfirmEditModal from "../components/ConfirmEditModal";
import Badges from "../components/Badges";
import PhotoEditor from "../components/PhotoEditor";
import ProfileDetails from "../components/ProfileDetails";
import Statistics from "../components/Statistics";

import { useNavigate } from "react-router";

const iOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

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

const Profile = () => {
  const db = firebase.db;
  const storage = firebase.storage;
  const auth = getAuth();
  const remoteConfig = getRemoteConfig();
  const currentUser = auth.currentUser;
  const { user, refreshUser } = useAuth(); // Add refreshUser

  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [bestHand, setBestHand] = useState("");
  const [playerLevel, setPlayerLevel] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState("0");
  const fileInputRef = useRef(null);
  const imageTimeoutRef = useRef(null);

  const ShowBadges = getBoolean(remoteConfig, "ShowBadges");
  const ForceRefresh = getNumber(remoteConfig, "ForceRefresh");

  const handleUpdateProfile = () => {
    setEditModalOpen(true);
  };

  useEffect(() => {
    if (user) {
      console.log("User data:", user);
      setDisplayName(user?.displayName || "");
      setPhotoPreview(user?.PhotoURL || null);
      setBestHand(user?.BestHand || "");
      setPlayerLevel(user?.PlayerLevel || "");

      // Reset image states when user changes
      if (user?.PhotoURL) {
        setImageLoading(true);
        setImageError(false);
        
        // Set timeout fallback
        if (imageTimeoutRef.current) {
          clearTimeout(imageTimeoutRef.current);
        }
        imageTimeoutRef.current = setTimeout(() => {
          setImageLoading(false);
          setImageError(true);
        }, 5000); // 5 second timeout
      } else {
        setImageLoading(false);
      }

      let dob = null;
      const rawDob = user.DateOfBirth;

      if (rawDob) {
        try {
          // If it's a Firestore Timestamp
          if (typeof rawDob.toDate === "function") {
            dob = dayjs(rawDob.toDate());
          }
          // If it's a Firestore Timestamp-like object
          else if (rawDob.seconds) {
            dob = dayjs(new Date(rawDob.seconds * 1000));
          }
          // If it's a string (ISO or MM/DD/YYYY)
          else if (typeof rawDob === "string") {
            dob = dayjs(rawDob);
          }
        } catch (err) {
          console.error("Invalid DateOfBirth:", err);
        }
      }

      setDateOfBirth(dob);
    }

    // Cleanup timeout on unmount
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
    };
  }, [user]);

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit for original
        alert("File size must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalPhoto(reader.result);
        setShowPhotoEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoEditorSave = (croppedBlob) => {
    // Convert blob to file
    const file = new File([croppedBlob], "profile-photo.jpg", {
      type: "image/jpeg",
    });
    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(croppedBlob);

    setShowPhotoEditor(false);
  };

  const handlePhotoEditorClose = () => {
    setShowPhotoEditor(false);
    setOriginalPhoto(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return user?.PhotoURL;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}.jpg`);
      await uploadBytes(storageRef, photoFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpdate = async () => {
    try {
      setUploading(true);

      // Upload photo if a new one was selected
      const photoURL = await uploadPhoto();

      // Update Firebase Auth profile
      const updateData = { displayName };
      if (photoURL) {
        updateData.photoURL = photoURL;
      }
      await updateProfile(currentUser, updateData);

      // Update Firestore
      const userRef = doc(db, "Users", user.uid);
      const firestoreUpdate = {
        Name: displayName,
        DateOfBirth: dateOfBirth
          ? Timestamp.fromDate(dateOfBirth.toDate())
          : null,
        BirthdayMonth: dateOfBirth ? dateOfBirth.month() + 1 : null,
        BirthdayDay: dateOfBirth ? dateOfBirth.date() : null,
        BestHand: bestHand || null,
        PlayerLevel: playerLevel || null,
        LastModifiedAt: Timestamp.now(),
      };
      if (photoURL) {
        firestoreUpdate.PhotoURL = photoURL;
      }
      await updateDoc(userRef, firestoreUpdate);

      // Refresh the user data
      await refreshUser();

      console.log("Profile updated successfully");
      setOpen(false);
      setEditModalOpen(false);
      setPhotoFile(null);
      setImageLoading(false);
      setImageError(false);
      setShowSuccess(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((word) => word.charAt(0))
        .join("");
    }
    return "??";
  };

  const onRefresh = async () => {
    console.log("Pull to refresh triggered");
    await refreshUser();
  };

  return (
    <>
      <PullToRefresh onRefresh={onRefresh}>
        <Paper
          sx={{
            borderRadius: 0,
            bgcolor: "white",
            color: "b88f34",
            textAlign: "center",
            pt: "env(safe-area-inset-top, 0px)",
          }}
        >
          {/* height less padding */}
          <Box
            sx={{
              py: 3,
              px: 2,
              position: "relative",
              height: "Calc(200px - 48px)",
            }}
          >
            <Box
              sx={{
                position: "relative",
                display: "inline-block",
                height: "70%",
              }}
              imgProps={{
                onLoad: () => {
                  if (imageTimeoutRef.current) {
                    clearTimeout(imageTimeoutRef.current);
                  }
                  setImageLoading(false);
                },
                onError: () => {
                  if (imageTimeoutRef.current) {
                    clearTimeout(imageTimeoutRef.current);
                  }
                  setImageLoading(false);
                  setImageError(true);
                }
              }}>
              {!user?.PhotoURL || imageError ? getInitials() : null}
            </Avatar>
          </Box>
        </Paper>
        <TabContext value={activeTab}>
          <TabList
            onChange={(event, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Details" value="0" />
            <Tab label="Statistics" value="1" />
            {(ShowBadges || user?.IsAdmin) && <Tab label="Badges" value="2" />}
          </TabList>
          <Box
            sx={{
              p: 3,
              height: "Calc(100vh - 350px)",
              overflow: "auto",
            }}
          >
            <TabPanel value="0">
              <ProfileDetails
                user={user}
                dateOfBirth={dateOfBirth}
                onEditClick={() => setOpen(true)}
              />
            </TabPanel>
            <TabPanel value="1">
              <Statistics user={user} />
            </TabPanel>
            <TabPanel value="2">
              <Badges earnedBadges={user?.Badges} ForceRefresh={ForceRefresh} />
            </TabPanel>
          </Box>
        </TabContext>
      </PullToRefresh>
      <SwipeableDrawer
        sx={{ zIndex: 1300 }}
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        disableDiscovery
        disableSwipeToOpen={true}
        disableBackdropTransition={!iOS}
        keepMounted
      >
        <Puller />
        <StyledBox
          sx={{ px: 2, pb: 2, height: "100%", overflow: "auto" }}>
          <Box
            component="form"
            sx={{
              "& > :not(style)": { mt: 4 },
              pt: 4,
              pb: 2,
              px: 2,
            }}
            onSubmit={(e) => {
              // Let browser handle HTML5 validation first
              if (!e.target.checkValidity()) {
                return; // Let browser show validation messages
              }
              e.preventDefault();
              handleUpdateProfile();
            }}
          >
            {/* Photo Upload Section */}
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
              />
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={photoPreview || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: "auto",
                    fontSize: "2.5rem",
                    bgcolor: "primary.main",
                    border: "3px solid",
                    borderColor: "primary.main",
                  }}
                >
                  {!photoPreview && getInitials()}
                </Avatar>
                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoCamera />
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                Click camera icon to upload and adjust photo
              </Typography>
            </Box>

            <Box sx={{ width: "100%" }}>
              <FormControl
                sx={{
                  width: "100%",
                  "&:focus-within": {
                    borderColor: "primary.main",
                    borderWidth: "2px",
                  },
                }}
              >
                <TextField
                  fullWidth
                  id="displayName"
                  type="text"
                  required
                  autoComplete="off"
                  value={displayName}
                  label="Display Name"
                  onChange={(e) => setDisplayName(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person
                            sx={{
                              ".Mui-focused &": {
                                color: "primary.main",
                              },
                              mr: 1,
                              my: 0.5,
                              cursor: "pointer",
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box
                            sx={{
                              width: 30,
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </FormControl>
            </Box>
            <Box sx={{ width: "100%" }}>
              <DatePicker
                label="Date of Birth"
                value={dateOfBirth}
                onChange={(newValue) => setDateOfBirth(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Cake
                            sx={{
                              ".Mui-focused &": {
                                color: "primary.main",
                              },
                              mr: 1,
                              my: 0.5,
                              cursor: "pointer",
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ width: "100%" }}>
              <FormControl fullWidth>
                <InputLabel>Best Hand</InputLabel>
                <Select
                  value={bestHand}
                  label="Best Hand"
                  onChange={(e) => setBestHand(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <WavingHand
                        sx={{
                          ".Mui-focused &": {
                            color: "primary.main",
                          },
                          mr: 1,
                          my: 0.5,
                          cursor: "pointer",
                        }}
                      />
                    </InputAdornment>
                  }
                  sx={{ width: "100%" }}
                >
                  <MenuItem value="Right">Right</MenuItem>
                  <MenuItem value="Left">Left</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: "100%" }}>
              <FormControl fullWidth>
                <InputLabel>Player Level</InputLabel>
                <Select
                  value={playerLevel}
                  label="Player Level"
                  onChange={(e) => setPlayerLevel(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <ShowChart
                        sx={{
                          ".Mui-focused &": {
                            color: "primary.main",
                          },
                          mr: 1,
                          my: 0.5,
                          cursor: "pointer",
                        }}
                      />
                    </InputAdornment>
                  }
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={6}>6</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={!displayName || uploading}
            >
              {uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                  <Typography variant="button" color="white">
                    Uploading...
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="button"
                  color="white"
                  sx={{ fontWeight: "bold" }}
                >
                  Update Profile
                </Typography>
              )}
            </Button>
          </Box>
        </StyledBox>
      </SwipeableDrawer>

      {/* Photo Editor Modal */}
      <PhotoEditor
        open={showPhotoEditor}
        imageSrc={originalPhoto}
        onClose={handlePhotoEditorClose}
        onSave={handlePhotoEditorSave}
      />

      <SuccessModal
        open={showSuccess}
        _title="Profile Updated!"
        onClose={() => setShowSuccess(false)}
        _description="Your profile has been updated successfully."
        _buttonText="Continue"
        _navigate={false}
      />

      <ConfirmEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        _title="Update Profile"
        _description={`Are you sure you want to save the changes to your profile?`}
        _confirmText="Save Changes"
        _cancelText="Cancel"
      />
    </>
  );
};

export default Profile;
