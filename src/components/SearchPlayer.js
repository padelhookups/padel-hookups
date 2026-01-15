import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  selectUsers,
  selectUsersLoading,
} from "../redux/slices/usersSlice";
import useAuth from "../utils/useAuth";

import { getFirestore } from "firebase/firestore";

import {
  Autocomplete,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Slide,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";

import { Person } from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SearchPlayer = ({ open, onClose, playersIds, mode }) => {
  const db = getFirestore();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const users = useSelector(selectUsers);
  const usersLoading = useSelector(selectUsersLoading);

  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showError, setShowError] = useState(false);

  const filter = createFilterOptions();

  useEffect(() => {
    if (open) {
      console.log("Fetch users using Redux with caching");
      dispatch(fetchUsers({ db, forceRefresh: false }));
      // Reset selected player when dialog opens
      setSelectedPlayer(null);
    }
  }, [open, dispatch, db]);

  useEffect(() => {
    const tempPlayers = users
      .filter((user) => !(playersIds || []).includes(user.id))
      .map((user) => ({
        label: user.Name,
        id: user.id,
        gender: user.Gender,
      }));
    console.log(tempPlayers);
    setPlayers(tempPlayers);
  }, [users, playersIds]);

  const validate = () => {
    setShowError(false);
    if (!selectedPlayer) {
      setShowError(true);
      return true;
    }
  };

  return (
    <Dialog
      fullWidth
      onClose={() => onClose()}
      open={open}
      slots={{
        transition: Transition,
      }}
      keepMounted
    >
      <DialogTitle>
        {mode === "pairs" ? "Search your Partner" : "Search a player"}
      </DialogTitle>
      <DialogContent>
        {mode === "pairs" && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
              }}
            >
              <Person fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {user.Name}
            </Typography>
          </Stack>
        )}
        <Divider sx={{ my: 2 }} />
        <Autocomplete
          freeSolo
          key={open ? "open" : "closed"}
          options={players.sort((a, b) => {
            // Handle Unknown gender - put it last
            const genderA = a.gender || "Unknown";
            const genderB = b.gender || "Unknown";

            if (genderA === "Unknown" && genderB !== "Unknown") return 1;
            if (genderA !== "Unknown" && genderB === "Unknown") return -1;

            // First sort by gender (reversed to put Male before Female)
            const genderCompare = genderB.localeCompare(genderA);
            // If same gender, sort by label (name)
            return genderCompare !== 0
              ? genderCompare
              : a.label.localeCompare(b.label);
          })}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            const { inputValue } = params;
            // Suggest the creation of a new value
            const isExisting = options.some(
              (option) => inputValue === option.label
            );
            if (inputValue !== "" && !isExisting) {
              filtered.push({
                inputValue,
                label: `Add "${inputValue}"`,
              });
            }

            return filtered;
          }}
          getOptionLabel={(option) => {
            // Value selected with enter, right from the input
            if (typeof option === "string") {
              return option;
            }
            // Regular option
            return option.label;
          }}
          value={selectedPlayer}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              setSelectedPlayer(newValue);
            } else if (newValue && newValue.inputValue) {
              // Create a new value from the user input
              setSelectedPlayer(newValue.inputValue);
            } else {
              setSelectedPlayer(newValue);
            }
          }}
          noOptionsText="No labels"
          renderInput={(params) => (
            <TextField
              error={showError}
              {...params}
              slotProps={{
                input: {
                  ...params.InputProps,
                  type: "search",
                },
              }}
              label={
                mode === "pairs" ? "Search your Partner" : "Search a player"
              }
            />
          )}
          groupBy={(option) => option.gender || "Unknown"}
          loading={usersLoading}
          sx={{ mt: 1 }}
        ></Autocomplete>
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          onClick={() => {
            setSelectedPlayer(null);
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          autoFocus
          onClick={() => {
            const hasError = validate();
            if (hasError) return;
            onClose(selectedPlayer, mode === "pairs" ? true : false);
            setSelectedPlayer(null);
          }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default SearchPlayer;
