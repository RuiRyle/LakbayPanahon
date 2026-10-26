import { requestAiAssistance, aiAssistanceLocalOnly } from "./ai-assistance-client.js";

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

function resetStoryAiExplanation() {
    if (storyAiExplainButton) {
        storyAiExplainButton.disabled = !aiAssistanceLocalOnly;
    }

    if (storyAiExplainResponse) {
        storyAiExplainResponse.textContent = "";
        storyAiExplainResponse.hidden = true;
    }
}

const storyVisual = $("storyVisual");
const storySceneImage = $("storySceneImage");
const storyVisualFallback = $("storyVisualFallback");
const storyVisualCaption = $("storyVisualCaption");

const storyExplore = $("storyExplore");
const storyExploreIntroduction = $("storyExploreIntroduction");
const storyExploreChoices = $("storyExploreChoices");

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
const storyCompleteSection = $("storyCompleteSection");
const backToMissionButton = $("backToMissionButton");
const quizButton = $("quizButton");

/* =========================================================
   URL PARAMETERS
   ========================================================= */

const params = new URLSearchParams(window.location.search);

const chapterId = params.get("chapter");
const missionId = params.get("mission");

/* =========================================================
   STORY STATE
   ========================================================= */

let scenes = [];
let currentSceneIndex = 0;

const completedQuickChecks = new Set();
const completedStoryDecisions = new Set();
const exploredSceneItems = new Map();

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
    ).matches;

    element.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
    });
}

/* =========================================================
   LOAD STORY FROM FIRESTORE
   ========================================================= */

async function loadStory() {
    if (!chapterId || !missionId) {
        showError(
            "The chapter or mission was not selected."
        );
        return;
    }

    try {
        await requireLearningAccess(chapterId, missionId);
        const chapterSnapshot = await getDoc(
            doc(db, "chapters", chapterId)
        );

        if (!chapterSnapshot.exists()) {
            showError(
                "The selected chapter could not be found."
            );
            return;
        }

        const missionSnapshot = await getDoc(
            doc(db, "missions", missionId)
        );

        if (!missionSnapshot.exists()) {
            showError(
                "The selected mission could not be found."
            );
            return;
        }

        const chapter = chapterSnapshot.data();
        const mission = missionSnapshot.data();

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

        currentSceneIndex = 0;

        completedQuickChecks.clear();
        completedStoryDecisions.clear();
        exploredSceneItems.clear();

        storyCompleteSection.hidden = true;
        storyReadingCard.hidden = false;

        displayScene();

        storyLoading.hidden = true;
        storyError.hidden = true;
        storyContent.hidden = false;

    } catch (error) {
        console.error("Unable to load story:", error);

        showError(
            error instanceof LearningAccessError ? error.message : "We could not load this story mission. Please try again."
        );
    }
}

/* =========================================================
   DISPLAY SCENE
   ========================================================= */

function displayScene() {
    const scene = getCurrentScene();

   if (!scene) {
    return;
}

resetStoryAiExplanation();

    const sceneNumber = currentSceneIndex + 1;
    const totalScenes = scenes.length;
    
    sceneLabel.textContent = `SCENE ${sceneNumber}`;

    sceneTitle.textContent =
        clean(scene.title) || `Scene ${sceneNumber}`;

    displaySceneVisual(scene);
    displayStoryText(scene);
    displayStoryExplore(scene);
    displayStoryDiscovery(scene);
    displayStoryKeyTerm(scene);
    displayStoryDecision(scene);
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

    const imageUrl = clean(scene.imageUrl);
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

    choices.forEach((choice) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "story-decision-choice";
        button.textContent = choice;

        if (alreadyCompleted) {
            button.disabled = true;

            if (choice === correctAnswer) {
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

function updateContinueButton(scene) {
    if (!continueStoryButton || !scene) {
        return;
    }

    const exploreReady =
        isSceneExploreComplete(scene);

    const decisionReady =
        isStoryDecisionComplete(scene);

    const quickCheckReady =
        !sceneHasQuickCheck(scene) ||
        completedQuickChecks.has(scene.id);

    const canContinue =
        exploreReady &&
        decisionReady &&
        quickCheckReady;

    continueStoryButton.disabled = !canContinue;

    if (!exploreReady) {
        continueStoryButton.textContent =
            "Explore the Scene to Continue";
        return;
    }

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
            return;
        }

        storyReadingCard.hidden = true;
        storyCompleteSection.hidden = false;

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
        window.location.href =
            `quiz.html?chapter=${encodeURIComponent(chapterId || "")}` +
            `&mission=${encodeURIComponent(missionId || "")}`;
    });
}

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

const mobileMenuButton = $("mobileMenuButton");
const sidebar = document.querySelector(".sidebar");

if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

/* =========================================================
   START
   ========================================================= */

let storyLoadStarted = false;
onAuthStateChanged(auth, (user) => {
    if (!user) {
        showError("Please sign in to access this story.");
        return;
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

storyAiExplainButton?.addEventListener(
    "click",
    async () => {

        const scene = getCurrentScene();

        if (
            !aiAssistanceLocalOnly ||
            !scene?.id ||
            !chapterId ||
            !missionId
        ) {
            return;
        }

        const serial = ++storyAiRequestSerial;
        const sceneId = scene.id;

        storyAiExplainButton.disabled = true;

        storyAiExplainResponse.hidden = false;
        storyAiExplainResponse.textContent =
            "Kinukuha ang paliwanag...";

        const text = await requestAiAssistance({
            type: "story_explanation",
            chapterId,
            missionId,
            contentId: sceneId
        });

        if (
            serial !== storyAiRequestSerial ||
            getCurrentScene()?.id !== sceneId
        ) {
            return;
        }

        storyAiExplainResponse.textContent = text;
        storyAiExplainButton.disabled = false;
    }
);
