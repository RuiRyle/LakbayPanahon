// Optional browser storage must not interrupt a quiz or hide a confirmed save.
// Firestore drafts are the durable source of unfinished learning state.
export const studentTabStorage = {
    getItem(key) { try { return globalThis.sessionStorage.getItem(key); } catch { return null; } },
    setItem(key, value) { try { globalThis.sessionStorage.setItem(key, value); return true; } catch { return false; } },
    removeItem(key) { try { globalThis.sessionStorage.removeItem(key); return true; } catch { return false; } }
};

// Remove only the departing account's tab-local learning state. Firebase owns
// its authentication storage; browser preferences and saved Firestore data stay intact.
export function clearStudentSessionData(storage, uid) {
    if (!storage || typeof uid !== 'string' || !uid) return;
    const ownedPrefixes = ['missionQuiz:', 'missionQuizSet:', 'previewDraft:']
        .map(prefix => prefix + uid + ':');
    let keys;
    try {
        keys = Array.from({length: storage.length}, (_, index) => storage.key(index));
    } catch { return; }
    for (const key of keys) {
        if (typeof key !== 'string') continue;
        let owned = ownedPrefixes.some(prefix => key.startsWith(prefix));
        if (key.startsWith('lakbay-content-v1:')) {
            try {
                const scope = JSON.parse(key.slice('lakbay-content-v1:'.length));
                owned = Array.isArray(scope) && scope[0] === uid;
            } catch { /* Unrecognized keys are left alone. */ }
        }
        if (owned) {
            try { storage.removeItem(key); } catch { /* Cleanup must not block sign-out. */ }
        }
    }
}
