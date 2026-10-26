
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

// ==========================================
// EXPLICIT LOCAL TESTING MODE
// ==========================================

// Only enable local emulators when the URL contains
// ?localTest=1 or &localTest=1.
//
// Example:
// http://127.0.0.1:5500/pages/login.html?localTest=1
//
// This flag is for development testing only.

const isLocalHost = [
    "localhost",
    "127.0.0.1"
].includes(window.location.hostname);

// Remember local testing mode across page navigation.
// This setting is restricted to localhost / 127.0.0.1.

const localTestParameter =
    new URLSearchParams(window.location.search)
        .get("localTest");

if (isLocalHost) {
    if (localTestParameter === "1") {
        sessionStorage.setItem(
            "lakbayLocalTest",
            "1"
        );
    } else if (localTestParameter === "0") {
        sessionStorage.removeItem(
            "lakbayLocalTest"
        );
    }
}

export const isLocalTestMode =
    isLocalHost &&
    sessionStorage.getItem("lakbayLocalTest") === "1";

if (isLocalTestMode) {
    connectAuthEmulator(
        auth,
        "http://127.0.0.1:9099",
        { disableWarnings: true }
    );

    connectFirestoreEmulator(
        db,
        "127.0.0.1",
        8080
    );

    console.log(
        "LAKBAYPANAHON: LOCAL FIREBASE EMULATOR MODE"
    );
}

export {
    app,
    auth,
    db
};
