import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvZhlDrGdUvc3_0Xe2BXP8d3GZzpNzTTk",
  authDomain: "fwf---employee-s-form.firebaseapp.com",
  projectId: "fwf---employee-s-form",
  storageBucket: "fwf---employee-s-form.firebasestorage.app",
  messagingSenderId: "235171146616",
  appId: "1:235171146616:web:f8f07f188fe8eca845768d"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };