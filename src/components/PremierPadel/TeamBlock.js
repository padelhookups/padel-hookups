import { Avatar, Box, Typography } from "@mui/material";

const TeamBlock = ({ team }) => {
    return (
        <Box flex={1} textAlign="center">
            <Avatar sx={{
                width: 48, height: 48, mx: 'auto', mb: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 14, color: 'white',
            }}>
                {team.name.split(' ')[0][0]}{team.name.includes('&') ? '&' : ''}{team.name.split('&')[1]?.[1] || ''}
            </Avatar>
            <Typography sx={{ color: 'white', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>                
                <span style={{ display: "block" }}>
                    {team.name.split("&")[0]}
                </span>
                <span>{team.name.split("&")[1]}</span>
            </Typography>
        </Box>
    );
}

export default TeamBlock;