// ==========================================
// LAKBAYPANAHON
// LOGOUT
// ==========================================

import {
    auth
} from "./firebase-config.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {

    const logoutButtons =
        document.querySelectorAll(".logout-button");


    logoutButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                // Prevent multiple clicks
                button.disabled = true;

                const originalText =
                    button.textContent;

                button.textContent =
                    "Logging out...";


                try {

                    await signOut(auth);

                    console.log(
                        "User logged out successfully."
                    );


                    // Dashboard pages are inside /pages/
                    window.location.replace(
                        "login.html"
                    );


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    button.disabled = false;

                    button.textContent =
                        originalText;


                    alert(
                        "Unable to log out. Please try again."
                    );

                }

            }
        );

    });

});