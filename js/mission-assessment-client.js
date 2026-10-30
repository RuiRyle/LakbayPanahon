import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { requireLearningAccess } from "./learning-access.js";
import { selectMissionQuestions, validateAdaptiveQuestionSet } from "./mission-assessment.js";
import { missionTopicStates } from "./mission-review.js";
const rows = snapshot => snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
export async function startMissionQuiz({chapterId, missionId, quizId, attemptId}) {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in to start the mission quiz.');
    await requireLearningAccess(chapterId, missionId);
    const [quizzes, bank, history, adaptiveBank, practiceHistory, reviewHistory] = await Promise.all([
        getDocs(query(collection(db, 'quizzes'), where('missionId', '==', missionId))),
        getDocs(query(collection(db, 'questions'), where('quizId', '==', quizId))),
        getDocs(query(collection(db, 'studentQuizAttempts'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'practiceQuestions'), where('missionId', '==', missionId))),
        getDocs(query(collection(db, 'studentPracticeProgress'), where('userId', '==', user.uid))).catch(() => null),
        getDocs(query(collection(db, 'studentReviewEvents'), where('userId', '==', user.uid))).catch(() => null)
    ]);
    if(auth.currentUser?.uid!==user.uid) throw new Error('Your session changed. Sign in again to start the quiz.');
    const quiz = rows(quizzes).find(q => q.id === quizId && q.status === 'active');
    if (!quiz) throw new Error('This quiz is unavailable.');
    const attempts = rows(history).filter(item => item.userId === user.uid && item.quizId === quizId)
        .sort((a,b) => (b.completedAt?.toMillis?.() || 0) - (a.completedAt?.toMillis?.() || 0) || b.id.localeCompare(a.id));
    const missionAttempts = rows(history).filter(item => item.userId === user.uid && item.missionId === missionId);
    const questionBank = rows(bank).filter(item => item.status === 'active')
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const adaptiveQuestions = rows(adaptiveBank).filter(item => item.missionId === missionId && item.status === 'active')
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const practiceSessions = practiceHistory ? rows(practiceHistory).filter(item => item.userId === user.uid && item.missionId === missionId) : [];
    const reviewEvents = reviewHistory ? rows(reviewHistory).filter(item => item.userId === user.uid && item.missionId === missionId) : [];
    const topicMastery = Object.fromEntries(missionTopicStates(missionAttempts, practiceSessions, adaptiveQuestions, reviewEvents)
        .filter(item => item.missionId === missionId)
        .map(item => [item.topic, {attempted:item.attempted, correct:item.correct, missed:item.missed, state:item.state}]));
    const seenAdaptiveIds = [...new Set(attempts.flatMap(item =>
        Array.isArray(item.response?.adaptiveFollowup?.questionIds) ? item.response.adaptiveFollowup.questionIds :
        Array.isArray(item.adaptiveFollowup?.questionIds) ? item.adaptiveFollowup.questionIds : []
    ))];
    if (attempts.some(item => item.attemptId === attemptId)) {
        sessionStorage.removeItem('missionQuizSet:' + user.uid + ':' + attemptId);
        attemptId = crypto.randomUUID();
        sessionStorage.setItem('missionQuiz:' + user.uid + ':' + quizId, attemptId);
    }
    const key = 'missionQuizSet:' + user.uid + ':' + attemptId;
    const previousIds = attempts[0]?.questionIds || [];
    const seenIds = [...new Set(attempts.flatMap(item => item.questionIds || []))];
    const saved = sessionStorage.getItem(key);
    let result;
    if (saved) {
        try {
            result = {questions: validateAdaptiveQuestionSet(questionBank, quiz, JSON.parse(saved))};
            result.repeatedQuestions = result.questions.filter(q => seenIds.includes(q.id)).length;
        } catch {
            sessionStorage.removeItem(key);
        }
    }
    if (!result) {
        result = selectMissionQuestions(questionBank, quiz, previousIds, Math.random, seenIds, topicMastery);
        sessionStorage.setItem(key, JSON.stringify(result.questions.map(q => q.id)));
    }
    return {...result, questionBank, seenQuestionIds: seenIds, adaptiveQuestions, seenAdaptiveIds, topicMastery, practicePolicy: quiz.practicePolicy || null,
        attemptId, attemptNumber: attempts.length + 1, passingScore: quiz.passingScore};
}
