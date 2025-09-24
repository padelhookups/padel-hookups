import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import firebase from "../firebase-config";

export default function useAuth() {
	const auth = firebase.auth;
	const db = firebase.db;
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			// console.log("Auth state changed:", firebaseUser);

			if (firebaseUser) {
				try {
					// Get user data from Firestore
					const userDoc = await getDoc(
						doc(db, "Users", firebaseUser.uid)
					);
					if (userDoc.exists()) {
						// Merge Firebase Auth user with Firestore user data
						const firestoreUserData = userDoc.data();
						setUser({ ...firebaseUser, ...firestoreUserData });
					} else {
						// If no Firestore document exists, just use Firebase Auth user
						setUser(firebaseUser);
					}

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
				} catch (error) {
					console.error("Error fetching user from Firestore:", error);
					// Fallback to Firebase Auth user if Firestore fetch fails
					setUser(firebaseUser);
				}
			} else {
				setUser(null);
			}
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	return { user, loading };
}
