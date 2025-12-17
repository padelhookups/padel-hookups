import {
    Typography,
    Card,
    Box,
    Grid,
    Divider
} from "@mui/material";
import {
    SportsScore,
    EmojiEvents,
} from "@mui/icons-material";

const Statistics = ({user}) => {
    return (
        <>
            <Typography
                variant='h5'
                component='h2'
                gutterBottom
                sx={{ fontWeight: "bold" }}>
                Tour
            </Typography>
            <Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
                <Grid
                    item
                    size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
                    sx={{ display: "flex" }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            height: 180,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderTop: 3,
                            borderColor: "#1976d2"
                        }}>
                        <Box sx={{ mb: 1 }}>
                            <SportsScore sx={{ fontSize: 40, color: "#1976d2" }} />
                        </Box>
                        <Typography
                            variant='h4'
                            component='div'
                            sx={{ fontWeight: "bold", mb: 1 }}>
                            {user?.TourEventsPlayed || 0}
                        </Typography>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontWeight: 500 }}>
                            Events Played
                        </Typography>
                    </Card>
                </Grid>
                <Grid
                    item
                    size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
                    sx={{ display: "flex" }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            height: 180,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderTop: 3,
                            borderColor: "#ed6c02"
                        }}>
                        <Box sx={{ mb: 1 }}>
                            <EmojiEvents sx={{ fontSize: 40, color: "#ed6c02" }} />
                        </Box>
                        <Typography
                            variant='h4'
                            component='div'
                            sx={{ fontWeight: "bold", mb: 1 }}>
                            {user?.TourEventsWon || 0}
                        </Typography>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontWeight: 500 }}>
                            Events Won
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
            <Divider sx={{ mt: 4, mb: 3 }} />
            <Typography
                variant='h5'
                component='h2'
                gutterBottom
                sx={{ fontWeight: "bold" }}>
                Mixs
            </Typography>
            <Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
                <Grid
                    item
                    size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
                    sx={{ display: "flex" }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            height: 180,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderTop: 3,
                            borderColor: "#1976d2"
                        }}>
                        <Box sx={{ mb: 1 }}>
                            <SportsScore sx={{ fontSize: 40, color: "#1976d2" }} />
                        </Box>
                        <Typography
                            variant='h4'
                            component='div'
                            sx={{ fontWeight: "bold", mb: 1 }}>
                            {user?.MixsPlayed || 0}
                        </Typography>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontWeight: 500 }}>
                            Mixs Played
                        </Typography>
                    </Card>
                </Grid>
                <Grid
                    item
                    size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
                    sx={{ display: "flex" }}
                >
                    <Card
                        elevation={2}
                        sx={{
                            height: 180,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderTop: 3,
                            borderColor: "#ed6c02"
                        }}>
                        <Box sx={{ mb: 1 }}>
                            <EmojiEvents sx={{ fontSize: 40, color: "#ed6c02" }} />
                        </Box>
                        <Typography
                            variant='h4'
                            component='div'
                            sx={{ fontWeight: "bold", mb: 1 }}>
                            {user?.MixsWon || 0}
                        </Typography>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ fontWeight: 500 }}>
                            Mixs Won
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

export default Statistics;
