import { missionReviewTopics } from "./mission-review.js";
import { reviewQuestionSnapshot } from "./review-question-catalog.js";
import { resolveStudentJourney, renderStudentJourney } from "./student-journey.js";
import { renderReviewTopics } from "./practice-review.js";
import { listReturnTopics, chooseRecallQuestion, renderReturnToLearn, requireReturnPolicy } from "./return-to-learn.js";
import { loadProgressionPolicy } from "./progression.js";
import { instructionalSnapshot } from "./instructional-snapshot.js";
import { renderHomeLearningTrail } from "./home-learning-trail.js";
import { progressionState } from "./progression-policy.js";
import { renderExplorerDesk } from './explorer-desk.js';
import { renderDashboardExpedition } from './dashboard-expedition.js';
// ==========================================
// LAKBAYPANAHON
// STUDENT DASHBOARD
// ==========================================

import { renderStudentIdentity } from "./student-profile.js";
import { onVerifiedStudentChange } from "./auth-guard.js";
import {
    auth,
    db
} from "./firebase-config.js";


import {
    collection,
    doc,
    getDocFromServer,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ==========================================
// AUTHENTICATED STUDENT
// ==========================================

let dashboardGeneration = 0;
let dashboardAccess = null;
async function loadStudentDashboard(access) {
        dashboardAccess = access;
        const user = access?.user;
        const expeditionArt=document.getElementById('homeExpeditionArt');if(expeditionArt?.replaceChildren)expeditionArt.replaceChildren();
        document.getElementById("dashboardRetryProgression")?.remove();
        const generation = ++dashboardGeneration;
        const isCurrent = () => generation === dashboardGeneration && auth.currentUser?.uid === user?.uid;
        const desk=document.getElementById('explorerDesk');if(desk?.replaceChildren)renderExplorerDesk(desk,{});

        if (!user) {
            for (const id of ["studentFirstName","topStudentName","studentXp","topXp","studentLevel","topStudentLevel","missionsCompleted","badgesEarned","levelProgressXp","nextLevelText"]) setText(id,"Sign in");

            loadCurrentJourney.request = Symbol("signed-out");
            const journey = document.getElementById("newJourneyState");
            if (journey) journey.textContent = "Sign in to view your learning journey.";
            const trail=document.getElementById('homeLearningTrail');if(trail)trail.textContent='Sign in to view your lessons.';
            const review=document.getElementById('studentReviewTopics');if(review)review.textContent='Sign in to view your review topics.';
            const returnPanel=document.getElementById('studentReturnTopic');if(returnPanel)returnPanel.textContent='Sign in to see a topic from your journey.';
            const reviewReload=document.getElementById('reloadStudentReview');if(reviewReload)reviewReload.disabled=true;
            return;
        }


        for (const id of ['studentXp','topXp','studentLevel','topStudentLevel','missionsCompleted','badgesEarned','levelProgressXp','nextLevelText']) setText(id, 'Loading?');

        try {

            if (!isCurrent()) return;
            const student = access.profile;

            // A level-settings read is independent of access, drafts and the next lesson.
            const sharedMissionProgress = getDocs(query(collection(db,'studentProgress'),where('userId','==',user.uid)));
            const progressionSnapshot = getDocFromServer(doc(db,"learningSettings","progression"));
            const dashboardSections = Promise.allSettled([
                loadCompletedMissionCount(user.uid,sharedMissionProgress),
                loadCurrentJourney(user.uid,sharedMissionProgress,progressionSnapshot),
                loadBadgeCount(user.uid)
            ]);

            // ==================================
            // BASIC STUDENT INFORMATION
            // ==================================

            const firstName =
                student.firstName ||
                student.name ||
                "Student";


            const xp =
                Number(student.xp) || 0;


            let progressionPolicy = null;
            try { progressionPolicy = await loadProgressionPolicy(progressionSnapshot); }
            catch (error) { console.warn(error.message); }
            if (!isCurrent()) return;
            const level = progressionPolicy ? progressionState(xp, progressionPolicy).level : "Unavailable";


            // ==================================
            // PROFILE DISPLAY
            // ==================================

            setText(
                "studentFirstName",
                firstName
            );


            setText(
                "topStudentName",
                firstName
            );


            setText(
                "studentXp",
                `${xp} XP`
            );


            setText(
                "topXp",
                `${xp} XP`
            );


            setText(
                "studentLevel",
                `Level ${level}`
            );


            setText(
                "topStudentLevel",
                `Level ${level}`
            );


            // ==================================
            // PROFILE AVATAR
            // ==================================

            const profileAvatar =
                document.getElementById(
                    "profileAvatar"
                );


            if (profileAvatar) {

                renderStudentIdentity(student);
            }


            // ==================================
            // PLAYER LEVEL / XP PROGRESS
            // ==================================

            loadPlayerProgress(
                xp,
                level,
                progressionPolicy,
                user.uid
            );


            if (!progressionPolicy) {
                const container = document.getElementById("nextLevelText")?.parentElement;
                if (container) appendDashboardRetry(container,"Retry Level Settings","dashboardRetryProgression");
            }

            // ==================================
            // DASHBOARD DATA
            // ==================================

            const sections = await dashboardSections;
            if (!isCurrent()) return;
            for (const section of sections) if (section.status === "rejected") {
                console.warn("A dashboard section could not finish loading:", section.reason);
            }

        } catch (error) {
            if (!isCurrent()) return;
            for (const id of ['studentXp','topXp','studentLevel','topStudentLevel','missionsCompleted','badgesEarned','levelProgressXp','nextLevelText']) setText(id, 'Not loaded');
            const panel = document.getElementById("newJourneyState");
            if (panel) {
                panel.textContent = "We could not finish loading your dashboard. Your saved progress is unchanged.";
                appendDashboardRetry(panel,"Retry Loading Dashboard");
            }
            console.error(
                "Unable to load student dashboard:",
                error
            );
        }

}
onVerifiedStudentChange(loadStudentDashboard);


// ==========================================
// PLAYER PROGRESS
// ==========================================

function loadPlayerProgress(
    xp,
    level,
    policy,
    userId
) {
    if (!policy) {
        setText("levelProgressXp", "Level settings unavailable");
        setText("nextLevelText", "Level settings could not be loaded.");
        const bar = document.getElementById("levelProgressBar");
        if (bar) bar.style.width = "0%";
        return;
    }
    const {xpPerLevel, xpInLevel: xpInsideCurrentLevel, percent: levelProgressPercent, xpUntilNextLevel} = progressionState(xp, policy);

    setText(
        "levelProgressXp",
        `${xpInsideCurrentLevel} / ${xpPerLevel} XP`
    );


    setText(
        "nextLevelText",
        `${xpUntilNextLevel} XP until Level ${level + 1}`
    );


    const levelProgressBar =
        document.getElementById(
            "levelProgressBar"
        );


    if (levelProgressBar) {

        levelProgressBar.style.width =
            `${levelProgressPercent}%`;
        const deltaNotice = document.getElementById('dashboardXpGain');
        if (deltaNotice) deltaNotice.hidden = true;
        let previous;
        try {
            const key = 'lakbay-confirmed-dashboard-xp:' + userId;
            const stored = sessionStorage.getItem(key);
            if (stored !== null) previous = Number(stored);
            sessionStorage.setItem(key, String(xp));
        } catch {}
        if (Number.isFinite(previous) && previous >= 0 && xp > previous) {
            if (deltaNotice) {
                deltaNotice.textContent = '+' + (xp - previous) + ' XP since your last dashboard visit';
                deltaNotice.hidden = false;
            }
            if (levelProgressBar.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
                !document.body.classList.contains('lakbay-reduce-motion')) {
                const prior = progressionState(previous, policy);
                const frames = [{width:prior.percent+'%'}];
                if (prior.level !== level) frames.push({width:'100%',offset:.48},{width:'0%',offset:.49});
                frames.push({width:levelProgressPercent+'%'});
                levelProgressBar.animate(frames,{duration:450,easing:'ease-out'});
            }
        }
    }


    const levelProgressTrack =
        document.getElementById(
            "levelProgressTrack"
        );


    if (levelProgressTrack) {

        levelProgressTrack.setAttribute(
            "aria-valuenow",
            String(
                levelProgressPercent
            )
        );
    }
}


// ==========================================
// COMPLETED MISSION COUNT
// ==========================================

async function loadCompletedMissionCount(
    userId, sharedProgress = null
) {
    const generation = dashboardGeneration;
    const isCurrent = () => generation === dashboardGeneration && auth.currentUser?.uid === userId;
    if (!isCurrent()) return;

    document.getElementById('missionsCompletedRetry')?.remove?.();

    try {

        const progressQuery =
            query(
                collection(
                    db,
                    "studentProgress"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const progressSnapshot = await (sharedProgress || getDocs(progressQuery));
                if (!isCurrent()) return;


        const completedMissionIds = new Set();


        progressSnapshot.forEach(
            (progressDocument) => {

                const progress =
                    progressDocument.data();


                if (progress.userId === userId && progress.completed === true &&
                    typeof progress.missionId === 'string' && progress.missionId.trim())
                    completedMissionIds.add(progress.missionId);

            }
        );


        setText(
            "missionsCompleted",
            completedMissionIds.size
        );


    } catch (error) {
                if (!isCurrent()) return;

        setText('missionsCompleted', 'Not loaded');
        const count = document.getElementById('missionsCompleted');
        if (count?.parentElement) appendDashboardRetry(count.parentElement, 'Retry mission count', 'missionsCompletedRetry', () => loadCompletedMissionCount(userId));
        console.error(
            "Unable to load completed mission count:",
            error
        );
    }
}


// ==========================================
// CURRENT JOURNEY
// ==========================================

async function loadCurrentJourney(userId,sharedProgress=null,progressionSnapshot=null) {
    if (auth.currentUser?.uid !== userId) return;
    const request = Symbol("journey-request");
    loadCurrentJourney.request = request;
    const isCurrent = () => loadCurrentJourney.request === request && auth.currentUser?.uid === userId;
    const container = document.getElementById("newJourneyState");
    const reviewPanel=document.getElementById('studentReviewTopics'),reviewReload=document.getElementById('reloadStudentReview');
    const returnPanel=document.getElementById('studentReturnTopic');
    const trail=document.getElementById('homeLearningTrail');
    if (!container) return;
    if(reviewPanel)reviewPanel.textContent='Loading your review topics...';
    if(returnPanel)returnPanel.textContent='Finding a topic from your journey...';
    if(trail)trail.textContent='Loading your lessons...';
    if(reviewReload)reviewReload.disabled=true;
    try {
        const names = ["chapters", "eras", "missions", "chapterChallenges", "studentChapterProgress", "studentProgress", "studentQuizAttempts", "studentLearningDrafts", "studentPracticeProgress", "practiceQuestions", "studentReviewEvents", "returnPolicy"];
        const requests = names.map(name => name === "returnPolicy"
            ? progressionSnapshot ?? getDocFromServer(doc(db,"learningSettings","progression")) : name === "practiceQuestions"
            ? Promise.resolve({docs:[]}) : name === 'studentProgress' && sharedProgress ? sharedProgress : name.startsWith("student")
            ? getDocs(query(collection(db,name),where("userId","==",userId)))
            : instructionalSnapshot(name,()=>getDocs(collection(db,name))));
        const optionalResults = Promise.allSettled(requests.slice(9));
        const results = await Promise.allSettled(requests.slice(0,9));
        if (!isCurrent()) return;
        const rows = snapshot => snapshot.docs.map(item=>({...item.data(),id:item.id}));
        const failedCore = results.slice(0,7).find(result=>result.status === "rejected");
        if (failedCore) throw failedCore.reason;
        const [chapters,eras,missions,challenges,chapterProgress,missionProgress,attempts,drafts,practiceHistory] =
            results.map(result=>result.status==="fulfilled"?rows(result.value):[]);
        const journeyData={userId,chapters,eras,missions,challenges,chapterProgress,missionProgress,attempts,drafts,practiceSessions:practiceHistory};
        const preview=resolveStudentJourney(journeyData);
        // Failed attempts and completed journeys may still need topic evidence to pick an action.
        const showCoreEarly=preview.kind!=="complete"&&preview.attempt?.passed!==false;
        const renderJourney=state=>{
            if(trail)renderHomeLearningTrail(trail,journeyData,state);
            renderStudentJourney(container,state,()=>loadCurrentJourney(userId));
            if(document.getElementById('homeExpeditionArt')){
                renderDashboardExpedition(state,eras,async missionId=>rows(await instructionalSnapshot(
                    'dashboard-mission-art:'+missionId,
                    ()=>getDocs(query(collection(db,'storyScenes'),where('missionId','==',missionId)))
                )),isCurrent);
            }
            const desk=document.getElementById('explorerDesk');
            if(desk?.replaceChildren)renderExplorerDesk(desk,state);
        };
        preview.optionalGuidanceUnavailable=results.slice(7).some(result=>result.status==="rejected");
        if(showCoreEarly)renderJourney(preview);
        const optional=await optionalResults;
        if(!isCurrent())return;
        results.push(...optional);
        // Avoid downloading every mission's bank on every dashboard visit.
        if (results[8].status === "fulfilled") {
            try {
                results[9] = {status:"fulfilled",value:await reviewQuestionSnapshot(userId,
                    rows(results[6].value), rows(results[8].value), missionId =>
                        getDocs(query(collection(db,"practiceQuestions"),where("missionId","==",missionId))))};
            } catch (reason) { results[9] = {status:"rejected",reason}; }
        } else results[9] = {status:"rejected",reason:results[8].reason};
        if (!isCurrent()) return;
        const [practiceQuestions,reviewEvents]=results.slice(9,11).map(result=>result.status==="fulfilled"?rows(result.value):[]);
        const reviewAvailable = results[8].status === "fulfilled" && results[9].status === "fulfilled" && results[10].status === "fulfilled";
        const topics=reviewAvailable?missionReviewTopics(attempts.filter(row=>row.userId===userId),practiceHistory.filter(row=>row.userId===userId),practiceQuestions,reviewEvents):undefined;
        const state=resolveStudentJourney({...journeyData,reviewTopics:topics});
        state.optionalGuidanceUnavailable=results.slice(7,11).some(result=>result.status==="rejected");
        if(!showCoreEarly||state.optionalGuidanceUnavailable!==preview.optionalGuidanceUnavailable){
            renderJourney(state);
        }
        if(returnPanel){
            if(reviewAvailable&&results[11].status==='fulfilled'){
                const activeEras=new Set(eras.filter(era=>era.status==='active').map(era=>era.id));
                const readyChapters=new Set(chapters.filter(chapter=>chapter.status==='active'&&chapter.contentReady!==false&&(!chapter.eraId||activeEras.has(chapter.eraId))).map(chapter=>chapter.id));
                try {
                    const policy=results[11].value.data();
                    requireReturnPolicy(policy);
                    const due=listReturnTopics({userId,policy,missions:missions.filter(mission=>readyChapters.has(mission.chapterId)),missionProgress,attempts,practiceSessions:practiceHistory,questions:practiceQuestions});
                    let index=0;
                    const show=()=>{
                        if(!isCurrent())return;
                        const topic=due[index]||null;
                        renderReturnToLearn(returnPanel,topic,chooseRecallQuestion(topic,practiceQuestions),index<due.length-1?()=>{index++;show();}:null);
                    };
                    show();
                } catch {returnPanel.textContent='Your memory check is being prepared. Use Refresh Review later.';}
            }else returnPanel.textContent='Your past learning could not be checked right now. Use Refresh Review to try again.';
        }
        if(reviewPanel){
            if(reviewAvailable){
                const activeEras=new Set(eras.filter(era=>era.status==='active').map(era=>era.id));
                const readyChapters=new Set(chapters.filter(chapter=>chapter.status==='active'&&chapter.contentReady!==false&&(!chapter.eraId||activeEras.has(chapter.eraId))).map(chapter=>chapter.id));
                const chaptersByMission=new Map(missions.filter(mission=>mission.status==='active'&&readyChapters.has(mission.chapterId)).map(mission=>[mission.id,mission.chapterId]));
                renderReviewTopics(reviewPanel,topics.filter(topic=>topic.missed>0&&chaptersByMission.has(topic.missionId)),chaptersByMission,'Your saved quizzes and practice currently show no topics needing extra review. Continue learning to build more evidence.');
            }else reviewPanel.textContent='We could not load your review topics. Try Refresh Review again.';
        }
    } catch (error) {
        console.warn("Journey loading failed:",error);
        if (isCurrent()) {
            renderStudentJourney(container, {kind:"error"}, () => loadCurrentJourney(userId));
            document.getElementById('homeExpeditionArt')?.replaceChildren();
            const desk=document.getElementById('explorerDesk');
            if(desk?.replaceChildren)renderExplorerDesk(desk,{});
            if(trail)trail.textContent='Your lessons could not load. Retry from Continue Journey.';
            if(reviewPanel)reviewPanel.textContent='We could not load your review topics. Try Refresh Review again.';
            if(returnPanel)returnPanel.textContent='Your past learning could not be checked right now. Use Refresh Review to try again.';
        }
    } finally {
        if(isCurrent()&&reviewReload)reviewReload.disabled=false;
    }
}
document.getElementById('reloadStudentReview')?.addEventListener('click',()=>{if(auth.currentUser)loadCurrentJourney(auth.currentUser.uid);});
async function loadBadgeCount(
    userId
) {
    const generation = dashboardGeneration;
    const isCurrent = () => generation === dashboardGeneration && auth.currentUser?.uid === userId;
    if (!isCurrent()) return;

    document.getElementById('badgesEarnedRetry')?.remove?.();

    try {

        const badgeQuery =
            query(
                collection(
                    db,
                    "studentBadges"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const badgeSnapshot =
            await getDocs(
                badgeQuery
            );
                if (!isCurrent()) return;


        const earnedBadgeIds = new Set();
        badgeSnapshot.forEach(row=>{
            const badge=row.data();
            if(badge.userId===userId&&typeof badge.badgeId==='string'&&badge.badgeId&&!badge.badgeId.includes('/'))
                earnedBadgeIds.add(badge.badgeId);
        });
        setText("badgesEarned",earnedBadgeIds.size);


    } catch (error) {
                if (!isCurrent()) return;

        setText('badgesEarned', 'Not loaded');
        const count = document.getElementById('badgesEarned');
        if (count?.parentElement) appendDashboardRetry(count.parentElement, 'Retry badge count', 'badgesEarnedRetry', () => loadBadgeCount(userId));
        console.error(
            "Unable to load badge count:",
            error
        );
    }
}


// ==========================================
// TEXT HELPERS
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


function appendDashboardRetry(container,label,id,retry) {
    const button=document.createElement("button");button.type="button";button.className="text-button";button.textContent=label;
    if(id)button.id=id;
    button.addEventListener("click",async()=>{
        if(button.disabled || !auth.currentUser)return;
        button.disabled=true;
        try { await (retry ? retry() : loadStudentDashboard(dashboardAccess)); }
        finally { button.disabled=false; }
    });
    container.append(button);
}
