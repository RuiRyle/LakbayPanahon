
import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFunctions,
    connectFunctionsEmulator,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";

import { app } from "./firebase-config.js";

// Connect ONLY to the local Functions emulator.
const functions = getFunctions(app, "asia-southeast1");

connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    5001
);

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
