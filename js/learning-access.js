import { auth, db } from "./firebase-config.js";
import {
    collection, doc, getDoc, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// These checks keep navigation consistent. Firestore rules remain responsible
// for enforcing data permissions independently of the browser.
export class LearningAccessError extends Error {}

export async function requireLearningAccess(chapterId, missionId = null) {
    const user = auth.currentUser;
    if (!user) throw new LearningAccessError("Please sign in to continue learning.");

    const profile = await getDoc(doc(db, "users", user.uid));
    if (!profile.exists() || profile.data().role !== "student" ||
        profile.data().status !== "active") {
        throw new LearningAccessError("An active student account is required.");
    }

    const chaptersSnapshot = await getDocs(collection(db, "chapters"));
    const chapters = chaptersSnapshot.docs.map(item => ({ ...item.data(), id: item.id }));
    const chapter = chapters.find(item => item.id === chapterId);
    if (!chapter || chapter.status !== "active" || chapter.contentReady === false) {
        throw new LearningAccessError("This chapter is not available yet.");
    }

    // Chapter selection is grouped by era; each era begins independently.
    const eraChapters = chapters.filter(item =>
        item.eraId === chapter.eraId && item.status === "active" &&
        item.contentReady !== false
    ).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    const precedingChapters = eraChapters.slice(0,
        eraChapters.findIndex(item => item.id === chapterId));
    const chapterProgress = await getDocs(query(
        collection(db, "studentChapterProgress"), where("userId", "==", user.uid)
    ));
    const completedChapters = new Set(chapterProgress.docs
        .filter(item => item.data().completed === true)
        .map(item => item.data().chapterId));
    if (!precedingChapters.every(item => completedChapters.has(item.id))) {
        throw new LearningAccessError("Complete the previous chapters in this era first.");
    }

    if (!missionId) return chapter;
    const missionsSnapshot = await getDocs(query(
        collection(db, "missions"), where("chapterId", "==", chapterId)
    ));
    const missions = missionsSnapshot.docs.map(item => ({ ...item.data(), id: item.id }))
        .filter(item => item.status === "active")
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    const missionIndex = missions.findIndex(item => item.id === missionId);
    if (missionIndex < 0) throw new LearningAccessError("This mission is not available in this chapter.");
    const progress = await getDocs(query(
        collection(db, "studentProgress"), where("userId", "==", user.uid)
    ));
    const completedMissions = new Set(progress.docs
        .filter(item => item.data().completed === true)
        .map(item => item.data().missionId));
    if (!missions.slice(0, missionIndex).every(item => completedMissions.has(item.id))) {
        throw new LearningAccessError("Complete the previous missions first.");
    }
    return missions[missionIndex];
}
