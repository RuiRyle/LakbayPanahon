const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const requireFunctions = createRequire(require('node:path').join(__dirname, '../functions/package.json'));
const { initializeApp, deleteApp } = requireFunctions('firebase-admin/app');
const { getFirestore } = requireFunctions('firebase-admin/firestore');
const { createStudentRewards, grade, manilaDate } = require('../functions/student-rewards');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const project = 'demo-lakbaypanahon';
const host = process.env.FIRESTORE_EMULATOR_HOST;
assert.match(host || '', /^(127\.0\.0\.1|localhost):\d+$/, 'Run only against a local Firestore emulator.');
const app = initializeApp({ projectId: project });
const db = getFirestore(app);
const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
const now = new Date('2026-10-19T04:00:00Z');
const submit = createStudentRewards(db, () => now);
const missionRequest = (answers = { q1: 'A' }) => ({ auth: { uid: 'alice' }, data: {
    kind: 'mission', chapterId: 'c1', missionId: 'm1', quizId: 'quiz1', answers
} });
const seed = {
    'users/alice': { role: 'student', status: 'active', firstName: 'Alice', lastName: 'Test', email: 'alice@example.com', xp: 90, level: 1 },
    'users/bob': { role: 'student', status: 'active', firstName: 'Bob', lastName: 'Test', email: 'bob@example.com' },
    'chapters/c1': { eraId: 'era', order: 1, status: 'active' },
    'chapters/c2': { eraId: 'era', order: 2, status: 'active' },
    'missions/m1': { chapterId: 'c1', order: 1, status: 'active', xpReward: 25 },
    'missions/m2': { chapterId: 'c1', order: 2, status: 'active', xpReward: 30 },
    'quizzes/quiz1': { missionId: 'm1', status: 'active', passingScore: 60 },
    'quizzes/quiz2': { missionId: 'm2', status: 'active', passingScore: 60 },
    'questions/q1': { quizId: 'quiz1', status: 'active', correctAnswer: 'A' },
    'questions/q2': { quizId: 'quiz2', status: 'active', correctAnswer: 'B' },
    'artifacts/art1': { missionId: 'm1', status: 'active', name: 'Artifact' },
    'chapterChallenges/final': { chapterId: 'c1', status: 'active', passingScore: 70 },
    'chapterChallengeQuestions/fq': { challengeId: 'final', status: 'active', correctAnswer: 'C' },
    'badges/badge1': { chapterId: 'c1', status: 'active', name: 'Badge' },
    'dailyChallenges/daily1': { status: 'active', order: 1, correctAnswer: 'D', xpReward: 10 }
};

function token(uid) {
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
        sub: uid, user_id: uid, email: `${uid}@example.com`, aud: project,
        iss: `https://securetoken.google.com/${project}`, iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { sign_in_provider: 'password' }
    })}.`;
}
const encodeValue = value => typeof value === 'string' ? { stringValue: value } :
    typeof value === 'boolean' ? { booleanValue: value } :
    Array.isArray(value) ? { arrayValue: { values: value.map(encodeValue) } } :
    value && typeof value === 'object' ? { mapValue: { fields: encodeFields(value) } } :
    { integerValue: String(value) };
const encodeFields = values => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, encodeValue(value)]));
function decodeValue(value) {
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
    if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
    return value.timestampValue;
}
const decodeFields = fields => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
async function rest(method, path, data, uid = 'alice') {
    return fetch(`${base}${path.startsWith(':') ? '' : '/'}${path}`, { method,
        headers: { Authorization: `Bearer ${token(uid)}`, 'Content-Type': 'application/json' },
        body: data === undefined ? undefined : JSON.stringify(data) });
}
async function patch(path, values, uid = 'alice') {
    const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, encodeValue(value)]));
    const mask = Object.keys(fields).map(key => `updateMask.fieldPaths=${key}`).join('&');
    return rest('PATCH', `${path}?${mask}`, { fields }, uid);
}
before(async () => { await db.doc('health/check').set({ ready: true }); });
beforeEach(async () => {
    const response = await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: 'DELETE' });
    assert.equal(response.ok, true);
    const batch = db.batch();
    for (const [path, data] of Object.entries(seed)) batch.set(db.doc(path), data);
    await batch.commit();
});
after(async () => { await db.terminate(); await deleteApp(app); });

// Run the actual browser module against authenticated REST requests, so every
// write is evaluated by the emulator rules rather than bypassing them via Admin.
function freeClient(uid = 'alice') {
    const stamp = {};
    function snapshot(document) {
        return { id: document?.name.split('/').at(-1), exists: () => !!document,
            data: () => document ? decodeFields(document.fields || {}) : undefined,
            updateTime: document?.updateTime };
    }
    async function read(ref) {
        const response = await rest('GET', ref, undefined, uid);
        if (response.status === 404) return snapshot(null);
        if (!response.ok) throw new Error(await response.text());
        return snapshot(await response.json());
    }
    const context = vm.createContext({
        auth: { currentUser: { uid } }, db: {},
        collection: (_, name) => ({ name }), doc: (_, name, id) => `${name}/${id}`,
        where: (field, _, value) => ({ field, value }),
        query: (ref, condition) => ({ ...ref, condition }), getDoc: read,
        getDocs: async ref => {
            const structuredQuery = { from: [{ collectionId: ref.name }] };
            if (ref.condition) structuredQuery.where = { fieldFilter: {
                field: { fieldPath: ref.condition.field }, op: 'EQUAL', value: encodeValue(ref.condition.value)
            } };
            const response = await rest('POST', ':runQuery', { structuredQuery }, uid);
            if (!response.ok) throw new Error(await response.text());
            return { docs: (await response.json()).filter(row => row.document).map(row => snapshot(row.document)) };
        },
        serverTimestamp: () => stamp,
        runTransaction: async (_, callback) => {
            for (let attempt = 0; attempt < 6; attempt++) {
                const reads = new Map();
                const writes = [];
                function write(ref, values, update) {
                    const ordinary = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== stamp));
                    const transforms = Object.entries(values).filter(([, value]) => value === stamp)
                        .map(([fieldPath]) => ({ fieldPath, setToServerValue: 'REQUEST_TIME' }));
                    const item = { update: { name: `projects/${project}/databases/(default)/documents/${ref}`, fields: encodeFields(ordinary) } };
                    if (transforms.length) item.updateTransforms = transforms;
                    if (update) item.updateMask = { fieldPaths: Object.keys(ordinary) };
                    const prior = reads.get(ref);
                    item.currentDocument = prior?.exists() ? { updateTime: prior.updateTime } : { exists: false };
                    writes.push(item);
                }
                const result = await callback({
                    get: async ref => { const document = await read(ref); reads.set(ref, document); return document; },
                    set: (ref, values) => write(ref, values, false),
                    update: (ref, values) => write(ref, values, true)
                });
                if (!writes.length) return result;
                const response = await rest('POST', ':commit', { writes }, uid);
                if (response.ok) return result;
                const message = await response.text();
                if ([409, 412].includes(response.status)) continue;
                // The emulator can evaluate rules before checking optimistic
                // preconditions. Retry a denied commit only if a read changed.
                let changed = false;
                if (response.status === 403) {
                    for (const [ref, previous] of reads) {
                        const current = await read(ref);
                        if (current.exists() !== previous.exists() || current.updateTime !== previous.updateTime) changed = true;
                    }
                }
                if (changed) continue;
                throw new Error(message);
            }
            throw new Error('Concurrent write did not settle.');
        }
    });
    for (const name of ['learning-access.js', 'student-rewards-client.js']) {
        const source = fs.readFileSync(path.join(__dirname, '../js', name), 'utf8')
            .replace(/import[\s\S]*?from\s+"[^"]+";/g, '').replace(/export /g, '');
        vm.runInContext(source, context);
    }
    vm.runInContext('globalThis.submit = submitStudentActivity;', context);
    return context.submit;
}

test('free-plan client saves mission XP and artifact atomically and cannot pay twice', async () => {
    const submitFree = freeClient();
    const input = missionRequest().data;
    const results = await Promise.all([submitFree(input), submitFree(input)]);
    assert.equal(results.reduce((sum, result) => sum + result.xpReward, 0), 25);
    assert.equal((await db.doc('users/alice').get()).data().xp, 115);
    assert.equal((await db.doc('studentArtifacts/alice_art1').get()).exists, true);
    assert.equal((await submitFree(input)).xpReward, 0);
});

test('free-plan client preserves legacy rewards and backfills a missing artifact', async () => {
    await db.doc('studentProgress/alice_m1').set({ userId: 'alice', missionId: 'm1', chapterId: 'c1', quizId: 'quiz1', completed: true, bestScore: 70 });
    const result = await freeClient()(missionRequest().data);
    assert.equal(result.xpReward, 0);
    assert.equal(result.artifactResult.newlyEarned, true);
    assert.equal((await db.doc('users/alice').get()).data().xp, 90);
});

test('free-plan client rejects failures and locked content and saves chapter badge after prerequisites', async () => {
    const submitFree = freeClient();
    assert.equal((await submitFree(missionRequest({ q1: 'B' }).data)).passed, false);
    const second = { ...missionRequest({ q2: 'B' }).data, missionId: 'm2', quizId: 'quiz2' };
    await assert.rejects(submitFree(second), /previous missions/);
    const chapter = { kind: 'chapter', chapterId: 'c1', challengeId: 'final', answers: { fq: 'C' } };
    await assert.rejects(submitFree(chapter), /all chapter missions/);
    await submitFree(missionRequest().data);
    await submitFree(second);
    assert.equal((await submitFree(chapter)).badgeResult.newlyEarned, true);
    assert.equal((await submitFree(chapter)).badgeResult.newlyEarned, false);
});

test('free-plan daily saves once and sets a rules-validated streak and date', async () => {
    const submitFree = freeClient();
    const input = { kind: 'daily', challengeId: 'daily1', answer: 'D' };
    const results = await Promise.all([submitFree(input), submitFree(input)]);
    assert.equal(results.reduce((sum, result) => sum + result.xpReward, 0), 10);
    const profile = (await db.doc('users/alice').get()).data();
    assert.equal(profile.xp, 100);
    assert.equal(profile.learningStreak, 1);
    assert.equal(profile.lastStreakDate, manilaDate());
});

test('rules reject paired XP inflation, role escalation, and completion without its XP update', async () => {
    function write(ref, values, timestamps, update = false) {
        const item = { update: { name: `projects/${project}/databases/(default)/documents/${ref}`, fields: encodeFields(values) },
            updateTransforms: timestamps.map(fieldPath => ({ fieldPath, setToServerValue: 'REQUEST_TIME' })) };
        if (update) item.updateMask = { fieldPaths: Object.keys(values) };
        return item;
    }
    function missionWrites(amount, extra = {}) {
        return [write('studentProgress/alice_m1', {
            userId: 'alice', missionId: 'm1', chapterId: 'c1', quizId: 'quiz1',
            completed: true, bestScore: 100, xpEarned: amount
        }, ['completedAt', 'updatedAt']), write('users/alice', {
            xp: 90 + amount, level: Math.floor((90 + amount) / 100) + 1,
            lastRewardKind: 'mission', lastRewardId: 'm1', ...extra
        }, ['updatedAt'], true)];
    }
    assert.equal((await rest('POST', ':commit', { writes: missionWrites(9999) })).status, 403);
    assert.equal((await rest('POST', ':commit', { writes: missionWrites(25, { role: 'admin' }) })).status, 403);
    assert.equal((await rest('POST', ':commit', { writes: missionWrites(25).slice(0, 1) })).status, 403);
    assert.equal((await db.doc('studentProgress/alice_m1').get()).exists, false);
    assert.equal((await db.doc('users/alice').get()).data().xp, 90);
});

test('rules deny role, status, XP, level and streak tampering', async () => {
    for (const values of [{ role: 'admin' }, { status: 'disabled' }, { xp: 9999 }, { level: 99 }, { learningStreak: 100 }]) {
        assert.equal((await patch('users/alice', values)).status, 403);
    }
    assert.equal((await rest('GET', 'users/bob')).status, 403);
    assert.equal((await rest('GET', 'users/alice')).status, 200);
});

test('profile names and allowed avatars persist while protected fields remain unchanged', async () => {
    async function save(values, actor = 'alice', target = 'alice') {
        return rest('POST', ':commit', { writes: [{ update: {
            name: `projects/${project}/databases/(default)/documents/users/${target}`,
            fields: encodeFields(values)
        }, updateMask: { fieldPaths: Object.keys(values) },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }] }] }, actor);
    }
    const response = await save({ firstName: 'Ana', middleName: '', lastName: 'Dela Cruz', avatarId: 'book' });
    assert.equal(response.status, 200, await response.text());
    const saved = await rest('GET', 'users/alice');
    const profile = decodeFields((await saved.json()).fields);
    assert.equal(profile.firstName, 'Ana');
    assert.equal(profile.avatarId, 'book');
    assert.equal(profile.xp, 90);
    assert.equal(profile.role, 'student');
    assert.equal((await save({ avatarId: 'https://untrusted/avatar.png' })).status, 403);
    assert.equal((await save({ firstName: '' })).status, 403);
    assert.equal((await save({ lastName: 'A'.repeat(101) })).status, 403);
    assert.equal((await save({ avatarId: 'cat', xp: 9999 })).status, 403);
    assert.equal((await save({ avatarId: 'cat', role: 'admin' })).status, 403);
    assert.equal((await save({ avatarId: 'cat' }, 'bob', 'alice')).status, 403);
    for (const avatarId of ['initials', 'compass', 'book', 'sun', 'star', 'turtle', 'eagle', 'cat', 'rocket']) {
        assert.equal((await save({ avatarId })).status, 200);
    }
});

test('rules deny direct completion and reward writes, including self-owned records', async () => {
    for (const collection of ['studentProgress', 'studentChapterProgress', 'studentArtifacts', 'studentBadges', 'studentDailyChallenges']) {
        assert.equal((await patch(`${collection}/forged`, { userId: 'alice', completed: true })).status, 403);
    }
});

test('rules keep other students progress private and require filtered lists', async () => {
    for (const name of ['studentProgress', 'studentChapterProgress', 'studentArtifacts', 'studentBadges', 'studentDailyChallenges', 'studentPracticeProgress']) {
        await db.doc(`${name}/bob-record`).set({ userId: 'bob' });
        await db.doc(`${name}/alice-record`).set({ userId: 'alice' });
        assert.equal((await rest('GET', `${name}/bob-record`)).status, 403);
        assert.equal((await rest('GET', `${name}/alice-record`)).status, 200);
        const broad = await rest('POST', ':runQuery', { structuredQuery: { from: [{ collectionId: name }] } });
        assert.equal(broad.status, 403);
        const own = await rest('POST', ':runQuery', { structuredQuery: {
            from: [{ collectionId: name }], where: { fieldFilter: {
                field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: 'alice' }
            } }
        } });
        assert.equal(own.status, 200, await own.text());
    }
});

test('rules permit legitimate student/pending-teacher registration, reject forged roles/rewards', async () => {
    async function register(uid, extra) {
        const values = { firstName: uid, lastName: 'Test', email: `${uid}@example.com`, role: 'student', status: 'active', ...extra };
        const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, encodeValue(value)]));
        return rest('POST', ':commit', { writes: [{ update: {
            name: `projects/${project}/databases/(default)/documents/users/${uid}`, fields
        }, updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }] }] }, uid);
    }
    assert.equal((await register('newstudent')).status, 200);
    assert.equal((await register('newteacher', { role: 'teacher', status: 'pending' })).status, 200);
    assert.equal((await register('fakeadmin', { role: 'admin' })).status, 403);
    assert.equal((await register('faketeacher', { role: 'teacher' })).status, 403);
    assert.equal((await register('fakexp', { xp: 9999 })).status, 403);
});

test('backend denies unauthenticated/inactive students and locked activities', async () => {
    await assert.rejects(submit({ data: {} }), error => error.code === 'unauthenticated');
    const locked = missionRequest(); locked.data.missionId = 'm2'; locked.data.quizId = 'quiz2';
    await assert.rejects(submit(locked), /locked/);
    await db.doc('users/alice').update({ status: 'disabled' });
    await assert.rejects(submit(missionRequest()), error => error.code === 'permission-denied');
});

test('backend calculates scores, ignores supplied XP and does not reward failed answers', async () => {
    const wrong = missionRequest({ q1: 'B' }); wrong.data.score = 100; wrong.data.xpReward = 9999;
    const result = await submit(wrong);
    assert.equal(result.passed, false);
    assert.equal((await db.doc('users/alice').get()).data().xp, 90);
    assert.equal((await db.doc('studentProgress/alice_m1').get()).exists, false);
    await assert.rejects(submit(missionRequest({})), /every question/);
});

test('concurrent mission submissions award XP/artifact only once, then unlock the next mission', async () => {
    const results = await Promise.all([submit(missionRequest()), submit(missionRequest())]);
    assert.equal(results.filter(result => result.firstCompletion).length, 1);
    assert.equal(results.reduce((sum, result) => sum + result.xpReward, 0), 25);
    assert.equal((await db.doc('users/alice').get()).data().xp, 115);
    assert.equal((await db.doc('studentArtifacts/alice_art1').get()).exists, true);
    const second = missionRequest({ q2: 'B' }); second.data.missionId = 'm2'; second.data.quizId = 'quiz2';
    assert.equal((await submit(second)).passed, true);
});

test('chapter completion requires all missions and awards one badge on replay', async () => {
    const request = { auth: { uid: 'alice' }, data: { kind: 'chapter', chapterId: 'c1', challengeId: 'final', answers: { fq: 'C' } } };
    await assert.rejects(submit(request), /all chapter missions/);
    await submit(missionRequest());
    const second = missionRequest({ q2: 'B' }); second.data.missionId = 'm2'; second.data.quizId = 'quiz2';
    await submit(second);
    assert.equal((await submit(request)).badgeResult.newlyEarned, true);
    assert.equal((await submit(request)).badgeResult.newlyEarned, false);
    assert.equal((await db.doc('studentChapterProgress/alice_c1').get()).data().completed, true);
});

test('daily rewards use server date, reject wrong answers, and award once under concurrency', async () => {
    const request = { auth: { uid: 'alice' }, data: { kind: 'daily', challengeId: 'daily1', answer: 'B', dateKey: '2099-01-01' } };
    assert.equal((await submit(request)).passed, false);
    request.data.answer = 'D';
    const results = await Promise.all([submit(request), submit(request)]);
    assert.equal(results.reduce((sum, result) => sum + result.xpReward, 0), 10);
    const student = (await db.doc('users/alice').get()).data();
    assert.equal(student.xp, 100);
    assert.equal(student.learningStreak, 1);
    assert.equal(student.lastStreakDate, '2026-10-19');
});

test('matching and trading are graded using stored answers; Manila date crosses at UTC 16:00', () => {
    const questions = [
        { id: 'match', gameType: 'matching', matchingPairs: [{ left: 'A', right: 'B' }] },
        { id: 'trade', gameType: 'tradeSimulation', startingQuantity: 10, requiredQuantity: 3 }
    ];
    assert.equal(grade(questions, { match: { gameType: 'matching', matches: { A: 'B' } }, trade: { gameType: 'tradeSimulation', quantity: 3 } }).score, 100);
    assert.equal(grade(questions, { match: { gameType: 'matching', matches: { A: 'wrong' } }, trade: { gameType: 'tradeSimulation', quantity: 2 } }).score, 0);
    assert.equal(manilaDate(new Date('2026-10-18T16:00:00Z')), '2026-10-19');
});
