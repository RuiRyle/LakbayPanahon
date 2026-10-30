const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const plan = require('../data/chapter1-mission1-practice-polish-migration.json');
const {validatePlan, compareDocument, checkLocal} = require('../functions/apply-chapter1-mission1-practice-polish.cjs');

test('beginner publication retains difficulty, correct answers and review evidence and rejects other targets', () => {
    assert.doesNotThrow(() => validatePlan(plan));
    for (const mutate of [
        draft => { draft.projectId = 'another-project'; },
        draft => { draft.writes[0].path = 'practiceQuestions/practice2-1-adaptive'; },
        draft => { draft.writes[0].fields.reviewEvidencePolicy.minCleanSessions = 1; },
        draft => { draft.writes[0].fields.correctAnswer = 'B'; },
        draft => { draft.writes[0].fields.difficulty = 'hard'; },
        draft => { draft.writes[4].createIfMissing = true; },
        draft => { draft.writes[4].fields.optionA = 'Unreviewed option'; }
    ]) {
        const candidate = structuredClone(plan);
        mutate(candidate);
        assert.throws(() => validatePlan(candidate));
    }
});

test('missing drafts can be created and exact old drafts updated; missing established questions cannot', () => {
    for (const write of plan.writes) {
        if (write.createIfMissing) assert.equal(compareDocument(write, null), 'create');
        else assert.throws(() => compareDocument(write, null), /Missing existing practice/);
        assert.equal(compareDocument(write, structuredClone(write.expected)), 'update');
        assert.equal(compareDocument(write, {...write.expected, ...write.fields}), 'already-applied');
    }
});

test('collisions, newly authored hints, partial edits and changed answer keys stop publication', () => {
    const write = plan.writes[0];
    for (const current of [
        {...write.expected, missionId: 'mission-2'},
        {...write.expected, question: 'New teaching question'},
        {...write.expected, answerHints: {B: 'Another author hint'}},
        {...write.expected, hint: write.fields.hint},
        {...write.expected, ...write.fields, correctAnswer: 'B'}
    ]) assert.throws(() => compareDocument(write, current), /changed since review/);
});

test('all five topics have three distinct hints and a separate correct explanation and key idea', () => {
    const report = checkLocal();
    assert.equal(report.items.length, 5);
    assert.ok(report.items.every(item => item.lessonScenes.length));
    for (const write of plan.writes) {
        const question = {...write.expected, ...write.fields};
        const correctText = question['option' + question.correctAnswer].toLowerCase();
        assert.equal(new Set(Object.values(question.answerHints)).size, 3);
        for (const hint of Object.values(question.answerHints)) assert.ok(!hint.toLowerCase().includes(correctText));
        assert.notEqual(question.answerExplanations[question.correctAnswer], question.learningPoint);
    }
});

function feedbackContext() {
    const source = fs.readFileSync(require.resolve('../js/practice.js'), 'utf8');
    const correct = source.slice(source.indexOf('function renderCorrectPracticeFeedback('), source.indexOf('function handleIncorrectAnswer('));
    const incorrect = source.slice(source.indexOf('function handleIncorrectAnswer('), source.indexOf('function goToNextPracticeQuestion('));
    const classes = {add() {}, remove() {}};
    const options = 'ABCD'.split('').map(letter => ({dataset: {option: letter}, classList: classes, disabled: false}));
    const context = {
        practiceOptions: {querySelectorAll: () => options},
        practiceFeedback: {classList: classes},
        practiceFeedbackTitle: {focus() {}},
        practiceExplanation: {textContent: '', children: [], appendChild(item) { this.children.push(item); }},
        checkAnswerButton: {}, practicePolicy: {questionLimit: 5}, practiceQuestions: [1, 2, 3, 4, 5],
        currentPracticeIndex: 0, currentAttemptCount: 2, selectedAnswer: 'A', lastIncorrectAnswer: null,
        questionMastered: false, savePracticeDraft() {}, document: {createElement: () => ({textContent: ''})}
    };
    vm.runInNewContext(correct + '\n' + incorrect, context);
    return context;
}

test('real practice handlers show the selected-choice hint on mistakes and resume without adding attempts', () => {
    for (const write of plan.writes) {
        const question = {...write.expected, ...write.fields};
        for (const [choice, hint] of Object.entries(question.answerHints)) {
            const context = feedbackContext();
            context.handleIncorrectAnswer(question, choice);
            assert.equal(context.practiceExplanation.textContent, hint);
            assert.equal(context.checkAnswerButton.textContent, 'Choose Another Answer');
            assert.equal(context.currentAttemptCount, 2);
            context.handleIncorrectAnswer(question, choice);
            assert.equal(context.practiceExplanation.textContent, hint);
            assert.equal(context.currentAttemptCount, 2);
        }
    }
});

test('real correct-feedback handler shows the reason and a distinct key idea', () => {
    for (const write of plan.writes) {
        const question = {...write.expected, ...write.fields};
        const context = feedbackContext();
        context.renderCorrectPracticeFeedback(question, question.correctAnswer);
        assert.equal(context.practiceExplanation.textContent, question.answerExplanations[question.correctAnswer]);
        assert.equal(context.practiceExplanation.children[0].textContent, 'Key idea: ' + question.learningPoint);
    }
});
