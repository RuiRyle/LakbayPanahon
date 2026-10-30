'use strict';

const {failure, publicFailure, checkActive} = require('./errors.cjs');
const MAX_REQUEST_BYTES = 32768;
const MAX_HISTORY_CHARACTERS = 24000;
const MAX_ANSWER_CHARACTERS = 12000;

function record(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function exactKeys(value, keys) {
    return record(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function integer(value, minimum, maximum) { return Number.isInteger(value) && value >= minimum && value <= maximum; }

// Heuristic only: this cannot identify all personal information or harmful content.
function containsContactDetails(text) {
    return /[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/u.test(text)
        || /(?:^|[^\d])(?:\+63[ .-]?|0)9\d{2}[ .-]?\d{3}[ .-]?\d{4}(?!\d)/u.test(text)
        || /(?:^|[^\w])\+\d[\d ().-]{7,}\d(?!\w)/u.test(text);
}

function validateInput(body) {
    if (!exactKeys(body, ['message', 'history']) || typeof body.message !== 'string'
        || !body.message.trim() || body.message.length > 4000 || !Array.isArray(body.history)
        || body.history.length > 12 || body.history.length % 2 !== 0) {
        throw failure('bayani/invalid-request', 400);
    }
    let total = body.message.length;
    const history = body.history.map((entry, index) => {
        const role = index % 2 === 0 ? 'user' : 'model';
        if (!exactKeys(entry, ['role', 'parts']) || entry.role !== role || !Array.isArray(entry.parts)
            || entry.parts.length !== 1 || !exactKeys(entry.parts[0], ['text'])) {
            throw failure('bayani/invalid-request', 400);
        }
        const text = entry.parts[0].text;
        if (typeof text !== 'string' || !text.trim() || text.length > (role === 'user' ? 4000 : MAX_ANSWER_CHARACTERS)) {
            throw failure('bayani/invalid-request', 400);
        }
        total += text.length;
        return {role, parts: [{text}]};
    });
    if (total > MAX_HISTORY_CHARACTERS || Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_REQUEST_BYTES) {
        throw failure('bayani/invalid-request', 413);
    }
    if ([body.message, ...history.map(entry => entry.parts[0].text)].some(containsContactDetails)) {
        throw failure('bayani/privacy-blocked', 400);
    }
    return {message: body.message.trim(), history};
}

function validateSettings(settings) {
    if (!record(settings) || settings.enabled !== true || settings.provider !== 'anthropic'
        || settings.minorsUseApproved !== true || typeof settings.model !== 'string'
        || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(settings.model)
        || typeof settings.systemInstruction !== 'string' || !settings.systemInstruction.trim()
        || settings.systemInstruction.length > 24000
        || !integer(settings.maxMessageCharacters, 1, 4000)
        || !integer(settings.maxOutputTokens, 1, 1500)
        || !integer(settings.perMinuteLimit, 1, 60)
        || !integer(settings.perStudentDailyLimit, 1, 10000)
        || !integer(settings.globalDailyLimit, 1, 1000000)) {
        throw failure('bayani/unavailable', 503);
    }
    // Copy only approved fields. Never forward arbitrary configuration as provider options.
    return Object.fromEntries(['model', 'systemInstruction', 'maxMessageCharacters', 'maxOutputTokens',
        'perMinuteLimit', 'perStudentDailyLimit', 'globalDailyLimit'].map(key => [key, settings[key]]));
}

function allowedOrigin(value) {
    if (typeof value !== 'string' || !value || value === 'null' || value.includes('*')) return false;
    try {
        const parsed = new URL(value);
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
        return parsed.origin === value && !parsed.username && !parsed.password && !parsed.search && !parsed.hash
            && parsed.pathname === '/' && (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && local));
    } catch { return false; }
}

function createBayaniProcessor(deps, {allowedOrigins, timeoutMs = 30000, setTimer = setTimeout, clearTimer = clearTimeout} = {}) {
    if (!Array.isArray(allowedOrigins) || !allowedOrigins.length || !allowedOrigins.every(allowedOrigin)) {
        throw Error('Configure explicit Bayani browser origins.');
    }
    if (!integer(timeoutMs, 1, 30000)) throw Error('Invalid Bayani deadline.');
    const origins = new Set(allowedOrigins);

    return async function processRequest(request) {
        const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff', Vary: 'Origin'};
        const origin = request.headers?.origin;
        if (!allowedOrigin(origin) || !origins.has(origin)) {
            return {...publicFailure(failure('bayani/permission-denied', 403)), headers};
        }
        headers['Access-Control-Allow-Origin'] = origin;
        if (request.path !== '/api/bayani/chat') return {status: 404, body: {error: {code: 'bayani/invalid-request', message: 'Page not found.'}}, headers};
        if (request.method === 'OPTIONS') {
            headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
            headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Firebase-AppCheck';
            return {status: 204, headers};
        }
        if (request.method !== 'POST') return {...publicFailure(failure('bayani/invalid-request', 405)), headers};

        const controller = new AbortController();
        let timer, detach;
        const expired = new Promise((_, reject) => {
            const expire = () => { controller.abort(); reject(failure('bayani/deadline-exceeded', 504)); };
            timer = setTimer(expire, timeoutMs);
            if (request.signal) {
                request.signal.addEventListener('abort', expire, {once: true});
                detach = () => request.signal.removeEventListener('abort', expire);
                if (request.signal.aborted) expire();
            }
        });
        const signal = controller.signal;
        const work = async () => {
            checkActive(signal);
            if (typeof request.headers['content-type'] !== 'string'
                || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers['content-type'])) {
                throw failure('bayani/invalid-request', 415);
            }
            const input = validateInput(request.body);
            const authorization = request.headers.authorization;
            if (typeof authorization !== 'string' || authorization.length > 8192
                || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)) throw failure('bayani/unauthenticated', 401);
            const appCheck = request.headers['x-firebase-appcheck'];
            if (typeof appCheck !== 'string' || !appCheck || appCheck.length > 8192
                || !/^[A-Za-z0-9._~-]+$/.test(appCheck)) throw failure('bayani/app-check-required', 401);
            let identity;
            try { identity = await deps.verifyIdToken(authorization.slice(7), true); }
            catch { throw failure('bayani/unauthenticated', 401); }
            checkActive(signal);
            const uid = identity?.uid;
            if (typeof uid !== 'string' || !uid || uid.length > 128 || /[\x00-\x1f/]/.test(uid)) {
                throw failure('bayani/unauthenticated', 401);
            }
            try { await deps.verifyAppCheck(appCheck); }
            catch { throw failure('bayani/app-check-required', 401); }
            checkActive(signal);
            const student = await deps.getStudent(uid);
            checkActive(signal);
            if (!record(student) || student.role !== 'student' || student.status !== 'active') {
                throw failure('bayani/permission-denied', 403);
            }
            const settings = validateSettings(await deps.getSettings());
            checkActive(signal);
            if (input.message.length > settings.maxMessageCharacters
                || input.history.some(entry => entry.role === 'user' && entry.parts[0].text.length > settings.maxMessageCharacters)) {
                throw failure('bayani/invalid-request', 400);
            }
            await deps.reserveUsage({uid, settings, signal});
            checkActive(signal);
            const answer = await deps.generateAnswer({...input, settings, signal});
            checkActive(signal);
            if (typeof answer !== 'string' || !answer.trim() || answer.length > MAX_ANSWER_CHARACTERS
                || containsContactDetails(answer)) throw failure('bayani/no-content', 502);
            return {status: 200, headers, body: {answer: answer.trim()}};
        };
        try { return await Promise.race([work(), expired]); }
        catch (error) { return {...publicFailure(error), headers}; }
        finally { clearTimer(timer); detach?.(); }
    };
}

module.exports = {createBayaniProcessor, validateInput, validateSettings, containsContactDetails, allowedOrigin,
    MAX_REQUEST_BYTES, MAX_HISTORY_CHARACTERS, MAX_ANSWER_CHARACTERS};
