import { Box, Typography, IconButton, Avatar, Stack } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const GOLD = "#9a7d2e";
const GOLD_LIGHT = "#c9a84c";
const GOLD_DARK = "#7a6020";

const Header = ({ match, onBack }) => {
  const { teamA, teamB } = match?.teams || {};

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${GOLD_DARK} 0%, ${GOLD} 60%, ${GOLD_LIGHT} 100%)`,
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
        {/* <TeamBlock team={teamA} /> */}
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
        {/* <TeamBlock team={teamB} /> */}
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
