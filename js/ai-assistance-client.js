
import { functions } from "./firebase-config.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js";

// ==========================================
// LAKBAYPANAHON
// SHARED AI LEARNING ASSISTANCE CLIENT
// ==========================================

// The backend currently reports AI generation as unavailable.
// Enable this capability only when the deployed implementation supports it.
export const aiAssistanceAvailable = false;

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

    if (!aiAssistanceAvailable) {
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
            return "Hindi ma-verify ang iyong account. Pakisubukang mag-sign in muli.";
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
