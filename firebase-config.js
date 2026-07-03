import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvVzhlDrGdUvc3_0Xe2BXP8d3GZzpNzTk",
  authDomain: "fwf-employee-s-form.firebaseapp.com",
  projectId: "fwf-employee-s-form",

  // IMPORTANT: yahi use karo
  storageBucket: "fwf-employee-s-form.appspot.com",

  messagingSenderId: "235171146616",
  appId: "1:235171146616:web:ae2aca819deea9a245768d"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// IMPORTANT: explicit appspot bucket
const storage = getStorage(app, "gs://fwf-employee-s-form.appspot.com");

export { db, auth, storage };