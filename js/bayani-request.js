export const BAYANI_CONNECT_TIMEOUT_MS = 30000;
export const BAYANI_REPLY_TIMEOUT_MS = 45000;

// This limits how long the page waits; the underlying SDK request may still finish.
export function withBayaniDeadline(operation, milliseconds, {
    setTimer = globalThis.setTimeout,
    clearTimer = globalThis.clearTimeout
} = {}) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let timer;
        const settle = (callback, value) => {
            if (settled) return;
            settled = true;
            clearTimer(timer);
            callback(value);
        };
        timer = setTimer(() => settle(reject, Object.assign(
            new Error('Bayani AI request timed out.'),
            {code: 'bayani/deadline-exceeded'}
        )), milliseconds);
        Promise.resolve().then(operation).then(
            value => settle(resolve, value),
            error => settle(reject, error)
        );
    });
}

// Use fixed guidance, never provider response text, for known failure outcomes.
export function bayaniFailureMessage(error, {connecting = false, online} = {}) {
    const code = String(error?.code || '');
    if (code === 'bayani/deadline-exceeded') {
        return connecting
            ? 'Bayani AI took too long to connect. Try connecting again, or return to your lesson.'
            : 'Bayani AI took too long to reply. You can try again, or return to your lesson.';
    }
    if (code === 'bayani/privacy-blocked') {
        return 'Keep private details out of chat. Remove your contact details or passwords, then ask your history question again.';
    }
    if (code === 'bayani/rate-limit' || code === 'bayani/quota-exceeded') {
        return 'Bayani AI has reached its usage limit for now. Continue your lesson and try again later.';
    }
    if (code === 'bayani/unauthenticated') {
        return 'Your sign-in needs to be checked again. Sign in again before asking Bayani AI.';
    }
    if (code === 'bayani/permission-denied' || code === 'bayani/app-check-required') {
        return 'Bayani AI could not connect securely. You can continue your lesson and try again later.';
    }
    if (code === 'bayani/unavailable') {
        return 'Bayani AI is unavailable right now. You can continue your lesson and try again later.';
    }
    if (code === 'ai/response-error' || code === 'ai/response-blocked' || code === 'bayani/response-blocked') {
        return 'Bayani AI could not answer that question. Try asking about your history lesson in a different way.';
    }
    if (code === 'ai/invalid-content' || code === 'bayani/invalid-request') {
        return 'Bayani AI could not use this conversation. Try rephrasing your history question, or start a New Chat.';
    }
    // The existing client rejects empty responses with this exact local message.
    if (code === 'bayani/no-content' || error?.message === 'Bayani AI could not respond. Please rephrase your question.') {
        return 'Bayani AI could not write a reply. Try asking your history question in a different way.';
    }
    const details = code + ' ' + String(error?.message || '');
    if (online === false || /network|offline|failed to fetch/i.test(details)) {
        return 'Check your internet connection, then try again.';
    }
    if (/429|resource.exhausted|quota|too.many.requests/i.test(details)) {
        return 'Bayani AI has reached its usage limit for now. Continue your lesson and try again later.';
    }
    if (/app.?check|403|permission.denied|unauthorized|401/i.test(details)) {
        return 'Bayani AI could not connect securely. You can continue your lesson and try again later.';
    }
    return connecting
        ? 'Bayani AI is unavailable right now. You can continue your lesson and try connecting again later.'
        : 'Bayani AI could not reply. Try sending your question again.';
}
