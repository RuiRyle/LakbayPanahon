// ==========================================
// LAKBAYPANAHON
// AUTHENTICATION AND ROLE GUARD
// ==========================================

import { mountStudentProfile, syncStudentProfileOwner } from "./student-profile.js";
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
let verifiedStudent = null;
const studentAccessListeners = new Set();

export function onVerifiedStudentChange(listener) {
    studentAccessListeners.add(listener);
    if (verifiedStudent) listener(verifiedStudent);
    return () => studentAccessListeners.delete(listener);
}

function setVerifiedStudent(value) {
    if (verifiedStudent === value) return;
    verifiedStudent = value;
    for (const listener of studentAccessListeners) listener(value);
}

function lockProtectedPage() {
    document.body.classList.remove("authenticated");
    document.querySelectorAll(".student-app, .chapter-challenge-page, .teacher-shell").forEach(root => { root.inert = true; });
    setVerifiedStudent(null);
}
function redirectPage(destination) {
    if (guardSuspended || guardRedirecting) return;
    guardRedirecting = true;
    syncStudentProfileOwner(null);
    ++guardGeneration;
    lockProtectedPage();
    hideGuardRecovery();
    if (window.LakbayPageTransition) {
        window.LakbayPageTransition(destination, { replace: true });
        return;
    }
    window.location.replace(destination);
}
function hideGuardRecovery() {
    if (recoveryDialog?.open) recoveryDialog.close();
}
function showGuardRecovery(code) {
    if (!recoveryDialog) {
        recoveryDialog = document.createElement("dialog");
        recoveryDialog.className = "student-auth-recovery";
        recoveryDialog.setAttribute("aria-labelledby", "studentAuthRecoveryTitle");
        recoveryDialog.innerHTML = '<h1 id="studentAuthRecoveryTitle">Unable to check your account</h1><p>Your session is still signed in. Check your connection and try again.</p><button type="button">Try Again</button><a href="login.html">Return to Sign In</a>';
        recoveryDialog.addEventListener("cancel", event => event.preventDefault());
        recoveryDialog.querySelector("button").addEventListener("click", () => checkPageAccess(auth.currentUser));
        document.body.append(recoveryDialog);
    }
    const accessDenied = code === "permission-denied";
    recoveryDialog.querySelector("h1").textContent = accessDenied ? "Unable to confirm account access" : "Unable to check your account";
    recoveryDialog.querySelector("p").textContent = accessDenied
        ? "Try signing in again from the official LakbayPanahon site. If the problem continues, contact an administrator."
        : "Your session is still signed in. Check your connection and try again.";
    if (!recoveryDialog.open) recoveryDialog.showModal();
}
async function rejectAccount(generation, destination = "login.html") {
    // Auth callbacks during sign-out must not start a competing access check.
    rejectingAccount = true;
    stopStudentShellAudio();
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Authentication guard sign-out failed:", error.code || "unknown");
    }
    if (generation === guardGeneration && !guardSuspended) redirectPage(destination);
}
async function checkPageAccess(user) {
    syncStudentProfileOwner(user?.uid || null);
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
        if (requiredRole === "teacher" && snapshot.exists() && snapshot.data().role === "teacher" &&
            ["active", "pending"].includes(snapshot.data().status)) {
            const profile=snapshot.data();
            if(profile.status!=='active'||!profile.teacherVerifiedRevision||user.emailVerified!==true){redirectPage('teacher-application.html');return;}
            const application=await getDocFromServer(doc(db,'teacherApplications',user.uid));
            if(!isCurrent())return;
            const approval=application.data();
            if(approval?.status!=='approved'||approval.revision!==profile.teacherVerifiedRevision||
                approval.emailVerified!==true||approval.email!==user.email){redirectPage('teacher-application.html');return;}
        }
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
        document.querySelectorAll(".student-app, .chapter-challenge-page, .teacher-shell").forEach(root => { root.inert = false; });
        if (profile.role === "student") {
            mountStudentProfile(profile);
            setVerifiedStudent({user, profile});
        }
    } catch (error) {
        if (!isCurrent()) return;
        if (["unauthenticated", "auth/user-token-expired", "auth/invalid-user-token", "auth/user-disabled"].includes(error.code)) {
            await rejectAccount(generation, "login.html?reason=session-expired");
            return;
        }
        if (requiredRole === "student" || requiredRole === "teacher" || requiredRole === "admin") {
            lockProtectedPage();
            showGuardRecovery(error.code);
        } else {
            await rejectAccount(generation);
        }
    }
}
// A restored document must never reuse its old authorization or an in-flight read.
window.addEventListener("pagehide", () => {
    syncStudentProfileOwner(null);
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
