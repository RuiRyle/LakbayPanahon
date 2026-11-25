import {beginAssessment,checkAssessmentResult,forgetAssessment} from './student-assessment-client.js';
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
let dailyRecovery = null;
let dailyLoadFailed = false;
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
        if (currentUser && currentUser.uid !== user?.uid) {
            if (dailyModalActive) closeModal();
            dailyRecovery = null;
            currentChallenge = null;
            currentChallengeDate = null;
            completedToday = false;
            resetSelection();
            completedElement?.replaceChildren();
            if (cardCompleted) cardCompleted.hidden = true;
        }

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
    dailyRecovery = null;
    dailyLoadFailed = false;
    resetSelection();
    if (cardReward) cardReward.textContent="";
    if (cardReward?.parentElement) cardReward.parentElement.hidden=true;
    if (rewardElement) rewardElement.textContent="";
    if (startButton) { startButton.hidden=false; startButton.disabled=true; startButton.textContent="Loading Daily Challenge..."; }
    if (cardCompleted) cardCompleted.hidden=true;
    try {
        const snapshot=await getDocs(query(collection(db,"dailyChallengeCards"),where('status','==','active')));
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
        dailyLoadFailed = true;
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
        const record = completionSnapshot.data();
        updateCompletedModal(record.xpEarned, null);
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
            " Start Challenge";
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

// Keep the existing backdrop and state renderer; isolate only its active modal branch.
let dailyReturnFocus = null;
let dailyBackground = [];
let dailyModalActive = false;
const dailyStatus = document.getElementById('dailyChallengeStatus');
const dailyLoadRetry = document.getElementById('retryDailyLoad');
dailyLoadRetry?.addEventListener('click', async () => {
    if (dailyLoadRetry.disabled) return;
    dailyLoadRetry.disabled = true;
    showModalState('loading');
    try {
        await refreshDailyChallenge(true);
        if (dailyModalActive) {
            if (completedToday) showModalState('completed');
            else if (currentChallenge) await openDailyQuestion();
            else showModalState('empty');
        }
    } finally {
        dailyLoadRetry.disabled = false;
    }
});
function protectDailyBackground() {
    dailyBackground = [];
    let branch = modal;
    while (branch?.parentElement) {
        for (const sibling of branch.parentElement.children) {
            if (sibling !== branch && sibling instanceof HTMLElement) {
                dailyBackground.push([sibling, sibling.inert]);
                sibling.inert = true;
            }
        }
        branch = branch.parentElement;
        if (branch === document.body) break;
    }
}
function dailyFocusable() {
    return [...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')]
        .filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden],[inert]') && el.getClientRects().length);
}
document.addEventListener('focusin', event => {
    if (dailyModalActive && !modal.contains(event.target)) closeButton?.focus({preventScroll:true});
});
modal?.addEventListener('keydown', event => {
    if (!dailyModalActive || event.key !== 'Tab') return;
    const targets = dailyFocusable();
    const first = targets[0], last = targets.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
// Mirror button state even when an existing renderer resets or disables answers.
if (modal) new MutationObserver(() => {
    for (const button of optionButtons) {
        const pressed = String(button.classList.contains('selected'));
        if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
    }
    if (dailyModalActive && !dailyFocusable().includes(document.activeElement)) closeButton?.focus({preventScroll:true});
}).observe(modal, {subtree:true, attributes:true, attributeFilter:['class','hidden','disabled']});

async function openModal() {
    clearTimeout(closeTimer);

    if (!modal) {
        return;
    }


    if (dailyModalActive) return;
    dailyReturnFocus = document.activeElement;
    dailyModalActive = true;
    modal.hidden = false;
    contentElement?.classList.remove('daily-dispatch-open');
    protectDailyBackground();
    modal.classList.add('open');
    closeButton?.focus({preventScroll:true});


    document.body.classList.add(
        "daily-modal-open"
    );
    document.dispatchEvent(new CustomEvent("lakbay:daily-focus", { detail: { active: true } }));


    showModalState("loading");
    await refreshDailyChallenge();
    if (!dailyModalActive) return;

    if (isSubmitting && currentChallenge && !completedToday) {
        showModalState('content');
        return;
    }
    if (dailyRecovery && dailyScopeIsCurrent(dailyRecovery)) {
        showModalState('content');
        showDailyRecovery(dailyRecovery.reopen
            ? 'This attempt changed or expired. Reopen today’s challenge to check the latest saved result.'
            : 'The save could not be confirmed. Check today’s result before trying again.');
        return;
    }

    if (completedToday) {
        completedElement?.removeAttribute('data-daily-fresh-result');
        const heading = completedElement?.querySelector('h3');
        if (heading) heading.textContent = 'Already completed today';
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

        await openDailyQuestion();
    }


    requestAnimationFrame(
        () => {

            if (dailyModalActive) modal.classList.add("open");
        }
    );
}

async function openDailyQuestion() {
    const scope = {uid:currentUser?.uid,date:currentChallengeDate,id:currentChallenge?.id};
    if (!scope.id) return;
    try {
        const issued = await beginAssessment({kind:'daily',challengeId:scope.id});
        if (!dailyModalActive || !dailyScopeIsCurrent(scope)) return;
        if (issued.questions?.[0]) currentChallenge = {...currentChallenge,...issued.questions[0]};
        dailyLoadFailed = false;
        prepareChallengeUI();
        showModalState('content');
    } catch {
        if (!dailyModalActive || !dailyScopeIsCurrent(scope)) return;
        dailyLoadFailed = true;
        showModalState('empty');
        dailyLoadRetry?.focus();
    }
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


    dailyModalActive = false;
    modal.hidden = true;
    for (const [element, wasInert] of dailyBackground) element.inert = wasInert;
    dailyBackground = [];
    const destination = dailyReturnFocus?.isConnected && !dailyReturnFocus.disabled && dailyReturnFocus.getClientRects().length
        ? dailyReturnFocus : startButton;
    if (destination && !destination.disabled && destination.getClientRects().length) destination.focus({preventScroll:true});

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

            event.preventDefault();
            event.stopImmediatePropagation();
            closeModal();
        }
    }, true
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


                if (!dailyRecovery) hideFeedback();
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
                isSubmitting ||
                dailyRecovery?.reopen
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
            const studentAnswer=String(selectedAnswer).toUpperCase();

            await completeDailyChallenge(
                studentAnswer
            );
        }
    );
}


// ==========================================
// COMPLETE DAILY CHALLENGE
// ==========================================

function showDailySubmission(result, answer, recovered = false) {
    const review = result.reviewQuestions?.find(question => question.id === currentChallenge.id);
    const picked = review?.answerExplanations?.[answer];
    const feedback = typeof picked === 'string' && picked.trim() ? picked : review?.explanation || '';
    if (!result.passed) {
        forgetAssessment({kind:'daily',challengeId:currentChallenge.id});
        selectedAnswer = answer;
        showIncorrectFeedback(feedback);
        submitButton.textContent = 'Submit Answer';
        return;
    }
    currentChallenge = {...currentChallenge, correctAnswer:answer};
    completedToday = true;
    const completionState = result.firstCompletion === false
        ? 'previous' : recovered || result.replayed === true ? 'recovered' : 'fresh';
    if (completionState === 'fresh') document.dispatchEvent(new CustomEvent('lakbay:answer-correct'));
    if (Number.isFinite(result.totalXp) && Number.isFinite(result.level)) {
        updateDisplayedProgress(result.totalXp, result.level, result.learningStreak, result.progressionPolicy);
    }
    showCorrectFeedback(result.xpReward, result.learningStreak, feedback);
    showCompletedCard();
    updateCompletedModal(result.xpReward, result.learningStreak, review?.['option'+answer], feedback, completionState);
    if (dailyModalActive) {
        showModalState('completed');
        completedElement?.querySelector('h3')?.focus();
    }
}

async function completeDailyChallenge(
    studentAnswer
) {

    if (
        !currentUser ||
        !currentChallenge
    ) {
        return;
    }


    const scope = {uid:currentUser.uid, date:currentChallengeDate, id:currentChallenge.id};
    isSubmitting = true;
    dailyRecovery = null;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving…';
    if (dailyStatus) dailyStatus.textContent = 'Saving your answer…';
    try {
        const result = await submitStudentActivity({kind:'daily', challengeId:scope.id, answer:studentAnswer});
        if (dailyScopeIsCurrent(scope)) showDailySubmission(result, studentAnswer);
    } catch (error) {
        console.warn('Daily result could not be confirmed:', error);
        if (dailyScopeIsCurrent(scope)) {
            if (dailyNeedsReopen(error)) {
                dailyRecovery = { ...scope, reopen: true };
                showDailyRecovery('This attempt changed or expired. Reopen today’s challenge to check the latest saved result.');
            } else {
                dailyRecovery = scope;
                showDailyRecovery('The save could not be confirmed. Check today’s result before trying again.');
            }
        }
    } finally {
        await finishDailyOperation(scope);
    }
}

function dailyNeedsReopen(error) {
    return ['assessment/reopen-required','assessment/restart-required'].includes(error?.code);
}

function dailyScopeIsCurrent(scope) {
    return auth.currentUser?.uid === scope.uid && currentUser?.uid === scope.uid &&
        currentChallengeDate === scope.date && getTodayDateKey() === scope.date &&
        currentChallenge?.id === scope.id;
}

async function finishDailyOperation(scope) {
    isSubmitting = false;
    if (dailyScopeIsCurrent(scope) && !completedToday) {
        submitButton.disabled = !selectedAnswer || Boolean(dailyRecovery?.reopen);
        submitButton.textContent = 'Submit Answer';
        if (dailyStatus) dailyStatus.textContent = dailyRecovery ? 'Save unconfirmed.' : '';
    }
    if (currentUser && currentChallengeDate !== getTodayDateKey()) {
        await refreshDailyChallenge(true);
        if (dailyModalActive) showModalState(completedToday?'completed':currentChallenge?'content':'empty');
    }
}

function showDailyRecovery(message) {
    const scope = dailyRecovery;
    if (!scope || !feedbackElement) return;
    feedbackElement.hidden = false;
    feedbackElement.className = 'daily-challenge-feedback lp-status-panel';
    feedbackElement.dataset.state = 'unconfirmed';
    const title = document.createElement('strong');
    title.textContent = scope.reopen ? 'Reopen daily challenge' : 'Save unconfirmed';
    const copy = document.createElement('span');
    copy.textContent = message;
    const check = document.createElement('button');
    check.type = 'button';
    check.id = 'checkDailySavedResult';
    check.className = 'text-button';
    check.textContent = scope.reopen ? 'Reopen Challenge' : 'Check Saved Result';
    feedbackElement.replaceChildren(title, copy, check);
    check.addEventListener('click', async () => {
        if (isSubmitting || dailyRecovery !== scope || !dailyScopeIsCurrent(scope)) return;
        if (scope.reopen) {
            dailyRecovery = null;
            check.disabled = submitButton.disabled = true;
            showModalState('loading');
            await refreshDailyChallenge(true);
            if (!dailyModalActive) return;
            if (completedToday) showModalState('completed');
            else if (currentChallenge) await openDailyQuestion();
            else showModalState('empty');
            return;
        }
        isSubmitting = true;
        check.disabled = submitButton.disabled = true;
        if (dailyStatus) dailyStatus.textContent = 'Checking for your saved result…';
        copy.textContent = 'Looking for your saved result…';
        try {
            const found = await checkAssessmentResult({kind:'daily', challengeId:scope.id});
            if (dailyRecovery !== scope || !dailyScopeIsCurrent(scope)) return;
            if (found) {
                dailyRecovery = null;
                showDailySubmission(found.result, found.answers?.[scope.id], true);
            } else {
                copy.textContent = 'A saved result is not available yet. You can check again or submit your answer.';
            }
        } catch (error) {
            if (dailyRecovery === scope && dailyScopeIsCurrent(scope)) {
                if (dailyNeedsReopen(error)) {
                    dailyRecovery = { ...scope, reopen: true };
                    showDailyRecovery('This attempt changed or expired. Reopen today’s challenge to check the latest saved result.');
                } else {
                    copy.textContent = 'Could not check the result. Check your connection and try again.';
                }
            }
        } finally {
            await finishDailyOperation(scope);
            if (dailyRecovery === scope && dailyScopeIsCurrent(scope)) {
                check.disabled = false;
                if (dailyModalActive) check.focus();
            }
        }
    });
    if (dailyModalActive) check.focus();
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
    streak, receiptFeedback = ""
) {

    if (!feedbackElement) {
        return;
    }


    const explanation =
        receiptFeedback ||
        "Great work! You remembered an important part of Philippine History.";


    const rewardMessage =
        xpAwarded > 0
            ? ` +${xpAwarded} XP earned`
            : " Today's XP reward was already collected";


    const streakMessage =
        streak
            ? (
                streak === 1
                    ? " 1 Day Learning Streak"
                    : ` ${streak} Day Learning Streak`
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
    receiptFeedback = ""
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
    if(receiptFeedback){const note=document.createElement('p');note.textContent=receiptFeedback;feedbackElement.appendChild(note);}
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
    streak,
    answerText,
    explanation,
    completionState = 'previous'
) {

    if (!completedElement) {
        return;
    }


    const headings = {
        fresh: 'Correct! Your result is saved',
        recovered: 'Your saved result was found',
        previous: 'Already completed today'
    };
    completedElement.toggleAttribute('data-daily-fresh-result', completionState === 'fresh');
    const reward = Number.isSafeInteger(xpAwarded) && xpAwarded > 0
        ? '+' + xpAwarded + ' XP earned today' : 'No additional XP awarded';
    const streakText = Number.isSafeInteger(streak) && streak > 0 ? streak + ' day streak' : '';


    completedElement.innerHTML = `
        <div class="daily-complete-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none"><path d="M15 9h18v12a9 9 0 0 1-18 0V9Z" stroke="currentColor" stroke-width="2.5"/><path d="M15 13H9v5a8 8 0 0 0 8 8m16-13h6v5a8 8 0 0 1-8 8M24 30v8m-8 2h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="m24 13 2 4 4 .5-3 3 .7 4.5-3.7-2-3.7 2 .7-4.5-3-3 4-.5Z" fill="currentColor"/></svg>
        </div>

        <span class="daily-complete-label">
            DAILY CHALLENGE COMPLETE
        </span>

        <h3 tabindex="-1">${headings[completionState]}</h3>
        <div class="daily-complete-answer" hidden></div>

        <div class="daily-complete-rewards">

            <strong>
                 ${reward}
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
        <div class="daily-complete-return"><span aria-hidden="true">✦</span><p>Next challenge at midnight, Philippine time.</p></div>
        <button type="button" class="daily-complete-dismiss primary-button">Keep exploring <span aria-hidden="true">→</span></button>
    `;
    const answer = completedElement.querySelector('.daily-complete-answer');
    const hasAnswer = typeof answerText === 'string' && answerText.trim();
    const hasExplanation = typeof explanation === 'string' && explanation.trim();
    if (hasAnswer || hasExplanation) {
        const label = document.createElement('strong');
        label.textContent = hasAnswer ? 'Correct answer' : 'Explanation';
        answer.append(label);
        if (hasAnswer) {
            const value = document.createElement('p');
            value.textContent = answerText;
            answer.append(value);
        }
        if (hasExplanation) {
            const note = document.createElement('p');
            note.textContent = explanation;
            answer.append(note);
        }
        answer.hidden = false;
    }
    completedElement.querySelector('.daily-complete-dismiss')?.addEventListener('click', closeModal);
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

    if (dailyStatus) dailyStatus.textContent = ({loading:'Loading the daily challenge...',content:'Choose one answer, then submit.',completed:'Daily challenge complete.',empty:dailyLoadFailed?'Unable to load today’s challenge.':'No challenge is available right now.'})[state] || '';
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
        if (!contentElement.classList.contains('daily-dispatch-open') && currentChallenge) {
            contentElement.classList.add('daily-dispatch-open');
            const label = contentElement.querySelector('.daily-question-number');
            if (label && currentChallengeDate) label.textContent = 'Daily question · ' + currentChallengeDate;
        }
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
        const title = emptyElement.querySelector('strong');
        const details = emptyElement.querySelector('p');
        if (title) title.textContent = dailyLoadFailed ? 'Daily Challenge unavailable' : 'No challenge available';
        if (details) details.textContent = dailyLoadFailed ? 'Check your connection and try again.' : 'Check back later for another Philippine History challenge.';
        if (dailyLoadRetry) dailyLoadRetry.hidden = !dailyLoadFailed;
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
