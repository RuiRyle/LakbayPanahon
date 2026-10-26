
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "lakbaypanahon-1797e";
process.env.GOOGLE_CLOUD_PROJECT = "lakbaypanahon-1797e";

const { getFirestore } = require("firebase-admin/firestore");
const { getLearningAssistance } = require("./index.js");

async function main() {
    const users = await getFirestore()
        .collection("users")
        .where("role", "==", "student")
        .where("status", "==", "active")
        .limit(1)
        .get();

    if (users.empty) {
        console.log("No active local test student found.");
        return;
    }

    const uid = users.docs[0].id;

    const tests = [
        {
            name: "Valid practice hint",
            data: {
                type: "practice_hint",
                chapterId: "ai-test-chapter",
                missionId: "ai-test-mission",
                contentId: "ai-test-question"
            }
        },
        {
            name: "Invalid assistance type",
            data: {
                type: "invalid_type",
                chapterId: "ai-test-chapter",
                missionId: "ai-test-mission",
                contentId: "ai-test-question"
            }
        },
        {
            name: "Missing chapter",
            data: {
                type: "practice_hint",
                chapterId: "missing-chapter",
                missionId: "ai-test-mission",
                contentId: "ai-test-question"
            }
        },
        {
            name: "Valid story explanation",
            data: {
                type: "story_explanation",
                chapterId: "ai-test-chapter",
                missionId: "ai-test-mission",
                contentId: "OTEd8awpXQnUiR7neVwy"
            }
        },
        {
            name: "Story with wrong content ID",
            data: {
                type: "story_explanation",
                chapterId: "ai-test-chapter",
                missionId: "ai-test-mission",
                contentId: "ai-test-question"
            }
        },
        {
            name: "Missing story scene",
            data: {
                type: "story_explanation",
                chapterId: "ai-test-chapter",
                missionId: "ai-test-mission",
                contentId: "missing-story-scene"
            }
        }
    ];

    for (const test of tests) {
        try {
            await getLearningAssistance.run({
                auth: { uid },
                data: test.data
            });

            console.log(
                test.name + ": Unexpected success"
            );
        } catch (error) {
            console.log(
                test.name + ":",
                error.code,
                error.message
            );
        }
    }
}

main().catch(console.error);
