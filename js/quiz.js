import { submitStudentActivity } from "./student-rewards-client.js";
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
    getDocs
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

let currentMission = null;

let currentQuiz = null;

let questions = [];

let currentQuestionIndex = 0;

let studentAnswers = {};

let lockedAnswers = {};

let quizSubmitted = false;

let lastQuizPassed = false;

let lastMissionReward = 0;

let lastArtifactResult = null;

let lastCompletionResult = null;


/* ==========================================
   LOAD QUIZ
========================================== */

async function loadQuiz() {

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


    try {
        await requireLearningAccess(chapterId, missionId);

        /* ==================================
           RESET PAGE STATE
        ================================== */

        currentMission =
            null;

        currentQuiz =
            null;

        questions =
            [];

        currentQuestionIndex =
            0;
studentAnswers =
    {};

lockedAnswers =
    {};

quizSubmitted =
    false;

        lastQuizPassed =
            false;

        lastMissionReward =
            0;

        lastArtifactResult =
            null;

        lastCompletionResult =
            null;


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
                collection(
                    db,
                    "quizzes"
                )
            );


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


        /* ==================================
           LOAD QUESTIONS
        ================================== */

        const questionSnapshot =
            await getDocs(
                collection(
                    db,
                    "questions"
                )
            );


        const allQuestions = [];


        questionSnapshot.forEach(
            (documentSnapshot) => {

                allQuestions.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        questions =
            allQuestions

                .filter(
                    (question) =>

                        question.quizId ===
                            currentQuiz.id &&

                        question.status ===
                            "active"
                )

                .sort(
                    (a, b) =>

                        (Number(a.order) || 0) -
                        (Number(b.order) || 0)
                );


        if (
            questions.length === 0
        ) {

            showError(
                "No questions are available for this quiz yet."
            );

            return;
        }


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


        displayQuestion();


        quizLoading.hidden =
            true;

        quizError.hidden =
            true;

        quizContent.hidden =
            false;


    } catch (error) {

        console.error(
            "Unable to load quiz:",
            error
        );


        showError(
            error instanceof LearningAccessError ? error.message : "We could not load this quiz. Please try again."
        );

    }

}


function displayMissionCheckpoints() {

    if (
        !missionCheckpoints ||
        questions.length === 0
    ) {

        return;

    }


    missionCheckpoints.innerHTML =
        "";


    questions.forEach(
        (question, index) => {

            const checkpoint =
                document.createElement(
                    "div"
                );


            checkpoint.className =
                "mission-checkpoint";


            if (
                lockedAnswers[
    question.id
] === true
            ) {

                checkpoint.classList.add(
                    "answered"
                );

            }


            if (
                index ===
                currentQuestionIndex
            ) {

                checkpoint.classList.add(
                    "current"
                );

            }


            const dot =
                document.createElement(
                    "span"
                );


            dot.className =
                "mission-checkpoint-dot";


            dot.textContent =
                studentAnswers[
                    question.id
                ]
                    ? "\u2713"
                    : `${index + 1}`;


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "mission-checkpoint-label";


            label.textContent =
                `Checkpoint ${index + 1}`;


            checkpoint.appendChild(
                dot
            );


            checkpoint.appendChild(
                label
            );


            missionCheckpoints.appendChild(
                checkpoint
            );

        }
    );

}


/* ==========================================
   DISPLAY QUESTION
========================================== */

function displayQuestion() {

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


    const answerLocked =
        lockedAnswers[
            question.id
        ] === true;


    /* ==================================
       CHECKPOINT NUMBER
    ================================== */

    questionNumber.textContent =
        `CHECKPOINT ${questionPosition}`;


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


                    studentAnswers[
                        question.id
                    ] =
                        option.key;


                    displayQuestion();

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

        if (answerLocked) {

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
        `Checkpoint ${questionPosition} of ${questions.length}`;


    const answeredCount =
        Object.keys(
            studentAnswers
        ).length;


    answeredProgress.textContent =
        `${answeredCount} answered`;


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


    if (!answerLocked) {

        nextQuestionButton.textContent =
            "Lock In Answer \u{1F512}";


        nextQuestionButton.disabled =
            !hasSelectedAnswer;

    } else {

        nextQuestionButton.disabled =
            false;


        nextQuestionButton.textContent =
            isLastQuestion
                ? "Complete Mission Trial \u2192"
                : "Continue to Next Checkpoint \u2192";

    }

}


/* ==========================================
   PREVIOUS QUESTION
========================================== */

previousQuestionButton.addEventListener(
    "click",
    () => {

        if (
            currentQuestionIndex <= 0 ||
            quizSubmitted
        ) {

            return;

        }


        currentQuestionIndex--;


        displayQuestion();

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
                "Choose an answer before locking in this checkpoint."
            );

            return;

        }


        /* ==================================
           LOCK ANSWER + DISCOVER CLUE
        ================================== */

        if (
            lockedAnswers[
                currentQuestion.id
            ] !== true
        ) {

            lockedAnswers[
                currentQuestion.id
            ] =
                true;


            displayQuestion();


            if (historicalClueCard) {

                historicalClueCard.scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "nearest"
                    }
                );

            }


            return;

        }


        const isLastQuestion =
            currentQuestionIndex ===
            questions.length - 1;


        /* ==================================
           NEXT CHECKPOINT
        ================================== */

        if (!isLastQuestion) {

            currentQuestionIndex++;


            displayQuestion();


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

        const allLocked =
            questions.every(
                (question) =>

                    lockedAnswers[
                        question.id
                    ] === true
            );


        if (!allLocked) {

            alert(
                "Complete every checkpoint before finishing the Mission Trial."
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

async function submitQuiz() {

    if (
        quizSubmitted ||
        !currentUser ||
        !currentQuiz ||
        !currentMission
    ) {

        return;

    }


    quizSubmitted =
        true;


    nextQuestionButton.disabled =
        true;

    previousQuestionButton.disabled =
        true;


    try {

        /* ==================================
           CALCULATE SCORE
        ================================== */

        let correctAnswers =
            0;


        questions.forEach(
            (question) => {

                const selectedAnswer =
                    studentAnswers[
                        question.id
                    ];


                if (
                    String(selectedAnswer || "").trim().toUpperCase() ===
                    String(question.correctAnswer || "").trim().toUpperCase()
                ) {

                    correctAnswers++;

                }

            }
        );


        const percentage =
            Math.round(
                (
                    correctAnswers /
                    questions.length
                ) * 100
            );


        const passingScore =
            Number(
                currentQuiz.passingScore
            ) || 60;


        const passed =
            percentage >=
            passingScore;


        lastQuizPassed =
            passed;


        /* ==================================
           PASSED
        ================================== */

        if (passed) {

            const completionResult =
                await completeMission(
                    percentage
                );


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

        console.error(
            "Unable to submit quiz:",
            error
        );


        quizSubmitted =
            false;


        nextQuestionButton.disabled =
            false;

        previousQuestionButton.disabled =
            currentQuestionIndex === 0;


        alert(
            "We could not submit your quiz. Please try again."
        );

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

function displayAnswerReview() {

    if (
        !quizAnswerReview ||
        !quizAnswerReviewList
    ) {

        return;

    }


    quizAnswerReviewList.innerHTML =
        "";


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


            const explanation =
                String(
                    question.explanation ||
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

function showResult(
    percentage,
    correctAnswers,
    passed
) {

    questionCard.hidden =
        true;


    quizResult.hidden =
        false;


    quizScore.textContent =
        `${percentage}%`;


    /* ======================================
       LEARNING REVIEW
    ====================================== */

    displayAnswerReview();


    /* ======================================
       PASSED
    ====================================== */

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
        Number(
            currentQuiz.passingScore
        ) || 60;


   quizResultMessage.textContent =
    `You completed ${correctAnswers} out of ${questions.length} checkpoints correctly. You need ${passingScore}% to pass the Mission Trial. Review what you missed, practice, then return when you're ready.`;


    /*
     * Keep the existing retry option available.
     * The main learning path still directs the
     * student to Practice First.
     */

    retryQuizButton.hidden =
        false;


    continueResultButton.textContent =
        "Practice First \u2192";

}


/* ==========================================
   DISPLAY MISSION REWARDS
========================================== */

function displayMissionRewards() {

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


    missionRewardCard.hidden =
        false;


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

retryQuizButton.addEventListener(
    "click",
    () => {

        /*
         * Reset the assessment state.
         * No Firestore reward state is changed.
         */

        currentQuestionIndex =
            0;


        studentAnswers =
    {};

lockedAnswers =
    {};

quizSubmitted =
    false;


        lastQuizPassed =
            false;


        lastMissionReward =
            0;


        lastArtifactResult =
            null;


        lastCompletionResult =
            null;


        /* ==================================
           RESET RESULT UI
        ================================== */

        quizResult.hidden =
            true;


        questionCard.hidden =
            false;


        if (quizAnswerReview) {

            quizAnswerReview.hidden =
                true;

        }


        if (quizAnswerReviewList) {

            quizAnswerReviewList.innerHTML =
                "";

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


        nextQuestionButton.disabled =
            false;


        previousQuestionButton.disabled =
            true;


        displayQuestion();

    }
);


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
         * send the student to practice.
         */

        if (lastQuizPassed) {

            window.location.href =
                `mission.html?chapter=${encodeURIComponent(
                    chapterId
                )}`;

            return;

        }


        window.location.href =
            `practice.html?chapter=${encodeURIComponent(
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
   MOBILE SIDEBAR
========================================== */

const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );


const sidebar =
    document.querySelector(
        ".sidebar"
    );


if (
    mobileMenuButton &&
    sidebar
) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

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

            currentUser =
                null;


            window.location.href =
                "login.html";


            return;

        }


        /* ==================================
           AUTHENTICATED STUDENT
        ================================== */

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


                const level =
                    Number(
                        userData.level
                    ) ||
                    (
                        Math.floor(
                            xp / 100
                        ) + 1
                    );


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

        await loadQuiz();

    }
);
