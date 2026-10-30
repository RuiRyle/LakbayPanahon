
import { auth, functions } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";

// Check the deployed function using the current signed-in account.
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        console.log(
            "TEST: No signed-in student. Function not called."
        );
        return;
    }

    console.log(
        "TEST: Signed-in user detected."
    );

    try {
        const testStudentAuth = httpsCallable(
            functions,
            "testStudentAuth"
        );

        const result = await testStudentAuth({});

        console.log(
            "TEST PASSED:",
            result.data
        );

    } catch (error) {
        console.error(
            "TEST FAILED:",
            error.code,
            error.message
        );
    }
});
