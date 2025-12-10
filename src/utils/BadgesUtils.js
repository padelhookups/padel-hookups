// src/utils/useBadgesActions.js
import { arrayUnion, doc, getFirestore, writeBatch } from "firebase/firestore";
import { useSelector } from "react-redux";
import { selectBadges } from "../redux/slices/badgesSlice";

const useBadgesActions = () => {
  const db = getFirestore();
  const badges = useSelector(selectBadges); // ← Agora está num hook válido

  const addFirstMixPlayedBadge = async (playerRefs) => {
    const batch = writeBatch(db);

    const firstMixBadge = badges.find((badge) => badge.Name === "Primeiro Mix");

    playerRefs.forEach((playerRef) => {
      batch.update(playerRef, {
        Badges: arrayUnion(doc(db, `Badges/${firstMixBadge.id}`)),
        LastModifiedAt: new Date(),
      });
    });

    await batch.commit();
  };

  return { addFirstMixPlayedBadge };
};

export default useBadgesActions;
