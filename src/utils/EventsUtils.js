import { doc, arrayUnion, arrayRemove, deleteDoc, getFirestore, Timestamp, updateDoc, setDoc } from "firebase/firestore";
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

  return { registerFromEvent, unregisterFromEvent };
}

export default useEventActions;
