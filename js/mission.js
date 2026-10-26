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

let selectedMissionId = null;

let loadedChapterName = "";

let isChapterChallengeUnlocked = false;

let isChapterChallengeCompleted = false;


/* ==========================================
   LOAD MISSION PAGE
========================================== */

async function loadMissionPage() {

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

if (!chapterAccessResult.allowed) {
    showError(chapterAccessResult.message);
    return;
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
            await getDocs(
                collection(
                    db,
                    "missions"
                )
            );


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
                        isUnlocked

                    };

                }
            );


        loadedMissionStates =
            missionStates;


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
        mission.introduction ||
        "";


    /* ==================================
       LEARNING OBJECTIVE
    ================================== */

    const learningObjective =
        String(
            mission.learningObjective ||
            ""
        ).trim();


    if (
        missionLearningGoal &&
        missionLearningObjective
    ) {

        if (learningObjective) {

            missionLearningObjective.textContent =
                learningObjective;

            missionLearningGoal.hidden =
                false;

        } else {

            missionLearningObjective.textContent =
                "";

            missionLearningGoal.hidden =
                true;

        }

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


    if (chapterChallengeUnlocked) {

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

        challengeItem.className =
    isChapterChallengeCompleted
        ? "mission-path-item chapter-challenge completed"
        : "mission-path-item chapter-challenge unlocked";


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
   START
   WAIT FOR FIREBASE AUTH
========================================== */

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            console.log(
                "Mission page authenticated user:",
                user.uid
            );


            loadMissionPage();

        }

    }
);

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
