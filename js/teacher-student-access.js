import { auth } from './firebase-config.js';
import { studentAccessAvailable } from './student-access-configuration.js';
import { studentAccessRequest } from './student-access-client.js';

export function mountTeacherStudentAccess(parent) {
    const panel = document.createElement('details');
    panel.className = 'teacher-student-access';
    panel.hidden = true;
    panel.innerHTML = `
        <summary>Student account recovery</summary>
        <p>If an enrolled student with a username loses access, you can issue a private reset code.</p>
        <form>
            <label>Student username <input name="username" maxlength="24" spellcheck="false" autocomplete="off" required></label>
            <button type="submit" class="secondary">Issue a reset code</button>
        </form>
        <p class="teacher-note">Verify the student’s identity first. You can find their username under Student Progress. Give the reset code directly to the student and keep their passphrase and backup key private.</p>
        <p role="status" class="teacher-note"></p>
        <button class="secondary" type="button" data-student-access-retry hidden>Check availability again</button>
        <section class="teacher-student-access-code" hidden aria-label="Private student access code"></section>`;
    parent.append(panel);
    const form = panel.querySelector('form'), result = panel.querySelector('section'), status = panel.querySelector('[role="status"]');
    const replace = form.querySelector('button');
    const retry = panel.querySelector('[data-student-access-retry]');
    let context, generation = 0, busy = false, enabled = false;

    function sync() {
        panel.hidden = !context;
        replace.disabled = !context || !enabled || busy;
    }

    async function checkAvailability() {
        if (!context || enabled) return;
        const requestGeneration = generation;
        retry.hidden = true;
        status.textContent = 'Checking student account recovery…';
        const available = await studentAccessAvailable();
        if (generation !== requestGeneration) return;
        enabled = available;
        retry.hidden = available;
        status.textContent = available ? '' : 'Student account recovery is temporarily unavailable. Try again before issuing a code.';
        sync();
    }

    async function request(username) {
        const active = context, user = auth.currentUser, requestGeneration = generation;
        if (busy || !enabled || !active || !user) return;
        const isCurrent = () => generation === requestGeneration && user === auth.currentUser;
        busy = true;
        sync();
        result.hidden = true;
        result.replaceChildren();
        status.textContent = 'Creating a private code…';
        try {
            const record = await studentAccessRequest({ action: 'reissue', classId: active, username });
            if (!isCurrent()) return;
            const label = document.createElement('strong');
            label.textContent = record.kind === 'reset' ? 'Passphrase reset code' : 'Account setup code';
            const id = document.createElement('p');
            id.textContent = record.username ? 'Username ' + record.username : 'Existing Student ID ' + record.studentId;
            const code = document.createElement('code');
            code.textContent = record.code;
            const expiry = document.createElement('p');
            expiry.textContent = 'Expires ' + new Date(record.expiresAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) + ' Philippine time';
            result.append(label, id, code, expiry);
            if (record.kind === 'setup') {
                const legacySetup = document.createElement('a');
                legacySetup.href = 'student-access.html?mode=teacher-setup';
                legacySetup.textContent = 'Open the existing-code setup page';
                result.append(legacySetup);
            }
            result.hidden = false;
            status.textContent = record.kind === 'reset' ? 'Give this code directly to the student. They can select “I have a teacher’s reset code” on the student sign-in page.' :
                'Give both values directly to the student. An unused setup code can be replaced using the same Student ID.';
            form.reset();
        } catch (error) {
            if (!isCurrent()) return;
            const code = error.code?.split('/').at(-1);
            status.textContent = ['permission-denied', 'resource-exhausted', 'failed-precondition'].includes(code) ? error.message : 'Could not create a code. Please try again.';
        } finally {
            if (isCurrent()) { busy = false; sync(); }
        }
    }

    retry.addEventListener('click', checkAvailability);
    form.addEventListener('submit', event => {
        event.preventDefault();
        void request(form.elements.username.value);
    });
    return classId => {
        if (context === classId) return;
        context = classId;
        generation++;
        busy = false;
        panel.open = false;
        result.hidden = true;
        result.replaceChildren();
        status.textContent = '';
        retry.hidden = true;
        form.reset();
        sync();
        void checkAvailability();
    };
}
