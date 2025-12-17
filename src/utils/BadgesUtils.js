// src/utils/useBadgesActions.js
import { arrayUnion, doc, getFirestore, writeBatch } from "firebase/firestore";
import { useSelector, useDispatch } from "react-redux";
import { selectBadges, fetchBadges, selectBadgesLoading } from "../redux/slices/badgesSlice";

const useBadgesActions = () => {
  const db = getFirestore();
  const dispatch = useDispatch();
  const badges = useSelector(selectBadges); // ← Agora está num hook válido

  const addFirstMixPlayedBadge = async (playerRefs) => {
    const batch = writeBatch(db);

    if (!badges || badges.length === 0) {
      await dispatch(fetchBadges({ db, forceRefresh: false })).unwrap();;
    }

    const firstMixBadge = badges.find((badge) => badge.Name === "Primeiro Mix");

    playerRefs.forEach((playerRef) => {
      if (playerRef.path.startsWith("Users/")) {
        batch.update(playerRef, {
          Badges: arrayUnion(doc(db, `Badges/${firstMixBadge.id}`)),
          LastModifiedAt: new Date(),
        });
      }
    });

    await batch.commit();
  };

  const addFirstTourEventPlayedBadge = async (playerRefs) => {
    const batch = writeBatch(db);

    if (!badges || badges.length === 0) {
      await dispatch(fetchBadges({ db, forceRefresh: false })).unwrap();;
    }

    const firstTourBadge = badges.find((badge) => badge.Name === "Primeiro Torneio");

    playerRefs.forEach((playerRef) => {
      if (playerRef.path.startsWith("Users/")) {
        batch.update(playerRef, {
          Badges: arrayUnion(doc(db, `Badges/${firstTourBadge.id}`)),
          LastModifiedAt: new Date(),
        });
      }
    });

    await batch.commit();
  };

  return { addFirstMixPlayedBadge, addFirstTourEventPlayedBadge };
};

export default useBadgesActions;
