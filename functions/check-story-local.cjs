
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "lakbaypanahon-1797e";
process.env.GOOGLE_CLOUD_PROJECT = "lakbaypanahon-1797e";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
    projectId: "lakbaypanahon-1797e"
});

async function check() {
    const db = getFirestore();

    const scene = await db
        .collection("storyScenes")
        .doc("ai-test-scene")
        .get();

    console.log("Exact scene exists:", scene.exists);

    if (scene.exists) {
        console.log("Scene data:", scene.data());
    }

    const allScenes = await db
        .collection("storyScenes")
        .limit(10)
        .get();

    console.log(
        "Story scene IDs:",
        allScenes.docs.map(doc => doc.id)
    );
}

check().catch(console.error);
