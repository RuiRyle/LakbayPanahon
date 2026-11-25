import {chapterArtworkFor,createChapterBadgeArtwork} from './chapter-artwork.js';
import { navigatePage, reloadPage } from "./route-navigation.js";
import { animateAssessmentArrival } from './assessment-motion.js';
import {beginAssessment,forgetAssessment,assessmentAction,checkAssessmentResult} from './student-assessment-client.js';
import {renderEvidenceDecision,evidenceDecisionCorrect} from "./evidence-decision.js";
let restoredEvidenceChoice=null;
import { stableDraftVersion } from "./quiz-draft-policy.js";
import { learningDraft, draftStatus, restartControl } from "./learning-draft.js";
import { nextChapterAfterCompletion, nextChapterCandidate } from "./chapter-continuation.js";
import { renderChapterKeepsake,chapterArtifactIds } from './chapter-keepsake.js';
import { requirePassingScore } from "./activity-policy.js";
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
   TRADE SIMULATION — GAME STATE
========================================== */

let selectedTradeQuantity = 0;

let correctAnswers = 0;
let securedChapter=false,confirmedChapterReceipt=null,completedChapterAnswers=null;
function chapterNeedsReopen(error) {
    return ['assessment/reopen-required','assessment/restart-required'].includes(error?.code);
}
let chapterHearts = null, chapterAnswerPending = false;


let studentAnswers = {};

/* ==========================================
   CHAPTER CHALLENGE — GAME TYPES
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

let chapterDraft = null, chapterDraftReady = false, chapterDraftVersion = "";
const chapterDraftStatus = draftStatus(document.querySelector(".chapter-challenge-intro"));
const restartChapterButton = restartControl(document.querySelector(".chapter-challenge-intro"),"Start Challenge Over",async()=>{
    if(!auth.currentUser || chapterLoadPending || chapterResultPending)return;
    const generation=chapterSessionGeneration;
    chapterDraftReady=false;
    try {
        await chapterDraft.clear();
        if(generation!==chapterSessionGeneration)return;
        challengeStarted=false;
        document.getElementById("chapterChallengeQuiz")?.remove();
        document.getElementById("chapterChallengeResult")?.remove();
        document.querySelector(".chapter-challenge-intro")?.classList.remove("challenge-active");
        beginChallengeButton.hidden=false;backToMissionsButton.hidden=false;
        await loadChapterChallenge();
    } catch {
        if(generation!==chapterSessionGeneration)return;
        chapterDraft=learningDraft("chapter",chapterId,null,chapterDraftStatus);chapterDraftReady=true;
        chapterDraftStatus.textContent="Could not restart the challenge. Your answers are still available; try again.";
    }
});
let chapterSessionGeneration = 0;
let chapterUserId = null;
let chapterLoadPending = false;
const retryChapterLoadButton = document.getElementById("retryChapterLoadButton");
async function loadChapterChallenge() {
    if (chapterLoadPending) return;
    const generation = chapterSessionGeneration;
    const isCurrent = () => generation === chapterSessionGeneration;

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


    chapterLoadPending = true;
    document.getElementById('chapterChallengeQuiz')?.remove();
    document.getElementById('chapterChallengeResult')?.remove();
    document.querySelector('.chapter-challenge-intro')?.classList.remove('challenge-active');
    challengeStarted = false;
    beginChallengeButton.hidden = backToMissionsButton.hidden = false;
    document.querySelector('.chapter-finale-heading')?.removeAttribute('data-finale-ready');
    beginChallengeButton.disabled = true;
    beginChallengeButton.onclick = null;
    challengeStatus.textContent = "Loading chapter challenge...";
    // Keep requirements neutral until this load supplies authoritative configuration.
    document.querySelectorAll('.chapter-challenge-info strong').forEach((value,index)=>{
        if(index<2)value.textContent='Loading';
    });
    if (retryChapterLoadButton) retryChapterLoadButton.hidden = true;
    try {
        await requireLearningAccess(chapterId);
        if (!isCurrent()) return;

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
        if (!isCurrent()) return;


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
                query(collection(db,"missions"),where("chapterId","==",chapterId))
            );
        if (!isCurrent()) return;


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
        if (!isCurrent()) return;


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


        if (!challengeUnlocked && globalThis.__lakbayExplorationPreview!==true) {

            beginChallengeButton.disabled =
                true;


            challengeStatus.textContent =
                " Complete all chapter missions to unlock this challenge.";


            return;
        }


        /* ==================================
           LOAD CHALLENGE
        ================================== */

        const challengeSnapshot =
            await getDocs(
                query(collection(db,"chapterChallenges"),where("chapterId","==",chapterId))
            );
        if (!isCurrent()) return;


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

        requirePassingScore(activeChallenge);


        /* ==================================
           LOAD QUESTIONS
        ================================== */

        const issued=await beginAssessment({kind:'chapter',chapterId,challengeId:activeChallenge.id},{completedReview:true});
        if(!isCurrent())return;
        securedChapter=issued.secured!==false;confirmedChapterReceipt=issued.result||null;if(confirmedChapterReceipt)correctAnswers=confirmedChapterReceipt.correctAnswers;
        challengeQuestions=issued.result?.reviewQuestions||issued.questions||[];completedChapterAnswers=issued.result?{...(issued.answers||{})}:null;if(issued.result)studentAnswers={...(issued.answers||{})};
        if(!isCurrent())return;
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


        chapterDraft?.close();chapterDraftReady=false;
        chapterDraft=learningDraft("chapter",chapterId,null,chapterDraftStatus);
        const savedDraft=await chapterDraft.read();
        restartChapterButton.hidden = !savedDraft;
        if(!isCurrent())return;
        chapterDraftVersion=stableDraftVersion({id:activeChallenge.id,passingScore:activeChallenge.passingScore,questions:challengeQuestions});
        const artwork=chapterArtworkFor(chapterId);
        const banner=document.querySelector('.chapter-finale-heading');
        if(artwork)banner?.style.setProperty('--chapter-finale-art','url("'+new URL(artwork.src,document.baseURI).href+'")');
        else banner?.style.removeProperty('--chapter-finale-art');
        if (banner) banner.dataset.finaleReady = '';
        updateChallengeInfo();

        chapterHearts = issued.chapterHearts || null;
        const instructions = document.querySelector('.chapter-finale-instructions');
        if (instructions && chapterHearts) {
            instructions.textContent = 'Start with five hearts. A wrong answer costs one heart. Lose all five and the challenge ends.';
        }
        if (confirmedChapterReceipt) {
            if (!isCurrent()) return;
            challengeStarted = true;
            await showChallengeResult();
            return;
        }


        beginChallengeButton.disabled =
            false;
        document.dispatchEvent(new CustomEvent('lakbay:finale-arrival'));


        challengeStatus.textContent =
            " Chapter Challenge unlocked!";


        beginChallengeButton.onclick = beginChapterCountdown;
        const lockedCount = Object.keys(issued.answers || {}).length;
        if (chapterHearts && lockedCount) {
            startChallenge(false);
            studentAnswers = {...issued.answers};
            currentQuestionIndex = lockedCount;
            chapterDraftReady = true;
            if (chapterHearts.exhausted || lockedCount === challengeQuestions.length) await showChallengeResult();
            else displayCurrentQuestion();
            return;
        }
        if(savedDraft?.version===chapterDraftVersion && Number.isInteger(savedDraft.index) && savedDraft.index>=0 && savedDraft.index<=challengeQuestions.length && savedDraft.answers && typeof savedDraft.answers==='object') {
            if (savedDraft.index > 0) chapterHearts = null;
            challengeStarted=false;startChallenge(false);
            currentQuestionIndex=savedDraft.index;
            studentAnswers=savedDraft.answers;
            correctAnswers=challengeQuestions.slice(0,currentQuestionIndex).filter(question=>{
                const answer=studentAnswers[question.id],kind=getChallengeGameType(question);
                if(question.evidenceTask)return evidenceDecisionCorrect(question,answer);
                if(kind==="matching")return question.matchingPairs?.length>0&&question.matchingPairs.every(pair=>answer?.matches?.[pair.left]===pair.right);
                if(kind==="tradeSimulation")return answer?.quantity===Number(question.requiredQuantity);
                return typeof answer==="string"&&answer.trim().toUpperCase()===String(question.correctAnswer).trim().toUpperCase();
            }).length;
            if(currentQuestionIndex<challengeQuestions.length) {
                const partialMatchesQuestion = savedDraft.partialQuestionId === challengeQuestions[currentQuestionIndex].id;
                restoredEvidenceChoice=partialMatchesQuestion&&savedDraft.choice?.gameType==="evidenceDecision"?savedDraft.choice:null;
                displayCurrentQuestion();
                if(partialMatchesQuestion && ["A","B","C","D"].includes(savedDraft.choice)) document.querySelector('.challenge-option[data-answer="'+savedDraft.choice+'"]')?.click();
                for(const select of document.querySelectorAll('.matching-select')) {
                    const label=select.closest('.matching-row')?.querySelector('.matching-label')?.textContent.trim();
                    if(partialMatchesQuestion && label && savedDraft.matches?.[label]) {select.value=savedDraft.matches[label];select.dispatchEvent(new Event('change'));}
                }
                const max=Number(challengeQuestions[currentQuestionIndex].startingQuantity)||0;
                for(let count=0;count<Math.min(partialMatchesQuestion ? Number(savedDraft.quantity)||0 : 0,max);count++)document.querySelectorAll('.trade-quantity-button')[1]?.click();
                chapterDraftReady=true;saveChapterDraft();
            } else {chapterDraftReady=true;showChallengeResult();}
        } else chapterDraftReady=true;


    } catch (error) {

        if (!isCurrent()) return;
        console.error(
            "Unable to load Chapter Challenge:",
            error
        );


        showError(
            error instanceof LearningAccessError ? error.message : "We could not load the Chapter Challenge."
        );

    } finally {
        if (isCurrent()) chapterLoadPending = false;
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
                requirePassingScore(activeChallenge)
            }%`;

    }

}


/* ==========================================
   START CHALLENGE
========================================== */

async function beginChapterCountdown() {
    if (beginChallengeButton.disabled || challengeStarted || !auth.currentUser) return;
    const countdown = document.getElementById('chapterCountdown');
    const generation = chapterSessionGeneration;
    beginChallengeButton.disabled = true;
    try {
        if (countdown?.showModal) {
            const number = countdown.querySelector('strong');
            number.textContent = '3';
            delete countdown.dataset.finalBeat;
            countdown.showModal();
            for (let count = 3; count > 0; count--) {
                number.textContent = String(count);
                if (count === 1) countdown.dataset.finalBeat = '';
                else document.dispatchEvent(new CustomEvent('lakbay:countdown-tick'));
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (!countdown.open || generation !== chapterSessionGeneration || !auth.currentUser) return;
            }
            countdown.close();
        }
        startChallenge();
    } finally {
        if (countdown?.open) countdown.close();
        if (generation === chapterSessionGeneration && !challengeStarted) {
            beginChallengeButton.disabled = false;
            beginChallengeButton.focus();
        }
    }
}

function startChallenge(saveInitialDraft = true) {

    if (
        challengeStarted ||
        challengeQuestions.length === 0
    ) {

        return;
    }


    challengeStarted =
        true;

    if (saveInitialDraft !== false) {
        document.dispatchEvent(new CustomEvent("lakbay:chapter-challenge-started"));
    }

    document.querySelector(".chapter-challenge-intro")?.classList.add("challenge-active");


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
    if (saveInitialDraft !== false) {
        chapterDraftReady=true;saveChapterDraft();
    }

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

        <div class="challenge-question-header" role="status" aria-atomic="true">

            <span id="challengeQuestionProgress">
                Question 1 of ${challengeQuestions.length}
            </span>
            <div class="challenge-progress-track" aria-hidden="true"><div class="challenge-progress-fill" id="challengeProgressFill"></div></div>

        </div>
        <div class="chapter-heart-strip" ${chapterHearts ? '' : 'hidden'}>
            <span aria-hidden="true" class="chapter-heart-tokens">${Array.from({length:5},(_,i)=>`<span class="${i >= chapterHearts?.remaining ? 'spent' : ''}">♥</span>`).join('')}</span>
            <strong id="chapterHeartCount">${chapterHearts?.remaining ?? 5} of 5 hearts</strong>
            <p id="chapterHeartFeedback" role="status"></p>
        </div>


        <div class="challenge-question-card">

            <p id="challengeActivityLabel" class="challenge-activity-label"></p>
            <h2 id="challengeQuestionText" tabindex="-1" aria-describedby="challengeQuestionProgress">
                Question
            </h2>


            <div
                class="challenge-options"
                id="challengeOptions"
                role="group"
                aria-labelledby="challengeQuestionText"
            ></div>

            <p id="challengeInteractionStatus" role="status" aria-atomic="true"></p>


            <button
                type="button"
                id="submitChallengeAnswer"
                class="lp-button lp-button-primary"
                disabled
            >
                Submit Answer
            </button>

        </div>

    `;


    intro.appendChild(
        quizContainer
    );
    for(const event of ["click","change"])quizContainer.addEventListener(event,()=>queueMicrotask(saveChapterDraft),true);


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
   MATCHING GAME — FIRESTORE-DRIVEN
========================================== */

function renderMatchingGame(question, optionsContainer, submitButton) {

    const pairs = Array.isArray(question.matchingPairs) ? question.matchingPairs : (question.matchingLeft||[]).map((left,index)=>({left,right:question.matchingRight?.[index]}));

    selectedMatches = {};

    if (pairs.length === 0) {
        optionsContainer.textContent =
            "Matching activity is not available.";
        submitButton.disabled = true;
        return;
    }

    const instructions = document.createElement("p");
    instructions.className = "matching-instructions";
    instructions.id = "challengeMatchingInstructions";
    instructions.textContent =
        "Choose one description for each item. Use each description once, then confirm your matches.";

    optionsContainer.appendChild(instructions);

    // Shuffle the descriptions so answers are not lined up.
    const descriptions = pairs.map(pair => pair.right);

    for (let i = descriptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [descriptions[i], descriptions[j]] =
            [descriptions[j], descriptions[i]];
    }

    pairs.forEach((pair, pairIndex) => {

        const row = document.createElement("div");
        row.className = "matching-row";

        const label = document.createElement("label");
        label.className = "matching-label";
        label.textContent = pair.left;

        const select = document.createElement("select");
        select.className = "matching-select";
        select.setAttribute('aria-describedby','challengeMatchingInstructions');
        select.id = `challenge-match-${currentQuestionIndex}-${pairIndex}`;
        label.htmlFor = select.id;

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
    let clearedMessage='';

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
                clearedMessage =
                    `${otherLabel.textContent} was cleared because each description can be used once. Choose another match.`;
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
    document.getElementById('challengeInteractionStatus').textContent=completed
        ? 'All matches selected. Ready to confirm.'
        : `${clearedMessage} ${pairs.filter(item=>selectedMatches[item.left]).length} of ${pairs.length} matches selected.`.trim();

});

        row.appendChild(label);
        row.appendChild(select);
        optionsContainer.appendChild(row);

    });

    submitButton.disabled = true;
}


/* ==========================================
   TRADE SIMULATION — FIRESTORE-DRIVEN
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
        (!securedChapter&&!Number.isInteger(requiredQuantity)) ||
        !Number.isInteger(rewardQuantity) ||
        startingQuantity < 1 ||
        (!securedChapter&&requiredQuantity < 1) ||
        (!securedChapter&&requiredQuantity > startingQuantity) ||
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
        "Use − or + to choose how many goods to offer, then confirm your trade.";

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
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label',`Quantity of ${tradeGood} to trade`);

    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.className = "trade-quantity-button";
    minusButton.setAttribute('aria-label',`Trade one fewer ${tradeGood}`);
    minusButton.textContent = "−";

    const quantityDisplay = document.createElement("strong");
    quantityDisplay.className = "trade-quantity-value";
    quantityDisplay.textContent = "0";

    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.className = "trade-quantity-button";
    plusButton.setAttribute('aria-label',`Trade one more ${tradeGood}`);
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
        document.getElementById('challengeInteractionStatus').textContent=
            `${selectedTradeQuantity} ${tradeGood} selected. ${remainingText.textContent}.`;

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
    selectedMatches = {};
    selectedTradeQuantity = 0;


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


    animateAssessmentArrival(optionsContainer, `${chapterSessionGeneration}:${currentQuestionIndex}:${question.id}`);

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

optionsContainer.dataset.activity = question.evidenceTask ? 'evidence' : gameType;
document.getElementById('challengeActivityLabel').textContent = question.evidenceTask ? 'Connect a clue to a conclusion'
    : gameType === 'matching' ? 'Match the pairs'
    : gameType === 'tradeSimulation' ? 'Plan an exchange'
    : gameType === 'historicalDecision' ? 'Make a historical decision' : 'Choose one answer';

questionText.textContent =
    question.question ||
    "Question";
document.getElementById('challengeInteractionStatus').textContent='';
questionText.focus();

optionsContainer.evidenceRequest=null;
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
        "";

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

if(question.evidenceTask){selectedAnswer=restoredEvidenceChoice;renderEvidenceDecision({question,host:optionsContainer,submitButton,initialAnswer:restoredEvidenceChoice,onChange:answer=>{selectedAnswer=answer;saveChapterDraft();}});restoredEvidenceChoice=null;submitButton.textContent=currentQuestionIndex===challengeQuestions.length-1?'Finish Investigation':'Confirm Evidence and Answer';return;}
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
            button.setAttribute('aria-pressed','false');


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
            button.setAttribute('aria-pressed','false');

        }
    );


    selectedButton.classList.add(
        "selected"
    );
    selectedButton.setAttribute('aria-pressed','true');
    document.getElementById('challengeInteractionStatus').textContent=
        `Answer ${answer} selected. Ready to confirm.`;


    const submitButton =
        document.getElementById(
            "submitChallengeAnswer"
        );


    submitButton.disabled =
        false;

}


async function submitCurrentAnswer() {
    if (chapterAnswerPending || document.getElementById('reopenChapterAttempt')) return;

    const question =
        challengeQuestions[currentQuestionIndex];

    if (!question) {
        return;
    }

    const gameType =
        getChallengeGameType(question);
    let answerWasCorrect = false;
    if(securedChapter){
        if(question.evidenceTask){if(!selectedAnswer?.evidenceId||!selectedAnswer?.conclusion)return;studentAnswers[question.id]={...selectedAnswer};}
        else if(gameType==='matching'){if(!(question.matchingLeft||[]).every(left=>selectedMatches[left]))return;studentAnswers[question.id]={gameType:'matching',matches:{...selectedMatches}};}
        else if(gameType==='tradeSimulation'){if(!Number.isInteger(selectedTradeQuantity)||selectedTradeQuantity<1||selectedTradeQuantity>Number(question.startingQuantity))return;studentAnswers[question.id]={gameType:'tradeSimulation',quantity:selectedTradeQuantity};}
        else{if(!selectedAnswer)return;studentAnswers[question.id]=selectedAnswer;}
        if (chapterHearts) {
            const generation = chapterSessionGeneration;
            const previousHearts = chapterHearts.remaining;
            const submit = document.getElementById('submitChallengeAnswer');
            const answer = studentAnswers[question.id];
            delete studentAnswers[question.id];
            chapterAnswerPending = true;
            submit.disabled = true;
            try {
                const state = await assessmentAction({kind:'chapter',chapterId,challengeId:activeChallenge.id},
                    {action:'chapterLock',questionId:question.id,answer});
                if (generation !== chapterSessionGeneration) return;
                studentAnswers = {...state.answers};
                chapterHearts = state.chapterHearts;
                document.dispatchEvent(new CustomEvent('lakbay:answer-lock'));
                document.getElementById('chapterHeartCount').textContent = chapterHearts.remaining + ' of 5 hearts';
                document.querySelectorAll('.chapter-heart-tokens span').forEach((token,index) => {
                    token.classList.toggle('spent',index >= chapterHearts.remaining);
                    token.classList.toggle('lost',previousHearts > chapterHearts.remaining && index === chapterHearts.remaining);
                });
                const feedback = document.getElementById('chapterHeartFeedback');
                feedback.dataset.outcome = chapterHearts.lastCorrect ? 'correct' : 'missed';
                feedback.textContent = chapterHearts.lastCorrect
                    ? 'Correct. Keep going.'
                    : chapterHearts.remaining ? 'You lost one heart.' : 'Out of hearts. The challenge has ended.';
                animateAssessmentArrival(feedback);
                if (chapterHearts.lastCorrect || previousHearts > chapterHearts.remaining) {
                    document.dispatchEvent(new CustomEvent(chapterHearts.lastCorrect ? 'lakbay:answer-correct' : 'lakbay:heart-lost'));
                }
            } catch (error) {
                if (generation === chapterSessionGeneration) {
                    const feedback = document.getElementById('chapterHeartFeedback');
                    delete feedback.dataset.outcome;
                    if (chapterNeedsReopen(error)) {
                        feedback.textContent = error.message;
                        const reopen = document.createElement('button');
                        reopen.type = 'button';
                        reopen.id = 'reopenChapterAttempt';
                        reopen.className = 'lp-button lp-button-secondary';
                        reopen.textContent = 'Reopen challenge';
                        document.querySelector('#chapterChallengeQuiz .challenge-options').inert = true;
                        reopen.addEventListener('click', () => { void loadChapterChallenge(); });
                        feedback.after(reopen);
                        reopen.focus();
                    } else {
                        feedback.textContent = 'Could not confirm this answer. Your choice is still here. Check your connection and try again.';
                        submit.disabled = false;
                    }
                }
                return;
            } finally {
                if (generation === chapterSessionGeneration) chapterAnswerPending = false;
            }
        }
        currentQuestionIndex++;saveChapterDraft();if(chapterHearts?.exhausted||currentQuestionIndex>=challengeQuestions.length)showChallengeResult();else displayCurrentQuestion();return;
    }

    /* ======================================
       MATCHING GAME
    ====================================== */

    if(question.evidenceTask){if(selectedAnswer?.gameType!=='evidenceDecision'||!question.evidenceTask.cards.some(c=>c.id===selectedAnswer.evidenceId)||!['A','B','C','D'].includes(selectedAnswer.conclusion))return;studentAnswers[question.id]={...selectedAnswer};if(evidenceDecisionCorrect(question,selectedAnswer)){correctAnswers++;answerWasCorrect=true;}} else if (gameType === "matching") {

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
            answerWasCorrect = true;
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
            answerWasCorrect = true;
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
            answerWasCorrect = true;
        }

    }

    if (answerWasCorrect) {
        document.dispatchEvent(new CustomEvent("lakbay:answer-correct"));
    }

    /* ======================================
       NEXT QUESTION
    ====================================== */

    currentQuestionIndex += 1;

    if (
        currentQuestionIndex >=
        challengeQuestions.length
    ) {
        saveChapterDraft();
        showChallengeResult();
        return;

    }

    displayCurrentQuestion();
    saveChapterDraft();

}

/* ==========================================
   CREATE CHALLENGE LEARNING REVIEW
========================================== */

function createChallengeLearningReview() {
    const reviewAnswers=confirmedChapterReceipt?(completedChapterAnswers||{}):studentAnswers;

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

if(question.evidenceTask){const answer=reviewAnswers[question.id];isCorrect=evidenceDecisionCorrect(question,answer);studentAnswerText='Clue: '+(question.evidenceTask.cards.find(c=>c.id===answer?.evidenceId)?.label||answer?.evidenceId||'Not selected')+'; conclusion: '+getChallengeOptionText(question,answer?.conclusion);correctAnswerText='Clue: '+(question.evidenceTask.cards.find(c=>c.id===question.evidenceTask.correctEvidenceId)?.label||question.evidenceTask.correctEvidenceId)+'; conclusion: '+getChallengeOptionText(question,question.correctAnswer);} else if (isMatching) {

    const pairs =
        Array.isArray(question.matchingPairs)
            ? question.matchingPairs
            : [];

    const savedAnswer =
        reviewAnswers[question.id];

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

            return `${pair.left} → ${answer}`;
        }).join("\n");

    correctAnswerText =
        pairs.map(pair =>
            `${pair.left} → ${pair.right}`
        ).join("\n");

} else if (gameType === "tradeSimulation") {

    /* ======================================
       TRADE SIMULATION REVIEW
    ====================================== */

    const savedAnswer =
        reviewAnswers[question.id];

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
            reviewAnswers[question.id] || ""
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


            const picked=confirmedChapterReceipt?completedChapterAnswers?.[question.id]:reviewAnswers[question.id];
            const selectedFeedback=!question.evidenceTask&&getChallengeGameType(question)!=='matching'&&getChallengeGameType(question)!=='tradeSimulation'&&['A','B','C','D'].includes(picked)?question.answerExplanations?.[picked]:null;
            const explanation=typeof selectedFeedback==='string'&&selectedFeedback.trim()?selectedFeedback:typeof question.explanation==='string'?question.explanation.trim():'';

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
                    ? "✓"
                    : "✕";


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


    resultContainer.querySelector('.challenge-review-disclosure')?.remove();
    const disclosure = document.createElement('details');
    disclosure.className = 'challenge-review-disclosure';
    const label = document.createElement('summary');
    label.textContent = 'Review answers and explanations';
    disclosure.append(label, createChallengeLearningReview());
    resultContainer.append(disclosure);

}


/* ==========================================
   SAVE CHAPTER COMPLETION
========================================== */

let validatedChapterReward = null;
async function completeChapter() {
    const generation = chapterSessionGeneration;
    validatedChapterReward = null;
    const result = confirmedChapterReceipt || await submitStudentActivity({
        kind: "chapter", chapterId, challengeId: activeChallenge.id,
        answers: studentAnswers
    });
    if (generation !== chapterSessionGeneration) return null;
    if (!result.passed) throw new Error("A passing score could not be confirmed.");
    chapterDraftReady=false;
    restartChapterButton.hidden=true;
    await chapterDraft?.clear().catch(()=>{});
    if(generation!==chapterSessionGeneration)return null;
    validatedChapterReward = result.badgeResult;
    return { firstCompletion: result.firstCompletion };
}

async function awardChapterBadge() {
    return validatedChapterReward || { badge: null, newlyEarned: false };
}
let chapterResultPending = false;
async function showChallengeResult({checkOnly = false} = {}) {
    if (!auth.currentUser || chapterResultPending) return;
    const generation = chapterSessionGeneration;
    chapterResultPending = true;
    challengeStatus.textContent=checkOnly?'Checking your saved result…':'Confirming your Chapter Challenge result…';
    document.getElementById('chapterChallengeQuiz')?.setAttribute('aria-busy','true');
    const retryButton = document.getElementById("challengeResultPrimaryButton");
    if (retryButton) retryButton.disabled = true;
    const checkButton = document.getElementById('checkChapterSavedResult');
    if (checkButton) checkButton.disabled = true;
    try {
        if (checkOnly) {
            let found;
            try {
                found = await checkAssessmentResult({kind:'chapter',chapterId,challengeId:activeChallenge.id});
            } catch (error) {
                if (generation === chapterSessionGeneration) {
                    if (chapterNeedsReopen(error)) showSaveErrorResult(0, challengeQuestions.length, requirePassingScore(activeChallenge), error);
                    else challengeStatus.textContent = 'Could not check your saved result. Check your connection and try again.';
                }
                return;
            }
            if (generation !== chapterSessionGeneration) return;
            if (!found) {
                challengeStatus.textContent = 'A saved result is not available yet. You can check again or retry saving.';
                return;
            }
            confirmedChapterReceipt = found.result;
            completedChapterAnswers = {...found.answers};
            correctAnswers = found.result.correctAnswers;
            if (Array.isArray(found.result.reviewQuestions)) challengeQuestions = found.result.reviewQuestions;
        }
        await renderChallengeResult();
    } finally {
        if (generation === chapterSessionGeneration) {
            chapterResultPending = false;
            document.getElementById('chapterChallengeQuiz')?.removeAttribute('aria-busy');
            if (retryButton?.isConnected) retryButton.disabled = false;
            if (checkButton?.isConnected) {
                checkButton.disabled = false;
                if (checkOnly && document.activeElement === document.body) checkButton.focus();
            }
        }
    }
}
async function renderChallengeResult() {
    const generation = chapterSessionGeneration;
    const freshResult = !confirmedChapterReceipt;
    if(securedChapter&&!confirmedChapterReceipt){
        try{const result=await submitStudentActivity({kind:'chapter',chapterId,challengeId:activeChallenge.id,answers:studentAnswers});if(generation!==chapterSessionGeneration)return;confirmedChapterReceipt=result;completedChapterAnswers={...studentAnswers};correctAnswers=result.correctAnswers;
            if(Array.isArray(result.reviewQuestions))challengeQuestions=result.reviewQuestions;
        }catch(error){if(generation===chapterSessionGeneration)showSaveErrorResult(0,challengeQuestions.length,requirePassingScore(activeChallenge),error);return;}
    }

    const quizContainer =
        document.getElementById(
            "chapterChallengeQuiz"
        );


    if (quizContainer) {

        quizContainer.remove();

    }


    const totalQuestions =
        confirmedChapterReceipt?.totalQuestions ?? challengeQuestions.length;


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
        requirePassingScore(activeChallenge);


    const passed = confirmedChapterReceipt?.passed ?? score >= passingScore;


    let chapterCompletion =
        null;

    if(globalThis.__lakbayExplorationPreview===true){
        chapterDraftReady=false;
        await chapterDraft?.clear().catch(()=>{});
        if(generation!==chapterSessionGeneration||!auth.currentUser)return;
        const intro=document.querySelector('.chapter-challenge-intro');
        document.getElementById('chapterChallengeResult')?.remove();
        const result=document.createElement('section');result.id='chapterChallengeResult';result.className='chapter-challenge-result';
        const heading=document.createElement('h2');heading.textContent=passed?'Preview: passing score':'Preview: try again';
        const note=document.createElement('p');note.textContent=correctAnswers+' of '+totalQuestions+' correct ('+score+'%). Preview only: no chapter completion or badge was saved.';
        const again=document.createElement('button');again.type='button';again.className='begin-mission-button';again.textContent='Try This Challenge Again';again.addEventListener('click',reloadPage);
        const back=document.createElement('a');back.className='text-button';back.textContent='Back to Missions';back.href='mission.html?'+new URLSearchParams({chapter:chapterId});
        result.append(heading,note,createChallengeLearningReview(),again,back);intro?.append(result);
        challengeStatus.textContent='Preview result only. Your saved chapter progress is unchanged.';
        heading.tabIndex=-1;heading.focus();return;
    }


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
            if (generation !== chapterSessionGeneration) return;


        } catch (error) {
            if (generation !== chapterSessionGeneration) return;
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
            if (generation !== chapterSessionGeneration) return;


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


    }
    challengeStatus.textContent = "";


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

            <header class="challenge-debrief">
            <div class="challenge-debrief-title">
            <div class="challenge-result-icon">
                <span class="interface-icon interface-icon--trophy" aria-hidden="true"></span>
            </div>


            <h2>
                ${
                    firstCompletion
                        ? "Chapter Complete!"
                        : "Challenge Passed"
                }
            </h2>


            <p class="challenge-result-chapter-name"></p>
            </div>
            <div class="challenge-debrief-score">


            <div class="challenge-score">
                ${score}%
            </div>


            <span class="challenge-score-label">
                Score
            </span>
            <span class="challenge-receipt-label">Result saved</span>


            <p class="challenge-result-summary">
                <strong>${correctAnswers} of ${totalQuestions}</strong> correct
            </p>
            </div>
            </header>


            ${
                firstCompletion

                    ? `
                        <div class="chapter-completion-banner">

                            <span class="chapter-completion-check">
                                ✓
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
                                ✓
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
                                <span class="interface-icon interface-icon--compass" aria-hidden="true"></span>
                            </div>

                            <div>

                                <span class="card-label">
                                    JOURNEY PROGRESS
                                </span>

                                <h3>
                                    Explore Available Chapters
                                </h3>

                                <p>
                                    Open the chapter map to see available lessons
                                    or review chapters you have completed.
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
                            ? "Continue Your Journey →"
                            : "Back to Journey →"
                    }
                </button>


                <button
                    type="button"
                    id="challengeResultBackButton"
                >
                    ← Back to Missions
                </button>

            </div>

        `;


    intro.appendChild(
    resultContainer
);
    focusChallengeResult(resultContainer);


/* ==================================
   LEARNING REVIEW
================================== */

insertChallengeLearningReview(
    resultContainer
);

        if (firstCompletion) {
            document.dispatchEvent(new CustomEvent("lakbay:chapter-completed"));
        }


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

                    <div class="chapter-badge-earned" ${freshResult ? 'data-badge-reveal' : ''}>

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
                            ✓ ADDED TO ACHIEVEMENTS
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

                    badgeIcon.replaceChildren(createChapterBadgeArtwork(badge.chapterId || chapterId));

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
                const gallery = document.createElement('a');
                gallery.className = 'lp-button lp-button-primary chapter-badge-museum-link';
                gallery.href = badge.id
                    ? 'achievements.html?' + new URLSearchParams({badge:badge.id})
                    : 'achievements.html#badges';
                gallery.textContent = 'View badge in Museum';
                badgeArea.querySelector('.chapter-badge-earned')?.append(gallery);

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

                    smallIcon.replaceChildren(createChapterBadgeArtwork(badge.chapterId || chapterId));

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


        let continuationChapter = null;
        const resultEraId = typeof currentChapter?.eraId === 'string' && currentChapter.eraId ? currentChapter.eraId : null;
        const fallbackDestination = resultEraId ? 'era.html?' + new URLSearchParams({era:resultEraId}) : 'chapters.html';
        const fallbackLabel = resultEraId ? 'Return to Era' : 'Open Chapter Map';
        const continuationUserId = auth.currentUser?.uid;
        const continuationStatus = document.createElement('p');
        continuationStatus.className = 'chapter-continuation-status lp-status-panel';
        continuationStatus.setAttribute('role', 'status');
        const retryContinuationButton = document.createElement('button');
        retryContinuationButton.id = 'retryChapterContinuationButton';
        retryContinuationButton.type = 'button';
        retryContinuationButton.className = 'text-button chapter-continuation-retry';
        retryContinuationButton.textContent = 'Check Next Chapter Again';
        retryContinuationButton.hidden = true;
        primaryButton.parentElement.before(continuationStatus);
        primaryButton.parentElement.append(retryContinuationButton);
        if (badgeNewlyEarned && badgeArea) primaryButton.parentElement.after(badgeArea);
        let continuationLookupPending = false;
        let finaleDestination = null;
        const continuationIsCurrent = () => generation === chapterSessionGeneration &&
            auth.currentUser?.uid === continuationUserId &&
            document.getElementById('challengeResultPrimaryButton') === primaryButton;
        const keepsake=document.createElement('section');keepsake.className='chapter-keepsake';keepsake.setAttribute('aria-label','Your chapter discoveries');
        keepsake.dataset.expeditionEra = currentChapter?.eraId || '';
        const rewardAnchor = badgeNewlyEarned && badgeArea ? badgeArea : primaryButton.parentElement;
        rewardAnchor.after(keepsake);
        const openingArtwork = chapterArtworkFor(chapterId);
        if (openingArtwork) {
            const scene = document.createElement('img');
            scene.className = 'chapter-finale-scene';
            scene.alt = '';
            scene.src = openingArtwork.src;
            scene.addEventListener('error', () => scene.remove(), {once:true});
            keepsake.before(scene);
        }
        let keepsakeArtifacts=[],keepsakeArtifactsAvailable=false;
        const updateKeepsake=()=>{
            if(!continuationIsCurrent())return;
            try{renderChapterKeepsake(keepsake,{chapter:currentChapter,firstCompletion,nextChapter:continuationChapter,badgeArtwork:keepsake.firstElementChild?null:createChapterBadgeArtwork(chapterId),artifacts:keepsakeArtifacts,artifactsAvailable:keepsakeArtifactsAvailable});}
            catch{keepsake.replaceChildren();keepsake.hidden=true;}
        };
        updateKeepsake();
        const seal = keepsake.querySelector('.chapter-badge-medallion');
        if (firstCompletion && seal) {
            const stamp = () => {
                if (continuationIsCurrent()) document.dispatchEvent(new CustomEvent('lakbay:seal-stamp'));
            };
            if (getComputedStyle(seal).animationName === 'chapter-seal-land') {
                seal.addEventListener('animationend', stamp, {once:true});
            } else {
                stamp();
            }
        }
        async function loadKeepsakeArtifacts(){
            try{
                const owned=await getDocs(query(collection(db,'studentArtifacts'),where('userId','==',continuationUserId),where('chapterId','==',chapterId)));
                if(!continuationIsCurrent())return;
                const ids=chapterArtifactIds(owned.docs.map(row=>row.data()),continuationUserId,chapterId);
                const details=await Promise.allSettled(ids.map(id=>getDoc(doc(db,'artifacts',id))));
                if(!continuationIsCurrent())return;
                keepsakeArtifacts=details.filter(row=>row.status==='fulfilled'&&row.value.exists()).map(row=>row.value.data()).filter(row=>!row.status||row.status==='active').map(row=>({title:row.name||row.title||'Earned artifact'}));
                keepsakeArtifactsAvailable=details.every(row=>row.status==='fulfilled');updateKeepsake();
            }catch{/* Optional collections never block the saved result or next action. */}
        }
        loadKeepsakeArtifacts();
        primaryButton.addEventListener("click", () => {
            if (!continuationIsCurrent() || continuationLookupPending) return;
            navigatePage(finaleDestination || (continuationChapter ? "mission.html?" + new URLSearchParams({chapter:continuationChapter.id}) : fallbackDestination));
        });
        resultBackButton.addEventListener(
            "click",
            () => goBackToMissions(firstCompletion)
        );
        async function loadChapterContinuation() {
            if (!continuationIsCurrent() || continuationLookupPending) return;
            const restoreActionFocus = document.activeElement === retryContinuationButton;
            continuationLookupPending = true;
            finaleDestination = null;
            continuationChapter = null;
            primaryButton.disabled = true;
            primaryButton.setAttribute('aria-busy', 'true');
            primaryButton.textContent = 'Checking Your Next Step...';
            retryContinuationButton.hidden = true;
            continuationStatus.textContent = 'Your chapter is saved. Checking where you can go next.';
            continuationStatus.dataset.state = 'loading';
            try {
                const chapterQuery = resultEraId ? query(collection(db,"chapters"),where("eraId","==",resultEraId)) : collection(db,"chapters");
                const [chapterRows, progressRows] = await Promise.all([
                    getDocs(chapterQuery),
                    getDocs(query(collection(db,"studentChapterProgress"),where("userId","==",continuationUserId)))
                ]);
                if (!continuationIsCurrent()) return;
                const rows = snapshot => snapshot.docs.map(row=>({...row.data(),id:row.id}));
                const chapters = rows(chapterRows), progress = rows(progressRows);
                const candidate = nextChapterCandidate(chapterId,chapters,progress,continuationUserId);
                if (candidate) {
                    const missionRows = await getDocs(query(collection(db,"missions"),where("chapterId","==",candidate.id),where("status","==","active")));
                    if (!continuationIsCurrent()) return;
                    continuationChapter = nextChapterAfterCompletion(chapterId,chapters,progress,rows(missionRows),continuationUserId);
                }
                continuationStatus.dataset.state = 'ready';
                if (continuationChapter) {
                    primaryButton.textContent = 'Continue to Next Chapter';
                    continuationStatus.textContent = 'Next chapter: ' + (continuationChapter.title || 'Historical Chapter');
                } else {
                    primaryButton.textContent = fallbackLabel;
                    continuationStatus.textContent = resultEraId
                        ? 'Your chapter is saved. Return to this era to choose what to explore next.'
                        : 'Your chapter is saved. Explore the chapter map to choose your next step.';
                    try{
                        const finale=await getDoc(doc(db,'learningSettings','journeyFinale'));
                        if(!continuationIsCurrent())return;
                        if(finale.exists()&&finale.data().enabled===true&&finale.data().finalChapterId===chapterId){
                            finaleDestination='journey-finale.html';primaryButton.textContent='Open Journey Finale';continuationStatus.textContent='Your final chapter is saved. Open the finale to check and celebrate your completed journey.';
                        }
                    }catch{/* Optional finale configuration never blocks the saved result or map route. */}
                }
            } catch (error) {
                // Retrying navigation must not resubmit the completed challenge or rewards.
                if (!continuationIsCurrent()) return;
                primaryButton.textContent = fallbackLabel;
                continuationStatus.dataset.state = 'refresh-needed';
                continuationStatus.textContent = 'Your chapter is saved. We could not check the next chapter. Try again, or return to the map.';
                retryContinuationButton.hidden = false;
            } finally {
                if (continuationIsCurrent()) {
                    updateKeepsake();
                    continuationLookupPending = false;
                    primaryButton.disabled = false;
                    primaryButton.removeAttribute('aria-busy');
                    if (restoreActionFocus && (document.activeElement === document.body || document.activeElement === retryContinuationButton)) {
                        primaryButton.focus({preventScroll:true});
                    }
                }
            }
        }
        retryContinuationButton.addEventListener('click', loadChapterContinuation);
        await loadChapterContinuation();


        return;

    }


    /* ======================================
       FAILED RESULT
    ====================================== */

    resultContainer.classList.add('challenge-game-over');
    const outOfHearts = chapterHearts?.exhausted === true;
    resultContainer.classList.toggle('expedition-paused', outOfHearts);
    resultContainer.innerHTML = `

        <header class="challenge-debrief">
        <div class="challenge-debrief-title">
        <div class="challenge-result-icon">
            <span class="interface-icon interface-icon--book-open" aria-hidden="true"></span>
        </div>


        <span class="card-label">
            ${outOfHearts ? 'CHAPTER CHALLENGE FAILED' : 'CHAPTER FINALE'}
        </span>


        <h2>
            ${outOfHearts ? 'Expedition paused' : 'Challenge Failed'}
        </h2>
        ${outOfHearts ? '<div class="chapter-heart-tokens" aria-hidden="true">' +
            '<span class="spent">♥</span>'.repeat(5) + '</div>' : ''}
        </div>
        <div class="challenge-debrief-score">


        <div class="challenge-score">
            ${score}%
        </div>


        <span class="challenge-score-label">
            Score
        </span>
        ${confirmedChapterReceipt ? '<span class="challenge-receipt-label">Result saved</span>' : ''}


        <p class="challenge-result-summary">
            <strong>${correctAnswers} of ${totalQuestions}</strong> correct
        </p>
        </div>
        </header>


        <div class="challenge-fail-message">

            <strong>
                ${outOfHearts ? 'All five hearts are gone.' : `You need ${passingScore}% to clear this challenge.`}
            </strong>

            <span>
                ${chapterHearts ? 'Try again with five fresh hearts.' : 'Review your answers or try the challenge again.'}
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
                ← Back to Missions
            </button>

        </div>

    `;


    intro.appendChild(
        resultContainer
    );
    focusChallengeResult(resultContainer);

    insertChallengeLearningReview(resultContainer);
    const review = resultContainer.querySelector('.challenge-review-disclosure');
    const answerToReview = review?.querySelector('.challenge-review-item.incorrect');
    if (answerToReview) {
        const reviewButton = document.createElement('button');
        reviewButton.type = 'button';
        reviewButton.className = 'lp-button lp-button-secondary';
        reviewButton.textContent = 'Review an answer';
        reviewButton.addEventListener('click', () => {
            review.open = true;
            answerToReview.tabIndex = -1;
            answerToReview.focus();
        });
        resultContainer.querySelector('#challengeResultPrimaryButton')?.after(reviewButton);
    }

    document.dispatchEvent(new CustomEvent("lakbay:needs-practice", {
        detail: { delayMs: 320 }
    }));


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

function focusChallengeResult(result){
    const heading=result.querySelector('h2');
    if(!heading)return;
    const actions=result.querySelector('.challenge-result-actions');
    if(actions&&result.matches('.passed,.failed'))result.querySelector('.challenge-debrief')?.after(actions);
    if (chapterHearts && confirmedChapterReceipt) {
        const hearts = document.createElement('p');
        hearts.className = 'chapter-result-hearts';
        hearts.textContent = chapterHearts.remaining + ' of 5 expedition hearts left';
        result.querySelector('.challenge-debrief-score')?.append(hearts);
    }
    heading.id='challengeResultHeading';heading.tabIndex=-1;
    result.setAttribute('role','region');result.setAttribute('aria-labelledby',heading.id);
    result.querySelectorAll('button').forEach(button=>{
        button.classList.add('lp-button',button.id==='challengeResultPrimaryButton'?'lp-button-primary':'lp-button-secondary');
    });
    heading.focus();
    animateAssessmentArrival(result);
}

function showSaveErrorResult(
    score,
    totalQuestions,
    passingScore,
    error = null
) {
    const awaitingConfirmation=securedChapter&&!confirmedChapterReceipt;
    const reopen = awaitingConfirmation && chapterNeedsReopen(error);

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

        <header class="challenge-debrief">
        <div class="challenge-debrief-title">
        <div class="challenge-result-icon" aria-hidden="true">
            <span class="interface-icon interface-icon--book-open"></span>
        </div>


        <span class="card-label">
            SAVE STATUS
        </span>


        <h2>
            ${awaitingConfirmation ? 'Save unconfirmed' : 'Your Result Needs to Be Saved'}
        </h2>
        </div>
        <div class="challenge-debrief-score">


        <div class="challenge-score">
            ${awaitingConfirmation ? '<span class="challenge-score-pending">Awaiting confirmation</span>' : `${score}%`}
        </div>


        <span class="challenge-score-label">
            ${awaitingConfirmation ? 'Result status' : 'Score'}
        </span>


        <p class="challenge-result-summary">
            ${awaitingConfirmation ? 'Your answers are kept on this page. Retry saving to confirm your score and completion.' : `You answered
            <strong>${correctAnswers}</strong>
            out of
            <strong>${totalQuestions}</strong>
            questions correctly.`}
        </p>
        </div>
        </header>


        <div class="challenge-fail-message">

            <strong>
                ${awaitingConfirmation ? 'Your result has not been confirmed.' : `You reached the passing score of ${passingScore}%.`}
            </strong>

            <span>
                ${awaitingConfirmation
                    ? 'Check for your saved result first. Your answers are still on this page.'
                    : 'Retry saving to keep this result without retaking the challenge.'}
            </span>

        </div>


        <div class="challenge-result-actions">

            <button
                type="button"
                id="challengeResultPrimaryButton"
            >
                ${awaitingConfirmation ? 'Retry Saving Result' : 'Retry Saving Completion'}
            </button>
            ${awaitingConfirmation ? '<button type="button" id="checkChapterSavedResult">Check Saved Result</button>' : ''}


            <button
                type="button"
                id="challengeResultBackButton"
            >
                ← Back to Missions
            </button>

        </div>

    `;


   intro.appendChild(
    resultContainer
);
    focusChallengeResult(resultContainer);


/* ======================================
   LEARNING REVIEW
====================================== */

    if(!awaitingConfirmation)insertChallengeLearningReview(resultContainer);
    if (reopen) {
        resultContainer.querySelector('h2').textContent = 'Reopen this challenge';
        resultContainer.querySelector('.challenge-result-summary').textContent = 'Your completed progress is safe.';
        resultContainer.querySelector('.challenge-fail-message span').textContent = error.message;
        resultContainer.querySelector('#checkChapterSavedResult').remove();
        resultContainer.querySelector('#challengeResultPrimaryButton').textContent = 'Reopen challenge';
    }
    if (awaitingConfirmation && !reopen) {
        const check = resultContainer.querySelector('#checkChapterSavedResult');
        const notice = document.createElement('p');
        notice.id = 'chapterSaveRecoveryStatus';
        notice.className = 'lp-status-panel';
        notice.setAttribute('role','status');
        resultContainer.querySelector('.challenge-result-actions').before(notice);
        check.addEventListener('click', async () => {
            if (chapterResultPending) return;
            notice.textContent = 'Checking your saved result…';
            await showChallengeResult({checkOnly:true});
            if (notice.isConnected) notice.textContent = challengeStatus.textContent;
        });
        check.setAttribute('aria-describedby', notice.id);
    }



    document
        .getElementById(
            "challengeResultPrimaryButton"
        )
        .addEventListener(
            "click",
            reopen ? () => loadChapterChallenge() : showChallengeResult
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

async function restartChallenge() {
    if(securedChapter){
        const generation=chapterSessionGeneration;
        try{forgetAssessment({kind:'chapter',chapterId,challengeId:activeChallenge.id});const issued=await beginAssessment({kind:'chapter',chapterId,challengeId:activeChallenge.id},{retry:true});if(generation!==chapterSessionGeneration)return;challengeQuestions=issued.questions;chapterHearts=issued.chapterHearts||null;confirmedChapterReceipt=null;completedChapterAnswers=null;}
        catch{showError('A new challenge could not start. Try loading again. Your saved progress is safe.');return;}
    }

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
    chapterDraftReady=true;saveChapterDraft();

}


/* ==========================================
   BACK TO MISSIONS
========================================== */

function goBackToMissions(completedFinale = false) {

    if (chapterId) {

        const destination = new URLSearchParams({chapter: chapterId});
        if (completedFinale === true) destination.set('finaleCleared', '1');
        navigatePage('mission.html?' + destination);

    } else {

        navigatePage('chapters.html');

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
    if (retryChapterLoadButton) retryChapterLoadButton.hidden = !auth.currentUser || !chapterId;

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
            if (chapterUserId === user.uid) return;
            chapterUserId = user.uid;
            chapterSessionGeneration++;
            chapterAnswerPending = false;
            chapterResultPending = false;
            chapterLoadPending = false;
            loadChapterChallenge();
            return;
        }

        chapterSessionGeneration++;
        chapterAnswerPending = false;
        chapterUserId = null;
        chapterDraft?.close();chapterDraftReady=false;
        chapterLoadPending = false;
        chapterResultPending = false;
        validatedChapterReward = null;
        studentAnswers = {};
        // Clear challenge state when signed out.
        activeChallenge = null;
        challengeQuestions = [];
        currentChapter = null;
        challengeStarted = false;
        document.querySelector(".chapter-challenge-intro")?.classList.remove("challenge-active");

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

retryChapterLoadButton?.addEventListener("click", () => loadChapterChallenge());

function saveChapterDraft() {
    if(!chapterDraftReady || !challengeStarted || !activeChallenge || chapterResultPending)return;
    chapterDraft?.save({version:chapterDraftVersion,index:currentQuestionIndex,answers:studentAnswers,
        partialQuestionId:challengeQuestions[currentQuestionIndex]?.id || null,
        choice:selectedAnswer,matches:selectedMatches,quantity:selectedTradeQuantity});
}
