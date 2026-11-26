import { navigatePage } from './route-navigation.js';
import { studentAccessAvailable } from './student-access-configuration.js';
import { studentTabStorage } from './student-session-storage.js';

const modes = {
    'sign-in': {
        title: 'Sign in with a username',
        description: 'Enter your student username and passphrase.',
        button: 'Log in'
    },
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
} else {
    initializeStudentAccess(Object.hasOwn(modes, requestedMode) ? requestedMode : 'sign-in');
}

function initializeStudentAccess(mode) {
    const { title, description, code: codeLabel, button: buttonText } = modes[mode];
    const recovering = mode !== 'sign-in';
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
    const methods = element('studentAccessMethods');
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
    if (recovering) {
        form.closest('.auth-portal').classList.remove('auth-sign-in');
        const back = element('studentAccessBack');
        back.href = 'student-access.html';
        back.textContent = '← Back to username sign-in';
        methods.hidden = true;
        element('studentAccessSignup').hidden = true;
        element('studentAccessRemember').hidden = true;
        element('studentAccessHelpTitle').textContent = 'Other ways to recover your account';
        element('studentAccessLegacyHelp').hidden = true;
        element('studentAccessCode').hidden = fields.code.disabled = false;
        element('studentAccessCodeLabel').textContent = codeLabel;
        fields.code.placeholder = 'Enter your ' + codeLabel.toLowerCase();
        if (mode === 'backup') fields.code.autocomplete = 'off';
        element('studentAccessPassphraseLabel').textContent = 'New passphrase';
        element('studentAccessPasswordHint').hidden = false;
        fields.passphrase.autocomplete = 'new-password';
        fields.passphrase.minLength = 15;
        fields.passphrase.placeholder = 'Choose a new passphrase';
        fields.passphrase.setAttribute('aria-describedby', 'studentAccessPasswordHint');
        const passphraseToggle = form.querySelector('[aria-controls="studentAccessPassphrase"]');
        passphraseToggle.dataset.passwordLabel = 'new passphrase';
        passphraseToggle.setAttribute('aria-label', 'Show new passphrase');
        element('studentAccessConfirm').hidden = confirmation.disabled = false;
        const currentRecoveryLink = document.querySelector('[data-student-access-mode="' + mode + '"]');
        if (currentRecoveryLink) currentRecoveryLink.hidden = true;
    }
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
        form.hidden = methods.hidden = element('studentAccessHelp').hidden = true;
        const continueLink = element('studentAccessContinue');
        continueLink.href = signedIn ? destination : 'student-access.html';
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
        if (recovering && !pendingSignIn && fields.passphrase.value !== confirmation.value) {
            message('Your passphrases don’t match. Enter the same passphrase in both fields.', true);
            confirmation.focus();
            return;
        }

        busy = submit.disabled = true;
        const data = pendingSignIn ? null : Object.fromEntries(new FormData(form));
        const remember = !recovering && element('studentAccessRememberMe').checked;
        message(recovering && !pendingSignIn ? 'Updating your student account…' : 'Signing in…');
        try {
            const [{ auth }, { browserLocalPersistence, browserSessionPersistence, setPersistence, signInWithCustomToken }, { studentAccessRequest }] = await Promise.all([
                import('./firebase-config.js'),
                import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
                import('./student-access-client.js')
            ]);
            await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
            if (!pageActive) return;
            if (!pendingSignIn) {
                if (recovering) {
                    requestId ??= studentTabStorage.getItem(requestKey) || crypto.randomUUID();
                    studentTabStorage.setItem(requestKey, requestId);
                    data.recoveryRequestId = requestId;
                }
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
                message(recovering
                    ? 'Your passphrase was saved. Check your connection and try signing in again here.'
                    : 'Sign-in couldn’t finish. Check your connection and try again here.', true);
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
                const fallback = recovering
                    ? 'We couldn’t confirm the reset. Stay in this tab and try again with the same username, code, and new passphrase.'
                    : 'Student sign-in is temporarily unavailable. Try again when connected.';
                message(['permission-denied', 'resource-exhausted', 'invalid-argument', 'failed-precondition'].includes(code) ? error.message : fallback, true);
            }
            busy = submit.disabled = false;
        }
    });

    void checkAvailability();
}
