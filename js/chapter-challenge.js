import { submitStudentActivity } from "./student-rewards-client.js";
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

const challengeChapterTitle =
    document.getElementById(
        "challengeChapterTitle"
    );

const challengeDescription =
    document.getElementById(
        "challengeDescription"
    );

const beginChallengeButton =
    document.getElementById(
        "beginChallengeButton"
    );

const backToMissionsButton =
    document.getElementById(
        "backToMissionsButton"
    );

const challengeStatus =
    document.getElementById(
        "challengeStatus"
    );


/* ==========================================
   URL
========================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

const chapterId =
    params.get("chapter");


/* ==========================================
   STATE
========================================== */

let activeChallenge = null;

let challengeQuestions = [];

let currentQuestionIndex = 0;

let selectedAnswer = null;

/* ==========================================
   MATCHING GAME STATE
========================================== */

let selectedMatches = {};

/* ==========================================
   TRADE SIMULATION â€” GAME STATE
========================================== */

let selectedTradeQuantity = 0;

let correctAnswers = 0;


let studentAnswers = {};

/* ==========================================
   CHAPTER CHALLENGE â€” GAME TYPES
========================================== */

function getChallengeGameType(question) {

    const gameType = String(
        question?.gameType || ""
    ).trim();

    const supportedTypes = [
        "historicalDecision",
        "matching",
        "tradeSimulation"
    ];

    return supportedTypes.includes(gameType)
        ? gameType
        : "multipleChoice";

}

let challengeStarted = false;

let currentChapter = null;


/* ==========================================
   LOAD CHAPTER CHALLENGE
========================================== */

async function loadChapterChallenge() {

    if (!chapterId) {

        showError(
            "No chapter was selected."
        );

        return;
    }


    const user =
        auth.currentUser;


    if (!user) {

        showError(
            "You must be logged in."
        );

        return;
    }


    try {
        await requireLearningAccess(chapterId);

        /* ==================================
           LOAD CHAPTER
        ================================== */

        const chapterSnapshot =
            await getDoc(
                doc(
                    db,
                    "chapters",
                    chapterId
                )
            );


        if (!chapterSnapshot.exists()) {

            showError(
                "Chapter could not be found."
            );

            return;
        }


        currentChapter = {

            id:
                chapterSnapshot.id,

            ...chapterSnapshot.data()

        };


        challengeChapterTitle.textContent =
            currentChapter.title ||
            "Chapter Challenge";


        /* ==================================
           LOAD ACTIVE MISSIONS
        ================================== */

        const missionSnapshot =
            await getDocs(
                collection(
                    db,
                    "missions"
                )
            );


        const chapterMissions = [];


        missionSnapshot.forEach(
            (documentSnapshot) => {

                const mission =
                    documentSnapshot.data();


                if (
                    mission.chapterId ===
                        chapterId &&

                    mission.status ===
                        "active"
                ) {

                    chapterMissions.push({

                        id:
                            documentSnapshot.id,

                        ...mission

                    });

                }

            }
        );


        if (
            chapterMissions.length === 0
        ) {

            showError(
                "This chapter has no active missions."
            );

            return;
        }


        /* ==================================
           LOAD STUDENT MISSION PROGRESS
        ================================== */

        const progressSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "studentProgress"
                    ),
                    where(
                        "userId",
                        "==",
                        user.uid
                    )
                )
            );


        const completedMissionIds =
            new Set();


        progressSnapshot.forEach(
            (documentSnapshot) => {

                const progress =
                    documentSnapshot.data();


                if (
                    progress.userId ===
                        user.uid &&

                    progress.completed ===
                        true
                ) {

                    completedMissionIds.add(
                        progress.missionId
                    );

                }

            }
        );


        /* ==================================
           VERIFY CHALLENGE UNLOCK
        ================================== */

        const challengeUnlocked =
            chapterMissions.every(
                (mission) =>
                    completedMissionIds.has(
                        mission.id
                    )
            );


        if (!challengeUnlocked) {

            beginChallengeButton.disabled =
                true;


            challengeStatus.textContent =
                "ðŸ”’ Complete all chapter missions to unlock this challenge.";


            return;
        }


        /* ==================================
           LOAD CHALLENGE
        ================================== */

        const challengeSnapshot =
            await getDocs(
                collection(
                    db,
                    "chapterChallenges"
                )
            );


        const matchingChallenges = [];


        challengeSnapshot.forEach(
            (documentSnapshot) => {

                const challenge =
                    documentSnapshot.data();


                if (
                    challenge.chapterId ===
                        chapterId &&

                    challenge.status ===
                        "active"
                ) {

                    matchingChallenges.push({

                        id:
                            documentSnapshot.id,

                        ...challenge

                    });

                }

            }
        );


        matchingChallenges.sort(
            (a, b) =>

                (Number(a.order) || 0) -
                (Number(b.order) || 0)
        );


        if (
            matchingChallenges.length === 0
        ) {

            showError(
                "No Chapter Challenge is available yet."
            );

            return;
        }


        activeChallenge =
            matchingChallenges[0];


        /* ==================================
           LOAD QUESTIONS
        ================================== */

        const questionSnapshot =
            await getDocs(
                collection(
                    db,
                    "chapterChallengeQuestions"
                )
            );


        challengeQuestions = [];


        questionSnapshot.forEach(
            (documentSnapshot) => {

                const question =
                    documentSnapshot.data();


                if (
                    question.challengeId ===
                        activeChallenge.id &&

                    question.status ===
                        "active"
                ) {

                    challengeQuestions.push({

                        id:
                            documentSnapshot.id,

                        ...question

                    });

                }

            }
        );


        challengeQuestions.sort(
            (a, b) =>

                (Number(a.order) || 0) -
                (Number(b.order) || 0)
        );

    


        if (
            challengeQuestions.length === 0
        ) {

            showError(
                "This Chapter Challenge does not have any questions yet."
            );

            return;
        }


        /* ==================================
           DISPLAY INFORMATION
        ================================== */

        if (
            activeChallenge.title
        ) {

            challengeChapterTitle.textContent =
                activeChallenge.title;

        }


        if (
            challengeDescription &&
            activeChallenge.description
        ) {

            challengeDescription.textContent =
                activeChallenge.description;

        }


        updateChallengeInfo();


        beginChallengeButton.disabled =
            false;


        challengeStatus.textContent =
            "ðŸ† Chapter Challenge unlocked!";


        beginChallengeButton.onclick =
            startChallenge;


    } catch (error) {

        console.error(
            "Unable to load Chapter Challenge:",
            error
        );


        showError(
            error instanceof LearningAccessError ? error.message : "We could not load the Chapter Challenge."
        );

    }

}


/* ==========================================
   UPDATE INTRO INFORMATION
========================================== */

function updateChallengeInfo() {

    const infoItems =
        document.querySelectorAll(
            ".chapter-challenge-info > div"
        );


    if (
        infoItems.length < 2
    ) {

        return;
    }


    const questionNumber =
        infoItems[0].querySelector(
            "strong"
        );


    const passingScore =
        infoItems[1].querySelector(
            "strong"
        );


    if (questionNumber) {

        questionNumber.textContent =
            challengeQuestions.length;

    }


    if (passingScore) {

        passingScore.textContent =
            `${
                Number(
                    activeChallenge
                        .passingScore
                ) || 70
            }%`;

    }

}


/* ==========================================
   START CHALLENGE
========================================== */

function startChallenge() {

    if (
        challengeStarted ||
        challengeQuestions.length === 0
    ) {

        return;
    }


    challengeStarted =
        true;


    currentQuestionIndex =
        0;


    selectedAnswer =
        null;


   correctAnswers =
    0;


studentAnswers =
    {};


beginChallengeButton.hidden =
    true;


    backToMissionsButton.hidden =
        true;


    challengeStatus.textContent =
        "";


    createQuestionInterface();

    displayCurrentQuestion();

}


/* ==========================================
   CREATE QUESTION INTERFACE
========================================== */

function createQuestionInterface() {

    const intro =
        document.querySelector(
            ".chapter-challenge-intro"
        );


    if (!intro) {

        return;
    }


    const existingInterface =
        document.getElementById(
            "chapterChallengeQuiz"
        );


    if (existingInterface) {

        existingInterface.remove();

    }


    const quizContainer =
        document.createElement(
            "div"
        );


    quizContainer.id =
        "chapterChallengeQuiz";


    quizContainer.className =
        "chapter-challenge-quiz";


    quizContainer.innerHTML = `

        <div class="challenge-question-header">

            <span id="challengeQuestionProgress">
                Question 1 of ${challengeQuestions.length}
            </span>

        </div>


        <div class="challenge-progress-track">

            <div
                class="challenge-progress-fill"
                id="challengeProgressFill"
            ></div>

        </div>


        <div class="challenge-question-card">

            <h2 id="challengeQuestionText">
                Question
            </h2>


            <div
                class="challenge-options"
                id="challengeOptions"
            ></div>


            <button
                type="button"
                id="submitChallengeAnswer"
                disabled
            >
                Submit Answer
            </button>

        </div>

    `;


    intro.appendChild(
        quizContainer
    );


    const submitButton =
        document.getElementById(
            "submitChallengeAnswer"
        );


    submitButton.addEventListener(
        "click",
        submitCurrentAnswer
    );

}



/* ==========================================
   MATCHING GAME â€” FIRESTORE-DRIVEN
========================================== */

function renderMatchingGame(question, optionsContainer, submitButton) {

    const pairs = Array.isArray(question.matchingPairs)
        ? question.matchingPairs
        : [];

    selectedMatches = {};

    if (pairs.length === 0) {
        optionsContainer.textContent =
            "Matching activity is not available.";
        submitButton.disabled = true;
        return;
    }

    const instructions = document.createElement("p");
    instructions.className = "matching-instructions";
    instructions.textContent =
        "Match each item with its correct description. Complete all matches before confirming.";

    optionsContainer.appendChild(instructions);

    // Shuffle the descriptions so answers are not lined up.
    const descriptions = pairs.map(pair => pair.right);

    for (let i = descriptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [descriptions[i], descriptions[j]] =
            [descriptions[j], descriptions[i]];
    }

    pairs.forEach(pair => {

        const row = document.createElement("div");
        row.className = "matching-row";

        const label = document.createElement("label");
        label.className = "matching-label";
        label.textContent = pair.left;

        const select = document.createElement("select");
        select.className = "matching-select";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose a match";
        select.appendChild(placeholder);

        descriptions.forEach(description => {

            const option = document.createElement("option");
            option.value = description;
            option.textContent = description;

            select.appendChild(option);

        });

        select.addEventListener("change", () => {

    selectedMatches[pair.left] = select.value;

    /* ======================================
       PREVENT DUPLICATE MATCHES
    ====================================== */

    const allSelects =
        optionsContainer.querySelectorAll(
            ".matching-select"
        );

    allSelects.forEach(otherSelect => {

        if (otherSelect !== select &&
            otherSelect.value === select.value &&
            select.value !== "") {

            otherSelect.value = "";

            const otherRow =
                otherSelect.closest(".matching-row");

            const otherLabel =
                otherRow?.querySelector(".matching-label");

            if (otherLabel) {
                delete selectedMatches[
                    otherLabel.textContent
                ];
            }

        }

    });

    /* ======================================
       CHECK IF ALL MATCHES ARE COMPLETE
    ====================================== */

    const completed = pairs.every(
        item => selectedMatches[item.left]
    );

    submitButton.disabled = !completed;

});

        row.appendChild(label);
        row.appendChild(select);
        optionsContainer.appendChild(row);

    });

    submitButton.disabled = true;
}


/* ==========================================
   TRADE SIMULATION â€” FIRESTORE-DRIVEN
========================================== */

function renderTradeSimulation(
    question,
    optionsContainer,
    submitButton
) {

    const startingQuantity =
        Number(question.startingQuantity);

    const requiredQuantity =
        Number(question.requiredQuantity);

    const rewardQuantity =
        Number(question.rewardQuantity);

    const tradeGood =
        String(question.tradeGood || "");

    const rewardGood =
        String(question.rewardGood || "");

    selectedTradeQuantity = 0;

    // Check that Firestore has valid trading data.
    if (
        !Number.isInteger(startingQuantity) ||
        !Number.isInteger(requiredQuantity) ||
        !Number.isInteger(rewardQuantity) ||
        startingQuantity < 1 ||
        requiredQuantity < 1 ||
        requiredQuantity > startingQuantity ||
        rewardQuantity < 1 ||
        !tradeGood ||
        !rewardGood
    ) {

        optionsContainer.textContent =
            "Trading activity is not available.";

        submitButton.disabled = true;

        return;
    }

    const game = document.createElement("div");
    game.className = "trade-simulation";

    /* ======================================
       INSTRUCTIONS
    ====================================== */

    const instructions = document.createElement("p");
    instructions.className = "trade-instructions";
    instructions.textContent =
        "Choose how many goods to offer. Think carefully before confirming your trade.";

    game.appendChild(instructions);

    /* ======================================
       TRADING GOODS
    ====================================== */

    const goodsPanel = document.createElement("div");
    goodsPanel.className = "trade-goods-panel";

    const yourGoods = document.createElement("div");
    yourGoods.className = "trade-goods-card";

    const yourGoodsLabel = document.createElement("strong");
    yourGoodsLabel.textContent = "YOUR GOODS";

    const yourGoodsValue = document.createElement("p");
    yourGoodsValue.textContent =
        `${startingQuantity} ${tradeGood}`;

    yourGoods.appendChild(yourGoodsLabel);
    yourGoods.appendChild(yourGoodsValue);

    const traderOffer = document.createElement("div");
    traderOffer.className = "trade-goods-card";

    const traderOfferLabel = document.createElement("strong");
    traderOfferLabel.textContent = "TRADER'S OFFER";

    const traderOfferValue = document.createElement("p");
    traderOfferValue.textContent =
        `${rewardQuantity} ${rewardGood}`;

    traderOffer.appendChild(traderOfferLabel);
    traderOffer.appendChild(traderOfferValue);

    goodsPanel.appendChild(yourGoods);
    goodsPanel.appendChild(traderOffer);

    game.appendChild(goodsPanel);

    /* ======================================
       QUANTITY CONTROLS
    ====================================== */

    const quantityPanel = document.createElement("div");
    quantityPanel.className = "trade-quantity-panel";

    const quantityLabel = document.createElement("p");
    quantityLabel.textContent =
        `How many ${tradeGood} will you trade?`;

    const controls = document.createElement("div");
    controls.className = "trade-quantity-controls";

    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.className = "trade-quantity-button";
    minusButton.textContent = "âˆ’";

    const quantityDisplay = document.createElement("strong");
    quantityDisplay.className = "trade-quantity-value";
    quantityDisplay.textContent = "0";

    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.className = "trade-quantity-button";
    plusButton.textContent = "+";

    controls.appendChild(minusButton);
    controls.appendChild(quantityDisplay);
    controls.appendChild(plusButton);

    quantityPanel.appendChild(quantityLabel);
    quantityPanel.appendChild(controls);

    /* ======================================
       REMAINING RESOURCES
    ====================================== */

    const remainingText = document.createElement("p");
    remainingText.className = "trade-remaining";

    function updateTradeDisplay() {

        quantityDisplay.textContent =
            String(selectedTradeQuantity);

        remainingText.textContent =
            `Goods remaining: ${
                startingQuantity - selectedTradeQuantity
            } ${tradeGood}`;

        minusButton.disabled =
            selectedTradeQuantity <= 0;

        plusButton.disabled =
            selectedTradeQuantity >= startingQuantity;

        // Students must offer at least one good.
        // Do not reveal whether the amount is correct.
        submitButton.disabled =
            selectedTradeQuantity === 0;

    }

    minusButton.addEventListener("click", () => {

        if (selectedTradeQuantity > 0) {
            selectedTradeQuantity--;
            updateTradeDisplay();
        }

    });

    plusButton.addEventListener("click", () => {

        if (selectedTradeQuantity < startingQuantity) {
            selectedTradeQuantity++;
            updateTradeDisplay();
        }

    });

    quantityPanel.appendChild(remainingText);
    game.appendChild(quantityPanel);

    optionsContainer.appendChild(game);

    updateTradeDisplay();

}

/* ==========================================
   DISPLAY CURRENT QUESTION
========================================== */

function displayCurrentQuestion() {

    const question =
        challengeQuestions[
            currentQuestionIndex
        ];


    if (!question) {

        showChallengeResult();

        return;
    }


    selectedAnswer =
        null;


    const questionProgress =
        document.getElementById(
            "challengeQuestionProgress"
        );


    const progressFill =
        document.getElementById(
            "challengeProgressFill"
        );


    const questionText =
        document.getElementById(
            "challengeQuestionText"
        );


    const optionsContainer =
        document.getElementById(
            "challengeOptions"
        );


    const submitButton =
        document.getElementById(
            "submitChallengeAnswer"
        );


    questionProgress.textContent =
        `Question ${
            currentQuestionIndex + 1
        } of ${
            challengeQuestions.length
        }`;


    const progressPercentage =
        (
            (
                currentQuestionIndex + 1
            ) /
            challengeQuestions.length
        ) * 100;


    progressFill.style.width =
        `${progressPercentage}%`;


    /* ==========================================
   DISPLAY QUESTION BY GAME TYPE
========================================== */

const gameType =
    getChallengeGameType(question);

questionText.textContent =
    question.question ||
    "Question";

optionsContainer.innerHTML =
    "";

/* ==========================================
   HISTORICAL DECISION INTRODUCTION
========================================== */

if (gameType === "historicalDecision") {

    const decisionHeader =
        document.createElement("div");

    decisionHeader.className =
        "historical-decision-header";

    const decisionIcon =
        document.createElement("span");

    decisionIcon.className =
        "historical-decision-icon";

    decisionIcon.textContent =
        "âš–ï¸";

    const decisionLabel =
        document.createElement("strong");

    decisionLabel.textContent =
        "HISTORICAL DECISION";

    const decisionInstruction =
        document.createElement("p");

    decisionInstruction.textContent =
        "Study the situation carefully. Choose the most historically appropriate response.";

    decisionHeader.appendChild(
        decisionIcon
    );

    decisionHeader.appendChild(
        decisionLabel
    );

    decisionHeader.appendChild(
        decisionInstruction
    );

    optionsContainer.appendChild(
        decisionHeader
    );

}


    submitButton.disabled =
        true;


    /* ==========================================
   GAME-SPECIFIC ACTION BUTTON
========================================== */

if (gameType === "historicalDecision") {

    submitButton.textContent =
        currentQuestionIndex ===
            challengeQuestions.length - 1
            ? "Confirm Final Decision"
            : "Confirm Decision";

} else {

    submitButton.textContent =
        currentQuestionIndex ===
            challengeQuestions.length - 1
            ? "Finish Challenge"
            : "Submit Answer";

}

/* ==========================================
   MATCHING GAME DISPLAY
========================================== */

if (gameType === "matching") {

    renderMatchingGame(
        question,
        optionsContainer,
        submitButton
    );

    submitButton.textContent =
        currentQuestionIndex === challengeQuestions.length - 1
            ? "Finish Matching"
            : "Confirm Matches";

    return;
}


/* ==========================================
   TRADE SIMULATION DISPLAY
========================================== */

if (gameType === "tradeSimulation") {

    renderTradeSimulation(
        question,
        optionsContainer,
        submitButton
    );

    submitButton.textContent =
        currentQuestionIndex === challengeQuestions.length - 1
            ? "Finish Trading"
            : "Confirm Trade";

    return;
}

    const options = [

        {
            letter: "A",
            text: question.optionA
        },

        {
            letter: "B",
            text: question.optionB
        },

        {
            letter: "C",
            text: question.optionC
        },

        {
            letter: "D",
            text: question.optionD
        }

    ];


    options.forEach(
        (option) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "challenge-option";


            button.dataset.answer =
                option.letter;


            button.innerHTML = `

                <span class="challenge-option-letter">
                    ${option.letter}
                </span>

                <span class="challenge-option-text"></span>

            `;


            const optionText =
                button.querySelector(
                    ".challenge-option-text"
                );


            optionText.textContent =
                option.text || "";


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        option.letter,
                        button
                    );

                }
            );


            optionsContainer.appendChild(
                button
            );

        }
    );

}


/* ==========================================
   SELECT ANSWER
========================================== */

function selectAnswer(
    answer,
    selectedButton
) {

    selectedAnswer =
        answer;


    const optionButtons =
        document.querySelectorAll(
            ".challenge-option"
        );


    optionButtons.forEach(
        (button) => {

            button.classList.remove(
                "selected"
            );

        }
    );


    selectedButton.classList.add(
        "selected"
    );


    const submitButton =
        document.getElementById(
            "submitChallengeAnswer"
        );


    submitButton.disabled =
        false;

}


function submitCurrentAnswer() {

    const question =
        challengeQuestions[currentQuestionIndex];

    if (!question) {
        return;
    }

    const gameType =
        getChallengeGameType(question);

    /* ======================================
       MATCHING GAME
    ====================================== */

    if (gameType === "matching") {

        const pairs =
            Array.isArray(question.matchingPairs)
                ? question.matchingPairs
                : [];

        // Require valid matching data.
        if (pairs.length === 0) {
            return;
        }

        // Require all matches before submission.
        const allCompleted = pairs.every(pair =>
            selectedMatches[pair.left]
        );

        if (!allCompleted) {
            return;
        }

        // Save a copy for the final review.
        studentAnswers[question.id] = {
            gameType: "matching",
            matches: { ...selectedMatches }
        };

        // One point only if every pair is correct.
        const allCorrect = pairs.every(pair =>
            selectedMatches[pair.left] === pair.right
        );

               if (allCorrect) {
            correctAnswers += 1;
        }

    } else if (gameType === "tradeSimulation") {

        /* ======================================
           TRADE SIMULATION SCORING
        ====================================== */

        const startingQuantity =
            Number(question.startingQuantity);

        const requiredQuantity =
            Number(question.requiredQuantity);

        // Prevent invalid trade submissions.
        if (
            !Number.isInteger(startingQuantity) ||
            !Number.isInteger(requiredQuantity) ||
            requiredQuantity < 1 ||
            requiredQuantity > startingQuantity ||
            selectedTradeQuantity < 1 ||
            selectedTradeQuantity > startingQuantity
        ) {
            return;
        }

        // Save the student's trade for final review.
        studentAnswers[question.id] = {
            gameType: "tradeSimulation",
            quantity: selectedTradeQuantity
        };

        // One point for the correct trade amount.
        if (
            selectedTradeQuantity === requiredQuantity
        ) {
            correctAnswers += 1;
        }

    } else {

        /* ======================================
           HISTORICAL DECISION / MULTIPLE CHOICE
        ====================================== */

        if (!selectedAnswer) {
            return;
        }

        studentAnswers[question.id] =
            selectedAnswer;

        const correctAnswer =
            String(question.correctAnswer || "")
                .trim()
                .toUpperCase();

        const submittedAnswer =
            String(selectedAnswer || "")
                .trim()
                .toUpperCase();

        if (submittedAnswer === correctAnswer) {
            correctAnswers += 1;
        }

    }

    /* ======================================
       NEXT QUESTION
    ====================================== */

    currentQuestionIndex += 1;

    if (
        currentQuestionIndex >=
        challengeQuestions.length
    ) {

        showChallengeResult();
        return;

    }

    displayCurrentQuestion();

}

/* ==========================================
   CREATE CHALLENGE LEARNING REVIEW
========================================== */

function createChallengeLearningReview() {

    const reviewSection =
        document.createElement(
            "section"
        );


    reviewSection.className =
        "challenge-learning-review";


    /* ======================================
       HEADER
    ====================================== */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "challenge-learning-review-header";


    const label =
        document.createElement(
            "span"
        );


    label.className =
        "challenge-learning-review-label";


    label.textContent =
        "CHAPTER REVIEW";


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        "Review Your Answers";


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        "Review what you understood from this chapter and learn from any answers you missed.";


    header.appendChild(
        label
    );


    header.appendChild(
        title
    );


    header.appendChild(
        description
    );


    reviewSection.appendChild(
        header
    );


    /* ======================================
       QUESTION LIST
    ====================================== */

    const reviewList =
        document.createElement(
            "div"
        );


    reviewList.className =
        "challenge-learning-review-list";


    challengeQuestions.forEach(
        (question, index) => {

          /* ======================================
   REVIEW ANSWERS BY GAME TYPE
====================================== */

const gameType =
    getChallengeGameType(question);

const isMatching =
    gameType === "matching";

let isCorrect = false;

let studentAnswerText = "";

let correctAnswerText = "";

if (isMatching) {

    const pairs =
        Array.isArray(question.matchingPairs)
            ? question.matchingPairs
            : [];

    const savedAnswer =
        studentAnswers[question.id];

    const matches =
        savedAnswer?.gameType === "matching"
            ? savedAnswer.matches || {}
            : {};

    isCorrect =
        pairs.length > 0 &&
        pairs.every(pair =>
            matches[pair.left] === pair.right
        );

    studentAnswerText =
        pairs.map(pair => {
            const answer =
                matches[pair.left] || "No match";

            return `${pair.left} â†’ ${answer}`;
        }).join("\n");

    correctAnswerText =
        pairs.map(pair =>
            `${pair.left} â†’ ${pair.right}`
        ).join("\n");

} else if (gameType === "tradeSimulation") {

    /* ======================================
       TRADE SIMULATION REVIEW
    ====================================== */

    const savedAnswer =
        studentAnswers[question.id];

    const offeredQuantity =
        savedAnswer?.gameType === "tradeSimulation"
            ? Number(savedAnswer.quantity)
            : 0;

    const requiredQuantity =
        Number(question.requiredQuantity);

    const tradeGood =
        String(question.tradeGood || "goods");

    isCorrect =
        offeredQuantity === requiredQuantity &&
        requiredQuantity > 0;

    studentAnswerText =
        `${offeredQuantity} ${tradeGood}`;

    correctAnswerText =
        `${requiredQuantity} ${tradeGood}`;

} else {

    const studentAnswerKey =
        String(
            studentAnswers[question.id] || ""
        ).trim().toUpperCase();

    const correctAnswerKey =
        String(
            question.correctAnswer || ""
        ).trim().toUpperCase();

    isCorrect =
        studentAnswerKey === correctAnswerKey;

    studentAnswerText =
        getChallengeOptionText(
            question,
            studentAnswerKey
        );

    correctAnswerText =
        getChallengeOptionText(
            question,
            correctAnswerKey
        );

}


            const explanation =
    typeof question.explanation === "string"
        ? question.explanation.trim()
        : "";

            const reviewItem =
                document.createElement(
                    "article"
                );


            reviewItem.className =
                isCorrect
                    ? "challenge-review-item correct"
                    : "challenge-review-item incorrect";


            /* ==================================
               QUESTION NUMBER
            ================================== */

            const questionNumber =
                document.createElement(
                    "span"
                );


            questionNumber.className =
                "challenge-review-number";


            questionNumber.textContent =
                `Question ${index + 1}`;


            /* ==================================
               STATUS
            ================================== */

            const status =
                document.createElement(
                    "div"
                );


            status.className =
                "challenge-review-status";


            const statusIcon =
                document.createElement(
                    "span"
                );


            statusIcon.className =
                "challenge-review-status-icon";


            statusIcon.textContent =
                isCorrect
                    ? "âœ“"
                    : "âœ•";


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
               QUESTION TEXT
            ================================== */

            const questionText =
                document.createElement(
                    "h4"
                );


            questionText.textContent =
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
                "challenge-review-answers";


            const studentAnswerRow =
                createChallengeReviewAnswer(
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


            /*
             * The correct answer only needs its
             * own row when the student missed it.
             */

            if (!isCorrect) {

                const correctAnswerRow =
    createChallengeReviewAnswer(
        "Correct answer",
        correctAnswerText || "Not available",
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
                "challenge-review-explanation";


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


            /*
             * Firestore explanation is preferred.
             * The fallback keeps older challenge
             * questions usable if an explanation
             * has not been added yet.
             */

            if (explanation) {

    explanationText.textContent =
        explanation;

} else {

    console.warn(
        "Missing explanation for challenge question:",
        question.id,
        question
    );


    explanationText.textContent =
        "Review this question and the related lesson before continuing.";

}

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
                questionNumber
            );


            reviewItem.appendChild(
                status
            );


            reviewItem.appendChild(
                questionText
            );


            reviewItem.appendChild(
                answers
            );


            reviewItem.appendChild(
                explanationBox
            );


            reviewList.appendChild(
                reviewItem
            );

        }
    );


    reviewSection.appendChild(
        reviewList
    );


    return reviewSection;

}


/* ==========================================
   CREATE REVIEW ANSWER ROW
========================================== */

function createChallengeReviewAnswer(
    label,
    answer,
    state
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        `challenge-review-answer ${state}`;


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
   GET CHALLENGE OPTION TEXT
========================================== */

function getChallengeOptionText(
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
   INSERT LEARNING REVIEW
========================================== */

function insertChallengeLearningReview(
    resultContainer
) {

    if (!resultContainer) {

        return;
    }


    const existingReview =
        resultContainer.querySelector(
            ".challenge-learning-review"
        );


    if (existingReview) {

        existingReview.remove();

    }


    const review =
        createChallengeLearningReview();


    /*
     * Put learning feedback before rewards
     * and navigation actions.
     */

    const badgeArea =
        resultContainer.querySelector(
            ".chapter-badge-area"
        );


    const failMessage =
        resultContainer.querySelector(
            ".challenge-fail-message"
        );


    const actions =
        resultContainer.querySelector(
            ".challenge-result-actions"
        );


    if (badgeArea) {

        resultContainer.insertBefore(
            review,
            badgeArea
        );


        return;

    }


    if (failMessage) {

        resultContainer.insertBefore(
            review,
            failMessage
        );


        return;

    }


    if (actions) {

        resultContainer.insertBefore(
            review,
            actions
        );


        return;

    }


    resultContainer.appendChild(
        review
    );

}


/* ==========================================
   SAVE CHAPTER COMPLETION
========================================== */

let validatedChapterReward = null;
async function completeChapter() {
    validatedChapterReward = null;
    const result = await submitStudentActivity({
        kind: "chapter", chapterId, challengeId: activeChallenge.id,
        answers: studentAnswers
    });
    if (!result.passed) throw new Error("A passing score could not be confirmed.");
    validatedChapterReward = result.badgeResult;
    return { firstCompletion: result.firstCompletion };
}

async function awardChapterBadge() {
    return validatedChapterReward || { badge: null, newlyEarned: false };
}
async function showChallengeResult() {

    const quizContainer =
        document.getElementById(
            "chapterChallengeQuiz"
        );


    if (quizContainer) {

        quizContainer.remove();

    }


    const totalQuestions =
        challengeQuestions.length;


    const score =
        totalQuestions > 0

            ? Math.round(
                (
                    correctAnswers /
                    totalQuestions
                ) * 100
            )

            : 0;


    const passingScore =
        Number(
            activeChallenge.passingScore
        ) || 70;


    const passed =
        score >=
        passingScore;


    let chapterCompletion =
        null;


    let badgeResult =
        null;


    /* ======================================
       SAVE SUCCESSFUL CHALLENGE
    ====================================== */

    if (passed) {

        challengeStatus.textContent =
            "Saving chapter completion...";


        try {

            chapterCompletion =
                await completeChapter(
                    score
                );


        } catch (error) {

            console.error(
                "Unable to save chapter completion:",
                error
            );


            challengeStatus.textContent =
                "";


            showSaveErrorResult(
                score,
                totalQuestions,
                passingScore
            );


            return;

        }


        /* ==================================
           AWARD BADGE
        ================================== */

        challengeStatus.textContent =
            "Checking chapter reward...";


        try {

            badgeResult =
                await awardChapterBadge();


        } catch (error) {

            /*
             * Chapter completion has already
             * been saved. Badge failure must
             * not erase valid progress.
             */

            console.error(
                "Unable to award chapter badge:",
                error
            );


            badgeResult = {

                badge:
                    null,

                newlyEarned:
                    false,

                error:
                    true

            };

        }


        challengeStatus.textContent =
            "";

    }


    /* ======================================
       BUILD RESULT
    ====================================== */

    const intro =
        document.querySelector(
            ".chapter-challenge-intro"
        );


    if (!intro) {

        return;
    }


    const oldResult =
        document.getElementById(
            "chapterChallengeResult"
        );


    if (oldResult) {

        oldResult.remove();

    }


    const resultContainer =
        document.createElement(
            "div"
        );


    resultContainer.id =
        "chapterChallengeResult";


    resultContainer.className =
        passed

            ? "chapter-challenge-result passed"

            : "chapter-challenge-result failed";


    /* ======================================
       PASSED RESULT
    ====================================== */

    if (passed) {

        const firstCompletion =
            chapterCompletion
                ?.firstCompletion === true;


        const badgeNewlyEarned =
            badgeResult
                ?.newlyEarned === true &&
            Boolean(
                badgeResult?.badge
            );


        resultContainer.innerHTML = `

            <div class="challenge-result-icon">
                ðŸ†
            </div>


            <span class="card-label">
                ${
                    firstCompletion
                        ? "CHAPTER COMPLETE"
                        : "CHALLENGE PASSED"
                }
            </span>


            <h2>
                ${
                    firstCompletion
                        ? "Chapter Complete!"
                        : "Great Review!"
                }
            </h2>


            <p class="challenge-result-chapter-name"></p>


            <div class="challenge-score">
                ${score}%
            </div>


            <span class="challenge-score-label">
                FINAL CHALLENGE SCORE
            </span>


            <p class="challenge-result-summary">
                You answered
                <strong>${correctAnswers}</strong>
                out of
                <strong>${totalQuestions}</strong>
                questions correctly.
            </p>


            ${
                firstCompletion

                    ? `
                        <div class="chapter-completion-banner">

                            <span class="chapter-completion-check">
                                âœ“
                            </span>

                            <div>

                                <strong>
                                    Chapter Journey Completed
                                </strong>

                                <span>
                                    You completed every mission
                                    and passed the final challenge.
                                </span>

                            </div>

                        </div>
                    `

                    : `
                        <div class="chapter-review-banner">

                            <span>
                                âœ“
                            </span>

                            <p>
                                You already completed this chapter.
                                Your best challenge score has been kept.
                            </p>

                        </div>
                    `
            }


            <div
                class="chapter-badge-area"
                id="chapterBadgeArea"
            ></div>


            ${
                firstCompletion

                    ? `
                        <div class="chapter-next-unlock">

                            <div class="chapter-next-unlock-icon">
                                ðŸ—º
                            </div>

                            <div>

                                <span class="card-label">
                                    JOURNEY PROGRESS
                                </span>

                                <h3>
                                    Next Chapter Unlocked
                                </h3>

                                <p>
                                    A new part of your historical
                                    journey is now available.
                                </p>

                            </div>

                        </div>
                    `

                    : ""
            }


            <div class="challenge-result-actions">

                <button
                    type="button"
                    id="challengeResultPrimaryButton"
                >
                    ${
                        firstCompletion
                            ? "Continue Your Journey â†’"
                            : "Back to Journey â†’"
                    }
                </button>


                <button
                    type="button"
                    id="challengeResultBackButton"
                >
                    â† Back to Missions
                </button>

            </div>

        `;


    intro.appendChild(
    resultContainer
);


/* ==================================
   LEARNING REVIEW
================================== */

insertChallengeLearningReview(
    resultContainer
);


/* ==================================
   CHAPTER NAME
================================== */

        const chapterName =
            resultContainer.querySelector(
                ".challenge-result-chapter-name"
            );


        if (chapterName) {

            chapterName.textContent =
                currentChapter?.title ||
                "Chapter";

        }


        /* ==================================
           BADGE DISPLAY
        ================================== */

        const badgeArea =
            document.getElementById(
                "chapterBadgeArea"
            );


        if (badgeArea) {

            if (
                badgeNewlyEarned
            ) {

                const badge =
                    badgeResult.badge;


                badgeArea.innerHTML = `

                    <div class="chapter-badge-earned">

                        <span class="card-label">
                            BADGE UNLOCKED
                        </span>


                        <div
                            class="chapter-badge-icon"
                            id="earnedBadgeIcon"
                        ></div>


                        <h3
                            id="earnedBadgeName"
                        ></h3>


                        <p
                            id="earnedBadgeDescription"
                        ></p>


                        <span class="chapter-badge-status">
                            âœ“ ADDED TO ACHIEVEMENTS
                        </span>

                    </div>

                `;


                const badgeIcon =
                    document.getElementById(
                        "earnedBadgeIcon"
                    );


                const badgeName =
                    document.getElementById(
                        "earnedBadgeName"
                    );


                const badgeDescription =
                    document.getElementById(
                        "earnedBadgeDescription"
                    );


                if (badgeIcon) {

                    badgeIcon.textContent =
                        badge.icon ||
                        "ðŸ…";

                }


                if (badgeName) {

                    badgeName.textContent =
                        badge.name ||
                        "Chapter Badge";

                }


                if (badgeDescription) {

                    badgeDescription.textContent =
                        badge.description ||
                        "A special reward for completing this chapter.";

                }

            } else if (
                badgeResult?.badge
            ) {

                const badge =
                    badgeResult.badge;


                badgeArea.innerHTML = `

                    <div class="chapter-badge-collected">

                        <span class="chapter-badge-small-icon">
                        </span>

                        <div>

                            <strong>
                                Badge already collected
                            </strong>

                            <span
                                id="collectedBadgeName"
                            ></span>

                        </div>

                    </div>

                `;


                const smallIcon =
                    badgeArea.querySelector(
                        ".chapter-badge-small-icon"
                    );


                const collectedBadgeName =
                    document.getElementById(
                        "collectedBadgeName"
                    );


                if (smallIcon) {

                    smallIcon.textContent =
                        badge.icon ||
                        "ðŸ…";

                }


                if (collectedBadgeName) {

                    collectedBadgeName.textContent =
                        badge.name ||
                        "Chapter Badge";

                }

            } else if (
                badgeResult?.error
            ) {

                badgeArea.innerHTML = `

                    <div class="chapter-badge-warning">

                        <strong>
                            Chapter completed successfully
                        </strong>

                        <span>
                            Your badge could not be awarded.
                            You can safely continue your journey.
                        </span>

                    </div>

                `;

            }

        }


        /* ==================================
           RESULT BUTTONS
        ================================== */

        const primaryButton =
            document.getElementById(
                "challengeResultPrimaryButton"
            );


        const resultBackButton =
            document.getElementById(
                "challengeResultBackButton"
            );


        primaryButton.addEventListener(
            "click",
            goBackToMissions
        );


        resultBackButton.addEventListener(
            "click",
            goBackToMissions
        );


        return;

    }


    /* ======================================
       FAILED RESULT
    ====================================== */

    resultContainer.innerHTML = `

        <div class="challenge-result-icon">
            ðŸ“š
        </div>


        <span class="card-label">
            KEEP LEARNING
        </span>


        <h2>
            Almost There!
        </h2>


        <div class="challenge-score">
            ${score}%
        </div>


        <span class="challenge-score-label">
            FINAL CHALLENGE SCORE
        </span>


        <p class="challenge-result-summary">
            You answered
            <strong>${correctAnswers}</strong>
            out of
            <strong>${totalQuestions}</strong>
            questions correctly.
        </p>


        <div class="challenge-fail-message">

            <strong>
                You need ${passingScore}% to complete this chapter.
            </strong>

            <span>
                Review what you learned and try the challenge again.
            </span>

        </div>


        <div class="challenge-result-actions">

            <button
                type="button"
                id="challengeResultPrimaryButton"
            >
                Try Again
            </button>


            <button
                type="button"
                id="challengeResultBackButton"
            >
                â† Back to Missions
            </button>

        </div>

    `;


    intro.appendChild(
        resultContainer
    );


    document
        .getElementById(
            "challengeResultPrimaryButton"
        )
        .addEventListener(
            "click",
            restartChallenge
        );


    document
        .getElementById(
            "challengeResultBackButton"
        )
        .addEventListener(
            "click",
            goBackToMissions
        );

}


/* ==========================================
   SAVE ERROR RESULT
========================================== */

function showSaveErrorResult(
    score,
    totalQuestions,
    passingScore
) {

    challengeStatus.textContent =
        "";


    const intro =
        document.querySelector(
            ".chapter-challenge-intro"
        );


    if (!intro) {

        return;
    }


    const oldResult =
        document.getElementById(
            "chapterChallengeResult"
        );


    if (oldResult) {

        oldResult.remove();

    }


    const resultContainer =
        document.createElement(
            "div"
        );


    resultContainer.id =
        "chapterChallengeResult";


    resultContainer.className =
        "chapter-challenge-result failed";


    resultContainer.innerHTML = `

        <div class="challenge-result-icon">
            âš ï¸
        </div>


        <span class="card-label">
            SAVE ERROR
        </span>


        <h2>
            Your score could not be saved.
        </h2>


        <div class="challenge-score">
            ${score}%
        </div>


        <span class="challenge-score-label">
            FINAL CHALLENGE SCORE
        </span>


        <p class="challenge-result-summary">
            You answered
            <strong>${correctAnswers}</strong>
            out of
            <strong>${totalQuestions}</strong>
            questions correctly.
        </p>


        <div class="challenge-fail-message">

            <strong>
                You reached the passing score of
                ${passingScore}%.
            </strong>

            <span>
                Your chapter completion was not saved.
                Please try the challenge again.
            </span>

        </div>


        <div class="challenge-result-actions">

            <button
                type="button"
                id="challengeResultPrimaryButton"
            >
                Try Again
            </button>


            <button
                type="button"
                id="challengeResultBackButton"
            >
                â† Back to Missions
            </button>

        </div>

    `;


   intro.appendChild(
    resultContainer
);


/* ======================================
   LEARNING REVIEW
====================================== */

insertChallengeLearningReview(
    resultContainer
);



    document
        .getElementById(
            "challengeResultPrimaryButton"
        )
        .addEventListener(
            "click",
            restartChallenge
        );


    document
        .getElementById(
            "challengeResultBackButton"
        )
        .addEventListener(
            "click",
            goBackToMissions
        );

}


/* ==========================================
   RESTART CHALLENGE
========================================== */

function restartChallenge() {

    const resultContainer =
        document.getElementById(
            "chapterChallengeResult"
        );


    if (resultContainer) {

        resultContainer.remove();

    }


    currentQuestionIndex =
        0;


    selectedAnswer =
        null;


   correctAnswers =
    0;


studentAnswers =
    {};


createQuestionInterface();

    displayCurrentQuestion();

}


/* ==========================================
   BACK TO MISSIONS
========================================== */

function goBackToMissions() {

    if (chapterId) {

        window.location.href =
            `mission.html?chapter=${
                encodeURIComponent(
                    chapterId
                )
            }`;

    } else {

        window.location.href =
            "chapters.html";

    }

}


/* ==========================================
   ORIGINAL BACK BUTTON
========================================== */

backToMissionsButton.addEventListener(
    "click",
    goBackToMissions
);


/* ==========================================
   ERROR
========================================== */

function showError(
    message
) {

    challengeStatus.textContent =
        message;


    beginChallengeButton.disabled =
        true;

}


/* ==========================================
   START
========================================== */

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {
            loadChapterChallenge();
            return;
        }

        // Clear challenge state when signed out.
        activeChallenge = null;
        challengeQuestions = [];
        currentChapter = null;
        challengeStarted = false;

        beginChallengeButton.onclick = null;

        showError(
            "You must be logged in to access this challenge."
        );

        // Remove previously displayed questions/results.
        const quizContainer =
            document.getElementById(
                "chapterChallengeQuiz"
            );

        if (quizContainer) {
            quizContainer.replaceChildren();
        }

        const resultContainer =
            document.getElementById(
                "chapterChallengeResult"
            );

        if (resultContainer) {
            resultContainer.remove();
        }
    }
);
