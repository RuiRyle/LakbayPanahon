const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');

const root = path.join(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-guard-'));
const source = fs.readFileSync(path.join(root, 'js/auth-guard.js'), 'utf8')
    .replace(/import[\s\S]*?from\s+"[^"]+";/g, '')
    .replace(/window\.location\.replace\(/g, 'recordRedirect(');
const style = fs.readFileSync(path.join(root, 'css/student.css'), 'utf8');
const script = `
const auth = {currentUser: {uid: 'student'}}, db = {};
let listener, failure = true, profile = {role: 'student', status: 'active'}, gate = null;
let signedOut = 0, mounted = 0, redirects = [], reads = 0;
const recordRedirect = value => { redirects.push(value); };
const mountStudentProfile = () => { mounted++; };
const onAuthStateChanged = (_, fn) => { listener = fn; queueMicrotask(() => fn(auth.currentUser)); };
const signOut = async () => { signedOut++; auth.currentUser = null; await listener(null); };
const doc = (_, name, id) => ({name, id});
const getDoc = async () => { throw Error('Cache-capable read used'); };
const getDocFromServer = async () => {
    reads++;
    const saved = profile, failed = failure, pending = gate;
    if (pending) await pending;
    if (failed) throw Error('Network unavailable');
    return {exists: () => !!saved, data: () => saved};
};
${source}
const tick = () => new Promise(resolve => setTimeout(resolve, 40));
const check = (ok, message) => { if (!ok) throw Error(message); };
const locked = () => {
    check(!document.body.classList.contains('authenticated'), 'Unverified page authenticated');
    for (const root of document.querySelectorAll('.student-app, .chapter-challenge-page')) {
        check(getComputedStyle(root).visibility === 'hidden' && root.inert, 'Protected content visible or interactive');
    }
    check(getComputedStyle(document.querySelector('.student-loading-shell')).display !== 'none', 'Loading shell missing during account check');
};
(async () => {
    await tick();
    check(typeof listener === 'function', 'Browser harness did not exercise the protected frame guard');
    locked();
    check(recoveryDialog.open && signedOut === 0, 'Read failure signed out student');
    check(getComputedStyle(recoveryDialog).visibility === 'visible', 'Retry dialog hidden by page guard');
    check(document.querySelector('[data-local-settings-status]').hidden, 'Settings bypass announced unverified access');
    failure = false;
    recoveryDialog.querySelector('button').click();
    await tick();
    check(!recoveryDialog.open && document.body.classList.contains('authenticated') && mounted === 1, 'Retry did not grant verified access');
    check(getComputedStyle(document.querySelector('.student-loading-shell')).display === 'none', 'Loading shell did not release verified page');
    check(!document.querySelector('.student-app').inert, 'Verified app remained inert');

    window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true}));
    locked();
    failure = true;
    const previousReads = reads;
    window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
    await tick();
    locked();
    check(reads === previousReads + 1 && recoveryDialog.open, 'Restore reused old authorization instead of checking the server');
    let release;
    gate = new Promise(resolve => { release = resolve; });
    failure = false;
    recoveryDialog.querySelector('button').click();
    await tick();
    locked();
    check(!recoveryDialog.open, 'Retry did not close recovery while checking');
    release();
    await tick();
    check(document.body.classList.contains('authenticated') && mounted === 2, 'Restore retry did not release verified page');

    gate = new Promise(resolve => { release = resolve; });
    const pending = checkPageAccess(auth.currentUser);
    auth.currentUser = null;
    await listener(null);
    release();
    await pending;
    locked();
    check(redirects.length === 1 && redirects[0] === 'login.html', 'Signed-out redirect was unstable');
    check(mounted === 2, 'Late profile response granted signed-out access');
    parent.postMessage('PASS: server retry, settings failure lock, protected frame visibility, inert content, lifecycle revalidation and stale-response rejection', '*');
})().catch(error => parent.postMessage('FAIL: ' + error.message, '*'));
`;

// The real student guard runs inside the persistent shell's frame. Running this
// fixture at top level would test only the early shell redirect.
fs.writeFileSync(path.join(temp, 'guard-frame.html'), '<!doctype html><html><head><style>' + style + '</style></head><body data-role="student" data-local-preferences="true" class="auth-checking"><div class="student-loading-shell" role="status">Loading your learning space...</div><div class="student-app"><main class="main-content">Protected learner data<p data-local-settings-status hidden>Unverified preferences</p></main></div><div class="chapter-challenge-page">Protected challenge</div><script type="module">' + script + '</script></body></html>');
const file = path.join(temp, 'guard.html');
fs.writeFileSync(file, '<!doctype html><html><body><output id="result">RUNNING</output><iframe id="guard" src="guard-frame.html"></iframe><script>window.addEventListener("message",event=>{if(event.source===document.getElementById("guard").contentWindow&&typeof event.data==="string")document.getElementById("result").textContent=event.data;});</script></body></html>');
const result = spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=' + path.join(temp, 'browser'), '--dump-dom', '--virtual-time-budget=5000',
    'file:///' + file.replaceAll('\\', '/')
], {encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true});
if (result.error) throw result.error;
const match = result.stdout.match(/<output id="result">([^<]+)<\/output>/);
console.log(match?.[1] || 'FAIL: no browser result');
if (!match || match[1] === 'RUNNING') console.error(result.stderr.slice(-1600));
process.exitCode = match?.[1].startsWith('PASS:') ? 0 : 1;
