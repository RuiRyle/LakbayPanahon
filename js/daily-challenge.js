import { learningDateKey, selectDailyChallenge, millisecondsUntilLearningMidnight } from "./daily-policy.js";
import { progressionState } from "./progression-policy.js";
import { submitStudentActivity } from "./student-rewards-client.js";
// ==========================================
// LAKBAYPANAHON
// DAILY CHALLENGE
// POLISHED COMPLETION + XP + STREAK VERSION
// ==========================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ==========================================
// DASHBOARD ELEMENTS
// ==========================================

const startButton =
    document.getElementById(
        "dailyChallengeStart"
    );


const cardReward =
    document.getElementById(
        "dailyChallengeCardReward"
    );


const cardCompleted =
    document.getElementById(
        "dailyChallengeCardCompleted"
    );


// ==========================================
// MODAL ELEMENTS
// ==========================================

const modal =
    document.getElementById(
        "dailyChallengeModal"
    );


const closeButton =
    document.getElementById(
        "dailyChallengeClose"
    );


const loadingElement =
    document.getElementById(
        "dailyChallengeLoading"
    );


const contentElement =
    document.getElementById(
        "dailyChallengeContent"
    );


const completedElement =
    document.getElementById(
        "dailyChallengeCompleted"
    );


const emptyElement =
    document.getElementById(
        "dailyChallengeEmpty"
    );


const questionElement =
    document.getElementById(
        "dailyChallengeQuestion"
    );


const optionAElement =
    document.getElementById(
        "dailyOptionA"
    );


const optionBElement =
    document.getElementById(
        "dailyOptionB"
    );


const optionCElement =
    document.getElementById(
        "dailyOptionC"
    );


const optionDElement =
    document.getElementById(
        "dailyOptionD"
    );


const rewardElement =
    document.getElementById(
        "dailyChallengeReward"
    );


const submitButton =
    document.getElementById(
        "dailyChallengeSubmit"
    );


const feedbackElement =
    document.getElementById(
        "dailyChallengeFeedback"
    );


const optionButtons =
    document.querySelectorAll(
        ".daily-challenge-option"
    );


// ==========================================
// STATE
// ==========================================

let currentUser = null;

let currentChallenge = null;

let selectedAnswer = null;

let completedToday = false;

let isSubmitting = false;
let currentChallengeDate = null;
let dailyLoad = null;
let dailyLoadOwner = null;
let midnightTimer = null;
let closeTimer = null;


// ==========================================
// AUTH
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {
            currentUser=null;currentChallenge=null;currentChallengeDate=null;completedToday=false;
            clearTimeout(midnightTimer);clearTimeout(closeTimer);
            return;
        }

        currentUser = user;

        await refreshDailyChallenge(true);
    }
);


// ==========================================
// DATE KEY
// Daily rewards use the Philippines calendar date on both client and server.
// ==========================================

function getTodayDateKey() {

    const now =
        new Date();

    return getDateKey(
        now
    );
}


// ==========================================
// DATE KEY FOR SPECIFIC DATE
// ==========================================

function getDateKey(
    date
) {

    return learningDateKey(date);
}


// ==========================================
// YESTERDAY DATE KEY
// ==========================================

function getYesterdayDateKey() {

    const yesterday =
        new Date();


    yesterday.setDate(
        yesterday.getDate() - 1
    );


    return getDateKey(
        yesterday
    );
}


// ==========================================
// DAILY COMPLETION DOCUMENT ID
// ==========================================

function getCompletionId() {

    if (!currentUser) {
        return null;
    }


    return `${currentUser.uid}_${getTodayDateKey()}`;
}


// ==========================================
// LOAD DAILY CHALLENGE
// ==========================================

async function loadDailyChallenge() {
    const uid = currentUser?.uid;
    if (!uid) return false;
    currentChallenge = null; currentChallengeDate = null; completedToday = false;
    resetSelection();
    if (cardReward) cardReward.textContent="";
    if (cardReward?.parentElement) cardReward.parentElement.hidden=true;
    if (rewardElement) rewardElement.textContent="";
    if (startButton) { startButton.hidden=false; startButton.disabled=true; startButton.textContent="Loading Daily Challenge..."; }
    if (cardCompleted) cardCompleted.hidden=true;
    try {
        const snapshot=await getDocs(query(collection(db,"dailyChallenges"),where('status','==','active')));
        if (auth.currentUser?.uid!==uid || currentUser?.uid!==uid) return false;
        const now=new Date();
        currentChallenge=selectDailyChallenge(snapshot.docs.map(item=>({...item.data(),id:item.id})),now);
        currentChallengeDate=learningDateKey(now);
        if (!currentChallenge) {
            if (startButton) { startButton.disabled=false; startButton.textContent="Check Daily Challenge"; }
            return true;
        }
        const reward=Number(currentChallenge.xpReward)||0;
        if (cardReward) cardReward.textContent='+'+reward+' XP';
        if (cardReward?.parentElement) cardReward.parentElement.hidden=false;
        if (rewardElement) rewardElement.textContent='+'+reward+' XP';
        prepareChallengeUI();
        await checkTodayCompletion();
        return true;
    } catch (error) {
        if (auth.currentUser?.uid!==uid) return false;
        console.warn("Daily challenge unavailable:",error);
        currentChallenge=null; currentChallengeDate=null;
        if (startButton) { startButton.hidden=false; startButton.disabled=false; startButton.textContent="Retry Daily Challenge"; }
        return false;
    }
}
function scheduleDailyRefresh() {
    clearTimeout(midnightTimer);
    if (!currentUser) return;
    midnightTimer=setTimeout(async()=>{
        await refreshDailyChallenge(true);
        if (modal && !modal.hidden) showModalState(completedToday?"completed":currentChallenge?"content":"empty");
    },currentChallengeDate && currentChallengeDate!==getTodayDateKey()?100:millisecondsUntilLearningMidnight()+100);
}
async function refreshDailyChallenge(force=false) {
    const uid=currentUser?.uid;
    if (!uid || isSubmitting) return false;
    if (!force && currentChallenge && currentChallengeDate===getTodayDateKey()) return true;
    if (dailyLoad && dailyLoadOwner===uid) return dailyLoad;
    dailyLoadOwner=uid;
    const pending=loadDailyChallenge().finally(()=>{
        if (dailyLoad===pending) dailyLoad=null;
        if (currentUser?.uid===uid) scheduleDailyRefresh();
    });
    dailyLoad=pending;
    return pending;
}
document.addEventListener("visibilitychange",()=>{
    if (document.visibilityState==="visible" && currentChallengeDate!==getTodayDateKey()) {
        refreshDailyChallenge(true).then(()=>{if(modal&&!modal.hidden)showModalState(completedToday?"completed":currentChallenge?"content":"empty");});
    }
});
window.addEventListener("pageshow",event=>{if(event.persisted)refreshDailyChallenge(true);});
window.addEventListener("pagehide",()=>clearTimeout(midnightTimer));

async function checkTodayCompletion() {

    if (
        !currentUser ||
        !currentChallenge
    ) {
        return;
    }


    const uid=currentUser.uid, date=currentChallengeDate;
    const completionId =
        getCompletionId();


    const completionReference =
        doc(
            db,
            "studentDailyChallenges",
            completionId
        );


    const completionSnapshot =
        await getDoc(
            completionReference
        );


    if (auth.currentUser?.uid!==uid || currentUser?.uid!==uid || currentChallengeDate!==date) return;

    if (
        completionSnapshot.exists() &&
        completionSnapshot.data()
            .completed === true
    ) {

        completedToday = true;

        showCompletedCard();

        return;
    }


    completedToday = false;

    showAvailableCard();
}


// ==========================================
// AVAILABLE CARD
// ==========================================

function showAvailableCard() {

    if (cardCompleted) {

        cardCompleted.hidden =
            true;
    }


    if (startButton) {

        startButton.hidden =
            false;

        startButton.disabled =
            false;

        startButton.textContent =
            "⚡ Start Challenge";
    }
}


// ==========================================
// COMPLETED CARD
// ==========================================

function showCompletedCard() {

    if (startButton) {

        startButton.hidden =
            true;
    }


    if (cardCompleted) {

        cardCompleted.hidden =
            false;
    }
}


// ==========================================
// PREPARE QUESTION
// ==========================================

function prepareChallengeUI() {

    if (!currentChallenge) {
        return;
    }


    if (questionElement) {

        questionElement.textContent =
            currentChallenge.question ||
            "Question unavailable.";
    }


    if (optionAElement) {

        optionAElement.textContent =
            currentChallenge.optionA ||
            "Option A";
    }


    if (optionBElement) {

        optionBElement.textContent =
            currentChallenge.optionB ||
            "Option B";
    }


    if (optionCElement) {

        optionCElement.textContent =
            currentChallenge.optionC ||
            "Option C";
    }


    if (optionDElement) {

        optionDElement.textContent =
            currentChallenge.optionD ||
            "Option D";
    }


    if (rewardElement) {

        const reward =
            Number(
                currentChallenge.xpReward
            ) || 0;


        rewardElement.textContent =
            `+${reward} XP`;
    }


    resetSelection();
}


// ==========================================
// OPEN MODAL
// ==========================================

async function openModal() {
    clearTimeout(closeTimer);

    if (!modal) {
        return;
    }


    modal.hidden =
        false;


    document.body.classList.add(
        "daily-modal-open"
    );
    document.dispatchEvent(new CustomEvent("lakbay:daily-focus", { detail: { active: true } }));


    showModalState("loading");
    await refreshDailyChallenge();

    if (completedToday) {

        showModalState(
            "completed"
        );

    } else if (
        !currentChallenge
    ) {

        showModalState(
            "empty"
        );

    } else {

        prepareChallengeUI();

        showModalState(
            "content"
        );
    }


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "open"
            );
        }
    );
}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "daily-modal-open"
    );
    document.dispatchEvent(new CustomEvent("lakbay:daily-focus", { detail: { active: false } }));


    closeTimer = setTimeout(
        () => {

            modal.hidden =
                true;

        },
        180
    );
}


// ==========================================
// START BUTTON
// ==========================================

if (startButton) {

    startButton.addEventListener(
        "click",
        openModal
    );
}


// ==========================================
// CLOSE BUTTON
// ==========================================

if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeModal
    );
}


// ==========================================
// BACKDROP CLICK
// ==========================================

if (modal) {

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                closeModal();
            }
        }
    );
}


// ==========================================
// ESCAPE TO CLOSE
// ==========================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            modal &&
            !modal.hidden
        ) {

            closeModal();
        }
    }
);


// ==========================================
// SELECT ANSWER
// ==========================================

optionButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                if (
                    completedToday ||
                    isSubmitting
                ) {
                    return;
                }


                selectedAnswer =
                    button.dataset.answer;


                optionButtons.forEach(
                    (optionButton) => {

                        optionButton.classList.remove(
                            "selected"
                        );
                    }
                );


                button.classList.add(
                    "selected"
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;
                }


                hideFeedback();
            }
        );
    }
);


// ==========================================
// SUBMIT ANSWER
// ==========================================

if (submitButton) {

    submitButton.addEventListener(
        "click",
        async () => {

            if (
                !currentUser ||
                !currentChallenge ||
                !selectedAnswer ||
                completedToday ||
                isSubmitting
            ) {
                return;
            }


            if (currentChallengeDate!==getTodayDateKey()) {
                await refreshDailyChallenge(true);
                showModalState(completedToday?"completed":currentChallenge?"content":"empty");
                if (feedbackElement && currentChallenge && !completedToday) {
                    feedbackElement.hidden=false;
                    feedbackElement.textContent="A new daily challenge is ready. Choose an answer for today's question.";
                }
                return;
            }
            const correctAnswer =
                String(
                    currentChallenge
                        .correctAnswer ||
                    ""
                ).toUpperCase();


            const studentAnswer =
                String(
                    selectedAnswer
                ).toUpperCase();


            const isCorrect =
                studentAnswer ===
                correctAnswer;


            // ==================================
            // INCORRECT ANSWER
            // ==================================

            if (!isCorrect) {

                showIncorrectFeedback(
                    correctAnswer
                );

                return;
            }


            // ==================================
            // CORRECT ANSWER
            // ==================================

            await completeDailyChallenge(
                studentAnswer
            );
        }
    );
}


// ==========================================
// COMPLETE DAILY CHALLENGE
// ==========================================

async function completeDailyChallenge(
    studentAnswer
) {

    if (
        !currentUser ||
        !currentChallenge
    ) {
        return;
    }


    const submissionUid=currentUser.uid, submissionDate=currentChallengeDate;
    isSubmitting = true;


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Saving...";
    }


    try {

        const result = await submitStudentActivity({
            kind: "daily", challengeId: currentChallenge.id, answer: studentAnswer
        });
        if (!result.passed) throw new Error("The answer could not be confirmed.");
        if (auth.currentUser?.uid!==submissionUid) return;
        document.dispatchEvent(new CustomEvent("lakbay:answer-correct"));
        const xpAwarded = result.xpReward;
        const updatedXp = result.totalXp;
        const updatedLevel = result.level;
        const updatedStreak = result.learningStreak;
        completedToday =
            true;


        // ==================================
        // UPDATE DASHBOARD IMMEDIATELY
        // ==================================

        if (
            updatedXp !== null &&
            updatedLevel !== null
        ) {

            updateDisplayedProgress(
                updatedXp,
                updatedLevel,
                updatedStreak,
                result.progressionPolicy
            );
        }


        showCorrectFeedback(
            xpAwarded,
            updatedStreak
        );


        // Let student see the success result.

        setTimeout(
            () => {
                if (auth.currentUser?.uid!==submissionUid || getTodayDateKey()!==submissionDate || currentChallengeDate!==submissionDate) return;
                showCompletedCard();

                updateCompletedModal(
                    xpAwarded,
                    updatedStreak
                );


                showModalState(
                    "completed"
                );

            },
            1400
        );


        console.log(
            "Daily Challenge completed.",
            {
                challengeId:
                    currentChallenge.id,

                date:
                    getTodayDateKey(),

                xpAwarded:
                    xpAwarded,

                streak:
                    updatedStreak
            }
        );


    } catch (error) {

        console.error(
            "Unable to complete Daily Challenge:",
            error
        );


        if (feedbackElement) {

            feedbackElement.hidden =
                false;


            feedbackElement.className =
                "daily-challenge-feedback incorrect";


            feedbackElement.innerHTML = `
                <strong>
                    Something went wrong.
                </strong>

                <span>
                    We could not save your challenge.
                    Please try again.
                </span>
            `;
        }


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Answer";
        }


    } finally {

        isSubmitting = false;
        if (currentChallengeDate!==getTodayDateKey()) {
            await refreshDailyChallenge(true);
            if (modal&&!modal.hidden)showModalState(completedToday?"completed":currentChallenge?"content":"empty");
        }
    }
}


// ==========================================
// UPDATE DASHBOARD XP + LEVEL + STREAK
// ==========================================

function updateDisplayedProgress(
    newXp,
    level,
    streak,
    policy
) {

    // ==================================
    // XP TEXT
    // ==================================

    setText(
        "studentXp",
        `${newXp} XP`
    );


    setText(
        "topXp",
        `${newXp} XP`
    );


    // ==================================
    // LEVEL TEXT
    // ==================================

    setText(
        "studentLevel",
        `Level ${level}`
    );


    setText(
        "topStudentLevel",
        `Level ${level}`
    );


    // ==================================
    // LEARNING STREAK
    // ==================================

    if (
        streak !== null &&
        streak !== undefined
    ) {

        setText(
            "learningStreak",
            streak === 1
                ? "1 Day"
                : `${streak} Days`
        );
    }


    // ==================================
    // PLAYER PROGRESS BAR
    // ==================================

    const {xpPerLevel, xpInLevel: xpInsideCurrentLevel, percent: progressPercent, xpUntilNextLevel} = progressionState(newXp, policy);

    setText(
        "levelProgressXp",
        `${xpInsideCurrentLevel} / ${xpPerLevel} XP`
    );


    setText(
        "nextLevelText",
        `${xpUntilNextLevel} XP until Level ${level + 1}`
    );


    const progressBar =
        document.getElementById(
            "levelProgressBar"
        );


    if (progressBar) {

        progressBar.style.width =
            `${progressPercent}%`;
    }
}


// ==========================================
// CORRECT FEEDBACK
// ==========================================

function showCorrectFeedback(
    xpAwarded,
    streak
) {

    if (!feedbackElement) {
        return;
    }


    const explanation =
        currentChallenge?.explanation ||
        "Great work! You remembered an important part of Philippine History.";


    const rewardMessage =
        xpAwarded > 0
            ? `⭐ +${xpAwarded} XP earned`
            : "⭐ Today's XP reward was already collected";


    const streakMessage =
        streak
            ? (
                streak === 1
                    ? "🔥 1 Day Learning Streak"
                    : `🔥 ${streak} Day Learning Streak`
            )
            : "";


    feedbackElement.hidden =
        false;


    feedbackElement.className =
        "daily-challenge-feedback correct";


    feedbackElement.replaceChildren();
    const title=document.createElement("strong");title.textContent="\u2713 Correct!";feedbackElement.append(title);
    for (const message of [explanation,rewardMessage,streakMessage].filter(Boolean)) {
        const line=document.createElement("span");line.textContent=message;feedbackElement.append(line);
    }

    markCorrectOption();


    optionButtons.forEach(
        (button) => {

            button.disabled =
                true;
        }
    );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Challenge Complete ✓";
    }
}


// ==========================================
// INCORRECT FEEDBACK
// ==========================================

function showIncorrectFeedback(
    correctAnswer
) {

    if (!feedbackElement) {
        return;
    }


    feedbackElement.hidden =
        false;


    feedbackElement.className =
        "daily-challenge-feedback incorrect";


    feedbackElement.innerHTML = `
        <strong>
            ✕ Not quite!
        </strong>

        <span>
            Think about what you learned during
            your historical missions, then try
            another answer.
        </span>
    `;


    // Mark only the student's incorrect choice.
    // We intentionally do NOT reveal the correct
    // answer yet so the student can try again.

    optionButtons.forEach(
        (button) => {

            button.classList.remove(
                "incorrect"
            );


            if (
                String(
                    button.dataset.answer
                ).toUpperCase() ===
                String(
                    selectedAnswer
                ).toUpperCase()
            ) {

                button.classList.add(
                    "incorrect"
                );
            }
        }
    );


    selectedAnswer =
        null;


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Try Again";
    }
}


// ==========================================
// MARK CORRECT OPTION
// ==========================================

function markCorrectOption() {

    if (!currentChallenge) {
        return;
    }


    const correctAnswer =
        String(
            currentChallenge.correctAnswer ||
            ""
        ).toUpperCase();


    optionButtons.forEach(
        (button) => {

            button.classList.remove(
                "incorrect"
            );


            if (
                String(
                    button.dataset.answer
                ).toUpperCase() ===
                correctAnswer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );
}


// ==========================================
// UPDATE COMPLETED MODAL
// ==========================================

function updateCompletedModal(
    xpAwarded,
    streak
) {

    if (!completedElement) {
        return;
    }


    const reward =
        Number(
            currentChallenge?.xpReward
        ) || 0;


    const displayedReward =
        xpAwarded > 0
            ? xpAwarded
            : reward;


    const streakText =
        streak
            ? (
                streak === 1
                    ? "🔥 1 Day Streak"
                    : `🔥 ${streak} Day Streak`
            )
            : "";


    completedElement.innerHTML = `
        <div class="daily-complete-icon">
            🏆
        </div>

        <span class="daily-complete-label">
            DAILY CHALLENGE COMPLETE
        </span>

        <h3>
            Great work, History Explorer!
        </h3>

        <p>
            You completed today's History Challenge.
            Come back tomorrow to continue your journey.
        </p>

        <div class="daily-complete-rewards">

            <strong>
                ⭐ +${displayedReward} XP
            </strong>

            ${
                streakText
                    ? `
                        <strong>
                            ${streakText}
                        </strong>
                    `
                    : ""
            }

        </div>
    `;
}


// ==========================================
// HIDE FEEDBACK
// ==========================================

function hideFeedback() {

    if (!feedbackElement) {
        return;
    }


    feedbackElement.hidden =
        true;


    feedbackElement.className =
        "daily-challenge-feedback";


    feedbackElement.innerHTML =
        "";
}


// ==========================================
// RESET SELECTION
// ==========================================

function resetSelection() {

    selectedAnswer =
        null;


    optionButtons.forEach(
        (button) => {

            button.classList.remove(
                "selected",
                "correct",
                "incorrect"
            );


            button.disabled =
                false;
        }
    );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Submit Answer";
    }


    hideFeedback();
}


// ==========================================
// MODAL STATES
// ==========================================

function showModalState(
    state
) {

    if (loadingElement) {

        loadingElement.hidden =
            true;
    }


    if (contentElement) {

        contentElement.hidden =
            true;
    }


    if (completedElement) {

        completedElement.hidden =
            true;
    }


    if (emptyElement) {

        emptyElement.hidden =
            true;
    }


    if (
        state === "loading" &&
        loadingElement
    ) {

        loadingElement.hidden =
            false;
    }


    if (
        state === "content" &&
        contentElement
    ) {

        contentElement.hidden =
            false;
    }


    if (
        state === "completed" &&
        completedElement
    ) {

        completedElement.hidden =
            false;
    }


    if (
        state === "empty" &&
        emptyElement
    ) {

        emptyElement.hidden =
            false;
    }
}


// ==========================================
// TEXT HELPER
// ==========================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;
    }
}
