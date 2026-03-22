import React, { useEffect } from "react";
import { getFirestore } from "firebase/firestore";
import { BracketsManager } from "brackets-manager";

import { FirestoreAdapter } from "../utils/FirestoreAdapter";
import useEventActions from "../utils/EventsUtils";
import useAuth from "../utils/useAuth";

import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import Loading from "./Loading";
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
  const [stageId, setStageId] = React.useState("");
  const [showGroups, setShowGroups] = React.useState(true);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [noDataToShow, setNoDataToShow] = React.useState(false);
  const [hasEliminationStage, setHasEliminationStage] = React.useState(false);
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

    let playersToPass = [];
    let thirdPlaces = [];

    let keys = Object.keys(finalStandings);
    const groupCount = keys.length;

    if (groupCount === 3) {
      // 3 groups: pass 1st and 2nd from each group + 2 best 3rd places
      keys.forEach((key) => {
        let group = finalStandings[key];
        group = sortStandings(group);
        playersToPass.push(...group.slice(0, 2)); // Take top 2 from each group
        thirdPlaces.push(group[2]); // Collect third places
      });

      thirdPlaces = sortStandings(thirdPlaces);
      playersToPass.push(...thirdPlaces.slice(0, 2)); // Add the best 2 third places
    } else if (groupCount === 2) {
      // 2 groups: pass 1st, 2nd, and 3rd from each group
      keys.forEach((key) => {
        let group = finalStandings[key];
        group = sortStandings(group);
        playersToPass.push(...group.slice(0, 2)); // Take top 2 from each group
      });
    } else {
      // Fallback for other group counts
      keys.forEach((key) => {
        let group = finalStandings[key];
        group = sortStandings(group);
        playersToPass.push(...group.slice(0, 2));
      });
    }

    await createBracketsElimination(eventId, tournamentId, playersToPass);
    alert("Elimination stage created!");
    render();
  };

  async function render() {
    setIsLoading(true);
    try {
      const tournamentData = await manager.get.tournamentData(tournamentId);

      if (tournamentData.stage.length === 0) {
        setNoDataToShow(true);
        return;
      }

      setNoDataToShow(false);
      tournamentData.stage = tournamentData.stage.sort((a, b) => {
        return a.number - b.number;
      });
      const groupStage = tournamentData.stage[0];
      const eliminationStage = tournamentData.stage[1];
      const eliminationExists = Boolean(eliminationStage?.id);
      setHasEliminationStage(eliminationExists);
      if (!eliminationExists && !showGroups) {
        setShowGroups(true);
      }
      setStageId(eliminationStage?.id || "");

    /* const finalFinalStandings = await manager.get.finalStandings(eliminationStage.id);
    console.log("Final Final Standings:", finalFinalStandings);
 */
      const groupStageData = await manager.get.getStageSpecificData(groupStage.id);
      const eliminationStageData = eliminationExists
        ? await manager.get.getStageSpecificData(eliminationStage.id)
        : { matches: [], rounds: [], matchGames: [], participant: [] };

      console.log('groupStageData', groupStageData);
      console.log('eliminationStageData', eliminationStageData);

      const participantsData = await adapter.select("participant");
      setParticipants((prev) => [...participantsData]);
      const participantGroups = {};

      for (const match of eliminationStageData.matches) {
        console.log(match.status);

        if (match.status !== 4 && match.status !== 5) {
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
      };

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

      const standings = computeStandings(eliminationStageData.matches);

      eliminationStageData.participant = participantsData?.map((p) => {
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
      let tempParticipant = eliminationStageData.participant.find(
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
      const sameGroup = eliminationStageData.participant.filter(
        (p) => p.group_id === groupId
      );

      // Find ties within the same group
      const tied = sameGroup.filter(
        (p) => p.id !== participant.id && p.points === points
      );

      for (const other of tied) {
        const directMatch = eliminationStageData.matches.find(
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

      const selectedStage = showGroups ? groupStage : eliminationStage;
      const selectedStageData = showGroups ? groupStageData : eliminationStageData;

      // 1) Ordenar os rounds pelo campo "number"
      if (selectedStageData.rounds) {
        selectedStageData.rounds = [...selectedStageData.rounds].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
      }

      // 2) Criar mapa: round_id -> round_number (tabelas)
      const roundNumberById = {};
      if (selectedStageData.rounds) {
        for (const r of selectedStageData.rounds) {
          roundNumberById[r.id] = r.number;
        }
      }

      // 3) Ordenar matches pelo número da ronda e número do match
      const orderedMatches = [...(selectedStageData.matches || [])].sort((a, b) => {
        const roundA = roundNumberById[a.round_id] ?? 999;
        const roundB = roundNumberById[b.round_id] ?? 999;

        if (roundA !== roundB) return roundA - roundB;

        // ordenar por número do match dentro da ronda
        return (a.number ?? 0) - (b.number ?? 0);
      });

      console.log('stages', selectedStage);
      console.log('orderedMatches', orderedMatches);
      console.log('matchGames', showGroups ? [] : selectedStageData.matchGames);
      console.log('participants', participantsData);

      window.bracketsViewer.render(
        {
          stages: selectedStage ? [selectedStage] : [],
          matches: orderedMatches,
          matchGames: showGroups ? [] : (selectedStageData.matchGames || []),
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
          showSlotsOrigin: false
        }
      );
    } catch (error) {
      console.error("Failed to render brackets:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    render();
  }, [showGroups]);

  if (noDataToShow) {
    return (
      <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Stack spacing={1.25}>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              No groups available<br /> Create the pairs and then generate the tournament groups in details page
            </Typography>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <div style={{ width: "100%", height:"Calc(100vh - 200px)", position: "relative" }}>
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
      {user?.IsAdmin && user?.Name == 'Tiago Pereira' && (
        <Button sx={{
          display: "flex",
          marginX: "auto !important",
          marginTop: "2rem !important",
        }} onClick={async () => {
          // apagar matches, rounds e groups para este stage
          await adapter.delete("match", { stage_id: stageId });
          await adapter.delete("round", { stage_id: stageId });
          await adapter.delete("group", { stage_id: stageId });
          await adapter.delete("stage", stageId);

          console.log("Deleted old stage data for stage:", stageId);
        }}>Eliminate stage</Button>)}
      <Stack
        direction="row"
        justifyContent="center"
        sx={{ mb: 2 }}
      >
        <ToggleButtonGroup
          color="primary"
          exclusive
          value={showGroups ? "groups" : "elimination"}
          onChange={(_, value) => {
            if (!value) return;
            if (value === "elimination" && !hasEliminationStage) return;
            setShowGroups(value === "groups");
          }}
          aria-label="Stage selector"
        >
          <ToggleButton value="groups" aria-label="Group stage">
            Group Stage
          </ToggleButton>
          <ToggleButton
            value="elimination"
            aria-label="Elimination stage"
            disabled={!hasEliminationStage}
          >
            Elimination Stage
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
            }}
          >
            <Loading isGenericLoading={false} />
          </div>
        )}
      <div style={{ position: "relative", minHeight: "60vh" }}>
        <div
          className="brackets-viewer"
          style={{ padding: "0", paddingBottom: "1rem" }}
        ></div>        
      </div>
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
