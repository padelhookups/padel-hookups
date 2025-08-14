import React from "react";
import { getAuth } from "firebase/auth";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  Chip,
} from "@mui/material";
import {
  CalendarMonth,
  Construction,
  ShoppingCart,
  Timeline,
} from "@mui/icons-material";

const Home = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  console.log("HOME");

  return (
    <>
      <Paper
        sx={{
          bgcolor: "#b88f34",
          color: "white",
          textAlign: "center",
          /* Push header below iOS notch */
          pt: "env(safe-area-inset-top)",
        }}
      >
        {/* Welcome Header */}
        <Box sx={{ py: 3, px: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              bgcolor: "rgba(255,255,255,0.2)",
            }}
          >
            {user?.displayName
              ? user.displayName
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .join("")
              : "?"}
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back,{" "}
            {user?.displayName || user?.email?.split("@")[0] || "Player"}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Ready for your next padel adventure? 🎾
          </Typography>
        </Box>
      </Paper>
      <Box
        sx={{
          px: 0,
          /* Remove huge extra space; container already pads for bottom nav */
          py: 3,
        }}
      >
        {/* Work in Progress Section */}
        <Box
          sx={{
            py: 4,
            px: 4,
            position: "relative",
            marginTop: "-32px",
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(184, 143, 52, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "shimmer 3s infinite",
            },
          }}
        >
          <Construction
            sx={{
              fontSize: 60,
              color: "primary.main",
              mb: 2,
              animation: "bounce 2s infinite",
              "@keyframes bounce": {
                "0%, 20%, 50%, 80%, 100%": {
                  transform: "translateY(0)",
                },
                "40%": { transform: "translateY(-10px)" },
                "60%": { transform: "translateY(-5px)" },
              },
            }}
          />

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "primary.main",
              textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Work in Progress
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            We're building something amazing for you!
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Chip
              icon={<CalendarMonth />}
              label="Tour 2025"
              variant="outlined"
              color="primary"
              sx={{ fontSize: "0.9rem" }}
            />
            <Chip
              label="Player Rankings"
              icon={<Timeline />}
              variant="outlined"
              color="primary"
              sx={{ fontSize: "0.9rem" }}
            />
            <Chip
              icon={<ShoppingCart />}
              label="Marketplace"
              variant="outlined"
              color="primary"
              sx={{ fontSize: "0.9rem" }}
            />
          </Box>

          <Typography
            variant="h5"
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            🚀 Stay Tuned! 🚀
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default Home;
