import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  selectUsers,
  selectUsersLoading,
} from "../redux/slices/usersSlice";

import { getFirestore } from "firebase/firestore";

import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  TextField,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";

import {} from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SearchPlayer = ({ open, onClose, playersIds }) => {
  const db = getFirestore();
  const dispatch = useDispatch();

  const users = useSelector(selectUsers);
  const usersLoading = useSelector(selectUsersLoading);

  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

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
      .filter((user) => !playersIds.includes(user.id))
      .map((user) => ({
        label: user.Name,
        id: user.id,
        gender: user.Gender,
      }));
    console.log(tempPlayers);
    setPlayers(tempPlayers);
  }, [users]);

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
      <DialogTitle>Search Player</DialogTitle>
      <DialogContent>
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
              {...params}
              slotProps={{
                input: {
                  ...params.InputProps,
                  type: "search",
                },
              }}
              label="Choose a player"
            />
          )}
          groupBy={(option) => option.gender || "Unknown"}
          loading={usersLoading}
          sx={{ mt: 1 }}
        ></Autocomplete>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={() =>onClose()}>
          Cancel
        </Button>
        <Button autoFocus onClick={() => onClose(selectedPlayer)}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default SearchPlayer;
