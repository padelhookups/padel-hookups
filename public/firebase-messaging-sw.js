/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
importScripts("https://www.gstatic.com/firebasejs/9.17.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging-compat.js");

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBOW8pVZPA8nlU9xcwjnNTxe7dbqCBxub8",
  authDomain: "padel-hookups.firebaseapp.com",
  projectId: "padel-hookups",
  storageBucket: "padel-hookups.firebasestorage.app",
  messagingSenderId: "976843288333",
  appId: "1:976843288333:web:d6e147321c6c37dd3a4a44",
  measurementId: "G-1BYH7VXPSE"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message", payload);

  const notificationTitle = payload.notification?.title || "Background message";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/android-chrome-192x192", // adjust path if needed
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
