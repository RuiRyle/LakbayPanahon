import { requestAiAssistance, aiAssistanceLocalOnly } from "./ai-assistance-client.js";
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
        practiceAiHintButton.disabled = !aiAssistanceLocalOnly;
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

let adaptiveMode = false;
let targetDifficulty = "medium";

let currentUser = null;
let practiceFinished = false;
let practiceLoadStarted = false;

let previousSessions = [];
let reviewTopics = [];
let practiceHistoryUnavailable = false;

const practiceResults = [];
// Reuse this ID after a failed response so retries cannot create duplicates.
const practiceSessionReference = doc(collection(db, "studentPracticeProgress"));

const difficultyLevels = [
    "easy",
    "medium",
    "hard"
];

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

    practiceHistoryUnavailable = false;

    previousSessions = [];
    reviewTopics = [];
    targetDifficulty = "medium";

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
                "[Adaptive Practice] No previous history. Starting at medium."
            );

            return;
        }

        analyzePracticeHistory();

    } catch (error) {

        // A failed history read must not prevent
        // students from completing practice.

        console.warn(
            "[Adaptive Practice] History unavailable. Using medium-first fallback:",
            error
        );

        practiceHistoryUnavailable = true;

        previousSessions = [];
        reviewTopics = [];
        targetDifficulty = "medium";
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
    targetDifficulty = accuracy >= 0.8 ? "hard" : accuracy <= 0.4 ? "easy" : "medium";
    reviewTopics = topics.filter(topic => topic.missed > 0).map(topic => topic.topic);
}

function renderPracticeReview() {
    const topics = reviewTopicsFromHistory(previousSessions, allPracticeQuestions)
        .filter(topic => topic.missed > 0);
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
    await loadPracticeHistory();
    renderPracticeReview();
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
                : topicIndex;

        // Difficulty is the primary criterion.
        // Historical review priority breaks ties.
        // Original order breaks any remaining ties.
        if (
            distance < bestDistance ||
            (
                distance === bestDistance &&
                topicRank < bestTopicRank
            )
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
        ? Math.min(currentLevel + 1, 2)
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

async function loadPractice() {

    if (!chapterId || !missionId) {

        showError(
            "The chapter or mission was not selected."
        );

        return;
    }

    try {
        await requireLearningAccess(chapterId, missionId);

        const snapshot = await getDocs(
            query(collection(db, "practiceQuestions"), where("missionId", "==", missionId))
        );

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
        if (requestedTopic) {
            practiceQuestions = practiceQuestions.filter(question =>
                typeof question.topic === "string" && question.topic.trim() === requestedTopic);
        }
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

        targetDifficulty = "medium";
        practiceFinished = false;
        practiceResults.length = 0;

        // Load history before selecting Question 1.
        // This is the Phase 3 addition.
        await loadPracticeHistory();
        renderPracticeReview();

        practiceQuestionCard.hidden = false;
        practiceComplete.hidden = true;

        currentQuestion = selectNextQuestion();

        console.log(
            "[Adaptive Practice] Mode:",
            adaptiveMode ? "Adaptive" : "Original order"
        );

        displayPracticeQuestion();

        practiceLoading.hidden = true;
        practiceError.hidden = true;
        practiceContent.hidden = false;

    } catch (error) {

        console.error(
            "Unable to load practice:",
            error
        );

        showError(
            error instanceof LearningAccessError ? error.message : "We could not load the practice challenge. Please try again."
        );
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

    practiceQuestion.textContent =
        question.question || "Practice Question";

    practiceProgress.textContent =
        `${currentPracticeIndex + 1} of ${practiceQuestions.length}`;

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

    practiceExplanation.textContent =
        question.explanation ||
        "Good work. You understood the idea. Keep it in mind when you retry the mission quiz.";

    const isFinalQuestion =
        currentPracticeIndex ===
        practiceQuestions.length - 1;

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

    // Avoid revealing the answer before retry.
    practiceExplanation.textContent =
        "Think about the lesson and compare the remaining choices. You can try again.";

    selectedAnswer = null;

    practiceOptions
        .querySelectorAll(".practice-option")
        .forEach((button) => {
            button.classList.remove("selected");
        });

    checkAnswerButton.textContent = "Try Again";
}

/* ==========================================
   NEXT QUESTION
========================================== */

function goToNextPracticeQuestion() {

    if (remainingQuestions.length > 0) {

        currentPracticeIndex++;

        currentQuestion = selectNextQuestion();

        displayPracticeQuestion();
        return;
    }

    finishPractice();
}

/* ==========================================
   SAVE PRACTICE SESSION
========================================== */

async function savePracticeSession() {

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
        await setDoc(practiceSessionReference, sessionData);
    } catch (error) {
        // Append-only rules reject updates. A retry may refer to a write that
        // succeeded before its response was lost, so confirm that record.
        let existingSession;
        try {
            existingSession = await getDoc(practiceSessionReference);
        } catch {
            throw error;
        }
        if (!existingSession.exists() ||
            existingSession.data().userId !== currentUser.uid) throw error;
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

    resetPracticeAiHint();

    practiceQuestionCard.hidden = true;
    practiceComplete.hidden = false;

    await persistPracticeSession();
}

async function persistPracticeSession() {
    retryPracticeSaveButton.hidden = true;
    retryPracticeSaveButton.disabled = true;
    retryMissionQuizButton.disabled = true;
    practiceSaveStatus.textContent = "Saving your practice progress...";

    try {

        await savePracticeSession();
        practiceSaveStatus.textContent = "Your practice progress has been saved.";
        await refreshPracticeReview();

    } catch (error) {

        console.error(
            "[Adaptive Practice] Save failed:",
            error
        );

        console.warn(
            "Practice was completed, but this session's learning record was not saved."
        );
        practiceSaveStatus.textContent = "Your practice record was not saved. Retry saving, or continue to the mission quiz.";
        retryPracticeSaveButton.hidden = false;
    } finally {
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

    practiceLoading.hidden = true;
    practiceContent.hidden = true;

    practiceError.textContent = message;
    practiceError.hidden = false;
}

/* ==========================================
   MOBILE SIDEBAR
========================================== */

const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );

const sidebar =
    document.querySelector(".sidebar");

if (mobileMenuButton && sidebar) {

    mobileMenuButton.addEventListener(
        "click",
        () => {
            sidebar.classList.toggle("open");
        }
    );
}

/* ==========================================
   START AFTER AUTHENTICATION
========================================== */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        currentUser = null;

        showError(
            "Please sign in to access practice."
        );

        return;
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
            !aiAssistanceLocalOnly ||
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
