import { quizDraftVersion } from "./quiz-draft-policy.js";
import { mountLearningNavigation } from "./learning-navigation.js";
import { learningDraft, draftStatus, restartControl } from "./learning-draft.js";
import { loadProgressionPolicy } from "./progression.js";
import { progressionState } from "./progression-policy.js";
import { startMissionQuiz } from "./mission-assessment-client.js";
import { diagnoseMissionTopics, nextAdaptiveDifficulty, selectAdaptiveQuestion } from "./mission-assessment.js";
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
let quizDraft = null;
let quizDraftReady = false;
const quizDraftStatus = draftStatus(quizContent);
const restartQuizButton = restartControl(quizContent, "Start Quiz Over", async () => {
    if (!currentUser || quizSubmitted || quizLoadPending) return;
    const generation = quizSessionGeneration;
    const attemptKey = 'missionQuiz:' + currentUser.uid + ':' + currentQuiz.id;
    quizDraftReady = false;
    try {
        await quizDraft.clear();
        if (generation !== quizSessionGeneration) return;
        sessionStorage.removeItem(attemptKey);
        sessionStorage.removeItem('missionQuizSet:' + currentUser.uid + ':' + currentAttemptId);
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
    const previousSaveStatus = document.getElementById('quizSaveStatus');
    if (previousSaveStatus) {
        previousSaveStatus.hidden = true;
        previousSaveStatus.textContent = '';
    }
    quizContent.hidden = true;
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
        currentAttemptId = savedDraft?.quizId === currentQuiz.id && typeof savedDraft.attemptId === "string" ? savedDraft.attemptId : sessionStorage.getItem(attemptKey) || crypto.randomUUID();
        sessionStorage.setItem(attemptKey, currentAttemptId);
        if (savedDraft?.attemptId === currentAttemptId && Array.isArray(savedDraft.questionIds)) sessionStorage.setItem("missionQuizSet:" + currentUser.uid + ":" + currentAttemptId, JSON.stringify(savedDraft.questionIds));
        const issued = await startMissionQuiz({ chapterId, missionId, quizId: currentQuiz.id, attemptId: currentAttemptId });
        if (!isCurrent()) return;
        currentAttemptId = issued.attemptId;
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
        if (passingRequirement) passingRequirement.textContent = "Answer all " + questions.length + " questions. You need at least " + Math.ceil(questions.length * requirePassingScore(currentQuiz) / 100) + " correct (" + currentQuiz.passingScore + "%) to complete the mission.";
        const notice = document.getElementById("quizSetNotice");
        if (notice) notice.textContent = "Your answers help choose questions for you. This mission still has " + questions.length + " questions and the same passing goal. Any extra practice helps you review; it does not change your mission score.";

        /* ==================================
           DISPLAY QUIZ INFORMATION
        ================================== */

        quizTitle.textContent =
            currentQuiz.title ||
            `${currentMission.title || "Mission"} Quiz`;


        quizDescription.textContent =
            currentQuiz.description ||
            "Test what you learned during this mission.";


        /* ==================================
           DISPLAY FIRST QUESTION
        ================================== */

        currentQuestionIndex =
            0;


        const currentDraftVersion = quizDraftVersion(currentQuiz, questions, adaptiveQuestionPool, missionQuestionBank);
        const canResumeDraft = savedDraft?.version === currentDraftVersion && savedDraft?.attemptId === currentAttemptId &&
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
            const savedAdaptiveIds = Array.isArray(savedDraft.adaptiveQuestionIds) ? savedDraft.adaptiveQuestionIds : [];
            if (savedDraft.adaptiveFollowupStarted === true && savedAdaptiveIds.length > 0 &&
                new Set(savedAdaptiveIds).size === savedAdaptiveIds.length &&
                savedAdaptiveIds.every(id => adaptiveQuestionPool.some(question => question.id === id))) {
                adaptiveFollowupStarted = true;
                adaptiveQuestionIds = [...savedAdaptiveIds];
                adaptiveQuestionIndex = Math.max(0, Math.min(Number(savedDraft.adaptiveQuestionIndex) || 0, adaptiveQuestionIds.length - 1));
                adaptiveQuestionLimit = getAdaptiveQuestionLimit();
                adaptiveDifficultyLevels = getAdaptiveDifficultyLevels();
                adaptiveAnswers = Object.fromEntries(Object.entries(savedDraft.adaptiveAnswers || {})
                    .filter(([id, answer]) => adaptiveQuestionIds.includes(id) && ['A','B','C','D'].includes(answer)));
                adaptiveCurrentQuestion = adaptiveQuestionPool.find(question => question.id === adaptiveQuestionIds[adaptiveQuestionIndex]) || null;
                adaptiveSelectedAnswer = ['A','B','C','D'].includes(savedDraft.adaptiveSelectedAnswer) ? savedDraft.adaptiveSelectedAnswer : null;
                adaptiveFeedbackVisible = savedDraft.adaptiveFeedbackVisible === true && Boolean(adaptiveAnswers[adaptiveCurrentQuestion?.id]);
                adaptiveFollowupComplete = savedDraft.adaptiveFollowupComplete === true;
                adaptiveTargetDifficulty = adaptiveDifficultyLevels.includes(savedDraft.adaptiveTargetDifficulty)
                    ? savedDraft.adaptiveTargetDifficulty : getInitialAdaptiveDifficulty(diagnoseMissionTopics(questions, studentAnswers));
                adaptiveTopicWeights = savedDraft.adaptiveTopicWeights && typeof savedDraft.adaptiveTopicWeights === 'object'
                    ? {...savedDraft.adaptiveTopicWeights} : makeAdaptiveTopicWeights(diagnoseMissionTopics(questions, studentAnswers));
                adaptiveTopicAttempts = savedDraft.adaptiveTopicAttempts && typeof savedDraft.adaptiveTopicAttempts === 'object'
                    ? {...savedDraft.adaptiveTopicAttempts} : {};
            }
            if (savedDraft.missionTopicMastery && typeof savedDraft.missionTopicMastery === 'object' && !Array.isArray(savedDraft.missionTopicMastery)) {
                missionTopicMastery = {...savedDraft.missionTopicMastery};
            }
        }
        if (savedDraft && savedDraft.attemptId === currentAttemptId && savedDraft.version !== currentDraftVersion) {
            const resumeNotice = document.getElementById("quizSetNotice");
            if (resumeNotice) resumeNotice.textContent += " The quiz content changed, so your saved answers have been reset. Completed progress and rewards are unchanged.";
        }
        quizStarted = canResumeDraft &&
            savedDraft?.attemptId === currentAttemptId &&
            JSON.stringify(savedDraft.questionIds) === JSON.stringify(questions.map(q=>q.id)) &&
            (savedDraft.started === true || Object.keys(studentAnswers).length > 0);
        quizDraftReady = true;
        restartQuizButton.hidden = !savedDraft;
        if (adaptiveFollowupStarted && adaptiveCurrentQuestion) displayAdaptiveQuestion();
        else displayQuestion();
        renderMissionBriefing();

        quizLoading.hidden =
            true;

        quizError.hidden =
            true;

        quizContent.hidden =
            false;


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


function renderMissionBriefing(){
 document.getElementById('quizMissionBriefing')?.remove();
 questionCard.hidden=!quizStarted;
 if(quizStarted)return;
 const briefing=document.createElement('section');briefing.id='quizMissionBriefing';briefing.className='quiz-mission-briefing';briefing.setAttribute('aria-labelledby','quizBriefingTitle');
 const add=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;briefing.append(el);return el;};
 add('span','EXPEDITION BRIEFING','eyebrow');const title=add('h2',currentMission.title||'Your mission');title.id='quizBriefingTitle';
 const objectives=Array.isArray(currentMission.learningObjectives)?currentMission.learningObjectives:[currentMission.learningObjective];
 const list=document.createElement('ul');for(const value of objectives)if(typeof value==='string'&&value.trim()){const item=document.createElement('li');item.textContent=value;list.append(item);}if(list.children.length){add('h3','Your investigation');briefing.append(list);}
  const requirements=add('div','','briefing-requirements');for(const value of [questions.length+' mission checkpoints',Math.ceil(questions.length*requirePassingScore(currentQuiz)/100)+' correct to pass']){const chip=document.createElement('span');chip.textContent=value;requirements.append(chip);}
 if(Number.isFinite(currentMission.xpReward)&&currentMission.xpReward>=0){const reward=document.createElement('span');reward.textContent='Up to '+currentMission.xpReward+' XP on first completion';requirements.append(reward);}
 add('p','Each question is a checkpoint in your mission. Answer one at a time. Your answers help choose which question comes next.');
 add('p','If you change an earlier answer, answers after it will be cleared so you can answer them again. Marking a question for review does not change your score.');
  if(getAdaptiveQuestionLimit()>0)add('p','After the mission questions, you will try a few extra practice questions. These help you find topics to review. They do not change your mission score.','adaptive-quiz-note');
 add('p','A successful attempt completes the mission. Replaying a completed mission does not award its XP again.','briefing-reward-note');
 const actions=document.createElement('div');actions.className='briefing-actions';const lesson=document.createElement('a');lesson.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId});lesson.textContent='Revisit Lesson';
 const begin=document.createElement('button');begin.type='button';begin.className='begin-mission-button';begin.textContent='Begin Expedition';begin.addEventListener('click',()=>{if(!currentUser||quizSubmitted)return;quizStarted=true;briefing.remove();questionCard.hidden=false;displayQuestion();questionText.tabIndex=-1;questionText.focus({preventScroll:true});});
 actions.append(lesson,begin);briefing.append(actions);questionCard.before(briefing);
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
        if (currentAttemptId) sessionStorage.setItem('missionQuizSet:' + currentUser.uid + ':' + currentAttemptId, JSON.stringify(questionIds));
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

    questionProgress.textContent = `Personalized check ${adaptiveQuestionIndex + 1} of ${adaptiveQuestionLimit}`;
    answeredProgress.textContent = 'This follow-up guides recommendations; it does not change your mission score.';
    quizProgressFill.style.width = `${Math.round(100 * (questions.length + adaptiveQuestionIndex + (adaptiveFeedbackVisible ? 1 : 0)) / (questions.length + adaptiveQuestionLimit))}%`;
    nextQuestionButton.disabled = !adaptiveFeedbackVisible && !answer;
    nextQuestionButton.textContent = adaptiveFeedbackVisible
        ? (adaptiveFollowupComplete ? 'Retry Save' : adaptiveQuestionIds.length < adaptiveQuestionLimit ? 'Next Personalized Check' : 'Finish & Save')
        : 'Check Answer';
    saveQuizDraftState();
}

function handleAdaptiveFollowupAction() {
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
    submitQuiz(true);
}

function displayMissionCheckpoints() {
 if(!missionCheckpoints)return;
 missionCheckpoints.replaceChildren();missionCheckpoints.setAttribute('role','list');missionCheckpoints.setAttribute('aria-label','Expedition checkpoints. Answered does not mean correct.');
 questions.forEach((question,index)=>{
  const answered=Boolean(studentAnswers[question.id]),current=index===currentQuestionIndex;
  const checkpoint=document.createElement('div');checkpoint.className='mission-checkpoint'+(answered?' answered':'')+(current?' current':'');checkpoint.setAttribute('role','listitem');if(current)checkpoint.setAttribute('aria-current','step');
  checkpoint.setAttribute('aria-label','Checkpoint '+(index+1)+', '+(answered?'answered':'unanswered')+(current?', current':''));
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
    if(flagCount)flagCount.textContent=flaggedQuestions.size+' question'+(flaggedQuestions.size===1?'':'s')+' marked for review';
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


    const answerLocked = quizSubmitted;


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


            if (
                studentAnswers[
                    question.id
                ] === option.key
            ) {

                optionButton.classList.add(
                    "selected"
                );

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
                () => {

                    if (
                        quizSubmitted ||
                        answerLocked
                    ) {

                        return;

                    }


                    const previousAnswer = studentAnswers[question.id];
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


    const answeredCount =
        Object.keys(
            studentAnswers
        ).length;


    answeredProgress.textContent =
        `${answeredCount} of ${questions.length} answered - graded after submission`;


    const progress =
        (
            questionPosition /
            questions.length
        ) * 100;


    quizProgressFill.style.width =
        `${progress}%`;


    displayMissionCheckpoints();


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
    nextQuestionButton.textContent = isLastQuestion ? 'Review My Answers' : 'Next Question';
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

nextQuestionButton.addEventListener(
    "click",
    async () => {

        if (quizSubmitted) {

            return;

        }

        if (adaptiveFollowupStarted) {
            if (adaptiveFollowupComplete) await submitQuiz(true);
            else handleAdaptiveFollowupAction();
            return;
        }


        const currentQuestion =
            questions[
                currentQuestionIndex
            ];


        const selectedAnswer =
            studentAnswers[
                currentQuestion.id
            ];


        /* ==================================
           REQUIRE AN ANSWER
        ================================== */

        if (!selectedAnswer) {

            alert(
                "Choose an answer before continuing."
            );

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

        if (!isLastQuestion) {

            const hasAnsweredLaterQuestion = questions.slice(currentQuestionIndex + 1)
                .some(question => ['A', 'B', 'C', 'D'].includes(studentAnswers[question.id]));
            if (!hasAnsweredLaterQuestion) {
                const nextMissionQuestion = chooseNextMissionQuestion(currentQuestionIndex);
                if (nextMissionQuestion) placeNextMissionQuestion(currentQuestionIndex, nextMissionQuestion);
            }

            currentQuestionIndex++;


            displayQuestion();
            questionText.tabIndex = -1;
            questionText.focus({preventScroll:true});


            if (questionCard) {

                questionCard.scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "start"
                    }
                );

            }


            return;

        }


        /* ==================================
           CHECK ALL CHECKPOINTS LOCKED
        ================================== */

        const allLocked = questions.every(question => ['A','B','C','D'].includes(studentAnswers[question.id]));
        if (!allLocked) {

            alert(
                "Answer every question before submitting."
            );

            return;

        }


        /* ==================================
           SUBMIT MISSION TRIAL
        ================================== */

        await submitQuiz();

    }
);


/* ==========================================
   SUBMIT QUIZ
========================================== */

async function submitQuiz(flagsConfirmed=false) {
    if(flagsConfirmed&&!questions.every(q=>['A','B','C','D'].includes(studentAnswers[q.id])))return;
    const generation = quizSessionGeneration;
    const submittingUid = currentUser?.uid;
    const isCurrent = () => generation === quizSessionGeneration && currentUser?.uid === submittingUid;

    if (
        quizSubmitted ||
        !currentUser ||
        !currentQuiz ||
        !currentMission
    ) {

        return;

    }

    if (flagsConfirmed && !adaptiveFollowupStarted && !adaptiveFollowupComplete && startAdaptiveFollowup()) return;


    if(!flagsConfirmed){
        const panel=document.getElementById('flagReviewPanel');
        if(panel){panel.replaceChildren();panel.hidden=false;const title=document.createElement('h3');title.textContent='Your expedition journal';panel.append(title);const note=document.createElement('p');note.textContent='Check your choices before submitting. Select a question to change your answer. A review flag means you wanted another look; it does not mean your answer is wrong.';panel.append(note);
        const answered=questions.filter(q=>['A','B','C','D'].includes(studentAnswers[q.id])).length;
        const summary=document.createElement('p');summary.className='quiz-journal-summary';summary.textContent=answered+' of '+questions.length+' answered ? '+questions.filter(q=>flaggedQuestions.has(q.id)).length+' marked for review';panel.append(summary);
        questions.forEach((question,index)=>{
            const button=document.createElement('button');button.type='button';button.className='quiz-journal-question';
            const answer=studentAnswers[question.id];const valid=['A','B','C','D'].includes(answer);
            button.dataset.flagged=String(flaggedQuestions.has(question.id));button.dataset.answered=String(valid);
            const label=document.createElement('strong');label.textContent='Question '+(index+1)+(flaggedQuestions.has(question.id)?' ? Review flag':'');
            const prompt=document.createElement('span');prompt.textContent=question.question;
            const choice=document.createElement('span');choice.className='quiz-journal-choice';choice.textContent=valid?'Your choice: '+answer+' ? '+(question['option'+answer]||''):'Not answered yet';
            button.append(label,prompt,choice);
            button.addEventListener('click',()=>{currentQuestionIndex=index;displayQuestion();questionText.tabIndex=-1;questionText.focus({preventScroll:true});});panel.append(button);
        });
        if(getAdaptiveQuestionLimit()>0){const adaptiveNote=document.createElement('p');adaptiveNote.className='adaptive-quiz-note';adaptiveNote.textContent='Next, try a few extra practice questions to find topics you can review. They do not change your mission score.';panel.append(adaptiveNote);}
        const confirm=document.createElement('button');confirm.type='button';confirm.textContent=getAdaptiveQuestionLimit()>0?'Continue to Personalized Check':'Submit Answers';confirm.disabled=!questions.every(q=>['A','B','C','D'].includes(studentAnswers[q.id]));confirm.addEventListener('click',()=>{panel.hidden=true;submitQuiz(true);});panel.append(confirm);title.tabIndex=-1;title.focus();return;}
    }
    quizSubmitted =
        true;

    const saveStatus = document.getElementById('quizSaveStatus');
    if (saveStatus) {
        saveStatus.hidden = false;
        saveStatus.textContent = 'Saving your answers… Keep this page open until saving finishes.';
    }


    nextQuestionButton.disabled =
        true;

    previousQuestionButton.disabled =
        true;


    try {

        if (!currentAttemptId) {
            currentAttemptId = crypto.randomUUID();
        }

        /* ==================================
           CALCULATE SCORE
        ================================== */
const completionResult = await submitStudentActivity({
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
quizDraftReady = false;
if (saveStatus) saveStatus.textContent = completionResult.preview ? 'Preview result only. No score, completion or reward was saved.' : 'Your quiz result is saved.';
restartQuizButton.hidden = true;
await quizDraft?.clear().catch(() => {});
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
sessionStorage.removeItem('missionQuiz:' + currentUser.uid + ':' + currentQuiz.id);
sessionStorage.removeItem('missionQuizSet:' + currentUser.uid + ':' + currentAttemptId);
const correctAnswers = completionResult.correctAnswers;
const percentage = completionResult.score;
const passed = completionResult.passed === true;

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
                true
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
            false
        );


    } catch (error) {

        if (!isCurrent()) return;
        console.error(
            "Unable to submit quiz:",
            error
        );


        quizSubmitted =
            false;

        nextQuestionButton.disabled =
            false;

        if (adaptiveFollowupComplete) nextQuestionButton.textContent = 'Retry Save';

        previousQuestionButton.disabled =
            currentQuestionIndex === 0;


        if (saveStatus) {
            saveStatus.textContent = 'We could not confirm that your result was saved. Your answers are still on this page. Check your connection, then submit again. Keep this page open.';
        }

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


            const answerExplanation = question.answerExplanations?.[studentAnswerKey];
            const explanation =
                String(
                    (typeof answerExplanation === "string" && answerExplanation.trim() ? answerExplanation : question.explanation) ||
                    ""
                ).trim();


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


            explanationLabel.textContent =
                "Why?";


            const explanationText =
                document.createElement(
                    "p"
                );


            explanationText.textContent =
                explanation ||
                (
                    isCorrect
                        ? "Good work. Review the lesson idea connected to this question before continuing."
                        : "Review this idea in the story and practice section before trying the quiz again."
                );


            explanationBox.appendChild(
                explanationLabel
            );


            explanationBox.appendChild(
                explanationText
            );


            if (typeof question.learningPoint === "string" && question.learningPoint.trim()) {
                const point = document.createElement("p");
                point.textContent = "Key idea: " + question.learningPoint.trim();
                explanationBox.appendChild(point);
            }
            if (!isCorrect) {
                const lesson = document.createElement("a");
                lesson.className = "text-button";
                lesson.textContent = "Review Mission Lesson";
                lesson.href = "story.html?" + new URLSearchParams({chapter: chapterId, mission: missionId});
                explanationBox.appendChild(lesson);
                if (typeof question.topic === "string" && question.topic.trim()) {
                    const practice = document.createElement("a");
                    practice.className = "text-button";
                    practice.textContent = "Practice This Topic";
                    practice.href = "practice.html?" + new URLSearchParams({chapter: chapterId, mission: missionId, topic: question.topic.trim()});
                    explanationBox.appendChild(document.createTextNode(" ? "));
                    explanationBox.appendChild(practice);
                }
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


            reviewItem.appendChild(
                answers
            );


            reviewItem.appendChild(
                explanationBox
            );


            quizAnswerReviewList.appendChild(
                reviewItem
            );

        }
    );


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
 const heading=document.createElement('h3');heading.id='missionLearningSummaryTitle';heading.textContent='Your mission field notes';panel.append(heading);
 function block(title){const part=document.createElement('div');part.className='learning-summary-block';const h=document.createElement('h4');h.textContent=title;part.append(h);panel.append(part);return part;}
 function copy(host,value){const p=document.createElement('p');p.textContent=value;host.append(p);return p;}
 const objectives=(Array.isArray(currentMission.learningObjectives)?currentMission.learningObjectives:[currentMission.learningObjective]).filter(v=>typeof v==='string'&&v.trim());
 if(objectives.length){const part=block('What this mission taught');const list=document.createElement('ul');for(const objective of objectives){const item=document.createElement('li');item.textContent=objective;list.append(item);}part.append(list);}
 const demonstrated=block('What your quiz shows');copy(demonstrated,correctAnswers+' of '+questions.length+' questions answered correctly. You met this mission passing requirement. This result does not prove every topic is fully understood.');
 const review=block('What you can revisit');if(lastQuizTopics.length){for(const topic of lastQuizTopics){const question=questions.find(q=>q.topic===topic);const link=document.createElement('a');link.textContent=question?.topicLabel||topic;link.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,reviewTopic:topic});review.append(link);}copy(review,'These recommendations come from this quiz. Saved practice can provide more evidence as you learn.');}else copy(review,'No missed topics were identified in this quiz. You can revisit the lesson whenever you want.');
 const artifact=lastArtifactResult?.artifact;if(artifact){const collection=block(lastArtifactResult.newlyEarned?'What you collected':'Your mission collectible');copy(collection,artifact.name||artifact.title||'Mission collectible');if(typeof artifact.learningDetails?.lessonConnection==='string')copy(collection,artifact.learningDetails.lessonConnection);else if(typeof artifact.description==='string')copy(collection,artifact.description);const link=document.createElement('a');link.href='achievements.html';link.textContent='Explore My Collections';collection.append(link);}
 const next=block('Your next step');const pending=copy(next,'Checking your saved chapter progress...');quizResultMessage.after(panel);
 const uid=currentUser?.uid,generation=quizSessionGeneration,scopeMission=missionId;const current=()=>auth.currentUser?.uid===uid&&quizSessionGeneration===generation&&document.getElementById('missionLearningSummary')===panel&&!quizResult.hidden;
 try{const [missionSnapshot,progressSnapshot,challengeSnapshot]=await Promise.all([getDocs(query(collection(db,'missions'),where('chapterId','==',chapterId))),getDocs(query(collection(db,'studentProgress'),where('userId','==',uid))),getDocs(query(collection(db,'chapterChallenges'),where('chapterId','==',chapterId)))]);if(!current())return;
 const rows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id})),missions=rows(missionSnapshot).filter(m=>m.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
 const completed=new Set(rows(progressSnapshot).filter(p=>p.userId===uid&&p.chapterId===chapterId&&p.completed===true).map(p=>p.missionId));
 if(!completed.has(scopeMission)){pending.textContent='Your result is saved. Open My Journey to refresh your next step.';return;}
 const nextMission=missions.find((mission,index)=>!completed.has(mission.id)&&missions.slice(0,index).every(prior=>completed.has(prior.id)));
 const action=document.createElement('a');action.className='learning-summary-next';
 if(nextMission){pending.textContent='Available next: '+(nextMission.title||'Next mission')+'.';action.textContent='Open Next Lesson';action.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:nextMission.id});}
 else if(missions.length&&missions.every(m=>completed.has(m.id))&&rows(challengeSnapshot).some(c=>c.status==='active')){pending.textContent='All missions in this chapter are complete. The chapter challenge is available; your chapter completion is checked there.';action.textContent='Open Chapter Challenge';action.href='chapter-challenge.html?'+new URLSearchParams({chapter:chapterId});}
 else{pending.textContent='Your mission is complete. My Journey shows your available learning steps.';action.textContent='Open My Journey';action.href='my-journey.html';}next.append(action);
 }catch{if(current()){pending.textContent='Your mission result is saved, but the next step could not be checked. Open My Journey to try again.';const link=document.createElement('a');link.href='my-journey.html';link.textContent='Open My Journey';next.append(link);}}
}

function showResult(
    percentage,
    correctAnswers,
    passed
) {

    questionCard.hidden =
        true;


    quizResult.hidden =
        false;
    quizResultTitle.tabIndex = -1;
    queueMicrotask(() => { if (!quizResult.hidden && currentUser) quizResultTitle.focus({preventScroll:true}); });


    quizScore.textContent =
        `${percentage}%`;


    /* ======================================
       LEARNING REVIEW
    ====================================== */

    document.getElementById('missionLearningSummary')?.remove();
    quizResult.dataset.outcome=passed?'passed':'retry';
    document.getElementById('expeditionResultSummary')?.remove();
    const expeditionSummary=document.createElement('div');expeditionSummary.id='expeditionResultSummary';expeditionSummary.className='expedition-result-summary';
    const tag=document.createElement('span');tag.className='eyebrow';tag.textContent=passed?'EXPEDITION COMPLETE':'YOUR RECOVERY ROUTE';
    const total=document.createElement('strong');total.textContent=correctAnswers+' / '+questions.length+' mission questions correct';
    const requirement=document.createElement('p');requirement.textContent='You need '+Math.ceil(questions.length*requirePassingScore(currentQuiz)/100)+' correct to pass. '+(passed?'Continue your journey, or revisit any topics below.':'First review a missed topic in the lesson. Then try practice and return for another quiz on the same topics.');
    expeditionSummary.append(tag,total,requirement);
    if(lastAdaptiveFollowup){const adaptiveSummary=document.createElement('p');adaptiveSummary.className='adaptive-result-summary';adaptiveSummary.textContent='Extra practice: '+lastAdaptiveFollowup.correctAnswers+' of '+lastAdaptiveFollowup.totalQuestions+' correct. This does not change your mission score. '+(lastAdaptiveFollowup.preview?'This preview was not saved.':'Check the topics below to see what you can review.');expeditionSummary.append(adaptiveSummary);}
    quizResultMessage.after(expeditionSummary);
    const hasPassRewardCue=passed&&globalThis.__lakbayExplorationPreview!==true&&(
        lastCompletionResult?.firstCompletion===true||lastArtifactResult?.newlyEarned===true
    );
    displayAnswerReview({
        playCorrectCue:passed&&globalThis.__lakbayExplorationPreview!==true&&!hasPassRewardCue
    });
    const reinforcement = document.getElementById("quizReinforcementSummary");
    if (reinforcement) reinforcement.textContent = passed
        ? lastQuizTopics.length ? "Mission complete. You can continue your journey and optionally strengthen the topics below. Passing does not mean every topic was answered correctly."
            : "You answered every question correctly on this attempt. Continue your journey or revisit the lesson whenever you want."
        : "These topics were identified from this attempt. Review the explanations and choose practice, lesson review or a quiz retry.";
    const reinforceLink = document.getElementById("reinforcePassedTopicsLink");
    if (reinforceLink) {
        reinforceLink.hidden = !passed || !lastQuizTopics.length;
        reinforceLink.href = "practice.html?" + new URLSearchParams({chapter:chapterId,mission:missionId});
    }
    const topicBox = document.getElementById("quizWeakTopics");
    if (topicBox) {
        topicBox.replaceChildren();
        for (const topic of lastQuizTopics) {
            const item=document.createElement('article');item.className='result-topic-route';const question=questions.find(q=>q.topic===topic)||adaptiveQuestionPool.find(q=>q.topic===topic);const name=document.createElement('strong');name.textContent=question?.topicLabel||topic;const note=document.createElement('p');note.textContent='Read this topic again, then try a few practice questions. Return to the mission quiz when you feel ready.';const link=document.createElement('a');link.textContent='1. Review the lesson';link.setAttribute('aria-label','Review the lesson: '+name.textContent);link.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,reviewTopic:topic});const practice=document.createElement('a');practice.textContent='2. Try practice';practice.setAttribute('aria-label','Try practice: '+name.textContent);practice.href='practice.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,topic,review:'1'});item.append(name,note,link,practice);topicBox.append(item);
        }
    }


    /* ======================================
       PASSED
    ====================================== */

    if (globalThis.__lakbayExplorationPreview===true) {
        quizResultIcon.textContent='🧭';
        if(quizResultEyebrow)quizResultEyebrow.textContent='TESTING PREVIEW';
        quizResultTitle.textContent=passed?'Preview: passing score':'Preview: try again';
        quizResultMessage.textContent=correctAnswers+' of '+questions.length+' correct. This test result does not complete the mission or award XP and artifacts.';
        missionRewardCard.hidden=true;
        if(reinforcement)reinforcement.textContent='Use the explanations below to test the learning flow. Your saved student progress is unchanged.';
        retryQuizButton.hidden=false;
        continueResultButton.textContent=passed?'Back to Missions':'Review This Topic';
        return;
    }
    if (passed) {

       quizResultIcon.textContent =
    "\u{1F3C6}";


if (quizResultEyebrow) {

    quizResultEyebrow.textContent =
        "MISSION TRIAL COMPLETE";

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

        if (firstCompletion) {
            document.dispatchEvent(new CustomEvent("lakbay:mission-completed"));
        }
        if (artifactNewlyEarned && earnedArtifact) {
            document.dispatchEvent(new CustomEvent("lakbay:artifact-found", {
                detail: { delayMs: firstCompletion ? 420 : 0 }
            }));
        }


        /* ==================================
           FIRST COMPLETION
        ================================== */

        if (firstCompletion) {

           quizResultMessage.textContent =
    `You completed the Mission Trial with ${correctAnswers} out of ${questions.length} checkpoints correct. Your journey can continue!`;

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
    `You completed the Mission Trial with ${correctAnswers} out of ${questions.length} checkpoints correct. Your mission XP was already collected, but you discovered an artifact that was missing from your collection.`;

        }


        /* ==================================
           FULL REPLAY
        ================================== */

        else {

           quizResultMessage.textContent =
    `You completed the Mission Trial with ${correctAnswers} out of ${questions.length} checkpoints correct. You already completed this mission, so its XP and artifact rewards have already been collected.`;

        }


        displayMissionRewards();
        renderMissionLearningSummary(correctAnswers);


        retryQuizButton.hidden =
            true;


        continueResultButton.textContent =
            "Continue Journey \u2192";


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


    quizResultIcon.textContent =
    "\u{1F9ED}";


if (quizResultEyebrow) {

    quizResultEyebrow.textContent =
        "MISSION TRIAL \u2014 TRAINING NEEDED";

}


quizResultTitle.textContent =
    "More Training Needed";


    const passingScore =
        requirePassingScore(currentQuiz);


   quizResultMessage.textContent =
    `You answered ${correctAnswers} out of ${questions.length} mission questions correctly. You need at least ${Math.ceil(questions.length * passingScore / 100)} correct to pass. Review a missed topic in the lesson, try practice, then return when you feel ready.`;


    /*
     * Keep the existing retry option available.
     * The main learning path still directs the
     * student to the relevant lesson before practice.
     */

    retryQuizButton.hidden =
        false;


    continueResultButton.textContent =
        "Review This Topic \u2192";

    document.dispatchEvent(new CustomEvent("lakbay:needs-practice"));

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

            if (artifactRewardIcon) {

                artifactRewardIcon.textContent =
                    artifact.icon ||
                    "\u{1F3FA}";

            }


            if (artifactRewardName) {

                artifactRewardName.textContent =
                    artifact.name ||
                    artifact.title ||
                    "Historical Artifact";

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
    sessionStorage.removeItem('missionQuiz:' + currentUser.uid + ':' + currentQuiz.id);
    await loadQuiz();
    if (generation === quizSessionGeneration) retryQuizButton.disabled = false;
});

/* ==========================================
   CONTINUE RESULT
========================================== */

continueResultButton.addEventListener(
    "click",
    () => {

        /*
         * Passed:
         * return to the mission journey.
         *
         * Failed:
         * send the student to the relevant lesson before practice.
         */

        if (lastQuizPassed) {

            window.location.href =
                `mission.html?chapter=${encodeURIComponent(
                    chapterId
                )}`;

            return;

        }


        window.location.href =
            'story.html?' + new URLSearchParams({chapter: chapterId, mission: missionId, ...(lastQuizTopics[0] ? {reviewTopic: lastQuizTopics[0]} : {})});

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


            window.location.href =
                "login.html";


            return;

        }


        /* ==================================
           AUTHENTICATED STUDENT
        ================================== */

        if (currentUser?.uid === user.uid) return;
        const generation = ++quizSessionGeneration;
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

retryQuizLoadButton?.addEventListener("click", () => loadQuiz());

mountLearningNavigation(document.querySelector(".quiz-page"), "Main Quiz");

document.getElementById('flagQuestionButton')?.addEventListener('click',()=>{if(quizSubmitted||!currentUser)return;const id=questions[currentQuestionIndex]?.id;if(!id)return;if(flaggedQuestions.has(id))flaggedQuestions.delete(id);else flaggedQuestions.add(id);displayQuestion();});
