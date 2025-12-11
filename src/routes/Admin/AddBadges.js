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

const AddBadges = ({ open, onClose, playerIds }) => {
    const db = getFirestore();
    const remoteConfig = getRemoteConfig();
    const { user } = useAuth();
    const dispatch = useDispatch();

    const badges = useSelector(selectBadges);
    const ForceRefresh = getNumber(remoteConfig, "ForceRefresh");

    const initialFetchDone = useRef(false);
    const [badgesByCategory, setBadgesByCategory] = useState({});


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

    return (
        <Dialog
            fullWidth={true}
            maxWidth="xl"
            onClose={() => onClose()}
            open={open}
            slots={{
                transition: Transition,
            }}
            keepMounted
        >
            <DialogTitle>
                Select Badges to Add
            </DialogTitle>
            <DialogContent>
                <Box sx={{ maxHeight: '75%', overflowY: 'auto' }}>
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
                                                    size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
                                                    key={badge.id}
                                                    sx={{ display: "flex" }}
                                                >
                                                    <Card
                                                        sx={{
                                                            height: 180,
                                                            width: "100%",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            p: 2,
                                                            opacity: 1,
                                                            border: `2px solid ${colorsByCategory[badge.Category]}`,
                                                            transition: "all 0.3s ease",
                                                            "&:hover": {
                                                                transform: "scale(1.05)",
                                                                boxShadow: 4,
                                                            },
                                                        }}
                                                    >
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
                        onClose();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    autoFocus
                    onClick={() => {
                        onClose();
                    }}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddBadges;
