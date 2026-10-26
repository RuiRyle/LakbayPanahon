
const { onCall, HttpsError } = require(
    "firebase-functions/v2/https"
);

const { initializeApp } = require(
    "firebase-admin/app"
);

const { getFirestore } = require(
    "firebase-admin/firestore"
);

initializeApp();

const { createStudentRewards } = require("./student-rewards");
exports.submitStudentActivity = onCall(
    { region: "asia-southeast1", enforceAppCheck: false, maxInstances: 10 },
    createStudentRewards(getFirestore())
);

/*
 * LakbayPanahon Backend Authentication Test
 *
 * This function checks whether the request
 * comes from a Firebase-authenticated user.
 *
 * It does not access student progress,
 * generate AI content, or award XP.
 */

exports.testStudentAuth = onCall(
    {
        region: "asia-southeast1",
        enforceAppCheck: false
    },
    async (request) => {

        if (!request.auth) {

            throw new HttpsError(
                "unauthenticated",
                "Please sign in to continue."
            );
        }

        const studentUid = request.auth.uid;

const studentDoc = await getFirestore()
    .collection("users")
    .doc(studentUid)
    .get();

    if (!studentDoc.exists) {
    throw new HttpsError(
        "permission-denied",
        "Student profile not found."
    );
}

const studentData = studentDoc.data();

if (
    studentData.role !== "student" ||
    studentData.status !== "active"
) {
    throw new HttpsError(
        "permission-denied",
        "Only active students can access this feature."
    );
}

        return {
            success: true,
            message:
                "LakbayPanahon backend authentication is working."
        };
    }
);




/*
 * LakbayPanahon AI Learning Assistance
 *
 * Preparation only:
 * - Authenticates active students
 * - Validates the assistance type
 * - Does not call Gemini
 * - Does not modify Firestore
 */

exports.getLearningAssistance = onCall(
    {
        region: "asia-southeast1",
        enforceAppCheck: false
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "Please sign in to continue."
            );
        }

        const studentDoc = await getFirestore()
            .collection("users")
            .doc(request.auth.uid)
            .get();

        if (!studentDoc.exists) {
            throw new HttpsError(
                "permission-denied",
                "Student profile not found."
            );
        }

        const student = studentDoc.data();

        if (
            student.role !== "student" ||
            student.status !== "active"
        ) {
            throw new HttpsError(
                "permission-denied",
                "Only active students can use AI assistance."
            );
        }

        const assistanceType = request.data?.type;

        if (
            assistanceType !== "practice_hint" &&
            assistanceType !== "story_explanation"
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Invalid learning assistance type."
            );
        }

       
       
        // Validate the requested learning content.
        const chapterId = request.data?.chapterId;
        const missionId = request.data?.missionId;
        const contentId = request.data?.contentId;

        const validId = (value) =>
            typeof value === "string" &&
            value.length >= 1 &&
            value.length <= 128 &&
            !value.includes("/") &&
            value.trim() === value;

        if (
            !validId(chapterId) ||
            !validId(missionId) ||
            !validId(contentId)
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Invalid learning content identifiers."
            );
        }


        
        // Verify the selected chapter and mission.
        const firestore = getFirestore();

        const [chapterDoc, missionDoc] = await Promise.all([
            firestore.collection("chapters").doc(chapterId).get(),
            firestore.collection("missions").doc(missionId).get()
        ]);

        if (!chapterDoc.exists || !missionDoc.exists) {
            throw new HttpsError(
                "not-found",
                "Chapter or mission was not found."
            );
        }

        const mission = missionDoc.data();

        if (mission.chapterId !== chapterId) {
            throw new HttpsError(
                "permission-denied",
                "This mission does not belong to the selected chapter."
            );
        }


        const collectionName =
            assistanceType === "practice_hint"
                ? "practiceQuestions"
                : "storyScenes";

        const contentDoc = await getFirestore()
            .collection(collectionName)
            .doc(contentId)
            .get();

        if (!contentDoc.exists) {
            throw new HttpsError(
                "not-found",
                "Learning content was not found."
            );
        }

        const content = contentDoc.data();

        if (
            content.status !== "active" ||
            content.missionId !== missionId
        ) {
            throw new HttpsError(
                "permission-denied",
                "This learning content is unavailable."
            );
        }


        
        // Build an allowlisted context for future AI assistance.
        // Never pass the complete Firestore document to Gemini.

        const safeText = (value, maxLength) =>
            typeof value === "string"
                ? value.trim().slice(0, maxLength)
                : "";

        let learningContext;

        if (assistanceType === "practice_hint") {
            learningContext = {
                question: safeText(content.question, 1000),
                topic: safeText(content.topic, 120),
                difficulty: safeText(content.difficulty, 30)
            };

            if (!learningContext.question) {
                throw new HttpsError(
                    "failed-precondition",
                    "The practice question has no valid text."
                );
            }
        } else {
            learningContext = {
                title: safeText(content.title, 200),
                narrative: safeText(content.content, 3000)
            };

            if (!learningContext.narrative) {
                throw new HttpsError(
                    "failed-precondition",
                    "The story scene has no valid narrative."
                );
            }
        }

        // Reserved for future server-side Gemini integration.
        // Do not return learningContext to the browser.
        void learningContext;


        // AI generation remains intentionally disabled.
        // No question answers or scene solutions are returned.
        throw new HttpsError(
            "unavailable",
            "AI learning assistance is not enabled yet."
        );

    }
);
