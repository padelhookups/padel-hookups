import { useEffect, useState } from "react";
import { BracketsManager, helpers } from "brackets-manager";

import {
  Box,
  Button,
  Divider,
  Modal,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

const UploadScoreModal = ({
  open,
  onClose,
  match,
  team1Name,
  team2Name,
  adapter,
}) => {
  console.log(match);
  const manager = new BracketsManager(adapter);

  const [team1Score, setTeam1Score] = useState(null);
  const [team2Score, setTeam2Score] = useState(null);

  const handleSubmitScore = async () => {
    try {
      console.log(match, team1Score, team2Score);
      console.log({
        id: match.id,
        opponent1: { ...match.opponent1, score: team1Score },
        opponent2: { ...match.opponent2, score: team2Score },
      });

      const opponent1Result =
        team1Score > team2Score ? "win" : team1Score < team2Score ? "lose" : "";
      const opponent2Result =
        team2Score > team1Score ? "win" : team2Score < team1Score ? "lose" : "";

      // Update in manager
      await manager.update.match({
        id: match.id,
        scoreTeam1: team1Score,
        scoreTeam2: team2Score,
        customStatus: 4,
        status: 4,
        opponent1: {
          result: opponent1Result,
          score: team1Score,
        },
        opponent2: {
          result: opponent2Result,
          score: team2Score,
        },
      });
      const winnerId =
        opponent1Result === "win" ? match.opponent1.id : match.opponent2.id;
      onClose();
      console.log("✅ Match updated");
    } catch (err) {
      console.error("❌ Error updating match", err);
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      if (form && form.checkValidity()) {
        handleSubmitScore();
      } else if (form) {
        form.reportValidity();
      }
    }
  }

  if (!match) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
          width: 400, // fixed width (or use maxWidth)
          maxWidth: "90%", // keep responsive
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Enter Scores
        </Typography>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitScore();
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {team1Name}
          </Typography>
          <TextField
            label="Team 1 Score"
            type="number"
            fullWidth
            required
            value={team1Score}
            onChange={(e) => setTeam1Score(Number(e.target.value))}
            onKeyUp={handleEnter}
            sx={{ my: 0 }}
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {team2Name}
          </Typography>
          <TextField
            label="Team 2 Score"
            required
            type="number"
            fullWidth
            value={team2Score}
            onChange={(e) => setTeam2Score(Number(e.target.value))}
            onKeyUp={handleEnter}
            sx={{ my: 0 }}
          />
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mt: 2 }}
          >
            <Button
              type="button"
              variant="outlined"
              color="primary"
              onClick={onClose}
            >
              <Typography variant="button">Cancel</Typography>
            </Button>
            <Button type="submit" variant="contained">
              <Typography variant="button" sx={{ color: "white" }}>
                Submit
              </Typography>
            </Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};
export default UploadScoreModal;
