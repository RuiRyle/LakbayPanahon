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
    getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ==========================================
// GET REQUIRED ROLE FROM PAGE
// ==========================================

const requiredRole =
    document.body.dataset.role;


// ==========================================
// CHECK AUTHENTICATION
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        // ==================================
        // NOT LOGGED IN
        // ==================================

        if (!user) {

            console.log(
                "No authenticated user."
            );

            window.location.replace(
                "login.html"
            );

            return;
        }


        try {

            // ==================================
            // GET USER PROFILE
            // ==================================

            const userReference =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userReference
                );


            // ==================================
            // PROFILE NOT FOUND
            // ==================================

            if (!userSnapshot.exists()) {

                console.error(
                    "User profile not found."
                );


                await signOut(auth);


                window.location.replace(
                    "login.html"
                );


                return;
            }


            const userData =
                userSnapshot.data();


            console.log(
                "Authenticated role:",
                userData.role
            );


            console.log(
                "Account status:",
                userData.status
            );


            // ==================================
            // ACCOUNT MUST BE ACTIVE
            // ==================================

            if (userData.status !== "active") {

                console.warn(
                    "Account is not active."
                );


                await signOut(auth);


                window.location.replace(
                    "login.html"
                );


                return;
            }


            // ==================================
            // CHECK ROLE
            // ==================================

            if (
                !requiredRole ||
                userData.role !== requiredRole
            ) {

                console.warn(
                    "User does not have permission to access this page."
                );


                redirectToCorrectDashboard(
                    userData.role
                );


                return;
            }


            // ==================================
            // ACCESS GRANTED
            // ==================================

            console.log(
                "Access granted."
            );


            // Show page after authentication
            document.body.classList.add(
                "authenticated"
            );

            if (userData.role === "student") mountStudentProfile(userData);


        } catch (error) {

            console.error(
                "Authentication guard error:",
                error
            );


            await signOut(auth);


            window.location.replace(
                "login.html"
            );

        }

    }
);


// ==========================================
// REDIRECT USER TO CORRECT DASHBOARD
// ==========================================

function redirectToCorrectDashboard(role) {

    switch (role) {

        case "student":

            window.location.replace(
                "student-dashboard.html"
            );

            break;


        case "teacher":

            window.location.replace(
                "teacher-dashboard.html"
            );

            break;


        case "admin":

            window.location.replace(
                "admin-dashboard.html"
            );

            break;


        default:

            window.location.replace(
                "login.html"
            );

    }

}
