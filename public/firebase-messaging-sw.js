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

  // Avoid duplicate notifications: if the payload has a notification key,
  // the browser will auto-display it, so don't show it again.
  if (payload.notification) {
    if (!payload.notification.icon) {
      console.warn(
        "[firebase-messaging-sw.js] Notification payload has no icon. Set it server-side via webpush.notification.icon (HTTP v1) or notification.icon (Legacy)."
      );
    }
    return;
  }

  const notificationTitle = payload.data?.title || "Background message";
  const notificationOptions = {
    body: payload.data?.body || "",
    // Use provided icon (data.icon) or a valid default. Ensure this file exists in /public.
    icon: payload.data?.icon || "/android-chrome-192x192.png",
    badge: payload.data?.badge || "/android-chrome-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
