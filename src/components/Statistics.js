import {
    Typography,
    Card,
    Box,
    Grid,
    Paper,
} from "@mui/material";
import {
    SportsScore,
    EmojiEvents,
} from "@mui/icons-material";

const Statistics = ({ matchesPlayed = 0, tournamentsPlayed = 0 }) => {
    const stats = [
        {
            label: "Matches Played",
            value: matchesPlayed,
            icon: <SportsScore sx={{ fontSize: 40, color: "#1976d2" }} />,
            color: "#1976d2",
        },
        {
            label: "Tournaments Played",
            value: tournamentsPlayed,
            icon: <EmojiEvents sx={{ fontSize: 40, color: "#ed6c02" }} />,
            color: "#ed6c02",
        },
    ];

    return (
        <>
            <Typography
                variant='h5'
                component='h2'
                gutterBottom
                sx={{ fontWeight: "bold" }}>
                Your Statistics
            </Typography>
            <Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
                {stats.map((stat, index) => (
                    <Grid
                        key={index}
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
                                borderColor: stat.color
                            }}>
                            <Box sx={{ mb: 1 }}>
                                {stat.icon}
                            </Box>
                            <Typography
                                variant='h4'
                                component='div'
                                sx={{ fontWeight: "bold", mb: 1 }}>
                                {stat.value}
                            </Typography>
                            <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ fontWeight: 500 }}>
                                {stat.label}
                            </Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

export default Statistics;
