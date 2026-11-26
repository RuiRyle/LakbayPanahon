import {appConfirm,appAlert} from './app-dialog.js';
import { navigatePage } from "./route-navigation.js";
import { animateAssessmentArrival } from './assessment-motion.js';
import { artifactDisplayName, artifactExhibitHref, createArtifactArtwork } from './museum-exhibits.js';
import { assessmentAction, assessmentState, checkAssessmentResult, forgetAssessment } from './student-assessment-client.js';
let securedQuiz = false,
  assessmentBusy = false;
let quizExpedition = null;
const expeditionPanel = document.getElementById('quizExpedition');
const lifelineButton = document.getElementById('quizLifeline');
const quizHeartLossNotice = document.getElementById('quizHeartLossNotice');

function clearQuizHeartLoss() {
    quizHeartLossNotice.replaceChildren();
    expeditionPanel.querySelectorAll('.heart-lost').forEach(token => token.classList.remove('heart-lost'));
}

function showQuizHeartLoss() {
    const title = document.createElement('strong');
    title.textContent = 'Incorrect · −1 heart';
    const remaining = document.createElement('span');
    remaining.textContent = quizExpedition.hearts === 1
        ? '1 heart left'
        : quizExpedition.hearts + ' hearts left';
    quizHeartLossNotice.replaceChildren(title, remaining);
}

lifelineButton?.addEventListener('click', async () => {
    if (!quizExpedition || assessmentBusy || quizRecoveryCode || lifelineButton.disabled) return;
    const question = questions[currentQuestionIndex];
    const generation = quizSessionGeneration;
    assessmentBusy = true;
    lifelineButton.disabled = true;
    nextQuestionButton.disabled = true;
    let applied = false;
    try {
        const state = await assessmentAction(securedIdentity(), {action:'lifeline', questionId:question.id});
        if (generation !== quizSessionGeneration) return;
        quizExpedition = state.expedition;
        studentAnswers = {...state.answers};
        applied = true;
        const feedback = document.getElementById('quizExpeditionFeedback');
        delete feedback.dataset.outcome;
        feedback.textContent = 'Bayani crossed out one wrong choice.';
        animateAssessmentArrival(feedback);
    } catch (error) {
        if (generation === quizSessionGeneration && !requireQuizRecovery(error)) await appAlert('Bayani’s hint could not load. Try again when connected.');
    } finally {
        if (generation === quizSessionGeneration) {
            assessmentBusy = false;
            if (!quizRecoveryCode) displayQuestion();
            if (applied && questions[currentQuestionIndex]?.id === question.id) {
                quizOptions.classList.add('bayani-lifeline-reveal');
                questionText.focus();
            }
        }
    }
});
const securedIdentity = () => ({
  kind: 'mission',
  chapterId,
  missionId,
  quizId: currentQuiz.id
});
async function syncSecuredAnswer(question, answer) {
  const generation = quizSessionGeneration;
  const state = await assessmentAction(securedIdentity(), {
    action: quizExpedition ? 'lockAnswer' : 'answer',
    questionId: question.id,
    answer
  });
  if (generation !== quizSessionGeneration) throw new Error('The quiz session changed.');
  questions = state.questions;
  missionQuestionBank = state.questions;
  studentAnswers = {
    ...state.answers
  };
  if (quizExpedition) quizExpedition = state.expedition;
  return state;
}
async function startSecuredFollowup() {
  const identity = securedIdentity();
  let state = assessmentState(identity);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i],
      answer = studentAnswers[q.id];
    if (!answer) throw Error('Answer every question before continuing.');
    if (state.answers[q.id] !== answer) state = await syncSecuredAnswer(q, answer);
  }
  state = await assessmentAction(identity, {
    action: 'followupStart'
  });
  adaptiveQuestionLimit = state.followupLimit;
  if (!state.followupQuestions.length) return false;
  adaptiveFollowupStarted = true;
  adaptiveFollowupComplete = false;
  adaptiveQuestionIds = state.followupQuestions.map(q => q.id);
  adaptiveAnswers = {
    ...state.followupAnswers
  };
  adaptiveQuestionIndex = state.followupQuestions.length - 1;
  adaptiveCurrentQuestion = state.followupQuestions.at(-1);
  adaptiveSelectedAnswer = null;
  adaptiveFeedbackVisible = !!adaptiveAnswers[adaptiveCurrentQuestion.id];
  adaptiveQuestionPool = state.followupQuestions;
  displayAdaptiveQuestion();
  return true;
}
async function securedFollowupAction() {
  if (assessmentBusy || quizRecoveryCode) return;
  const generation = quizSessionGeneration;
  const current = () => generation === quizSessionGeneration;
  assessmentBusy = true;
  nextQuestionButton.disabled = true;
  try {
    let state;
    if (!adaptiveFeedbackVisible) {
      if (!adaptiveSelectedAnswer) return;
      state = await assessmentAction(securedIdentity(), {
        action: 'followupAnswer',
        questionId: adaptiveCurrentQuestion.id,
        answer: adaptiveSelectedAnswer
      });
      if (!current()) return;
      adaptiveAnswers = {
        ...state.followupAnswers
      };
      adaptiveCurrentQuestion = state.followupQuestions.at(-1);
      adaptiveFeedbackVisible = true;
      displayAdaptiveQuestion();
    } else if (adaptiveQuestionIds.length < adaptiveQuestionLimit) {
      state = await assessmentAction(securedIdentity(), {
        action: 'followupNext'
      });
      if (!current()) return;
      adaptiveQuestionIds = state.followupQuestions.map(q => q.id);
      adaptiveQuestionIndex = adaptiveQuestionIds.length - 1;
      adaptiveCurrentQuestion = state.followupQuestions.at(-1);
      adaptiveSelectedAnswer = null;
      adaptiveFeedbackVisible = false;
      adaptiveQuestionPool = state.followupQuestions;
      displayAdaptiveQuestion();
    } else {
      adaptiveFollowupComplete = true;
      await submitQuiz(true);
    }
  } catch (error) {
    if (current() && !requireQuizRecovery(error)) await appAlert('This practice step could not save. Your choice is still here. Check your connection and try again.');
  } finally {
    if (current()) {
      assessmentBusy = false;
      if (!quizSubmitted && !quizRecoveryCode) nextQuestionButton.disabled = false;
    }
  }
}
import { quizDraftVersion } from "./quiz-draft-policy.js";
import { classroomLearningContext, mountLearningNavigation } from "./learning-navigation.js";
import { learningDraft, draftStatus, restartControl } from "./learning-draft.js";
import { studentTabStorage } from "./student-session-storage.js";
import { loadProgressionPolicy } from "./progression.js";
import { progressionState } from "./progression-policy.js";
import { startMissionQuiz } from "./mission-assessment-client.js";
import { diagnoseMissionTopics, minimumMissionCorrect, nextAdaptiveDifficulty, selectAdaptiveQuestion } from "./mission-assessment.js";
import { requirePassingScore } from "./activity-policy.js";
﻿import { submitStudentActivity } from "./student-rewards-client.js";
import { renderStudentIdentity } from "./student-profile.js";
import { requireLearningAccess, LearningAccessError } from "./learning-access.js";
import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const quizLoading =
    document.getElementById(
        "quizLoading"
    );

const quizError =
    document.getElementById(
        "quizError"
    );

const quizContent =
    document.getElementById(
        "quizContent"
    );

const quizTitle =
    document.getElementById(
        "quizTitle"
    );

const quizDescription =
    document.getElementById(
        "quizDescription"
    );

const questionProgress =
    document.getElementById(
        "questionProgress"
    );

const answeredProgress =
    document.getElementById(
        "answeredProgress"
    );

const quizProgressFill =
    document.getElementById(
        "quizProgressFill"
    );

    const missionCheckpoints =
    document.getElementById(
        "missionCheckpoints"
    );

const questionCard =
    document.getElementById(
        "questionCard"
    );

const questionNumber =
    document.getElementById(
        "questionNumber"
    );

const questionText =
    document.getElementById(
        "questionText"
    );

const quizOptions =
    document.getElementById(
        "quizOptions"
    );

    const historicalClueCard =
    document.getElementById(
        "historicalClueCard"
    );

const historicalClueText =
    document.getElementById(
        "historicalClueText"
    );

const previousQuestionButton =
    document.getElementById(
        "previousQuestionButton"
    );

const nextQuestionButton =
    document.getElementById(
        "nextQuestionButton"
    );

const quizResult =
    document.getElementById(
        "quizResult"
    );

const quizResultIcon =
    document.getElementById(
        "quizResultIcon"
    );

    const quizResultEyebrow =
    document.getElementById(
        "quizResultEyebrow"
    );

const quizResultTitle =
    document.getElementById(
        "quizResultTitle"
    );

const quizScore =
    document.getElementById(
        "quizScore"
    );

const quizResultMessage =
    document.getElementById(
        "quizResultMessage"
    );

const retryQuizButton =
    document.getElementById(
        "retryQuizButton"
    );

const continueResultButton =
    document.getElementById(
        "continueResultButton"
    );


/* ==========================================
   ANSWER REVIEW ELEMENTS
========================================== */

const quizAnswerReview =
    document.getElementById(
        "quizAnswerReview"
    );

const quizAnswerReviewList =
    document.getElementById(
        "quizAnswerReviewList"
    );


/* ==========================================
   REWARD ELEMENTS
========================================== */

const missionRewardCard =
    document.getElementById(
        "missionRewardCard"
    );

const missionXpReward =
    document.getElementById(
        "missionXpReward"
    );

const artifactReward =
    document.getElementById(
        "artifactReward"
    );

const artifactRewardIcon =
    document.getElementById(
        "artifactRewardIcon"
    );

const artifactRewardName =
    document.getElementById(
        "artifactRewardName"
    );

const artifactRewardDescription =
    document.getElementById(
        "artifactRewardDescription"
    );

const missionRewardProgress =
    document.getElementById(
        "missionRewardProgress"
    );

const missionTotalXp =
    document.getElementById(
        "missionTotalXp"
    );

const missionResultLevel =
    document.getElementById(
        "missionResultLevel"
    );


/* ==========================================
   URL PARAMETERS
========================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

const chapterId =
    params.get(
        "chapter"
    );

const missionId =
    params.get(
        "mission"
    );


/* ==========================================
   STATE
========================================== */

let currentUser = null;
let quizSessionGeneration = 0;
const quizCountdown = document.getElementById('quizCountdown');
const quizHeartsDepleted = document.getElementById('quizHeartsDepleted');
const quizDefeatStatus = document.getElementById('quizDefeatStatus');
const quizDefeatAction = quizHeartsDepleted.querySelector('button');
quizHeartsDepleted.addEventListener('cancel', event => {
    if (quizDefeatAction.disabled) event.preventDefault();
});
quizHeartsDepleted.addEventListener('close', () => {
    if (quizHeartsDepleted.open || !currentUser || quizContent.hidden) return;
    if (!quizResult.hidden) quizResultTitle.focus({preventScroll:true});
    else if (quizRecoveryCode) recoverQuizAttempt.focus();
    else if (!checkQuizSaveButton.hidden) checkQuizSaveButton.focus();
});

function updateQuizDefeat(status, action) {
    quizDefeatStatus.textContent = status;
    quizDefeatAction.textContent = action || 'View quiz result';
    quizDefeatAction.disabled = !action;
    if (action && quizHeartsDepleted.open) quizDefeatAction.focus({preventScroll:true});
}
let quizDraft = null;
let quizDraftReady = false;
const quizDraftStatus = draftStatus(quizContent);
const quizAnswerSaveStatus = document.getElementById('quizAnswerSaveStatus');
function updateAnswerSaveStatus(state, message = '') {
    quizAnswerSaveStatus.hidden = !message;
    quizAnswerSaveStatus.dataset.state = state;
    quizAnswerSaveStatus.textContent = message;
    if (message) nextQuestionButton.setAttribute('aria-describedby', quizAnswerSaveStatus.id);
    else if (nextQuestionButton.getAttribute('aria-describedby') === quizAnswerSaveStatus.id) {
        nextQuestionButton.removeAttribute('aria-describedby');
    }
}
const checkQuizSaveButton = document.getElementById('checkQuizSaveButton');
const recoverQuizAttempt = document.getElementById('recoverQuizAttempt');
let quizRecoveryCode = '';
function requireQuizRecovery(error) {
    if (!recoverQuizAttempt || !['assessment/reopen-required','assessment/restart-required','assessment/classroom-changed'].includes(error?.code)) return false;
    quizRecoveryCode = error.code;
    recoverQuizAttempt.hidden = false;
    recoverQuizAttempt.textContent = quizRecoveryCode === 'assessment/classroom-changed' ? 'Open My Class' : 'Reopen quiz';
    updateAnswerSaveStatus('retry', error.message);
    nextQuestionButton.disabled = true;
    if (checkQuizSaveButton) checkQuizSaveButton.hidden = true;
    recoverQuizAttempt.focus();
    return true;
}
recoverQuizAttempt?.addEventListener('click', () => {
    if (!quizRecoveryCode || assessmentBusy || quizSubmitted) return;
    if (quizRecoveryCode === 'assessment/classroom-changed') navigatePage('my-class.html');
    else void loadQuiz();
});
checkQuizSaveButton?.addEventListener('click', async () => {
    if (!securedQuiz || !currentUser || quizSubmitted || assessmentBusy || checkQuizSaveButton.disabled) return;
    const generation = quizSessionGeneration, attemptId = currentAttemptId;
    const current = () => generation === quizSessionGeneration && attemptId === currentAttemptId;
    const notice = document.getElementById('quizSaveStatus');
    checkQuizSaveButton.disabled = true;
    const nextWasDisabled = nextQuestionButton.disabled;
    nextQuestionButton.disabled = true;
    notice.dataset.state = 'saving';
    notice.textContent = 'Checking for your saved result…';
    let found;
    try {
        found = await checkAssessmentResult(securedIdentity());
        if (current() && !found) notice.textContent = 'A saved result is not available yet. Your answers are still here. You can check again or submit them.';
    } catch (error) {
        if (current() && !requireQuizRecovery(error)) notice.textContent = 'We could not check your result. Your answers are still here. Check your connection and try again.';
    } finally {
        if (current()) {
            notice.dataset.state = 'retry';
            checkQuizSaveButton.disabled = false;
            nextQuestionButton.disabled = nextWasDisabled || Boolean(quizRecoveryCode);
            if (!found && !quizRecoveryCode && document.activeElement === document.body) checkQuizSaveButton.focus();
        }
    }
    if (!current()) return;
    if (found) {
        studentAnswers = {...found.answers};
        await submitQuiz(true, found.result);
    }
});
const restartQuizButton = restartControl(quizContent, "Start Quiz Over", async () => {
    if (!currentUser || quizSubmitted || quizLoadPending || assessmentBusy) return;
    const generation = quizSessionGeneration;
    const attemptKey = 'missionQuiz:' + currentUser.uid + ':' + currentQuiz.id;
    quizDraftReady = false;
    try {
        await quizDraft.clear();
        if (generation !== quizSessionGeneration) return;
        if(securedQuiz)forgetAssessment(securedIdentity());
        studentTabStorage.removeItem(attemptKey);
        studentTabStorage.removeItem('missionQuizSet:' + currentUser.uid + ':' + currentAttemptId);
        await loadQuiz();
    } catch {
        if (generation !== quizSessionGeneration) return;
        quizDraft = learningDraft("quiz", chapterId, missionId, quizDraftStatus);
        quizDraftReady = true;
        quizDraftStatus.textContent = "Could not restart. Your current answers are still available. Try again.";
    }
});
let quizLoadPending = false;
const retryQuizLoadButton = document.getElementById("retryQuizLoadButton");

let currentMission = null;

let currentQuiz = null;
let lastQuizTopics = [];

let questions = [];
let missionQuestionBank = [];
let seenMissionQuestionIds = [];
let missionDifficultyLevels = [];
let missionTopicMastery = {};
let adaptiveQuestionPool = [];
let seenAdaptiveQuestionIds = [];
let adaptiveQuestionIds = [];
let adaptiveAnswers = {};
let adaptiveDifficultyLevels = [];
let adaptiveTopicWeights = {};
let adaptiveTopicAttempts = {};
let adaptiveTargetDifficulty = null;
let adaptiveQuestionLimit = 0;
let adaptiveQuestionIndex = 0;
let adaptiveCurrentQuestion = null;
let adaptiveSelectedAnswer = null;
let adaptiveFeedbackVisible = false;
let adaptiveFollowupStarted = false;
let adaptiveFollowupComplete = false;

let currentQuestionIndex = 0;

let studentAnswers = {};
let flaggedQuestions = new Set();
let quizStarted = false;

let lockedAnswers = {};

let quizSubmitted = false;


let currentAttemptId = null;

let lastQuizPassed = false;
let resultNextHref = null;

let lastMissionReward = 0;

let lastArtifactResult = null;

let lastCompletionResult = null;
let lastAdaptiveFollowup = null;


/* ==========================================
   LOAD QUIZ
========================================== */

async function loadQuiz() {
    if (quizLoadPending) return;
    const generation = quizSessionGeneration;
    const loadingUid = currentUser?.uid;
    const isCurrent = () => generation === quizSessionGeneration && currentUser?.uid === loadingUid;

    if (
        !currentUser ||
        !chapterId ||
        !missionId
    ) {

        showError(
            "The selected mission quiz could not be loaded."
        );

        return;
    }


    quizLoadPending = true;
    assessmentBusy = false;
    quizRecoveryCode = '';
    if (recoverQuizAttempt) recoverQuizAttempt.hidden = true;
    removeQuizResume();
    updateAnswerSaveStatus('');
    quizOptions.inert = false;
    if (checkQuizSaveButton) {
        checkQuizSaveButton.hidden = true;
        checkQuizSaveButton.disabled = false;
    }
    const previousSaveStatus = document.getElementById('quizSaveStatus');
    if (previousSaveStatus) {
        previousSaveStatus.hidden = true;
        delete previousSaveStatus.dataset.state;
        previousSaveStatus.textContent = '';
        nextQuestionButton.closest('.quiz-actions').before(previousSaveStatus);
    }
    nextQuestionButton.removeAttribute('aria-describedby');
    quizContent.hidden = true;
    quizContent.classList.remove('quiz-result-handoff');
    quizError.hidden = true;
    quizLoading.hidden = false;
    if (retryQuizLoadButton) retryQuizLoadButton.hidden = true;

    try {
        await requireLearningAccess(chapterId, missionId);
        if (!isCurrent()) return;

        /* ==================================
           RESET PAGE STATE
        ================================== */

        currentMission =
            null;

        currentQuiz =
            null;

        questions =
            [];

        missionQuestionBank = [];
        seenMissionQuestionIds = [];
        missionDifficultyLevels = [];
        missionTopicMastery = {};
        adaptiveQuestionPool = [];
        seenAdaptiveQuestionIds = [];
        adaptiveQuestionIds = [];
        adaptiveAnswers = {};
        adaptiveDifficultyLevels = [];
        adaptiveTopicWeights = {};
        adaptiveTopicAttempts = {};
        adaptiveTargetDifficulty = null;
        adaptiveQuestionLimit = 0;
        adaptiveQuestionIndex = 0;
        adaptiveCurrentQuestion = null;
        adaptiveSelectedAnswer = null;
        adaptiveFeedbackVisible = false;
        adaptiveFollowupStarted = false;
        adaptiveFollowupComplete = false;

        flaggedQuestions.clear();
        currentQuestionIndex =
            0;
studentAnswers =
    {};

lockedAnswers =
    {};

quizSubmitted =
    false;

currentAttemptId = null;

        lastQuizPassed =
            false;

        lastMissionReward =
            0;

        lastArtifactResult =
            null;

        lastCompletionResult =
            null;
        lastAdaptiveFollowup = null;


        if (quizResult) {

            quizResult.hidden =
                true;

        }


        if (questionCard) {

            questionCard.hidden =
                false;

        }


        if (missionRewardCard) {

            missionRewardCard.hidden =
                true;

        }


        if (missionXpReward) {

            missionXpReward.hidden =
                true;

        }


        if (artifactReward) {

            artifactReward.hidden =
                true;

        }


        if (missionRewardProgress) {

            missionRewardProgress.hidden =
                true;

        }


        if (quizAnswerReview) {

            quizAnswerReview.hidden =
                true;

        }


        if (quizAnswerReviewList) {

            quizAnswerReviewList.innerHTML =
                "";

        }


        /* ==================================
           LOAD MISSION
        ================================== */

        const missionReference =
            doc(
                db,
                "missions",
                missionId
            );


        const missionSnapshot =
            await getDoc(
                missionReference
            );


        if (!isCurrent()) return;
        if (
            !missionSnapshot.exists()
        ) {

            showError(
                "The selected mission could not be found."
            );

            return;
        }


        currentMission = {

            id:
                missionSnapshot.id,

            ...missionSnapshot.data()

        };


        if (
            currentMission.chapterId !==
            chapterId
        ) {

            showError(
                "This mission does not belong to the selected chapter."
            );

            return;
        }


        /* ==================================
           LOAD QUIZZES
        ================================== */

        const quizSnapshot =
            await getDocs(
                query(collection(db,"quizzes"),where("missionId","==",missionId))
            );


        if (!isCurrent()) return;
        const quizzes = [];


        quizSnapshot.forEach(
            (documentSnapshot) => {

                quizzes.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        currentQuiz =
            quizzes.find(
                (quiz) =>

                    quiz.missionId ===
                        missionId &&

                    quiz.status ===
                        "active"
            );


        if (!currentQuiz) {

            showError(
                "No active quiz is available for this mission."
            );

            return;
        }

        requirePassingScore(currentQuiz);


        /* ==================================
           LOAD QUESTIONS
        ================================== */

        quizDraft?.close();
        quizDraftReady = false;
        quizDraft = learningDraft("quiz", chapterId, missionId, quizDraftStatus);
        const savedDraft = await quizDraft.read();
        if (!isCurrent()) return;
        const attemptKey = 'missionQuiz:' + currentUser.uid + ':' + currentQuiz.id;
        const knownAttemptId = savedDraft?.quizId === currentQuiz.id && typeof savedDraft.attemptId === "string" ? savedDraft.attemptId : studentTabStorage.getItem(attemptKey);
        currentAttemptId = knownAttemptId || (globalThis.__lakbayExplorationPreview === true ? crypto.randomUUID() : null);
        if (currentAttemptId) studentTabStorage.setItem(attemptKey, currentAttemptId);
        if (savedDraft?.attemptId === currentAttemptId && Array.isArray(savedDraft.questionIds)) studentTabStorage.setItem("missionQuizSet:" + currentUser.uid + ":" + currentAttemptId, JSON.stringify(savedDraft.questionIds));
        const issued = await startMissionQuiz({ chapterId, missionId, quizId: currentQuiz.id, attemptId: currentAttemptId,
            questionIds: savedDraft?.quizId === currentQuiz.id && savedDraft?.attemptId === currentAttemptId && Array.isArray(savedDraft.questionIds) ? savedDraft.questionIds : null });
        if (!isCurrent()) return;
        currentAttemptId = issued.attemptId;
        // Resume the server-issued attempt after the completed draft is cleared.
        studentTabStorage.setItem(attemptKey, currentAttemptId);
        securedQuiz=issued.secured===true;
        quizExpedition=securedQuiz ? issued.expedition || null : null;
        const expeditionFeedback = document.getElementById('quizExpeditionFeedback');
        if (expeditionFeedback) {
            expeditionFeedback.textContent = '';
            delete expeditionFeedback.dataset.outcome;
        }
        clearQuizHeartLoss();
        questions = issued.questions;
        missionQuestionBank = issued.questionBank || issued.questions;
        seenMissionQuestionIds = issued.seenQuestionIds || [];
        missionDifficultyLevels = getMissionDifficultyLevels();
        missionTopicMastery = issued.topicMastery || {};
        adaptiveQuestionPool = issued.adaptiveQuestions || [];
        seenAdaptiveQuestionIds = issued.seenAdaptiveIds || [];
        currentQuiz.practicePolicy = issued.practicePolicy || currentQuiz.practicePolicy || null;
        currentQuiz.passingScore = issued.passingScore;
        const passingRequirement = document.getElementById("quizPassingRequirement");
        if (passingRequirement) passingRequirement.textContent = "Answer all " + questions.length + " questions. You need at least " + minimumMissionCorrect(questions.length, requirePassingScore(currentQuiz)) + " correct to meet the " + currentQuiz.passingScore + "% passing goal.";
        const notice = document.getElementById("quizSetNotice");
        if (notice) notice.textContent = questions.some(question=>seenMissionQuestionIds.includes(question.id))
            ? "You may recognize a question from an earlier attempt." : "";

        /* ==================================
           DISPLAY QUIZ INFORMATION
        ================================== */

        quizTitle.textContent = currentMission.title || currentQuiz.title || "Mission Quiz";
        const focusMission = document.getElementById('quizFocusMission');
        if (focusMission) {
            focusMission.textContent = quizTitle.textContent;
            focusMission.hidden = false;
        }


        quizDescription.textContent =
            currentQuiz.description ||
            "Test what you learned during this mission.";


        /* ==================================
           DISPLAY FIRST QUESTION
        ================================== */

        currentQuestionIndex =
            0;


        if (securedQuiz) {
            studentAnswers = {...issued.answers};
            const answered = Object.keys(issued.answers).length;
            quizStarted = answered > 0;
            currentQuestionIndex = Math.min(quizExpedition?.exhausted ? answered - 1 : answered, questions.length - 1);
        }
        const currentDraftVersion = quizDraftVersion(currentQuiz, questions, adaptiveQuestionPool, missionQuestionBank);
        const canResumeDraft = !securedQuiz && savedDraft?.version === currentDraftVersion && savedDraft?.attemptId === currentAttemptId &&
            JSON.stringify(savedDraft.questionIds) === JSON.stringify(questions.map(q => q.id));
        if (canResumeDraft) {
            flaggedQuestions = new Set((Array.isArray(savedDraft.flagged)?savedDraft.flagged:[]).filter(id=>questions.some(q=>q.id===id)));
            for (const question of questions) {
                const answer = savedDraft.answers?.[question.id];
                if (["A", "B", "C", "D"].includes(answer)) {
                    studentAnswers[question.id] = answer;
                    if (savedDraft.locked?.[question.id] === true) lockedAnswers[question.id] = true;
                }
            }
            if (Number.isInteger(savedDraft.index)) currentQuestionIndex = Math.max(0, Math.min(savedDraft.index, questions.length - 1));
            // Legacy extra-practice drafts resume their main answers for review.
            if (savedDraft.missionTopicMastery && typeof savedDraft.missionTopicMastery === 'object' && !Array.isArray(savedDraft.missionTopicMastery)) {
                missionTopicMastery = {...savedDraft.missionTopicMastery};
            }
        }
        if (!securedQuiz && savedDraft && savedDraft.attemptId === currentAttemptId && savedDraft.version !== currentDraftVersion) {
            const resumeNotice = document.getElementById("quizSetNotice");
            if (resumeNotice) resumeNotice.textContent += " The quiz content changed, so your saved answers have been reset. Completed progress and rewards are unchanged.";
        }
        quizStarted = securedQuiz ? (Object.keys(issued.answers||{}).length>0||issued.followupStarted) : canResumeDraft &&
            savedDraft?.attemptId === currentAttemptId &&
            JSON.stringify(savedDraft.questionIds) === JSON.stringify(questions.map(q=>q.id)) &&
            (savedDraft.started === true || Object.keys(studentAnswers).length > 0);
        if(savedDraft&&savedDraft.attemptId!==currentAttemptId){const note=document.getElementById('quizSetNotice');if(note)note.textContent+=' Please restart this unfinished quiz with verified saving. Your completed missions and earned rewards are still saved.';}
        quizDraftReady = true;
        restartQuizButton.hidden = !savedDraft && !(securedQuiz && quizStarted && !issued.result);
        displayQuestion();
        renderMissionBriefing();
        if (quizStarted && !issued.result && !issued.followupStarted && !quizExpedition?.exhausted) renderQuizResume();

        quizLoading.hidden =
            true;

        quizError.hidden =
            true;

        quizContent.hidden =
            false;
        if(securedQuiz&&issued.result){adaptiveFollowupComplete=true;await submitQuiz(true,issued.result);}
        else if(quizExpedition?.exhausted){await submitQuiz(true);}
        else if(securedQuiz&&issued.followupStarted){await submitQuiz();}


    } catch (error) {

        if (!isCurrent()) return;
        console.error(
            "Unable to load quiz:",
            error
        );


        showError(
            error.message || "We could not load this quiz. Please try again."
        );

    } finally {
        if (isCurrent()) quizLoadPending = false;
    }

}

function removeQuizResume() {
    const resume = document.getElementById('quizResumePanel');
    if (!resume) return;
    quizContent.prepend(restartQuizButton);
    resume.remove();
}

function renderQuizResume() {
    const panel = document.createElement('section');
    panel.id = 'quizResumePanel';
    panel.className = 'quiz-resume-panel';
    const heading = document.createElement('h2');
    heading.id = 'quizResumeTitle';
    heading.textContent = 'Pick up where you left off';
    panel.setAttribute('aria-labelledby', heading.id);
    const detail = document.createElement('p');
    const place = questions.every(question => studentAnswers[question.id])
        ? 'All ' + questions.length + ' questions answered'
        : 'Question ' + (currentQuestionIndex + 1) + ' of ' + questions.length;
    detail.textContent = quizTitle.textContent + ' · ' + place;
    const actions = document.createElement('div');
    actions.className = 'briefing-actions quiz-resume-actions';
    const resume = document.createElement('button');
    resume.type = 'button';
    resume.className = 'begin-mission-button';
    resume.textContent = 'Resume Quiz';
    resume.addEventListener('click', () => {
        removeQuizResume();
        questionText.tabIndex = -1;
        questionText.focus({preventScroll:true});
        questionText.scrollIntoView({block:'start',behavior:'instant'});
    });
    actions.append(resume, restartQuizButton);
    panel.append(heading, detail, actions);
    quizContent.querySelector('.quiz-header').after(panel);
}


function renderMissionBriefing(){
 document.getElementById('quizMissionBriefing')?.remove();
 const progress=document.querySelector('.quiz-progress-card');
 if(progress)progress.hidden=!quizStarted;
 questionCard.hidden=!quizStarted;
 if(quizStarted)return;
 const focusProgress=document.getElementById('quizFocusProgress');
 if(focusProgress)focusProgress.textContent='Quiz briefing';
 const briefing=document.createElement('section');briefing.id='quizMissionBriefing';briefing.className='quiz-mission-briefing';briefing.setAttribute('aria-labelledby','quizBriefingTitle');
 const add=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;briefing.append(el);return el;};
 const title=add('h2','Ready to begin?');title.id='quizBriefingTitle';
 const icon=document.createElement('span');
 icon.className='interface-icon interface-icon--compass';
 icon.setAttribute('aria-hidden','true');
 title.prepend(icon);
 add('p',quizExpedition ? 'Start with three hearts. Each wrong answer costs one heart. Lose all three and the attempt ends. Use Bayani once to cross out a wrong choice.' : 'Answer one question at a time. Review your answers before you submit.');
 const guide=document.createElement('details');guide.className='quiz-briefing-guide';
 const summary=document.createElement('summary');summary.textContent='How this quiz works';guide.append(summary);
 const objectives=Array.isArray(currentMission.learningObjectives)?currentMission.learningObjectives:[currentMission.learningObjective];
 const list=document.createElement('ul');for(const value of objectives)if(typeof value==='string'&&value.trim()){const item=document.createElement('li');item.textContent=value;list.append(item);}
 if(list.children.length){const heading=document.createElement('h3');heading.textContent='Topics covered';guide.append(heading,list);}
 const mechanics=document.createElement('p');
 mechanics.textContent=quizExpedition
    ? 'Locked answers are final. To pass, finish with at least one heart and get ' +
        minimumMissionCorrect(questions.length, requirePassingScore(currentQuiz)) + ' of ' + questions.length + ' answers correct.'
    : 'Your answers help select later questions. Changing an earlier answer clears the answers after it. Flags help you review before submitting. You’ll see your score after saving.';
 guide.append(mechanics);
 if(Number.isFinite(currentMission.xpReward)&&currentMission.xpReward>0){const reward=document.createElement('p');reward.className='briefing-reward-note';reward.textContent='Earn up to '+currentMission.xpReward+' XP the first time you complete this mission.';guide.append(reward);}
 const actions=document.createElement('div');actions.className='briefing-actions';const lesson=document.createElement('a');lesson.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId});lesson.textContent='Revisit Lesson';
 const begin=document.createElement('button');begin.type='button';begin.className='begin-mission-button';begin.textContent='Start Mission Quiz';begin.dataset.startCountdown='';begin.addEventListener('click',async()=>{
    if (!currentUser || quizSubmitted || begin.disabled) return;
    const generation = quizSessionGeneration;
    begin.disabled = true;
    try {
        if (quizCountdown?.showModal) {
            const number = quizCountdown.querySelector('strong');
            number.textContent = '3';
            quizCountdown.dataset.beat = '3';
            delete quizCountdown.dataset.finalBeat;
            quizCountdown.showModal();
            for (let count = 3; count > 0; count--) {
                number.textContent = String(count);
                quizCountdown.dataset.beat = String(count);
                if (count === 1) quizCountdown.dataset.finalBeat = '';
                animateAssessmentArrival(number);
                document.dispatchEvent(new CustomEvent('lakbay:countdown-tick'));
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (!quizCountdown.open || generation !== quizSessionGeneration || !currentUser) return;
            }
            quizCountdown.close();
        }
        quizStarted=true;
        renderMissionBriefing();
        displayQuestion();
        document.dispatchEvent(new CustomEvent('lakbay:compass-ready'));
        questionText.tabIndex=-1;
        questionText.focus();
    } finally {
        if (quizCountdown?.open && generation === quizSessionGeneration) quizCountdown.close();
        begin.disabled = false;
        if (begin.isConnected && generation === quizSessionGeneration) begin.focus();
    }
 });
 actions.append(begin,lesson);briefing.append(actions,guide);questionCard.before(briefing);
}

function getMissionDifficultyLevels() {
    const levels = [...new Set(missionQuestionBank.map(question => String(question.difficulty || '').trim().toLowerCase()).filter(Boolean))];
    const standardOrder = ['easy', 'medium', 'hard'];
    return levels.sort((first, second) => {
        const firstRank = standardOrder.indexOf(first), secondRank = standardOrder.indexOf(second);
        if (firstRank >= 0 && secondRank >= 0) return firstRank - secondRank;
        if (firstRank >= 0) return -1;
        if (secondRank >= 0) return 1;
        return first.localeCompare(second);
    });
}

function getInitialMissionTargetDifficulty() {
    if (!missionDifficultyLevels.length) return null;
    const policy = currentQuiz?.practicePolicy || {};
    const mastery = Object.values(missionTopicMastery);
    const attempted = mastery.reduce((sum, state) => sum + Math.max(0, Number(state?.attempted) || 0), 0);
    const correct = mastery.reduce((sum, state) => sum + Math.max(0, Number(state?.correct) || 0), 0);
    let requested = mastery.some(state => Number(state?.missed) > 0) ? policy.reviewDifficulty : policy.startDifficulty;

    if (attempted > 0 && Number.isFinite(policy.promoteAccuracy) && Number.isFinite(policy.demoteAccuracy)) {
        const accuracy = correct / attempted;
        if (accuracy >= policy.promoteAccuracy) requested = missionDifficultyLevels.at(-1);
        else if (accuracy <= policy.demoteAccuracy) requested = missionDifficultyLevels[0];
    }

    const normalized = String(requested || '').trim().toLowerCase();
    if (missionDifficultyLevels.includes(normalized)) return normalized;
    return missionDifficultyLevels[Math.floor((missionDifficultyLevels.length - 1) / 2)];
}

function chooseNextMissionQuestion(throughIndex) {
    if (!currentQuiz || !missionDifficultyLevels.length || throughIndex < 0) return null;
    const remainingTopicCounts = new Map();
    for (const slot of currentQuiz.questionBlueprint || []) {
        remainingTopicCounts.set(slot.topic, (remainingTopicCounts.get(slot.topic) || 0) + slot.count);
    }
    const usedIds = new Set();
    for (const question of questions.slice(0, throughIndex + 1)) {
        if (!question) continue;
        usedIds.add(question.id);
        const remaining = (remainingTopicCounts.get(question.topic) || 0) - 1;
        remainingTopicCounts.set(question.topic, remaining);
    }

    const topicWeights = Object.fromEntries(Object.entries(missionTopicMastery)
        .map(([topic, state]) => [topic, Math.max(0, Number(state?.missed) || 0)]));
    const topicAttempts = Object.fromEntries(Object.entries(missionTopicMastery)
        .map(([topic, state]) => [topic, Math.max(0, Number(state?.attempted) || 0)]));
    let targetDifficulty = getInitialMissionTargetDifficulty();

    for (const question of questions.slice(0, throughIndex + 1)) {
        const answer = studentAnswers[question?.id];
        if (!question || !['A', 'B', 'C', 'D'].includes(answer)) continue;
        const topic = String(question.topic || '').trim();
        if (topic) {
            const correct = answer === String(question.correctAnswer || '').trim().toUpperCase();
            topicAttempts[topic] = (Number(topicAttempts[topic]) || 0) + 1;
            topicWeights[topic] = Math.max(0, (Number(topicWeights[topic]) || 0) + (correct ? -1 : 1));
            targetDifficulty = nextAdaptiveDifficulty(targetDifficulty, correct, missionDifficultyLevels) || targetDifficulty;
        }
    }

    const candidates = missionQuestionBank.filter(question =>
        (remainingTopicCounts.get(question.topic) || 0) > 0 && !usedIds.has(question.id));
    return selectAdaptiveQuestion(candidates, {
        usedIds: [...usedIds],
        seenIds: seenMissionQuestionIds,
        topicWeights,
        topicAttempts,
        targetDifficulty,
        difficultyLevels: missionDifficultyLevels
    });
}

function placeNextMissionQuestion(index, question) {
    const targetIndex = index + 1;
    const displacedQuestion = questions[targetIndex];
    const duplicateIndex = questions.findIndex((item, itemIndex) => itemIndex > targetIndex && item.id === question.id);
    const matchingTopicIndex = questions.findIndex((item, itemIndex) =>
        itemIndex > targetIndex && item.topic === question.topic);
    questions[targetIndex] = question;
    if (duplicateIndex > targetIndex) {
        questions[duplicateIndex] = displacedQuestion;
    } else if (question.topic !== displacedQuestion.topic && matchingTopicIndex > targetIndex) {
        questions[matchingTopicIndex] = displacedQuestion;
    }
    const activeQuestionIds = new Set(questions.map(item => item.id));
    for (const flaggedId of flaggedQuestions) if (!activeQuestionIds.has(flaggedId)) flaggedQuestions.delete(flaggedId);
}

function getAdaptiveDifficultyLevels() {
    const configured = currentQuiz?.practicePolicy?.difficultyLevels;
    if (Array.isArray(configured) && configured.length) {
        return [...new Set(configured.map(value => String(value).trim().toLowerCase()).filter(Boolean))];
    }
    const available = new Set(adaptiveQuestionPool.map(question => String(question.difficulty || '').trim().toLowerCase()));
    return ['easy', 'medium', 'hard'].filter(level => available.has(level));
}

function getAdaptiveCandidates() {
    const levels = getAdaptiveDifficultyLevels();
    return adaptiveQuestionPool.filter(question => question.status === 'active' &&
        question.missionId === missionId && typeof question.topic === 'string' && question.topic.trim() &&
        levels.includes(String(question.difficulty || '').trim().toLowerCase()) &&
        ['A', 'B', 'C', 'D'].every(key => typeof question[`option${key}`] === 'string') &&
        ['A', 'B', 'C', 'D'].includes(String(question.correctAnswer || '').trim().toUpperCase()));
}

function getAdaptiveQuestionLimit() {
    if(securedQuiz)return assessmentState(securedIdentity())?.followupLimit||0;
    return Math.min(3, getAdaptiveCandidates().length);
}

function getInitialAdaptiveDifficulty(weakTopics = []) {
    const levels = adaptiveDifficultyLevels.length ? adaptiveDifficultyLevels : getAdaptiveDifficultyLevels();
    if (!levels.length) return null;
    const policy = currentQuiz?.practicePolicy || {};
    const requested = weakTopics.length ? policy.reviewDifficulty : policy.startDifficulty;
    const normalized = String(requested || '').trim().toLowerCase();
    if (levels.includes(normalized)) return normalized;
    return weakTopics.length ? levels[0] : levels[Math.floor((levels.length - 1) / 2)];
}

function makeAdaptiveTopicWeights(weakTopics = []) {
    return Object.fromEntries([...new Set(weakTopics)].map(topic => [topic, 2]));
}

function saveQuizDraftState() {
    if (!quizDraftReady || !currentUser || !currentQuiz || quizSubmitted) return;
    const questionIds = questions.map(question => question.id);
    try {
        if (currentAttemptId) studentTabStorage.setItem('missionQuizSet:' + currentUser.uid + ':' + currentAttemptId, JSON.stringify(questionIds));
    } catch {}
    quizDraft?.save({
        version: quizDraftVersion(currentQuiz, questions, adaptiveQuestionPool, missionQuestionBank),
        quizId: currentQuiz.id,
        attemptId: currentAttemptId,
        questionIds,
        answers: studentAnswers,
        locked: lockedAnswers,
        flagged: [...flaggedQuestions],
        started: quizStarted,
        index: currentQuestionIndex,
        adaptiveFollowupStarted,
        adaptiveQuestionIds,
        adaptiveAnswers,
        adaptiveQuestionIndex,
        adaptiveSelectedAnswer,
        adaptiveFeedbackVisible,
        adaptiveFollowupComplete,
        adaptiveTargetDifficulty,
        adaptiveTopicWeights,
        adaptiveTopicAttempts,
        missionTopicMastery
    });
}

function chooseNextAdaptiveQuestion() {
    return selectAdaptiveQuestion(getAdaptiveCandidates(), {
        usedIds: adaptiveQuestionIds,
        seenIds: seenAdaptiveQuestionIds,
        topicWeights: adaptiveTopicWeights,
        topicAttempts: adaptiveTopicAttempts,
        targetDifficulty: adaptiveTargetDifficulty,
        difficultyLevels: adaptiveDifficultyLevels
    });
}

function startAdaptiveFollowup() {
    adaptiveDifficultyLevels = getAdaptiveDifficultyLevels();
    adaptiveQuestionLimit = getAdaptiveQuestionLimit();
    if (!adaptiveQuestionLimit || !adaptiveDifficultyLevels.length) return false;

    const weakTopics = diagnoseMissionTopics(questions, studentAnswers);
    adaptiveTopicWeights = makeAdaptiveTopicWeights(weakTopics);
    adaptiveTopicAttempts = {};
    adaptiveQuestionIds = [];
    adaptiveAnswers = {};
    adaptiveQuestionIndex = 0;
    adaptiveSelectedAnswer = null;
    adaptiveFeedbackVisible = false;
    adaptiveTargetDifficulty = getInitialAdaptiveDifficulty(weakTopics);
    adaptiveFollowupStarted = true;

    for (const question of questions) lockedAnswers[question.id] = true;
    adaptiveCurrentQuestion = chooseNextAdaptiveQuestion();
    if (!adaptiveCurrentQuestion) {
        adaptiveFollowupStarted = false;
        return false;
    }
    adaptiveQuestionIds.push(adaptiveCurrentQuestion.id);
    displayAdaptiveQuestion();
    questionText.tabIndex = -1;
    questionText.focus({preventScroll:true});
    return true;
}

function displayAdaptiveQuestion() {
    if (!adaptiveCurrentQuestion) return;
    const question = adaptiveCurrentQuestion;
    const answer = adaptiveSelectedAnswer || adaptiveAnswers[question.id] || null;
    const adaptiveIntro = document.getElementById('adaptiveFollowupIntro');
    if (adaptiveIntro) adaptiveIntro.hidden = false;
    const flagPanel = document.getElementById('flagReviewPanel');
    if (flagPanel) { flagPanel.hidden = true; flagPanel.replaceChildren(); }
    questionCard.hidden = false;
    previousQuestionButton.hidden = true;
    previousQuestionButton.disabled = true;
    const flagButton = document.getElementById('flagQuestionButton');
    const flagCount = document.getElementById('flaggedQuestionCount');
    if (flagButton) flagButton.hidden = true;
    if (flagCount) flagCount.hidden = true;
    if (missionCheckpoints) missionCheckpoints.hidden = true;
    questionNumber.textContent = `PERSONALIZED CHECK ${adaptiveQuestionIndex + 1}`;
    questionText.textContent = question.question || 'Practice question';
    quizOptions.replaceChildren();

    for (const key of ['A', 'B', 'C', 'D']) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'quiz-option';
        option.dataset.option = key;
        if (answer === key) option.classList.add('selected');
        if (adaptiveFeedbackVisible) {
            option.disabled = true;
            if (key === String(question.correctAnswer).trim().toUpperCase()) option.classList.add('correct');
            else if (answer === key) option.classList.add('incorrect');
        }
        const letter = document.createElement('span');
        letter.className = 'quiz-option-letter';
        letter.textContent = key;
        const copy = document.createElement('span');
        copy.className = 'quiz-option-text';
        copy.textContent = question[`option${key}`] || '';
        option.append(letter, copy);
        option.addEventListener('click', () => {
            if (adaptiveFeedbackVisible || quizSubmitted) return;
            adaptiveSelectedAnswer = key;
            displayAdaptiveQuestion();
            quizOptions.querySelector(`[data-option="${key}"]`)?.focus({preventScroll:true});
        });
        quizOptions.append(option);
    }

    if (historicalClueCard && historicalClueText) {
        const clueLabel = document.getElementById('historicalClueLabel');
        if (clueLabel) clueLabel.textContent = 'PERSONALIZED FEEDBACK';
        historicalClueCard.hidden = !adaptiveFeedbackVisible;
        if (adaptiveFeedbackVisible) {
            const chosen = adaptiveAnswers[question.id];
            const correct = chosen === String(question.correctAnswer).trim().toUpperCase();
            const explanation = question.answerExplanations?.[chosen] || question.explanation || question.learningPoint || '';
            const correctText = question[`option${String(question.correctAnswer).trim().toUpperCase()}`] || '';
            historicalClueText.textContent = correct
                ? `Correct. ${explanation}`
                : `The best-supported answer is ${correctText}. ${explanation}`;
        } else historicalClueText.textContent = '';
    }

    questionProgress.textContent = `Extra Practice: ${adaptiveQuestionIndex + 1} of ${adaptiveQuestionLimit}`;
    answeredProgress.textContent = 'Only your '+questions.length+' quiz answers count toward your score. Finish this practice to see your result.';
    quizProgressFill.style.width = `${Math.round(100 * (questions.length + adaptiveQuestionIndex + (adaptiveFeedbackVisible ? 1 : 0)) / (questions.length + adaptiveQuestionLimit))}%`;
    nextQuestionButton.disabled = !adaptiveFeedbackVisible && !answer;
    nextQuestionButton.textContent = adaptiveFeedbackVisible
        ? (adaptiveFollowupComplete ? 'Retry Save' : adaptiveQuestionIds.length < adaptiveQuestionLimit ? 'Next Practice Question' : 'Save & See My Result')
        : 'Check Answer';
    saveQuizDraftState();
}

async function handleAdaptiveFollowupAction() {
    if(securedQuiz){(await securedFollowupAction());return;}
    if (!adaptiveCurrentQuestion) return;
    const question = adaptiveCurrentQuestion;
    if (!adaptiveFeedbackVisible) {
        if (!adaptiveSelectedAnswer) return;
        adaptiveAnswers[question.id] = adaptiveSelectedAnswer;
        const correct = adaptiveSelectedAnswer === String(question.correctAnswer).trim().toUpperCase();
        const topic = question.topic.trim();
        adaptiveTopicAttempts[topic] = (Number(adaptiveTopicAttempts[topic]) || 0) + 1;
        adaptiveTopicWeights[topic] = Math.max(0, (Number(adaptiveTopicWeights[topic]) || 0) + (correct ? -1 : 1));
        adaptiveTargetDifficulty = nextAdaptiveDifficulty(question.difficulty, correct, adaptiveDifficultyLevels);
        adaptiveFeedbackVisible = true;
        displayAdaptiveQuestion();
        return;
    }

    if (adaptiveQuestionIds.length < adaptiveQuestionLimit) {
        adaptiveCurrentQuestion = chooseNextAdaptiveQuestion();
        if (adaptiveCurrentQuestion) {
            adaptiveQuestionIds.push(adaptiveCurrentQuestion.id);
            adaptiveQuestionIndex += 1;
            adaptiveSelectedAnswer = null;
            adaptiveFeedbackVisible = false;
            displayAdaptiveQuestion();
            questionText.tabIndex = -1;
            questionText.focus({preventScroll:true});
            return;
        }
    }

    adaptiveFollowupComplete = true;
    saveQuizDraftState();
    (await submitQuiz(true));
}

function displayMissionCheckpoints() {
 if(!missionCheckpoints)return;
 missionCheckpoints.replaceChildren();missionCheckpoints.setAttribute('role','list');missionCheckpoints.setAttribute('aria-label','Mission Quiz questions. Answered does not mean correct.');
 questions.forEach((question,index)=>{
  const answered=Boolean(studentAnswers[question.id]),current=index===currentQuestionIndex;
  const flagged=flaggedQuestions.has(question.id);
  const checkpoint=document.createElement('div');checkpoint.className='mission-checkpoint'+(answered?' answered':'')+(current?' current':'');checkpoint.setAttribute('role','listitem');if(current)checkpoint.setAttribute('aria-current','step');
  checkpoint.classList.toggle('flagged',flagged);
  checkpoint.setAttribute('aria-label','Question '+(index+1)+', '+(answered?'answered':'unanswered')+(current?', current':'')+(flagged?', marked for review':''));
  const dot=document.createElement('button');dot.className='mission-checkpoint-dot';dot.textContent=String(index+1);dot.type='button';dot.setAttribute('aria-label','Go to question '+(index+1));dot.disabled=!quizStarted||quizSubmitted||index>currentQuestionIndex;dot.addEventListener('click',()=>{if(!quizStarted||quizSubmitted||index>currentQuestionIndex)return;currentQuestionIndex=index;displayQuestion();questionText.tabIndex=-1;questionText.focus({preventScroll:true});});
  const copy=document.createElement('span');copy.className='mission-checkpoint-label';copy.textContent='Question '+(index+1);
  const state=document.createElement('small');state.className='checkpoint-state';state.textContent=(answered?'Answered':current?'Current':'Unanswered')+(flaggedQuestions.has(question.id)?' - Review Later':'');
  checkpoint.append(dot,copy,state);missionCheckpoints.append(checkpoint);
 });
}

function displayQuestion() {
    const flagButton=document.getElementById('flagQuestionButton'),flagCount=document.getElementById('flaggedQuestionCount');
    const adaptiveIntro=document.getElementById('adaptiveFollowupIntro');
    if(adaptiveIntro)adaptiveIntro.hidden=true;
    previousQuestionButton.hidden=false;
    if(missionCheckpoints)missionCheckpoints.hidden=false;
    if(flagButton)flagButton.hidden=false;
    if(flagCount)flagCount.hidden=false;
    const clueLabel=document.getElementById('historicalClueLabel');
    if(clueLabel)clueLabel.textContent='HISTORICAL CLUE DISCOVERED';
    if(flagButton){const flagged=flaggedQuestions.has(questions[currentQuestionIndex]?.id);flagButton.setAttribute('aria-pressed',String(flagged));flagButton.textContent=flagged?'Remove Review Mark':'Review Later';flagButton.disabled=quizSubmitted;}
    if(flagCount)flagCount.textContent=flaggedQuestions.size?flaggedQuestions.size+' marked for review':'';
    const flagPanel=document.getElementById('flagReviewPanel');if(flagPanel){flagPanel.hidden=true;flagPanel.replaceChildren();}

    saveQuizDraftState();

    if (
        questions.length === 0
    ) {

        return;

    }


    const question =
        questions[
            currentQuestionIndex
        ];


    const questionPosition =
        currentQuestionIndex + 1;
    removeQuizResume();
    updateAnswerSaveStatus('');
    quizOptions.classList.remove('bayani-lifeline-reveal');
    animateAssessmentArrival(questionCard, `${quizSessionGeneration}:${currentQuestionIndex}:${question.id}`);


    const expeditionAnswerLocked = Boolean(quizExpedition && assessmentState(securedIdentity())?.answers?.[question.id]);
    const answerLocked = quizSubmitted || expeditionAnswerLocked;


    /* ==================================
       CHECKPOINT NUMBER
    ================================== */

    questionNumber.textContent =
        `QUESTION ${questionPosition}`;


    /* ==================================
       QUESTION TEXT
    ================================== */

    questionText.textContent =
        question.question ||
        "Question";


    /* ==================================
       OPTIONS
    ================================== */

    quizOptions.innerHTML =
        "";


    const options = [

        {
            key: "A",
            text:
                question.optionA
        },

        {
            key: "B",
            text:
                question.optionB
        },

        {
            key: "C",
            text:
                question.optionC
        },

        {
            key: "D",
            text:
                question.optionD
        }

    ];


    options.forEach(
        (option) => {

            const optionButton =
                document.createElement(
                    "button"
                );


            optionButton.type =
                "button";


            optionButton.className =
                "quiz-option";


            optionButton.dataset.option =
                option.key;
            optionButton.setAttribute("aria-pressed", String(studentAnswers[question.id] === option.key));


            if (
                studentAnswers[
                    question.id
                ] === option.key
            ) {

                optionButton.classList.add(
                    "selected"
                );
                if (expeditionAnswerLocked && quizExpedition.lastCorrect === false) {
                    optionButton.classList.add('heart-loss-answer');
                }

            }


            if (answerLocked) {

                optionButton.classList.add(
                    "answer-locked"
                );

                optionButton.disabled =
                    true;

            }


            const optionLetter =
                document.createElement(
                    "span"
                );


            optionLetter.className =
                "quiz-option-letter";


            optionLetter.textContent =
                option.key;


            const optionText =
                document.createElement(
                    "span"
                );


            optionText.className =
                "quiz-option-text";


            optionText.textContent =
                option.text ||
                "";


            optionButton.appendChild(
                optionLetter
            );


            optionButton.appendChild(
                optionText
            );


            optionButton.addEventListener(
                "click",
                async () => {

                    if (
                        quizSubmitted ||
                        answerLocked
                    ) {

                        return;

                    }


                    const previousAnswer = studentAnswers[question.id];
                    const laterAnsweredCount = previousAnswer && previousAnswer !== option.key
                        ? questions.slice(currentQuestionIndex + 1).filter(item=>studentAnswers[item.id]).length : 0;
                    if(laterAnsweredCount&&!(await appConfirm('Change this answer? You will need to answer '+laterAnsweredCount+' later question'+(laterAnsweredCount===1?'':'s')+' again so the quiz can adapt. Keep your current answer by choosing Cancel.')))return;
                    studentAnswers[
                        question.id
                    ] =
                        option.key;

                    if (previousAnswer && previousAnswer !== option.key) {
                        let clearedLaterAnswers = false;
                        for (const laterQuestion of questions.slice(currentQuestionIndex + 1)) {
                            if (studentAnswers[laterQuestion.id]) {
                                delete studentAnswers[laterQuestion.id];
                                delete lockedAnswers[laterQuestion.id];
                                clearedLaterAnswers = true;
                            }
                            flaggedQuestions.delete(laterQuestion.id);
                        }
                        if (clearedLaterAnswers) {
                            const saveStatus = document.getElementById('quizSaveStatus');
                            if (saveStatus) {
                                saveStatus.hidden = false;
                                delete saveStatus.dataset.state;
                                saveStatus.textContent = 'Your answer changed, so later answers were cleared. The next questions will adapt to your updated response.';
                            }
                        }
                    }


                    displayQuestion();
                    quizOptions.querySelector('[data-option="' + option.key + '"]')?.focus({preventScroll:true});

                }
            );


            quizOptions.appendChild(
                optionButton
            );

        }
    );


    /* ==================================
       HISTORICAL CLUE
    ================================== */

    if (
        historicalClueCard &&
        historicalClueText
    ) {

        if (answerLocked && quizSubmitted) {

            const clue =
                String(
                    question.historicalClue ||
                    ""
                ).trim();


            historicalClueText.textContent =
                clue ||
                "You uncovered another clue from your historical journey.";


            historicalClueCard.hidden =
                false;

        } else {

            historicalClueCard.hidden =
                true;

            historicalClueText.textContent =
                "";

        }

    }


    /* ==================================
       PROGRESS
    ================================== */

    questionProgress.textContent =
        `Question ${questionPosition} of ${questions.length}`;
    const focusProgress = document.getElementById('quizFocusProgress');
    if (focusProgress) focusProgress.textContent = questionProgress.textContent;


    const answeredCount =
        Object.keys(
            studentAnswers
        ).length;


    answeredProgress.textContent =
        answeredCount === questions.length
            ? 'All checkpoints answered. Ready to review.'
            : `${answeredCount} of ${questions.length} answered`;


    const progress =
        (
            answeredCount /
            questions.length
        ) * 100;


    quizProgressFill.style.width =
        `${progress}%`;


    displayMissionCheckpoints();
    if (expeditionPanel) {
        expeditionPanel.hidden = !quizExpedition;
        document.getElementById('quizAnswerHelp').textContent = quizExpedition
            ? (expeditionAnswerLocked ? 'Your answer is locked in.' : 'Choose one answer, then lock it in.')
            : 'Choose one answer. You can change it before saving.';
        if (quizExpedition) {
            const removed = quizExpedition.lifeline;
            document.getElementById('quizHearts').textContent = quizExpedition.hearts + ' of 3 hearts';
            expeditionPanel.querySelectorAll('.quiz-heart-tokens span').forEach((token, index) => {
                const spent = index >= quizExpedition.hearts;
                token.classList.toggle('spent', spent);
                token.textContent = spent ? '♡' : '♥';
            });
            lifelineButton.disabled = Boolean(removed) || expeditionAnswerLocked;
            lifelineButton.querySelector('span').textContent = removed ? 'Bayani lifeline used' : 'Use Bayani lifeline';
            previousQuestionButton.hidden = true;
            if (flagButton) flagButton.hidden = true;
            missionCheckpoints.querySelectorAll('button').forEach(button => button.disabled = true);
            if (removed?.questionId === question.id) {
                const option = quizOptions.querySelector('[data-option="' + removed.option + '"]');
                if (option) {
                    option.disabled = true;
                    option.classList.add('quiz-option-eliminated');
                    const marker = document.createElement('span');
                    marker.className = 'bayani-eliminated-label';
                    marker.textContent = 'Ruled out by Bayani';
                    const copy = option.querySelector('.quiz-option-text');
                    const label = document.createElement('span');
                    label.className = 'bayani-eliminated-copy';
                    copy.replaceWith(label);
                    label.append(copy, marker);
                }
            }
        }
    }


    /* ==================================
       PREVIOUS BUTTON
    ================================== */

    previousQuestionButton.disabled =
        currentQuestionIndex === 0;


    /* ==================================
       ACTION BUTTON
    ================================== */

    const hasSelectedAnswer =
        Boolean(
            studentAnswers[
                question.id
            ]
        );


    const isLastQuestion =
        currentQuestionIndex ===
        questions.length - 1;


    nextQuestionButton.disabled = !hasSelectedAnswer || quizSubmitted;
    nextQuestionButton.textContent = quizExpedition
        ? (expeditionAnswerLocked ? (isLastQuestion ? 'See Results' : 'Next Question') : 'Lock In Answer')
        : isLastQuestion ? 'Review Answers' : 'Next Question';
}

/* ==========================================
   PREVIOUS QUESTION
========================================== */

previousQuestionButton.addEventListener(
    "click",
    () => {

        if (adaptiveFollowupStarted ||
            currentQuestionIndex <= 0 ||
            quizSubmitted
        ) {

            return;

        }


        currentQuestionIndex--;


        displayQuestion();
        questionText.tabIndex = -1;
        questionText.focus({preventScroll:true});

    }
);


/* ==========================================
   NEXT / SUBMIT
========================================== */

function advanceQuizQuestion() {
    currentQuestionIndex++;
    displayQuestion();
    questionText.tabIndex = -1;
    questionText.focus({preventScroll:true});
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.body.classList.contains('lakbay-reduce-motion');
    questionCard.scrollIntoView({behavior: reduceMotion ? 'instant' : 'smooth', block:'start'});
}

nextQuestionButton.addEventListener(
    "click",
    async () => {

        if (quizSubmitted || assessmentBusy || quizRecoveryCode) {

            return;

        }

        if (quizExpedition?.exhausted) {
            await submitQuiz(true);
            return;
        }

        if (adaptiveFollowupStarted) {
            if (adaptiveFollowupComplete) await submitQuiz(true);
            else (await handleAdaptiveFollowupAction());
            return;
        }


        const currentQuestion =
            questions[
                currentQuestionIndex
            ];

        if (!currentQuestion) return;

        const selectedAnswer =
            studentAnswers[
                currentQuestion.id
            ];


        /* ==================================
           REQUIRE AN ANSWER
        ================================== */

        if (assessmentBusy) return;
        if (!selectedAnswer) {

            (await appAlert(
                "Choose an answer before continuing."
            ));

            return;

        }


        /* ==================================
           LOCK ANSWER + DISCOVER CLUE
        ================================== */

        const isLastQuestion =
            currentQuestionIndex ===
            questions.length - 1;


        /* ==================================
           NEXT CHECKPOINT
        ================================== */

        if (quizExpedition && assessmentState(securedIdentity())?.answers?.[currentQuestion.id]) {
            if (isLastQuestion) {
                await submitQuiz(true);
            } else {
                clearQuizHeartLoss();
                advanceQuizQuestion();
            }
            return;
        }
        const heartsBeforeAnswer = quizExpedition?.hearts;
        if (securedQuiz) {
            const generation = quizSessionGeneration;
            const current = () => generation === quizSessionGeneration;
            assessmentBusy = true;
            quizOptions.inert = true;
            nextQuestionButton.disabled = true;
            const actionLabel = nextQuestionButton.textContent;
            updateAnswerSaveStatus('saving', 'Saving your answer…');
            const slowAnswer = window.setTimeout(() => {
                if (current()) updateAnswerSaveStatus('saving', 'Still saving your answer. Keep this quiz open.');
            }, 6000);
            let saved = false;
            try {
                await syncSecuredAnswer(currentQuestion, selectedAnswer);
                saved = true;
            } catch (error) {
                if (current() && !requireQuizRecovery(error)) {
                    updateAnswerSaveStatus('retry', (error.message || 'Your answer could not be saved.') + ' Your choice is still selected.');
                    nextQuestionButton.textContent = 'Retry Saving Answer';
                }
                return;
            } finally {
                window.clearTimeout(slowAnswer);
                if (current()) {
                    assessmentBusy = false;
                    quizOptions.inert = false;
                    nextQuestionButton.disabled = Boolean(quizRecoveryCode);
                    if (saved) {
                        updateAnswerSaveStatus('');
                        nextQuestionButton.textContent = actionLabel;
                    } else if (!quizRecoveryCode) {
                        nextQuestionButton.focus({preventScroll:true});
                    }
                }
            }
        }
        if (!quizExpedition) {
            document.dispatchEvent(new CustomEvent('lakbay:answer-lock'));
        }
        if (quizExpedition) {
            const feedback = document.getElementById('quizExpeditionFeedback');
            const lostHeart = quizExpedition.hearts < heartsBeforeAnswer;
            expeditionPanel.querySelectorAll('.quiz-heart-tokens > span').forEach((token, index) => {
                token.classList.toggle('heart-lost', lostHeart && index === quizExpedition.hearts);
            });
            feedback.textContent = '';
            delete feedback.dataset.outcome;
            if (lostHeart) {
                document.dispatchEvent(new CustomEvent(quizExpedition.exhausted ? 'lakbay:hearts-depleted' : 'lakbay:quiz-heart-lost'));
            } else if (quizExpedition.lastCorrect) {
                feedback.dataset.outcome = 'correct';
                feedback.textContent = isLastQuestion ? 'Correct. Checkpoint cleared.' : 'Previous answer correct.';
                animateAssessmentArrival(feedback);
                document.dispatchEvent(new CustomEvent('lakbay:answer-correct'));
            }
            if (quizExpedition.exhausted) {
                displayQuestion();
                await submitQuiz(true);
                return;
            }
            if (lostHeart || isLastQuestion) {
                displayQuestion();
                if (lostHeart) showQuizHeartLoss();
                else animateAssessmentArrival(quizOptions.querySelector('.answer-locked.selected'));
                nextQuestionButton.focus();
                if (lostHeart) quizHeartLossNotice.scrollIntoView({block:'nearest'});
                return;
            }
        }
        if (!isLastQuestion) {

            const hasAnsweredLaterQuestion = questions.slice(currentQuestionIndex + 1)
                .some(question => ['A', 'B', 'C', 'D'].includes(studentAnswers[question.id]));
            if (!securedQuiz && !hasAnsweredLaterQuestion) {
                const nextMissionQuestion = chooseNextMissionQuestion(currentQuestionIndex);
                if (nextMissionQuestion) placeNextMissionQuestion(currentQuestionIndex, nextMissionQuestion);
            }

            advanceQuizQuestion();
            return;

        }


        /* ==================================
           CHECK ALL CHECKPOINTS LOCKED
        ================================== */

        const allLocked = questions.every(question => ['A','B','C','D'].includes(studentAnswers[question.id]));
        if (!allLocked) {

            (await appAlert(
                "Answer every question before submitting."
            ));

            return;

        }


        /* ==================================
           SUBMIT MISSION QUIZ
        ================================== */

        await submitQuiz();

    }
);


/* ==========================================
   SUBMIT QUIZ
========================================== */

async function submitQuiz(flagsConfirmed=false, savedResult=null) {
    removeQuizResume();
    if(flagsConfirmed&&!savedResult&&!quizExpedition?.exhausted&&!questions.every(q=>['A','B','C','D'].includes(studentAnswers[q.id])))return;
    const generation = quizSessionGeneration;
    const submittingUid = currentUser?.uid;
    const isCurrent = () => generation === quizSessionGeneration && currentUser?.uid === submittingUid;

    if (
        quizSubmitted || quizRecoveryCode || (checkQuizSaveButton?.disabled && !checkQuizSaveButton.hidden) ||
        !currentUser ||
        !currentQuiz ||
        !currentMission
    ) {

        return;

    }


    if(!flagsConfirmed){
        const panel=document.getElementById('flagReviewPanel');
        if(panel){panel.replaceChildren();panel.hidden=false;const title=document.createElement('h3');title.textContent='Review your answers';panel.append(title);
        const answered=questions.filter(q=>['A','B','C','D'].includes(studentAnswers[q.id])).length;
        const marked=questions.filter(q=>flaggedQuestions.has(q.id)).length;
        const summary=document.createElement('p');summary.className='quiz-journal-summary';summary.textContent=answered+' of '+questions.length+' answered'+(marked?' · '+marked+' marked for review':'');panel.append(summary);
        questions.forEach((question,index)=>{
            const button=document.createElement('button');button.type='button';button.className='quiz-journal-question';
            const answer=studentAnswers[question.id];const valid=['A','B','C','D'].includes(answer);
            button.dataset.flagged=String(flaggedQuestions.has(question.id));button.dataset.answered=String(valid);
            const label=document.createElement('strong');label.textContent='Question '+(index+1)+(flaggedQuestions.has(question.id)?' · Marked for review':'');
            const prompt=document.createElement('span');prompt.textContent=question.question;
            const choice=document.createElement('span');choice.className='quiz-journal-choice';choice.textContent=valid?'Your choice: '+answer+' - '+(question['option'+answer]||''):'Not answered yet';
            const edit=document.createElement('span');edit.className='quiz-journal-edit';edit.textContent=valid?'Change answer':'Answer question';
            button.append(label,prompt,choice,edit);
            button.addEventListener('click',()=>{currentQuestionIndex=index;displayQuestion();questionText.tabIndex=-1;questionText.focus();});panel.append(button);
        });
        const saveNote=document.createElement('p');saveNote.className='quiz-submit-note';saveNote.textContent='Submit your answers to see your score.';panel.append(saveNote);
        animateAssessmentArrival(panel);
        const confirm=document.createElement('button');confirm.type='button';confirm.className='quiz-submit-final';confirm.textContent='Submit Quiz';confirm.disabled=answered!==questions.length;confirm.addEventListener('click',async ()=>{panel.hidden=true;await submitQuiz(true);});panel.append(confirm);title.tabIndex=-1;title.focus();return;}
    }
    quizSubmitted =
        true;
    if (checkQuizSaveButton) checkQuizSaveButton.hidden = true;
    quizContent.classList.add('quiz-result-handoff');
    if (quizExpedition?.exhausted) {
        quizOptions.inert = true;
        if (lifelineButton) lifelineButton.disabled = true;
        if (!savedResult) {
            updateQuizDefeat('Saving your quiz result…');
            if (!quizHeartsDepleted.open) quizHeartsDepleted.showModal();
        }
    }

    nextQuestionButton.removeAttribute('aria-describedby');
    const saveStatus = document.getElementById('quizSaveStatus');
    if (saveStatus) {
        saveStatus.hidden = false;
        saveStatus.dataset.state = 'saving';
        saveStatus.textContent = 'Saving your answers… Keep this page open until saving finishes.';
    }


    nextQuestionButton.disabled =
        true;

    previousQuestionButton.disabled =
        true;

    saveStatus?.focus();
    const slowSaveNotice = window.setTimeout(() => {
        if (isCurrent() && saveStatus?.dataset.state === 'saving') {
            saveStatus.textContent = 'Still saving your answers. Keep this page open and wait for confirmation.';
            if (quizHeartsDepleted.open) updateQuizDefeat('Still saving. Keep this page open.');
        }
    }, 6000);

    try {

        if (!currentAttemptId) {
            currentAttemptId = crypto.randomUUID();
        }

        /* ==================================
           CALCULATE SCORE
        ================================== */
const completionResult = savedResult || await submitStudentActivity({
    kind: "mission",
    chapterId,
    missionId,
    quizId: currentQuiz.id,
    attemptId: currentAttemptId,
    answers: studentAnswers,
    questionIds: questions.map(question => question.id),
    ...(adaptiveQuestionIds.length ? {adaptiveFollowup:{questionIds:adaptiveQuestionIds,answers:adaptiveAnswers}} : {})
});


if (!isCurrent()) return;
quizContent.classList.remove('quiz-result-handoff');
quizDraftReady = false;
if (saveStatus) {
    saveStatus.dataset.state = completionResult.preview ? 'preview' : 'saved';
    saveStatus.textContent = completionResult.preview ? 'Preview result only. No score, completion or reward was saved.' : 'Your quiz result is saved.';
}
restartQuizButton.hidden = true;
// The official receipt is already committed. Draft cleanup must not delay it.
void quizDraft?.clear().catch(() => {});
if (!isCurrent()) return;
console.log(
    "Mission Quiz full completion result:",
    completionResult
);

if (completionResult.reviewQuestions) questions = completionResult.reviewQuestions;
lastQuizTopics = completionResult.topicsForReview || [];
lastAdaptiveFollowup = completionResult.adaptiveFollowup
    ? {...completionResult.adaptiveFollowup, preview:completionResult.preview === true}
    : null;
lastArtifactResult = completionResult.artifactResult || null;
if(!securedQuiz)studentTabStorage.removeItem('missionQuiz:' + currentUser.uid + ':' + currentQuiz.id);
studentTabStorage.removeItem('missionQuizSet:' + currentUser.uid + ':' + currentAttemptId);
const correctAnswers = completionResult.correctAnswers;
const percentage = completionResult.score;
const passed = completionResult.passed === true;
const receipt = {
    preview: completionResult.preview === true,
    totalQuestions: completionResult.totalQuestions,
    classroom: securedQuiz ? assessmentState(securedIdentity())?.classroom : null,
    isCurrent
};

lastQuizPassed = passed;


        /* ==================================
           PASSED
        ================================== */

        if (passed) {



            lastCompletionResult =
                completionResult;


            lastMissionReward =
                Number(
                    completionResult
                        ?.xpReward
                ) || 0;


            /*
             * Artifact awarding remains
             * separate from mission XP.
             *
             * This preserves the existing
             * artifact backfill behavior.
             */

            const artifactResult =
                await awardMissionArtifact();
            if (!isCurrent()) return;


            lastArtifactResult =
                artifactResult;


            showResult(
                percentage,
                correctAnswers,
                true,
                !savedResult,
                receipt
            );


            return;

        }


        /* ==================================
           FAILED
        ================================== */

        lastCompletionResult =
            null;

	console.log(
    "Mission Quiz topics for review:",
    completionResult.topicsForReview || []
);

        lastMissionReward =
            0;

        lastArtifactResult =
            null;


        showResult(
            percentage,
            correctAnswers,
            false,
            !savedResult,
            receipt
        );


    } catch (error) {

        if (!isCurrent()) return;
        quizContent.classList.remove('quiz-result-handoff');
        console.error(
            "Unable to submit quiz:",
            error
        );


        quizSubmitted =
            false;

        if (requireQuizRecovery(error)) {
            if (saveStatus) saveStatus.hidden = true;
            if (quizHeartsDepleted.open) updateQuizDefeat(error.message, 'View recovery options');
            return;
        }

        nextQuestionButton.disabled =
            false;

        if (adaptiveFollowupComplete || quizExpedition) nextQuestionButton.textContent = 'Retry Save';

        previousQuestionButton.disabled =
            currentQuestionIndex === 0;


        if (saveStatus) {
            saveStatus.dataset.state = 'retry';
            saveStatus.textContent = securedQuiz
                ? 'We could not confirm that your result was saved. Your answers are still on this page. Use Check Saved Result after reconnecting, or submit again.'
                : 'We could not confirm that your result was saved. Your answers are still on this page. Keep it open, check your connection, and try again.';
            nextQuestionButton.setAttribute('aria-describedby', saveStatus.id);
        }
        if (checkQuizSaveButton) checkQuizSaveButton.hidden = !securedQuiz;
        if (quizHeartsDepleted.open) {
            updateQuizDefeat('We could not confirm the save. Check your connection and try again.', 'View save options');
        }
        const recoveryAction = securedQuiz && checkQuizSaveButton ? checkQuizSaveButton : nextQuestionButton;
        recoveryAction.focus();

    } finally {
        window.clearTimeout(slowSaveNotice);
    }

}


/* ==========================================
   COMPLETE MISSION
========================================== */

async function completeMission() {
    const result = await submitStudentActivity({
        kind: "mission", chapterId, missionId, quizId: currentQuiz.id,
        answers: studentAnswers
    });
    if (!result.passed) throw new Error("A passing score could not be confirmed.");
    lastArtifactResult = result.artifactResult;
    return result;
}

async function awardMissionArtifact() {
    return lastArtifactResult || { artifact: null, newlyEarned: false };
}
/* ==========================================
   DISPLAY ANSWER REVIEW
========================================== */

function displayAnswerReview({playCorrectCue=false}={}) {

    if (
        !quizAnswerReview ||
        !quizAnswerReviewList
    ) {

        return;

    }


    quizAnswerReviewList.innerHTML =
        "";


    let correctCuePlayed=false;
    let missedCount=0;
    let firstCorrectReviewItem=null;
    const savedCopy = value => typeof value === 'string' ? value.trim() : '';
    questions.forEach(
        (question, index) => {

            const studentAnswerKey =
                studentAnswers[
                    question.id
                ] || "";


            const correctAnswerKey =
                String(
                    question.correctAnswer ||
                    ""
                ).trim();


            const isCorrect =
                studentAnswerKey ===
                correctAnswerKey;

            if(isCorrect&&playCorrectCue&&!correctCuePlayed){
                correctCuePlayed=true;
                document.dispatchEvent(new CustomEvent("lakbay:answer-correct"));
            }


            const studentAnswerText =
                getOptionText(
                    question,
                    studentAnswerKey
                );


            const correctAnswerText =
                getOptionText(
                    question,
                    correctAnswerKey
                );


            const generalExplanation = savedCopy(question.explanation);
            const selectedExplanation = savedCopy(question.answerExplanations?.[studentAnswerKey]);
            const learningPoint = savedCopy(question.learningPoint);
            const selectedCopy = selectedExplanation.replace(/^Review the lesson clues\.\s*/i, '');
            const correctExplanation = savedCopy(question.answerExplanations?.[correctAnswerKey]);
            const choiceFeedback = !isCorrect && selectedCopy && ![generalExplanation, learningPoint, correctExplanation].includes(selectedCopy);
            const explanation = choiceFeedback || (isCorrect && selectedCopy)
                ? selectedCopy : generalExplanation || learningPoint || selectedCopy;


            const reviewItem =
                document.createElement(
                    "article"
                );


            reviewItem.className =
                isCorrect
                    ? "quiz-review-item correct"
                    : "quiz-review-item incorrect";


            /* ==================================
               STATUS
            ================================== */

            const status =
                document.createElement(
                    "div"
                );


            status.className =
                "quiz-review-status";


            const statusIcon =
                document.createElement(
                    "span"
                );


            statusIcon.className =
                "quiz-review-status-icon";


            statusIcon.textContent =
                isCorrect
                    ? "\u2713"
                    : "\u2715";


            const statusText =
                document.createElement(
                    "strong"
                );


            statusText.textContent =
                isCorrect
                    ? "Correct"
                    : "Needs Review";


            status.appendChild(
                statusIcon
            );


            status.appendChild(
                statusText
            );


            /* ==================================
               QUESTION NUMBER
            ================================== */

            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "quiz-review-number";


            number.textContent =
                `Question ${index + 1}`;


            /* ==================================
               QUESTION
            ================================== */

            const questionElement =
                document.createElement(
                    "h4"
                );


            questionElement.textContent =
                question.question ||
                `Question ${index + 1}`;


            /* ==================================
               ANSWERS
            ================================== */

            const answers =
                document.createElement(
                    "div"
                );


            answers.className =
                "quiz-review-answers";


            const studentAnswerRow =
                createReviewAnswerRow(
                    "Your answer",
                    studentAnswerText ||
                    "No answer",
                    isCorrect
                        ? "correct"
                        : "incorrect"
                );


            answers.appendChild(
                studentAnswerRow
            );


            if (!isCorrect) {

                const correctAnswerRow =
                    createReviewAnswerRow(
                        "Correct answer",
                        correctAnswerText ||
                        correctAnswerKey,
                        "correct"
                    );


                answers.appendChild(
                    correctAnswerRow
                );

            }


            /* ==================================
               EXPLANATION
            ================================== */

            const explanationBox =
                document.createElement(
                    "div"
                );


            explanationBox.className =
                "quiz-review-explanation";


            const explanationLabel =
                document.createElement(
                    "strong"
                );


            explanationLabel.textContent = choiceFeedback ? 'About your choice' : 'Key idea';


            const explanationText =
                document.createElement(
                    "p"
                );


            explanationText.textContent =
                explanation ||
                (
                    isCorrect
                        ? "You chose the correct answer."
                        : "Revisit the lesson to see the evidence for the correct answer."
                );


            explanationBox.appendChild(
                explanationLabel
            );


            explanationBox.appendChild(
                explanationText
            );


            if (learningPoint && learningPoint !== explanation) {
                const point = document.createElement("p");
                point.textContent = "Key idea: " + learningPoint;
                explanationBox.appendChild(point);
            }
            if (!isCorrect) {
                const reviewTopic = savedCopy(question.topic);
                const params = new URLSearchParams({chapter: chapterId, mission: missionId});
                if (reviewTopic) params.set('reviewTopic', reviewTopic);
                const lesson = document.createElement("a");
                lesson.className = "text-button quiz-review-lesson-link";
                lesson.textContent = reviewTopic ? 'Review this lesson topic' : 'Revisit the lesson';
                lesson.href = learningNavigation.carry('story.html?' + params);
                explanationBox.appendChild(lesson);
            }

            /* ==================================
               BUILD ITEM
            ================================== */

            reviewItem.appendChild(
                number
            );


            reviewItem.appendChild(
                status
            );


            reviewItem.appendChild(
                questionElement
            );


            if (isCorrect) {
                reviewItem.append(answers, explanationBox);
            } else {
                const comparison = document.createElement('details');
                comparison.className = 'quiz-missed-comparison';
                comparison.open = missedCount === 0;
                missedCount += 1;
                const summary = document.createElement('summary');
                summary.textContent = 'Compare answers';
                const content = document.createElement('div');
                content.className = 'quiz-missed-comparison-content';
                content.append(answers, explanationBox);
                comparison.append(summary, content);
                reviewItem.append(comparison);
            }


            if (isCorrect) {
                firstCorrectReviewItem ??= reviewItem;
                quizAnswerReviewList.append(reviewItem);
            } else quizAnswerReviewList.insertBefore(reviewItem, firstCorrectReviewItem);

        }
    );


    const reviewSummary = quizAnswerReview.querySelector('summary');
    if (reviewSummary) reviewSummary.textContent = missedCount
        ? `Review quiz answers (${missedCount} to revisit)`
        : 'Review quiz answers';
    quizAnswerReview.hidden =
        false;

}


/* ==========================================
   CREATE REVIEW ANSWER ROW
========================================== */

function createReviewAnswerRow(
    label,
    answer,
    state
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        `quiz-review-answer ${state}`;


    const labelElement =
        document.createElement(
            "span"
        );


    labelElement.textContent =
        label;


    const answerElement =
        document.createElement(
            "strong"
        );


    answerElement.textContent =
        answer;


    row.appendChild(
        labelElement
    );


    row.appendChild(
        answerElement
    );


    return row;

}


/* ==========================================
   GET OPTION TEXT
========================================== */

function getOptionText(
    question,
    optionKey
) {

    const key =
        String(
            optionKey ||
            ""
        )
            .trim()
            .toUpperCase();


    const optionMap = {

        A:
            question.optionA,

        B:
            question.optionB,

        C:
            question.optionC,

        D:
            question.optionD

    };


    return String(
        optionMap[key] ||
        ""
    ).trim();

}
/* ==========================================
   SHOW RESULT
========================================== */

async function renderMissionLearningSummary(correctAnswers){
 document.getElementById('missionLearningSummary')?.remove();
 const panel=document.createElement('section');panel.id='missionLearningSummary';panel.className='mission-learning-summary';panel.setAttribute('aria-labelledby','missionLearningSummaryTitle');
 const heading=document.createElement('h3');heading.id='missionLearningSummaryTitle';heading.textContent='Your next step';panel.append(heading);
 const pending=copy(panel,'Checking your saved chapter progress...');
 const notes=document.createElement('details');notes.className='quiz-result-notes';
 const summary=document.createElement('summary');summary.textContent='Mission field notes';notes.append(summary);panel.append(notes);
 function block(title){const part=document.createElement('div');part.className='learning-summary-block';const h=document.createElement('h4');h.textContent=title;part.append(h);notes.append(part);return part;}
 function copy(host,value){const p=document.createElement('p');p.textContent=value;host.append(p);return p;}
 const objectives=(Array.isArray(currentMission.learningObjectives)?currentMission.learningObjectives:[currentMission.learningObjective]).filter(v=>typeof v==='string'&&v.trim());
 if(objectives.length){const part=block('What this mission taught');const list=document.createElement('ul');for(const objective of objectives){const item=document.createElement('li');item.textContent=objective;list.append(item);}part.append(list);}
 const demonstrated=block('What your quiz shows');copy(demonstrated,correctAnswers+' of '+questions.length+' questions answered correctly. You met this mission passing requirement. This result does not prove every topic is fully understood.');
 const discovery=questions.find(question=>question.topic&&question.explanation?.trim()&&
     studentAnswers[question.id]&&studentAnswers[question.id]===question.correctAnswer);
 if(discovery){
  const evidence=block('One idea you got right');
  copy(evidence,discovery.explanation);
  const lesson=document.createElement('a');lesson.textContent='Revisit this idea in the lesson';lesson.href=learningNavigation.carry('story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,reviewTopic:discovery.topic}));evidence.append(lesson);
 }
 const review=block('What you can revisit');if(lastQuizTopics.length){for(const topic of lastQuizTopics){const link=document.createElement('a');link.textContent=quizReviewTopicLabel(topic);link.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,reviewTopic:topic});review.append(link);}copy(review,'These recommendations come from this quiz. Saved practice can provide more evidence as you learn.');}else copy(review,'No missed topics were identified in this quiz. You can revisit the lesson whenever you want.');
 const artifact=lastArtifactResult?.artifact;if(artifact){const collection=block(lastArtifactResult.newlyEarned?'What you collected':'Your mission collectible');copy(collection,artifactDisplayName(artifact));if(typeof artifact.learningDetails?.lessonConnection==='string')copy(collection,artifact.learningDetails.lessonConnection);else if(typeof artifact.description==='string')copy(collection,artifact.description);const link=document.createElement('a');link.href=artifactExhibitHref(artifact.id);link.textContent=artifact.id?'View exhibit':'Open My Collections';collection.append(link);}
 quizAnswerReview.before(panel);
 if (learningNavigation.classroomReturn) {
    pending.textContent = 'Open My Class to return to this assignment.';
    return;
 }
 function setNextAction(href, label) {
    resultNextHref = href;
    continueResultButton.textContent = label;
 }
 const uid=currentUser?.uid,generation=quizSessionGeneration,scopeMission=missionId;const current=()=>auth.currentUser?.uid===uid&&quizSessionGeneration===generation&&document.getElementById('missionLearningSummary')===panel&&!quizResult.hidden;
 try{const [missionSnapshot,progressSnapshot,challengeSnapshot]=await Promise.all([getDocs(query(collection(db,'missions'),where('chapterId','==',chapterId))),getDocs(query(collection(db,'studentProgress'),where('userId','==',uid))),getDocs(query(collection(db,'chapterChallenges'),where('chapterId','==',chapterId)))]);if(!current())return;
 const rows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id})),missions=rows(missionSnapshot).filter(m=>m.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
 const completed=new Set(rows(progressSnapshot).filter(p=>p.userId===uid&&p.chapterId===chapterId&&p.completed===true).map(p=>p.missionId));
 if(!completed.has(scopeMission)){
  pending.textContent='Your result is saved. Open My Journey to check what you can do next.';
  setNextAction('my-journey.html','Open My Journey');
  return;
 }
 const nextMission=missions.find((mission,index)=>!completed.has(mission.id)&&missions.slice(0,index).every(prior=>completed.has(prior.id)));
 if(nextMission){pending.textContent='Available next: '+(nextMission.title||'Next mission')+'.';setNextAction('story.html?'+new URLSearchParams({chapter:chapterId,mission:nextMission.id}),'Open Next Lesson');}
 else if(missions.length&&missions.every(m=>completed.has(m.id))&&rows(challengeSnapshot).some(c=>c.status==='active')){
  const chapterProgress=await getDocs(query(collection(db,'studentChapterProgress'),where('userId','==',uid),where('chapterId','==',chapterId)));
  if(!current())return;
  const chapterComplete=rows(chapterProgress).some(row=>row.userId===uid&&row.chapterId===chapterId&&row.completed===true);
  if(chapterComplete){
   pending.textContent='You’ve already completed this chapter. My Journey shows where you can go next.';
   setNextAction('my-journey.html','Open My Journey');
  }else{
   pending.textContent='All missions in this chapter are complete. The chapter challenge is available.';
   setNextAction('chapter-challenge.html?'+new URLSearchParams({chapter:chapterId}),'Open Chapter Challenge');
  }
 }
 else{pending.textContent='Your mission is complete. My Journey shows your available learning steps.';setNextAction('my-journey.html','Open My Journey');}
 }catch{if(current()){pending.textContent='Your mission result is saved. Check My Journey for your next activity.';setNextAction('my-journey.html','Open My Journey');}}
}

async function showPreviousQuizScore(summary, score) {
    const uid = currentUser?.uid;
    if (!uid || !securedQuiz || globalThis.__lakbayExplorationPreview === true) return;
    const generation = quizSessionGeneration;
    const attemptId = currentAttemptId;
    const quizId = currentQuiz.id;
    try {
        const snapshot = await getDocs(query(collection(db, 'studentQuizAttempts'),
            where('userId', '==', uid), where('quizId', '==', quizId)));
        if (generation !== quizSessionGeneration || currentUser?.uid !== uid ||
            attemptId !== currentAttemptId || !summary.isConnected) return;
        const attempts = snapshot.docs.map(row => row.data()).filter(row =>
            row.userId === uid && row.quizId === quizId && row.chapterId === chapterId && row.missionId === missionId);
        const current = attempts.find(row => row.attemptId === attemptId);
        const timestamp = current?.completedAt?.toMillis?.();
        if (!Number.isFinite(timestamp)) return;
        const scope = row => row.classroom
            ? JSON.stringify([row.classroom.classId, row.classroom.assignmentId, row.classroom.version])
            : null;
        const previous = attempts.filter(row => row.totalQuestions === current.totalQuestions &&
            scope(row) === scope(current) && Number.isFinite(row.score) && row.score >= 0 && row.score <= 100 &&
            row.completedAt?.toMillis?.() < timestamp)
            .sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis())[0];
        if (!previous) return;
        const comparison = document.createElement('p');
        comparison.className = 'quiz-previous-score';
        comparison.textContent = 'Previous attempt: ' + previous.score + '% · This attempt: ' + score + '%';
        summary.append(comparison);
    } catch {
        // The current result is usable even when previous attempts cannot be read.
    }
}

function quizReviewTopicLabel(topic) {
    const question = questions.find(row => row.topic === topic && typeof row.topicLabel === 'string' && row.topicLabel.trim()) ||
        adaptiveQuestionPool.find(row => row.topic === topic && typeof row.topicLabel === 'string' && row.topicLabel.trim());
    if (question) return question.topicLabel.trim();
    const label = String(topic || '').replace(/[-_]+/g, ' ').trim();
    return label ? label.charAt(0).toLocaleUpperCase() + label.slice(1) : 'Lesson topic';
}

function renderQuizResultDestination(receipt) {
    const destination = document.getElementById('quizResultDestination');
    if (!destination) return;
    destination.replaceChildren();
    destination.hidden = !receipt || receipt.preview || globalThis.__lakbayExplorationPreview === true;
    if (destination.hidden) return;

    const classroom = receipt.classroom;
    const context = classroomLearningContext(window.location.search);
    if (!context || classroom?.classId !== context.classroom || classroom.assignmentId !== context.activity || !learningNavigation.classroomReturn) {
        destination.textContent = learningNavigation.classroomReturn
            ? 'Saved to your learning progress. The classroom destination could not be confirmed.'
            : 'Saved to your learning progress in My Journey.';
        return;
    }
    const classLink = document.createElement('a');
    classLink.href = learningNavigation.classroomReturn;
    classLink.textContent = 'My Class';
    destination.append('Class submission saved to ', classLink, '. Your teacher can see this result.');
    void getDoc(doc(db, 'classes', classroom.classId)).then(snapshot => {
        if (!receipt.isCurrent() || quizResult.hidden || !destination.contains(classLink)) return;
        const name = snapshot.data()?.name;
        if (typeof name === 'string' && name.trim()) classLink.textContent = name;
    }).catch(() => {});
}

function showResult(
    percentage,
    correctAnswers,
    passed,
    freshResult,
    receipt = null
) {
    if (document.fullscreenElement === document.documentElement) {
        void document.exitFullscreen().catch(() => {});
    }

    questionCard.hidden =
        true;


    quizResult.hidden =
        false;
    const saveStatus = document.getElementById('quizSaveStatus');
    if (saveStatus && !saveStatus.hidden) quizResultMessage.after(saveStatus);
    renderQuizResultDestination(receipt);
    quizResult.toggleAttribute('data-fresh-result', freshResult && globalThis.__lakbayExplorationPreview !== true);
    quizResultTitle.tabIndex = -1;
    queueMicrotask(() => {
        if (quizResult.hidden || !currentUser) return;
        quizResult.scrollIntoView({block:'start', behavior:'instant'});
        if (quizHeartsDepleted.open) {
            updateQuizDefeat('Result saved. You can review your answers or retry with three hearts.', 'View quiz result');
        } else {
            quizResultTitle.focus({preventScroll:true});
        }
    });


    quizScore.textContent =
        `${percentage}%`;
    const highlights = document.getElementById('quizResultHighlights');
    if (highlights) {
        const status = document.createElement('strong');
        const preview = globalThis.__lakbayExplorationPreview === true;
        status.textContent = preview ? 'Preview' : passed ? 'Passed' : 'Try again';
        highlights.replaceChildren(status);
        if (!preview && passed && lastMissionReward > 0) {
            const earned = document.createElement('span');
            earned.textContent = '+' + lastMissionReward + ' XP earned';
            highlights.append(earned);
        }
        highlights.hidden = false;
    }


    /* ======================================
       LEARNING REVIEW
    ====================================== */

    document.getElementById('missionLearningSummary')?.remove();
    resultNextHref = null;
    quizResult.dataset.outcome=passed?'passed':'retry';
    if(quizAnswerReview)quizAnswerReview.open=false;
    document.getElementById('expeditionResultSummary')?.remove();
    const expeditionSummary=document.createElement('div');expeditionSummary.id='expeditionResultSummary';expeditionSummary.className='expedition-result-summary';
    const totalQuestions = receipt?.totalQuestions ?? questions.length;
    const passingGoal=minimumMissionCorrect(totalQuestions,requirePassingScore(currentQuiz));
    const goalLabel=document.getElementById('quizResultPassingGoal');
    if (goalLabel) {
        goalLabel.textContent = quizExpedition?.exhausted
            ? correctAnswers + ' of ' + totalQuestions + ' correct · ' + questions.length + ' answered'
            : correctAnswers + ' of ' + totalQuestions + ' correct · Passing goal: ' + passingGoal + ' correct';
    }
    if (quizExpedition) {
        const trail = document.createElement('p');
        trail.className = 'quiz-result-trail';
        trail.textContent = quizExpedition.exhausted
            ? 'All three hearts lost. This attempt ended.'
            : 'Hearts remaining: ' + quizExpedition.hearts + ' of 3.';
        expeditionSummary.append(trail);
    }
    if(lastAdaptiveFollowup){const adaptiveSummary=document.createElement('p');adaptiveSummary.className='adaptive-result-summary';adaptiveSummary.textContent='Extra practice: '+lastAdaptiveFollowup.correctAnswers+' of '+lastAdaptiveFollowup.totalQuestions+' correct. This does not change your mission score. '+(lastAdaptiveFollowup.preview?'This preview was not saved.':'Check the topics below to see what you can review.');expeditionSummary.append(adaptiveSummary);}
    const debrief = quizResultMessage.closest('.quiz-debrief-header');
    void showPreviousQuizScore(expeditionSummary, percentage);
    const hasPassRewardCue=passed&&globalThis.__lakbayExplorationPreview!==true&&(
        lastCompletionResult?.firstCompletion===true||lastArtifactResult?.newlyEarned===true
    );
    displayAnswerReview({
        playCorrectCue:freshResult&&passed&&!quizExpedition&&globalThis.__lakbayExplorationPreview!==true&&!hasPassRewardCue
    });
    const reinforcement = document.getElementById("quizReinforcementSummary");
    if (reinforcement) reinforcement.textContent = lastQuizTopics.length ? "Topics to revisit" : "";
    const reinforceLink = document.getElementById("reinforcePassedTopicsLink");
    if (reinforceLink) {
        const topic = lastQuizTopics[0];
        reinforceLink.hidden = !passed || !topic;
        if (!reinforceLink.hidden) {
            reinforceLink.href = learningNavigation.carry('practice.html?' + new URLSearchParams({
                chapter: chapterId, mission: missionId, topic, review: '1'
            }));
            reinforceLink.textContent = 'Practise ' + quizReviewTopicLabel(topic);
        } else {
            reinforceLink.removeAttribute('href');
        }
    }
    const topicBox = document.getElementById("quizWeakTopics");
    if (topicBox) {
        topicBox.replaceChildren();
        let otherTopics;
        if(!passed&&lastQuizTopics.length>1){otherTopics=document.createElement('details');otherTopics.className='quiz-other-review-topics';const summary=document.createElement('summary');summary.textContent='Other topics to revisit ('+(lastQuizTopics.length-1)+')';otherTopics.append(summary);}
        for (const [topicIndex,topic] of lastQuizTopics.entries()) {
            const item=document.createElement('article');item.className='result-topic-route';const name=document.createElement('strong');name.textContent=quizReviewTopicLabel(topic);const note=document.createElement('p');note.textContent=!passed&&topicIndex===0?'Start here. Review this lesson topic, practise it, then try the mission quiz again.':'Read this topic again, then try a few practice questions. Return to the mission quiz when you feel ready.';const link=document.createElement('a');link.textContent='1. Review the lesson';link.setAttribute('aria-label','Review the lesson: '+name.textContent);link.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,reviewTopic:topic});const practice=document.createElement('a');practice.textContent='2. Try practice';practice.setAttribute('aria-label','Try practice: '+name.textContent);practice.href='practice.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,topic,review:'1'});item.append(name,note,link,practice);(!passed&&topicIndex>0&&otherTopics?otherTopics:topicBox).append(item);
        }
        if(otherTopics)topicBox.append(otherTopics);
    }
    retryQuizButton.textContent=passed?'Replay Quiz':'Retry Quiz';
    retryQuizButton.title=passed?'Replay this mission quiz.':'Optional shortcut. Reviewing the lesson and practising first is recommended.';
    const generalReviewLink=document.getElementById('reviewLessonLink');if(generalReviewLink)generalReviewLink.hidden=!passed;
    const resultActions=continueResultButton.closest('.quiz-result-actions');
    const endedWithNoHearts = quizExpedition?.exhausted === true;
    retryQuizButton.classList.toggle('begin-mission-button', endedWithNoHearts);
    retryQuizButton.classList.toggle('quiz-secondary-button', !endedWithNoHearts);
    continueResultButton.classList.toggle('begin-mission-button', !endedWithNoHearts);
    continueResultButton.classList.toggle('quiz-secondary-button', endedWithNoHearts);
    resultActions?.prepend(endedWithNoHearts ? retryQuizButton : continueResultButton);
    if (resultActions) debrief.after(resultActions, expeditionSummary);
    if (reinforcement && topicBox && resultActions) {
        const reviewAnchor = passed && quizAnswerReview ? quizAnswerReview : expeditionSummary;
        reviewAnchor.after(reinforcement, topicBox);
    }


    /* ======================================
       PASSED
    ====================================== */

    const preview = globalThis.__lakbayExplorationPreview === true;
    quizResultIcon.classList.toggle('interface-icon--trophy', passed && !preview);
    quizResultIcon.classList.toggle('interface-icon--compass', !passed || preview);
    if (preview) {
        if(quizResultEyebrow)quizResultEyebrow.textContent='TESTING PREVIEW';
        quizResultTitle.textContent=passed?'Preview: passing score':'Preview: try again';
        quizResultMessage.textContent=correctAnswers+' of '+questions.length+' correct. This test result does not complete the mission or award XP and artifacts.';
        missionRewardCard.hidden=true;
        if(reinforcement)reinforcement.textContent='Use the explanations below to test the learning flow. Your saved student progress is unchanged.';
        retryQuizButton.hidden=false;
        continueResultButton.textContent=passed?(learningNavigation.classroomReturn?'Back to class activity':'Back to Missions'):'Review This Topic';
        return;
    }
    if (passed) {



if (quizResultEyebrow) {

    quizResultEyebrow.textContent =
        "MISSION QUIZ COMPLETE";

}


quizResultTitle.textContent =
    "Mission Passed!";


        const firstCompletion =
            lastCompletionResult
                ?.firstCompletion === true;


        const artifactNewlyEarned =
            lastArtifactResult
                ?.newlyEarned === true;


        const earnedArtifact =
            lastArtifactResult
                ?.artifact || null;

        if (freshResult && firstCompletion) {
            document.dispatchEvent(new CustomEvent("lakbay:mission-completed"));
        }
        if (freshResult && artifactNewlyEarned && earnedArtifact) {
            document.dispatchEvent(new CustomEvent("lakbay:artifact-found", {
                detail: { delayMs: firstCompletion ? 420 : 0 }
            }));
        }


        /* ==================================
           FIRST COMPLETION
        ================================== */

        if (firstCompletion) {

           quizResultMessage.textContent =
    "You passed the quiz and completed this mission.";

        }


        /* ==================================
           PREVIOUS COMPLETION +
           NEW ARTIFACT BACKFILL
        ================================== */

        else if (
            artifactNewlyEarned &&
            earnedArtifact
        ) {
quizResultMessage.textContent =
    "You passed again and collected the missing artifact. The mission XP was already awarded.";

        }


        /* ==================================
           FULL REPLAY
        ================================== */

        else {

           quizResultMessage.textContent =
    "You passed again. Your mission rewards were already collected.";

        }


        displayMissionRewards();
        renderMissionLearningSummary(correctAnswers);


        retryQuizButton.hidden =
            true;


        continueResultButton.textContent =
            learningNavigation.classroomReturn ? "Back to Class Activity" : "Back to Mission Journey";


        return;

    }


    /* ======================================
       FAILED
    ====================================== */

    if (missionRewardCard) {

        missionRewardCard.hidden =
            true;

    }


    if (missionXpReward) {

        missionXpReward.hidden =
            true;

    }


    if (artifactReward) {

        artifactReward.hidden =
            true;

    }


    if (missionRewardProgress) {

        missionRewardProgress.hidden =
            true;

    }




if (quizResultEyebrow) {

    quizResultEyebrow.textContent =
        "MISSION QUIZ RESULT";

}


quizResultTitle.textContent =
    quizExpedition?.exhausted ? "You failed" : "Quiz not passed yet";


   quizResultMessage.textContent =
    quizExpedition?.exhausted
        ? "You lost all three hearts. Review your answers or start a new attempt."
        : lastQuizTopics.length
        ? "Review the suggested topic, then practise before retrying."
        : "Revisit the lesson, then try the quiz again.";


    /*
     * Keep the existing retry option available.
     * The main learning path still directs the
     * student to the relevant lesson before practice.
     */

    retryQuizButton.hidden =
        false;


    continueResultButton.textContent =
        "Review the Lesson \u2192";
    if (lastQuizTopics.length) continueResultButton.textContent = 'Review '+quizReviewTopicLabel(lastQuizTopics[0])+' →';

    if (freshResult && !quizExpedition?.exhausted) document.dispatchEvent(new CustomEvent("lakbay:needs-practice"));

}


/* ==========================================
   DISPLAY MISSION REWARDS
========================================== */

function displayMissionRewards() {
    missionRewardCard?.classList.remove('new-expedition-reward');

    if (!missionRewardCard) {

        return;

    }


    const xpReward =
        Number(
            lastMissionReward
        ) || 0;


    const artifact =
        lastArtifactResult
            ?.artifact || null;


    const artifactNewlyEarned =
        lastArtifactResult
            ?.newlyEarned === true;


    const hasXpReward =
        xpReward > 0;


    const hasArtifactReward =
        artifactNewlyEarned &&
        Boolean(artifact);


    /*
     * On a normal replay there is no new
     * XP and no new artifact, so do not
     * show a misleading reward card.
     */

    if (
        !hasXpReward &&
        !hasArtifactReward
    ) {

        missionRewardCard.hidden =
            true;


        if (missionXpReward) {

            missionXpReward.hidden =
                true;

        }


        if (artifactReward) {

            artifactReward.hidden =
                true;

        }


        if (missionRewardProgress) {

            missionRewardProgress.hidden =
                true;

        }


        return;

    }


    missionRewardCard.hidden = false;
    missionRewardCard.classList.add('new-expedition-reward');
    document.getElementById('quizAnswerReview')?.before(missionRewardCard);


    /* ======================================
       XP REWARD
    ====================================== */

    if (missionXpReward) {

        if (hasXpReward) {

            missionXpReward.textContent =
                `\u2B50 +${xpReward} XP`;


            missionXpReward.hidden =
                false;

        } else {

            missionXpReward.hidden =
                true;

        }

    }


    /* ======================================
       ARTIFACT REWARD
    ====================================== */

    if (artifactReward) {

        if (
            hasArtifactReward &&
            artifact
        ) {
            const museumLink = document.getElementById('artifactMuseumLink');
            if (museumLink) {
                museumLink.hidden = !artifact.id;
                if (artifact.id) museumLink.href = artifactExhibitHref(artifact.id);
                else museumLink.removeAttribute('href');
            }

            artifactRewardIcon?.replaceChildren(createArtifactArtwork(artifact, 'quiz-artifact-art'));


            if (artifactRewardName) {

                artifactRewardName.textContent = artifactDisplayName(artifact);

            }


            if (artifactRewardDescription) {

                artifactRewardDescription.textContent =
                    artifact.description ||
                    "A new artifact has been added to your collection.";

            }


            artifactReward.hidden =
                false;

        } else {

            artifactReward.hidden =
                true;

        }

    }


    /* ======================================
       UPDATED PLAYER PROGRESS
    ====================================== */

    if (missionRewardProgress) {

        const totalXp =
            Number(
                lastCompletionResult
                    ?.totalXp
            );


        const level =
            Number(
                lastCompletionResult
                    ?.level
            );


        if (
            Number.isFinite(totalXp) &&
            Number.isFinite(level)
        ) {

            if (missionTotalXp) {

                missionTotalXp.textContent =
                    `${totalXp} XP`;

            }


            if (missionResultLevel) {

                missionResultLevel.textContent =
                    `${level}`;

            }


            missionRewardProgress.hidden =
                false;

        } else {

            missionRewardProgress.hidden =
                true;

        }

    }

}


/* ==========================================
   RETRY QUIZ
========================================== */

retryQuizButton.addEventListener("click", async () => {
    if (!currentUser || !currentQuiz || retryQuizButton.disabled) return;
    const generation = quizSessionGeneration;
    retryQuizButton.disabled = true;
    studentTabStorage.removeItem('missionQuiz:' + currentUser.uid + ':' + currentQuiz.id);
    if(securedQuiz)forgetAssessment(securedIdentity());
    await loadQuiz();
    if (generation === quizSessionGeneration) retryQuizButton.disabled = false;
});

/* ==========================================
   CONTINUE RESULT
========================================== */

continueResultButton.addEventListener(
    "click",
    () => {
        if (quizResult.hidden || !currentUser) return;
        if (resultNextHref) {
            navigatePage(resultNextHref);
            return;
        }

        /*
         * Passed:
         * return to the mission journey.
         *
         * Failed:
         * send the student to the relevant lesson before practice.
         */

        if (lastQuizPassed) {

            const destination = new URLSearchParams({chapter: chapterId});
            if (lastCompletionResult?.firstCompletion && missionId) destination.set('completedMission', missionId);
            navigatePage(learningNavigation.classroomReturn || ('mission.html?' + destination));

            return;

        }


        navigatePage(learningNavigation.carry('story.html?' + new URLSearchParams({chapter: chapterId, mission: missionId, ...(lastQuizTopics[0] ? {reviewTopic: lastQuizTopics[0]} : {})})));

    }
);


/* ==========================================
   ERROR
========================================== */

function showError(message) {
    if (retryQuizLoadButton) retryQuizLoadButton.hidden = !auth.currentUser || !chapterId || !missionId;

    if (quizLoading) {

        quizLoading.hidden =
            true;

    }


    if (quizContent) {

        quizContent.hidden =
            true;

    }


    if (quizError) {

        quizError.textContent =
            message;


        quizError.hidden =
            false;

    }

}


/* ==========================================
   AUTHENTICATION + START
========================================== */

/*
 * IMPORTANT:
 *
 * loadQuiz() must NOT run before Firebase
 * Authentication has restored the signed-in
 * student.
 *
 * The previous broken version called
 * loadQuiz() immediately while currentUser
 * was still null. That triggered:
 *
 * "The selected mission quiz could not be loaded."
 */

onAuthStateChanged(
    auth,
    async (user) => {

        /* ==================================
           NOT SIGNED IN
        ================================== */

        if (!user) {
            quizDraft?.close();
            quizDraftReady = false;
            quizSessionGeneration++;
            if (quizCountdown?.open) quizCountdown.close();
            if (quizHeartsDepleted.open) quizHeartsDepleted.close();
            quizLoadPending = false;
            questions = [];
            studentAnswers = {};
            lockedAnswers = {};
            currentQuiz = null;
            currentMission = null;
            currentAttemptId = null;
            lastCompletionResult = null;
            lastAdaptiveFollowup = null;
            lastArtifactResult = null;
            lastQuizTopics = [];
            missionQuestionBank = [];
            seenMissionQuestionIds = [];
            missionDifficultyLevels = [];
            missionTopicMastery = {};
            adaptiveQuestionPool = [];
            adaptiveQuestionIds = [];
            adaptiveAnswers = {};
            adaptiveCurrentQuestion = null;
            adaptiveFollowupStarted = false;
            adaptiveFollowupComplete = false;
            quizResult.hidden = true;
            showError("Please sign in to access this quiz.");

            currentUser =
                null;


            navigatePage('login.html', { replace: true });


            return;

        }


        /* ==================================
           AUTHENTICATED STUDENT
        ================================== */

        if (currentUser?.uid === user.uid) return;
        const generation = ++quizSessionGeneration;
        if (quizCountdown?.open) quizCountdown.close();
        if (quizHeartsDepleted.open) quizHeartsDepleted.close();
        quizLoadPending = false;
        retryQuizButton.disabled = false;
        quizContent.hidden = true;
        quizError.hidden = true;
        quizLoading.hidden = false;
        currentUser =
            user;


        try {

            /*
             * Load the student's profile for
             * the small topbar information.
             *
             * Failure to load these optional
             * display values should not stop
             * the quiz itself.
             */

            const userReference =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userReference
                );


            if (generation !== quizSessionGeneration) return;
            if (
                userSnapshot.exists()
            ) {

                const userData =
                    userSnapshot.data();


                const topXp =
                    document.getElementById(
                        "topXp"
                    );


                const topStudentName =
                    document.getElementById(
                        "topStudentName"
                    );


                const topStudentLevel =
                    document.getElementById(
                        "topStudentLevel"
                    );


                const profileAvatar =
                    document.getElementById(
                        "profileAvatar"
                    );


                const xp =
                    Number(
                        userData.xp
                    ) || 0;


                let level = "Unavailable";
                try { level = progressionState(xp, await loadProgressionPolicy()).level; }
                catch (error) { console.warn(error.message); }


                if (generation !== quizSessionGeneration) return;
                const studentName =
                    userData.firstName ||
                    "Student";


                if (topXp) {

                    topXp.textContent =
                        `${xp} XP`;

                }


                if (topStudentName) {

                    topStudentName.textContent =
                        studentName;

                }


                if (topStudentLevel) {

                    topStudentLevel.textContent =
                        `Level ${level}`;

                }


                if (profileAvatar) {

                    renderStudentIdentity(userData);

                }

            }


        } catch (error) {

            console.warn(
                "Unable to load quiz topbar profile:",
                error
            );

        }


        /* ==================================
           LOAD QUIZ AFTER AUTH IS READY
        ================================== */

        if (generation !== quizSessionGeneration) return;
        await loadQuiz();

    }
);

const reviewLessonLink = document.getElementById("reviewLessonLink");
if (reviewLessonLink) reviewLessonLink.href = `story.html?${new URLSearchParams({chapter: chapterId || "", mission: missionId || ""})}`;

retryQuizLoadButton?.addEventListener("click", async () => (await loadQuiz()));

const learningNavigation=mountLearningNavigation(document.querySelector(".quiz-page"), "Mission Quiz")||{carry:url=>url};
const quizFocusExit = document.getElementById('quizFocusExit');
if (quizFocusExit) quizFocusExit.href = learningNavigation.classroomReturn ||
    (chapterId ? 'mission.html?' + new URLSearchParams({chapter:chapterId}) : 'chapters.html');
const quizFullscreen = document.getElementById('quizFullscreen');
const quizFullscreenDocument = (() => { try { return window.parent !== window && window.parent.location.origin === window.location.origin ? window.parent.document : document; } catch { return document; } })();
if (quizFullscreen && quizFullscreenDocument.fullscreenEnabled && quizFullscreenDocument.documentElement.requestFullscreen) {
    quizFullscreen.hidden = false;
    const syncQuizFullscreen = () => { quizFullscreen.textContent = quizFullscreenDocument.fullscreenElement ? 'Exit full screen' : 'Full screen'; };
    quizFullscreenDocument.addEventListener('fullscreenchange', syncQuizFullscreen);
    window.addEventListener('pagehide', () => quizFullscreenDocument.removeEventListener('fullscreenchange', syncQuizFullscreen), {once:true});
    syncQuizFullscreen();
    quizFullscreen.addEventListener('click', async () => {
        const status = document.getElementById('quizFullscreenStatus');
        status.textContent = '';
        try {
            if (quizFullscreenDocument.fullscreenElement) await quizFullscreenDocument.exitFullscreen();
            else await quizFullscreenDocument.documentElement.requestFullscreen();
        } catch {
            status.textContent = 'Full screen is unavailable. You can keep playing here.';
        }
    });
}

document.getElementById('flagQuestionButton')?.addEventListener('click',()=>{if(quizSubmitted||!currentUser)return;const id=questions[currentQuestionIndex]?.id;if(!id)return;if(flaggedQuestions.has(id))flaggedQuestions.delete(id);else flaggedQuestions.add(id);displayQuestion();});
