
import {
    app,
    isLocalTestMode
} from "./firebase-config.js";

import {
    getFunctions,
    connectFunctionsEmulator,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";

// ==========================================
// LAKBAYPANAHON
// SHARED AI LEARNING ASSISTANCE CLIENT
// ==========================================

// AI assistance remains disabled outside
// explicit local emulator testing.

export const aiAssistanceLocalOnly =
    isLocalTestMode;

const functions = getFunctions(
    app,
    "asia-southeast1"
);

if (isLocalTestMode && !globalThis.lakbayFunctionsEmulatorConnected) {
    connectFunctionsEmulator(
        functions,
        "127.0.0.1",
        5001
    );
    globalThis.lakbayFunctionsEmulatorConnected = true;

    console.log(
        "LAKBAYPANAHON: AI FUNCTIONS EMULATOR CONNECTED"
    );
}

// ==========================================
// CALLABLE FUNCTION
// ==========================================

const getLearningAssistance = httpsCallable(
    functions,
    "getLearningAssistance"
);

// ==========================================
// REQUEST AI ASSISTANCE
// ==========================================

export async function requestAiAssistance(data) {

    if (!isLocalTestMode) {
        return "Hindi pa available ang AI learning assistance.";
    }

    try {

        const result =
            await getLearningAssistance(data);

        return (
            result.data?.text ||
            result.data?.message ||
            "Wala pang paliwanag na available."
        );

    } catch (error) {

        if (error.code === "functions/unavailable") {
            return "Hindi pa available ang AI learning assistance. Subukan muli sa ibang pagkakataon.";
        }

        if (
            error.code === "functions/unauthenticated" ||
            error.code === "functions/permission-denied"
        ) {
            return "Hindi ma-verify ang iyong local test account. Pakisuri ang iyong emulator sign-in.";
        }

        if (
            error.code === "functions/not-found" ||
            error.code === "functions/invalid-argument"
        ) {
            return "Hindi makita ang tamang aralin para sa AI assistance.";
        }

        console.error(
            "AI assistance request failed:",
            error.code,
            error.message
        );

        return "Hindi makuha ang AI assistance ngayon. Pakisubukang muli mamaya.";
    }
}
