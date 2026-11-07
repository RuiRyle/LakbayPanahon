import { db } from "./firebase-config.js";
import { doc, getDocFromServer } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { requireProgressionPolicy } from "./progression-policy.js";
// Fetch current configuration; do not substitute a built-in XP rule on failure.
export async function loadProgressionPolicy() {
    const snapshot = await getDocFromServer(doc(db, "learningSettings", "progression"));
    return requireProgressionPolicy(snapshot.exists() ? snapshot.data() : null);
}
