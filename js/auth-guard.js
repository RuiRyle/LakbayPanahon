// ==========================================
// LAKBAYPANAHON
// AUTHENTICATION AND ROLE GUARD
// ==========================================

import { mountStudentProfile } from "./student-profile.js";
import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    doc,
    getDocFromServer
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ==========================================
// GET REQUIRED ROLE FROM PAGE
// ==========================================

const requiredRole =
    document.body.dataset.role;

function stopStudentShellAudio() {
    if (window.self === window.top) return;
    try { window.parent.LakbayStudentAudio?.stop(); } catch {}
}

// Keep student navigation inside a persistent shell so its audio player survives page changes.
const shouldUseStudentShell = requiredRole === "student" && window.self === window.top;
function redirectToStudentShell() {
    const currentFile = window.location.pathname.split("/").pop();
    const shellUrl = new URL("student-shell.html", window.location.href);
    shellUrl.searchParams.set("route", `${currentFile}${window.location.search}${window.location.hash}`);
    redirectPage(shellUrl.href);
}


// ==========================================
// CHECK AUTHENTICATION
// ==========================================

let guardGeneration = 0;
let guardSuspended = false;
let guardRedirecting = false;
let rejectingAccount = false;
let recoveryDialog;
function lockProtectedPage() {
    document.body.classList.remove("authenticated");
    document.querySelectorAll(".student-app, .chapter-challenge-page").forEach(root => { root.inert = true; });
}
function redirectPage(destination) {
    if (guardSuspended || guardRedirecting) return;
    guardRedirecting = true;
    ++guardGeneration;
    lockProtectedPage();
    hideGuardRecovery();
    window.location.replace(destination);
}
function hideGuardRecovery() {
    if (recoveryDialog?.open) recoveryDialog.close();
}
function showGuardRecovery() {
    if (!recoveryDialog) {
        recoveryDialog = document.createElement("dialog");
        recoveryDialog.className = "student-auth-recovery";
        recoveryDialog.setAttribute("aria-labelledby", "studentAuthRecoveryTitle");
        recoveryDialog.innerHTML = '<h1 id="studentAuthRecoveryTitle">Unable to check your account</h1><p>Your session is still signed in. Check your connection and try again.</p><button type="button">Try Again</button><a href="login.html">Return to Sign In</a>';
        recoveryDialog.addEventListener("cancel", event => event.preventDefault());
        recoveryDialog.querySelector("button").addEventListener("click", () => checkPageAccess(auth.currentUser));
        document.body.append(recoveryDialog);
    }
    if (!recoveryDialog.open) recoveryDialog.showModal();
}
async function rejectAccount(generation) {
    // Auth callbacks during sign-out must not start a competing access check.
    rejectingAccount = true;
    stopStudentShellAudio();
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Authentication guard sign-out error:", error);
    }
    if (generation === guardGeneration && !guardSuspended) redirectPage("login.html");
}
async function checkPageAccess(user) {
    if (guardSuspended || guardRedirecting || rejectingAccount) return;
    const generation = ++guardGeneration;
    const isCurrent = () => !guardSuspended && !guardRedirecting &&
        generation === guardGeneration && auth.currentUser?.uid === user?.uid;
    lockProtectedPage();
    hideGuardRecovery();
    if (!user) {
        stopStudentShellAudio();
        redirectPage("login.html");
        return;
    }
    try {
        // A previously cached active profile cannot authorize a protected page.
        const snapshot = await getDocFromServer(doc(db, "users", user.uid));
        if (!isCurrent()) return;
        if (!snapshot.exists() || snapshot.data().status !== "active") {
            await rejectAccount(generation);
            return;
        }
        const profile = snapshot.data();
        if (!requiredRole || profile.role !== requiredRole) {
            if (profile.role !== "student") stopStudentShellAudio();
            redirectToCorrectDashboard(profile.role);
            return;
        }
        document.body.classList.add("authenticated");
        document.querySelectorAll(".student-app, .chapter-challenge-page").forEach(root => { root.inert = false; });
        if (profile.role === "student") mountStudentProfile(profile);
    } catch (error) {
        if (!isCurrent()) return;
        console.error("Authentication guard error:", error);
        if (requiredRole === "student") {
            lockProtectedPage();
            showGuardRecovery();
        } else {
            await rejectAccount(generation);
        }
    }
}
// A restored document must never reuse its old authorization or an in-flight read.
window.addEventListener("pagehide", () => {
    guardSuspended = true;
    ++guardGeneration;
    lockProtectedPage();
    hideGuardRecovery();
});
window.addEventListener("pageshow", event => {
    if (!event.persisted && !guardSuspended) return;
    guardSuspended = false;
    guardRedirecting = false;
    rejectingAccount = false;
    if (shouldUseStudentShell) redirectToStudentShell();
    else checkPageAccess(auth.currentUser);
});
lockProtectedPage();
if (shouldUseStudentShell) redirectToStudentShell();
else onAuthStateChanged(auth, () => checkPageAccess(auth.currentUser));

// ==========================================
// REDIRECT USER TO CORRECT DASHBOARD
// ==========================================

function redirectToCorrectDashboard(role) {

    switch (role) {

        case "student":

            redirectPage(
                window.self === window.top ? "student-shell.html" : "student-dashboard.html"
            );

            break;


        case "teacher":

            redirectPage(
                "teacher-dashboard.html"
            );

            break;


        case "admin":

            redirectPage(
                "admin-dashboard.html"
            );

            break;


        default:

            redirectPage(
                "login.html"
            );

    }

}
