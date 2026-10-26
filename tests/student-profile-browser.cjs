// Headless UI smoke test. Firebase is stubbed; security/persistence are tested
// separately against Firestore. Generated browser files live in the temp folder.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const browser = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-profile-'));
const source = fs.readFileSync(path.join(root, 'js/student-profile.js'), 'utf8')
    .replace(/import[\s\S]*?from\s+"[^"]+";/g, '').replace(/export /g, '');
const style = fs.readFileSync(path.join(root, 'css/student.css'), 'utf8');
const html = `<!doctype html><meta charset="utf-8"><style>${style}</style>
<body data-role="student"><nav class="sidebar-nav"></nav><main>
<button id="profileButton" class="profile-button"><span id="profileAvatar" class="profile-avatar">A</span><span id="topStudentName">Alice</span></button>
</main><output id="result">RUNNING</output><script type="module">
const auth = { currentUser: { uid: 'alice' } }, db = {};
let saved = { role: 'student', status: 'active', firstName: 'Alice', lastName: 'Test', email: 'alice@example.com', xp: 90 };
let listener, failSave = false, pendingSave = false;
const doc = (_, name, uid) => name + '/' + uid;
const serverTimestamp = () => 'timestamp';
const onSnapshot = (_, next) => { listener = next; next({ exists: () => true, data: () => saved }); return () => {}; };
const updateDoc = async (_, values) => {
    if (failSave) throw Object.assign(new Error('Denied'), { code: 'permission-denied' });
    if (pendingSave) return new Promise(() => {});
    saved = { ...saved, ...values };
    listener({ exists: () => true, data: () => saved });
};
${source}
const check = (condition, message) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
(async () => {
    mountStudentProfile(saved);
    const button = document.getElementById('profileButton');
    const modal = document.querySelector('dialog');
    const form = modal.querySelector('form');
    button.click();
    check(modal.open, 'Profile did not open');
    check(document.activeElement === form.elements.firstName, 'Initial focus missing');
    form.elements.firstName.value = '  Ana  ';
    form.elements.avatarId.value = 'book';
    form.dispatchEvent(new Event('input', { bubbles: true }));
    check(modal.querySelector('.student-profile-preview').textContent === '\u{1F4DA}', 'Preview not updated');
    form.requestSubmit();
    await tick();
    check(saved.firstName === 'Ana' && saved.avatarId === 'book', 'Save payload incorrect');
    check(saved.xp === 90 && saved.role === 'student', 'Protected fields changed');
    check(document.getElementById('profileAvatar').textContent === '\u{1F4DA}', 'Header avatar not updated');
    check(document.getElementById('topStudentName').textContent === 'Ana', 'Header name not updated');
    check(modal.querySelector('[role=status]').textContent.includes('saved'), 'Success status missing');
    form.elements.firstName.value = 'Discard me';
    modal.querySelector('.student-profile-cancel').click();
    button.click();
    check(form.elements.firstName.value === 'Ana', 'Cancel retained unsaved draft');
    failSave = true;
    form.elements.firstName.value = 'Failed change';
    form.requestSubmit();
    await tick();
    check(saved.firstName === 'Ana', 'Failed save changed data');
    check(modal.querySelector('[role=status]').textContent.includes('could not'), 'Failure status missing');
    check(!form.querySelector('[type=submit]').disabled, 'Retry button stayed disabled');
    failSave = false;
    pendingSave = true;
    form.requestSubmit();
    await tick();
    modal.querySelector('.student-profile-close').click();
    check(!modal.open, 'Pending save trapped the student');
    document.getElementById('result').textContent = 'PASS: open, focus, preview, save, identity, cancel, failure, pending-save dismissal';
})().catch(error => { document.getElementById('result').textContent = 'FAIL: ' + error.message; });
</script>`;
const file = path.join(temp, 'profile.html');
fs.writeFileSync(file, html);
const result = spawnSync(browser, ['--headless', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--user-data-dir=' + path.join(temp, 'browser'),
    '--dump-dom', '--virtual-time-budget=4000', 'file:///' + file.replaceAll('\\', '/')],
    { encoding: 'utf8', timeout: 30000, maxBuffer: 3 * 1024 * 1024, windowsHide: true });
if (result.error) throw result.error;
const match = result.stdout.match(/<output id="result">([^<]+)<\/output>/);
console.log(match?.[1] || 'FAIL: Browser did not return a result.');
process.exitCode = match?.[1].startsWith('PASS:') ? 0 : 1;
