import { navigatePage } from './route-navigation.js';
import { studentAccessAvailable } from './student-access-configuration.js';
import { studentTabStorage } from './student-session-storage.js';

const modes = {
    'teacher-setup': {
        title: 'Finish classroom account setup',
        description: 'Use the Student ID and private setup code your teacher gave you.',
        code: 'Setup code',
        button: 'Finish setup'
    },
    backup: {
        title: 'Recover with your backup key',
        description: 'Enter the saved backup key for your username and choose a new passphrase.',
        code: 'Backup key',
        button: 'Reset and sign in'
    },
    reset: {
        title: 'Recover with a teacher’s reset code',
        description: 'Enter the private reset code from your teacher and choose a new passphrase.',
        code: 'Reset code',
        button: 'Reset and sign in'
    }
};

const requestedMode = new URLSearchParams(location.search).get('mode');
if (requestedMode === 'setup') {
    location.replace('register.html?method=username');
} else if (Object.hasOwn(modes, requestedMode)) {
    initializeStudentAccess(requestedMode);
} else {
    location.replace('login.html?method=username');
}

function initializeStudentAccess(mode) {
    const { title, description, code: codeLabel, button: buttonText } = modes[mode];
    const classroomSetup = mode === 'teacher-setup';
    const action = classroomSetup ? 'setup' : mode;
    const destination = classroomSetup ? 'student-shell.html?route=my-class.html' : 'student-shell.html';
    const requestKey = 'lakbay:student-access-request:' + action;

    const element = id => document.getElementById(id);
    const form = element('studentAccessForm');
    const fields = form.elements;
    const confirmation = element('studentAccessConfirmPassphrase');
    const submit = form.querySelector('button[type="submit"]');
    const status = element('studentAccessStatus');
    const availability = element('studentAccessAvailability');
    const availabilityText = element('studentAccessAvailabilityText');
    const retry = element('studentAccessRetry');
    const receipt = element('studentAccessReceipt');

    let ready = false;
    let busy = false;
    let requestId;
    let pendingSignIn;
    let pageActive = true;
    const recoveryLockedFields = new Set();

    document.title = title + ' | LakbayPanahon';
    element('studentAccessTitle').textContent = title;
    element('studentAccessDescription').textContent = description;
    submit.textContent = buttonText;
    element('studentAccessCodeLabel').textContent = codeLabel;
    fields.code.placeholder = 'Enter your ' + codeLabel.toLowerCase();
    if (mode === 'backup') fields.code.autocomplete = 'off';
    const currentRecoveryLink = document.querySelector('[data-student-access-mode="' + mode + '"]');
    if (currentRecoveryLink) currentRecoveryLink.hidden = true;
    if (classroomSetup) {
        const names = element('studentAccessNames');
        names.hidden = names.disabled = false;
        element('studentAccessNameLabel').textContent = 'Existing Student ID';
        fields.username.placeholder = 'Enter your Student ID';
    }

    function message(text, error = false) {
        status.textContent = text;
        status.classList.toggle('error', error);
    }

    async function checkAvailability() {
        if (retry.getAttribute('aria-disabled') === 'true') return;
        retry.setAttribute('aria-disabled', 'true');
        availability.dataset.state = 'checking';
        availabilityText.textContent = 'Checking username access… This can take about a minute if the service is starting.';
        ready = await studentAccessAvailable();
        if (!pageActive) return;
        form.inert = submit.disabled = !ready;
        if (ready && document.activeElement === retry) {
            (classroomSetup ? fields.firstName : fields.username).focus();
        }
        retry.removeAttribute('aria-disabled');
        availability.hidden = retry.hidden = ready;
        availability.dataset.state = ready ? 'ready' : 'unavailable';
        availabilityText.textContent = ready ? '' : 'Username access is unavailable right now. Check again in a moment.';
    }

    function showReceipt({ username, studentId, recoveryCode }, signedIn = true) {
        element('studentAccessReceiptId').textContent = username || studentId;
        element('studentAccessReceiptLabel').textContent = username ? 'Username' : 'Existing Student ID';
        element('studentAccessReceiptKey').textContent = recoveryCode;
        form.hidden = element('studentAccessHelp').hidden = true;
        const continueLink = element('studentAccessContinue');
        continueLink.href = signedIn ? destination : 'login.html?method=username';
        continueLink.textContent = !signedIn ? 'Go to student sign-in' : classroomSetup ? 'Continue to My Class' : 'Continue to my dashboard';
        receipt.hidden = false;
        element('studentAccessReceiptTitle').focus();
    }

    retry.addEventListener('click', checkAvailability);
    window.addEventListener('pagehide', () => {
        pageActive = false;
        pendingSignIn = undefined;
        form.reset();
        element('studentAccessReceiptId').textContent = '';
        element('studentAccessReceiptKey').textContent = '';
    });
    window.addEventListener('pageshow', event => {
        if (event.persisted) location.reload();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!ready || busy || form.hidden) return;
        if (!pendingSignIn && fields.passphrase.value !== confirmation.value) {
            message('Your passphrases don’t match. Enter the same passphrase in both fields.', true);
            confirmation.focus();
            return;
        }

        busy = submit.disabled = true;
        const data = pendingSignIn ? null : Object.fromEntries(new FormData(form));
        message(pendingSignIn ? 'Signing in…' : 'Updating your student account…');
        try {
            const [{ auth }, { browserSessionPersistence, setPersistence, signInWithCustomToken }, { studentAccessRequest }] = await Promise.all([
                import('./firebase-config.js'),
                import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
                import('./student-access-client.js')
            ]);
            await setPersistence(auth, browserSessionPersistence);
            if (!pageActive) return;
            if (!pendingSignIn) {
                requestId ??= studentTabStorage.getItem(requestKey) || crypto.randomUUID();
                studentTabStorage.setItem(requestKey, requestId);
                data.recoveryRequestId = requestId;
                pendingSignIn = await studentAccessRequest({ ...data, action });
            }
            if (!pageActive) return;
            const response = pendingSignIn;
            await signInWithCustomToken(auth, response.token);
            if (!pageActive) return;
            pendingSignIn = undefined;
            studentTabStorage.removeItem(requestKey);
            form.reset();
            if (response.recoveryCode) {
                showReceipt(response);
                return;
            }
            message(classroomSetup ? 'Opening My Class…' : 'Opening your dashboard…');
            navigatePage(destination, { replace: true });
        } catch (error) {
            if (!pageActive) return;
            const code = error.code?.split('/').at(-1);
            if (pendingSignIn && ['invalid-custom-token', 'custom-token-mismatch'].includes(code)) {
                const response = pendingSignIn;
                pendingSignIn = undefined;
                if (response.recoveryCode) {
                    studentTabStorage.removeItem(requestKey);
                    form.reset();
                    showReceipt(response, false);
                    return;
                }
                for (const field of recoveryLockedFields) field.disabled = false;
                recoveryLockedFields.clear();
                submit.textContent = buttonText;
                message('Sign-in could not be verified. Try signing in again.', true);
            } else if (pendingSignIn) {
                message('Your passphrase was saved. Check your connection and try signing in again here.', true);
                for (const field of [fields.username, fields.firstName, fields.middleName, fields.lastName, fields.code, fields.passphrase, confirmation]) {
                    if (!field.matches(':disabled')) {
                        recoveryLockedFields.add(field);
                        if (field === fields.passphrase || field === confirmation || field === fields.code) field.value = '';
                        field.disabled = true;
                    }
                }
                submit.textContent = 'Try signing in again';
            } else if (mode === 'backup' && code === 'permission-denied') {
                message('Check your username and backup key. If you still need help, ask your current teacher for a reset code.', true);
            } else {
                const fallback = 'We couldn’t confirm the reset. Stay in this tab and try again with the same username, code, and new passphrase.';
                message(['permission-denied', 'resource-exhausted', 'invalid-argument', 'failed-precondition'].includes(code) ? error.message : fallback, true);
            }
            busy = submit.disabled = false;
        }
    });

    void checkAvailability();
}
