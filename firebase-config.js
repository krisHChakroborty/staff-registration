// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDvZhlDrGdUvc3_0Xe2BXP8d3GZzpNzTTk",
  authDomain: "fwf---employee-s-form.firebaseapp.com",
  projectId: "fwf---employee-s-form",
  storageBucket: "fwf---employee-s-form.appspot.com",
  messagingSenderId: "235171146616",
  appId: "1:235171146616:web:ae2aca819deea9a245768d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth, Firestore, Storage
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };