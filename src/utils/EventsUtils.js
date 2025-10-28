import { BracketsManager } from 'brackets-manager';
import { FirestoreAdapter } from './FirestoreAdapter';

import { addDoc, doc, arrayUnion, arrayRemove, collection, deleteDoc, getFirestore, Timestamp, updateDoc, setDoc } from "firebase/firestore";
import useAuth from "../utils/useAuth";

const createMatchs = async (pairs, eventId, tournamentId) => {
  const db = getFirestore();

  // 2️⃣ Create adapter and manager
  const adapter = new FirestoreAdapter(db, `Events/${eventId}/TournamentData/${tournamentId}`, tournamentId);
  const manager = new BracketsManager(adapter);

  const seeding = pairs.map((pair, i) => ({
    id: i + 1,               // manager-side temporary ID
    name: pair.DisplayName,   // display name
    //firestoreId: pair.id      // your Firestore reference
  }));

  // 4) create stage with seeding set to those participant ids

  const stage = await manager.create.stage({
    name: "Padel Event",
    tournamentId: 1,
    type: "round_robin",
    settings: {
      groupCount: 1,
      size: pairs.length,
      seedOrdering: ['groups.bracket_optimized']
    },
    seeding: seeding
  });

  console.log('state', stage);
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

    // 1️⃣ Create a "TournamentData" document for this event
    const tournamentCol = collection(db, `Events/${eventId}/TournamentData`);
    const tournamentRef = await addDoc(tournamentCol, { createdAt: Date.now(), eventId });
    const tournamentId = tournamentRef.id;

    const eventDocRef = doc(db, `Events/${eventId}`);
    await updateDoc(eventDocRef, {
      PairsCreated: true,
      ModifiedAt: Timestamp.fromDate(new Date()),
      TournamentId: tournamentId,
      Pairs: arrayUnion(...pairs)
    });

    // Create matchs in brackets-manager
    await createMatchs(pairs, eventId, tournamentId);
  }

  return { registerFromEvent, unregisterFromEvent, createPairsForEvent };
}

export default useEventActions;
