'use strict';

const http = require('node:http');
const path = require('node:path');
const {createBayaniProcessor, allowedOrigin, MAX_REQUEST_BYTES} = require('./core.cjs');
const {createUsageReservation} = require('./usage.cjs');
const {createAnthropicGenerator} = require('./anthropic.cjs');
const {failure, publicFailure} = require('./errors.cjs');

function deploymentConfig(env) {
    if (env.BAYANI_ACTIVATION_APPROVED !== 'true') throw Error('Bayani backend activation is not approved.');
    if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST || env.FIREBASE_APPCHECK_DEBUG_TOKEN) {
        throw Error('Emulator and App Check debug bypass settings are not supported by this backend.');
    }
    if (typeof env.GOOGLE_CLOUD_PROJECT !== 'string' || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(env.GOOGLE_CLOUD_PROJECT)) {
        throw Error('Configure the intended Firebase project explicitly.');
    }
    if (typeof env.ANTHROPIC_API_KEY !== 'string' || !env.ANTHROPIC_API_KEY.trim()) {
        throw Error('Configure the private Anthropic credential through the host.');
    }
    const origins = typeof env.BAYANI_ALLOWED_ORIGINS === 'string'
        ? env.BAYANI_ALLOWED_ORIGINS.split(',').map(value => value.trim()) : [];
    if (!origins.length || !origins.every(allowedOrigin)) throw Error('Configure explicit allowed browser origins.');
    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
        const relative = path.relative(path.resolve(__dirname, '../..'), path.resolve(env.GOOGLE_APPLICATION_CREDENTIALS));
        if (relative === '' || !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) {
            throw Error('Keep service credentials outside the website workspace.');
        }
    }
    if (env.ANTHROPIC_WORKSPACE_ID && !/^wrkspc_[A-Za-z0-9]+$/.test(env.ANTHROPIC_WORKSPACE_ID)) {
        throw Error('Configure a valid Anthropic workspace identifier.');
    }
    const port = env.PORT === undefined ? 8080 : Number(env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Configure a valid server port.');
    return {projectId: env.GOOGLE_CLOUD_PROJECT, origins, apiKey: env.ANTHROPIC_API_KEY,
        workspaceId: env.ANTHROPIC_WORKSPACE_ID, port};
}

function duplicateProtectedHeaders(rawHeaders = []) {
    const protectedNames = new Set(['origin', 'authorization', 'x-firebase-appcheck', 'content-type', 'content-length']);
    const counts = new Map();
    for (let index = 0; index < rawHeaders.length; index += 2) {
        const name = String(rawHeaders[index]).toLowerCase();
        if (protectedNames.has(name)) counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.values()].some(count => count > 1);
}

function readJson(req, signal) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        const cleanup = () => {
            req.removeListener('data', data); req.removeListener('end', end);
            req.removeListener('error', error); req.removeListener('aborted', aborted);
            signal.removeEventListener('abort', aborted);
        };
        const fail = reason => {
            cleanup();
            // A rejected request may still emit an error while its body drains.
            // Do not turn that late transport error into an uncaught exception.
            const drainError = () => {};
            req.on('error', drainError);
            req.once('close', () => req.removeListener('error', drainError));
            req.resume(); reject(reason);
        };
        const data = chunk => {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += bytes.byteLength;
            if (size > MAX_REQUEST_BYTES) { fail(failure('bayani/invalid-request', 413)); return; }
            chunks.push(bytes);
        };
        const end = () => {
            cleanup();
            try { resolve(JSON.parse(Buffer.concat(chunks, size).toString('utf8'))); }
            catch { reject(failure('bayani/invalid-request', 400)); }
        };
        const error = () => fail(failure('bayani/invalid-request', 400));
        const aborted = () => fail(failure('bayani/deadline-exceeded', 504));
        req.on('data', data); req.once('end', end); req.once('error', error); req.once('aborted', aborted);
        signal.addEventListener('abort', aborted, {once: true});
        if (signal.aborted) aborted();
    });
}

function createNodeHandler(processor, {timeoutMs = 30000} = {}) {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw Error('Invalid HTTP deadline.');
    return async (req, res) => {
        const controller = new AbortController();
        const send = result => {
            if (res.writableEnded || res.destroyed) return;
            res.writeHead(result.status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
                'X-Content-Type-Options':'nosniff', ...result.headers});
            res.end(result.body === undefined ? undefined : JSON.stringify(result.body));
        };
        const expire = () => {
            controller.abort();
            send({...publicFailure(failure('bayani/deadline-exceeded', 504)), headers:{Connection:'close'}});
        };
        const timer = setTimeout(expire, timeoutMs);
        const disconnected = () => { if (!res.writableEnded) controller.abort(); };
        const transportError = () => controller.abort();
        req.on('error', transportError);
        req.once('close', () => req.removeListener('error', transportError));
        req.once('aborted', disconnected); res.once('close', disconnected);
        try {
            if (duplicateProtectedHeaders(req.rawHeaders)) throw failure('bayani/invalid-request', 400);
            let pathname;
            try { pathname = new URL(req.url, 'http://backend.invalid').pathname; }
            catch { throw failure('bayani/invalid-request', 400); }
            if (pathname === '/health' && req.method === 'GET') { send({status:200, body:{ok:true}}); return; }
            const rawLength = req.headers['content-length'];
            if (rawLength !== undefined && (typeof rawLength !== 'string' || !/^\d+$/.test(rawLength)
                || !Number.isSafeInteger(Number(rawLength)) || Number(rawLength) > MAX_REQUEST_BYTES)) {
                throw failure('bayani/invalid-request', 413);
            }
            // Non-POST requests are processed without reading a body.
            const body = req.method === 'POST' ? await readJson(req, controller.signal) : undefined;
            const result = await processor({method:req.method, path:pathname, headers:req.headers, body, signal:controller.signal});
            send(result);
        } catch (error) {
            send({...publicFailure(error), headers:{Connection:'close'}});
        } finally {
            clearTimeout(timer); req.removeListener('aborted', disconnected); res.removeListener('close', disconnected);
        }
    };
}

function startServer(env = process.env) {
    // The approval and credential checks run before loading Admin or opening a port.
    const config = deploymentConfig(env);
    const {initializeApp, applicationDefault} = require('firebase-admin/app');
    const {getAuth} = require('firebase-admin/auth');
    const {getAppCheck} = require('firebase-admin/app-check');
    const {getFirestore} = require('firebase-admin/firestore');
    const app = initializeApp({projectId:config.projectId, credential:applicationDefault()});
    const db = getFirestore(app);
    const processor = createBayaniProcessor({
        verifyIdToken:(token, revoked) => getAuth(app).verifyIdToken(token, revoked),
        verifyAppCheck:token => getAppCheck(app).verifyToken(token),
        getStudent:async uid => {
            const snapshot = await db.doc('users/' + uid).get();
            return snapshot.exists ? {role:snapshot.get('role'), status:snapshot.get('status')} : null;
        },
        getSettings:async () => {
            const snapshot = await db.doc('learningSettings/bayaniAI').get();
            return snapshot.exists ? snapshot.data() : null;
        },
        reserveUsage:createUsageReservation(db),
        generateAnswer:createAnthropicGenerator({apiKey:config.apiKey, workspaceId:config.workspaceId})
    }, {allowedOrigins:config.origins});
    const server = http.createServer({maxHeaderSize:16384}, createNodeHandler(processor));
    server.headersTimeout = 10000; server.requestTimeout = 30000; server.timeout = 30000;
    server.keepAliveTimeout = 5000; server.maxRequestsPerSocket = 20; server.maxConnections = 64;
    server.listen(config.port, '0.0.0.0');
    return server;
}

if (require.main === module) {
    try { startServer(); }
    catch { console.error('Bayani backend did not start. Check activation approval and private host configuration.'); process.exitCode = 1; }
}

module.exports = {deploymentConfig, duplicateProtectedHeaders, readJson, createNodeHandler, startServer};
