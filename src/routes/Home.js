import React from "react";
import { useLocation, useNavigate } from "react-router";

import { getAuth } from "firebase/auth";

import { Box, Button, Chip, Typography, Paper } from "@mui/material";
import {
  Timeline,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";

const Home = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  console.log("HOME");

  return (
    <>
      <Paper
        sx={{
          bgcolor: "#b88f34",
          color: "white",
          textAlign: "start",
          /* Push header below iOS notch */
          pt: "env(safe-area-inset-top)",
        }}
      >
        {/* Welcome Header */}
        <Box sx={{ py: 3, px: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            📌 Community Events
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Tournaments, training & social hookups
          </Typography>
        </Box>
      </Paper>
      <Box
        sx={{
          px: 0,
          pt: 0,
          flex: 1, // match BottomBar height, no extra safe-area padding
        }}
      >
        {/* Work in Progress Section */}
        {/* <Box
					sx={{
						height: '100%',
						mt: '-40px',
						px: 4,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
						textAlign: "center",
						background:
							"linear-gradient(135deg, rgba(184, 143, 52, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)",
						overflow: "hidden",						
						"&::before": {
							content: '""',
							position: "absolute",
							top: 0,
							left: "-100%",
							width: "100%",
							background:
								"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
							animation: "shimmer 3s infinite"
						}
					}}>
					<Construction
						sx={{
							fontSize: 60,
							color: "primary.main",
							mb: 2,
							animation: "bounce 2s infinite",
							"@keyframes bounce": {
								"0%, 20%, 50%, 80%, 100%": {
									transform: "translateY(0)"
								},
								"40%": { transform: "translateY(-10px)" },
								"60%": { transform: "translateY(-5px)" }
							}
						}}
					/>

					<Typography
						variant='h4'
						component='h2'
						gutterBottom
						sx={{
							fontWeight: "bold",
							color: "primary.main",
							textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
						}}>
						Work in Progress
					</Typography>

					<Typography
						variant='h6'
						sx={{
							mb: 3,
							color: "text.secondary",
							fontStyle: "italic"
						}}>
						We're building something amazing for you!
					</Typography>

					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							gap: 1,
							mb: 3,
							flexWrap: "wrap"
						}}>
						<Chip
							icon={<CalendarMonth />}
							label='Tour 2025'
							variant='outlined'
							color='primary'
							sx={{ fontSize: "0.9rem" }}
						/>
						<Chip
							label='Player Rankings'
							icon={<Timeline />}
							variant='outlined'
							color='primary'
							sx={{ fontSize: "0.9rem" }}
						/>
						<Chip
							icon={<ShoppingCart />}
							label='Marketplace'
							variant='outlined'
							color='primary'
							sx={{ fontSize: "0.9rem" }}
						/>
					</Box>

					<Typography
						variant='h5'
						sx={{
							color: "primary.main",
							fontWeight: "bold",
							letterSpacing: 1,
							textTransform: "uppercase"
						}}>
						🚀 Stay Tuned! 🚀
					</Typography>
				</Box> */}
        <Timeline
          sx={{
            [`& .${timelineItemClasses.root}:before`]: {
              flex: 0,
              padding: 0,
            },
          }}
        >
          <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot
                sx={{
                  bgcolor: "error.main",
                  color: "white",
                  fontWeight: "bold",
                  width: 24,
                  height: 24,
                }}
              >
                <Typography
                  variant="span"
                  sx={{
                    fontWeight: "bold",
                    width: "100%",
                    textAlign: "center",
                    px: 0.2,
                  }}
                >
                  28
                </Typography>
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent sx={{ py: "12px", px: 2 }}>
              <Box
                sx={{
                  border: "2px dashed grey",
                  borderRadius: 2,
                  p: 1,
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => {
                  console.log("Box 1 clicked - going to event details");
                  navigate("/Event");
                }}
              >
                <Typography variant="h6">🏆 Masters V</Typography>
                <Typography variant="body2">⌚ 18:00</Typography>
                <Chip
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  variant="solid"
                  color="error"
                  size="small"
                  label="Tournament"
                />
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={(e) => {
                    console.log("Button 1 clicked - going to join page");
                    e.stopPropagation();
                    //navigate("/Join");
                  }}
                >
                  Join
                </Button>
              </Box>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  fontWeight: "bold",
                  width: 24,
                  height: 24,
                }}
              >
                <Typography
                  variant="span"
                  sx={{
                    fontWeight: "bold",
                    width: "100%",
                    textAlign: "center",
                    px: 0.2,
                  }}
                >
                  17
                </Typography>
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent sx={{ py: "12px", px: 2 }}>
              <Box
                sx={{
                  border: "2px dashed grey",
                  borderRadius: 2,
                  p: 1,
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => {
                  console.log("Box 2 clicked - going to event details");
                  navigate("/Event");
                }}
              >
                <Typography variant="h6">🏆 Mix November</Typography>
                <Typography variant="body2" component="span"></Typography>
                <Typography variant="body2">⌚ 12:00</Typography>
                <Chip
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  variant="solid"
                  color="success"
                  size="small"
                  label="Social"
                />
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={(e) => {
                    console.log("Button 2 clicked - going to join page");
                    e.stopPropagation();
                    navigate("/Join");
                  }}
                >
                  Join
                </Button>
              </Box>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineConnector />
              <TimelineDot
                sx={{
                  bgcolor: "info.main",
                  color: "white",
                  fontWeight: "bold",
                  width: 24,
                  height: 24,
                }}
              >
                <Typography
                  variant="span"
                  sx={{
                    fontWeight: "bold",
                    width: "100%",
                    textAlign: "center",
                    px: 0.2,
                  }}
                >
                  12
                </Typography>
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent sx={{ py: "12px", px: 2 }}>
              <Box
                sx={{
                  border: "2px dashed grey",
                  borderRadius: 2,
                  p: 1,
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => {
                  console.log("Box 3 clicked - going to event details");
                  navigate("/Event");
                }}
              >
                <Typography variant="h6">🎯 Training Class</Typography>
                <Typography variant="body2">⌚ 20:00</Typography>
                <Chip
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  variant="solid"
                  color="info"
                  size="small"
                  label="Training"
                />
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={(e) => {
                    console.log("Button 3 clicked - going to join page");
                    e.stopPropagation();
                    navigate("/Join");
                  }}
                >
                  Join
                </Button>
              </Box>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </Box>
    </>
  );
};

export default Home;
