const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const MAX_HISTORY_MESSAGES = 12;
const MAX_SOURCE_HISTORY_MESSAGES = 2000;
const MAX_HISTORY_CHARACTERS = 24000;
const MAX_ANSWER_CHARACTERS = 12000;
const MAX_BODY_BYTES = 32768;
const MAX_RESPONSE_BYTES = 65536;
const REQUEST_TIMEOUT_MS = 35000;
const FAILURE_MESSAGES = Object.freeze({
    'bayani/unauthenticated': 'Please sign in again to use Bayani AI.',
    'bayani/permission-denied': 'Bayani AI is not available for this account.',
    'bayani/app-check-required': 'Bayani AI could not connect securely. Please try connecting again later.',
    'bayani/rate-limit': 'Bayani AI has reached its usage limit for now. Please try again later.',
    'bayani/quota-exceeded': 'Bayani AI has reached its usage limit for now. Please try again later.',
    'bayani/privacy-blocked': 'Keep private information out of chat. Ask your history question without those details.',
    'bayani/invalid-request': 'Try rephrasing your history question, or start a New Chat.',
    'bayani/unavailable': 'Bayani AI is unavailable right now. Please try again later.',
    'bayani/deadline-exceeded': 'Bayani AI took too long to reply. Please try again later.',
    'bayani/no-content': 'Bayani AI could not write a reply. Try asking your history question in a different way.'
});

function failure(code) {
    const safeCode = Object.hasOwn(FAILURE_MESSAGES, code) ? code : 'bayani/unavailable';
    return Object.assign(new Error(FAILURE_MESSAGES[safeCode]), {code: safeCode});
}

export function validateBayaniBackendEndpoint(value, pageLocation = globalThis.location) {
    try {
        if (typeof value !== 'string' || !value.trim()) throw Error();
        const page = new URL(pageLocation?.href);
        const endpoint = new URL(value, page);
        const localHttp = endpoint.protocol === 'http:' && page.protocol === 'http:' &&
            LOCAL_HOSTS.has(page.hostname) && endpoint.hostname === page.hostname;
        if ((endpoint.protocol !== 'https:' && !localHttp) || endpoint.username || endpoint.password ||
            endpoint.search || endpoint.hash || endpoint.pathname !== '/api/bayani/chat') throw Error();
        return endpoint.href;
    } catch {
        throw failure('bayani/unavailable');
    }
}

function hasOnlyKeys(value, keys) {
    return value && typeof value === 'object' && !Array.isArray(value) &&
        Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
}

function requestBody(message, history, maxMessageCharacters) {
    if (typeof message !== 'string' || !message.trim() || message.length > maxMessageCharacters ||
        !Array.isArray(history) || history.length > MAX_SOURCE_HISTORY_MESSAGES || history.length % 2) {
        throw failure('bayani/invalid-request');
    }
    const entries = history.map((entry, index) => {
        const expectedRole = index % 2 ? 'model' : 'user';
        if (!hasOnlyKeys(entry, ['role', 'parts']) || entry.role !== expectedRole ||
            !Array.isArray(entry.parts) || entry.parts.length !== 1 ||
            !hasOnlyKeys(entry.parts[0], ['text'])) throw failure('bayani/invalid-request');
        const text = entry.parts[0].text;
        const limit = entry.role === 'user' ? maxMessageCharacters : MAX_ANSWER_CHARACTERS;
        if (typeof text !== 'string' || !text.trim() || text.length > limit) throw failure('bayani/invalid-request');
        return {role: entry.role, parts: [{text}]};
    }).slice(-MAX_HISTORY_MESSAGES);
    const encoder = new TextEncoder();
    while (true) {
        const characters = message.length + entries.reduce((sum, entry) => sum + entry.parts[0].text.length, 0);
        const body = JSON.stringify({message, history: entries});
        if (characters <= MAX_HISTORY_CHARACTERS && encoder.encode(body).byteLength <= MAX_BODY_BYTES) return body;
        if (!entries.length) throw failure('bayani/invalid-request');
        entries.splice(0, 2);
    }
}

function responseFailure(status, body) {
    if (hasOnlyKeys(body, ['error']) && body.error && typeof body.error.code === 'string' &&
        Object.hasOwn(FAILURE_MESSAGES, body.error.code)) return failure(body.error.code);
    if (status === 401) return failure('bayani/unauthenticated');
    if (status === 403) return failure('bayani/permission-denied');
    if (status === 429) return failure('bayani/quota-exceeded');
    if (status === 400 || status === 413 || status === 415) return failure('bayani/invalid-request');
    return failure('bayani/unavailable');
}

async function readBoundedResponse(response, current) {
    if (!response.body?.getReader) {
        const text = await response.text();
        current();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw Error();
        return text;
    }
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let bytes = 0, text = '';
    try {
        while (true) {
            const chunk = await reader.read();
            current();
            if (chunk.done) return text + decoder.decode();
            bytes += chunk.value.byteLength;
            if (bytes > MAX_RESPONSE_BYTES) throw Error();
            text += decoder.decode(chunk.value, {stream:true});
        }
    } catch (error) {
        reader.cancel().catch(() => {});
        throw error;
    } finally {
        reader.releaseLock();
    }
}

// Opt-in only: API credentials stay on the server, which independently loads
// model choice and teaching instructions instead of accepting them from the browser.
export function createBayaniBackendClient({auth, appCheck, getAppCheckToken, settings,
    pageLocation = globalThis.location, fetchRequest = globalThis.fetch,
    setTimer = globalThis.setTimeout, clearTimer = globalThis.clearTimeout,
    Abort = globalThis.AbortController} = {}) {
    if (!auth?.currentUser || typeof auth.currentUser.getIdToken !== 'function') throw failure('bayani/unauthenticated');
    if (settings?.enabled !== true || settings.provider !== 'anthropic' || settings.minorsUseApproved !== true ||
        !Number.isInteger(settings.maxMessageCharacters) || settings.maxMessageCharacters < 1 ||
        settings.maxMessageCharacters > 4000 || !appCheck || typeof getAppCheckToken !== 'function') {
        throw failure('bayani/unavailable');
    }
    const endpoint = validateBayaniBackendEndpoint(settings.backendEndpoint, pageLocation);
    const user = auth.currentUser, uid = user.uid;
    const maxMessageCharacters = settings.maxMessageCharacters;
    return {
        settings: {maxMessageCharacters, welcomeMessage: typeof settings.welcomeMessage === 'string' ? settings.welcomeMessage : ''},
        async send(message, history = []) {
            const body = requestBody(message, history, maxMessageCharacters);
            const controller = new Abort();
            let expired = false, timer;
            const current = () => {
                if (expired) throw failure('bayani/deadline-exceeded');
                if (auth.currentUser?.uid !== uid || auth.currentUser !== user) throw failure('bayani/unauthenticated');
            };
            const operation = async () => {
                current();
                let idToken, checkedToken;
                try { idToken = await user.getIdToken(); }
                catch { current(); throw failure('bayani/unauthenticated'); }
                current();
                if (typeof idToken !== 'string' || !idToken) throw failure('bayani/unauthenticated');
                try { checkedToken = await getAppCheckToken(appCheck, false); }
                catch { current(); throw failure('bayani/app-check-required'); }
                current();
                if (typeof checkedToken?.token !== 'string' || !checkedToken.token) throw failure('bayani/app-check-required');
                let response;
                try {
                    response = await fetchRequest(endpoint, {
                        method: 'POST', mode: 'cors', credentials: 'omit', redirect: 'error',
                        cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal,
                        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + idToken,
                            'X-Firebase-AppCheck': checkedToken.token}, body
                    });
                } catch { current(); throw failure('bayani/unavailable'); }
                current();
                let parsed;
                try {
                    const text = await readBoundedResponse(response, current);
                    current();
                    parsed = JSON.parse(text);
                } catch { current(); throw failure('bayani/unavailable'); }
                if (!response.ok) throw responseFailure(response.status, parsed);
                if (!hasOnlyKeys(parsed, ['answer']) || typeof parsed.answer !== 'string' ||
                    !parsed.answer.trim() || parsed.answer.length > MAX_ANSWER_CHARACTERS) throw failure('bayani/no-content');
                return parsed.answer;
            };
            const deadline = new Promise((_, reject) => {
                timer = setTimer(() => {
                    expired = true;
                    try { controller.abort(); } finally { reject(failure('bayani/deadline-exceeded')); }
                }, REQUEST_TIMEOUT_MS);
            });
            try { return await Promise.race([operation(), deadline]); }
            finally { clearTimer(timer); }
        }
    };
}
