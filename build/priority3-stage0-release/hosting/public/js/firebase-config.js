
import { initializeExplorationPreview } from "./exploration-preview.js";
import {firebaseEnvironment} from './firebase-environment.js';
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore, initializeFirestore, connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import {
    getFunctions, connectFunctionsEmulator
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

const emulator = firebaseEnvironment?.mode === 'emulator';
if (emulator && (!['localhost','127.0.0.1'].includes(location.hostname) || firebaseEnvironment.projectId !== 'demo-lakbay-local')) throw Error('Emulators are restricted to the dedicated local launcher.');
const app = initializeApp(emulator ? {apiKey:'local-emulator-key',projectId:'demo-lakbay-local',authDomain:'localhost'} : firebaseConfig);

const auth = getAuth(app);
// The loopback preview uses long polling so page changes do not depend on a
// streaming emulator connection surviving the browser's navigation lifecycle.
const db = emulator ? initializeFirestore(app,{experimentalForceLongPolling:true}) : getFirestore(app);
const functions = getFunctions(app, "asia-southeast1");
if(emulator){
    connectAuthEmulator(auth,'http://127.0.0.1:9099');
    connectFirestoreEmulator(db,'127.0.0.1',8180);
    connectFunctionsEmulator(functions,'127.0.0.1',5001);
    const mark=()=>{const banner=document.createElement('div');banner.textContent='LOCAL EMULATOR — separate test accounts and data. AI functions are not running.';banner.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:100000;padding:6px;background:#e8c77e;color:#10243f;text-align:center;font:12px Arial;visibility:visible';document.body.append(banner);};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark,{once:true});else mark();
}
initializeExplorationPreview();

// Normal local previews and hosted pages use the main project. Only the dedicated emulator server opts in.
// Legacy localTest URL parameters and session flags no longer affect routing.
export { app, auth, db, functions };
