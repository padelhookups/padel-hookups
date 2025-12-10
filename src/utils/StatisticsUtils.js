// File: /c:/Users/30tia/Documents/VSC/padel-hookups/src/utils/Statistics.js

import { doc, increment, getFirestore, writeBatch } from "firebase/firestore";

const StatisticsActions = () => {
  const db = getFirestore();

  const addPlayedEvent = async (playerRefs) => {
    // Update each player's MixsPlayed count in Firestore
    const batch = writeBatch(db);

    playerRefs.forEach((playerRef) => {
      // Add the update to the batch
      if (playerRef.path.startsWith("Users/")) {
        batch.update(playerRef, {
          MixsPlayed: increment(1),
          LastModifiedAt: new Date(),
        });
      }
    });

    // Commit all updates at once
    await batch.commit();
  };

  const addWonEvent = (eventId, winnerPair) => {
    console.log("addWonEvent", eventId, winnerPair);
    const eventRef = doc(db, "Events", eventId);

    const batch = writeBatch(db);
    if (winnerPair.player1Id && !winnerPair.player1Id.startsWith("guest_")) {
      const player1Ref = doc(db, "Users", winnerPair.player1Id);
      batch.update(player1Ref, {
        MixsWon: increment(1),
        ModifiedAt: new Date(),
      });
    }

    if (winnerPair.player2Id && !winnerPair.player2Id.startsWith("guest_")) {
      const player2Ref = doc(db, "Users", winnerPair.player2Id);
      batch.update(player2Ref, {
        MixsWon: increment(1),
        ModifiedAt: new Date(),
      });
    }

    batch.update(eventRef, {
      WonStatisticsUpdated: true,
      ModifiedAt: new Date(),
    });
    return batch.commit();
  };

  return {
    addPlayedEvent,
    addWonEvent,
  };
};

export default StatisticsActions;
