import { BracketsManager } from 'brackets-manager';
import { Database } from 'brackets-model';
import { FirestoreAdapter } from './FirestoreAdapter';

import { addDoc, doc, arrayUnion, arrayRemove, collection, deleteDoc, getFirestore, Timestamp, updateDoc, setDoc } from "firebase/firestore";
import useAuth from "../utils/useAuth";

const createMatchs = async (pairs, eventId) => {
  const db = getFirestore();

  // 1️⃣ Create a "TournamentData" document for this event
  const tournamentCol = collection(db, `Events/${eventId}/TournamentData`);
  const tournamentRef = await addDoc(tournamentCol, { createdAt: Date.now(), eventId });
  const tournamentId = tournamentRef.id;

  // 2️⃣ Create adapter and manager
  const adapter = new FirestoreAdapter(db, `Events/${eventId}/TournamentData/${tournamentId}`);
  const manager = new BracketsManager(adapter);

  /*   const participantIds = [];
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
  
      const docRef = doc(collection(db, `Events/${eventId}/TournamentData/${tournamentId}/participants`));
      const id = docRef.id;
  
      // Save participant with ID included
      await setDoc(docRef, {
        id,                 // internal participant ID
        firestoreId: pair.id, // original pair ID
        name: pair.DisplayName,
        createdAt: Date.now(),
      });
  
      // update the document to include its own id field
      //await adapter.update("participant", { id }, { firestoreId: pair.id });
  
      // ✅ Push the adapter's returned ID, not your pair.id
      participantIds.push(id);
    } */

  const participantIds = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];

    // Insert participant into Firestore
    const { id } = await adapter.insert("participants", {
      name: pair.DisplayName,
      firestoreId: pair.id,
      createdAt: Date.now(),
    });

    participantIds.push(id); // 🔹 important, these are string IDs
  }

  // 4) create stage with seeding set to those participant ids

  const stage = await manager.create.stage({
    name: "Padel Event",
    tournamentId: 1,
    type: "round_robin",
    settings: {
      groupCount: 1,
      size: pairs.length,
      seedOrdering: ['groups.bracket_optimized'],
    },
    seeding: participantIds
    // IMPORTANT: use 'seeding' to reference inserted participant document ids
    //seeding: participantIds,
  });

  // 5) fetch matches for that stage
  /* const matches = await manager.get.matches({ stageId: stage.id });
  console.log("Matches created:", matches); */

  /* await manager.create.stage({
    name: "Padel Event",
    tournamentId: tournamentId,
    type: "round_robin",
    settings: {
      groupCount: 1,
      size: pairs.length,
    },
    participants: pairs.map((p, i) => ({
      id: i + 1,
      name: `Pair ${i + 1}`,
      firestoreId: p.id,
    })),
  });
  const matches = await manager.get.matches({}); */
  /* console.log(matches); */
};

const useEventActions = () => {
  const { user } = useAuth();
  const db = getFirestore();

  const registerFromEvent = async (eventSelectedId) => {
    const userDocRef = doc(db, `Users/${user.uid}`);
    const eventDocRef = doc(db, `Events/${eventSelectedId}`);

    await setDoc(doc(db, `Events/${eventSelectedId}/Players/`, user.uid), {
      UserId: userDocRef,
      EventId: eventDocRef,
      CreatedAt: Timestamp.fromDate(new Date()),
    });

    await updateDoc(doc(db, `Events/${eventSelectedId}`), {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersIds: arrayUnion(userDocRef)
    });
  }

  const unregisterFromEvent = async (eventSelectedId) => {
    const userDocRef = doc(db, `Users/${user.uid}`);
    const eventDocRef = doc(db, `Events/${eventSelectedId}`);

    await deleteDoc(doc(db, `Events/${eventSelectedId}/Players/`, user.uid));

    await updateDoc(eventDocRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersIds: arrayRemove(userDocRef)
    });
  }

  const createPairsForEvent = async (players, eventId) => {
    // add 4 for testing
    players.forEach(player => {
      players.push({ ...player });
    });
    const shuffled = players
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    console.log('shuffled', shuffled);


    const pairs = shuffled.reduce((acc, player, index, arr) => {
      if (index % 2 === 0) {
        acc.push({
          DisplayName: player?.Name + ' & ' + (arr[index + 1]?.Name),
          Player1Id: player.id,
          Player2Id: arr[index + 1]?.id,
          CreatedAt: new Date().toISOString(),
        });
      }
      return acc;
    }, []);
    console.log('pairs', pairs);

    const pairRefs = pairs.map(pair => {
      const newPairRef = doc(collection(db, `Events/${eventId}/Pairs`)); // creates a new ref with ID
      pair.id = newPairRef.id; // assign the generated ID to the pair object
      return {
        id: newPairRef.id, // keep the ID
        write: setDoc(newPairRef, { ...pair }),
      };
    });

    // Wait for all writes to complete
    await Promise.all(pairRefs.map(p => p.write));

    // Now you already have all the IDs
    const newPairIds = pairRefs.map(p => p.id);
    console.log('newPairIds', newPairIds);

    const eventDocRef = doc(db, `Events/${eventId}`);
    await updateDoc(eventDocRef, {
      //PairsCreated: true,
      ModifiedAt: Timestamp.fromDate(new Date()),
      //Pairs: arrayUnion(...pairs)
    });

    // Create matchs in brackets-manager
    await createMatchs(pairs, eventId);
  }

  return { registerFromEvent, unregisterFromEvent, createPairsForEvent };
}

export default useEventActions;
