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
const setupMarkup=fs.readFileSync(path.join(root,'pages/student-dashboard.html'),'utf8').match(/<section id="studentProfileSetup"[\s\S]*?<\/section>/)[0];
const style = fs.readFileSync(path.join(root, 'css/student.css'), 'utf8');
const html = `<!doctype html><meta charset="utf-8"><style>${style}</style>
<body data-role="student"><nav class="sidebar-nav"></nav><main>${setupMarkup}
<button id="profileButton" class="profile-button"><span id="profileAvatar" class="profile-avatar">A</span><span id="topStudentName">Alice</span></button>
</main><output id="result">RUNNING</output><script type="module">
const auth = { currentUser: { uid: 'alice' } }, db = {};
let saved = { role: 'student', status: 'active', firstName: 'Alice', lastName: 'Test', email: 'alice@example.com', xp: 90 };
let listener, failSave = false, pendingSave = false, releaseSave;
const collection=(_,name)=>name;
let fixtureAvatars=${JSON.stringify(require('../data/avatar-catalog.json'))};
let catalogFailure=true;
const getDocsFromServer=async()=>{if(catalogFailure)throw new Error('Offline');return{docs:fixtureAvatars.map(row=>({id:row.id,data:()=>row}))};};
const doc = (_, name, uid) => name + '/' + uid;
const serverTimestamp = () => 'timestamp';
const onSnapshot = (_, next) => { listener = next; next({ exists: () => true, data: () => saved }); return () => {}; };
const updateDoc = async (_, values) => {
    if (failSave) throw Object.assign(new Error('Denied'), { code: 'permission-denied' });
    if (pendingSave) return new Promise(resolve => { releaseSave=resolve; });
    saved = { ...saved, ...values };
    listener({ exists: () => true, data: () => saved });
};
${source}
const check = (condition, message) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
(async () => {
    mountStudentProfile(saved);
    await tick();
    const button = document.getElementById('profileButton');
    const modal = document.querySelector('dialog');
    const savedModal = document.querySelector('.student-profile-saved-dialog');
    const form = modal.querySelector('form');
    check(!document.getElementById('studentProfileSetup').hidden,'Optional setup missing');
    document.getElementById('openStudentSetup').click();
    check(document.getElementById('avatarCatalogStatus').textContent.includes('could not load'),'Initial catalog failure missing');
    form.elements.firstName.value='Offline Name';form.requestSubmit();await tick();
    check(saved.firstName==='Offline Name'&&!saved.avatarId,'Name-only save during catalog failure failed');
    check(saved.profileSetupCompletedAt==='timestamp'&&document.getElementById('studentProfileSetup').hidden,'Setup completion not remembered');
    check(savedModal.open,'Successful save did not show confirmation');savedModal.querySelector('button').click();await tick();
    catalogFailure=false;document.getElementById('retryAvatarCatalog').click();await tick();
    modal.querySelector('.student-profile-close').click();button.click();
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
    check(savedModal.open&&savedModal.textContent.includes('Changes saved'), 'Success confirmation missing');
    savedModal.querySelector('button').click();await tick();button.click();
    form.elements.firstName.value = 'Discard me';
    modal.querySelector('.student-profile-cancel').click();
    await tick();check(document.activeElement===button,'Closing profile did not return focus to opener');
    button.click();
    check(form.elements.firstName.value === 'Ana', 'Cancel retained unsaved draft');
    failSave = true;
    form.elements.firstName.value = 'Failed change';
    form.requestSubmit();
    await tick();
    check(saved.firstName === 'Ana', 'Failed save changed data');
    check(modal.querySelector('[role=status]').textContent.includes('could not'), 'Failure status missing');
    check(!form.querySelector('[type=submit]').disabled, 'Retry button stayed disabled');
    check(form.elements.firstName.value==='Failed change'&&form.getAttribute('aria-busy')==='false','Failed save lost edits or remained busy');
    failSave = false;
    fixtureAvatars=fixtureAvatars.map(avatar=>avatar.id==='book'?{...avatar,status:'inactive'}:avatar);
    document.getElementById('retryAvatarCatalog').click();await tick();
    form.elements.firstName.value='Ana';form.requestSubmit();await tick();
    check(saved.avatarId==='book','Retired saved avatar was replaced');
    savedModal.querySelector('button').click();await tick();button.click();
    fixtureAvatars.push({id:'new-choice',name:'Fresh Explorer',kind:'emoji',icon:'X',status:'active',order:20});
    document.getElementById('retryAvatarCatalog').click();await tick();
    check(!!form.querySelector('input[value="new-choice"]'),'Firestore choice did not appear');
    catalogFailure=true;document.getElementById('retryAvatarCatalog').click();await tick();
    check(document.getElementById('avatarCatalogStatus').textContent.includes('could not load'),'Catalog failure missing');
    check(!document.getElementById('retryAvatarCatalog').hidden,'Catalog retry unavailable');
    catalogFailure=false;document.getElementById('retryAvatarCatalog').click();await tick();
    modal.querySelector('.student-profile-close').click();
    delete saved.profileSetupCompletedAt;delete saved.profileSetupDismissedAt;
    listener({exists:()=>true,data:()=>saved});
    check(!document.getElementById('studentProfileSetup').hidden,'New setup state missing');
    failSave=true;document.getElementById('dismissStudentSetup').click();await tick();
    check(!document.getElementById('studentProfileSetup').hidden&&document.getElementById('studentSetupStatus').textContent.includes('could not save'),'Dismissal failure not handled');
    failSave=false;document.getElementById('dismissStudentSetup').click();await tick();
    check(saved.profileSetupDismissedAt==='timestamp'&&document.getElementById('studentProfileSetup').hidden,'Dismissal not persisted');
    button.click();
    pendingSave = true;
    form.elements.firstName.value = "Late account change";
    form.requestSubmit();
    await tick();
    modal.querySelector('.student-profile-close').click();
    check(!modal.open, 'Pending save trapped the student');
    check(form.getAttribute('aria-busy')==='true','Pending profile save not announced');
    const identityBefore=document.getElementById('topStudentName').textContent;auth.currentUser={uid:'other'};releaseSave();await tick();
    check(document.getElementById('topStudentName').textContent===identityBefore,'Late save overwrote identity after account changed');
    const hostile='<img data-attack src=x onerror="window.profileAttack=1"><svg data-attack onload="window.profileAttack=1"></svg>';
    studentAvatars=normalizeAvatarCatalog([{id:'hostile',name:hostile,kind:'emoji',icon:hostile,status:'active'}]);
    await renderStudentIdentity({firstName:hostile,lastName:hostile,email:hostile,avatarId:'hostile'});
    await tick();
    check(document.getElementById('topStudentName').textContent===hostile&&document.getElementById('profileAvatar').textContent===hostile,'Profile or avatar lost literal authored text');
    check(!document.querySelector('[data-attack]')&&window.profileAttack===undefined,'Profile or avatar interpreted hostile markup');
    document.getElementById('result').textContent = 'PASS: optional setup, completion/dismissal persistence, catalog recovery, name-only save, dynamic choices, preview, pending-save dismissal and hostile identity/avatar text';
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
