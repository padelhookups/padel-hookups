// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
	getFirestore,
	doc,
	setDoc,
	serverTimestamp
} from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig, fetchAndActivate } from "firebase/remote-config";
import { getStorage } from "firebase/storage";

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
const remoteConfig = getRemoteConfig(app);
const storage = getStorage(app);
console.log(process.env.NODE_ENV);

export async function initRemoteConfig() {
	try {
		await fetchAndActivate(remoteConfig);
	} catch (err) {
		console.error("RC fetch error:", err);
	}
}

remoteConfig.settings = {
	minimumFetchIntervalMillis:
		process.env.NODE_ENV === "production" ? 3600000 : 0,
	fetchTimeoutMillis: 2000, // optional but recommended
};

remoteConfig.defaultConfig = {
	ShowBadges: false,
	ForceRefresh: 0,
};

if (process.env.NODE_ENV === "production") {
	getPerformance(app);
}
// Dedup guards for token writes
let lastSavedToken = null;
let isSavingToken = false;
let messagingToken = localStorage.getItem("messagingToken") || null;

// Helper to wait for the auth state to resolve to a user (or null)
function getCurrentUser() {
	return new Promise((resolve) => {
		const unsub = onAuthStateChanged(auth, (u) => {
			unsub();
			resolve(u);
		});
	});
}

// Save token to Firestore without overwriting other devices
async function saveFcmToken(currentToken) {
	if (!currentToken) return;
	if (isSavingToken) return;
	isSavingToken = true;
	try {
		const user = await getCurrentUser();
		if (!user) {
			alert("No authenticated user; skipping token save.");
			return;
		}
		const userRef = doc(db, `Users/${user.uid}`);

		// Try to update the specific device entry
		try {
			await setDoc(
				userRef,
				{
					Devices: {
						[currentToken]: {
							SendNotifications: true,
							Token: currentToken,
							Platform: navigator.platform,
							UpdatedAt: new Date()
						}
					}
				},
				{ merge: true }
			);
			localStorage.setItem("messagingTokenPending", false);
			localStorage.setItem("messagingToken", currentToken);
			messagingToken = currentToken;
			lastSavedToken = currentToken;
		} catch (e) {
			console.error("Error saving FCM token:", e);
			alert("Error saving FCM token:");
			return;
		}


		console.log("FCM token saved to Firestore.");
	} catch (e) {
		console.error("Failed to save FCM token to Firestore:", e);
	} finally {
		isSavingToken = false;
	}
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

// Keep an eye on permission changes and auto-fetch token when granted
/* function listenPermissionChanges() {
	alert(navigator.platform);
	if (typeof navigator === "undefined" || !navigator.permissions?.query)
		return;
	try {
		navigator.permissions
			.query({ name: "notifications" })
			.then((status) => {
				status.onchange = async () => {
					const user = await getCurrentUser();
					alert("user:", user.uid);
					if (status.state === "granted" && user) {
						alert("Asking for token...");
						_getToken();
					}
				};
			});
	} catch {
		// no-op
	}
}
listenPermissionChanges(); */

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

async function startNotificationsFlow() {
	const FCM_PERMISSION_FLAG = "fcmPermissionRequested";
	if (typeof window !== "undefined" && "Notification" in window) {
		const user = await getCurrentUser();
		if (Notification.permission === "granted" && user) {
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
}

async function _getToken() {
	const registration = await navigator.serviceWorker.ready;

	getToken(messaging, {
		vapidKey:
			"BHYKZ38EX_HHlSbVXMlG74Kob1miCVrD4tl5UdPWTTOwCYfZIAFiKcxKqzkc8a_KVjHusQaEsqhi__pEOI3LD24",
		serviceWorkerRegistration: registration,
	})
		.then(async (currentToken) => {
			if (currentToken) {
				alert("Current token for client: " + currentToken);
				console.log("Current token for client: " + currentToken);
				await saveFcmToken(currentToken);
			} else {
				console.log(
					"No registration token available. Request permission to generate one."
				);
			}
		})
		.catch((err) => {
			console.log("An error occurred while retrieving token. ", err);
		});
}

const onMessageListener = () =>
	new Promise((resolve) => {
		onMessage(messaging, (payload) => {
			alert("Message received. ", payload.notification.body);
			resolve(payload);
		});
	});

// Export the app so it can be used in other files
// Assign the object to a variable before exporting
const firebaseConfigExport = {
	app,
	auth: auth,
	db: db,
	storage: storage,
	messaging: messaging,
	messagingToken: messagingToken,
	onMessageListener: onMessageListener,
	requestPermission: requestPermission,
	openNotificationSettings: openNotificationSettings,
	startNotificationsFlow: startNotificationsFlow
};
export default firebaseConfigExport;
