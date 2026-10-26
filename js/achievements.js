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

const earnedBadgeCount =
    document.getElementById(
        "earnedBadgeCount"
    );

const achievementLoading =
    document.getElementById(
        "achievementLoading"
    );

const achievementEmpty =
    document.getElementById(
        "achievementEmpty"
    );

const badgeCollection =
    document.getElementById(
        "badgeCollection"
    );


/* ==========================================
   LOAD ACHIEVEMENTS
========================================== */

async function loadAchievements(user) {

    try {

        if (achievementLoading) {
            achievementLoading.hidden = false;
        }

        if (achievementEmpty) {
            achievementEmpty.hidden = true;
        }

        if (badgeCollection) {
            badgeCollection.innerHTML = "";
        }


        /* ==================================
           LOAD STUDENT BADGE OWNERSHIP
        ================================== */

        const ownershipSnapshot =
            await getDocs(
                query(collection(
                    db,
                    "studentBadges"
                ), where("userId", "==", user.uid))
            );

        const ownedBadges = [];

        ownershipSnapshot.forEach(
            (documentSnapshot) => {

                const ownership =
                    documentSnapshot.data();

                if (
                    ownership.userId === user.uid
                ) {

                    ownedBadges.push({
                        id:
                            documentSnapshot.id,

                        ...ownership
                    });

                }

            }
        );


        /* ==================================
           NO BADGES YET
        ================================== */

        if (ownedBadges.length === 0) {

            if (earnedBadgeCount) {
                earnedBadgeCount.textContent =
                    "0";
            }

            if (achievementLoading) {
                achievementLoading.hidden =
                    true;
            }

            if (achievementEmpty) {
                achievementEmpty.hidden =
                    false;
            }

            return;
        }


        /* ==================================
           LOAD BADGE DETAILS
        ================================== */

        const badgeResults = [];

        for (const ownership of ownedBadges) {

            if (!ownership.badgeId) {
                continue;
            }

            const badgeReference =
                doc(
                    db,
                    "badges",
                    ownership.badgeId
                );

            const badgeSnapshot =
                await getDoc(
                    badgeReference
                );

            if (!badgeSnapshot.exists()) {
                continue;
            }

            const badge =
                badgeSnapshot.data();

            /*
             * Do not display badges that have
             * been disabled in the badge catalog.
             */
            if (
                badge.status !== "active"
            ) {
                continue;
            }

            badgeResults.push({
                id:
                    badgeSnapshot.id,

                ...badge,

                earnedAt:
                    ownership.earnedAt || null
            });

        }


        /* ==================================
           SORT BADGES
        ================================== */

        badgeResults.sort(
            (a, b) => {

                return (
                    (Number(a.order) || 0) -
                    (Number(b.order) || 0)
                );

            }
        );


        /* ==================================
           UPDATE COUNT
        ================================== */

        if (earnedBadgeCount) {

            earnedBadgeCount.textContent =
                String(
                    badgeResults.length
                );

        }


        if (achievementLoading) {
            achievementLoading.hidden =
                true;
        }


        /* ==================================
           NO DISPLAYABLE BADGES
        ================================== */

        if (badgeResults.length === 0) {

            if (achievementEmpty) {
                achievementEmpty.hidden =
                    false;
            }

            return;
        }


        /* ==================================
           DISPLAY BADGES
        ================================== */

        badgeResults.forEach(
            (badge) => {

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "achievement-badge-card";


                /* --------------------------
                   BADGE ICON
                -------------------------- */

                const icon =
                    document.createElement(
                        "div"
                    );

                icon.className =
                    "achievement-badge-icon";

                icon.textContent =
                    badge.icon || "🏅";


                /* --------------------------
                   BADGE CONTENT
                -------------------------- */

                const content =
                    document.createElement(
                        "div"
                    );

                content.className =
                    "achievement-badge-content";


                const rarity =
                    document.createElement(
                        "span"
                    );

                rarity.className =
                    "achievement-badge-rarity";

                rarity.textContent =
                    String(
                        badge.rarity ||
                        "achievement"
                    ).toUpperCase();


                const name =
                    document.createElement(
                        "h3"
                    );

                name.textContent =
                    badge.name ||
                    "Achievement Badge";


                const description =
                    document.createElement(
                        "p"
                    );

                description.textContent =
                    badge.description ||
                    "";


                content.appendChild(
                    rarity
                );

                content.appendChild(
                    name
                );

                content.appendChild(
                    description
                );


                /* --------------------------
                   EARNED DATE
                -------------------------- */

                const earnedDate =
                    formatEarnedDate(
                        badge.earnedAt
                    );

                if (earnedDate) {

                    const dateElement =
                        document.createElement(
                            "small"
                        );

                    dateElement.className =
                        "achievement-earned-date";

                    dateElement.textContent =
                        `Earned ${earnedDate}`;

                    content.appendChild(
                        dateElement
                    );

                }


                /* --------------------------
                   BUILD CARD
                -------------------------- */

                card.appendChild(
                    icon
                );

                card.appendChild(
                    content
                );

                badgeCollection.appendChild(
                    card
                );

            }
        );

    } catch (error) {

        console.error(
            "Unable to load achievements:",
            error
        );

        if (achievementLoading) {

            achievementLoading.textContent =
                "Unable to load your achievements.";

        }

    }

}


/* ==========================================
   FORMAT EARNED DATE
========================================== */

function formatEarnedDate(timestamp) {

    if (
        !timestamp ||
        typeof timestamp.toDate !== "function"
    ) {
        return "";
    }

    const date =
        timestamp.toDate();

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* ==========================================
   AUTH
========================================== */

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {
            return;
        }

        loadAchievements(
            user
        );

    }
);
