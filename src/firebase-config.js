// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
	apiKey: "AIzaSyBOW8pVZPA8nlU9xcwjnNTxe7dbqCBxub8",
	authDomain: "padel-hookups.firebaseapp.com",
	projectId: "padel-hookups",
	storageBucket: "padel-hookups.firebasestorage.app",
	messagingSenderId: "976843288333",
	appId: "1:976843288333:web:d6e147321c6c37dd3a4a44",
	measurementId: "G-1BYH7VXPSE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Helper to wait for the auth state to resolve to a user (or null)
function getCurrentUser() {
	return new Promise((resolve) => {
		const unsub = onAuthStateChanged(auth, (u) => {
			unsub();
			resolve(u);
		});
	});
}

// Try to open browser/site notification settings where possible
function openNotificationSettings() {
	if (typeof window === "undefined") return;
	const ua = navigator.userAgent;
	const origin = window.location.origin;

	// Chrome/Edge (may be blocked by the browser, but worth attempting)
	if (/Chrome|Chromium|Edg\//.test(ua)) {
		window.open(
			`chrome://settings/content/siteDetails?site=${encodeURIComponent(origin)}`,
			"_blank"
		);
		return;
	}

	// Firefox
	if (/Firefox\//.test(ua)) {
		window.open("about:preferences#privacy", "_blank");
		return;
	}

	// Safari (no direct deep link)
	if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
		alert(
			"In Safari, go to Settings > Websites > Notifications and allow this site."
		);
		return;
	}

	// Fallback
	alert(
		"Please enable notifications for this site in your browser/site settings."
	);
}

// When user clicks a "Try again" button in your UI, call this.
// If denied, we guide them to settings; otherwise we prompt.
function reRequestNotifications() {
	if (typeof window === "undefined" || !("Notification" in window)) return;
	if (Notification.permission === "denied") {
		alert(
			"Notifications are blocked. Enable them in your browser/site settings, then return to this page."
		);
		openNotificationSettings();
	} else {
		requestPermission();
	}
}

// Keep an eye on permission changes and auto-fetch token when granted
function listenPermissionChanges() {
	if (typeof navigator === "undefined" || !navigator.permissions?.query)
		return;
	try {
		navigator.permissions
			.query({ name: "notifications" })
			.then((status) => {
				status.onchange = () => {
					if (status.state === "granted") {
						_getToken();
					}
				};
			});
	} catch {
		// no-op
	}
}
listenPermissionChanges();

function requestPermission() {
	console.log("Requesting permission...");
	return Notification.requestPermission().then((permission) => {
		if (permission === "granted") {
			alert("Notification permission granted.");
			_getToken();
			return true;
		} else {
			alert("Notification permission denied.");
			return false;
		}
	});
}

const FCM_PERMISSION_FLAG = "fcmPermissionRequested";
if (typeof window !== "undefined" && "Notification" in window) {
	if (Notification.permission === "granted") {
		alert("Notification permission already granted.");
		_getToken();
	} else if (
		Notification.permission === "default" &&
		!localStorage.getItem(FCM_PERMISSION_FLAG)
	) {
		alert("Requesting notification permission for the first time.");
		localStorage.setItem(FCM_PERMISSION_FLAG, "1");
		requestPermission();
	} else if (Notification.permission === "denied") {
		alert(
			"Notifications are blocked. Enable them in your browser/site settings."
		);
		openNotificationSettings();
	}
}

function _getToken() {
	getToken(messaging, {
		vapidKey:
			"BHYKZ38EX_HHlSbVXMlG74Kob1miCVrD4tl5UdPWTTOwCYfZIAFiKcxKqzkc8a_KVjHusQaEsqhi__pEOI3LD24"
	})
		.then(async (currentToken) => {
			if (currentToken) {
				alert("Current token for client: " + currentToken);
				// Send the token to firebase document or server
				try {
					const user = await getCurrentUser();
					if (!user) {
						console.warn("No authenticated user; skipping token save.");
						return;
					}
					await setDoc(
						doc(db, `Users/${user.uid}`),
						{
							Devices: {
								[currentToken]: {
									Token: currentToken,
									UserAgent: navigator.userAgent,
									UpdatedAt: serverTimestamp()
								}
							}
						},
						{ merge: true }
					);
					console.log("FCM token saved to Firestore.");
				} catch (e) {
					console.error("Failed to save FCM token to Firestore:", e);
				}
			} else {
				// Show permission request UI
				console.log(
					"No registration token available. Request permission to generate one."
				);
				// ...
			}
		})
		.catch((err) => {
			console.log("An error occurred while retrieving token. ", err);
			// ...
		});
}

const onMessageListener = () =>
	new Promise((resolve) => {
		onMessage(messaging, (payload) => {
			resolve(payload);
		});
	});

// Export the app so it can be used in other files
// Assign the object to a variable before exporting
const firebaseConfigExport = {
	app,
	auth: auth,
	db: db,
	messaging: messaging,
	onMessageListener: onMessageListener,
	requestPermission: requestPermission,
	reRequestNotifications: reRequestNotifications,
	openNotificationSettings: openNotificationSettings
};
export default firebaseConfigExport;
