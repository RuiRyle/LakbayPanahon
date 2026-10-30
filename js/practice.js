import { stableDraftVersion } from "./quiz-draft-policy.js";
import { learningDraft, draftStatus, restartControl } from "./learning-draft.js";
import { mountLearningNavigation } from "./learning-navigation.js";
import { missionReviewTopics, missionTopicStates, requirePracticePolicy } from "./mission-review.js";
import { requestAiAssistance, aiAssistanceAvailable } from "./ai-assistance-client.js";
import { requireLearningAccess, LearningAccessError } from "./learning-access.js";
import { reviewTopicsFromHistory, renderReviewTopics } from "./practice-review.js";

import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

/* ==========================================
   ELEMENTS
========================================== */

const practiceLoading =
    document.getElementById("practiceLoading");

const practiceError =
    document.getElementById("practiceError");

const practiceContent =
    document.getElementById("practiceContent");

const practiceQuestionCard =
    document.getElementById("practiceQuestionCard");

const practiceQuestion =
    document.getElementById("practiceQuestion");
    /* ==========================================
   AI HINT ELEMENTS
========================================== */

const practiceAiHintButton =
    document.getElementById("practiceAiHintButton");

const practiceAiHintResponse =
    document.getElementById("practiceAiHintResponse");
    function resetPracticeAiHint() {
    if (practiceAiHintButton) {
        practiceAiHintButton.disabled = !aiAssistanceAvailable;
    }

    if (practiceAiHintResponse) {
        practiceAiHintResponse.textContent = "";
        practiceAiHintResponse.hidden = true;
    }
}


const practiceOptions =
    document.getElementById("practiceOptions");

const practiceProgress =
    document.getElementById("practiceProgress");

const practiceFeedback =
    document.getElementById("practiceFeedback");

const practiceFeedbackTitle =
    document.getElementById("practiceFeedbackTitle");

const practiceExplanation =
    document.getElementById("practiceExplanation");

const checkAnswerButton =
    document.getElementById("checkAnswerButton");

const practiceComplete =
    document.getElementById("practiceComplete");

const practiceSaveStatus = document.getElementById("practiceSaveStatus");
const retryPracticeSaveButton = document.getElementById("retryPracticeSaveButton");

const retryMissionQuizButton =
    document.getElementById("retryMissionQuizButton");

/* ==========================================
   URL PARAMETERS
========================================== */

const params =
    new URLSearchParams(window.location.search);

const chapterId = params.get("chapter");
const missionId = params.get("mission");
const requestedTopic = (params.get("topic") || "").trim();
const reviewContainer = document.getElementById("practiceReviewTopics");
const reviewMode = document.getElementById("practiceReviewMode");

/* ==========================================
   STATE
========================================== */

let practiceQuestions = [];
let allPracticeQuestions = [];
let remainingQuestions = [];
let currentQuestion = null;

let currentPracticeIndex = 0;
let selectedAnswer = null;
let questionMastered = false;
let currentAttemptCount = 0;
let lastIncorrectAnswer = null;

let adaptiveMode = false;
let targetDifficulty = null;

let currentUser = null;
let practiceFinished = false;
let practiceLoadStarted = false;

let previousSessions = [];
let reviewTopics = [];
let practiceHistoryUnavailable = false;

const practiceResults = [];
// Reuse this ID after a failed response so retries cannot create duplicates.
let practiceSessionReference = doc(collection(db, "studentPracticeProgress"));
let practiceSessionGeneration = 0;
let practiceSavePending = false;
let practiceLoadPending = false;
let practiceDraft = null, practiceDraftReady = false, practiceDraftVersion = "";
const practiceDraftStatus = draftStatus(practiceContent);
const restartPracticeButton = restartControl(practiceContent,"Start Practice Over",async()=>{
    if(!currentUser || practiceLoadPending || practiceSavePending || practiceFinished)return;
    const generation=practiceSessionGeneration;
    practiceDraftReady=false;
    try {
        await practiceDraft.clear();
        if(generation!==practiceSessionGeneration)return;
        await loadPractice();
    } catch {
        if(generation!==practiceSessionGeneration)return;
        practiceDraft=learningDraft("practice",chapterId,missionId,practiceDraftStatus);
        practiceDraftReady=true;
        practiceDraftStatus.textContent="Could not restart practice. Your current work is still available; try again.";
    }
});
const practiceChoices = document.getElementById("practiceChoices");
const retryPracticeLoadButton = document.getElementById("retryPracticeLoadButton");

let difficultyLevels = [];
let practicePolicy;
let missionQuizAttempts = [];
let lessonReviewEvents = [];

/* ==========================================
   DIFFICULTY HELPERS
========================================== */

function normalizeDifficulty(value) {

    const difficulty =
        String(value || "")
            .trim()
            .toLowerCase();

    return difficultyLevels.includes(difficulty)
        ? difficulty
        : null;
}

function difficultyDistance(first, second) {

    return Math.abs(
        difficultyLevels.indexOf(first) -
        difficultyLevels.indexOf(second)
    );
}

/* ==========================================
   LOAD PREVIOUS PRACTICE HISTORY
========================================== */

async function loadPracticeHistory() {
    const generation = practiceSessionGeneration;

    practiceHistoryUnavailable = false;

    previousSessions = [];
    reviewTopics = [];
    targetDifficulty = practicePolicy.startDifficulty;

    if (!currentUser) {
        return;
    }

    try {

        // Both filters are important:
        // Firestore rules allow students to read
        // only records belonging to their UID.

        const historyQuery = query(
            collection(db, "studentPracticeProgress"),
            where("userId", "==", currentUser.uid),
            where("missionId", "==", missionId)
        );

        const snapshot = await getDocs(historyQuery);
        if (generation !== practiceSessionGeneration) return;

        const sessions = [];

        snapshot.forEach((documentSnapshot) => {

            const data = documentSnapshot.data();

            // Ignore incomplete or malformed records.
            if (
                typeof data.totalQuestions !== "number" ||
                data.totalQuestions <= 0 ||
                typeof data.firstTryCorrectCount !== "number" ||
                data.firstTryCorrectCount < 0 ||
                data.firstTryCorrectCount > data.totalQuestions ||
                !data.completedAt ||
                typeof data.completedAt.toMillis !== "function"
            ) {
                return;
            }

            sessions.push({
                id: documentSnapshot.id,
                ...data
            });
        });

        // Sort locally to avoid requiring a
        // compound orderBy index for this phase.
        sessions.sort((a, b) =>
            b.completedAt.toMillis() -
            a.completedAt.toMillis()
        );

        previousSessions = sessions;

        if (previousSessions.length === 0) {

            console.log(
                "[Adaptive Practice] No previous history. Using the configured starting difficulty."
            );

            return;
        }

        analyzePracticeHistory();

    } catch (error) {

        if (generation !== practiceSessionGeneration) return;

        // A failed history read must not prevent
        // students from completing practice.

        console.warn(
            "[Adaptive Practice] History unavailable. Using the configured starting difficulty:",
            error
        );

        practiceHistoryUnavailable = true;

        previousSessions = [];
        reviewTopics = [];
        targetDifficulty = practicePolicy.startDifficulty;
    }
}

/* ==========================================
   ANALYZE PREVIOUS PERFORMANCE
========================================== */

function analyzePracticeHistory() {
    const topics = reviewTopicsFromHistory(previousSessions, allPracticeQuestions);
    const attempted = topics.reduce((sum, topic) => sum + topic.attempted, 0);
    const correct = topics.reduce((sum, topic) => sum + topic.correct, 0);
    const accuracy = attempted ? correct / attempted : 0.5;
    targetDifficulty = accuracy >= practicePolicy.promoteAccuracy ? difficultyLevels.at(-1) : accuracy <= practicePolicy.demoteAccuracy ? difficultyLevels[0] : practicePolicy.startDifficulty;
    reviewTopics = missionReviewTopics(missionQuizAttempts, previousSessions, allPracticeQuestions, lessonReviewEvents).map(topic => topic.topic);
}

function renderPracticeReview() {
    const topics = missionReviewTopics(missionQuizAttempts, previousSessions, allPracticeQuestions, lessonReviewEvents);
    renderReviewTopics(reviewContainer, topics, new Map([[missionId, chapterId]]),
        practiceHistoryUnavailable ? "Saved review topics are temporarily unavailable. You can still complete practice."
            : previousSessions.length ? "Your latest saved attempts show no topics needing extra review."
            : "Finish practice to start tracking topics for review.");
    const focus = requestedTopic ? allPracticeQuestions.find(question =>
        typeof question.topic === "string" && question.topic.trim() === requestedTopic) : null;
    const label = focus?.topicLabel || focus?.topic;
    reviewMode.textContent = (label ? `Practicing: ${label}. ` : "") +
        (adaptiveMode ? "Question difficulty adjusts as you practice."
            : "Practice follows the available question order.");
}

async function refreshPracticeReview() {
    const generation = practiceSessionGeneration;
    await loadPracticeHistory();
    if (generation !== practiceSessionGeneration) return;
    renderPracticeReview();
    renderPracticeNextSteps();
}

function renderPracticeNextSteps() {
    const container = document.getElementById("practiceNextSteps");
    if (!container || !practiceFinished) return;
    container.replaceChildren();
    if (practiceHistoryUnavailable) {
        container.textContent = "Your session was saved, but remaining review topics could not be confirmed. You can retry the quiz or refresh your review later.";
        return;
    }
    const topics = missionReviewTopics(missionQuizAttempts, previousSessions, allPracticeQuestions, lessonReviewEvents).filter(topic=>topic.missionId===missionId);
    const heading = document.createElement("h3");
    heading.textContent = topics.length ? "Topics still worth reviewing" : "Ready for another quiz attempt?";
    const description = document.createElement("p");
    description.textContent = topics.length ? "Your saved evidence suggests more practice on these topics. You can also retry the main quiz when ready."
        : "Your saved evidence currently shows no topics needing extra review. The main quiz will check your understanding.";
    container.append(heading, description);
    const reached=missionTopicStates(missionQuizAttempts,previousSessions,allPracticeQuestions,lessonReviewEvents).filter(t=>t.missionId===missionId&&t.state==='practice-goal-reached');
    for(const topic of reached){const note=document.createElement('p');note.className='practice-goal-reached';note.textContent=topic.label+': practice goal reached using '+topic.distinctCorrect+' different questions across '+topic.cleanSessions+' successful sessions. This is practice evidence; the mission quiz still checks your understanding.';container.append(note);}
    if (topics.length) {
        const cards = document.createElement("div");cards.className="practice-review-grid";
        renderReviewTopics(cards,topics,new Map([[missionId,chapterId]]),"");container.append(cards);
    }
}

function selectNextQuestion() {

    if (remainingQuestions.length === 0) {
        return null;
    }

    // Preserve original order for missions
    // without complete difficulty/topic tags.
    if (!adaptiveMode) {
        return remainingQuestions.shift();
    }

    let bestIndex = 0;
    let bestDistance = Infinity;
    let bestTopicRank = Infinity;

    remainingQuestions.forEach((question, index) => {

        const difficulty =
            normalizeDifficulty(question.difficulty);

        const distance =
            difficultyDistance(
                difficulty,
                targetDifficulty
            );

        const topicIndex =
            reviewTopics.indexOf(typeof question.topic === "string" ? question.topic.trim() : "");

        const topicRank =
            topicIndex === -1
                ? Infinity
                : practiceResults.filter(result => result.topic === question.topic.trim()).length;

        // Cover each weak topic before repeating one; then choose the closest
        // difficulty to the current learning need. Preserve order for ties.
        if (
            topicRank < bestTopicRank ||
            (topicRank === bestTopicRank && distance < bestDistance)
        ) {

            bestDistance = distance;
            bestTopicRank = topicRank;
            bestIndex = index;
        }
    });

    return remainingQuestions.splice(bestIndex, 1)[0];
}

/* ==========================================
   UPDATE ADAPTIVE DIFFICULTY
========================================== */

function updateAdaptiveDifficulty(firstTryCorrect) {

    if (!adaptiveMode || !currentQuestion) {
        return;
    }

    const difficulty =
        normalizeDifficulty(currentQuestion.difficulty);

    const currentLevel =
        difficultyLevels.indexOf(difficulty);

    const nextLevel = firstTryCorrect
        ? Math.min(currentLevel + 1, difficultyLevels.length - 1)
        : Math.max(currentLevel - 1, 0);

    targetDifficulty =
        difficultyLevels[nextLevel];

    console.log(
        "[Adaptive Practice] Next target:",
        targetDifficulty
    );
}

/* ==========================================
   LOAD PRACTICE
========================================== */

function renderGuidedPracticeIntro(mission,resume) {
    document.getElementById('guidedPracticeIntro')?.remove();
    if(params.get('review')!=='1'||resume)return;
    const intro=document.createElement('section');intro.id='guidedPracticeIntro';intro.className='guided-practice-intro';intro.setAttribute('aria-labelledby','guidedPracticeTitle');
    const add=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;intro.append(el);return el;};
    const topic=allPracticeQuestions.find(q=>q.topic?.trim()===requestedTopic);
    add('span','UNDERSTAND ? PRACTISE ? TRY AGAIN').className='eyebrow';
    const title=add('h2',topic?.topicLabel||topic?.topic||'Your personalized review');title.id='guidedPracticeTitle';title.tabIndex=-1;
    const evidence=missionReviewTopics(missionQuizAttempts,previousSessions,allPracticeQuestions,lessonReviewEvents).find(t=>t.topic===requestedTopic);
    add('p',evidence?.source==='quiz'?'Your saved mission quiz recommended this topic for review. Take a moment to revisit the lesson before answering new practice questions.':evidence?'Your saved practice suggests another look at this topic. Review the lesson ideas, then practise at your own pace.':'You chose to review this topic. Revisit the lesson ideas, then practise when you feel ready.');
    if(typeof mission?.lessonRecap==='string'&&mission.lessonRecap.trim()){add('h3','Mission refresher');add('p',mission.lessonRecap).className='guided-practice-recap';}
    else add('p','Open the lesson for a refresher. You can return here when you are ready to practise.');
    add('p','Practice adjusts difficulty as you answer and explains your mistakes. It does not award mission XP or complete the mission.');
    const actions=document.createElement('div');actions.className='guided-practice-actions';
    const lesson=document.createElement('a');lesson.textContent='Review Lesson';lesson.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId});lesson.className='text-button';
    const begin=document.createElement('button');begin.type='button';begin.className='begin-mission-button';begin.textContent='Start Targeted Practice';
    begin.addEventListener('click',()=>{intro.remove();practiceQuestionCard.hidden=false;practiceQuestion.tabIndex=-1;practiceQuestion.focus({preventScroll:true});});
    actions.append(lesson,begin);intro.append(actions);practiceQuestionCard.hidden=true;practiceContent.prepend(intro);title.focus({preventScroll:true});
}

async function loadPractice() {
    if (!currentUser || practiceLoadPending) return;
    const generation = practiceSessionGeneration;
    const loadingUser = currentUser;
    const isCurrent = () => generation === practiceSessionGeneration && currentUser?.uid === loadingUser?.uid;

    if (!chapterId || !missionId) {

        showError(
            "The chapter or mission was not selected."
        );

        return;
    }

    practiceLoadPending = true;
    practiceLoading.hidden = false;
    practiceError.hidden = true;
    practiceContent.hidden = true;
    if (retryPracticeLoadButton) retryPracticeLoadButton.hidden = true;
    if (practiceChoices) practiceChoices.hidden = false;

    try {
        const reviewMission = await requireLearningAccess(chapterId, missionId);
        if (!isCurrent()) return;

        const quizSnapshot = await getDocs(query(collection(db, "quizzes"), where("missionId", "==", missionId)));
        if (!isCurrent()) return;
        const quiz = quizSnapshot.docs.map(item => item.data()).find(item => item.status === "active");
        practicePolicy = requirePracticePolicy(quiz?.practicePolicy);
        difficultyLevels = practicePolicy.difficultyLevels;
        const attemptsSnapshot = await getDocs(query(collection(db, "studentQuizAttempts"), where("userId", "==", currentUser.uid)));
        if (!isCurrent()) return;
        missionQuizAttempts = attemptsSnapshot.docs.map(item => ({ ...item.data(), id: item.id }))
            .filter(item => item.missionId === missionId)
            .sort((a,b) => (b.completedAt?.toMillis?.() || 0) - (a.completedAt?.toMillis?.() || 0) || b.id.localeCompare(a.id));
        const snapshot = await getDocs(
            query(collection(db, "practiceQuestions"), where("missionId", "==", missionId))
        );

        if (!isCurrent()) return;
        const allQuestions = [];

        snapshot.forEach((documentSnapshot) => {

            allQuestions.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            });
        });

        practiceQuestions = allQuestions
            .filter((question) =>
                question.missionId === missionId &&
                question.status === "active"
            )
            .sort((a, b) =>
                (Number(a.order) || 0) -
                (Number(b.order) || 0)
            );

        allPracticeQuestions = [...practiceQuestions];
        await loadPracticeHistory();
        if (!isCurrent()) return;
        try{const events=await getDocs(query(collection(db,'studentReviewEvents'),where('userId','==',currentUser.uid)));if(!isCurrent())return;lessonReviewEvents=events.docs.map(d=>({...d.data(),id:d.id})).filter(e=>e.userId===currentUser.uid);}catch{lessonReviewEvents=[];}
        if(!isCurrent())return;
        reviewTopics = missionReviewTopics(missionQuizAttempts, previousSessions, allPracticeQuestions, lessonReviewEvents).map(item => item.topic);
        practiceDraft?.close();
        practiceDraftReady = false;
        practiceDraft = learningDraft("practice",chapterId,missionId,practiceDraftStatus);
        const savedDraft = await practiceDraft.read();
        if (!isCurrent()) return;
        practiceDraftVersion = stableDraftVersion({policy:practicePolicy,questions:allPracticeQuestions.map(q=>[q.id,q.question,q.optionA,q.optionB,q.optionC,q.optionD,q.correctAnswer,q.topic,q.difficulty])});
        const resume = savedDraft?.version === practiceDraftVersion && savedDraft.topic === requestedTopic &&
            typeof savedDraft.sessionId === "string" && Array.isArray(savedDraft.pool) && Array.isArray(savedDraft.remaining) && Array.isArray(savedDraft.results) &&
            allPracticeQuestions.some(q=>q.id===savedDraft.questionId) && savedDraft.pool.every(id=>allPracticeQuestions.some(q=>q.id===id)) &&
            !previousSessions.some(session=>session.id===savedDraft.sessionId);
        if (resume && practiceHistoryUnavailable) throw new Error("We could not confirm your saved practice history. Retry loading before resuming this session.");
        if (!resume && !requestedTopic && reviewTopics.length) {
            const weak = new Set(reviewTopics);
            practiceQuestions = practiceQuestions.filter(question => weak.has(question.topic?.trim()));
        }
        if (!resume && requestedTopic) {
            practiceQuestions = practiceQuestions.filter(question =>
                typeof question.topic === "string" && question.topic.trim() === requestedTopic);
        }
        if (!resume) practiceSessionReference = doc(collection(db,"studentPracticeProgress"));
        if (resume) practiceQuestions = savedDraft.pool.map(id=>allPracticeQuestions.find(q=>q.id===id));
        if (practiceQuestions.length === 0) {

            showError(
                requestedTopic ? "This topic has no active practice questions. Return to your dashboard to choose another topic."
                    : "No practice questions are available for this mission yet."
            );

            return;
        }

        adaptiveMode = practiceQuestions.every(
            (question) =>
                normalizeDifficulty(question.difficulty) !== null &&
                typeof question.topic === "string" &&
                question.topic.trim().length > 0
        );

      
        remainingQuestions = [...practiceQuestions];

        currentPracticeIndex = 0;
        selectedAnswer = null;
        questionMastered = false;
        currentAttemptCount = 0;

        practiceFinished = false;
        practiceResults.length = 0;

        if (reviewTopics.length || (requestedTopic && params.get('review') === '1')) {
            targetDifficulty = practicePolicy.reviewDifficulty;
        }
        renderPracticeReview();

        practiceQuestionCard.hidden = false;
        practiceComplete.hidden = true;

        currentQuestion = selectNextQuestion();
        if (resume) {
            practiceSessionReference = doc(db,"studentPracticeProgress",savedDraft.sessionId);
            currentQuestion = allPracticeQuestions.find(q=>q.id===savedDraft.questionId);
            remainingQuestions = savedDraft.remaining.map(id=>allPracticeQuestions.find(q=>q.id===id)).filter(Boolean);
            currentPracticeIndex = Math.max(0,Math.min(Number(savedDraft.index)||0,practiceQuestions.length-1));
            practiceResults.push(...savedDraft.results);
            if (difficultyLevels.includes(savedDraft.targetDifficulty)) targetDifficulty = savedDraft.targetDifficulty;
        }

        console.log(
            "[Adaptive Practice] Mode:",
            adaptiveMode ? "Adaptive" : "Original order"
        );

        displayPracticeQuestion();
        if (resume) {
            currentAttemptCount = Math.max(0,Number(savedDraft.attempts)||0);
            lastIncorrectAnswer = ["A","B","C","D"].includes(savedDraft.lastIncorrectAnswer) ? savedDraft.lastIncorrectAnswer : null;
            if (currentAttemptCount > 0 && lastIncorrectAnswer && savedDraft.mastered !== true) handleIncorrectAnswer(currentQuestion,lastIncorrectAnswer);
            if (["A","B","C","D"].includes(savedDraft.answer)) {
                practiceOptions.querySelector('[data-option="'+savedDraft.answer+'"]').click();
            }
            questionMastered = savedDraft.mastered === true;
            if (questionMastered) renderCorrectPracticeFeedback(currentQuestion,currentQuestion.correctAnswer);
            else if (currentAttemptCount > 0 && !savedDraft.answer && !lastIncorrectAnswer) {
                practiceFeedback.hidden = false;
                practiceFeedbackTitle.textContent = "Continue your practice";
                practiceExplanation.textContent = "Your earlier attempts are saved. Compare the choices and try again.";
            }
        }
        practiceDraftReady = true;
        restartPracticeButton.hidden = !resume;
        savePracticeDraft();

        practiceLoading.hidden = true;
        practiceError.hidden = true;
        practiceContent.hidden = false;
        renderGuidedPracticeIntro(reviewMission,resume);

    } catch (error) {

        if (!isCurrent()) return;
        console.error(
            "Unable to load practice:",
            error
        );

        showError(
            error.message || "We could not load the practice challenge. Please try again."
        );
    } finally {
        if (isCurrent()) practiceLoadPending = false;
    }
}

/* ==========================================
   DISPLAY QUESTION
========================================== */

function displayPracticeQuestion() {

    const question = currentQuestion;

    if (!question) {
        return;
    }

    resetPracticeAiHint();

    selectedAnswer = null;
    questionMastered = false;
    currentAttemptCount = 0;
    lastIncorrectAnswer = null;

    practiceQuestion.textContent =
        question.question || "Practice Question";

    practiceProgress.textContent =
        `${currentPracticeIndex + 1} of ${Math.min(practiceQuestions.length, practicePolicy.questionLimit)}`;

    practiceFeedback.hidden = true;

    practiceFeedback.classList.remove(
        "correct",
        "incorrect"
    );

    practiceFeedbackTitle.textContent =
        "Historical Review";

    practiceExplanation.textContent = "";

    checkAnswerButton.disabled = false;
    checkAnswerButton.textContent = "Check Answer";

    practiceOptions.innerHTML = "";

    const options = [
        { key: "A", text: question.optionA },
        { key: "B", text: question.optionB },
        { key: "C", text: question.optionC },
        { key: "D", text: question.optionD }
    ];

    options.forEach((option) => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "practice-option";
        button.dataset.option = option.key;

        const optionLetter =
            document.createElement("span");

        optionLetter.className =
            "practice-option-letter";

        optionLetter.textContent = option.key;

        const optionText =
            document.createElement("span");

        optionText.className =
            "practice-option-text";

        optionText.textContent =
            option.text || "";

        button.appendChild(optionLetter);
        button.appendChild(optionText);

        button.addEventListener("click", () => {

            if (questionMastered) {
                return;
            }

            selectedAnswer = option.key;

            practiceOptions
                .querySelectorAll(".practice-option")
                .forEach((optionButton) => {
                    optionButton.classList.remove(
                        "selected"
                    );
                });

            button.classList.add("selected");

            checkAnswerButton.textContent =
                "Check Answer";
            savePracticeDraft();
        });

        practiceOptions.appendChild(button);
    });

    if (adaptiveMode) {

        console.log(
            "[Adaptive Practice] Question:",
            question.id,
            "| Difficulty:",
            question.difficulty,
            "| Topic:",
            question.topic
        );
    }
}

/* ==========================================
   CHECK ANSWER / CONTINUE
========================================== */

checkAnswerButton.addEventListener(
    "click",
    () => {

        const question = currentQuestion;

        if (!question) {
            return;
        }

        if (questionMastered) {

            goToNextPracticeQuestion();
            return;
        }

        if (!selectedAnswer) {
            if (currentAttemptCount > 0) {
                practiceOptions.querySelector("button:not(:disabled)")?.focus({preventScroll:true});
                return;
            }
            alert("Please select an answer first.");
            return;
        }

        const correctAnswer =
            String(question.correctAnswer || "")
                .trim()
                .toUpperCase();

        const chosenAnswer =
            String(selectedAnswer || "")
                .trim()
                .toUpperCase();

        currentAttemptCount++;

        if (chosenAnswer === correctAnswer) {

            handleCorrectAnswer(
                question,
                correctAnswer
            );

        } else {

            handleIncorrectAnswer(
                question,
                chosenAnswer
            );
        }
    }
);

/* ==========================================
   CORRECT ANSWER
========================================== */

function handleCorrectAnswer(
    question,
    correctAnswer
) {

    document.dispatchEvent(new CustomEvent("lakbay:answer-correct"));
    questionMastered = true;

    const firstTryCorrect =
        currentAttemptCount === 1;

    practiceResults.push({

        questionId: question.id,

        topic: question.topic || "unclassified",

        difficulty:
            normalizeDifficulty(question.difficulty) ||
            "unclassified",

        firstTryCorrect,

        attempts: currentAttemptCount
    });

    updateAdaptiveDifficulty(firstTryCorrect);
    renderCorrectPracticeFeedback(question,correctAnswer);
    savePracticeDraft();
}

function renderCorrectPracticeFeedback(question,correctAnswer) {
    practiceOptions
        .querySelectorAll(".practice-option")
        .forEach((button) => {

            const optionLetter =
                String(button.dataset.option || "")
                    .trim()
                    .toUpperCase();

            button.classList.remove(
                "selected",
                "incorrect"
            );

            if (optionLetter === correctAnswer) {
                button.classList.add("correct");
            }

            button.disabled = true;
        });

    practiceFeedback.hidden = false;

    practiceFeedback.classList.remove(
        "incorrect"
    );

    practiceFeedback.classList.add(
        "correct"
    );

    practiceFeedbackTitle.textContent =
        "You got it!";

    const correctExplanation = question.answerExplanations?.[correctAnswer];
    const explanation = typeof correctExplanation === "string" && correctExplanation.trim()
        ? correctExplanation.trim() : question.explanation;
    practiceExplanation.textContent = explanation || "That is the correct answer. Revisit the lesson if you want to explore the idea again.";
    if (typeof question.learningPoint === "string" && question.learningPoint.trim()) {
        const point = document.createElement("p");
        point.textContent = "Key idea: " + question.learningPoint.trim();
        practiceExplanation.appendChild(point);
    }

    const isFinalQuestion =
        currentPracticeIndex ===
        Math.min(practiceQuestions.length, practicePolicy.questionLimit) - 1;

    checkAnswerButton.textContent =
        isFinalQuestion
            ? "Finish Practice →"
            : "Next Practice Question →";
}

/* ==========================================
   INCORRECT ANSWER
========================================== */

function handleIncorrectAnswer(
    question,
    chosenAnswer
) {
    lastIncorrectAnswer = chosenAnswer;

    questionMastered = false;

    practiceOptions
        .querySelectorAll(".practice-option")
        .forEach((button) => {

            const optionLetter =
                String(button.dataset.option || "")
                    .trim()
                    .toUpperCase();

            button.classList.remove("incorrect");

            if (optionLetter === chosenAnswer) {
                button.classList.add("incorrect");
            }

            button.disabled = false;
        });

    practiceFeedback.hidden = false;

    practiceFeedback.classList.remove(
        "correct"
    );

    practiceFeedback.classList.add(
        "incorrect"
    );

    practiceFeedbackTitle.textContent =
        "Not quite yet.";

    // Authors can provide a hint without exposing the full solution.
    const hint = [question.answerHints?.[chosenAnswer], question.hint, question.historicalClue, question.explanation]
        .find(value => typeof value === "string" && value.trim());
    practiceExplanation.textContent = hint?.trim() || "Revisit the lesson, then compare the remaining choices. You can try again.";

    selectedAnswer = null;

    practiceOptions
        .querySelectorAll(".practice-option")
        .forEach((button) => {
            button.classList.remove("selected");
        });

    checkAnswerButton.textContent = "Choose Another Answer";
    practiceFeedbackTitle.tabIndex = -1;
    practiceFeedbackTitle.focus({preventScroll:true});
    savePracticeDraft();
}

/* ==========================================
   NEXT QUESTION
========================================== */

function goToNextPracticeQuestion() {

    if (remainingQuestions.length > 0 && practiceResults.length < practicePolicy.questionLimit) {

        currentPracticeIndex++;

        currentQuestion = selectNextQuestion();

        displayPracticeQuestion();
        savePracticeDraft();
        practiceQuestion.tabIndex = -1;
        practiceQuestion.focus({preventScroll:true});
        return;
    }

    finishPractice();
}

/* ==========================================
   SAVE PRACTICE SESSION
========================================== */

async function savePracticeSession() {
    const savingUser = currentUser;
    const savingReference = practiceSessionReference;

    if (!currentUser) {
        throw new Error(
            "No authenticated student is available."
        );
    }

    const firstTryCorrectCount =
        practiceResults.filter(
            (result) => result.firstTryCorrect
        ).length;

    const topicsForReview = [
        ...new Set(
            practiceResults
                .filter(
                    (result) => !result.firstTryCorrect
                )
                .map((result) => result.topic)
        )
    ];

    const sessionData = {

        userId: currentUser.uid,

        chapterId,
        missionId,

        completedAt: serverTimestamp(),

        totalQuestions: practiceResults.length,

        firstTryCorrectCount,

        questionResults: practiceResults.map(
            (result) => ({ ...result })
        ),

        topicsForReview
    };

    try {
        await setDoc(savingReference, sessionData);
    } catch (error) {
        // Append-only rules reject updates. A retry may refer to a write that
        // succeeded before its response was lost, so confirm that record.
        let existingSession;
        try {
            existingSession = await getDoc(savingReference);
        } catch {
            throw error;
        }
        if (!existingSession.exists() ||
            existingSession.data().userId !== savingUser.uid) throw error;
    }

    console.log(
        "[Adaptive Practice] Session saved:",
        practiceSessionReference.id
    );

    console.log(
        "[Adaptive Practice] First-try accuracy:",
        `${firstTryCorrectCount}/${practiceResults.length}`
    );

    console.log(
        "[Adaptive Practice] Topics for review:",
        topicsForReview
    );
}

/* ==========================================
   FINISH PRACTICE
========================================== */

async function finishPractice() {

    if (practiceFinished) {
        return;
    }

    practiceFinished = true;
    restartPracticeButton.hidden = true;

    resetPracticeAiHint();

    practiceQuestionCard.hidden = true;
    practiceComplete.hidden = false;
    const completeTitle = document.getElementById("practiceCompleteTitle");
    if (completeTitle) { completeTitle.tabIndex=-1; completeTitle.focus({preventScroll:true}); }

    const summary = document.getElementById("practiceSessionSummary");
    if (summary) {
        summary.replaceChildren();
        const title=document.createElement('h3');title.textContent='Your practice discoveries';summary.append(title);
        const accuracy = document.createElement("p");accuracy.className='practice-session-score';
        accuracy.textContent = practiceResults.filter(result=>result.firstTryCorrect).length + " of " + practiceResults.length + " answered correctly on the first try. Practice does not complete the mission; retry the main quiz when ready.";
        summary.append(accuracy);
        const topicCards=document.createElement('div');topicCards.className='practice-session-topics';summary.append(topicCards);
        for (const topic of new Set(practiceResults.map(result=>result.topic).filter(Boolean))) {
            const results = practiceResults.filter(result=>result.topic===topic);
            const question = allPracticeQuestions.find(question=>question.topic?.trim()===topic);
            const card=document.createElement('section');
            const label=document.createElement('h4');label.textContent=question?.topicLabel||topic;
            const line=document.createElement('p');
            const neededHelp=results.some(result=>!result.firstTryCorrect);
            card.dataset.support=String(neededHelp);
            line.textContent=neededHelp?'You worked through this topic with another try. Revisit the lesson if you want a reminder.':'You answered these questions correctly on your first try in this session.';
            card.append(label,line);
            if(neededHelp){const link=document.createElement('a');link.className='text-button';link.textContent='Revisit this lesson';link.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,reviewTopic:topic});card.append(link);}
            topicCards.append(card);
        }
    }
    await persistPracticeSession();
}

async function persistPracticeSession() {
    if (!currentUser || practiceSavePending) return;
    if(globalThis.__lakbayExplorationPreview===true){
        practiceSaveStatus.textContent='Preview practice complete. This session was not saved to your learning record.';
        const next=document.getElementById('practiceNextSteps');if(next)next.textContent='You can review the lesson or try its mission quiz. Preview work does not change your saved recommendations.';
        retryPracticeSaveButton.hidden=true;retryMissionQuizButton.disabled=false;return;
    }
    const generation = practiceSessionGeneration;
    practiceSavePending = true;
    retryPracticeSaveButton.hidden = true;
    retryPracticeSaveButton.disabled = true;
    retryMissionQuizButton.disabled = true;
    practiceSaveStatus.textContent = "Saving your practice progress… Keep this page open until saving finishes.";
    const nextSteps = document.getElementById("practiceNextSteps");
    if (nextSteps) nextSteps.textContent = "Checking your saved review evidence...";

    try {

        await savePracticeSession();
        if (generation !== practiceSessionGeneration) return;
        practiceDraftReady = false;
        await practiceDraft?.clear().catch(()=>{});
        if (generation !== practiceSessionGeneration) return;
        practiceSaveStatus.textContent = "Your practice progress has been saved.";
        await refreshPracticeReview();

    } catch (error) {

        if (generation !== practiceSessionGeneration) return;
        console.error(
            "[Adaptive Practice] Save failed:",
            error
        );

        console.warn(
            "Practice was completed, but this session's learning record was not saved."
        );
        practiceSaveStatus.textContent = "We could not confirm that your practice was saved. Keep this page open, check your connection, then choose Retry Saving Progress. If you continue to the quiz now, this practice may not appear in your progress.";
        retryPracticeSaveButton.hidden = false;
        if (nextSteps) nextSteps.textContent = "Your latest session is not saved yet, so updated recommendations cannot be confirmed.";
    } finally {
        if (generation !== practiceSessionGeneration) return;
        practiceSavePending = false;
        retryPracticeSaveButton.disabled = false;
        retryMissionQuizButton.disabled = false;
    }
}

retryPracticeSaveButton.addEventListener("click", persistPracticeSession);

/* ==========================================
   RETRY ORIGINAL MISSION QUIZ
========================================== */

retryMissionQuizButton.addEventListener(
    "click",
    () => {

        window.location.href =
            `quiz.html?chapter=${encodeURIComponent(
                chapterId
            )}&mission=${encodeURIComponent(
                missionId
            )}`;
    }
);

/* ==========================================
   ERROR
========================================== */

function showError(message) {
    if (practiceChoices) practiceChoices.hidden = !currentUser || !chapterId || !missionId;
    if (retryPracticeLoadButton) retryPracticeLoadButton.hidden = !currentUser || !chapterId || !missionId;

    practiceLoading.hidden = true;
    practiceContent.hidden = true;

    practiceError.textContent = message;
    practiceError.hidden = false;
}

/* ==========================================
   START AFTER AUTHENTICATION
========================================== */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        practiceDraft?.close();
        practiceDraftReady = false;
        practiceSessionGeneration++;
        practiceLoadStarted = false;
        practiceLoadPending = false;
        practiceSavePending = false;
        practiceAiRequestSerial++;
        currentUser = null;
        currentQuestion = null;
        practiceQuestions = [];
        remainingQuestions = [];
        previousSessions = [];
        missionQuizAttempts = [];
        practiceResults.length = 0;

        showError(
            "Please sign in to access practice."
        );

        return;
    }

    if (currentUser?.uid !== user.uid) {
        practiceSessionGeneration++;
        practiceAiRequestSerial++;
        practiceLoadPending = false;
        practiceLoadStarted = false;
        practiceSavePending = false;
        practiceSessionReference = doc(collection(db, "studentPracticeProgress"));
        practiceContent.hidden = true;
        practiceError.hidden = true;
        practiceLoading.hidden = false;
    }
    currentUser = user;

    // Avoid restarting the quiz if Firebase
    // refreshes the authentication state.
    if (!practiceLoadStarted) {

        practiceLoadStarted = true;
        loadPractice();
    }
});

// ==========================================
// PRACTICE AI HINT BUTTON
// ==========================================

let practiceAiRequestSerial = 0;

practiceAiHintButton?.addEventListener(
    "click",
    async () => {

        if (
            !aiAssistanceAvailable ||
            !currentQuestion?.id ||
            !chapterId ||
            !missionId ||
            practiceFinished
        ) {
            return;
        }

        const serial = ++practiceAiRequestSerial;
        const questionId = currentQuestion.id;

        practiceAiHintButton.disabled = true;

        practiceAiHintResponse.hidden = false;
        practiceAiHintResponse.textContent =
            "Kinukuha ang AI hint...";

        const text = await requestAiAssistance({
            type: "practice_hint",
            chapterId,
            missionId,
            contentId: questionId
        });

        if (
            serial !== practiceAiRequestSerial ||
            currentQuestion?.id !== questionId ||
            practiceFinished
        ) {
            return;
        }

        practiceAiHintResponse.textContent = text;
        practiceAiHintButton.disabled = false;
    }
);

const practiceRoute = new URLSearchParams({chapter: chapterId || "", mission: missionId || ""});
const practiceLessonLink = document.getElementById("practiceLessonLink");
const practiceRetryLink = document.getElementById("practiceRetryLink");
if (practiceLessonLink) practiceLessonLink.href = 'story.html?' + practiceRoute;
if (practiceRetryLink) practiceRetryLink.href = 'quiz.html?' + practiceRoute;

retryPracticeLoadButton?.addEventListener("click", () => loadPractice());

mountLearningNavigation(document.querySelector(".practice-page"), "Adaptive Practice");

function savePracticeDraft() {
    if (!practiceDraftReady || !currentQuestion || practiceFinished) return;
    practiceDraft?.save({version:practiceDraftVersion,topic:requestedTopic,sessionId:practiceSessionReference.id,
        pool:practiceQuestions.map(q=>q.id),remaining:remainingQuestions.map(q=>q.id),questionId:currentQuestion.id,
        index:currentPracticeIndex,answer:selectedAnswer,attempts:currentAttemptCount,mastered:questionMastered,lastIncorrectAnswer,
        targetDifficulty,results:practiceResults.map(result=>({...result}))});
}
