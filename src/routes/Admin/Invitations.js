import React, { useEffect, useState, useCallback } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from "firebase/firestore";
import firebase from "../../firebase-config";
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Divider,
    TextField,
    InputAdornment,
    Chip,
    Alert,
    IconButton,
    Tooltip
} from "@mui/material";
import { Person, Search, Refresh } from "@mui/icons-material";

const Invitations = () => {
    const db = firebase.db;

    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchInvites = useCallback(async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, "Invites"),
                where("Status", "==", "Pending")
            );
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }));
            setInvites(list);
        } catch (e) {
            console.error("Error fetching invites:", e);
        } finally {
            setLoading(false);
        }
    }, [db]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const filtered = invites.filter((inv) => {
        const q = searchQuery.toLowerCase();
        return (
            (inv.Name && inv.Name.toLowerCase().includes(q)) ||
            (inv.Email && inv.Email.toLowerCase().includes(q))
        );
    });

    return (
        <Box sx={{ p: 2, pb: 10 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2
                }}>
                <Typography variant='h5' sx={{ fontWeight: "bold" }}>
                    Pending Invitations
                </Typography>
            </Box>
            
            <TextField
                fullWidth
                placeholder='Search invitations by name or email'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant='outlined'
                size='small'
                InputProps={{
                    startAdornment: (
                        <InputAdornment position='start'>
                            <Search />
                        </InputAdornment>
                    )
                }}
                sx={{ mb: 3 }}
            />

            {loading && <Typography>Loading pending invitations...</Typography>}

            {!loading && invites.length === 0 && (
                <Alert severity='info' color='primary'>
                    No pending invitations.
                </Alert>
            )}

            {!loading && invites.length > 0 && filtered.length === 0 && (
                <Alert severity='warning' color='primary'>
                    No invitations match your search.
                </Alert>
            )}

            {filtered.length > 0 && (
                <Card>
                    <CardContent sx={{ p: "0 !important" }}>
                        <List>
                            {filtered.map((inv, idx) => {
                                const createdAt =
                                    inv.CreatedAt &&
                                    typeof inv.CreatedAt.toDate === "function"
                                        ? inv.CreatedAt.toDate()
                                        : null;
                                return (
                                    <React.Fragment key={inv.id}>
                                        <ListItem sx={{ py: 2 }}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "primary.main",
                                                    mr: 2
                                                }}>
                                                <Person />
                                            </Avatar>
                                            <ListItemText
                                                primary={
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            flexWrap: "wrap"
                                                        }}>
                                                        <Typography
                                                            variant='subtitle1'
                                                            sx={{
                                                                fontWeight:
                                                                    "bold",
                                                                mr: 1
                                                            }}>
                                                            {inv.Name ||
                                                                "Unnamed"}
                                                        </Typography>
                                                        <Chip
                                                            label='Pending'
                                                            size='small'
                                                            color='warning'
                                                            variant='outlined'
                                                            sx={{ height: 20 }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant='body2'
                                                        color='text.secondary'>
                                                        {inv.Email}{" "}
                                                        {createdAt && (
                                                            <>
                                                                • Invited{" "}
                                                                {createdAt.toLocaleDateString()}
                                                            </>
                                                        )}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                        {idx < filtered.length - 1 && (
                                            <Divider />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default Invitations;