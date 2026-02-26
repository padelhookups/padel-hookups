import { Box, Typography, Stack, Avatar, Divider, Paper } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const BG = "#f5f4f0";
const BORDER = "#e0dbd0";

const Details = ({
  match,
  event,
  summaryDate,
  summaryTime,
  summaryLocation,
  mainColor,
}) => {
  const { teamA, teamB } = match?.teams || {};
  

  return (
    <Stack gap={1.5} p={2}>
      {/* Match Info */}
      <InfoCard title="📋 Match Info" mainColor={mainColor}>
        <InfoRow
          icon={<EmojiEventsIcon sx={{ fontSize: 18, color: mainColor }} />}
          label="Tournament"
          value={event?.Name}
        />
        <InfoRow
          icon={<BoltIcon sx={{ fontSize: 18, color: mainColor }} />}
          label="Round"
          value={match?.metadata.label}
        />
        <InfoRow
          icon={<CalendarTodayIcon sx={{ fontSize: 18, color: mainColor }} />}
          label="Date"
          value={summaryDate || "TBD – pending schedule"}
        />
        <InfoRow
          icon={<AccessTimeIcon sx={{ fontSize: 18, color: mainColor }} />}
          label="Time"
          value={summaryTime || "TBD"}
          last
        />
        <InfoRow
          icon={<LocationOnIcon sx={{ fontSize: 18, color: mainColor }} />}
          label="Location"
          value={summaryLocation || "TBD – set by players"}
          last
        />
      </InfoCard>

      {/* Players */}
      <InfoCard title="👥 Players" mainColor={mainColor}>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} pt={0.5}>
          {teamA?.players.map((p) => (
            <PlayerChip
              key={p}
              name={p}
              teamLabel="Team 1"
              color={teamA?.color}
            />
          ))}
          {teamB?.players.map((p) => (
            <PlayerChip
              key={p}
              name={p}
              teamLabel="Team 2"
              color={teamB?.color}
            />
          ))}
        </Box>
      </InfoCard>
    </Stack>
  );
};

function InfoCard({ title, children, mainColor }) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2, borderColor: BORDER, overflow: "hidden" }}
    >
      <Box px={2} pt={2} pb={1.5}>
        <Typography
          sx={{
            pl: 0.2,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: mainColor,
            fontFamily: "Barlow Condensed, sans-serif",
            mb: 1.5,
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </Paper>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <>
      <Stack direction="row" alignItems="center" gap={1.25} py={0.75}>
        <Box width={22} display="flex" justifyContent="center" flexShrink={0}>
          {icon}
        </Box>
        <Typography
          sx={{ fontSize: 12, color: "#888", width: 80, flexShrink: 0 }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{value}</Typography>
      </Stack>
      {!last && <Divider sx={{ borderColor: BORDER }} />}
    </>
  );
}

function PlayerChip({ name, teamLabel, color }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      p={1.25}
      bgcolor={BG}
      borderRadius={2}
    >
      <Avatar
        sx={{
          width: 30,
          height: 30,
          bgcolor: color,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {name[0]}
      </Avatar>
      <Box minWidth={0}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#888" }}>
          {teamLabel}
        </Typography>
      </Box>
    </Stack>
  );
}

export default Details;
