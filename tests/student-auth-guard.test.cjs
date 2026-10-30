const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../js/auth-guard.js'), 'utf8')
    .replace(/import[\s\S]*?from\s+"[^"]+";/g, '');
const activeStudent = {role: 'student', status: 'active'};
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return {promise, resolve, reject};
};
const snapshot = profile => ({exists: () => profile !== null, data: () => profile});

function fixture({role = 'student', user = {uid: 'student'}, topLevel = false, localPreferences = false} = {}) {
    const classes = new Set(['auth-checking']), handlers = new Map(), roots = [{inert: false}, {inert: false}];
    const dialogs = [], redirects = [], reads = [], errors = [], mounts = [];
    const state = {profile: activeStudent, readError: null, readGate: null, signOutError: null, signOutGate: null, signedOut: 0, audioStops: 0};
    const auth = {currentUser: user};
    let listener;
    const window = {
        location: {href: 'https://school.example/pages/story.html?chapter=c1&mission=m1#clues', pathname: '/pages/story.html', search: '?chapter=c1&mission=m1', hash: '#clues', replace: value => redirects.push(value)},
        parent: {LakbayStudentAudio: {stop() { state.audioStops++; }}},
        addEventListener: (name, callback) => handlers.set(name, callback)
    };
    window.self = window;
    window.top = topLevel ? window : {};
    const body = {
        dataset: {role, localPreferences: String(localPreferences)},
        classList: {add: value => classes.add(value), remove: value => classes.delete(value)},
        append: dialog => dialogs.push(dialog)
    };
    const context = vm.createContext({window, URL, auth, db: {},
        document: {body, querySelectorAll: () => roots, createElement: () => {
            const callbacks = new Map();
            const button = {addEventListener: (name, callback) => callbacks.set('button:' + name, callback), click: () => callbacks.get('button:click')()};
            return {open: false, setAttribute() {}, querySelector: () => button,
                addEventListener: (name, callback) => callbacks.set(name, callback),
                cancel: event => callbacks.get('cancel')(event),
                showModal() { this.open = true; }, close() { this.open = false; }};
        }},
        console: {error: (...args) => errors.push(args)},
        mountStudentProfile: profile => mounts.push(profile),
        onAuthStateChanged: (_, callback) => { listener = callback; },
        signOut: async () => {
            state.signedOut++;
            if (state.signOutGate) await state.signOutGate.promise;
            if (state.signOutError) throw state.signOutError;
            auth.currentUser = null;
            if (listener) await listener(null);
        },
        doc: (_, collection, uid) => ({collection, uid}),
        // A cached active value is deliberately available, but cannot authorize access.
        getDoc: () => { throw Error('Cache-capable profile read used by the guard'); },
        getDocFromServer: async reference => {
            reads.push(reference);
            const {profile, readError, readGate} = state;
            if (readGate) await readGate.promise;
            if (readError) throw readError;
            return snapshot(profile);
        }
    });
    vm.runInContext(source, context);
    return {auth, state, roots, redirects, reads, errors, mounts, dialogs, classes,
        authenticated: () => classes.has('authenticated'),
        check: nextUser => { if (nextUser !== undefined) auth.currentUser = nextUser; return listener(auth.currentUser); },
        notify: staleUser => listener(staleUser),
        event: (name, persisted = true) => handlers.get(name)({persisted})};
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function assertLocked(f) {
    assert.equal(f.authenticated(), false);
    assert.ok(f.roots.every(root => root.inert));
}

test('direct protected access stays locked until a fresh active student profile arrives', async () => {
    const f = fixture();
    assertLocked(f);
    f.state.readGate = deferred();
    const pending = f.check();
    assertLocked(f);
    assert.deepEqual(f.reads.map(ref => [ref.collection, ref.uid]), [['users', 'student']]);
    f.state.readGate.resolve();
    await pending;
    assert.equal(f.authenticated(), true);
    assert.ok(f.roots.every(root => !root.inert));
    assert.equal(f.mounts.length, 1);
    assert.equal(f.redirects.length, 0);
});

test('signed-out direct access redirects once without reading a profile', async () => {
    const f = fixture({user: null});
    await f.check();
    await f.check({uid: 'later'});
    assertLocked(f);
    assert.deepEqual(f.redirects, ['login.html']);
    assert.equal(f.reads.length, 0);
    assert.equal(f.mounts.length, 0);
});

for (const localPreferences of [false, true]) {
    test(`server failure keeps ${localPreferences ? 'settings' : 'student pages'} locked and retryable without sign-out`, async () => {
        const f = fixture({localPreferences});
        f.state.readError = Error('Offline; a cached active profile is insufficient');
        await f.check();
        assertLocked(f);
        assert.equal(f.state.signedOut, 0);
        assert.equal(f.redirects.length, 0);
        assert.equal(f.mounts.length, 0);
        assert.equal(f.dialogs[0].open, true);
        let cancelled = false;
        f.dialogs[0].cancel({preventDefault() { cancelled = true; }});
        assert.equal(cancelled, true);
        f.state.readError = null;
        await f.dialogs[0].querySelector('button').click();
        assert.equal(f.authenticated(), true);
        assert.equal(f.dialogs[0].open, false);
        assert.equal(f.reads.length, 2);
    });
}

for (const profile of [null, {role: 'student', status: 'inactive'}, {role: 'student', status: 'pending'}, {role: 'student'}]) {
    test(`missing or unapproved server profile denies access: ${JSON.stringify(profile)}`, async () => {
        const f = fixture();
        f.state.profile = profile;
        await f.check();
        assertLocked(f);
        assert.equal(f.state.signedOut, 1);
        assert.deepEqual(f.redirects, ['login.html']);
        assert.equal(f.mounts.length, 0);
    });
}

for (const role of ['teacher', 'admin', 'unknown', null]) {
    test(`wrong role redirects to a fixed destination and never reveals student content: ${role}`, async () => {
        const f = fixture();
        f.state.profile = {role, status: 'active'};
        await f.check();
        assertLocked(f);
        assert.deepEqual(f.redirects, [role === 'teacher' || role === 'admin' ? `${role}-dashboard.html` : 'login.html']);
        assert.equal(f.mounts.length, 0);
        assert.equal(f.state.audioStops, 1);
        await f.check();
        assert.equal(f.redirects.length, 1);
    });
}

test('inactive account remains locked and reaches sign-in even when sign-out fails', async () => {
    const f = fixture();
    f.state.profile = {role: 'student', status: 'inactive'};
    f.state.signOutError = Error('Storage failure');
    await f.check();
    assertLocked(f);
    assert.equal(f.auth.currentUser.uid, 'student');
    assert.equal(f.state.signedOut, 1);
    assert.deepEqual(f.redirects, ['login.html']);
    assert.equal(f.dialogs.length, 0);
    assert.equal(f.mounts.length, 0);
    await f.check();
    assert.equal(f.reads.length, 1);
});

test('auth notifications during denied-account sign-out cannot start a competing grant', async () => {
    const f = fixture();
    f.state.profile = null;
    f.state.signOutGate = deferred();
    const pending = f.check();
    await flush();
    f.state.profile = activeStudent;
    await f.check();
    assertLocked(f);
    assert.equal(f.reads.length, 1);
    f.state.signOutGate.resolve();
    await pending;
    assert.deepEqual(f.redirects, ['login.html']);
});

test('a stale success cannot reveal a page after sign-out or another signed-in user', async () => {
    for (const nextUser of [null, {uid: 'other-student'}]) {
        const f = fixture();
        f.state.readGate = deferred();
        const pending = f.check();
        f.auth.currentUser = nextUser;
        if (!nextUser) await f.check();
        f.state.readGate.resolve();
        await pending;
        assertLocked(f);
        assert.equal(f.mounts.length, 0);
    }
});

test('a newer same-user denial wins over an older success or failure', async () => {
    for (const staleFails of [false, true]) {
        const f = fixture();
        f.state.readGate = deferred();
        const oldGate = f.state.readGate;
        if (staleFails) f.state.readError = Error('Old request failed');
        const stale = f.check();
        f.state.readGate = null;
        f.state.readError = null;
        f.state.profile = {role: 'teacher', status: 'active'};
        await f.check();
        oldGate.resolve();
        await stale;
        assertLocked(f);
        assert.equal(f.mounts.length, 0);
        assert.equal(f.dialogs.length, 0);
        assert.deepEqual(f.redirects, ['teacher-dashboard.html']);
    }
});

test('a newer successful retry ignores an older failed request', async () => {
    const f = fixture();
    f.state.readGate = deferred();
    const oldGate = f.state.readGate;
    f.state.readError = Error('Old network failure');
    const stale = f.check();
    f.state.readGate = null;
    f.state.readError = null;
    await f.check();
    oldGate.resolve();
    await stale;
    assert.equal(f.authenticated(), true);
    assert.equal(f.dialogs.length, 0);
    assert.equal(f.mounts.length, 1);
});

test('a delayed auth notification checks the actual current session', async () => {
    const f = fixture({user: {uid: 'new-student'}});
    await f.notify(null);
    assert.equal(f.authenticated(), true);
    assert.equal(f.reads[0].uid, 'new-student');
    assert.equal(f.redirects.length, 0);
    f.auth.currentUser = null;
    await f.notify({uid: 'new-student'});
    assertLocked(f);
    assert.deepEqual(f.redirects, ['login.html']);
    assert.equal(f.reads.length, 1);
});

test('pagehide locks immediately, ignores a pending grant, and pageshow requires a new server read', async () => {
    const f = fixture();
    await f.check();
    assert.equal(f.authenticated(), true);
    f.state.readGate = deferred();
    const oldGate = f.state.readGate;
    const stale = f.check();
    f.event('pagehide');
    assertLocked(f);
    oldGate.resolve();
    await stale;
    assertLocked(f);
    const readCount = f.reads.length;
    await f.check();
    assert.equal(f.reads.length, readCount);
    f.state.readGate = deferred();
    f.event('pageshow');
    assertLocked(f);
    assert.equal(f.reads.length, readCount + 1);
    f.state.readGate.resolve();
    await flush();
    assert.equal(f.authenticated(), true);
    assert.equal(f.mounts.length, 2);
});

test('restored pages deny revoked profiles and remain locked when revalidation is offline', async () => {
    for (const offline of [false, true]) {
        const f = fixture({localPreferences: true});
        await f.check();
        f.event('pagehide');
        f.state.profile = {role: 'student', status: 'inactive'};
        if (offline) f.state.readError = Error('Offline on restore');
        f.event('pageshow');
        await flush();
        assertLocked(f);
        assert.equal(f.reads.length, 2);
        assert.equal(f.mounts.length, 1);
        if (offline) {
            assert.equal(f.dialogs[0].open, true);
            assert.equal(f.state.signedOut, 0);
        } else assert.deepEqual(f.redirects, ['login.html']);
    }
});

test('pagehide closes recovery and a failed hidden request cannot reopen it', async () => {
    const f = fixture();
    f.state.readError = Error('Offline');
    await f.check();
    assert.equal(f.dialogs[0].open, true);
    f.state.readGate = deferred();
    const pending = f.check();
    f.event('pagehide');
    f.state.readGate.resolve();
    await pending;
    assertLocked(f);
    assert.equal(f.dialogs[0].open, false);
});

test('a denied-account sign-out failure from before pagehide cannot redirect a freshly verified restore', async () => {
    const f = fixture();
    f.state.profile = null;
    f.state.signOutGate = deferred();
    f.state.signOutError = Error('Old storage failure');
    const pending = f.check();
    await flush();
    f.event('pagehide');
    f.state.profile = activeStudent;
    f.event('pageshow');
    await flush();
    assert.equal(f.authenticated(), true);
    f.state.signOutGate.resolve();
    await pending;
    assert.equal(f.authenticated(), true);
    assert.equal(f.redirects.length, 0);
    assert.equal(f.mounts.length, 1);
});

test('top-level student URLs preserve the activity inside one fixed shell redirect', () => {
    const f = fixture({topLevel: true});
    assertLocked(f);
    assert.equal(f.reads.length, 0);
    const target = new URL(f.redirects[0]);
    assert.equal(target.origin, 'https://school.example');
    assert.equal(target.pathname, '/pages/student-shell.html');
    assert.equal(target.searchParams.get('route'), 'story.html?chapter=c1&mission=m1#clues');
    assert.equal(f.redirects.length, 1);
    f.event('pageshow', false);
    assert.equal(f.redirects.length, 1);
});

test('non-student verification errors also remain locked when sign-out fails', async () => {
    const f = fixture({role: 'teacher', topLevel: true});
    f.state.readError = Error('Offline');
    f.state.signOutError = Error('Storage failure');
    await f.check();
    assertLocked(f);
    assert.deepEqual(f.redirects, ['login.html']);
});
