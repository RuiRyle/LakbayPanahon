// Optional browser storage must not interrupt a quiz or hide a confirmed save.
// Firestore drafts are the durable source of unfinished learning state.
export const studentTabStorage = {
    getItem(key) { try { return globalThis.sessionStorage.getItem(key); } catch { return null; } },
    setItem(key, value) { try { globalThis.sessionStorage.setItem(key, value); return true; } catch { return false; } },
    removeItem(key) { try { globalThis.sessionStorage.removeItem(key); return true; } catch { return false; } }
};

const quizHistoryKey = 'lakbayQuizRecovery';

function quizRecoveryHistories() {
    const histories = [];
    try { if (globalThis.history) histories.push(globalThis.history); } catch {}
    try {
        const parent = globalThis.window?.parent;
        if (parent && parent !== globalThis.window && parent.location.pathname.endsWith('/student-shell.html')) {
            histories.push(parent.history);
        }
    } catch { /* An unrelated or cross-origin parent is never used. */ }
    return histories;
}

export function readQuizRecovery(uid, scope) {
    for (const history of quizRecoveryHistories()) {
        try {
            const saved = history.state?.[quizHistoryKey];
            if (saved?.uid === uid && saved.scope === scope) return saved;
        } catch {}
    }
    return null;
}

export function writeQuizRecovery(uid, scope, {requestId, attemptId}) {
    for (const history of quizRecoveryHistories()) {
        try {
            history.replaceState({...history.state, [quizHistoryKey]: {uid, scope, requestId, attemptId}}, '');
        } catch { /* In-memory retries still work when history writes are blocked. */ }
    }
}

export function clearQuizRecovery(uid, scope) {
    if (!uid) return;
    for (const history of quizRecoveryHistories()) {
        try {
            const state = history.state;
            const saved = state?.[quizHistoryKey];
            if (saved?.uid !== uid || (scope !== undefined && saved.scope !== scope)) continue;
            const {[quizHistoryKey]: removed, ...rest} = state;
            history.replaceState(rest, '');
        } catch {}
    }
}

// Remove only the departing account's tab-local learning state. Firebase owns
// its authentication storage; browser preferences and saved Firestore data stay intact.
export function clearStudentSessionData(storage, uid) {
    if (!storage || typeof uid !== 'string' || !uid) return;
    const ownedPrefixes = ['missionQuiz:', 'missionQuizSet:', 'previewDraft:', 'securedAssessment:']
        .map(prefix => prefix + uid + ':');
    let keys;
    try {
        keys = Array.from({length: storage.length}, (_, index) => storage.key(index));
    } catch { return; }
    for (const key of keys) {
        if (typeof key !== 'string') continue;
        let owned = key === 'lakbay:backup-key:' + uid || ownedPrefixes.some(prefix => key.startsWith(prefix));
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
