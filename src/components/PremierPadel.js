import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Chip, Avatar } from "@mui/material";
import { useNavigate } from "react-router";

const TournamentCard = ({
  title,
  startMonth,
  durationMonths,
  onClick,
  mainSponsor,
  logoSponsor,
  colorSponsor
}) => {
  const months = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  for (let i = 0; i < durationMonths; i++) {
    const m = (startMonth + i) % 12;
    months.push(monthNames[m]);
  }

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: `2px dashed ${colorSponsor || "grey"}`,
        borderRadius: 2,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
      }}
      elevation={0}
      onClick={onClick}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Avatar
          src={logoSponsor || ""}
          alt={`${mainSponsor || "Main sponsor"} logo`}
          sx={{ bgcolor: "transparent", width: 48, height: 48, fontSize: 18 }}
        >
          {mainSponsor ? mainSponsor.charAt(0).toUpperCase() : "M"}
        </Avatar>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: "bold", width: "calc(100% - 110px)", color: colorSponsor || "text.primary" }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", width: "calc(100% - 110px)" }}>
        {months.map((m) => (
          <Chip key={m} label={m} size="small" />
        ))}
      </Box>
    </Paper>
  );
};

const PremierPadel = ({ events }) => {
  const navigate = useNavigate();

  const [premierPadelEvents, setPremierPadelEvents] = useState([]);

  useEffect(() => {
    const filteredEvents = events.filter(event => event.TypeOfTournament === "Premier");
    console.log(filteredEvents);
    
    setPremierPadelEvents(filteredEvents);
  }, [events]);

  // Two tournaments per year: Spring Cup and Autumn Cup
  const handleOpenCup = (cup) => {
    navigate("/EventCup", { state: { cup } });
  };

  return (
    <Box sx={{ p: 2 }}>
      {premierPadelEvents.map((event) => (
        <TournamentCard
          key={event.id}
          title={event.Name}
          startMonth={event.StartMonth}
          durationMonths={event.EndMonth - event.StartMonth}
          mainSponsor={event.MainSponsor}
          logoSponsor={event.LogoSponsor}
          colorSponsor={event.SponsorColor}
          onClick={() =>
            handleOpenCup(
              event
            )
          }
        />
      ))}
    </Box>
  );
};

export default PremierPadel;
