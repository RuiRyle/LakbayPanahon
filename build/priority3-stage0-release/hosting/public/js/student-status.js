// UI guidance only: never display raw service messages or infer a saved result.
export function studentLoadMessage(error, fallback) {
    const code=String(error?.code||'').toLowerCase();
    const message=String(error?.message||'');
    if(/resource-exhausted|too-many-requests/.test(code)||/\b429\b/.test(message)) {
        return 'The learning service is busy or has reached its usage limit. Please try again later.';
    }
    if(/unavailable|network-request-failed|deadline-exceeded/.test(code)) {
        return 'We could not reach the learning service. Check your connection, then try again.';
    }
    return fallback;
}
