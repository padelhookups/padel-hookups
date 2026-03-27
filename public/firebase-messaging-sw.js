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

// Ensure the service worker activates immediately so background messages are never missed.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

// Handle background push messages.
// Always call showNotification so messages are reliably displayed on mobile.
// On Android, FCM may fire onBackgroundMessage without auto-displaying the notification
// even when a `notification` field is present, so we must handle display ourselves.
// For truly duplicate-free behaviour, send data-only messages from your server
// (omit the `notification` field in the FCM payload).
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message", payload);

  const title = payload.notification?.title || payload.data?.title || "New message";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: payload.notification?.icon || payload.data?.icon || "/android-chrome-192x192.png",
    badge: "/android-chrome-96x96.png",
    data: {
      url: payload.notification?.click_action || payload.data?.click_action || "/",
    },
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
