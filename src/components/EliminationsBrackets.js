import React, { useEffect } from "react";
import { getFirestore } from "firebase/firestore";
import { BracketsManager } from "brackets-manager";

import { FirestoreAdapter } from "../utils/FirestoreAdapter";
import useEventActions from "../utils/EventsUtils";
import useAuth from "../utils/useAuth";

import { Button } from "@mui/material";

import UploadScoreModal from "./UploadScoreModal";

const EliminationsBrackets = ({ eventId, tournamentId }) => {
  const db = getFirestore();
  const { user } = useAuth();
  const { createBracketsElimination } = useEventActions();

  const adapter = new FirestoreAdapter(
    db,
    `Events/${eventId}/TournamentData/${tournamentId}`,
    tournamentId
  );

  const manager = new BracketsManager(adapter);

  const [selectedMatch, setSelectedMatch] = React.useState([]);
  const [participants, setParticipants] = React.useState([]);
  const [finalStandings, setFinalStandings] = React.useState({});
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [showEliminationStageButton, setShowEliminationStageButton] =
    React.useState(true);

  const sortStandings = (standings) => {
    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const scoredAgainstA = a.scoredAgainst ?? 0;
      const scoredAgainstB = b.scoredAgainst ?? 0;
      return scoredAgainstA - scoredAgainstB;
    });
  };

  const nextStage = async () => {
    console.log(finalStandings);

    let playersToPass = [];
    let thirdPlaces = [];

    let keys = Object.keys(finalStandings);
    keys.forEach((key) => {
      let group = finalStandings[key];
      group = sortStandings(group);
      playersToPass.push(...group.slice(0, 2)); // Take top 2 from each group
      thirdPlaces.push(group[2]); // Collect third places
    });
    console.log("Players to pass to elimination:", playersToPass);
    console.log("Third places:", thirdPlaces);

    thirdPlaces = sortStandings(thirdPlaces);

    playersToPass.push(...thirdPlaces.slice(0, 2)); // Add the best 2 third places
    console.log("Final players to pass:", playersToPass);
    createBracketsElimination(eventId, tournamentId, playersToPass);
  };

  async function render() {
    const tournamentData = await manager.get.tournamentData(tournamentId);
    console.log(tournamentData);
    if(tournamentData.stage.length === 0){
      return;
    }
    tournamentData.stage = tournamentData.stage.sort((a, b) => {
      return a.number - b.number;
    });
    const stage = tournamentData.stage[tournamentData.stage.length - 1];
    console.log(stage);
    
    const stageData = await manager.get.getStageSpecificData(stage.id);
    console.log(stageData);

    const participantsData = await adapter.select("participant");
    setParticipants((prev) => [...participantsData]);
    console.log(stageData);

    console.log({
      stages: stageData.stage,
      matches: stageData.matches,
      matchGames: stageData.matchGames,
      participants: participantsData,
    });

    const participantGroups = {};

    for (const match of stageData.matches) {
      if(match.status !== 4){
        setShowEliminationStageButton(false);
      }
      const groupId = match.group_id?.id || match.group_id;
      if (!groupId) continue;

      if (!participantGroups[groupId]) participantGroups[groupId] = [];

      if (
        match.opponent1?.id &&
        !participantGroups[groupId].includes(match.opponent1.id)
      ) {
        participantGroups[groupId].push(match.opponent1.id);
      }

      if (
        match.opponent2?.id &&
        !participantGroups[groupId].includes(match.opponent2.id)
      ) {
        participantGroups[groupId].push(match.opponent2.id);
      }
    }

    console.log("participantGroups", participantGroups);

    function computeStandings(matches) {
      const results = participantsData.map((p) => ({
        id: p.id,
        name: p.name,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
      }));

      for (const match of matches) {
        const p1 = results.find((p) => p.id === match.opponent1?.id);
        const p2 = results.find((p) => p.id === match.opponent2?.id);

        if (!p1 || !p2) continue;
        if (!match.opponent1.score && !match.opponent2.score) continue; // Skip unplayed matches

        const matchWinnerId =
          match.opponent1.result === "win"
            ? match.opponent1.id
            : match.opponent2.result === "win"
            ? match.opponent2.id
            : null;

        if (matchWinnerId === p1.id) {
          p1.wins++;
          p1.points += 3; // You can chan ge this scoring system
          p2.losses++;
        } else if (matchWinnerId === p2.id) {
          p2.wins++;
          p2.points += 3;
          p1.losses++;
        } else {
          // Optional: handle draw
          p1.draws++;
          p2.draws++;
          p1.points++;
          p2.points++;
        }
      }

      return results;
    }

    const standings = computeStandings(stageData.matches);

    stageData.participant = participantsData?.map((p) => {
      const s = standings.find((x) => x.id === p.id);
      return {
        ...p,
        ...s,
        group_id: Object.keys(participantGroups).find((key) =>
          participantGroups[key].includes(p.id)
        ),
      };
    });

    const rankingFormula = (participant) => {
      let tempParticipant = stageData.participant.find(
        (p) => p.id === participant.id
      );
      if (!tempParticipant) return 0;
      participant = { ...participant, ...tempParticipant };
      let points = participant.points || 0;

      const groupIndex = Object.values(participantGroups).findIndex((group) =>
        group.includes(participant.id)
      );
      const groupId = Object.keys(participantGroups)[groupIndex];

      if (!groupId) return participant.points;

      // Filter participants from the same group
      const sameGroup = stageData.participant.filter(
        (p) => p.group_id === groupId
      );

      // Find ties within the same group
      const tied = sameGroup.filter(
        (p) => p.id !== participant.id && p.points === points
      );

      for (const other of tied) {
        const directMatch = stageData.matches.find(
          (m) =>
            (m.group_id?.id || m.group_id) === groupId &&
            [m.opponent1?.id, m.opponent2?.id].includes(participant.id) &&
            [m.opponent1?.id, m.opponent2?.id].includes(other.id)
        );

        if (directMatch) {
          const winnerId =
            directMatch.opponent1?.result === "win"
              ? directMatch.opponent1?.id
              : directMatch.opponent2?.result === "win"
              ? directMatch.opponent2?.id
              : null;
          if (winnerId === participant.id) points += 0.1;
          else if (winnerId === other.id) points -= 0.1;
        }
      }

      setFinalStandings((prev) => {
        const next = {
          ...prev,
          [groupId]: [
            ...(prev[groupId]?.filter((x) => x.id !== participant.id) || []),
            {
              name: participant.name,
              points,
              id: participant.id,
              scoredAgainst: participant.scoreAgainst,
            },
          ],
        };
        return next;
      });

      return points;
    };

    window.bracketsViewer.render(
      {
        stages: [stage],
        matches: stageData.matches.map((match) => ({
          ...match,
          stage_id:
            typeof match.stage_id === "object"
              ? match.stage_id.id
              : match.stage_id,
          group_id:
            typeof match.group_id === "object"
              ? match.group_id.id
              : match.group_id,
          round_id:
            typeof match.round_id === "object"
              ? match.round_id.id
              : match.round_id,
        })),
        matchGames: stageData.matchGames,
        participants: participantsData,
      },
      {
        clear: true,
        onMatchClick: (match) => {
          console.log("A match was clicked", match);
          setSelectedMatch(match);
          setUploadModalOpen(true);
        },
        customRoundName: (info, t) => {
          // You have a reference to `t` in order to translate things.
          // Returning `undefined` will fallback to the default round name in the current language.

          if (info.fractionOfFinal === 1 / 2) {
            if (info.groupType === "single-bracket") {
              // Single elimination
              return "Semi Finals";
            } else {
              // Double elimination
              return `${t(`abbreviations.${info.groupType}`)} Semi Finals`;
            }
          }
        },
        rankingFormula: rankingFormula,
      }
    );
  }

  useEffect(() => {
    render();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {showEliminationStageButton && user?.IsAdmin && (
        <Button
          variant="contained"
          onClick={async () => {
            nextStage();
          }}
          sx={{
            display: "flex",
            marginX: "auto !important",
            marginTop: "2rem !important",
            marginBottom: "1rem !important",
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "white", color: "primary.main" },
          }}
        >
          Create Elimination Stage
        </Button>
      )}
      <div
        className="brackets-viewer"
        style={{ padding: "0", paddingBottom: "1rem" }}
      ></div>
      {adapter && selectedMatch && (
        <UploadScoreModal
          open={uploadModalOpen}
          adapter={adapter}
          team1Name={
            participants.find((p) => p.id === selectedMatch?.opponent1?.id)
              ?.name
          }
          team2Name={
            participants.find((p) => p.id === selectedMatch?.opponent2?.id)
              ?.name
          }
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedMatch(null);
            render();
          }}
          match={selectedMatch}
        />
      )}
    </div>
  );
};

export default EliminationsBrackets;
