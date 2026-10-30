import {mountEvidenceSaver} from './evidence-journal.js';
import { evaluateRoute, renderRouteInvestigation } from "./story-route.js";
import {evaluateExhibit, renderExhibit} from "./story-exhibit.js";
import { recordLessonReview } from "./review-events.js";
import { validateTradeActivity, evaluateTradePlan } from './story-trade.js';
import { stableDraftVersion } from "./quiz-draft-policy.js";
import { mountLearningNavigation } from "./learning-navigation.js";
import { requireMissionPolicy } from "./mission-assessment.js";
import { learningDraft, draftStatus, restartControl } from "./learning-draft.js";


import { db, auth } from "./firebase-config.js";
import { requireLearningAccess, LearningAccessError } from "./learning-access.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* =========================================================
   LAKBAYPANAHON — VISUAL STORY MODE
   Firestore-driven scenes and interactive activities
   ========================================================= */

/* =========================================================
   ELEMENTS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const storyLoading = $("storyLoading");
const storyError = $("storyError");
const retryStoryLoadButton = $("retryStoryLoadButton");
let storySessionGeneration = 0;
let storyLoadPending = false;
let storyUserId = null;
let storyDraft = null, storyDraftReady = false;
const storyDraftStatus = draftStatus(document.getElementById("storyContent"));
const restartStoryButton = restartControl(document.getElementById("storyContent"), "Start Lesson Over", async () => {
    if (!auth.currentUser || storyLoadPending) return;
    const generation = storySessionGeneration;
    storyDraftReady = false;
    try {
        await storyDraft.clear();
        if (generation !== storySessionGeneration) return;
        await loadStory();
    } catch {
        if (generation !== storySessionGeneration) return;
        storyDraft = learningDraft("story", chapterId, missionId, storyDraftStatus);
        storyDraftReady = true;
        storyDraftStatus.textContent = "Could not restart. Your current lesson is still available. Try again.";
    }
});
storyDraftStatus.classList.add("story-draft-status");
storyDraftStatus.retryButton.classList.add("story-draft-retry");
restartStoryButton.classList.add("story-restart-button");
const storyProgressActions = document.getElementById("storyProgressActions");
storyProgressActions?.append(storyDraftStatus, storyDraftStatus.retryButton, restartStoryButton);
let storyContentVersion = "";
let loadedStoryMission = null;
let quizInfoRequest = 0;
const storyContent = $("storyContent");

const storyMissionTitle = $("storyMissionTitle");
const storyChapterTitle = $("storyChapterTitle");

const storyReadingCard = $("storyReadingCard");
const sceneLabel = $("sceneLabel");
const sceneTitle = $("sceneTitle");
const storyText = $("storyText");

/* =========================================================
   AI STORY EXPLANATION
   ========================================================= */

const storyAiExplainButton = $("storyAiExplainButton");
const storyAiExplainResponse = $("storyAiExplainResponse");

function sceneHelp(scene){const h=scene?.learningHelp;return h&&typeof h.explanation==='string'&&h.explanation.trim()?h:null;}
function resetStoryAiExplanation(){const help=sceneHelp(getCurrentScene());if(storyAiExplainButton){storyAiExplainButton.hidden=!help;storyAiExplainButton.disabled=!help;storyAiExplainButton.setAttribute('aria-expanded','false');}if(storyAiExplainResponse){storyAiExplainResponse.replaceChildren();storyAiExplainResponse.hidden=true;}}

const storyVisual = $("storyVisual");
const storySceneImage = $("storySceneImage");
const storyVisualFallback = $("storyVisualFallback");
const storyVisualCaption = $("storyVisualCaption");

const storyExplore = $("storyExplore");
const storyExploreIntroduction = $("storyExploreIntroduction");
const storyExploreChoices = $("storyExploreChoices");
const storyClueHunt = $("storyClueHunt");
const storyClueHuntTitle = $("storyClueHuntTitle");
const storyClueHuntInstructions = $("storyClueHuntInstructions");
const storyClueHuntLock = $("storyClueHuntLock");
const storyClueHuntQuestion = $("storyClueHuntQuestion");
const storyClueHuntPrompt = $("storyClueHuntPrompt");
const storyClueHuntChoices = $("storyClueHuntChoices");
const storyClueHuntFeedback = $("storyClueHuntFeedback");
const storyClueHuntFeedbackTitle = $("storyClueHuntFeedbackTitle");
const storyClueHuntFeedbackText = $("storyClueHuntFeedbackText");

const storyDiscovery = $("storyDiscovery");
const storyDiscoveryTitle = $("storyDiscoveryTitle");
const storyDiscoveryText = $("storyDiscoveryText");

const storyKeyTerm = $("storyKeyTerm");
const storyKeyTermName = $("storyKeyTermName");
const storyKeyTermDefinition = $("storyKeyTermDefinition");

const storyDecision = $("storyDecision");
const storyDecisionSituation = $("storyDecisionSituation");
const storyDecisionQuestion = $("storyDecisionQuestion");
const storyDecisionChoices = $("storyDecisionChoices");
const storyDecisionFeedback = $("storyDecisionFeedback");
const storyDecisionFeedbackTitle = $("storyDecisionFeedbackTitle");
const storyDecisionExplanation = $("storyDecisionExplanation");

const historicalInsight = $("historicalInsight");
const historicalInsightText = $("historicalInsightText");

const storyQuickCheck = $("storyQuickCheck");
const quickCheckQuestion = $("quickCheckQuestion");
const quickCheckChoices = $("quickCheckChoices");
const quickCheckFeedback = $("quickCheckFeedback");
const quickCheckFeedbackTitle = $("quickCheckFeedbackTitle");
const quickCheckFeedbackText = $("quickCheckFeedbackText");

const sceneProgressText = $("sceneProgressText");
const storyProgressFill = $("storyProgressFill");

const continueStoryButton = $("continueStoryButton");
const previousStoryButton = $("previousStoryButton");
const storyCompleteSection = $("storyCompleteSection");
const backToMissionButton = $("backToMissionButton");
const quizButton = $("quizButton");

/* =========================================================
   URL PARAMETERS
   ========================================================= */

const params = new URLSearchParams(window.location.search);

const chapterId = params.get("chapter");
const missionId = params.get("mission");
const reviewTopic = (params.get("reviewTopic") || "").trim();
let topicReviewMapped = false;
let reviewSavePending=null;

/* =========================================================
   STORY STATE
   ========================================================= */

let scenes = [];
let currentSceneIndex = 0;

const completedQuickChecks = new Set();
const completedStoryDecisions = new Set();
const completedClueHunts = new Set();
const exploredSceneItems = new Map();
const storyTradePlans = new Map();
const storyRoutePlans = new Map();
const storyExhibitPlans = new Map();

/*
   Activity completion is session-only.

   Story Mode does not award XP or write progress
   to Firestore. The existing Quiz and Mission
   systems remain responsible for their own
   progress and rewards.
*/

/* =========================================================
   HELPERS
   ========================================================= */

function clean(value) {
    return String(value ?? "").trim();
}

function showError(message) {
    if (retryStoryLoadButton) retryStoryLoadButton.hidden = !auth.currentUser || !chapterId || !missionId;
    if (storyLoading) {
        storyLoading.hidden = true;
    }

    if (storyContent) {
        storyContent.hidden = true;
    }

    if (storyError) {
        storyError.textContent = message;
        storyError.hidden = false;
    }
}

function getCurrentScene() {
    return scenes[currentSceneIndex] || null;
}

function getExploredItemsForScene(scene) {
    if (!scene || !scene.id) {
        return new Set();
    }

    if (!exploredSceneItems.has(scene.id)) {
        exploredSceneItems.set(scene.id, new Set());
    }

    return exploredSceneItems.get(scene.id);
}

function getValidChoices(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return values
        .map((value) => clean(value))
        .filter(Boolean);
}

function getExploreItems(scene) {
    if (!Array.isArray(scene?.exploreItems)) {
        return [];
    }

    return scene.exploreItems.filter((item) => {
        return (
            item &&
            typeof item === "object" &&
            clean(item.title) &&
            clean(item.discovery)
        );
    });
}

function getClueHunt(scene) {
    const activity = scene?.clueHunt;
    const choices = Array.isArray(activity?.choices)
        ? activity.choices.map((choice) => clean(choice)).filter(Boolean)
        : [];
    const correctAnswer = clean(activity?.correctAnswer);

    if (
        !activity ||
        typeof activity !== "object" ||
        getExploreItems(scene).length < 2 ||
        !clean(activity.title) ||
        !clean(activity.instructions) ||
        !clean(activity.question) ||
        choices.length < 2 ||
        new Set(choices).size !== choices.length ||
        !choices.includes(correctAnswer) ||
        !clean(activity.correctExplanation) ||
        !clean(activity.retryExplanation)
    ) {
        return null;
    }

    return { ...activity, choices, correctAnswer };
}

function isSceneClueHuntComplete(scene) {
    return !getClueHunt(scene) || completedClueHunts.has(scene.id);
}

function isSafeImageUrl(value) {
    const url = clean(value);

    if (!url) {
        return false;
    }

    try {
        const parsed = new URL(url, window.location.href);

        return (
            parsed.protocol === "https:" ||
            (
                parsed.origin === window.location.origin &&
                parsed.protocol === window.location.protocol
            )
        );
    } catch {
        return false;
    }
}

function scrollToSection(element) {
    if (!element) {
        return;
    }

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches || document.body.classList.contains('lakbay-reduce-motion');

    element.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
    });
}

/* =========================================================
   LOAD STORY FROM FIRESTORE
   ========================================================= */

function topicPracticeUrl(){return 'practice.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,topic:reviewTopic,review:'1'});}
function renderTopicReviewNotice(){
    document.getElementById('topicReviewNotice')?.remove();
    const panel=document.createElement('section');panel.id='topicReviewNotice';panel.className='topic-review-notice';panel.setAttribute('aria-label','Topic review');
    const heading=document.createElement('div');heading.className='topic-review-heading';
    const mark=document.createElement('span');mark.className='topic-review-mark';mark.setAttribute('aria-hidden','true');mark.textContent='↻';
    const headingCopy=document.createElement('div');headingCopy.className='topic-review-heading-copy';
    const eyebrow=document.createElement('span');eyebrow.className='topic-review-eyebrow';eyebrow.textContent='YOUR PERSONALIZED REVIEW';
    const title=document.createElement('h2');title.textContent='Review the lesson: '+reviewTopic;
    headingCopy.append(eyebrow,title);heading.append(mark,headingCopy);
    const copy=document.createElement('p');copy.textContent=topicReviewMapped?'These story scenes teach the topic recommended for review. Explore the explanations and complete any scene checks, then apply what you learned in practice.':'A specific scene link has not been configured for this topic yet. Review the full mission lesson, then continue to targeted practice.';
    const note=document.createElement('p');note.textContent='This review keeps your unfinished lesson position unchanged. Revisiting content does not award XP or clear a review recommendation.';
    const full=document.createElement('a');full.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId});full.className='text-button';full.textContent='Open Full Lesson';
    const back=document.createElement('a');back.href='my-journey.html';back.className='text-button';back.textContent='Back to My Journey';
    const steps=document.createElement('ol');steps.className='review-flow-steps';steps.setAttribute('aria-label','Learning recovery steps');
    for(const [index,label] of ['Review the lesson','Apply in practice','Choose your next step'].entries()){const item=document.createElement('li');if(index===0)item.setAttribute('aria-current','step');const number=document.createElement('span');number.setAttribute('aria-hidden','true');number.textContent=String(index+1);item.append(number,document.createTextNode(label));steps.append(item);}
    const actions=document.createElement('div');actions.className='topic-review-actions';actions.append(full,back);
    panel.append(heading,steps,copy,note,actions);storyContent.prepend(panel);
}

async function loadStory() {
    if (!auth.currentUser || storyLoadPending) return;
    const generation = storySessionGeneration;
    const isCurrent = () => generation === storySessionGeneration;
    if (!chapterId || !missionId) {
        showError(
            "The chapter or mission was not selected."
        );
        return;
    }

    quizInfoRequest++;
    quizButton.disabled = true;
    storyLoadPending = true;
    storyLoading.hidden = false;
    storyError.hidden = true;
    storyContent.hidden = true;
    if (retryStoryLoadButton) retryStoryLoadButton.hidden = true;
    try {
        await requireLearningAccess(chapterId, missionId);
        if (!isCurrent()) return;
        const chapterSnapshot = await getDoc(
            doc(db, "chapters", chapterId)
        );

        if (!isCurrent()) return;
        if (!chapterSnapshot.exists()) {
            showError(
                "The selected chapter could not be found."
            );
            return;
        }

        const missionSnapshot = await getDoc(
            doc(db, "missions", missionId)
        );

        if (!isCurrent()) return;
        if (!missionSnapshot.exists()) {
            showError(
                "The selected mission could not be found."
            );
            return;
        }

        const chapter = chapterSnapshot.data();
        const mission = missionSnapshot.data();
        loadedStoryMission = mission;

        if (mission.chapterId !== chapterId) {
            showError(
                "This mission does not belong to the selected chapter."
            );
            return;
        }

        storyMissionTitle.textContent =
            clean(mission.title) || "Story Mission";

        storyChapterTitle.textContent =
            clean(chapter.title) || "Historical Chapter";

        /*
           Only load scenes belonging to this mission.

           Sorting remains client-side, so this query
           does not require a compound Firestore index.
        */

        const sceneQuery = query(
            collection(db, "storyScenes"),
            where("missionId", "==", missionId)
        );

        const sceneSnapshot = await getDocs(sceneQuery);

        if (!isCurrent()) return;
        scenes = [];

        sceneSnapshot.forEach((snapshot) => {
            const scene = snapshot.data();

            if (scene.status === "active") {
                scenes.push({
                    ...scene,
                    id: snapshot.id
                });
            }
        });

        scenes.sort((a, b) => {
            return (
                (Number(a.order) || 0) -
                (Number(b.order) || 0)
            );
        });

        if (scenes.length === 0) {
            showError(
                "No story scenes are available for this mission yet."
            );
            return;
        }

        if(reviewTopic){
            const mapped=scenes.filter(scene=>Array.isArray(scene.reviewTopics)&&scene.reviewTopics.includes(reviewTopic));
            topicReviewMapped=mapped.length>0;
            if(topicReviewMapped)scenes=mapped;
            renderTopicReviewNotice();
        }
        storyDraft?.close();
        storyDraftReady = false;
        storyDraft = reviewTopic ? null : learningDraft("story", chapterId, missionId, storyDraftStatus);
        const savedDraft = reviewTopic ? null : await storyDraft.read();
        if (!isCurrent()) return;
        const existingLessonScenes = scenes.map(({ clueHunt, ...scene }) => scene);
        storyContentVersion = stableDraftVersion(existingLessonScenes).split("").reduce((hash,char) => Math.imul(hash ^ char.charCodeAt(0),16777619),2166136261).toString();
        currentSceneIndex = 0;

        reviewSavePending=null;
        storyTradePlans.clear();storyRoutePlans.clear();storyExhibitPlans.clear();
        completedQuickChecks.clear();
        completedStoryDecisions.clear();
        completedClueHunts.clear();
        exploredSceneItems.clear();

        if (savedDraft?.version === storyContentVersion) {
            for (const id of savedDraft.quickChecks || []) if (scenes.some(scene=>scene.id===id)) completedQuickChecks.add(id);
            for (const id of savedDraft.decisions || []) if (scenes.some(scene=>scene.id===id)) completedStoryDecisions.add(id);
            const savedClueHuntVersions = savedDraft.clueHuntVersions || {};
            for (const id of savedDraft.clueHunts || []) {
                const scene = scenes.find(item => item.id === id);
                const activity = getClueHunt(scene);
                if (activity && savedClueHuntVersions[id] === stableDraftVersion(activity)) completedClueHunts.add(id);
            }
            for (const [id,items] of Object.entries(savedDraft.explored || {})) if (Array.isArray(items)) exploredSceneItems.set(id,new Set(items));
            for(const [id,plan] of Object.entries(savedDraft.tradePlans||{}))if(scenes.some(scene=>scene.id===id&&scene.tradeActivity))storyTradePlans.set(id,plan);
            for(const [id,plan] of Object.entries(savedDraft.routePlans||{}))if(scenes.some(scene=>scene.id===id&&scene.routeActivity))storyRoutePlans.set(id,plan);
            for(const [id,plan] of Object.entries(savedDraft.exhibitPlans||{}))if(scenes.some(scene=>scene.id===id&&scene.exhibitActivity))storyExhibitPlans.set(id,plan);
            const index = scenes.findIndex(scene=>scene.id===savedDraft.sceneId);
            if (index >= 0) currentSceneIndex = index;
        }
        restartStoryButton.hidden = !savedDraft;
        storyCompleteSection.hidden = true;
        storyReadingCard.hidden = false;

        displayScene();
        const savedLessonWasCompletedBeforeClueHunt = savedDraft?.completed === true && !savedDraft?.clueHuntVersions;
        if (savedDraft?.version === storyContentVersion && savedDraft.completed === true &&
            scenes.every(scene=>isSceneExploreComplete(scene) && (savedLessonWasCompletedBeforeClueHunt || isSceneClueHuntComplete(scene)) && isStoryDecisionComplete(scene) && (!sceneHasQuickCheck(scene) || completedQuickChecks.has(scene.id)))) {
            storyReadingCard.hidden = true;
            storyCompleteSection.hidden = false;
            storyProgressFill.style.width = "100%";
            sceneProgressText.textContent = "Completed";
            loadLessonQuizInfo();
        }

        storyDraftReady = !reviewTopic;
        saveStoryPlace(getCurrentScene(), !storyCompleteSection.hidden);
        storyLoading.hidden = true;
        storyError.hidden = true;
        storyContent.hidden = false;

    } catch (error) {
        if (!isCurrent()) return;
        console.error("Unable to load story:", error);

        showError(
            error instanceof LearningAccessError ? error.message : "We could not load this story mission. Please try again."
        );
    } finally {
        if (isCurrent()) storyLoadPending = false;
    }
}

/* =========================================================
   DISPLAY SCENE
   ========================================================= */

function displayScene() {
    if (previousStoryButton) previousStoryButton.disabled=currentSceneIndex===0;
    const scene = getCurrentScene();

   if (!scene) {
    return;
}

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        storyReadingCard.classList.remove('story-scene-arrival');
        void storyReadingCard.offsetWidth;
        storyReadingCard.classList.add('story-scene-arrival');
    }

resetStoryAiExplanation();

    const sceneNumber = currentSceneIndex + 1;
    const totalScenes = scenes.length;
    
    const trail=document.getElementById('storySceneTrail');
    if(trail){trail.replaceChildren();for(const [index,entry] of scenes.entries()){const marker=document.createElement('li');marker.textContent=String(index+1);marker.title=entry.title||'Scene '+(index+1);marker.setAttribute('aria-label','Scene '+(index+1)+': '+(entry.title||'Learning scene'));if(index===currentSceneIndex)marker.setAttribute('aria-current','step');trail.append(marker);}}
    sceneLabel.textContent = `SCENE ${sceneNumber}`;

    sceneTitle.textContent =
        clean(scene.title) || `Scene ${sceneNumber}`;

    displaySceneVisual(scene);
    displayStoryText(scene);
    displayStoryExplore(scene);
    displayStoryClueHunt(scene);
    mountEvidenceSaver({scene,chapterId,missionId,anchor:storyExplore,explored:()=>[...getExploredItemsForScene(scene)].map(i=>scene.exploreItems.indexOf(getExploreItems(scene)[i])).filter(i=>i>=0)});
    displayStoryDiscovery(scene);
    displayStoryKeyTerm(scene);
    displayStoryDecision(scene);
    renderStoryTrade(scene);
    renderStoryRoute(scene);
    renderStoryExhibit(scene);
    displayHistoricalInsight(scene);
    displayQuickCheck(scene);

    sceneProgressText.textContent =
        `Scene ${sceneNumber} of ${totalScenes}`;

    storyProgressFill.style.width =
        `${(sceneNumber / totalScenes) * 100}%`;

    updateContinueButton(scene);

    scrollToSection(storyReadingCard);
}

/* =========================================================
   SCENE ILLUSTRATION
   ========================================================= */

function displaySceneVisual(scene) {
    if (
        !storyVisual ||
        !storySceneImage ||
        !storyVisualFallback ||
        !storyVisualCaption
    ) {
        return;
    }

    const sceneSymbol=document.querySelector('.story-visual-icon');if(sceneSymbol)sceneSymbol.textContent=clean(scene.visualSymbol)||'\u{1F6D6}';
    const imageUrl = clean(scene.imageUrl);
    storySceneImage.classList.toggle("story-instructional-image", scene.imageFit === "contain");
    const imageAlt = clean(scene.imageAlt);
    const imageCaption = clean(scene.imageCaption);

    /*
       Reset the previous scene's image first.

       This prevents an old illustration from
       appearing while the new one loads.
    */

    storySceneImage.onload = null;
    storySceneImage.onerror = null;

    storySceneImage.hidden = true;
    storySceneImage.removeAttribute("src");
    storySceneImage.alt = "";

    storyVisualFallback.hidden = false;
    storyVisualCaption.hidden = true;
    storyVisualCaption.textContent = "";

    if (!isSafeImageUrl(imageUrl)) {
        return;
    }

    storySceneImage.alt =
        imageAlt ||
        `Illustration for ${clean(scene.title) || "this scene"}`;

    storySceneImage.onload = () => {
        storySceneImage.hidden = false;
        storyVisualFallback.hidden = true;

        if (imageCaption) {
            storyVisualCaption.textContent = imageCaption;
            storyVisualCaption.hidden = false;
        }
    };

    storySceneImage.onerror = () => {
        storySceneImage.hidden = true;
        storyVisualFallback.hidden = false;
        storyVisualCaption.hidden = true;
    };

    storySceneImage.src = imageUrl;
}

/* =========================================================
   READABLE STORY PARAGRAPHS
   ========================================================= */

function displayStoryText(scene) {
    if (!storyText) {
        return;
    }

    storyText.replaceChildren();

    const content = clean(scene.content);

    if (!content) {
        return;
    }

    /*
       Firestore story content is plain text.

       Split paragraphs at blank lines.
       Use textContent, not innerHTML, so
       Firestore text is never executed as HTML.
    */

    const paragraphs = content.split(/\n\s*\n/);

    paragraphs.forEach((paragraphText) => {
        const text = clean(paragraphText);

        if (!text) {
            return;
        }

        const paragraph = document.createElement("p");

        paragraph.textContent = text;
        paragraph.style.whiteSpace = "pre-line";

        storyText.appendChild(paragraph);
    });
}

/* =========================================================
   EXPLORE ACTIVITY
   ========================================================= */

function displayStoryExplore(scene) {
    if (
        !storyExplore ||
        !storyExploreIntroduction ||
        !storyExploreChoices
    ) {
        return;
    }

    const items = getExploreItems(scene);

    storyExploreChoices.replaceChildren();

    if (items.length === 0) {
        storyExplore.hidden = true;
        storyExploreIntroduction.textContent = "";
        return;
    }

    storyExplore.hidden = false;

    storyExploreIntroduction.textContent =
        clean(scene.exploreIntroduction) ||
        "Explore each clue to discover more.";

    const exploredItems = getExploredItemsForScene(scene);

    items.forEach((item, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "story-explore-choice";

        const iconBox = document.createElement("span");

        iconBox.className = "story-explore-choice-icon";

        const imageUrl = clean(item.imageUrl);

        if (isSafeImageUrl(imageUrl)) {
            const image = document.createElement("img");

            image.src = imageUrl;
            image.alt = "";
            image.loading = "lazy";

            image.onerror = () => {
                iconBox.textContent = clean(item.icon) || "🔎";
            };

            iconBox.appendChild(image);
        } else {
            iconBox.textContent = clean(item.icon) || "🔎";
        }

        const contentBox = document.createElement("span");

        contentBox.className =
            "story-explore-choice-content";

        const title = document.createElement("strong");

        title.textContent = clean(item.title) || "Explore";

        const hint = document.createElement("span");

        hint.textContent =
            clean(item.hint) || "Choose to learn more.";

        contentBox.append(title, hint);
        button.append(iconBox, contentBox);

        const result = document.createElement("div");

        result.className = "story-explore-result";

        const resultTitle = document.createElement("strong");

        resultTitle.textContent = clean(item.title);

        const resultText = document.createElement("p");

        resultText.textContent = clean(item.discovery);

        result.append(resultTitle, resultText);

        const alreadyExplored = exploredItems.has(index);

        result.hidden = !alreadyExplored;

        button.setAttribute(
            "aria-expanded",
            String(alreadyExplored)
        );

        if (alreadyExplored) {
            button.classList.add("explored");
        }

        button.addEventListener("click", () => {
            exploredItems.add(index);

            button.classList.add("explored");

            result.hidden = !result.hidden;

            button.setAttribute(
                "aria-expanded",
                String(!result.hidden)
            );

            updateStoryClueHuntUnlock(scene);
            updateContinueButton(scene);
        });

        storyExploreChoices.append(button, result);
    });
}

function isSceneExploreComplete(scene) {
    const items = getExploreItems(scene);

    if (items.length === 0) {
        return true;
    }

    const exploredItems = getExploredItemsForScene(scene);

    return exploredItems.size >= items.length;
}

function displayStoryClueHunt(scene) {
    if (!storyClueHunt) return;

    const activity = getClueHunt(scene);
    storyClueHunt.hidden = !activity;
    if (!activity) {
        storyClueHuntChoices?.replaceChildren();
        return;
    }

    const completed = completedClueHunts.has(scene.id);
    storyClueHuntTitle.textContent = clean(activity.title);
    storyClueHuntInstructions.textContent = clean(activity.instructions);
    storyClueHuntPrompt.textContent = clean(activity.question);
    storyClueHuntChoices.replaceChildren();

    activity.choices.forEach((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "story-clue-hunt-choice";
        button.textContent = choice;
        button.disabled = completed;
        if (completed && choice === activity.correctAnswer) {
            button.classList.add("correct");
        }
        button.addEventListener("click", () => handleStoryClueHuntAnswer(scene, choice, button));
        storyClueHuntChoices.append(button);
    });

    if (completed) {
        showStoryClueHuntFeedback(true, activity.correctTitle || "Strong historical thinking!", activity.correctExplanation);
    } else {
        storyClueHuntFeedback.hidden = true;
        storyClueHuntFeedback.classList.remove("correct", "incorrect");
        storyClueHuntFeedbackTitle.textContent = "";
        storyClueHuntFeedbackText.textContent = "";
    }
    updateStoryClueHuntUnlock(scene);
}

function updateStoryClueHuntUnlock(scene) {
    const activity = getClueHunt(scene);
    if (!activity || storyClueHunt.hidden) return;

    const clues = getExploreItems(scene);
    const openedCount = getExploredItemsForScene(scene).size;
    const ready = isSceneExploreComplete(scene);
    const completed = completedClueHunts.has(scene.id);

    storyClueHuntLock.hidden = ready;
    storyClueHuntLock.textContent = ready
        ? "All clues found. Compare them, then choose the conclusion they support."
        : `Open all ${clues.length} clues above to unlock your investigation (${Math.min(openedCount, clues.length)} of ${clues.length} found).`;
    storyClueHuntQuestion.hidden = !ready;
    storyClueHuntChoices.querySelectorAll("button").forEach((button) => {
        button.disabled = !ready || completed;
    });
}

function handleStoryClueHuntAnswer(scene, selectedAnswer, selectedButton) {
    const activity = getClueHunt(scene);
    if (!activity || completedClueHunts.has(scene.id) || !isSceneExploreComplete(scene)) return;

    storyClueHuntChoices.querySelectorAll("button").forEach((button) => button.classList.remove("incorrect"));
    const correct = selectedAnswer === activity.correctAnswer;
    if (!correct) {
        selectedButton.classList.add("incorrect");
        showStoryClueHuntFeedback(false, activity.retryTitle || "Look closely at the clues", activity.retryExplanation);
        return;
    }

    completedClueHunts.add(scene.id);
    storyClueHuntChoices.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
        if (button.textContent === activity.correctAnswer) button.classList.add("correct");
    });
    showStoryClueHuntFeedback(true, activity.correctTitle || "Strong historical thinking!", activity.correctExplanation);
    displayStoryDecision(scene);
    document.dispatchEvent(new CustomEvent("lakbay:answer-correct"));
    updateContinueButton(scene);
}

function showStoryClueHuntFeedback(correct, title, explanation) {
    storyClueHuntFeedback.hidden = false;
    storyClueHuntFeedback.classList.toggle("correct", correct);
    storyClueHuntFeedback.classList.toggle("incorrect", !correct);
    storyClueHuntFeedbackTitle.textContent = clean(title);
    storyClueHuntFeedbackText.textContent = clean(explanation);
}

/* =========================================================
   DISCOVERY
   ========================================================= */

function displayStoryDiscovery(scene) {
    if (
        !storyDiscovery ||
        !storyDiscoveryTitle ||
        !storyDiscoveryText
    ) {
        return;
    }

    const text = clean(scene.discoveryText);

    storyDiscovery.hidden = !text;

    storyDiscoveryTitle.textContent = text
        ? clean(scene.discoveryTitle) || "A Closer Look"
        : "";

    storyDiscoveryText.textContent = text;
}

/* =========================================================
   KEY HISTORY TERM
   ========================================================= */

function displayStoryKeyTerm(scene) {
    if (
        !storyKeyTerm ||
        !storyKeyTermName ||
        !storyKeyTermDefinition
    ) {
        return;
    }

    const term = clean(scene.keyTerm);
    const definition = clean(scene.keyTermDefinition);

    storyKeyTerm.hidden = !(term && definition);

    storyKeyTermName.textContent = term;
    storyKeyTermDefinition.textContent = definition;
}

/* =========================================================
   HISTORICAL INSIGHT
   ========================================================= */

function displayHistoricalInsight(scene) {
    if (!historicalInsight || !historicalInsightText) {
        return;
    }

    const insight = clean(scene.historicalInsight);

    historicalInsight.hidden = !insight;
    historicalInsightText.textContent = insight;
}

/* =========================================================
   HISTORICAL DECISION VALIDATION
   ========================================================= */

function sceneHasDecision(scene) {
    if (!scene) {
        return false;
    }

    const choices = getValidChoices(
        scene.decisionChoices
    );

    const correctAnswer = clean(
        scene.decisionCorrectAnswer
    );

    return Boolean(
        clean(scene.decisionSituation) &&
        clean(scene.decisionQuestion) &&
        choices.length >= 2 &&
        choices.includes(correctAnswer)
    );
}

function isStoryDecisionComplete(scene) {
    if(!isSceneTradeComplete(scene)||!isSceneRouteComplete(scene)||!isSceneExhibitComplete(scene))return false;
    return (
        !sceneHasDecision(scene) ||
        completedStoryDecisions.has(scene.id)
    );
}

/* =========================================================
   DISPLAY HISTORICAL DECISION
   ========================================================= */

function displayStoryDecision(scene) {
    if (
        !storyDecision ||
        !storyDecisionSituation ||
        !storyDecisionQuestion ||
        !storyDecisionChoices ||
        !storyDecisionFeedback ||
        !storyDecisionFeedbackTitle ||
        !storyDecisionExplanation
    ) {
        return;
    }

    storyDecisionChoices.replaceChildren();

    storyDecisionFeedback.hidden = true;

    storyDecisionFeedback.classList.remove(
        "correct",
        "incorrect"
    );

    storyDecisionFeedbackTitle.textContent = "";
    storyDecisionExplanation.textContent = "";

    if (!sceneHasDecision(scene)) {
        storyDecision.hidden = true;
        return;
    }

    storyDecision.hidden = false;

    storyDecisionSituation.textContent =
        clean(scene.decisionSituation);

    storyDecisionQuestion.textContent =
        clean(scene.decisionQuestion);

    const choices = getValidChoices(
        scene.decisionChoices
    );

    const correctAnswer = clean(
        scene.decisionCorrectAnswer
    );

    const alreadyCompleted =
        completedStoryDecisions.has(scene.id);
    const waitingForClueHunt = !isSceneClueHuntComplete(scene);

    choices.forEach((choice) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "story-decision-choice";
        button.textContent = choice;

        if (alreadyCompleted || waitingForClueHunt) {
            button.disabled = true;

            if (alreadyCompleted && choice === correctAnswer) {
                button.classList.add("correct");
            }
        }

        button.addEventListener("click", () => {
            handleStoryDecision(scene, choice, button);
        });

        storyDecisionChoices.appendChild(button);
    });

    if (alreadyCompleted) {
        showDecisionFeedback(
            true,
            "Good historical thinking!",
            clean(scene.decisionExplanation)
        );
    }
}

/* =========================================================
   HISTORICAL DECISION ANSWER
   ========================================================= */

function handleStoryDecision(
    scene,
    selectedAnswer,
    selectedButton
) {
    if (!isSceneClueHuntComplete(scene)) {
        scrollToSection(storyClueHunt);
        return;
    }
    if (!isSceneRouteComplete(scene)) {scrollToSection(document.getElementById("storyRouteActivity"));return;}
    if (!isSceneTradeComplete(scene)) {scrollToSection(document.getElementById("storyTradeActivity"));return;}
    if (completedStoryDecisions.has(scene.id)) {
        return;
    }

    const correctAnswer = clean(
        scene.decisionCorrectAnswer
    );

    const isCorrect = selectedAnswer === correctAnswer;

    const buttons = storyDecisionChoices.querySelectorAll(
        ".story-decision-choice"
    );

    buttons.forEach((button) => {
        button.classList.remove("incorrect");
    });

    if (!isCorrect) {
        selectedButton.classList.add("incorrect");

        showDecisionFeedback(
            false,
            "Think about the community again.",
            "That choice does not best fit the historical situation. Review the clues and try another answer."
        );

        return;
    }

    completedStoryDecisions.add(scene.id);

    buttons.forEach((button) => {
        button.disabled = true;

        if (button.textContent.trim() === correctAnswer) {
            button.classList.add("correct");
        }
    });

    showDecisionFeedback(
        true,
        "Good historical thinking!",
        clean(scene.decisionExplanation)
    );

    updateContinueButton(scene);
}

function showDecisionFeedback(
    isCorrect,
    title,
    explanation
) {
    storyDecisionFeedback.hidden = false;

    storyDecisionFeedback.classList.remove(
        "correct",
        "incorrect"
    );

    storyDecisionFeedback.classList.add(
        isCorrect ? "correct" : "incorrect"
    );

    storyDecisionFeedbackTitle.textContent = title;

    storyDecisionExplanation.textContent =
        explanation ||
        "Think about what you learned in this scene.";
}

/* =========================================================
   QUICK CHECK VALIDATION
   ========================================================= */

function sceneHasQuickCheck(scene) {
    if (!scene) {
        return false;
    }

    const choices = getValidChoices(scene.checkChoices);

    return Boolean(
        clean(scene.checkQuestion) &&
        choices.length >= 2 &&
        choices.includes(clean(scene.checkCorrectAnswer))
    );
}

/* =========================================================
   DISPLAY QUICK CHECK
   ========================================================= */

function displayQuickCheck(scene) {
    if (
        !storyQuickCheck ||
        !quickCheckQuestion ||
        !quickCheckChoices
    ) {
        return;
    }

    quickCheckChoices.replaceChildren();
    resetQuickCheckFeedback();

    if (!sceneHasQuickCheck(scene)) {
        storyQuickCheck.hidden = true;
        quickCheckQuestion.textContent = "";
        return;
    }

    storyQuickCheck.hidden = false;

    quickCheckQuestion.textContent =
        clean(scene.checkQuestion);

    const choices = getValidChoices(scene.checkChoices);

    const alreadyCompleted =
        completedQuickChecks.has(scene.id);

    choices.forEach((choice, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "quick-check-choice";
        button.dataset.answer = choice;

        const letter = document.createElement("span");

        letter.className = "quick-check-choice-letter";

        letter.textContent = String.fromCharCode(
            65 + index
        );

        const text = document.createElement("span");

        text.className = "quick-check-choice-text";
        text.textContent = choice;

        button.append(letter, text);

        button.addEventListener("click", () => {
            handleQuickCheckAnswer(
                scene,
                button,
                choice
            );
        });

        quickCheckChoices.appendChild(button);
    });

    if (alreadyCompleted) {
        restoreCompletedQuickCheck(scene);
    }
}

/* =========================================================
   HANDLE QUICK CHECK
   ========================================================= */

function handleQuickCheckAnswer(
    scene,
    selectedButton,
    selectedAnswer
) {
    if (completedQuickChecks.has(scene.id)) {
        return;
    }

    const correctAnswer = clean(
        scene.checkCorrectAnswer
    );

    const isCorrect = selectedAnswer === correctAnswer;

    if (!isCorrect) {
        selectedButton.classList.add("incorrect");
        selectedButton.disabled = true;

        showQuickCheckFeedback(
            false,
            "Look back at the story and Historical Insight, then try another answer."
        );

        return;
    }

    completedQuickChecks.add(scene.id);

    selectedButton.classList.add("correct");

    selectedButton.setAttribute(
        "aria-pressed",
        "true"
    );

    quickCheckChoices.querySelectorAll(
        ".quick-check-choice"
    ).forEach((button) => {
        button.disabled = true;
    });

    showQuickCheckFeedback(
        true,
        clean(scene.checkExplanation)
    );

    updateContinueButton(scene);
}

/* =========================================================
   RESTORE COMPLETED QUICK CHECK
   ========================================================= */

function restoreCompletedQuickCheck(scene) {
    const correctAnswer = clean(
        scene.checkCorrectAnswer
    );

    quickCheckChoices.querySelectorAll(
        ".quick-check-choice"
    ).forEach((button) => {
        button.disabled = true;

        if (button.dataset.answer === correctAnswer) {
            button.classList.add("correct");

            button.setAttribute(
                "aria-pressed",
                "true"
            );
        }
    });

    showQuickCheckFeedback(
        true,
        clean(scene.checkExplanation)
    );
}

/* =========================================================
   QUICK CHECK FEEDBACK
   ========================================================= */

function showQuickCheckFeedback(isCorrect, explanation) {
    if (
        !quickCheckFeedback ||
        !quickCheckFeedbackTitle ||
        !quickCheckFeedbackText
    ) {
        return;
    }

    quickCheckFeedback.hidden = false;

    quickCheckFeedback.classList.remove(
        "correct",
        "incorrect"
    );

    quickCheckFeedback.classList.add(
        isCorrect ? "correct" : "incorrect"
    );

    quickCheckFeedbackTitle.textContent = isCorrect
        ? "Correct! ✓"
        : "Not quite — try again";

    quickCheckFeedbackText.textContent =
        explanation ||
        (
            isCorrect
                ? "Great job! You understood this scene."
                : "Review the story and try another answer."
        );
}

function resetQuickCheckFeedback() {
    if (!quickCheckFeedback) {
        return;
    }

    quickCheckFeedback.hidden = true;

    quickCheckFeedback.classList.remove(
        "correct",
        "incorrect"
    );

    if (quickCheckFeedbackTitle) {
        quickCheckFeedbackTitle.textContent = "";
    }

    if (quickCheckFeedbackText) {
        quickCheckFeedbackText.textContent = "";
    }
}

/* =========================================================
   CONTINUE REQUIREMENTS
   ========================================================= */

function isSceneExhibitComplete(scene){if(!scene?.exhibitActivity)return true;const state=storyExhibitPlans.get(scene.id);try{return state?.confirmed===true&&evaluateExhibit(scene.exhibitActivity,state.matches).valid;}catch{return false;}}
function renderStoryExhibit(scene){
 document.getElementById('storyExhibitActivity')?.remove();if(!scene.exhibitActivity)return;
 const host=document.createElement('section');host.id='storyExhibitActivity';host.dataset.explored=String(isSceneExploreComplete(scene));storyDecision.before(host);
 renderExhibit({host,activity:scene.exhibitActivity,state:storyExhibitPlans.get(scene.id),explored:isSceneExploreComplete(scene),onChange:plan=>{if(!auth.currentUser)return;storyExhibitPlans.set(scene.id,plan);completedStoryDecisions.delete(scene.id);displayStoryDecision(scene);storyDecision.hidden=!isSceneExhibitComplete(scene);updateContinueButton(scene);},onConfirmed:()=>{displayStoryDecision(scene);storyDecision.hidden=false;const heading=storyDecision.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}});
 if(sceneHasDecision(scene))storyDecision.hidden=!isSceneExhibitComplete(scene);
}
function isSceneRouteComplete(scene){if(!scene?.routeActivity)return true;const plan=storyRoutePlans.get(scene.id);try{return plan?.confirmed===true&&evaluateRoute(scene.routeActivity,plan.routeId).valid;}catch{return false;}}
function renderStoryRoute(scene){
 document.getElementById('storyRouteActivity')?.remove();if(!scene.routeActivity)return;
 const host=document.createElement('section');host.id='storyRouteActivity';host.dataset.explored=String(isSceneExploreComplete(scene));storyDecision.before(host);
 renderRouteInvestigation({scene,host,state:storyRoutePlans.get(scene.id),explored:isSceneExploreComplete(scene),onChange:plan=>{if(!auth.currentUser)return;storyRoutePlans.set(scene.id,plan);completedStoryDecisions.delete(scene.id);displayStoryDecision(scene);storyDecision.hidden=!isSceneRouteComplete(scene);updateContinueButton(scene);},onConfirmed:()=>{displayStoryDecision(scene);storyDecision.hidden=false;const heading=storyDecision.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}});
 if(sceneHasDecision(scene))storyDecision.hidden=!isSceneRouteComplete(scene);
}

function isSceneTradeComplete(scene){
 if(!scene?.tradeActivity)return true;
 const plan=storyTradePlans.get(scene.id);try{return plan?.confirmed===true&&evaluateTradePlan(scene.tradeActivity,plan).valid;}catch{return false;}
}
function syncStoryTrade(scene){
 const panel=document.getElementById('storyTradeActivity');if(!panel||!scene?.tradeActivity)return;
 const ready=isSceneExploreComplete(scene),done=isSceneTradeComplete(scene);
 panel.querySelectorAll('select,button').forEach(control=>control.disabled=!ready||(done&&!control.hasAttribute('data-revise')));
 const stage = !ready ? 0 : !done ? 1 : !isStoryDecisionComplete(scene) ? 2 : 3;
 panel.querySelectorAll('.trade-quest-steps li').forEach((step,index)=>{
   step.dataset.state=index<stage?'complete':index===stage?'current':'waiting';
   if(index===stage)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
   step.querySelector('small').textContent=index<stage?'Done':index===stage?'Your next step':'Up next';
 });
 const journal=panel.querySelector('.trade-evidence-journal');if(journal)journal.hidden=!ready;
 const lock=panel.querySelector('.trade-plan-lock');if(lock)lock.hidden=ready;
 if(storyDecision&&sceneHasDecision(scene))storyDecision.hidden=!done;
}
function renderStoryTrade(scene){
 document.getElementById('storyTradeActivity')?.remove();if(!scene.tradeActivity)return;
 const panel=document.createElement('section');panel.id='storyTradeActivity';panel.className='story-trade-activity';panel.setAttribute('aria-labelledby','storyTradeTitle');storyDecision.before(panel);
 const add=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;panel.append(el);return el;};
 let activity;try{activity=validateTradeActivity(scene.tradeActivity);}catch{add('p','This learning activity could not be prepared. Please ask your teacher for help.','learning-message');return;}
 add('span','YOUR TRADING EXPEDITION','eyebrow');
 const steps=document.createElement('ol');steps.className='trade-quest-steps';steps.setAttribute('aria-label','Investigation steps');
 ['Explore the clues','Plan an exchange','Explain your choice'].forEach((label,index)=>{const item=document.createElement('li');const number=document.createElement('span');number.className='trade-step-number';number.textContent=String(index+1);number.setAttribute('aria-hidden','true');const name=document.createElement('strong');name.textContent=label;const status=document.createElement('small');item.append(number,name,status);steps.append(item);});panel.append(steps);const title=add('h3',activity.title);title.id='storyTradeTitle';add('p',activity.instructions);add('p','Open every scene clue to collect the information for your plan.','trade-plan-lock');
 const journal=document.createElement('div');journal.className='trade-evidence-journal';const journalTitle=document.createElement('h4');journalTitle.textContent='Clues collected ? use them to plan';journal.append(journalTitle);
 for(const line of Array.isArray(activity.journalEntries)?activity.journalEntries:[])if(typeof line==='string'){const entry=document.createElement('p');entry.textContent=line;journal.append(entry);}panel.append(journal);
 const goods=document.createElement('div');goods.className='trade-goods-board';
 for(const [label,items] of [['Our community',activity.ownGoods],['Visiting traders',activity.partnerGoods]]){const side=document.createElement('section');const heading=document.createElement('h4');heading.textContent=label;side.append(heading);for(const good of items){const card=document.createElement('p');const name=document.createElement('strong');name.textContent=good.name;const stock=document.createElement('span');stock.textContent=good.quantity+' available before the exchange';card.append(name,stock);side.append(card);}goods.append(side);}panel.append(goods);
 const controls=document.createElement('div');controls.className='trade-plan-controls';
 const previous=storyTradePlans.get(scene.id)||{};const inputs={};
 function selectField(key,label,options){const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');select.id='tradePlan-'+key;const empty=document.createElement('option');empty.value='';empty.textContent='Choose';select.append(empty);for(const option of options){const node=document.createElement('option');node.value=String(option.value);node.textContent=option.label;select.append(node);}select.value=String(previous[key]??'');wrap.append(select);controls.append(wrap);inputs[key]=select;select.addEventListener('change',()=>{const plan=readPlan();storyTradePlans.set(scene.id,{...plan,confirmed:false});completedStoryDecisions.delete(scene.id);result.dataset.valid='false';result.textContent='Your plan is saved with this lesson once the save status confirms it. Check the plan when ready.';updateContinueButton(scene);});}
 selectField('offerGoodId','We offer',activity.ownGoods.map(g=>({value:g.id,label:g.name})));
 selectField('offerQuantity','Amount we offer',Array.from({length:Math.max(...activity.ownGoods.map(g=>g.quantity))},(_,i)=>({value:i+1,label:String(i+1)})));
 selectField('receiveGoodId','We receive',activity.partnerGoods.map(g=>({value:g.id,label:g.name})));
 selectField('receiveQuantity','Amount we receive',Array.from({length:Math.max(...activity.partnerGoods.map(g=>g.quantity))},(_,i)=>({value:i+1,label:String(i+1)})));
 panel.append(controls);const check=document.createElement('button');check.type='button';check.textContent='Check My Exchange';check.className='begin-mission-button';panel.append(check);const revise=document.createElement('button');revise.type='button';revise.className='text-button';revise.setAttribute('data-revise','');revise.textContent='Revise My Plan';panel.append(revise);
 const result=add('p','','trade-plan-feedback');result.setAttribute('role','status');result.setAttribute('aria-live','polite');
 revise.addEventListener('click',()=>{if(!auth.currentUser||!isSceneExploreComplete(scene))return;storyTradePlans.set(scene.id,{...readPlan(),confirmed:false});completedStoryDecisions.delete(scene.id);displayStoryDecision(scene);result.dataset.valid='false';result.textContent='You can change your plan. Check it again before explaining your choice.';updateContinueButton(scene);});
 function readPlan(){return{offerGoodId:inputs.offerGoodId.value,offerQuantity:Number(inputs.offerQuantity.value),receiveGoodId:inputs.receiveGoodId.value,receiveQuantity:Number(inputs.receiveQuantity.value)};}
 function explainResult(outcome){result.textContent=outcome.message;if(outcome.valid){const offer=activity.ownGoods.find(g=>g.id===readPlan().offerGoodId),receive=activity.partnerGoods.find(g=>g.id===readPlan().receiveGoodId);result.textContent+=' We keep '+outcome.ownRemaining+' '+offer.name+'. The visitors keep '+outcome.partnerRemaining+' '+receive.name+'.';}result.dataset.valid=String(outcome.valid);}
 if(isSceneTradeComplete(scene))explainResult(evaluateTradePlan(activity,previous));
 check.addEventListener('click',()=>{if(!auth.currentUser||!isSceneExploreComplete(scene))return;const plan=readPlan(),outcome=evaluateTradePlan(activity,plan);storyTradePlans.set(scene.id,{...plan,confirmed:outcome.valid});explainResult(outcome);if(outcome.valid){displayStoryDecision(scene);storyDecision.hidden=false;const heading=storyDecision.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}updateContinueButton(scene);});
 syncStoryTrade(scene);
}

function saveStoryPlace(scene, completed) {
    if(reviewTopic)return;
    if (storyDraftReady) storyDraft?.save({version: storyContentVersion, sceneId: scene.id, completed, quickChecks: [...completedQuickChecks], decisions: [...completedStoryDecisions], clueHunts: [...completedClueHunts], clueHuntVersions: Object.fromEntries(scenes.filter(item=>getClueHunt(item)).map(item=>[item.id,stableDraftVersion(getClueHunt(item))])), tradePlans: Object.fromEntries(storyTradePlans), routePlans: Object.fromEntries(storyRoutePlans), exhibitPlans: Object.fromEntries(storyExhibitPlans), explored: Object.fromEntries([...exploredSceneItems].map(([id,items])=>[id,[...items]]))});
}
function updateContinueButton(scene) {
    syncStoryTrade(scene);
    if(scene?.routeActivity){const host=document.getElementById("storyRouteActivity");if(host&&host.dataset.explored!==String(isSceneExploreComplete(scene)))renderStoryRoute(scene);if(sceneHasDecision(scene))storyDecision.hidden=!isSceneRouteComplete(scene);}
    if(scene?.exhibitActivity){const host=document.getElementById('storyExhibitActivity');if(host&&host.dataset.explored!==String(isSceneExploreComplete(scene)))renderStoryExhibit(scene);if(sceneHasDecision(scene))storyDecision.hidden=!isSceneExhibitComplete(scene);}
    saveStoryPlace(scene, false);
    if (!continueStoryButton || !scene) {
        return;
    }

    const exploreReady =
        isSceneExploreComplete(scene);

    const decisionReady =
        isStoryDecisionComplete(scene);

    const clueHuntReady =
        isSceneClueHuntComplete(scene);

    const quickCheckReady =
        !sceneHasQuickCheck(scene) ||
        completedQuickChecks.has(scene.id);

    const canContinue =
        exploreReady &&
        clueHuntReady &&
        decisionReady &&
        quickCheckReady;

    continueStoryButton.disabled = !canContinue;

    // A disabled Continue button cannot take the learner to unfinished work.
    let guide = document.getElementById('storyNextStepGuide');
    if (!guide) {
        guide = document.createElement('button');
        guide.id = 'storyNextStepGuide';
        guide.type = 'button';
        guide.className = 'story-next-step-guide';
        continueStoryButton.before(guide);
    }
    const nextStep = !exploreReady ? [storyExplore, 'Find the clues', 'Open each clue to learn what happened.']
        : !clueHuntReady ? [storyClueHunt, 'Investigate the clues', 'Compare the clues, then choose the conclusion they support.']
        : !isSceneTradeComplete(scene) ? [document.getElementById('storyTradeActivity'), 'Plan your exchange', 'Use the collected clues, then check your plan.']
        : !isSceneRouteComplete(scene) ? [document.getElementById('storyRouteActivity'), 'Choose your route', 'Compare the travel clues, then check your route.']
        : !isSceneExhibitComplete(scene) ? [document.getElementById('storyExhibitActivity'), 'Build your exhibit', 'Match the actions with their contributions, then check your connections.']
        : !decisionReady ? [storyDecision, 'Explain your choice', 'Use what you learned to choose an answer.']
        : !quickCheckReady ? [storyQuickCheck, 'Try the quick check', 'Check what you understood before moving on.'] : null;
    guide.hidden = !nextStep;
    guide.onclick = null;
    if (nextStep) {
        guide.replaceChildren();
        const title = document.createElement('strong'); title.textContent = nextStep[1];
        const detail = document.createElement('span'); detail.textContent = nextStep[2];
        guide.append(title, detail);
        guide.onclick = () => {
            const target = nextStep[0];
            if (!target) return;
            scrollToSection(target);
            const heading = target.querySelector('h3, h4') || target;
            heading.tabIndex = -1;
            heading.focus({preventScroll:true});
        };
    }

    if (!exploreReady) {
        continueStoryButton.textContent =
            "Explore the Scene to Continue";
        return;
    }

    if (!clueHuntReady) {
        continueStoryButton.textContent = "Complete the Clue Hunt to Continue";
        return;
    }

    if (!isSceneTradeComplete(scene)) {continueStoryButton.textContent="Plan an Exchange to Continue";return;}
    if(!isSceneRouteComplete(scene)){continueStoryButton.textContent="Plan a Route to Continue";return;}
    if(!isSceneExhibitComplete(scene)){continueStoryButton.textContent="Finish Your Exhibit to Continue";return;}
    if (!decisionReady) {
        continueStoryButton.textContent =
            "Make a Historical Decision";
        return;
    }

    if (!quickCheckReady) {
        continueStoryButton.textContent =
            "Complete Quick Check to Continue";
        return;
    }

    const isLastScene =
        currentSceneIndex === scenes.length - 1;

    continueStoryButton.textContent = isLastScene
        ? "Finish Story →"
        : "Continue →";
}

/* =========================================================
   NEXT SCENE / STORY COMPLETE
   ========================================================= */

previousStoryButton?.addEventListener("click",()=>{
    if(currentSceneIndex>0){currentSceneIndex--;displayScene();sceneTitle.tabIndex=-1;sceneTitle.focus({preventScroll:true});}
});
if (continueStoryButton) {
    continueStoryButton.addEventListener("click", () => {
        const scene = getCurrentScene();

        if (!scene) {
            return;
        }

        /*
           Recheck every requirement even if
           the button is somehow triggered
           while disabled.
        */

        if (!isSceneExploreComplete(scene)) {
            scrollToSection(storyExplore);
            return;
        }

        if (!isSceneClueHuntComplete(scene)) {
            scrollToSection(storyClueHunt);
            return;
        }

        if (!isStoryDecisionComplete(scene)) {
            scrollToSection(storyDecision);
            return;
        }

        if (
            sceneHasQuickCheck(scene) &&
            !completedQuickChecks.has(scene.id)
        ) {
            scrollToSection(storyQuickCheck);
            return;
        }

        if (currentSceneIndex < scenes.length - 1) {
            currentSceneIndex++;
            displayScene();
            sceneTitle.tabIndex=-1;sceneTitle.focus({preventScroll:true});
            return;
        }

        storyReadingCard.hidden = true;
        storyCompleteSection.hidden = false;
        saveStoryPlace(scene, true);
        loadLessonQuizInfo();

        storyProgressFill.style.width = "100%";
        sceneProgressText.textContent = "Completed";

        scrollToSection(storyCompleteSection);
    });
}

/* =========================================================
   NAVIGATION
   ========================================================= */

if (backToMissionButton) {
    backToMissionButton.addEventListener("click", () => {
        window.location.href =
            `mission.html?chapter=${encodeURIComponent(chapterId || "")}`;
    });
}

if (quizButton) {
    quizButton.addEventListener("click", () => {
        if(reviewTopic){window.location.href=topicPracticeUrl();return;}
        window.location.href =
            `quiz.html?chapter=${encodeURIComponent(chapterId || "")}` +
            `&mission=${encodeURIComponent(missionId || "")}`;
    });
}

/* =========================================================
   START
   ========================================================= */

let storyLoadStarted = false;
onAuthStateChanged(auth, (user) => {
    if (!user) {
        storyDraft?.close();
        storyDraftReady = false;
        storySessionGeneration++;
        storyUserId = null;
        loadedStoryMission = null;
        quizInfoRequest++;
        storyLoadPending = false;
        storyAiRequestSerial++;
        storyLoadStarted=false;
        scenes=[];storyTradePlans.clear();completedQuickChecks.clear();completedStoryDecisions.clear();completedClueHunts.clear();exploredSceneItems.clear();
        showError("Please sign in to access this story.");
        return;
    }
    if (storyUserId !== user.uid) {
        storyUserId = user.uid;
        storySessionGeneration++;
        storyLoadPending = false;
        storyLoadStarted = false;
        storyAiRequestSerial++;
    }
    if (!storyLoadStarted) {
        storyLoadStarted = true;
        loadStory();
    }
});
    
// ==========================================
// STORY AI EXPLAIN THIS BUTTON
// ==========================================

let storyAiRequestSerial = 0;

storyAiExplainButton?.addEventListener('click',()=>{const help=sceneHelp(getCurrentScene());if(!help||!auth.currentUser)return;const opening=storyAiExplainResponse.hidden;storyAiExplainButton.setAttribute('aria-expanded',String(opening));storyAiExplainResponse.hidden=!opening;if(!opening)return;storyAiExplainResponse.replaceChildren();const block=(title,value)=>{if(typeof value!=='string'||!value.trim())return;const heading=document.createElement('h3');heading.textContent=title;const copy=document.createElement('p');copy.textContent=value;storyAiExplainResponse.append(heading,copy);};block('In simpler words',help.explanation);for(const word of Array.isArray(help.vocabulary)?help.vocabulary:[])if(typeof word?.term==='string')block(word.term,word.definition);block('Think of this example',help.example);block('Think it through',help.guidingQuestion);});

retryStoryLoadButton?.addEventListener("click", () => loadStory());

async function loadLessonQuizInfo() {
    const briefing = document.getElementById('lessonQuizBriefing');
    if (briefing) { briefing.hidden = true; briefing.replaceChildren(); }
    if(reviewTopic){
        if (!auth.currentUser || storyCompleteSection.hidden) return;
        quizInfoRequest++;
        storyCompleteSection.querySelector('h2').textContent='Lesson review complete';
        storyCompleteSection.querySelector('.eyebrow').textContent='TOPIC REVIEW';
        storyCompleteSection.querySelector('p').textContent='You finished reviewing this topic. Now try a few practice questions to use what you learned.';
        document.getElementById('lessonQuizRequirements').textContent='Practice helps you check what you understand. After practice, you can try the mission quiz again.';
        document.getElementById('lessonRecap').replaceChildren();
        document.getElementById('retryLessonQuizInfo').hidden=true;
        quizButton.textContent='Saving Lesson Review...';quizButton.disabled=true;
        const reviewGeneration=storySessionGeneration,reviewUid=auth.currentUser.uid;
        if(!reviewSavePending)reviewSavePending=recordLessonReview({chapterId,missionId,topic:reviewTopic,sceneIds:scenes.map(scene=>scene.id)}).catch(()=>{reviewSavePending=null;return false;});
        const recorded=await reviewSavePending;
        if(reviewGeneration!==storySessionGeneration||auth.currentUser?.uid!==reviewUid)return;
        quizButton.textContent='Apply It in Targeted Practice';quizButton.disabled=false;
        if(reviewGeneration===storySessionGeneration&&auth.currentUser?.uid===reviewUid&&!recorded)document.getElementById('lessonQuizRequirements').textContent+=' We could not save that you revisited this lesson. You can still continue to practice.';
        return;
    }
    if (!auth.currentUser || storyCompleteSection.hidden) return;
    const request = ++quizInfoRequest;
    const generation = storySessionGeneration;
    const details = document.getElementById("lessonQuizRequirements");
    const recap = document.getElementById("lessonRecap");
    const retry = document.getElementById("retryLessonQuizInfo");
    quizButton.disabled = true;
    retry.hidden = true;
    details.textContent = "Loading quiz requirements...";
    recap.replaceChildren();
    const mission = loadedStoryMission || {};
    if (typeof mission.lessonRecap === "string" && mission.lessonRecap.trim()) {
        const paragraph = document.createElement("p");paragraph.textContent = mission.lessonRecap.trim();recap.append(paragraph);
    }
    const objectives = Array.isArray(mission.learningObjectives) ? mission.learningObjectives : [mission.learningObjective];
    const list = document.createElement("ul");
    for (const objective of objectives) if (typeof objective === "string" && objective.trim()) {
        const item = document.createElement("li");item.textContent = objective.trim();list.append(item);
    }
    if (list.children.length) {const title=document.createElement("h3");title.textContent="What you learned";recap.append(title,list);}
    try {
        const snapshot = await getDocs(query(collection(db,"quizzes"),where("missionId","==",missionId)));
        if (generation !== storySessionGeneration || request !== quizInfoRequest) return;
        const quiz = snapshot.docs.map(row=>row.data()).find(row=>row.status === "active");
        requireMissionPolicy(quiz);
        details.textContent = quiz.questionCount + " questions. Answer at least " + Math.ceil(quiz.questionCount * quiz.passingScore / 100) + " correctly to pass (" + quiz.passingScore + "%). Mission XP is awarded once. If you do not pass, review your feedback, practise and retry.";
        if (briefing) {
            const heading=document.createElement('h3');heading.textContent='Your next challenge';briefing.append(heading);
            const stats=document.createElement('dl');
            const stat=(label,value)=>{const card=document.createElement('div');const term=document.createElement('dt');term.textContent=label;const detail=document.createElement('dd');detail.textContent=value;card.append(term,detail);stats.append(card);};
            stat('Questions',String(quiz.questionCount));
            stat('Correct answers to pass',Math.ceil(quiz.questionCount*quiz.passingScore/100)+' of '+quiz.questionCount);
            if (Number.isFinite(mission.xpReward) && mission.xpReward > 0) stat('XP for your first pass',String(mission.xpReward)+' XP');
            briefing.append(stats);
            const help=document.createElement('p');help.textContent='Not ready yet? Review the lesson. If you miss the passing score, we will guide you back to the topics to learn, then you can practise and try again.';briefing.append(help);
            briefing.hidden=false;
        }
        quizButton.textContent='Start Mission Quiz';
        quizButton.disabled = false;
    } catch (error) {
        if (generation !== storySessionGeneration || request !== quizInfoRequest) return;
        details.textContent = "Quiz details are unavailable. You can review the lesson or retry loading the details.";
        retry.hidden = false;
    }
}
document.getElementById("retryLessonQuizInfo")?.addEventListener("click",loadLessonQuizInfo);
document.getElementById("reviewCompletedLesson")?.addEventListener("click",()=>{
    quizInfoRequest++;
    quizButton.disabled = true;
    storyCompleteSection.hidden = true;
    storyReadingCard.hidden = false;
    currentSceneIndex = 0;
    displayScene();
});

mountLearningNavigation(document.querySelector(".story-page"), "Lesson");
const storyPageRoot=document.querySelector('.story-page');
const storyBreadcrumbs=storyPageRoot?.querySelector('.learning-navigation');
const storyReturnRow=storyPageRoot?.querySelector('.story-return-row');
if(storyPageRoot&&storyBreadcrumbs&&storyReturnRow){
    const storyNavigationBar=document.createElement('div');
    storyNavigationBar.className='story-navigation-bar';
    storyNavigationBar.append(storyBreadcrumbs,storyReturnRow);
    storyPageRoot.prepend(storyNavigationBar);
}
