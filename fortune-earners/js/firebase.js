// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNZwNeBOreWcY4a8zsIbLJo1p7hxATbHI",
  authDomain: "fortune-earners.firebaseapp.com",
  projectId: "fortune-earners",
  storageBucket: "fortune-earners.firebasestorage.app",
  messagingSenderId: "986483828529",
  appId: "1:986483828529:web:c3be96094fead82ecdf210",
  measurementId: "G-CD91T688BX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Export
export { auth, db };