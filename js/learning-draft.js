import { auth, db } from "./firebase-config.js";
import { doc, getDocFromServer, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const canonicalDraft = value => Array.isArray(value) ? value.map(canonicalDraft)
    : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalDraft(value[key])])) : value;
const draftSignature = state => JSON.stringify(canonicalDraft(state));

// Drafts store activity UI state; awarded completions, grades and rewards use separate records.
export function learningDraft(kind, chapterId, missionId, status) {
    const uid = auth.currentUser?.uid;
    if (globalThis.__lakbayExplorationPreview===true) {
        const key='previewDraft:'+uid+':'+kind+':'+(missionId||chapterId);
        let closed=false;
        const current=()=>!closed&&auth.currentUser?.uid===uid;
        return {
            async read(){if(!current())return null;try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}},
            save(state){if(!current())return;try{sessionStorage.setItem(key,JSON.stringify(state));status.textContent='Preview place saved in this tab only.';}catch{status.textContent='Preview place could not be saved in this tab.';}},
            async clear(){if(!current())return;sessionStorage.removeItem(key);closed=true;},
            close(){closed=true;}
        };
    }
    const reference = doc(db, "studentLearningDrafts", `${uid}_${kind}_${missionId || chapterId}`);
    let pending = Promise.resolve(), closed = false, abandoned = false, revision = 0;
    let latestSignature = null;
    const current = () => !closed && auth.currentUser?.uid === uid;
    let unsaved = false, saveFailed = false;
    const warnBeforeLeaving = event => {
        if (!unsaved || !current()) return;
        event.preventDefault();
        event.returnValue = "";
    };
    const showConnectionStatus = () => {
        if (!unsaved || !current() || saveFailed) return;
        status.textContent = globalThis.navigator?.onLine === false
            ? "You are offline. Your latest place has not been saved yet. Keep this page open; saving will resume when connected."
            : "Saving your place...";
    };
    const setUnsaved = value => {
        if (unsaved === value) return;
        unsaved = value;
        if (value) {
            globalThis.addEventListener?.("beforeunload", warnBeforeLeaving);
            globalThis.addEventListener?.("offline", showConnectionStatus);
            globalThis.addEventListener?.("online", showConnectionStatus);
        } else {
            globalThis.removeEventListener?.("beforeunload", warnBeforeLeaving);
            globalThis.removeEventListener?.("offline", showConnectionStatus);
            globalThis.removeEventListener?.("online", showConnectionStatus);
        }
    };
    const api = {
        async read() {
            const snapshot = await getDocFromServer(reference);
            if (!current() || !snapshot.exists()) return null;
            const state = snapshot.data().state;
            latestSignature = draftSignature(state);
            status.textContent = "Your place is saved. You can return after refreshing.";
            return state;
        },
        save(state) {
            if (!current()) return;
            const signature = draftSignature(state);
            if (signature === latestSignature) return;
            latestSignature = signature;
            saveFailed = false;
            setUnsaved(true);
            const savingRevision = ++revision;
            const copy = JSON.parse(JSON.stringify(state));
            showConnectionStatus();
            if (status.retryButton) { status.retryButton.hidden = true; status.retryButton.disabled = true; }
            pending = pending.catch(() => {}).then(async () => {
                // A newer queued state contains the current activity state. Do not
                // spend a write on an older snapshot that has not started saving.
                if (!current() || savingRevision !== revision) return;
                try {
                    await setDoc(reference, { userId: uid, kind, chapterId, missionId, state: copy, updatedAt: serverTimestamp() });
                    if (current() && savingRevision === revision) {
                        setUnsaved(false);
                        status.textContent = "Your place is saved. You can return after refreshing.";
                    }
                } catch (error) {
                    if (current() && savingRevision === revision) {
                        latestSignature = null;
                        saveFailed = true;
                        const limited = /resource-exhausted/.test(String(error?.code || "")) || /\b429\b/.test(String(error?.message || ""));
                        status.textContent = limited
                            ? "Your latest place could not be saved because the learning service has reached its usage limit. Keep this page open and retry saving later."
                            : "Your latest place could not be saved. Keep this page open and retry saving.";
                        if (status.retryButton) {
                            status.retryButton.hidden = false;
                            status.retryButton.disabled = false;
                            status.retryButton.onclick = () => { if (!status.retryButton.disabled && current()) api.save(copy); };
                        }
                    }
                }
            });
        },
        async clear() {
            closed = true;
            setUnsaved(false);
            if (status.retryButton) status.retryButton.hidden = true;
            await pending;
            if (abandoned || auth.currentUser?.uid !== uid) return;
            await deleteDoc(reference);
        },
        close() { closed = true; abandoned = true; setUnsaved(false); if (status.retryButton) status.retryButton.hidden = true; }
    };
    return api;
}

export function draftStatus(container) {
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "text-button";
    retry.textContent = "Retry Saving Your Place";
    retry.hidden = true;
    status.retryButton = retry;
    container.prepend(status, retry);
    return status;
}

export function restartControl(container, label, restart) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.textContent = label;
    button.hidden = true;
    button.addEventListener("click", async () => {
        if (button.disabled || !window.confirm("Start this activity over? Your unfinished answers will reset. Completed missions and earned rewards will stay saved.")) return;
        button.disabled = true;
        container.inert = true;
        try { await restart(); }
        finally { container.inert = false; button.disabled = false; }
    });
    container.prepend(button);
    return button;
}
