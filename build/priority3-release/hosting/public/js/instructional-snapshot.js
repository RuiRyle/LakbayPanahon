import {auth} from "./firebase-config.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {createContentCache} from "./content-cache.js";

let storage = null;
try { storage = window.sessionStorage; } catch {}
const cache = createContentCache({storage});
let identity;
onAuthStateChanged(auth, user => {
    const uid = user?.uid || null;
    if (identity !== undefined && uid !== identity) cache.clear();
    identity = uid;
});
export function instructionalSnapshot(key, load) {
    return cache.read(auth.currentUser?.uid || null, key, load);
}
export function refreshInstructionalContent() { cache.clear(); }
