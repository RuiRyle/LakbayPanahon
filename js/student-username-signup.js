import { studentAccessAvailable } from './student-access-configuration.js';
import { studentTabStorage } from './student-session-storage.js';

if (new URLSearchParams(window.location.search).get('method') === 'username') initializeUsernameSignup();

function initializeUsernameSignup() {
    const element = id => document.getElementById(id);
    const form = element('studentRegisterForm');
    const email = element('studentEmail');
    const username = element('studentSignupUsername');
    const passphrase = element('studentPassword');
    const confirmation = element('studentConfirmPassword');
    const submit = form.querySelector('button[type="submit"]');
    const availability = element('studentUsernameAvailability');
    const availabilityMessage = element('studentUsernameStatus');
    const retry = element('retryStudentUsernameSignup');
    const message = element('studentRegisterMessage');
    const receipt = element('studentSignupBackup');
    const receiptKey = element('studentSignupBackupKey');
    const requestKey = 'lakbay:student-access-request:register';
    let ready = false;
    let busy = false;
    let active = true;
    let pendingSignIn;
    let registrationKey;

    email.disabled = element('studentSignupEmailGroup').hidden = true;
    username.disabled = element('studentSignupUsernameGroup').hidden = false;
    element('studentSignupEmailMethod').removeAttribute('aria-current');
    element('studentSignupUsernameMethod').setAttribute('aria-current', 'page');
    element('studentSignupFormDescription').textContent = 'No email needed. Sign in with your username and passphrase.';
    element('studentSignupNotice').textContent = 'Your account saves your name, username and learning progress. Keep your passphrase and backup key private. Ask a parent or guardian if you need help.';
    for (const [field, label, placeholder] of [
        [passphrase, 'Passphrase', 'Create a passphrase'],
        [confirmation, 'Confirm passphrase', 'Enter your passphrase again']
    ]) {
        form.querySelector('label[for="' + field.id + '"]').textContent = label;
        field.placeholder = placeholder;
        const toggle = form.querySelector('.password-toggle[aria-controls="' + field.id + '"]');
        toggle.dataset.passwordLabel = label.toLowerCase();
        toggle.setAttribute('aria-label', 'Show ' + toggle.dataset.passwordLabel);
    }
    message.setAttribute('role', 'status');

    async function checkAvailability() {
        if (retry.getAttribute('aria-disabled') === 'true') return;
        availability.hidden = false;
        availability.dataset.state = 'checking';
        retry.setAttribute('aria-disabled', 'true');
        form.inert = true;
        submit.disabled = true;
        availabilityMessage.textContent = 'Checking username signup… This can take about a minute if the service is starting.';
        ready = await studentAccessAvailable({ signup: true });
        if (!active) return;
        form.inert = !ready;
        submit.disabled = !ready;
        if (ready && document.activeElement === retry) element('firstName').focus();
        availability.hidden = ready;
        retry.hidden = ready;
        retry.removeAttribute('aria-disabled');
        availability.dataset.state = ready ? 'ready' : 'unavailable';
        availabilityMessage.textContent = ready ? '' : 'Username signup is unavailable right now. Choose Email above to create your account.';
    }

    function showReceipt(account, signedIn) {
        form.hidden = true;
        element('studentSignupMethods').hidden = true;
        element('choose-account').hidden = true;
        element('studentSignupBackupUsername').textContent = account.username;
        receiptKey.textContent = account.recoveryCode;
        const continuation = element('studentSignupBackupContinue');
        if (!signedIn) {
            continuation.href = 'login.html?method=username';
            continuation.textContent = 'Go to username sign-in';
        }
        receipt.hidden = false;
        element('studentSignupBackupTitle').focus();
    }

    function showMessage(text, warning = false) {
        message.textContent = text;
        message.classList.toggle('error', warning);
    }

    retry.addEventListener('click', checkAvailability);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!ready || busy || form.hidden || (!pendingSignIn && !form.reportValidity())) return;
        if (!pendingSignIn && passphrase.value !== confirmation.value) {
            showMessage('Your passphrases do not match.', true);
            confirmation.focus();
            return;
        }
        busy = submit.disabled = true;
        showMessage(pendingSignIn ? 'Signing in…' : 'Creating your account…');
        const details = pendingSignIn ? null : {
            username: username.value.trim(),
            passphrase: passphrase.value,
            firstName: element('firstName').value.trim(),
            middleName: element('middleName').value.trim(),
            lastName: element('lastName').value.trim()
        };
        try {
            const [{ auth }, { browserSessionPersistence, setPersistence, signInWithCustomToken }, { studentAccessRequest }] = await Promise.all([
                import('./firebase-config.js'),
                import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
                import('./student-access-client.js')
            ]);
            await setPersistence(auth, browserSessionPersistence);
            if (!active) return;
            if (!pendingSignIn) {
                registrationKey ??= studentTabStorage.getItem(requestKey) || crypto.randomUUID();
                studentTabStorage.setItem(requestKey, registrationKey);
                pendingSignIn = await studentAccessRequest({ action: 'register', registrationKey, ...details });
            }
            if (!active) return;
            await signInWithCustomToken(auth, pendingSignIn.token);
            if (!active) return;
            studentTabStorage.removeItem(requestKey);
            form.reset();
            if (pendingSignIn.recoveryCode) showReceipt(pendingSignIn, true);
            else window.location.replace('student-shell.html');
            pendingSignIn = undefined;
        } catch (error) {
            if (!active) return;
            const code = error.code?.split('/').at(-1);
            if (pendingSignIn?.recoveryCode && ['invalid-custom-token', 'custom-token-mismatch'].includes(code)) {
                studentTabStorage.removeItem(requestKey);
                form.reset();
                showReceipt(pendingSignIn, false);
                pendingSignIn = undefined;
            } else if (pendingSignIn) {
                passphrase.value = confirmation.value = '';
                passphrase.disabled = confirmation.disabled = true;
                showMessage('Your account is ready, but sign-in didn’t finish. Try signing in again here.', true);
                submit.textContent = 'Try signing in again';
            } else {
                if (code === 'already-exists') {
                    registrationKey = undefined;
                    studentTabStorage.removeItem(requestKey);
                }
                showMessage(['already-exists', 'invalid-argument', 'failed-precondition', 'resource-exhausted'].includes(code)
                    ? error.message
                    : 'We couldn’t confirm your account. Try again with the same username and passphrase.', true);
            }
        } finally {
            if (active) busy = submit.disabled = false;
        }
    });
    form.dataset.authReady = 'true';
    window.addEventListener('pagehide', () => {
        active = false;
        pendingSignIn = undefined;
        form.reset();
        receiptKey.textContent = '';
    });
    window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
    void checkAvailability();
}
