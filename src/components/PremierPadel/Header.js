import { useEffect, useState } from "react";
import { Box, Typography, IconButton, Avatar, Stack } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import TeamBlock from './TeamBlock';

const Header = ({ match, event, onBack, mainColor }) => {

  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  
  useEffect(() => {
    console.log('Header match', match);
    console.log('Header event', event);
    if (match && event) {
      const teamAPlayers = event.Pairs[match.opponent1.id - 1].DisplayName;
      const teamBPlayers = event.Pairs[match.opponent2.id - 1].DisplayName;
      console.log('Team A players:', teamAPlayers);
      console.log('Team B players:', teamBPlayers);
      setTeamA(teamAPlayers);
      setTeamB(teamBPlayers);
    }
  }, [match, event]);

  return (
    <Box
      sx={{
        backgroundImage: `linear-gradient(
          color-mix(in srgb, ${ mainColor }, white 20%),
          ${ mainColor },
          color-mix(in srgb, ${ mainColor }, black 20%)
        )`,
        //background: `linear-gradient(135deg, ${GOLD_DARK} 0%, ${GOLD} 60%, ${GOLD_LIGHT} 100%)`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
        },
      }}
    >
      {/* Top bar */}
      <Stack direction="row" alignItems="center" gap={1.5} px={2} pt={1.75}>
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            bgcolor: "rgba(255,255,255,0.15)",
            color: "white",
            "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: 1,
            textTransform: "uppercase",
            fontFamily: "Barlow Condensed, sans-serif",
          }}
        >
          {match?.tournament} · {match?.round}
        </Typography>
      </Stack>

      {/* VS hero */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        gap={1.5}
        px={2}
        py={2.5}
      >
        {teamA && <TeamBlock team={{ name: teamA }} />}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.3)",
            bgcolor: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            VS
          </Typography>
        </Box>
        {teamB && <TeamBlock team={{ name: teamB }} />}
      </Stack>

      {/* Status bar */}
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.15)",
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "#f0c040",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%,100%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.5, transform: "scale(0.8)" },
            },
          }}
        />
        <Typography
          sx={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 500 }}
        >
          Awaiting schedule – not yet played
        </Typography>
      </Box>
    </Box>
  );
};

export default Header;
