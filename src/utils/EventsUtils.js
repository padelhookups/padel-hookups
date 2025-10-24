import { doc, arrayUnion, arrayRemove, collection, deleteDoc, getFirestore, Timestamp, updateDoc, setDoc } from "firebase/firestore";
import useAuth from "../utils/useAuth";

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

    const writes = pairs.map(pair => {
      const newPairRef = doc(collection(db, `Events/${eventId}/Pairs`));
      return setDoc(newPairRef, {
        ...pair
      });
    });
    await Promise.all(writes);

    const eventDocRef = doc(db, `Events/${eventId}`);
    await updateDoc(eventDocRef, {
      PairsCreated: true,
      ModifiedAt: Timestamp.fromDate(new Date()),
    });
  }

  return { registerFromEvent, unregisterFromEvent, createPairsForEvent };
}

export default useEventActions;
