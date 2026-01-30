import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { useNavigate } from "react-router";

const TournamentCard = ({ title, startMonth, durationMonths, color, onClick }) => {
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
      sx={{ p: 2, mb: 2, borderLeft: `6px solid ${color}`, cursor: onClick ? 'pointer' : 'default' }}
      elevation={2}
      onClick={onClick}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
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
          //color="#388e3c"
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
