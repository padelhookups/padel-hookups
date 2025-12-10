import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFirestore } from "firebase/firestore";
import * as MuiIcons from "@mui/icons-material";

import {
  fetchBadges,
  selectBadges,
  selectBadgesLoading,
} from "../redux/slices/badgesSlice";

import {
  Box,
  Card,
  CircularProgress,
  Chip,
  Grid,
  Typography,
} from "@mui/material";

const resolveBadgeIcon = (icon) => {
  if (!icon) return MuiIcons.EmojiEvents;
  if (typeof icon === "string") {
    return MuiIcons[icon] || MuiIcons.EmojiEvents;
  }
  return icon;
};

const Badges = ({ earnedBadges = [], ForceRefresh }) => {
  const BadgeIcon = ({ badge, isEarned }) => {
    const IconComponent = resolveBadgeIcon(badge.Icon);
    return (
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: isEarned ? badge.color : "grey.300",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
          opacity: isEarned ? 1 : 0.4,
          transition: "all 0.3s ease",
        }}
      >
        <IconComponent
          sx={{
            fontSize: 32,
            color: isEarned ? "white" : "grey.500",
          }}
        />
      </Box>
    );
  };

  const db = getFirestore();
  const dispatch = useDispatch();

  const initialFetchDone = useRef(false);

  const badges = useSelector(selectBadges);
  const loading = useSelector(selectBadgesLoading);

  const [badgesByCategory, setBadgesByCategory] = useState({});

  useEffect(() => {
    // Only fetch if we haven't done initial fetch and don't have benefits
    if (!initialFetchDone.current) {
      console.log("Fetch badges using Redux with caching");
      initialFetchDone.current = true;
      if (ForceRefresh > Number(localStorage.getItem("ForceRefresh"))) {
        dispatch(fetchBadges({ db, forceRefresh: true }));
      } else {
        dispatch(fetchBadges({ db, forceRefresh: false }));
      }
      localStorage.setItem("ForceRefresh", ForceRefresh);
    }
  }, [dispatch, db, badges.length]);

  useEffect(() => {
    console.log("badges", badges);
    // group by category
    const grouped = badges.reduce((acc, badge) => {
      const category = badge.Category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(badge);
      return acc;
    }, {});
    console.log("grouped badges", grouped);

    setBadgesByCategory(grouped);
  }, [badges]);

  if (loading && badges.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      ></Box>
      <Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
        {badgesByCategory &&
          Object.keys(badgesByCategory).map((category) => {
			const earnedBadgesList = earnedBadges.filter(badge => badge.Category === category) || [];

            return (
              <Box key={category} sx={{ width: "100%", mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ display: "flex", fontWeight: "bold", mb: 1 }}
                >
                  {category}
                  <Chip
                    label={`${earnedBadgesList.length}/${badgesByCategory[category].length}`}
                    color="primary"
                    size="small"
                    sx={{ color: "white", ml: "auto" }}
                  />
                </Typography>
                <Grid container spacing={2} columns={{ xs: 4, sm: 9, md: 12 }}>
                  {badgesByCategory[category].map((badge) => {
                    const isEarned = earnedBadges.includes(badge.id);
                    return (
                      <Grid
                        item
                        size={{ xs: 2, sm: 3, md: 2, xl: 1 }}
                        key={badge.id}
                        sx={{ display: "flex" }}
                      >
                        <Card
                          sx={{
                            height: 180,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            opacity: isEarned ? 1 : 0.6,
                            border: isEarned
                              ? `2px solid ${badge.color}`
                              : "2px solid transparent",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: isEarned ? "scale(1.05)" : "none",
                              boxShadow: isEarned ? 4 : 1,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              flex: 1,
                              justifyContent: "center",
                            }}
                          >
                            <BadgeIcon badge={badge} isEarned={isEarned} />
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: "bold",
                                textAlign: "center",
                                mb: 0.5,
                                lineHeight: 1.2,
                              }}
                            >
                              {badge.Name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textAlign: "center",
                                fontSize: "0.7rem",
                                lineHeight: 1.3,
                              }}
                            >
                              {badge.Description}
                            </Typography>
                          </Box>
                          {isEarned && (
                            <Chip
                              label="Earned"
                              size="small"
                              sx={{
                                mt: 1,
                                bgcolor: badge.color,
                                color: "white",
                                fontSize: "0.65rem",
                                height: 20,
                              }}
                            />
                          )}
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            );
          })}

        {/* {badges.map((badge) => {
         
        })} */}
      </Grid>
    </Box>
  );
};

export default Badges;
