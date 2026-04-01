import { Box, Typography, Stack } from "@mui/material";

function getSlotsCount(slots) {
  if (Array.isArray(slots)) return slots.length;
  return slots?.size || 0;
}

function hasSharedSlots(leftSlots, rightSlots) {
  if (!leftSlots || !rightSlots) return false;

  const left = Array.isArray(leftSlots) ? leftSlots : [...leftSlots];
  const right = Array.isArray(rightSlots) ? rightSlots : [...rightSlots];

  return left.some((slot) => right.includes(slot));
}

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MatchCalendar = ({
  year,
  month,
  windowStart,
  windowEnd,
  team1Avail,
  team2Avail,
  onDayTap,
  interactive,
  mainColor,
}) => {
  //console.log(team1Avail, team2Avail, interactive);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function dateKey(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(d);
    const outside = key < windowStart || key > windowEnd;
    const inT1 = getSlotsCount(team1Avail?.[key]) > 0;
    const inT2 = getSlotsCount(team2Avail?.[key]) > 0;
    const bothSelected = hasSharedSlots(team1Avail?.[key], team2Avail?.[key]);

    if (!outside) {
      if (interactive) {
        /* console.log(team1Avail);
        console.log(team2Avail);
        console.log(d, key, inT1, inT2); */
      }
      days.push({ d, key, outside, inT1, inT2, bothSelected });
    }
  }

  return (
    <Box px={2} pb={1.5}>
      <Typography
        sx={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: mainColor,
          my: 2,
        }}
      >
        {MONTH_NAMES[month]} {year}
      </Typography>

      {/* Week day headers */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7,1fr)"
        gap={0.5}
        mb={0.75}
      >
        {DAY_NAMES.map((d, i) => (
          <Typography
            key={i}
            sx={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "#aaa",
              textTransform: "uppercase",
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box display="grid" gridTemplateColumns="repeat(7,1fr)" gap={0.5}>
        {days.map((cell) => {
          if (cell.empty) return <Box key={cell.key} />;
          const { d, key, inT1, inT2, bothSelected } = cell;

          const canTap = interactive;

          let background = "transparent";
          let color = "#222";
          let border = "1px solid transparent";

          if (bothSelected) {
            background = `linear-gradient(135deg,${mainColor} 50%, #9ab4df 50%)`;
            color = "white";
            border = `1px solid ${mainColor}`;
          } else if (inT2 && interactive) {
            background = mainColor;
            color = "white";
            border = `1px solid ${mainColor}`;
          } else if (inT1) {
            background = "#e8f4f8";
            color = "#0c6ea1";
            border = "1px solid #90c9e8";
          }

          return (
            <Box
              key={key}
              onClick={canTap ? () => onDayTap(key) : undefined}
              sx={{
                aspectRatio: "1",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 500,
                cursor: canTap ? "pointer" : "default",
                background,
                color,
                border,
                position: "relative",
                transition: "all 0.15s",
                "&:hover": canTap
                  ? {
                      bgcolor: inT2 ? mainColor : "#f5ecd6",
                      border: `1px solid ${mainColor}`,
                    }
                  : {},
              }}
            >
              {d}
              {bothSelected && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "white",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default MatchCalendar;
