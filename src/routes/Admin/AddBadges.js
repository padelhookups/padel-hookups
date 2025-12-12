import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchBadges,
    selectBadges,
    selectBadgesLoading,
} from "../../redux/slices/badgesSlice";
import { colorsByCategory, BadgeIcon } from "../../components/Badges";
import useAuth from "../../utils/useAuth";

import { getRemoteConfig, getNumber } from "firebase/remote-config";
import { getFirestore } from "firebase/firestore";

import {
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Slide,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const AddBadges = ({ open, onClose, selectedUser }) => {
    const db = getFirestore();
    const remoteConfig = getRemoteConfig();
    const { user } = useAuth();
    const dispatch = useDispatch();

    const badges = useSelector(selectBadges);
    const ForceRefresh = getNumber(remoteConfig, "ForceRefresh");

    const initialFetchDone = useRef(false);
    const [badgesByCategory, setBadgesByCategory] = useState({});
    const [selectedBadges, setSelectedBadges] = useState([]);
    const [existingBadges, setExistingBadges] = useState([]);


    useEffect(() => {
        // Initialize with user's existing badges
        if (selectedUser && selectedUser.Badges) {
            const existingBadgeIds = selectedUser.Badges.map(badgeRef => badgeRef.id);
            setExistingBadges(existingBadgeIds);
            setSelectedBadges(existingBadgeIds);
        } else {
            setExistingBadges([]);
            setSelectedBadges([]);
        }
    }, [selectedUser]);

    useEffect(() => {
        console.log(initialFetchDone.current);

        // Only fetch if we haven't done initial fetch and don't have benefits
        if (!initialFetchDone.current) {
            console.log("Fetch badges using Redux with caching");
            initialFetchDone.current = true;
            if (ForceRefresh > Number(localStorage.getItem("ForceRefresh"))) {
                dispatch(fetchBadges({ db, forceRefresh: true }));
            } else {
                dispatch(fetchBadges({ db, forceRefresh: false }));
            }
            localStorage.setItem("ForceRefresh", ForceRefresh);
        }
    }, [dispatch, db, badges.length]);

    useEffect(() => {
        console.log("badges", badges);
        // group by category
        const grouped = badges.reduce((acc, badge) => {
            const category = badge.Category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(badge);
            return acc;
        }, {});
        console.log("grouped badges", grouped);

        setBadgesByCategory(grouped);
    }, [badges]);

    const handleBadgeClick = (badgeId) => {
        setSelectedBadges((prev) => {
            if (prev.includes(badgeId)) {
                return prev.filter(id => id !== badgeId);
            } else {
                return [...prev, badgeId];
            }
        });
    };

    return (
        <Dialog
            fullWidth={true}
            maxWidth="xl"
            onClose={() => {
                setSelectedBadges([]);
                setExistingBadges([]);
                onClose();
            }}
            open={open}
            slots={{
                transition: Transition,
            }}
            keepMounted
        >
            <DialogTitle sx={{ textAlign: 'center' }}>
                {selectedUser ? `Select Badges for ${selectedUser.Name}` : "Select Badges to Add"}
            </DialogTitle>
            <DialogContent sx={{ px: 0 }}>
                <Box sx={{ maxHeight: '75%', overflowY: 'auto', px: 3 }}>
                    {badgesByCategory &&
                        Object.keys(badgesByCategory).map((category) => {
                            return (
                                <Box key={category} sx={{ width: "100%", mb: 3 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{ display: "flex", fontWeight: "bold", mb: 1 }}
                                    >
                                        {category}
                                    </Typography>
                                    <Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
                                        {badgesByCategory[category].map((badge) => {
                                            return (
                                                <Grid
                                                    item
                                                    size={{ xs: 2, sm: 3, md: 2, xl: 2 }}
                                                    key={badge.id}
                                                    sx={{ display: "flex" }}
                                                >
                                                    <Card
                                                        onClick={() => handleBadgeClick(badge.id)}
                                                        sx={{
                                                            height: 180,
                                                            width: "100%",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            p: 2,
                                                            opacity: selectedBadges.includes(badge.id) ? 1 : 0.5,
                                                            border: selectedBadges.includes(badge.id)
                                                                ? `3px solid ${colorsByCategory[badge.Category]}`
                                                                : `2px solid ${colorsByCategory[badge.Category]}`,
                                                            transition: "all 0.3s ease",
                                                            cursor: "pointer",
                                                            backgroundColor: selectedBadges.includes(badge.id)
                                                                ? `${colorsByCategory[badge.Category]}15`
                                                                : "inherit",
                                                            position: "relative",
                                                            "&:hover": {
                                                                transform: "scale(1.05)",
                                                                boxShadow: 4,
                                                            },
                                                        }}
                                                    >
                                                        {existingBadges.includes(badge.id) && (
                                                            <Chip
                                                                label="Current"
                                                                size="small"
                                                                sx={{
                                                                    position: "absolute",
                                                                    top: 8,
                                                                    right: 8,
                                                                    backgroundColor: colorsByCategory[badge.Category],
                                                                    color: "white",
                                                                    fontWeight: "bold",
                                                                    fontSize: "0.65rem",
                                                                }}
                                                            />
                                                        )}
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                alignItems: "center",
                                                                flex: 1,
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <BadgeIcon badge={badge} isEarned={true} />
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{
                                                                    fontWeight: "bold",
                                                                    textAlign: "center",
                                                                    mb: 0.5,
                                                                    lineHeight: 1.2,
                                                                }}
                                                            >
                                                                {badge.Name}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{
                                                                    textAlign: "center",
                                                                    fontSize: "0.7rem",
                                                                    lineHeight: 1.3,
                                                                }}
                                                            >
                                                                {badge.Description}
                                                            </Typography>
                                                        </Box>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            );
                        })}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    autoFocus
                    onClick={() => {
                        setSelectedBadges([]);
                        setExistingBadges([]);
                        onClose();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    autoFocus
                    variant="contained"
                    disabled={JSON.stringify(selectedBadges.sort()) === JSON.stringify(existingBadges.sort())}
                    onClick={() => {
                        // Calculate badges to add and remove
                        const badgesToAdd = selectedBadges.filter(id => !existingBadges.includes(id));
                        const badgesToRemove = existingBadges.filter(id => !selectedBadges.includes(id));
                        onClose(badgesToAdd, badgesToRemove);
                        setSelectedBadges([]);
                        setExistingBadges([]);
                    }}
                >
                    <Typography variant="button" sx={{color: '#fff'}}>
                        Save Changes
                        {(() => {
                            const toAdd = selectedBadges.filter(id => !existingBadges.includes(id)).length;
                            const toRemove = existingBadges.filter(id => !selectedBadges.includes(id)).length;
                            if (toAdd > 0 || toRemove > 0) {
                                const parts = [];
                                if (toAdd > 0) parts.push(`+${toAdd}`);
                                if (toRemove > 0) parts.push(`-${toRemove}`);
                                return ` (${parts.join(', ')})`;
                            }
                            return '';
                        })()}
                    </Typography>
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddBadges;
