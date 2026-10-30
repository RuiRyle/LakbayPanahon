import { missionReviewTopics } from "./mission-review.js";
import { reviewQuestionSnapshot } from "./review-question-catalog.js";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { reviewTopicsFromHistory, renderReviewTopics } from "./practice-review.js";

const container = document.getElementById("studentReviewTopics");
const reload = document.getElementById("reloadStudentReview");
let loading = false;
let reviewGeneration = 0;
let reviewUserId = null;
async function loadReview() {
    const user = auth.currentUser;
    if (!user || !container || loading) return;
    const generation = reviewGeneration;
    const isCurrent = () => generation === reviewGeneration && auth.currentUser?.uid === user.uid;
    loading = true;
    reload.disabled = true;
    container.textContent = "Loading your practice results...";
    try {
        const [history, missions, chapters, attempts, eras, events] = await Promise.all([
            getDocs(query(collection(db, "studentPracticeProgress"), where("userId", "==", user.uid))),
            getDocs(collection(db, "missions")),
            getDocs(collection(db, "chapters")),
            getDocs(query(collection(db, "studentQuizAttempts"), where("userId", "==", user.uid))),
            getDocs(collection(db,"eras")),
            getDocs(query(collection(db,"studentReviewEvents"),where("userId","==",user.uid)))
        ]);
        if (!isCurrent()) return;
        const rows = snapshot => snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
        const questions = await reviewQuestionSnapshot(user.uid, rows(attempts), rows(history), missionId =>
            getDocs(query(collection(db,"practiceQuestions"),where("missionId","==",missionId))));
        if (!isCurrent()) return;
        const activeEras = new Set(rows(eras).filter(item=>item.status === "active").map(item=>item.id));
        const availableChapters = new Set(rows(chapters).filter(item => item.status === "active" && item.contentReady !== false && (!item.eraId || activeEras.has(item.eraId))).map(item => item.id));
        const missionChapters = new Map(rows(missions).filter(item => item.status === "active" && availableChapters.has(item.chapterId))
            .map(item => [item.id, item.chapterId]));
        const topics = missionReviewTopics(rows(attempts), rows(history), rows(questions), rows(events))
            .filter(item => item.missed > 0 && missionChapters.has(item.missionId));
        renderReviewTopics(container, topics, missionChapters,
            "Your saved quizzes and practice currently show no topics needing extra review. Continue learning to build more evidence.");
    } catch (error) {
        if (!isCurrent()) return;
        console.warn("Practice recommendations unavailable:", error);
        container.textContent = "We could not load your review topics. Try Refresh Review again.";
    } finally {
        if (!isCurrent()) return;
        loading = false;
        reload.disabled = false;
    }
}
reload?.addEventListener("click", loadReview);
onAuthStateChanged(auth, user => {
    if (!user) {
        reviewGeneration++;
        reviewUserId = null;
        loading = false;
        if (container) container.textContent = "Sign in to view your review topics.";
        if (reload) reload.disabled = true;
        return;
    }
    if (reviewUserId === user.uid) return;
    reviewGeneration++;
    reviewUserId = user.uid;
    loading = false;
    loadReview();
});
