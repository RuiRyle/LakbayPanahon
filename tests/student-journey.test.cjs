const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');
const snapshot = rows => ({ docs: rows.map(row => ({ id: row.id, data: () => row })) });

function accessFixture(overrides = {}) {
    const data = {
        users: [{ id: 'student', role: 'student', status: 'active' }],
        chapters: [
            { id: 'c1', eraId: 'e1', status: 'active', order: 1 },
            { id: 'c2', eraId: 'e1', status: 'active', order: 2 },
            { id: 'other-era', eraId: 'e2', status: 'active', order: 1 }
        ],
        missions: [
            { id: 'm1', chapterId: 'c1', status: 'active', order: 1 },
            { id: 'm2', chapterId: 'c1', status: 'active', order: 2 }
        ],
        studentProgress: [], studentChapterProgress: [], ...overrides
    };
    const context = vm.createContext({
        auth: { currentUser: { uid: 'student' } }, db: {},
        collection: (_, name) => ({ name }),
        doc: (_, name, id) => ({ name, id }),
        where: (field, _, value) => ({ field, value }),
        query: (ref, condition) => ({ ...ref, condition }),
        getDoc: async ref => {
            const row = data[ref.name].find(item => item.id === ref.id);
            return { exists: () => !!row, data: () => row };
        },
        getDocs: async ref => snapshot(data[ref.name].filter(row =>
            !ref.condition || row[ref.condition.field] === ref.condition.value))
    });
    const source = read('learning-access.js').replace(/import[\s\S]*?from\s+"[^"]+";/g, '')
        .replace(/export /g, '');
    vm.runInContext(source + '\nglobalThis.check = requireLearningAccess;', context);
    return context;
}

test('first mission and first chapter in another era need no classroom', async () => {
    const context = accessFixture();
    assert.equal((await context.check('c1', 'm1')).id, 'm1');
    assert.equal((await context.check('other-era')).id, 'other-era');
});

test('direct links cannot skip mission or chapter prerequisites', async () => {
    const context = accessFixture();
    await assert.rejects(context.check('c1', 'm2'), /previous missions/);
    await assert.rejects(context.check('c2'), /previous chapters/);
    await assert.rejects(context.check('c2', 'm1'), /previous chapters/);
});

test('saved completion unlocks the next activity after a new page load', async () => {
    const context = accessFixture({
        studentProgress: [{ id: 'p1', userId: 'student', missionId: 'm1', completed: true }],
        studentChapterProgress: [{ id: 'p2', userId: 'student', chapterId: 'c1', completed: true }]
    });
    assert.equal((await context.check('c1', 'm2')).id, 'm2');
    assert.equal((await context.check('c2')).id, 'c2');
    await assert.rejects(context.check('c2', 'm1'), /not available in this chapter/);
});

test('another student completion does not unlock an activity', async () => {
    const context = accessFixture({ studentProgress: [
        { id: 'p1', userId: 'someone-else', missionId: 'm1', completed: true }
    ] });
    await assert.rejects(context.check('c1', 'm2'), /previous missions/);
});

test('unpublished chapters and inactive accounts cannot load activities', async () => {
    const context = accessFixture({ chapters: [{ id: 'c1', status: 'active', contentReady: false }] });
    await assert.rejects(context.check('c1'), /not available/);
    const inactive = accessFixture({ users: [{ id: 'student', role: 'student', status: 'disabled' }] });
    await assert.rejects(inactive.check('c1'), /active student/);
    inactive.auth.currentUser = null;
    await assert.rejects(inactive.check('c1'), /sign in/);
});

test('mission quiz delegates reward handling to the shared activity service', async () => {
    let submitted;
    const context = vm.createContext({
        chapterId: 'c1', missionId: 'm1', currentQuiz: { id: 'q1' },
        studentAnswers: { question1: 'A' }, lastArtifactResult: null,
        submitStudentActivity: async data => {
            submitted = data;
            return { passed: true, xpReward: 25, artifactResult: { newlyEarned: true } };
        }
    });
    const source = read('quiz.js');
    const start = source.indexOf('async function completeMission(');
    const end = source.indexOf('async function awardMissionArtifact(', start);
    vm.runInContext(source.slice(start, end) + '\nglobalThis.complete = completeMission;', context);
    assert.equal((await context.complete()).xpReward, 25);
    assert.equal(submitted.kind, 'mission');
    assert.equal(submitted.answers.question1, 'A');
    assert.equal(context.lastArtifactResult.newlyEarned, true);
    context.submitStudentActivity = async () => ({ passed: false });
    await assert.rejects(context.complete(), /could not be confirmed/);
});
test('practice save failure is visible and retry reuses an acknowledged record', async () => {
    let stored = null;
    let writes = 0;
    const context = vm.createContext({
        currentUser: { uid: 'student' }, chapterId: 'c1', missionId: 'm1',
        practiceResults: [{ questionId: 'q1', topic: 'trade', firstTryCorrect: false, attempts: 2 }],
        practiceSessionReference: { id: 'stable-session' },
        practiceSaveStatus: { textContent: '' },
        refreshPracticeReview: async () => {},
        retryPracticeSaveButton: { hidden: true, disabled: false },
        retryMissionQuizButton: { disabled: false },
        serverTimestamp: () => 'timestamp',
        getDoc: async () => ({ exists: () => !!stored, data: () => stored }),
        setDoc: async (_, data) => {
            writes++;
            if (writes === 1) throw new Error('Offline');
            stored = data;
            // Simulate a response lost after the server accepted the write.
            throw new Error('Connection lost');
        },
        console: { log() {}, warn() {}, error() {} }
    });
    const source = read('practice.js');
    const save = source.slice(source.indexOf('async function savePracticeSession()'),
        source.indexOf('async function finishPractice()'));
    const persist = source.slice(source.indexOf('async function persistPracticeSession()'),
        source.indexOf('retryPracticeSaveButton.addEventListener'));
    vm.runInContext(save + persist + '\nglobalThis.persist = persistPracticeSession;', context);
    await context.persist();
    assert.match(context.practiceSaveStatus.textContent, /not saved/);
    assert.equal(context.retryPracticeSaveButton.hidden, false);
    assert.equal(context.retryMissionQuizButton.disabled, false);
    await context.persist();
    assert.match(context.practiceSaveStatus.textContent, /has been saved/);
    assert.equal(context.retryPracticeSaveButton.hidden, true);
    assert.equal(writes, 2);
    assert.equal(stored.topicsForReview[0], 'trade');
});
