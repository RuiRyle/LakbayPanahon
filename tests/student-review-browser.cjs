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
function mountLearningNavigation(container, activity, search = window.location.search) {
    if (!container) return;
    const chapter = new URLSearchParams(search).get("chapter");
    const nav = document.createElement("nav");
    nav.className = "learning-navigation";
    nav.setAttribute("aria-label", "Learning path");
    const list = document.createElement("ol");
    const add = (label, href) => {
        const item = document.createElement("li");
        const element = document.createElement(href ? "a" : "span");
        element.textContent = label;
        if (href) element.href = href;
        else element.setAttribute("aria-current", "page");
        item.append(element);list.append(item);
    };
    add("Chapters", "chapters.html");
    if (chapter) add("Mission Journey", "mission.html?" + new URLSearchParams({chapter}));
    add(activity);
    nav.append(list);
    container.prepend(nav);
}


const db = {}, auth = { currentUser: { uid: 'test' } };
const aiAssistanceAvailable = false, requestAiAssistance = async () => '';
class LearningAccessError extends Error {}
const requireLearningAccess = async () => {};
const fixtureQuestions = [
    { id: 'q1', missionId: 'm1', status: 'active', topic: 'trade', topicLabel: 'Trading communities', difficulty: 'easy', order: 1, question: 'First trade question', optionA: 'Correct', optionB: 'Other', optionC: 'Other', optionD: 'Other', correctAnswer: 'A' },
    { id: 'q2', missionId: 'm1', status: 'active', topic: 'trade', topicLabel: 'Trading communities', difficulty: 'hard', order: 2, question: 'Second trade question', optionA: 'Correct', optionB: 'Other', optionC: 'Other', optionD: 'Other', correctAnswer: 'A' },
    { id: 'q3', missionId: 'm1', status: 'active', topic: 'community', topicLabel: 'Community life', difficulty: 'medium', order: 3, question: 'Another topic', correctAnswer: 'A' }
];
const fixtureQuizAttempts = [];
const fixtureSessions = [{ id: 'old', userId: 'test', missionId: 'm1', totalQuestions: 2, firstTryCorrectCount: 0,
    completedAt: { toMillis: () => 100 }, questionResults: [{ questionId: 'q1', topic: 'trade', firstTryCorrect: false }, { questionId: 'q3', topic: 'community', firstTryCorrect: false }] }];
for (const question of fixtureQuestions) {
    question.reviewEvidencePolicy={version:1,minDistinctQuestions:2,minCleanSessions:2,requiredDifficulty:'hard'};
    question.answerHints = {B: 'Compare the community needs <img src=x>'};
    question.answerExplanations = {A: 'Correct-choice explanation from Firestore'};
    question.learningPoint = 'Exchange helps meet different needs';
}
let fixtureSaved = null, fixtureHistoryFailure = false;
let fixtureAuthListener, fixtureLoadGate = null, fixtureContentFailure = false, fixtureEmptyBank = false;
const onAuthStateChanged = (_, next) => { fixtureAuthListener = next; queueMicrotask(() => next(auth.currentUser)); };
const collection = (_, name) => ({ name });
let fixtureDocCounter=0;
const doc = (ref, name, id) => ref.name ? { name: ref.name, id: 'session-'+(++fixtureDocCounter) } : { name, id };
const where = (field, _, value) => ({ field, value });
const query = (ref, ...conditions) => ({ ...ref, conditions });
const getDocs = async ref => {
    if (ref.name === "quizzes" && fixtureContentFailure) throw Error("Content unavailable");
    if (ref.name === "practiceQuestions" && fixtureLoadGate) await fixtureLoadGate;
    if (ref.name === 'studentPracticeProgress' && fixtureHistoryFailure) throw new Error('History unavailable');
    const records = ref.name === 'practiceQuestions' ? (fixtureEmptyBank ? [] : fixtureQuestions)
        : ref.name === 'quizzes' ? [{id:'quiz',missionId:'m1',status:'active',practicePolicy:{difficultyLevels:['easy','medium','hard'],startDifficulty:'medium',reviewDifficulty:'easy',questionLimit:5,promoteAccuracy:0.8,demoteAccuracy:0.4}}]
        : ref.name === 'studentQuizAttempts' ? fixtureQuizAttempts : fixtureSessions;
    const docs = records.filter(row => (ref.conditions || []).every(condition => row[condition.field] === condition.value))
        .map(row => ({ id: row.id, data: () => row }));
    return { docs, forEach: callback => docs.forEach(callback) };
};
const getDoc = async () => ({ exists: () => !!fixtureSaved, data: () => fixtureSaved });
const serverTimestamp = () => ({ toMillis: () => 200 });
const setDoc = async (ref, values) => { fixtureSaved = values; fixtureSessions.push({ ...values, id: ref.id }); };
${source('quiz-draft-policy.js')}
${source('practice-review.js')}
${source('mission-review.js')}

const restartControl=(()=>{${source('learning-draft.js')};return restartControl;})();
window.confirm=()=>true;
const fixtureDrafts=new Map();
const draftStatus=container=>{const p=document.createElement('p');container.prepend(p);return p;};
const learningDraft=(kind,chapter,mission)=>{const key=kind+mission;let closed=false;return{read:async()=>fixtureDrafts.get(key)||null,save:state=>{if(!closed)fixtureDrafts.set(key,JSON.parse(JSON.stringify(state)));},clear:async()=>{closed=true;fixtureDrafts.delete(key);},close:()=>{closed=true;}};};
${source('practice.js').replace('const requestedTopic =', 'let requestedTopic =')}
const fixtureCheck = (condition, message) => { if (!condition) throw new Error(message); };
const fixtureTick = () => new Promise(resolve => setTimeout(resolve, 40));
(async () => {
    document.body.classList.add("authenticated");
    await fixtureTick();
    document.querySelector('.practice-option[data-option="B"]').click();checkAnswerButton.click();
    const oldSession=practiceSessionReference.id;
    await loadPractice();
    fixtureCheck(currentAttemptCount===1&&practiceSessionReference.id===oldSession&&!questionMastered,'Practice draft did not restore attempt count/session');
    fixtureCheck(practiceExplanation.textContent.includes('Compare the community needs <img src=x>')&&!practiceFeedback.hidden,'Practice resume lost authored wrong-answer hint');
    fixtureCheck(practiceResults.length===0&&currentAttemptCount===1, 'Restored hint changed evidence');
    restartPracticeButton.click();await fixtureTick();
    fixtureCheck(currentAttemptCount===0&&practiceResults.length===0,'Practice restart retained answers');
    const diagnosisCard=document.createElement('div');
    renderReviewTopics(diagnosisCard,[{missionId:'m1',topic:'trade',label:'Trading communities',source:'quiz',attempted:0,correct:0,missed:1}],new Map([['m1','c1']]),'');
    fixtureCheck(diagnosisCard.textContent.includes('latest mission quiz') && !diagnosisCard.textContent.includes('0 of'), 'Quiz diagnosis shown as invented practice accuracy');
    fixtureCheck(diagnosisCard.querySelector('a').href.includes('reviewTopic=trade'), 'Quiz diagnosis lost practice link');
    fixtureCheck([...diagnosisCard.querySelectorAll('a')].some(a=>a.textContent==='Try Targeted Practice'&&new URL(a.href).searchParams.get('topic')==='trade'),'Review card lacks targeted practice choice');
    fixtureCheck([...diagnosisCard.querySelectorAll('a')].some(a=>a.textContent==='Retry Mission Quiz'&&new URL(a.href).searchParams.get('mission')==='m1'),'Review card lacks quiz retry');
    fixtureCheck(!document.getElementById('practiceContent').hidden, 'Practice did not load');
    fixtureCheck(getComputedStyle(practiceComplete).display==='none'&&getComputedStyle(retryPracticeSaveButton).display==='none','Practice hidden states overridden by CSS');
    fixtureCheck(document.getElementById('practiceProgress').textContent.includes('of 2'), 'Topic filter included other questions');
    fixtureCheck(document.getElementById('practiceReviewTopics').textContent.includes('Trading communities'), 'Saved weak topic missing');
    params.set('review','1');
    renderGuidedPracticeIntro({lessonRecap:'A recap from Firestore <img src=x>'},false);
    fixtureCheck(practiceQuestionCard.hidden&&document.getElementById('guidedPracticeIntro'),'Review bypassed introduction');
    fixtureCheck(document.getElementById('guidedPracticeIntro').textContent.includes('A recap from Firestore')&&!document.getElementById('guidedPracticeIntro').querySelector('img'),'Refresher missing or unsafe');
    fixtureCheck(diagnosisCard.querySelector('a').href.includes('reviewTopic=trade'),'Review link skips guided flow');
    renderReviewTopics(diagnosisCard,[{missionId:'m1',topic:'trade',label:'Trading communities',source:'quiz',missed:1,state:'lesson-revisited',lessonRevisited:true}],new Map([['m1','c1']]),'');
    fixtureCheck(diagnosisCard.querySelector('a').textContent==='Start Targeted Practice'&&new URL(diagnosisCard.querySelector('a').href).searchParams.get('review')==='1','Revisited lesson did not promote practice as next action');
    fixtureCheck([...diagnosisCard.querySelectorAll('a')].some(a=>a.textContent==='Revisit Lesson'&&new URL(a.href).searchParams.get('reviewTopic')==='trade'),'Revisited lesson route disappeared');
    renderReviewTopics(diagnosisCard,[{missionId:'m1',topic:'trade',label:'Trading communities',source:'quiz',attempted:0,correct:0,missed:1}],new Map([['m1','c1']]),'');
    document.querySelector('#guidedPracticeIntro button').click();
    fixtureCheck(!practiceQuestionCard.hidden&&!document.getElementById('guidedPracticeIntro'),'Start targeted practice failed');
    renderGuidedPracticeIntro({},true);
    fixtureCheck(!document.getElementById('guidedPracticeIntro'),'Resume blocked by introduction');
    params.delete('review');

    fixtureCheck(document.getElementById('practiceReviewMode').textContent.includes('Trading communities'), 'Database topic label missing');
    for (let count = 0; count < 2; count++) {
        document.querySelector('.practice-option[data-option="A"]').click();
        document.getElementById('checkAnswerButton').click();
        document.getElementById('checkAnswerButton').click();
        await fixtureTick();
    }
    fixtureCheck(!document.getElementById('practiceComplete').hidden, 'Practice did not finish');
    fixtureCheck(document.activeElement===document.getElementById('practiceCompleteTitle'), 'Completion heading did not receive focus');
    fixtureCheck(fixtureSaved?.totalQuestions === 2, 'Filtered session did not save');
    fixtureCheck(document.getElementById('practiceSessionSummary').textContent.includes('2 of 2') && document.getElementById('practiceSessionSummary').textContent.includes('does not complete the mission'), 'Practice summary missing or claims completion');
    fixtureCheck(fixtureSaved.firstTryCorrectCount === 2, 'First-try accuracy incorrect');
    fixtureCheck(!fixtureDrafts.has('practicem1'),'Completed practice draft not cleared');
    const reviewText = document.getElementById('practiceReviewTopics').textContent;
    fixtureCheck(reviewText.includes('Trading communities'), 'One session incorrectly cleared the topic');
    fixtureCheck(reviewText.includes('Community life'), 'Unpracticed topic was cleared');
    fixtureCheck(document.getElementById('practiceNextSteps').textContent.includes('Community life') && document.getElementById('practiceNextSteps').textContent.includes('Trading communities'), 'Completion guidance omitted remaining topic or retained resolved topic');
    fixtureCheck(document.getElementById('practiceSaveStatus').textContent.includes('has been saved'), 'Save status missing');
    fixtureSessions.push({id:'trade-followup',userId:'test',missionId:'m1',totalQuestions:1,firstTryCorrectCount:1,completedAt:{toMillis:()=>250},questionResults:[{questionId:'q2',firstTryCorrect:true}]});
    await refreshPracticeReview();
    fixtureCheck(!document.getElementById('practiceReviewTopics').textContent.includes('Trading communities')&&document.getElementById('practiceNextSteps').textContent.includes('practice goal reached'),'Varied evidence across sessions did not reach practice goal');
    const link = [...document.querySelectorAll('#practiceReviewTopics a')].find(a=>a.textContent==='Review Lesson Scenes'||a.textContent==='Revisit Lesson');
    fixtureCheck(new URL(link.href).searchParams.get('reviewTopic') === 'community', 'Practice Again link targeted wrong topic');
    fixtureHistoryFailure = true;
    await refreshPracticeReview();
    fixtureCheck(document.getElementById('practiceReviewTopics').textContent.includes('temporarily unavailable'), 'History failure not explained');
    fixtureCheck(document.getElementById('practiceNextSteps').textContent.includes('could not be confirmed'), 'Unavailable history claimed readiness');
    fixtureHistoryFailure = false;
    const retryUrl=new URL(document.getElementById('practiceRetryLink').href);
    fixtureCheck(retryUrl.pathname.endsWith('/quiz.html')&&retryUrl.searchParams.get('chapter')==='c1'&&retryUrl.searchParams.get('mission')==='m1','Practice retry lost original quiz scope');
    fixtureHistoryFailure=true;fixtureDrafts.clear();requestedTopic='trade';params.set('review','1');
    await loadPractice();
    fixtureCheck(targetDifficulty===practicePolicy.reviewDifficulty,'Explicit lesson review ignored review difficulty when history was unavailable');
    fixtureCheck(practiceQuestions.every(q=>q.topic==='trade'),'Targeted handoff included another topic');
    params.delete('review');fixtureHistoryFailure=false;
    auth.currentUser = null; fixtureAuthListener(null);
    fixtureCheck(practiceContent.hidden && currentQuestion === null && !practiceResults.length, 'Sign-out retained practice');
    let releaseLoad;
    fixtureLoadGate = new Promise(resolve => { releaseLoad = resolve; });
    auth.currentUser = { uid: 'test' }; fixtureAuthListener(auth.currentUser); await fixtureTick();
    auth.currentUser = null; fixtureAuthListener(null);
    releaseLoad(); await fixtureTick(); fixtureLoadGate = null;
    fixtureCheck(practiceContent.hidden && practiceError.textContent.includes('sign in'), 'Late response revealed signed-out practice');
    auth.currentUser = { uid: 'test' }; fixtureAuthListener(auth.currentUser); await fixtureTick();
    fixtureCheck(!practiceContent.hidden && !practiceFinished && !practiceResults.length, 'Fresh sign-in did not restart practice');
    fixtureContentFailure = true; await loadPractice();
    fixtureCheck(!practiceError.hidden && !retryPracticeLoadButton.hidden && !practiceChoices.hidden, 'Content failure hid recovery choices');
    fixtureCheck(new URL(document.getElementById('practiceLessonLink').href).searchParams.get('mission') === 'm1', 'Lesson recovery route lost mission');
    fixtureCheck(new URL(document.getElementById('practiceRetryLink').href).searchParams.get('chapter') === 'c1', 'Quiz recovery route lost chapter');
    fixtureContentFailure = false; retryPracticeLoadButton.click(); await fixtureTick();
    fixtureCheck(!practiceContent.hidden && retryPracticeLoadButton.hidden, 'Content retry failed');
    fixtureEmptyBank = true; await loadPractice();
    fixtureCheck(!practiceError.hidden && !practiceChoices.hidden && !practiceLoadPending, 'Empty bank blocked recovery');
    fixtureEmptyBank = false; retryPracticeLoadButton.click(); await fixtureTick();
    fixtureCheck(!practiceContent.hidden, 'Empty bank retry did not recover');
    document.querySelector('.practice-option[data-option="B"]').click();checkAnswerButton.click();
    fixtureCheck(practiceExplanation.textContent.includes('Compare the community needs <img src=x>'), 'Wrong choice hint missing');
    fixtureCheck(document.activeElement===practiceFeedbackTitle,'Wrong-answer feedback did not receive focus');
    checkAnswerButton.click();fixtureCheck(document.activeElement.classList.contains('practice-option'),'Retry did not return focus to choices');
    fixtureCheck(!practiceExplanation.querySelector('img') && !questionMastered, 'Hint interpreted HTML or mastered wrong answer');
    fixtureCheck(!practiceExplanation.textContent.includes('Correct-choice explanation'), 'Full solution shown instead of authored hint');
    document.querySelector('.practice-option[data-option="A"]').click();checkAnswerButton.click();
    fixtureCheck(practiceExplanation.textContent.includes('Correct-choice explanation from Firestore') && practiceExplanation.textContent.includes('Exchange helps meet different needs'), 'Success explanation or key point missing');
    const resultsBeforeRefresh=practiceResults.length;await loadPractice();
    fixtureCheck(questionMastered&&practiceResults.length===resultsBeforeRefresh&&currentAttemptCount===2,'Mastered question duplicated results or lost retry evidence on resume');
    fixtureCheck(practiceResults.at(-1).firstTryCorrect === false, 'Retry incorrectly counted as first-try mastery');
    requestedTopic = '';
    fixtureQuizAttempts.push({id:'failed-quiz',userId:'test',missionId:'m1',completedAt:{toMillis:()=>50},topicsForReview:['trade']});
    await loadPractice();
    fixtureCheck(practiceQuestions.length===1&&practiceQuestions[0].topic==='community','Resolved quiz topic displaced outstanding practice evidence');
    fixtureDrafts.delete('practicem1');
    fixtureSessions.push({id:'community-success',userId:'test',missionId:'m1',completedAt:{toMillis:()=>300},totalQuestions:1,firstTryCorrectCount:1,questionResults:[{questionId:'q3',firstTryCorrect:true}]});
    await loadPractice();
    fixtureCheck(practiceQuestions.length===1&&practiceQuestions[0].topic==='community','One answer incorrectly cleared the community topic');
    fixtureQuizAttempts.push({id:'new-quiz',userId:'test',missionId:'m1',completedAt:{toMillis:()=>400},topicsForReview:[]});
    fixtureDrafts.delete('practicem1');await loadPractice();fixtureCheck(practiceQuestions.length===3,'New quiz evidence blocked optional general practice');
    auth.currentUser = null; fixtureAuthListener(null);
    fixtureCheck(practiceChoices.hidden && retryPracticeLoadButton.hidden, 'Sign-out retained recovery actions');
 const navigation=document.querySelector('nav[aria-label="Learning path"]');
 fixtureCheck(navigation&&navigation.querySelector('[aria-current="page"]'),'Current learning activity not labeled');
 fixtureCheck(new URL(navigation.querySelectorAll('a')[1].href).searchParams.get('chapter')==='c1','Learning navigation lost chapter context');
    document.getElementById('result').textContent = 'PASS: adaptive practice, history, session recovery, content failure/empty bank retry and lesson/quiz escape routes';
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

