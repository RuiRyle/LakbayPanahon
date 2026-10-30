const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(
    fs.readFileSync(path.join(root, 'js/student-session-storage.js'), 'utf8')
).toString('base64'));

function tabStorage(entries = {}) {
    const values = new Map(Object.entries(entries));
    return {
        values,
        get length() { return values.size; },
        key(index) { return [...values.keys()][index] ?? null; },
        removeItem(key) { values.delete(key); }
    };
}

test('departing student cleanup removes only owned learning keys and catalogs', async () => {
    const {clearStudentSessionData} = await modulePromise;
    const owned = ['missionQuiz:alice:quiz1', 'missionQuizSet:alice:attempt1',
        'previewDraft:alice:quiz:mission1', 'lakbay-content-v1:["alice","chapters"]'];
    const retained = ['missionQuiz:alice2:quiz1', 'previewDraft:bob:story:m1',
        'lakbay-content-v1:["bob","chapters"]', 'lakbay-content-v1:invalid',
        'lakbayExplorationPreview', 'bayaniAppCheckDebug', 'music-epoch',
        'lakbay-sounds', 'firebase:authUser:example'];
    const storage = tabStorage(Object.fromEntries([...owned, ...retained].map(key => [key, 'saved'])));
    clearStudentSessionData(storage, 'alice');
    assert.deepEqual([...storage.values.keys()], retained);
    clearStudentSessionData(storage, 'alice');
    assert.deepEqual([...storage.values.keys()], retained);
});

test('missing identity and inaccessible storage do not block logout', async () => {
    const {clearStudentSessionData} = await modulePromise;
    const storage = tabStorage({'missionQuiz:alice:q': 'saved'});
    for (const uid of [undefined, null, '', 4]) clearStudentSessionData(storage, uid);
    assert.equal(storage.length, 1);
    assert.doesNotThrow(() => clearStudentSessionData(null, 'alice'));
    assert.doesNotThrow(() => clearStudentSessionData({get length() { throw Error('blocked'); }}, 'alice'));
    const partial = tabStorage({'missionQuiz:alice:q': 'saved', 'previewDraft:alice:story:m': 'saved'});
    partial.removeItem = key => { if (key.startsWith('missionQuiz:')) throw Error('blocked'); partial.values.delete(key); };
    assert.doesNotThrow(() => clearStudentSessionData(partial, 'alice'));
    assert.equal(partial.values.has('previewDraft:alice:story:m'), false);
});

async function logoutFixture({failure = false, blockedStorage = false} = {}) {
    const {clearStudentSessionData} = await modulePromise;
    const source = fs.readFileSync(path.join(root, 'js/logout.js'), 'utf8')
        .replace(/import[\s\S]*?from\s+"[^"]+";/g, '');
    const storage = tabStorage({'missionQuiz:alice:q': 'attempt', 'previewDraft:bob:story:m': 'other'});
    let ready, listener, resolveSignOut;
    const events = [], originalChildren = [{nodeName:'svg'}, {nodeName:'span'}];
    const button = {
        disabled: false, childNodes: originalChildren,
        addEventListener(kind, fn) { this.click = fn; },
        replaceChildren(...children) { this.restored = children; }
    };
    const auth = {currentUser:{uid:'alice'}};
    const window = {
        location:{replace(target) { events.push(['navigate', target]); }},
        parent:{LakbayStudentAudio:{stop() { events.push(['audio']); }}}
    };
    Object.defineProperty(window, 'sessionStorage', {get() { if (blockedStorage) throw Error('blocked'); return storage; }});
    const context = vm.createContext({
        auth, window, clearStudentSessionData,
        document:{addEventListener(kind, fn) { ready = fn; }, querySelectorAll() { return [button]; }},
        onAuthStateChanged(_, fn) { listener = fn; fn(auth.currentUser); },
        signOut() {
            events.push(['signOut']);
            return new Promise((resolve, reject) => { resolveSignOut = () => {
                if (failure) { reject(Error('failed')); return; }
                auth.currentUser = null; listener(null); resolve();
            }; });
        },
        alert(message) { events.push(['alert', message]); },
        console:{log() {}, error() {}}
    });
    vm.runInContext(source, context); ready();
    return {auth, button, storage, events, listener, originalChildren, finish() { resolveSignOut(); }};
}

test('logout waits for sign-out, prevents duplicate submission and clears owned state', async () => {
    const fixture = await logoutFixture();
    const pending = fixture.button.click();
    await fixture.button.click();
    assert.equal(fixture.events.length, 1);
    assert.equal(fixture.storage.length, 2);
    fixture.finish(); await pending;
    assert.equal(fixture.storage.values.has('missionQuiz:alice:q'), false);
    assert.equal(fixture.storage.values.has('previewDraft:bob:story:m'), true);
    assert.deepEqual(fixture.events, [['signOut'], ['audio'], ['navigate','login.html']]);
});

test('failed logout preserves the session, restores the original button and permits retry', async () => {
    const fixture = await logoutFixture({failure:true});
    const pending = fixture.button.click(); fixture.finish(); await pending;
    assert.equal(fixture.storage.length, 2);
    assert.equal(fixture.auth.currentUser.uid, 'alice');
    assert.equal(fixture.button.disabled, false);
    assert.deepEqual(fixture.button.restored, fixture.originalChildren);
    assert.equal(fixture.events.some(event => event[0] === 'navigate'), false);
    const retry = fixture.button.click(); fixture.finish(); await retry;
    assert.equal(fixture.events.filter(event => event[0] === 'signOut').length, 2);
});

test('account switches clean the previous account and blocked storage does not prevent sign-out', async () => {
    const changed = await logoutFixture();
    changed.auth.currentUser = {uid:'bob'}; changed.listener(changed.auth.currentUser);
    assert.equal(changed.storage.values.has('missionQuiz:alice:q'), false);
    assert.equal(changed.storage.values.has('previewDraft:bob:story:m'), true);
    const blocked = await logoutFixture({blockedStorage:true});
    const pending = blocked.button.click(); blocked.finish(); await pending;
    assert.equal(blocked.events.some(event => event[0] === 'navigate'), true);
});
