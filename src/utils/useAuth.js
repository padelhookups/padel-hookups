import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import firebase from "../firebase-config";

export default function useAuth() {
	const auth = firebase.auth;
	const db = firebase.db;
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Extract user fetching logic into a separate function
	const fetchUserData = useCallback(async (firebaseUser) => {
		if (!firebaseUser) {
			setUser(null);
			return;
		}

		try {
			const userDoc = await getDoc(doc(db, "Users", firebaseUser.uid));
			if (userDoc.exists()) {
				const firestoreUserData = userDoc.data();
				setUser({
					...firebaseUser,
					...firestoreUserData,
					PhotoURL: firestoreUserData.PhotoURL,
					displayName: firebaseUser.displayName || firestoreUserData.Name,
				});
			} else {
				setUser(firebaseUser);
			}
		} catch (error) {
			console.error("Error fetching user from Firestore:", error);
			setUser(firebaseUser);
		}
	}, [db]);

	// Manual refresh function
	const refreshUser = useCallback(async () => {
		const currentUser = auth.currentUser;
		if (currentUser) {
			await currentUser.reload(); // Refresh Firebase Auth user
			await fetchUserData(currentUser);
		}
	}, [auth, fetchUserData]);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				await fetchUserData(firebaseUser);

				if (
					!localStorage.getItem("messagingToken") &&
					!localStorage.getItem("messagingTokenPending")
				) {
					alert(
						"No messaging token found. Starting notification flow..."
					);
					localStorage.setItem("messagingTokenPending", true);
					firebase.startNotificationsFlow();
				}
			} else {
				setUser(null);
			}
			setLoading(false);
		});

		return unsubscribe;
	}, [auth, fetchUserData]);

	return { user, loading, refreshUser };
}
