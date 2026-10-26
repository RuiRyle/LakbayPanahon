import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { reviewTopicsFromHistory, renderReviewTopics } from "./practice-review.js";

const container = document.getElementById("studentReviewTopics");
const reload = document.getElementById("reloadStudentReview");
let loading = false;
async function loadReview() {
    const user = auth.currentUser;
    if (!user || !container || loading) return;
    loading = true;
    reload.disabled = true;
    container.textContent = "Loading your practice results...";
    try {
        const [history, questions, missions, chapters] = await Promise.all([
            getDocs(query(collection(db, "studentPracticeProgress"), where("userId", "==", user.uid))),
            getDocs(collection(db, "practiceQuestions")),
            getDocs(collection(db, "missions")),
            getDocs(collection(db, "chapters"))
        ]);
        if (auth.currentUser?.uid !== user.uid) return;
        const rows = snapshot => snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
        const availableChapters = new Set(rows(chapters).filter(item => item.status === "active" && item.contentReady !== false).map(item => item.id));
        const missionChapters = new Map(rows(missions).filter(item => item.status === "active" && availableChapters.has(item.chapterId))
            .map(item => [item.id, item.chapterId]));
        const topics = reviewTopicsFromHistory(rows(history), rows(questions))
            .filter(item => item.missed > 0 && missionChapters.has(item.missionId));
        renderReviewTopics(container, topics, missionChapters,
            "No topics need extra review from your saved practice yet. Complete a practice activity to build your review list.");
    } catch (error) {
        console.warn("Practice recommendations unavailable:", error);
        container.textContent = "We could not load your review topics. Try Refresh Review again.";
    } finally {
        loading = false;
        reload.disabled = false;
    }
}
reload?.addEventListener("click", loadReview);
onAuthStateChanged(auth, user => { if (user) loadReview(); });
