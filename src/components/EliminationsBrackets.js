import React, { useEffect } from "react";
import { getFirestore } from "firebase/firestore";
import { BracketsManager } from "brackets-manager";
import { FirestoreAdapter } from "../utils/FirestoreAdapter";

import UploadScoreModal from "./UploadScoreModal";

const EliminationsBrackets = ({ eventId, tournamentId }) => {
  const db = getFirestore();

  const adapter = new FirestoreAdapter(
    db,
    `Events/${eventId}/TournamentData/${tournamentId}`,
    tournamentId
  );

  const manager = new BracketsManager(adapter);

  const [selectedMatch, setSelectedMatch] = React.useState([]);
  const [participants, setParticipants] = React.useState([]);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);

  async function render() {
    const stage = await manager.get.currentStage(tournamentId);
    console.log(stage);

    const participantsData = await adapter.select("participant");
    setParticipants(participantsData);

    const stageData = await manager.get.stageData(stage.id);
    console.log(stageData);

    console.log({
      stages: stageData.stage,
      matches: stageData.match,
      matchGames: stageData.match_game,
      participants: stageData.participant,
    });

    window.bracketsViewer.render(
      {
        stages: stageData.stage.flat(),
        matches: stageData.match.map((match) => ({
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
        matchGames: stageData.match_game,
        participants: stageData.participant,
      },
      {
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
      }
    );
  }

  useEffect(() => {
    render();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div className="brackets-viewer"></div>
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
