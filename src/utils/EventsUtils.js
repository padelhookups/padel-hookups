import { BracketsManager } from "brackets-manager";
import { FirestoreAdapter } from "./FirestoreAdapter";
import StatisticsActions from './StatisticsUtils';
import BadgesActions from "./BadgesUtils";

import {
  addDoc,
  arrayUnion,
  arrayRemove,
  collection,
  doc,
  deleteDoc,
  getFirestore,
  Timestamp,
  updateDoc,
  setDoc,
  query,
  where,
  getDoc,
  getDocs,
} from "firebase/firestore";
import useAuth from "../utils/useAuth";

const useEventActions = () => {
  const { user } = useAuth();
  const db = getFirestore();

  const {
    addPlayedEvent
  } = StatisticsActions();
  const {
    addFirstMixPlayedBadge,
    addFirstTourEventPlayedBadge
  } = BadgesActions();

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
    const players = eventSnap.data().PlayersIds;

    // 2️⃣ Create adapter and manager
    const adapter = new FirestoreAdapter(
      db,
      `Events/${eventId}/TournamentData/${tournamentId}`,
      tournamentId
    );
    const manager = new BracketsManager(adapter);

    console.log('pairs', pairs);
    
    const seeding = pairs.map((pair, i) => ({
      id: i + 1, // manager-side temporary ID
      name: pair.DisplayName, // display name
      player1Id: pair.Player1Id,
      player2Id: pair.Player2Id,
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

    await addPlayedEvent(players, 'Mix');
    await addFirstMixPlayedBadge(players);
  };

  const createMatchsElimination = async (eventId) => {
    const db = getFirestore();

    // Get Event to get fresh pairs
    const eventDocRef = doc(db, `Events/${eventId}`);
    const eventSnap = await getDoc(eventDocRef);
    const pairs = eventSnap.data().Pairs;
    const players = eventSnap.data().PlayersIds;

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
        seedOrdering: ["groups.bracket_optimized"],
      },
      seeding: seeding,
    });
    
    await addPlayedEvent(players, 'Tour');
    await addFirstTourEventPlayedBadge(players);
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

    const seeding = pairs.map((pair) => {
      return pair.id;
    });

    const eliminationStage = await manager.create.stage({
      tournamentId: tournamentId,
      name: "Elimination Stage",
      type: "single_elimination",
      settings: {
        size: pairs.length,
        seedOrdering: ["inner_outer"], // <-- valid now
        balanceByes: true,
      },
      seeding: seeding,
    });

    console.log(eliminationStage);
  };

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

  const deleteAllGamesForEvent = async (eventId) => {
    // DELETE all sub collections "Games" under each tournament document

    const tournamentDataCol = collection(
      db,
      `Events/${eventId}/TournamentData`
    );
    const tournamentDataSnap = await getDocs(tournamentDataCol);
    for (const tournamentDoc of tournamentDataSnap.docs) {
      const gamesCol = collection(
        db,
        `Events/${eventId}/TournamentData/${tournamentDoc.id}/matches`
      );
      const gamesSnap = await getDocs(gamesCol);
      gamesSnap.forEach((gameDoc) => {
        deleteDoc(gameDoc.ref);
      });

      const groupsCol = collection(
        db,
        `Events/${eventId}/TournamentData/${tournamentDoc.id}/groups`
      );
      const groupsSnap = await getDocs(groupsCol);
      groupsSnap.forEach((gameDoc) => {
        deleteDoc(gameDoc.ref);
      });

      const participantsCol = collection(
        db,
        `Events/${eventId}/TournamentData/${tournamentDoc.id}/participants`
      );
      const participantsSnap = await getDocs(participantsCol);
      participantsSnap.forEach((gameDoc) => {
        deleteDoc(gameDoc.ref);
      });

      const stagesCol = collection(
        db,
        `Events/${eventId}/TournamentData/${tournamentDoc.id}/stages`
      );
      const stagesSnap = await getDocs(stagesCol);
      stagesSnap.forEach((gameDoc) => {
        deleteDoc(gameDoc.ref);
      });

      const roundsCol = collection(
        db,
        `Events/${eventId}/TournamentData/${tournamentDoc.id}/rounds`
      );
      const roundsSnap = await getDocs(roundsCol);
      roundsSnap.forEach((gameDoc) => {
        deleteDoc(gameDoc.ref);
      });
    }

    const q = query(
      collection(db, `Events/${eventId}/TournamentData`),
      where("eventId", "==", eventId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref);
    });

    const eventDocRef = doc(db, `Events/${eventId}`);
    await updateDoc(eventDocRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      TournamentId: null,
      PairsCreated: false,
      TournamentStarted: false,
      WonStatisticsUpdated: false
    });
  };

  const deletePairFromEvent = async (eventId, player1Id, player2Id) => {
    const eventDocRef = doc(db, `Events/${eventId}`);
    const eventSnap = await getDoc(eventDocRef);
    const pairs = eventSnap.data().Pairs;

    console.log("pairs", pairs);

    const pairsToKeep = pairs.filter(
      (pair) => pair.Player1Id !== player1Id && pair.Player2Id !== player2Id
    );
    console.log("pairs to keep", pairsToKeep);

    const playersDocToDelete = query(
      collection(db, `Events/${eventId}/Players`),
      where("UserId", "in", [player1Id, player2Id])
    );
    const playersSnap = await getDocs(playersDocToDelete);
    playersSnap.forEach((playerDoc) => {
      deleteDoc(playerDoc.ref);
    });

    const docPlayer1Ref = player1Id.startsWith("guest_")
      ? doc(db, `Events/${eventId}/Players/${player1Id}`)
      : doc(db, `Users/${player1Id}`);
    const docPlayer2Ref = player2Id.startsWith("guest_")
      ? doc(db, `Events/${eventId}/Players/${player2Id}`)
      : doc(db, `Users/${player2Id}`);

    console.log(docPlayer1Ref, docPlayer2Ref);

    await updateDoc(eventDocRef, {
      ModifiedAt: Timestamp.fromDate(new Date()),
      Pairs: pairsToKeep,
      PlayersIds: arrayRemove(player1Id, player2Id),
      PlayersWithPairsIds: arrayRemove(docPlayer1Ref, docPlayer2Ref),
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
    deleteAllGamesForEvent,
    deletePairFromEvent,
  };
};

export default useEventActions;
