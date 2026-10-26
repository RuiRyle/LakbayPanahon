// Exercise the actual practice page/module using mock Firestore data in Chrome.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-review-'));
const source = name => fs.readFileSync(path.join(root, 'js', name), 'utf8')
    .replace(/import[\s\S]*?from\s+"[^"]+";/g, '').replace(/export /g, '');
const styles = ['student.css', 'practice.css'].map(name => fs.readFileSync(path.join(root, 'css', name), 'utf8')).join('\n');
const page = fs.readFileSync(path.join(root, 'pages/practice.html'), 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '')
    .replace('</head>', `<style>${styles}</style></head>`);
const script = `
const db = {}, auth = { currentUser: { uid: 'test' } };
const aiAssistanceLocalOnly = false, requestAiAssistance = async () => '';
class LearningAccessError extends Error {}
const requireLearningAccess = async () => {};
const fixtureQuestions = [
    { id: 'q1', missionId: 'm1', status: 'active', topic: 'trade', topicLabel: 'Trading communities', difficulty: 'easy', order: 1, question: 'First trade question', optionA: 'Correct', optionB: 'Other', optionC: 'Other', optionD: 'Other', correctAnswer: 'A' },
    { id: 'q2', missionId: 'm1', status: 'active', topic: 'trade', topicLabel: 'Trading communities', difficulty: 'hard', order: 2, question: 'Second trade question', optionA: 'Correct', optionB: 'Other', optionC: 'Other', optionD: 'Other', correctAnswer: 'A' },
    { id: 'q3', missionId: 'm1', status: 'active', topic: 'community', topicLabel: 'Community life', difficulty: 'medium', order: 3, question: 'Another topic', correctAnswer: 'A' }
];
const fixtureSessions = [{ id: 'old', userId: 'test', missionId: 'm1', totalQuestions: 2, firstTryCorrectCount: 0,
    completedAt: { toMillis: () => 100 }, questionResults: [{ questionId: 'q1', topic: 'trade', firstTryCorrect: false }, { questionId: 'q3', topic: 'community', firstTryCorrect: false }] }];
let fixtureSaved = null, fixtureHistoryFailure = false;
const onAuthStateChanged = (_, next) => queueMicrotask(() => next(auth.currentUser));
const collection = (_, name) => ({ name });
const doc = (ref, name, id) => ref.name ? { name: ref.name, id: 'saved' } : { name, id };
const where = (field, _, value) => ({ field, value });
const query = (ref, ...conditions) => ({ ...ref, conditions });
const getDocs = async ref => {
    if (ref.name === 'studentPracticeProgress' && fixtureHistoryFailure) throw new Error('History unavailable');
    const records = ref.name === 'practiceQuestions' ? fixtureQuestions : fixtureSessions;
    const docs = records.filter(row => (ref.conditions || []).every(condition => row[condition.field] === condition.value))
        .map(row => ({ id: row.id, data: () => row }));
    return { docs, forEach: callback => docs.forEach(callback) };
};
const getDoc = async () => ({ exists: () => !!fixtureSaved, data: () => fixtureSaved });
const serverTimestamp = () => ({ toMillis: () => 200 });
const setDoc = async (_, values) => { fixtureSaved = values; fixtureSessions.push({ ...values, id: 'saved' }); };
${source('practice-review.js')}
${source('practice.js')}
const fixtureCheck = (condition, message) => { if (!condition) throw new Error(message); };
const fixtureTick = () => new Promise(resolve => setTimeout(resolve, 40));
(async () => {
    await fixtureTick();
    fixtureCheck(!document.getElementById('practiceContent').hidden, 'Practice did not load');
    fixtureCheck(document.getElementById('practiceProgress').textContent.includes('of 2'), 'Topic filter included other questions');
    fixtureCheck(document.getElementById('practiceReviewTopics').textContent.includes('Trading communities'), 'Saved weak topic missing');
    fixtureCheck(document.getElementById('practiceReviewMode').textContent.includes('Trading communities'), 'Database topic label missing');
    for (let count = 0; count < 2; count++) {
        document.querySelector('.practice-option[data-option="A"]').click();
        document.getElementById('checkAnswerButton').click();
        document.getElementById('checkAnswerButton').click();
        await fixtureTick();
    }
    fixtureCheck(!document.getElementById('practiceComplete').hidden, 'Practice did not finish');
    fixtureCheck(fixtureSaved?.totalQuestions === 2, 'Filtered session did not save');
    fixtureCheck(fixtureSaved.firstTryCorrectCount === 2, 'First-try accuracy incorrect');
    const reviewText = document.getElementById('practiceReviewTopics').textContent;
    fixtureCheck(!reviewText.includes('Trading communities'), 'Old mistake was not resolved');
    fixtureCheck(reviewText.includes('Community life'), 'Unpracticed topic was cleared');
    fixtureCheck(document.getElementById('practiceSaveStatus').textContent.includes('has been saved'), 'Save status missing');
    const link = document.querySelector('#practiceReviewTopics a');
    fixtureCheck(new URL(link.href).searchParams.get('topic') === 'community', 'Practice Again link targeted wrong topic');
    fixtureHistoryFailure = true;
    await refreshPracticeReview();
    fixtureCheck(document.getElementById('practiceReviewTopics').textContent.includes('temporarily unavailable'), 'History failure not explained');
    document.getElementById('result').textContent = 'PASS: targeted questions, database labels, saved history, resolved topics, practice links, history failure';
})().catch(error => { document.getElementById('result').textContent = 'FAIL: ' + error.message; });
`;
const html = page.replace('</body>', `<output id="result">RUNNING</output><script type="module">${script}</script></body>`);
const file = path.join(temp, 'practice.html');
fs.writeFileSync(file, html);
const result = spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=' + path.join(temp, 'browser'), '--dump-dom', '--virtual-time-budget=5000',
    'file:///' + file.replaceAll('\\', '/') + '?chapter=c1&mission=m1&topic=trade'
], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
if (result.error) throw result.error;
const match = result.stdout.match(/<output id="result">([^<]+)<\/output>/);
console.log(match?.[1] || 'FAIL: Browser did not return a result.');
process.exitCode = match?.[1].startsWith('PASS:') ? 0 : 1;
