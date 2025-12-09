// File: /c:/Users/30tia/Documents/VSC/padel-hookups/src/utils/Statistics.js

import { doc, increment, getFirestore, writeBatch } from 'firebase/firestore';

const StatisticsActions = () => {
    const db = getFirestore();

    const addPlayedEvent = async (playerRefs) => {
        // Update each player's MixsPlayed count in Firestore
        const batch = writeBatch(db);

        playerRefs.forEach((playerRef) => {
            // Add the update to the batch
            batch.update(playerRef, {
                MixsPlayed: increment(1),
                LastModifiedAt: new Date()
            });
        });

        // Commit all updates at once
        await batch.commit();
    };

    const addWonEvent = (stats, eventId) => {
        if (!stats.wonEvents) {
            stats.wonEvents = [];
        }
        if (!stats.wonEvents.includes(eventId)) {
            stats.wonEvents.push(eventId);
        }
        return stats;
    };

    return {
        addPlayedEvent,
        addWonEvent
    };
};

export default StatisticsActions;