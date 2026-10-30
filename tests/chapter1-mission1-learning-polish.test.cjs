const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validatePlan, compareDocument, checkLocal, encode, decode} = require('../functions/apply-chapter1-mission1-learning-polish.cjs');
const plan = require('../data/chapter1-mission1-learning-polish-migration.json');

test('publication accepts only the scoped scenes and questions, never grading or reward edits', () => {
    assert.doesNotThrow(() => validatePlan(plan));
    for (const mutate of [
        draft => { draft.projectId = 'another-project'; },
        draft => { draft.writes[0].path = 'users/student'; },
        draft => { draft.writes[0].create = true; },
        draft => { draft.writes[0].fields.xpReward = 900; },
        draft => { draft.writes.find(write => write.path.startsWith('questions/')).fields.correctAnswer = 'B'; },
        draft => { draft.writes[0].expected.content = undefined; delete draft.writes[0].expected.content; }
    ]) {
        const draft = structuredClone(plan);
        mutate(draft);
        assert.throws(() => validatePlan(draft));
    }
});

test('exact baseline and already-published content are recognized without mutating source data', () => {
    for (const write of plan.writes) {
        const original = structuredClone(write.expected);
        assert.equal(compareDocument(write, original), 'pending');
        assert.deepEqual(original, write.expected);
        assert.equal(compareDocument(write, {...original, ...structuredClone(write.fields)}), 'already-applied');
    }
});

test('stale guards, partial updates and missing documents stop publication', () => {
    const write = plan.writes[0];
    assert.throws(() => compareDocument(write, null), /Missing reviewed document/);
    assert.throws(() => compareDocument(write, {...write.expected, title: 'New author title'}), /changed since review/);
    assert.throws(() => compareDocument(write, {...write.expected, content: write.fields.content}), /changed since review/);
    assert.throws(() => compareDocument(write, {...write.expected, ...write.fields, missionId: 'another-mission'}), /changed since review/);
    const question = plan.writes.find(item => item.path === 'questions/quiz-1-question-1-retry');
    assert.throws(() => compareDocument(question, {...question.expected, ...question.fields, correctAnswer: 'B'}), /changed since review/);
});

test('Firestore encoding retains Unicode, nested feedback and the complete scoped patch', () => {
    for (const write of plan.writes) assert.deepEqual(decode(encode(write.fields)), write.fields);
    assert.deepEqual(decode(encode({note: 'Pamilya — pananagutan', values: [null, false, 2, 0.5]})),
        {note: 'Pamilya — pananagutan', values: [null, false, 2, 0.5]});
});

test('offline comparison retains coverage for every existing quiz topic', () => {
    const result = checkLocal();
    assert.equal(result.documents, 16);
    assert.equal(result.topics.length, 5);
    assert.ok(result.topics.every(topic => topic.scenes.length && topic.questionVariants === 2));
    assert.ok(result.scenes.every(scene => scene.afterWords < scene.beforeWords));
});
