import { instructionalSnapshot } from "./instructional-content.js";
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
    where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const missionLoading =
    document.getElementById("missionLoading");

const missionError =
    document.getElementById("missionError");

const missionContent =
    document.getElementById("missionContent");

const chapterTitle =
    document.getElementById("chapterTitle");

const chapterDescription =
    document.getElementById("chapterDescription");

const missionTitle =
    document.getElementById("missionTitle");

const missionIntroduction =
    document.getElementById("missionIntroduction");

const missionLearningGoal =
    document.getElementById("missionLearningGoal");

const missionLearningObjective =
    document.getElementById("missionLearningObjective");

const missionXp =
    document.getElementById("missionXp");

const beginMissionButton =
    document.getElementById("beginMissionButton");

const missionPath =
    document.getElementById("missionPath");


/* ==========================================
   URL PARAMETERS
========================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

const chapterId =
    params.get("chapter");


/* ==========================================
   PAGE STATE
========================================== */

let loadedMissionStates = [];
let missionLoadGeneration = 0;
let missionUserId = null;
const retryMissionLoadButton = document.getElementById("retryMissionLoadButton");

let selectedMissionId = null;

let loadedChapterName = "";

let isChapterChallengeUnlocked = false;

let isChapterChallengeCompleted = false;


/* ==========================================
   LOAD MISSION PAGE
========================================== */

async function loadMissionPage() {
    const generation = ++missionLoadGeneration;
    const loadingUid = auth.currentUser?.uid;
    const isCurrent = () => generation === missionLoadGeneration && auth.currentUser?.uid === loadingUid;
    missionContent.hidden = true;
    missionError.hidden = true;
    missionLoading.hidden = false;
    if (retryMissionLoadButton) retryMissionLoadButton.hidden = true;

    if (!chapterId) {

        showError(
            "No chapter was selected."
        );

        return;
    }


    try {

        /* ==================================
           GET LOGGED-IN STUDENT
        ================================== */

        const user =
            auth.currentUser;


        if (!user) {

            showError(
                "You must be logged in to continue."
            );

            return;
        }


        /* ==================================
           LOAD CHAPTER
        ================================== */

        const chapterReference =
            doc(
                db,
                "chapters",
                chapterId
            );


        const chapterSnapshot =
            await getDoc(
                chapterReference
            );


        if (!isCurrent()) return;
        if (!chapterSnapshot.exists()) {

            showError(
                "The selected chapter could not be found."
            );

            return;
        }


        
const chapter =
    chapterSnapshot.data();


// ==========================================
// CHAPTER CONTENT READINESS CHECK
// ==========================================

// Chapters without contentReady remain
// compatible with our existing content.

if (
    chapter.status !== "active" ||
    chapter.contentReady === false
) {

    showError(
        "This chapter is coming soon! " +
        "Its learning activities are not yet available."
    );

    return;
}


// ==========================================
// CONTINUE LOADING CHAPTER
// ==========================================

const chapterAccessResult =
    await checkStudentChapterAccess(user, chapterId);

if (!isCurrent()) return;
if (!chapterAccessResult.allowed) {
    showError(chapterAccessResult.message);
    return;
}
const eraBackLink = document.querySelector('.mission-back');
if (eraBackLink && typeof chapter.eraId === 'string' && chapter.eraId) {
    eraBackLink.href = 'era.html?' + new URLSearchParams({era: chapter.eraId});
    eraBackLink.textContent = 'Back to Era';
}
loadedChapterName =
    chapter.title ||
    "Untitled Chapter";



        chapterTitle.textContent =
            loadedChapterName;


        chapterDescription.textContent =
            chapter.description ||
            "";


        /* ==================================
           LOAD ALL MISSIONS
        ================================== */

        const missionSnapshot =
            await instructionalSnapshot("missions:"+chapterId, () => getDocs(query(collection(db,"missions"),where("chapterId","==",chapterId))));


        if (!isCurrent()) return;
        const missions = [];


        missionSnapshot.forEach(
            (documentSnapshot) => {

                missions.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        /* ==================================
           MATCH MISSIONS TO CHAPTER
        ================================== */

        const chapterMissions =
            missions

                .filter(
                    (mission) =>

                        mission.chapterId ===
                            chapterId &&

                        mission.status ===
                            "active"
                )

                .sort(
                    (a, b) =>

                        (Number(a.order) || 0) -
                        (Number(b.order) || 0)
                );


        if (
            chapterMissions.length === 0
        ) {

            showError(
                "No missions are available for this chapter yet."
            );

            return;
        }


        /* ==================================
           LOAD STUDENT PROGRESS
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
           DETERMINE MISSION STATES
        ================================== */

        const missionStates =
            chapterMissions.map(
                (mission, index) => {

                    const isCompleted =
                        completedMissionIds.has(
                            mission.id
                        );


                    /*
                     * The first mission is
                     * always available.
                     */

                    let isUnlocked =
                        index === 0;


                    /*
                     * Later missions require
                     * completion of the mission
                     * immediately before them.
                     */

                    if (index > 0) {

                        const previousMission =
                            chapterMissions[
                                index - 1
                            ];


                        isUnlocked = chapterMissions.slice(0, index)
                            .every(item => completedMissionIds.has(item.id));

                    }


                    return {

                        ...mission,

                        isCompleted,
                        isUnlocked: globalThis.__lakbayExplorationPreview===true || isUnlocked

                    };

                }
            );


        loadedMissionStates =
            missionStates;
        document.getElementById('chapterExpeditionProgress')?.remove();
        const expedition=document.createElement('div');expedition.id='chapterExpeditionProgress';expedition.className='chapter-expedition-progress';
        const count=missionStates.filter(m=>m.isCompleted).length;
        const caption=document.createElement('strong');caption.textContent=count+' / '+missionStates.length+' missions completed';
        const meter=document.createElement('progress');meter.max=missionStates.length;meter.value=count;meter.setAttribute('aria-label','Chapter mission completion');
        const note=document.createElement('p');note.textContent=count===missionStates.length?'All missions complete. Your chapter challenge is ready below.':(missionStates.length-count)+' mission'+(missionStates.length-count===1?'':'s')+' remaining before the chapter challenge unlocks.';
        expedition.append(caption,meter,note);document.querySelector('.mission-chapter-header').append(expedition);


        /* ==================================
           CHAPTER CHALLENGE UNLOCK CHECK
        ================================== */

        isChapterChallengeUnlocked =
            missionStates.every(
                (mission) =>
                    mission.isCompleted
            );


        console.log(
            "Chapter Challenge unlocked:",
            isChapterChallengeUnlocked
        );

        /* ==========================================
   CHECK CHAPTER CHALLENGE COMPLETION
========================================== */

const chapterProgressId =
    `${user.uid}_${chapterId}`;

const chapterProgressSnapshot =
    await getDoc(
        doc(
            db,
            "studentChapterProgress",
            chapterProgressId
        )
    );

if (!isCurrent()) return;
isChapterChallengeCompleted =
    chapterProgressSnapshot.exists() &&
    chapterProgressSnapshot.data().completed === true;


        /* ==================================
           FIND DEFAULT CURRENT MISSION
        ================================== */

        let currentMission =
            missionStates.find(
                (mission) =>

                    mission.isUnlocked &&
                    !mission.isCompleted
            );


        /*
         * If every mission has already been
         * completed, use the final mission as
         * the default review mission.
         */

        if (!currentMission) {

            currentMission =
                missionStates[
                    missionStates.length - 1
                ];

        }


        /* ==================================
           SELECT DEFAULT MISSION
        ================================== */

        selectedMissionId =
            currentMission.id;


        displaySelectedMission(
            currentMission
        );


        displayMissionPath(
            loadedMissionStates,
            selectedMissionId,
            isChapterChallengeUnlocked,
            loadedChapterName
        );


        /* ==================================
           SHOW PAGE
        ================================== */

        missionLoading.hidden =
            true;

        missionError.hidden =
            true;

        missionContent.hidden =
            false;


    } catch (error) {

        if (!isCurrent()) return;
        console.error(
            "Unable to load mission:",
            error
        );


        showError(
            "We could not load this mission. Please try again."
        );

    }

}


/* ==========================================
   DISPLAY SELECTED MISSION
========================================== */

function displaySelectedMission(mission) {

    if (!mission) {
        return;
    }


    selectedMissionId =
        mission.id;


        /* ==================================
   MISSION STATUS LABEL
================================== */

const missionStatusLabel =
    document.getElementById(
        "missionStatusLabel"
    );

if (missionStatusLabel) {

    missionStatusLabel.textContent =
        mission.isCompleted
            ? "MISSION COMPLETED"
            : "YOUR NEXT MISSION";

}


    /* ==================================
       MISSION TITLE
    ================================== */

    missionTitle.textContent =
        mission.title ||
        "Untitled Mission";


    /* ==================================
       MISSION INTRODUCTION
    ================================== */

    missionIntroduction.textContent =
        mission.introduction || mission.description ||
        "";


    /* ==================================
       LEARNING OBJECTIVE
    ================================== */

    const objectives = (Array.isArray(mission.learningObjectives) ? mission.learningObjectives : [mission.learningObjective])
        .filter(value => typeof value === "string" && value.trim()).map(value=>value.trim());
    if (missionLearningGoal && missionLearningObjective) {
        missionLearningObjective.replaceChildren();
        if (objectives.length) {
            const list = document.createElement("ul");
            for (const objective of objectives) {
                const item = document.createElement("li");item.textContent=objective;list.append(item);
            }
            missionLearningObjective.append(list);
        }
        missionLearningGoal.hidden = !objectives.length;
    }

    /* ==================================
       MISSION XP
    ================================== */

    missionXp.textContent =
        `+${Number(
            mission.xpReward
        ) || 0} XP`;


    /* ==================================
       BEGIN / REVIEW BUTTON
    ================================== */

    beginMissionButton.textContent =
        mission.isCompleted
            ? "Review Mission →"
            : "Begin Mission →";


    beginMissionButton.setAttribute(
        "aria-label",
        mission.isCompleted
            ? `Review ${
                mission.title ||
                "mission"
            }`
            : `Begin ${
                mission.title ||
                "mission"
            }`
    );


    beginMissionButton.onclick =
        () => {

            if (!mission.isUnlocked) {
                return;
            }


            window.location.href =
                `story.html?chapter=${encodeURIComponent(
                    chapterId
                )}&mission=${encodeURIComponent(
                    mission.id
                )}`;

        };

}


/* ==========================================
   SELECT MISSION FROM PATH
========================================== */

function selectMission(mission) {

    if (
        !mission ||
        !mission.isUnlocked
    ) {

        return;

    }


    displaySelectedMission(
        mission
    );


    /*
     * Re-render the path so the selected
     * mission receives the correct visual
     * state.
     */

    displayMissionPath(
        loadedMissionStates,
        selectedMissionId,
        isChapterChallengeUnlocked,
        loadedChapterName
    );


    /*
     * Bring the introduction back into view
     * so students review the mission context
     * and learning goal before opening it.
     */

    missionTitle.tabIndex = -1;
    missionTitle.focus({preventScroll:true});
    const introductionCard =
        document.querySelector(
            ".mission-introduction-card"
        );


    if (introductionCard) {

        introductionCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* ==========================================
   DISPLAY MISSION PATH
========================================== */

function displayMissionPath(
    missions,
    selectedId,
    chapterChallengeUnlocked,
    chapterName
) {

    if (!missionPath) {
        return;
    }


    missionPath.innerHTML =
        "";


    /* ==================================
       DISPLAY REGULAR MISSIONS
    ================================== */

    missions.forEach(
        (mission, index) => {

            const item =
                document.createElement(
                    "div"
                );


            const isSelected =
                mission.id ===
                selectedId;


            /* ==================================
               COMPLETED MISSION
            ================================== */

            if (mission.isCompleted) {

                item.className =
                    isSelected
                        ? "mission-path-item completed current"
                        : "mission-path-item completed";


                item.innerHTML = `

                    <div class="mission-path-node">
                        ${isSelected ? "🧭" : "✓"}
                    </div>

                    <div class="mission-path-content">

                        <span>
                            Mission ${index + 1}
                        </span>

                        <strong>
                            ${escapeHtml(
                                mission.title ||
                                "Mission"
                            )}
                        </strong>

                        <small>
                            ${
                                isSelected
                                    ? "Selected for review"
                                    : "Completed • Select to review"
                            }
                        </small>

                        <span
                            class="mission-state-chip ${
                                isSelected
                                    ? "current-chip"
                                    : "completed-chip"
                            }"
                        >
                            ${
                                isSelected
                                    ? "🧭 Reviewing Mission"
                                    : "✓ Completed"
                            }
                        </span>

                    </div>

                `;


                makeMissionSelectable(
                    item,
                    mission
                );

            }


            /* ==================================
               SELECTED UNFINISHED MISSION
            ================================== */

            else if (
                mission.isUnlocked &&
                isSelected
            ) {

                item.className =
                    "mission-path-item current";


                item.innerHTML = `

                    <div class="mission-path-node">
                        🧭
                    </div>

                    <div class="mission-path-content">

                        <span>
                            Mission ${index + 1}
                        </span>

                        <strong>
                            ${escapeHtml(
                                mission.title ||
                                "Mission"
                            )}
                        </strong>

                        <small>
                            Ready to begin • +${
                                Number(
                                    mission.xpReward
                                ) || 0
                            } XP
                        </small>

                        <span
                            class="mission-state-chip current-chip"
                        >
                            🧭 Current Mission
                        </span>

                    </div>

                `;


                makeMissionSelectable(
                    item,
                    mission
                );

            }


            /* ==================================
               OTHER UNLOCKED MISSION
            ================================== */

            else if (
                mission.isUnlocked
            ) {

                item.className =
                    "mission-path-item unlocked";


                item.innerHTML = `

                    <div class="mission-path-node">
                        🔓
                    </div>

                    <div class="mission-path-content">

                        <span>
                            Mission ${index + 1}
                        </span>

                        <strong>
                            ${escapeHtml(
                                mission.title ||
                                "Mission"
                            )}
                        </strong>

                        <small>
                            Select mission • +${
                                Number(
                                    mission.xpReward
                                ) || 0
                            } XP
                        </small>

                        <span
                            class="mission-state-chip unlocked-chip"
                        >
                            🔓 Unlocked
                        </span>

                    </div>

                `;


                makeMissionSelectable(
                    item,
                    mission
                );

            }


            /* ==================================
               LOCKED MISSION
            ================================== */

            else {

                item.className =
                    "mission-path-item locked";


                const previousMissionTitle =
                    missions[index - 1]?.title ||
                    "the previous mission";


                item.innerHTML = `

                    <div class="mission-path-node">
                        🔒
                    </div>

                    <div class="mission-path-content">

                        <span>
                            Mission ${index + 1}
                        </span>

                        <strong>
                            ${escapeHtml(
                                mission.title ||
                                "Mission"
                            )}
                        </strong>

                        <small>
                            Complete “${escapeHtml(
                                previousMissionTitle
                            )}” to unlock
                        </small>

                        <span
                            class="mission-state-chip locked-chip"
                        >
                            🔒 Locked
                        </span>

                    </div>

                `;

            }


            missionPath.appendChild(
                item
            );

        }
    );


    /* ==========================================
       CHAPTER CHALLENGE
    ========================================== */

    const challengeItem =
        document.createElement(
            "div"
        );


    if (chapterChallengeUnlocked || globalThis.__lakbayExplorationPreview===true) {

        challengeItem.className =
            "mission-path-item chapter-challenge unlocked";


        challengeItem.innerHTML = `

            <div class="mission-path-node">
                🏆
            </div>

            <div class="mission-path-content">

                <span>
                    CHAPTER CHALLENGE
                </span>

                <strong>
                    Final Challenge:
                    ${escapeHtml(
                        chapterName ||
                        "Chapter Challenge"
                    )}
                </strong>

                <small>
    ${isChapterChallengeCompleted
        ? "Chapter completed • Select to replay"
        : "All missions completed • Final challenge ready"}
</small>

              <span
    class="mission-state-chip ${isChapterChallengeCompleted
        ? "completed-chip"
        : "challenge-chip"}"
>
    ${isChapterChallengeCompleted
        ? "✓ Chapter Completed"
        : "🏆 Ready for Final Challenge"}
</span>

            </div>

        `;


        challengeItem.style.cursor =
            "pointer";


        challengeItem.setAttribute(
            "role",
            "button"
        );


        challengeItem.setAttribute(
            "tabindex",
            "0"
        );


        const openChallenge =
            () => {

                window.location.href =
                    `chapter-challenge.html?chapter=${encodeURIComponent(
                        chapterId
                    )}`;

            };


        challengeItem.addEventListener(
            "click",
            openChallenge
        );


        challengeItem.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    openChallenge();

                }

            }
        );

    } else {

        challengeItem.className = "mission-path-item chapter-challenge locked";
        challengeItem.setAttribute("aria-disabled", "true");


        challengeItem.innerHTML = `

            <div class="mission-path-node">
                🔒
            </div>

            <div class="mission-path-content">

                <span>
                    CHAPTER CHALLENGE
                </span>

                <strong>
                    Final Chapter Challenge
                </strong>

                <small>
                    Complete all missions to unlock
                </small>

                <span
                    class="mission-state-chip locked-chip"
                >
                    🔒 Final Challenge Locked
                </span>

            </div>

        `;

    }


    missionPath.appendChild(
        challengeItem
    );

}


/* ==========================================
   MAKE MISSION SELECTABLE
========================================== */

function makeMissionSelectable(
    item,
    mission
) {
    item.setAttribute("aria-pressed",String(mission.id === selectedMissionId));

    item.style.cursor =
        "pointer";


    item.setAttribute(
        "role",
        "button"
    );


    item.setAttribute(
        "tabindex",
        "0"
    );


    item.setAttribute(
        "aria-label",
        mission.isCompleted
            ? `View introduction for ${
                mission.title ||
                "mission"
            }`
            : `Select ${
                mission.title ||
                "mission"
            }`
    );


    item.addEventListener(
        "click",
        () => {

            selectMission(
                mission
            );

        }
    );


    item.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                selectMission(
                    mission
                );

            }

        }
    );

}


/* ==========================================
   ERROR
========================================== */

function showError(message) {
    if (retryMissionLoadButton) retryMissionLoadButton.hidden = !auth.currentUser;

    if (missionLoading) {

        missionLoading.hidden =
            true;

    }


    if (missionContent) {

        missionContent.hidden =
            true;

    }


    if (missionError) {

        missionError.textContent =
            message;

        missionError.hidden =
            false;

    }

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* ==========================================
   START
   WAIT FOR FIREBASE AUTH
========================================== */

retryMissionLoadButton?.addEventListener("click", () => loadMissionPage());
window.addEventListener("pageshow", event => {
    if (event.persisted && auth.currentUser) loadMissionPage();
});
onAuthStateChanged(auth, user => {
    if (!user) {
        missionUserId = null;
        missionLoadGeneration++;
        loadedMissionStates = [];
        selectedMissionId = null;
        isChapterChallengeUnlocked = false;
        isChapterChallengeCompleted = false;
        missionPath.replaceChildren();
        beginMissionButton.onclick = null;
        showError("Please sign in to view your missions.");
        return;
    }
    if (missionUserId === user.uid) return;
    missionUserId = user.uid;
    loadMissionPage();
});

/* ==========================================
   CHECK STUDENT CHAPTER ACCESS
========================================== */

async function checkStudentChapterAccess(user, requestedChapterId) {
    try {
        await requireLearningAccess(requestedChapterId);
        return { allowed: true, message: "" };
    } catch (error) {
        if (!(error instanceof LearningAccessError)) throw error;
        return { allowed: false, message: error.message };
    }
}
