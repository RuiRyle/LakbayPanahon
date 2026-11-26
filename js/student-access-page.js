import { navigatePage } from './route-navigation.js';
import { studentAccessAvailable } from './student-access-configuration.js';
import { studentTabStorage } from './student-session-storage.js';

const modes = {
    setup: ['Create your account with a username', 'No email needed. Choose a username and passphrase, then save the backup key shown after signup.', 'Create my account'],
    'teacher-setup': ['Use an existing setup code', 'Enter the Student ID and private setup code you already received for this classroom.', 'Finish setup'],
    'sign-in': ['Sign in with a username', 'Enter the username and passphrase you chose.', 'Sign in'],
    reset: ['Reset your passphrase', 'Enter your username and the private reset code from your teacher.', 'Reset and sign in'],
    backup: ['Recover with your backup key', 'Enter your username and backup key to choose a new passphrase.', 'Reset and sign in']
};
const requestedMode = new URLSearchParams(location.search).get('mode');
const mode = Object.hasOwn(modes, requestedMode) ? requestedMode : 'sign-in';
const registering = mode === 'setup';
const action = registering ? 'register' : mode === 'teacher-setup' ? 'setup' : mode;
const recovering = ['backup', 'reset', 'setup'].includes(action);
const requestKey = 'lakbay:student-access-request:' + action;
const destination = action === 'setup' ? 'student-shell.html?route=my-class.html' : 'student-shell.html';
const form = document.getElementById('studentAccessForm');
const status = document.getElementById('studentAccessStatus');
const submit = form.querySelector('button[type="submit"]');
const retry = document.getElementById('studentAccessRetry');
const receipt = document.getElementById('studentAccessReceipt');
const [title, description, buttonText] = modes[mode];
document.getElementById('studentAccessTitle').textContent = title;
document.getElementById('studentAccessDescription').textContent = description;
submit.textContent = buttonText;
const fields = form.elements;
const names = document.getElementById('studentAccessNames');
names.hidden = names.disabled = !registering && action !== 'setup';
const username = fields.username;
if (registering) {
    const back = document.getElementById('studentAccessBack');
    back.href = 'register.html#choose-account';
    back.textContent = 'Choose a different signup method';
    document.getElementById('studentAccessNameLabel').textContent = 'Choose a username';
    const hint = document.getElementById('studentAccessNameHint');
    hint.textContent = 'Use 3 to 20 characters, starting with a letter. You can use letters, numbers, hyphens, and underscores. Choose a nickname without your full name or birthday.';
    hint.hidden = false;
    username.maxLength = 20;
    username.pattern = '[A-Za-z][A-Za-z0-9_\\-]{2,19}';
} else if (action === 'setup') {
    document.getElementById('studentAccessNameLabel').textContent = 'Existing Student ID';
}
const code = document.getElementById('studentAccessCode');
code.hidden = fields.code.disabled = registering || action === 'sign-in';
document.getElementById('studentAccessCodeLabel').textContent = { setup: 'Setup code', reset: 'Reset code', backup: 'Backup key' }[action] || '';
if (action === 'backup') fields.code.autocomplete = 'off';
fields.passphrase.autocomplete = action === 'sign-in' ? 'current-password' : 'new-password';
fields.passphrase.minLength = action === 'sign-in' ? 1 : 15;
document.getElementById('studentAccessPasswordHint').hidden = action === 'sign-in';
document.querySelectorAll('[data-student-access-mode]').forEach(link => {
    link.hidden = link.dataset.studentAccessMode === mode ||
        (registering && link.dataset.studentAccessMode !== 'sign-in');
});

function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
}

let ready = false, busy = false;
let requestId;
let pendingSignIn;
let pageActive = true;
const recoveryLockedFields = new Set();
async function checkAvailability() {
    retry.hidden = true;
    message('Checking student access…');
    ready = await studentAccessAvailable({ signup: registering });
    submit.disabled = !ready;
    retry.hidden = ready;
    message(ready ? '' : 'Student account access is temporarily unavailable. Try again, or play the practice lesson below while you wait.', !ready);
}
retry.addEventListener('click', checkAvailability);

function showReceipt({username, studentId, recoveryCode}, signedIn = true) {
    document.getElementById('studentAccessReceiptId').textContent = username || studentId;
    document.getElementById('studentAccessReceiptLabel').textContent = username ? 'Username' : 'Existing Student ID';
    document.getElementById('studentAccessReceiptKey').textContent = recoveryCode;
    form.hidden = true;
    document.getElementById('studentAccessModes').hidden = true;
    document.getElementById('studentAccessHelp').hidden = true;
    const continueLink = document.getElementById('studentAccessContinue');
    continueLink.href = signedIn ? destination : 'student-access.html';
    continueLink.textContent = !signedIn ? 'Go to student sign-in' : action === 'setup' ? 'Continue to My Class' : 'Continue to my dashboard';
    receipt.hidden = false;
    document.getElementById('studentAccessReceiptTitle').focus();
}

window.addEventListener('pagehide', () => {
    pageActive = false;
    pendingSignIn = undefined;
    form.reset();
    document.getElementById('studentAccessReceiptId').textContent = '';
    document.getElementById('studentAccessReceiptKey').textContent = '';
});
window.addEventListener('pageshow', event => {
    if (event.persisted) location.reload();
});

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || busy) return;
    busy = submit.disabled = true;
    message(registering ? 'Creating your account…' : 'Checking your student account…');
    try {
        const data = Object.fromEntries(new FormData(form));
        const [{ auth }, { browserSessionPersistence, setPersistence, signInWithCustomToken }, { studentAccessRequest }] = await Promise.all([
            import('./firebase-config.js'),
            import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
            import('./student-access-client.js')
        ]);
        await setPersistence(auth, browserSessionPersistence);
        if (!pageActive) return;
        if (registering || recovering) {
            requestId ??= studentTabStorage.getItem(requestKey) || crypto.randomUUID();
            studentTabStorage.setItem(requestKey, requestId);
            if (registering) data.registrationKey = requestId;
            else data.recoveryRequestId = requestId;
        }
        // A consumed recovery code must not be submitted again after a sign-in failure.
        const response = pendingSignIn || await studentAccessRequest({ ...data, action });
        if (!pageActive) return;
        pendingSignIn = response;
        const { token, username: savedUsername, studentId, recoveryCode } = pendingSignIn;
        await signInWithCustomToken(auth, token);
        if (!pageActive) return;
        pendingSignIn = undefined;
        requestId = null;
        studentTabStorage.removeItem(requestKey);
        form.reset();
        if ((savedUsername || studentId) && recoveryCode) {
            message('');
            showReceipt(response);
            return;
        }
        message(action === 'setup' ? 'Opening My Class…' : 'Opening your dashboard…');
        navigatePage(destination, { replace: true });
    } catch (error) {
        if (!pageActive) return;
        const code = error.code?.split('/').at(-1);
        if (pendingSignIn && ['invalid-custom-token','custom-token-mismatch'].includes(code)) {
            const receiptData = pendingSignIn;
            pendingSignIn = undefined;
            if ((receiptData.username || receiptData.studentId) && receiptData.recoveryCode) {
                requestId = null;
                studentTabStorage.removeItem(requestKey);
                form.reset();
                message('Your account is ready. Save your backup key, then sign in with your passphrase.');
                showReceipt(receiptData, false);
                return;
            }
            for (const field of recoveryLockedFields) field.disabled = false;
            recoveryLockedFields.clear();
            submit.textContent = buttonText;
            message('Sign-in could not be verified. Try signing in again.', true);
        } else if (pendingSignIn) {
            message('Your account is ready, but sign-in could not be confirmed. Check your connection, then select Try signing in again.', true);
            for (const field of Object.values(fields)) {
                if (field instanceof HTMLInputElement && !field.disabled) {
                    recoveryLockedFields.add(field);
                    field.disabled = true;
                }
            }
            submit.textContent = 'Try signing in again';
        } else if (action === 'backup' && code === 'permission-denied') {
            message('Check your username and backup key. Each key works once. If you still need help, ask your current teacher for a reset code.', true);
        } else {
            if (registering && code === 'already-exists') {
                requestId = null;
                studentTabStorage.removeItem(requestKey);
            }
            const fallback = registering ? 'We couldn’t confirm your account. Try again here with the same username and passphrase.'
                : recovering ? 'We couldn’t confirm the reset. Stay in this tab and try again with the same username, code, and new passphrase.'
                : 'Student sign-in is temporarily unavailable. Try again when connected.';
            message(['permission-denied', 'resource-exhausted', 'invalid-argument', 'failed-precondition', 'already-exists'].includes(code) ? error.message : fallback, true);
        }
        busy = submit.disabled = false;
    }
});

await checkAvailability();
