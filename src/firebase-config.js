// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOW8pVZPA8nlU9xcwjnNTxe7dbqCBxub8",
  authDomain: "padel-hookups.firebaseapp.com",
  projectId: "padel-hookups",
  storageBucket: "padel-hookups.firebasestorage.app",
  messagingSenderId: "976843288333",
  appId: "1:976843288333:web:d6e147321c6c37dd3a4a44",
  measurementId: "G-1BYH7VXPSE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

console.log("Firebase initialized with config:", firebaseConfig);
getToken(messaging, { vapidKey: "OZyIyrpaVhndpHd_QVevPHs_q2E9dxN5-8fuhUJ252E" })
  .then((currentToken) => {
    if (currentToken) {
      console.log("Current token for client: ", currentToken);
      
      // Send the token to your server and update the UI if necessary
      // ...
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
};
export default firebaseConfigExport;
