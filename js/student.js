// ==========================================
// LAKBAYPANAHON
// STUDENT DASHBOARD
// ==========================================

import { renderStudentIdentity } from "./student-profile.js";
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


// ==========================================
// AUTHENTICATED STUDENT
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {
            return;
        }


        try {

            // ==================================
            // LOAD STUDENT PROFILE
            // ==================================

            const userSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (!userSnapshot.exists()) {

                console.error(
                    "Student profile not found."
                );

                return;
            }


            const student =
                userSnapshot.data();


            if (
                student.role !== "student"
            ) {
                return;
            }


            // ==================================
            // BASIC STUDENT INFORMATION
            // ==================================

            const firstName =
                student.firstName ||
                student.name ||
                "Student";


            const xp =
                Number(student.xp) || 0;


            const level =
                Number(student.level) || 1;


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
                level
            );


            // ==================================
            // DASHBOARD DATA
            // ==================================

            await loadCompletedMissionCount(
                user.uid
            );


            await loadCurrentJourney(
                user.uid
            );


            await loadArtifactCollection(
                user.uid
            );


            await loadBadgeCount(
                user.uid
            );


        } catch (error) {

            console.error(
                "Unable to load student dashboard:",
                error
            );
        }

    }
);


// ==========================================
// PLAYER PROGRESS
// ==========================================

function loadPlayerProgress(
    xp,
    level
) {

    const xpPerLevel = 100;


    const currentLevelStartXp =
        (level - 1) *
        xpPerLevel;


    const nextLevelXp =
        level *
        xpPerLevel;


    const xpInsideCurrentLevel =
        Math.max(
            0,
            xp -
            currentLevelStartXp
        );


    const levelProgressPercent =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (
                        xpInsideCurrentLevel /
                        xpPerLevel
                    ) *
                    100
                )
            )
        );


    const xpUntilNextLevel =
        Math.max(
            0,
            nextLevelXp -
            xp
        );


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
    userId
) {

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


        const progressSnapshot =
            await getDocs(
                progressQuery
            );


        let completedCount = 0;


        progressSnapshot.forEach(
            (progressDocument) => {

                const progress =
                    progressDocument.data();


                if (
                    progress.completed === true
                ) {

                    completedCount++;
                }

            }
        );


        setText(
            "missionsCompleted",
            completedCount
        );


    } catch (error) {

        console.error(
            "Unable to load completed mission count:",
            error
        );
    }
}


// ==========================================
// CURRENT JOURNEY
// ==========================================

async function loadCurrentJourney(
    userId
) {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    try {

        // ==================================
        // LOAD CHAPTERS
        // ==================================

        const chapterSnapshot =
            await getDocs(
                collection(
                    db,
                    "chapters"
                )
            );


        const chapters = [];


        chapterSnapshot.forEach(
            (chapterDocument) => {

                const chapter =
                    chapterDocument.data();


                if (
                    chapter.status === "active"
                ) {

                    chapters.push({
                        id:
                            chapterDocument.id,

                        ...chapter
                    });
                }

            }
        );


        chapters.sort(
            (a, b) =>
                (Number(a.order) || 0) -
                (Number(b.order) || 0)
        );


        if (
            chapters.length === 0
        ) {

            showJourneyUnavailable();

            return;
        }


        // ==================================
        // LOAD STUDENT CHAPTER PROGRESS
        // ==================================

        const chapterProgressQuery =
            query(
                collection(
                    db,
                    "studentChapterProgress"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const chapterProgressSnapshot =
            await getDocs(
                chapterProgressQuery
            );


        const completedChapters =
            new Set();


        chapterProgressSnapshot.forEach(
            (progressDocument) => {

                const progress =
                    progressDocument.data();


                if (
                    progress.completed === true &&
                    progress.chapterId
                ) {

                    completedChapters.add(
                        progress.chapterId
                    );
                }

            }
        );


        // ==================================
        // FIND CURRENT CHAPTER
        // ==================================

        let currentChapter = null;


        for (
            const chapter of chapters
        ) {

            if (
                !completedChapters.has(
                    chapter.id
                )
            ) {

                currentChapter =
                    chapter;

                break;
            }

        }


        // ==================================
        // ALL AVAILABLE CHAPTERS COMPLETE
        // ==================================

        if (!currentChapter) {

            showJourneyComplete();

            return;
        }


        // ==================================
        // LOAD MISSIONS FOR CURRENT CHAPTER
        // ==================================

        const missionQuery =
            query(
                collection(
                    db,
                    "missions"
                ),
                where(
                    "chapterId",
                    "==",
                    currentChapter.id
                )
            );


        const missionSnapshot =
            await getDocs(
                missionQuery
            );


        const missions = [];


        missionSnapshot.forEach(
            (missionDocument) => {

                const mission =
                    missionDocument.data();


                if (
                    mission.status === "active"
                ) {

                    missions.push({
                        id:
                            missionDocument.id,

                        ...mission
                    });
                }

            }
        );


        missions.sort(
            (a, b) =>
                (Number(a.order) || 0) -
                (Number(b.order) || 0)
        );


        // ==================================
        // CHAPTER EXISTS BUT NO MISSIONS
        // ==================================

        if (
            missions.length === 0
        ) {

            showChapterComingSoon(
                currentChapter
            );

            return;
        }


        // ==================================
        // LOAD STUDENT MISSION PROGRESS
        // ==================================

        const missionProgressQuery =
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


        const missionProgressSnapshot =
            await getDocs(
                missionProgressQuery
            );


        const completedMissions =
            new Set();


        missionProgressSnapshot.forEach(
            (progressDocument) => {

                const progress =
                    progressDocument.data();


                if (
                    progress.completed === true &&
                    progress.missionId
                ) {

                    completedMissions.add(
                        progress.missionId
                    );
                }

            }
        );


        // ==================================
        // FIND NEXT UNFINISHED MISSION
        // ==================================

        const nextMission =
            missions.find(
                (mission) =>
                    !completedMissions.has(
                        mission.id
                    )
            );


        const completedMissionCount =
            missions.filter(
                (mission) =>
                    completedMissions.has(
                        mission.id
                    )
            ).length;


        // ==================================
        // CONTINUE MISSION
        // ==================================

        if (nextMission) {

            showCurrentMission(
                currentChapter,
                nextMission,
                completedMissionCount,
                missions.length
            );

            return;
        }


        // ==================================
        // ALL MISSIONS COMPLETE
        // TAKE CHAPTER CHALLENGE
        // ==================================

        showChapterChallenge(
            currentChapter,
            missions.length
        );


    } catch (error) {

        console.error(
            "Unable to load current journey:",
            error
        );


        showJourneyError();
    }
}


// ==========================================
// SHOW CURRENT MISSION
// ==========================================

function showCurrentMission(
    chapter,
    mission,
    completedCount,
    totalMissions
) {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    const percentage =
        totalMissions > 0
            ? Math.round(
                (
                    completedCount /
                    totalMissions
                ) *
                100
            )
            : 0;


    journeyContainer.innerHTML = `
        ${createJourneyIcon("📖")}

        <div class="journey-details">

            <span class="journey-status">
                CURRENT MISSION
            </span>

            <span class="journey-chapter-label">
                ${chapter.title || "Historical Chapter"}
            </span>

            <h3>
                ${mission.title || "Continue Mission"}
            </h3>

            <p>
                ${
                    mission.introduction ||
                    "Continue your historical adventure and complete the next mission."
                }
            </p>

            ${
                createJourneyProgress(
                    completedCount,
                    totalMissions,
                    percentage
                )
            }

            ${
                createJourneyObjective(
                    "📜",
                    "YOUR OBJECTIVE",
                    "Complete this historical mission"
                )
            }

            ${
                createJourneyButton(
                    `mission.html?chapter=${chapter.id}`,
                    "Continue Mission"
                )
            }

        </div>
    `;
}


// ==========================================
// SHOW CHAPTER CHALLENGE
// ==========================================

function showChapterChallenge(
    chapter,
    totalMissions
) {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    journeyContainer.innerHTML = `
        ${createJourneyIcon("🏆")}

        <div class="journey-details">

            <span class="journey-status">
                FINAL CHALLENGE READY
            </span>

            <span class="journey-chapter-label">
                ${chapter.title || "Historical Chapter"}
            </span>

            <h3>
                Chapter Challenge
            </h3>

            <p>
                You completed all missions in this chapter.
                Test what you learned to complete the chapter
                and earn its special badge.
            </p>

            ${
                createJourneyProgress(
                    totalMissions,
                    totalMissions,
                    100
                )
            }

            ${
                createJourneyObjective(
                    "🏅",
                    "FINAL OBJECTIVE",
                    "Pass the Chapter Challenge"
                )
            }

            ${
                createJourneyButton(
                    `chapter-challenge.html?chapter=${chapter.id}`,
                    "Take Chapter Challenge"
                )
            }

        </div>
    `;
}


// ==========================================
// SHOW NEXT CHAPTER / COMING SOON
// ==========================================

function showChapterComingSoon(
    chapter
) {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    journeyContainer.innerHTML = `
        ${createJourneyIcon("🗺️")}

        <div class="journey-details">

            <span class="journey-status">
                NEXT DESTINATION
            </span>

            <span class="journey-chapter-label">
                Your Journey Continues
            </span>

            <h3>
                ${chapter.title || "Next Historical Chapter"}
            </h3>

            <p>
                ${
                    chapter.description ||
                    "A new historical chapter is waiting for you."
                }
            </p>

            ${
                createJourneyObjective(
                    "🧭",
                    "CHAPTER STATUS",
                    "New missions are coming soon"
                )
            }

            ${
                createJourneyButton(
                    "chapters.html",
                    "Explore Chapters"
                )
            }

        </div>
    `;
}


// ==========================================
// SHOW JOURNEY COMPLETE
// ==========================================

function showJourneyComplete() {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    journeyContainer.innerHTML = `
        ${createJourneyIcon("🏅")}

        <div class="journey-details">

            <span class="journey-status">
                JOURNEY COMPLETE
            </span>

            <h3>
                Great Work, History Explorer!
            </h3>

            <p>
                You completed all currently available
                historical chapters. You can review your
                previous adventures while waiting for
                more chapters.
            </p>

            ${
                createJourneyObjective(
                    "📚",
                    "KEEP EXPLORING",
                    "Review completed chapters and missions"
                )
            }

            ${
                createJourneyButton(
                    "chapters.html",
                    "Review Chapters"
                )
            }

        </div>
    `;
}


// ==========================================
// JOURNEY UNAVAILABLE
// ==========================================

function showJourneyUnavailable() {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    journeyContainer.innerHTML = `
        ${createJourneyIcon("🧭")}

        <div class="journey-details">

            <span class="journey-status">
                JOURNEY PREPARING
            </span>

            <h3>
                Historical Adventures Coming Soon
            </h3>

            <p>
                There are currently no active historical
                chapters available.
            </p>

        </div>
    `;
}


// ==========================================
// JOURNEY ERROR
// ==========================================

function showJourneyError() {

    const journeyContainer =
        document.getElementById(
            "newJourneyState"
        );


    if (!journeyContainer) {
        return;
    }


    journeyContainer.innerHTML = `
        ${createJourneyIcon("📜")}

        <div class="journey-details">

            <span class="journey-status">
                JOURNEY UNAVAILABLE
            </span>

            <h3>
                We could not load your journey.
            </h3>

            <p>
                Refresh the page to try again.
            </p>

        </div>
    `;
}


// ==========================================
// JOURNEY UI HELPERS
// ==========================================

function createJourneyIcon(
    icon
) {

    return `
        <div class="journey-illustration quest-compass">
            ${icon}
        </div>
    `;
}


function createJourneyObjective(
    icon,
    label,
    objective
) {

    return `
        <div class="quest-objective">

            <span class="quest-objective-icon">
                ${icon}
            </span>

            <div>

                <small>
                    ${label}
                </small>

                <strong>
                    ${objective}
                </strong>

            </div>

        </div>
    `;
}


function createJourneyProgress(
    completed,
    total,
    percentage
) {

    return `
        <div class="journey-progress-box">

            <div class="journey-progress-header">

                <span>
                    CHAPTER PROGRESS
                </span>

                <strong>
                    ${completed} / ${total} Missions
                </strong>

            </div>

            <div class="journey-progress-track">

                <div
                    class="journey-progress-fill"
                    style="width: ${percentage}%;"
                ></div>

            </div>

        </div>
    `;
}


function createJourneyButton(
    href,
    text
) {

    return `
        <a
            href="${href}"
            class="primary-button journey-action-button"
        >
            ${text}
            <span>→</span>
        </a>
    `;
}


// ==========================================
// BADGE COUNT
// ==========================================

async function loadBadgeCount(
    userId
) {

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


        setText(
            "badgesEarned",
            badgeSnapshot.size
        );


    } catch (error) {

        console.error(
            "Unable to load badge count:",
            error
        );
    }
}


// ==========================================
// ARTIFACT COLLECTION
// ==========================================

async function loadArtifactCollection(
    userId
) {

    const artifactGrid =
        document.getElementById(
            "artifactGrid"
        );


    if (!artifactGrid) {
        return;
    }


    try {

        const studentArtifactQuery =
            query(
                collection(
                    db,
                    "studentArtifacts"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const studentArtifactSnapshot =
            await getDocs(
                studentArtifactQuery
            );


        const artifactIds = [];


        studentArtifactSnapshot.forEach(
            (artifactDocument) => {

                const artifactOwnership =
                    artifactDocument.data();


                if (
                    artifactOwnership.artifactId
                ) {

                    artifactIds.push(
                        artifactOwnership.artifactId
                    );
                }

            }
        );


        setText(
            "artifactCount",
            artifactIds.length
        );


        if (
            artifactIds.length === 0
        ) {

            showEmptyArtifactCollection();

            return;
        }


        const artifacts = [];


        for (
            const artifactId of artifactIds
        ) {

            try {

                const artifactSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "artifacts",
                            artifactId
                        )
                    );


                if (
                    artifactSnapshot.exists()
                ) {

                    artifacts.push({
                        id:
                            artifactSnapshot.id,

                        ...artifactSnapshot.data()
                    });
                }


            } catch (error) {

                console.error(
                    `Unable to load artifact ${artifactId}:`,
                    error
                );
            }

        }


        if (
            artifacts.length === 0
        ) {

            showEmptyArtifactCollection();

            return;
        }


        artifacts.sort(
            (a, b) =>
                (Number(a.order) || 0) -
                (Number(b.order) || 0)
        );


        artifactGrid.innerHTML = "";


        artifacts.forEach(
            (artifact) => {

                artifactGrid.insertAdjacentHTML(
                    "beforeend",
                    createArtifactCard(
                        artifact
                    )
                );

            }
        );


    } catch (error) {

        console.error(
            "Unable to load artifact collection:",
            error
        );


        showEmptyArtifactCollection();
    }
}


// ==========================================
// CREATE ARTIFACT CARD
// ==========================================

function createArtifactCard(
    artifact
) {

    const icon =
        artifact.icon ||
        artifact.emoji ||
        "🏺";


    const name =
        artifact.name ||
        artifact.title ||
        "Historical Artifact";


    const description =
        artifact.description ||
        "A historical collectible earned during your journey.";


    return `
        <article class="artifact-card">

            <div class="artifact-card-icon">
                ${icon}
            </div>

            <div class="artifact-card-content">

                <span class="artifact-unlocked">
                    ✓ COLLECTED
                </span>

                <h4>
                    ${name}
                </h4>

                <p>
                    ${description}
                </p>

            </div>

        </article>
    `;
}


// ==========================================
// EMPTY ARTIFACT COLLECTION
// ==========================================

function showEmptyArtifactCollection() {

    const artifactGrid =
        document.getElementById(
            "artifactGrid"
        );


    if (!artifactGrid) {
        return;
    }


    artifactGrid.innerHTML = `
        <div class="artifact-empty">

            <div class="artifact-empty-icon">
                🏺
            </div>

            <div>

                <strong>
                    No artifacts collected yet
                </strong>

                <p>
                    Complete missions to discover
                    historical collectibles.
                </p>

            </div>

        </div>
    `;
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


// ==========================================
// MOBILE SIDEBAR
// ==========================================

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
                "mobile-open"
            );

        }
    );


    document
        .querySelectorAll(
            ".sidebar .nav-link"
        )
        .forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    () => {

                        if (
                            window.innerWidth <= 900
                        ) {

                            sidebar.classList.remove(
                                "mobile-open"
                            );
                        }

                    }
                );

            }
        );
}
