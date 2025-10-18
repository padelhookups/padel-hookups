import { doc, arrayUnion, arrayRemove, deleteDoc, getFirestore, Timestamp, updateDoc, setDoc } from "firebase/firestore";
import useAuth from "../utils/useAuth";

const useEventActions = () => {
  const { user } = useAuth();
  const db = getFirestore();

  const registerFromEvent = async (eventSelectedId) => {
    await setDoc(doc(db, `Events/${eventSelectedId}/Players/`, user.uid), {
      UserId: doc(db, `Users/${user.uid}`),
      EventId: doc(db, `Events/${eventSelectedId}`),
      CreatedAt: Timestamp.fromDate(new Date()),
    });

    await updateDoc(doc(db, `Events/${eventSelectedId}`), {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersIds: arrayUnion(user.uid)
    });
  }

  const unregisterFromEvent = async (eventSelectedId) => {
    await deleteDoc(doc(db, `Events/${eventSelectedId}/Players/`, user.uid));

    await updateDoc(doc(db, `Events/${eventSelectedId}`), {
      ModifiedAt: Timestamp.fromDate(new Date()),
      PlayersIds: arrayRemove(user.uid)
    });
  }

  return { registerFromEvent, unregisterFromEvent };
}

export default useEventActions;
