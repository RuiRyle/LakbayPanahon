import { auth } from './firebase-config.js';
import { onVerifiedStudentChange } from './auth-guard.js';
import { studentAccessRequest } from './student-access-client.js';
import { studentTabStorage } from './student-session-storage.js';

const panel = document.getElementById('studentRecoverySettings');
const form = document.getElementById('studentRecoverySettingsForm');
const status = document.getElementById('studentRecoverySettingsStatus');
const result = document.getElementById('studentRecoverySettingsResult');
const key = document.getElementById('studentRecoverySettingsKey');
const submit = form.querySelector('button[type="submit"]');
const defaultLabel = submit.textContent;
const recoveryLifetime = 15 * 60 * 1000;
let generation = 0, pending = false;
let requestInMemory;

function pendingRequest(storageKey) {
    const valid = record => record && typeof record.id === 'string' &&
        Number.isFinite(record.startedAt) && Date.now() - record.startedAt < recoveryLifetime;
    if (requestInMemory?.storageKey === storageKey && valid(requestInMemory)) return requestInMemory;
    try {
        const record = JSON.parse(studentTabStorage.getItem(storageKey));
        if (valid(record)) return record;
    } catch {}
    return null;
}

function syncPendingRequest() {
    const uid = auth.currentUser?.uid;
    const retry = uid && pendingRequest('lakbay:backup-key:' + uid);
    submit.textContent = retry ? 'Recover new backup key' : defaultLabel;
    if (retry) status.textContent = 'A key request is waiting for confirmation. Enter your passphrase to check it.';
}

function clearPrivateContent() {
    ++generation;
    form.elements.passphrase.value = '';
    key.textContent = '';
    result.hidden = true;
    status.textContent = '';
    submit.disabled = pending;
    submit.textContent = defaultLabel;
}

onVerifiedStudentChange(session => {
    clearPrivateContent();
    if (!session?.user || requestInMemory?.storageKey !== 'lakbay:backup-key:' + session.user.uid) requestInMemory = undefined;
    const id = session?.profile.studentId;
    panel.hidden = !/^LP-[A-F0-9]{12}$/.test(id || '');
    panel.open = false;
    form.elements.studentId.value = id || '';
    document.getElementById('settingsStudentId').textContent = session?.profile.username || id || '';
});

panel.addEventListener('toggle', () => {
    if (!panel.open) clearPrivateContent();
    else syncPendingRequest();
});
window.addEventListener('pagehide', clearPrivateContent);

form.addEventListener('submit', async event => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user || panel.hidden || submit.disabled) return;
    const data = Object.fromEntries(new FormData(form));
    const storageKey = 'lakbay:backup-key:' + user.uid;
    const record = pendingRequest(storageKey) || { id: crypto.randomUUID(), startedAt: Date.now() };
    requestInMemory = { ...record, storageKey };
    studentTabStorage.setItem(storageKey, JSON.stringify(record));
    clearPrivateContent();
    const request = generation;
    // Allow only one rotation until its outcome is known, including when the panel closes.
    pending = submit.disabled = true;
    status.textContent = 'Making a backup key…';
    const isCurrent = () => request === generation && auth.currentUser === user;
    try {
        const receipt = await studentAccessRequest({ ...data, action: 'rotate-recovery', recoveryRequestId: record.id });
        if (!isCurrent()) return;
        studentTabStorage.removeItem(storageKey);
        requestInMemory = undefined;
        key.textContent = receipt.recoveryCode;
        result.hidden = false;
        status.textContent = 'Your new backup key is ready.';
    } catch (error) {
        if (!isCurrent()) return;
        const code = error.code?.split('/').at(-1);
        if (code === 'failed-precondition') {
            studentTabStorage.removeItem(storageKey);
            requestInMemory = undefined;
        }
        submit.textContent = pendingRequest(storageKey) ? 'Recover new backup key' : defaultLabel;
        status.textContent = code === 'permission-denied' ? 'Check your current passphrase and try again.' :
            ['resource-exhausted', 'failed-precondition'].includes(code) ? error.message :
                'We couldn’t confirm the new key. Enter your passphrase again in this tab to recover it.';
    } finally {
        pending = submit.disabled = false;
    }
});
