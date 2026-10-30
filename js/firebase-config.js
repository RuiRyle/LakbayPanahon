
import { initializeExplorationPreview } from "./exploration-preview.js";
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import {
    getFunctions
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";

// ==========================================
// LAKBAYPANAHON FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDeit1u8jk5xizYslUCqx7MPaSZNDoY0AA",
    authDomain: "lakbaypanahon-1797e.firebaseapp.com",
    projectId: "lakbaypanahon-1797e",
    storageBucket: "lakbaypanahon-1797e.firebasestorage.app",
    messagingSenderId: "831214660993",
    appId: "1:831214660993:web:aeff983c8b3182358e4c80",
    measurementId: "G-7N6LJJTMWT"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "asia-southeast1");
initializeExplorationPreview();

// Local development and hosted pages use the same Firebase project.
// Legacy localTest URL parameters and session flags no longer affect routing.
export { app, auth, db, functions };
