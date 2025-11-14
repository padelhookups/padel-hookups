import { BracketsManager } from "brackets-manager";
import { FirestoreAdapter } from "./FirestoreAdapter";

import {
  addDoc,
  doc,
  arrayUnion,
  arrayRemove,
  collection,
  deleteDoc,
  getFirestore,
  Timestamp,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import useAuth from "../utils/useAuth";
import { Tour } from "@mui/icons-material";

const useEventActions = () => {
  const { user } = useAuth();
  const db = getFirestore();

  const createMatchsRobinHood = async (eventId) => {
    const db = getFirestore();

    const tournamentCol = collection(db, `Events/${eventId}/TournamentData`);
    const tournamentRef = await addDoc(tournamentCol, {
      createdAt: Date.now(),
      eventId,
    });
    const tournamentId = tournamentRef.id;

    // Get Event to get fresh pairs
    const eventSnap = await getDoc(doc(db, `Events/${eventId}`));
    const pairs = eventSnap.data().Pairs;

    // 2️⃣ Create adapter and manager
    const adapter = new FirestoreAdapter(
      db,
      `Events/${eventId}/TournamentData/${tournamentId}`,
      tournamentId
    );
    const manager = new BracketsManager(adapter);

    const seeding = pairs.map((pair, i) => ({
      id: i + 1, // manager-side temporary ID
      name: pair.DisplayName, // display name
    }));

    // 4) create stage with seeding set to those participant ids

    const stage = await manager.create.stage({
      name: "Padel Event",
      tournamentId: 1,
      type: "round_robin",
      settings: {
        groupCount: 1,
        size: pairs.length,
        seedOrdering: ["groups.bracket_optimized"],
      },
      seeding: seeding,
    });

    console.log("state", stage);
    const eventDocRef = doc(db, `Events/${eventId}`);
    await updateDoc(eventDocRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      TournamentId: tournamentId,
      PairsCreated: true,
      TournamentStarted: true,
    });
  };

  const createMatchsElimination = async (eventId) => {
    const db = getFirestore();

    // Get Event to get fresh pairs
    const eventDocRef = doc(db, `Events/${eventId}`);
    const eventSnap = await getDoc(eventDocRef);
    const pairs = eventSnap.data().Pairs;

    // 1️⃣ Create a "TournamentData" document for this event
    const tournamentCol = collection(db, `Events/${eventId}/TournamentData`);
    const tournamentRef = await addDoc(tournamentCol, {
      createdAt: Date.now(),
      eventId,
    });
    const tournamentId = tournamentRef.id;

    await updateDoc(eventDocRef, {
      PairsCreated: true,
      ModifiedAt: Timestamp.fromDate(new Date()),
      TournamentId: tournamentId,
    });

    // 2️⃣ Create adapter and manager
    const adapter = new FirestoreAdapter(
      db,
      `Events/${eventId}/TournamentData/${tournamentId}`,
      tournamentId
    );
    const manager = new BracketsManager(adapter);

    const seeding = pairs.map((pair, i) => ({
      id: i + 1, // manager-side temporary ID
      name: pair.DisplayName, // display name
    }));

    const groupCount = getNumberOfGroups(pairs.length);   

    const groupStage = await manager.create.stage({
      name: "Group Stage",
      tournamentId: tournamentId,
      type: "round_robin",
      settings: {
        groupCount: groupCount,
        size: pairs.length,
        seedOrdering: ["groups.bracket_optimized"]        
      },
      seeding: seeding,
    });
  };

  const createBracketsElimination = async (eventId, tournamentId, pairs) => {
    const db = getFirestore();

    // 2️⃣ Create adapter and manager
    const adapter = new FirestoreAdapter(
      db,
      `Events/${eventId}/TournamentData/${tournamentId}`,
      tournamentId
    );
    const manager = new BracketsManager(adapter);

    const eliminationStage = await manager.create.stage({
      tournamentId: tournamentId,
      name: "Elimination Stage",
      type: "single_elimination",
      settings: {
        size: pairs.length,
        seedOrdering: ["inner_outer"], // <-- valid now
        balanceByes: true,
      },
    });

    console.log(eliminationStage);
  }

  const registerFromEvent = async (
    eventSelectedId,
    selectedUser,
    isGuest,
    registerItSelf
  ) => {
    let finalUser = selectedUser || user.uid;
    const userDocRef = doc(db, `Users/${finalUser}`);
    const eventDocRef = doc(db, `Events/${eventSelectedId}`);

    if (isGuest) {
      // create random id for guest user
      finalUser = `guest_${Math.random().toString(36).substr(2, 9)}`;
    }

    await setDoc(doc(db, `Events/${eventSelectedId}/Players/`, finalUser), {
      UserId: !isGuest ? userDocRef : null,
      EventId: eventDocRef,
      CreatedAt: Timestamp.fromDate(new Date()),
      Name: isGuest ? selectedUser : null,
      IsGuest: isGuest || false,
    });

    await updateDoc(eventDocRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersIds: arrayUnion(
        !isGuest
          ? userDocRef
          : doc(db, `Events/${eventSelectedId}/Players/`, finalUser)
      ),
      Guests: isGuest
        ? arrayUnion({
          Name: selectedUser,
          IsGuest: true,
          CreatedAt: Timestamp.fromDate(new Date()),
          UserId: finalUser,
        })
        : arrayRemove(null),
    });

    console.log("registerFromEvent FINAL");
  };

  const unregisterFromEvent = async (
    eventSelectedId,
    selectedUser,
    isGuest
  ) => {
    let finalUser = selectedUser || user.uid;
    let userDocRef = doc(db, `Users/${finalUser}`);
    const eventDocRef = doc(db, `Events/${eventSelectedId}`);

    if (isGuest) {
      // create random id for guest user
      userDocRef = doc(db, `Events/${eventSelectedId}/Players/${finalUser}`);
    }

    await deleteDoc(doc(db, `Events/${eventSelectedId}/Players/`, finalUser));

    if (isGuest) {
      // For guests, fetch current guests array and filter out the matching one
      const eventSnap = await getDoc(eventDocRef);
      const currentGuests = eventSnap.data()?.Guests || [];
      const updatedGuests = currentGuests.filter(
        (guest) => guest.UserId !== finalUser
      );

      await updateDoc(eventDocRef, {
        ModifiedAt: Timestamp.fromDate(new Date()),
        PlayersIds: arrayRemove(userDocRef),
        Guests: updatedGuests,
      });
    } else {
      await updateDoc(eventDocRef, {
        ModifiedAt: Timestamp.fromDate(new Date()),
        PlayersIds: arrayRemove(userDocRef),
      });
    }
  };

  const addSinglePair = async (pair, eventId) => {
    const eventDocRef = doc(db, `Events/${eventId}`);

    await updateDoc(eventDocRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersWithPairsIds: arrayUnion(pair.Player1Id, pair.Player2Id),
      Pairs: arrayUnion(pair),
    });
  };

  const createPairsForEvent = async (players, eventId) => {
    const shuffled = players
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    console.log("shuffled", shuffled);

    const pairs = shuffled.reduce((acc, player, index, arr) => {
      if (index % 2 === 0) {
        acc.push({
          DisplayName: player?.Name + " & " + arr[index + 1]?.Name,
          Player1Id: player.id || player.UserId,
          Player2Id: arr[index + 1]?.id || arr[index + 1]?.UserId,
          CreatedAt: new Date().toISOString(),
        });
      }
      return acc;
    }, []);
    console.log("pairs", pairs);

    const eventDocRef = doc(db, `Events/${eventId}`);
    await updateDoc(eventDocRef, {
      //PairsCreated: true,
      ModifiedAt: Timestamp.fromDate(new Date()),
      //TournamentId: tournamentId,
      Pairs: arrayUnion(...pairs),
    });
  };

  function getNumberOfGroups(totalPairs) {
    let groupSize;

    if (totalPairs % 4 === 0) groupSize = 4;
    else if (totalPairs % 3 === 0) groupSize = 3;
    else groupSize = 2;

    return totalPairs / groupSize;
  }

  return {
    addSinglePair,
    createMatchsRobinHood,
    createMatchsElimination,
    createBracketsElimination,
    registerFromEvent,
    unregisterFromEvent,
    createPairsForEvent,
  };
};

export default useEventActions;
