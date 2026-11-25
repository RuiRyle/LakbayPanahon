import {appAlert} from './app-dialog.js';
import { navigatePage } from './route-navigation.js';
// ==========================================
// LAKBAYPANAHON
// LOGOUT
// ==========================================

import {
    auth
} from "./firebase-config.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { clearStudentSessionData, clearQuizRecovery } from "./student-session-storage.js";

function clearDepartingSession(uid) {
    try { clearStudentSessionData(window.sessionStorage, uid); } catch {}
    clearQuizRecovery(uid);
}

let previousUid = auth.currentUser?.uid || null;
onAuthStateChanged(auth, user => {
    const uid = user?.uid || null;
    if (previousUid && previousUid !== uid) clearDepartingSession(previousUid);
    previousUid = uid;
});

let loggingOut = false;

document.addEventListener("DOMContentLoaded", () => {

    const logoutButtons =
        document.querySelectorAll(".logout-button");


    logoutButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                if (loggingOut) return;
                loggingOut = true;
                const uid = auth.currentUser?.uid;

                // Prevent multiple clicks
                button.disabled = true;

                const originalChildren = [...button.childNodes];

                button.textContent =
                    "Logging out...";


                try {

                    await signOut(auth);
                    clearDepartingSession(uid);

                    try { window.parent?.LakbayStudentAudio?.stop(); } catch {}


                    navigatePage('login.html', { replace: true });


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error.code || "unknown"
                    );


                    button.disabled = false;
                    loggingOut = false;
                    button.replaceChildren(...originalChildren);


                    (await appAlert(
                        "Unable to log out. Please try again."
                    ));

                }

            }
        );

    });

});
