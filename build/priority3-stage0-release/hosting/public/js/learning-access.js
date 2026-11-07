import { auth, db } from "./firebase-config.js";
import {
    collection, doc, getDocFromServer, getDocsFromServer, query, where
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// These checks keep navigation consistent. Firestore rules remain responsible
// for enforcing data permissions independently of the browser.
export class LearningAccessError extends Error {}

export async function requireLearningAccess(chapterId, missionId = null) {
    const user = auth.currentUser;
    if (!user) throw new LearningAccessError("Please sign in to continue learning.");
    const validId = value => typeof value === "string" && value.length > 0 &&
        value.length <= 1500 && value.trim() === value && !/[\/\u0000-\u001f]/.test(value) &&
        value !== "." && value !== "..";
    if (!validId(chapterId) || (missionId !== null && !validId(missionId))) {
        throw new LearningAccessError("This learning link is invalid. Open the lesson from My Journey.");
    }
    const checkSession = () => {
        if (auth.currentUser?.uid !== user.uid) {
            throw new LearningAccessError("Your account changed. Open the lesson again to continue.");
        }
    };
    // Access decisions must not fall back to cached roles or completion records.
    const readDocument = async reference => {
        const snapshot = await getDocFromServer(reference);
        checkSession();
        return snapshot;
    };
    const readDocuments = async reference => {
        const snapshot = await getDocsFromServer(reference);
        checkSession();
        return snapshot;
    };

    const profile = await readDocument(doc(db, "users", user.uid));
    if (!profile.exists() || profile.data().role !== "student" ||
        profile.data().status !== "active") {
        throw new LearningAccessError("An active student account is required.");
    }

    const chapterSnapshot = await readDocument(doc(db, "chapters", chapterId));
    const chapter = chapterSnapshot.exists() ? { ...chapterSnapshot.data(), id: chapterSnapshot.id || chapterId } : null;
    if (!chapter || chapter.status !== "active" || chapter.contentReady === false) {
        throw new LearningAccessError("This chapter is not available yet.");
    }
    if (chapter.eraId !== undefined && !validId(chapter.eraId)) {
        throw new LearningAccessError("This chapter's era is not available yet.");
    }

    let eraRequirements = [];
    if (typeof chapter.eraId === "string" && chapter.eraId) {
        const era = await readDocument(doc(db,"eras",chapter.eraId));
        if (!era.exists() || era.data().status !== "active") throw new LearningAccessError("This historical era is not available yet.");
        eraRequirements = era.data().requiredChapterIds === undefined ? [] : era.data().requiredChapterIds;
    }

    // Era entry and chapter order use owned chapter completion records.
    const chapterList = typeof chapter.eraId === "string" && chapter.eraId
        ? await readDocuments(query(collection(db,"chapters"),where("eraId","==",chapter.eraId)))
        : await readDocuments(collection(db,"chapters"));
    const eraChapters = chapterList.docs.map(item => ({...item.data(),id:item.id})).filter(item =>
        item.eraId === chapter.eraId && item.status === "active" &&
        item.contentReady !== false
    );
    if (eraChapters.some(item => !Number.isFinite(item.order))) {
        throw new LearningAccessError("This chapter's learning order needs to be checked. Open another chapter or try again later.");
    }
    eraChapters.sort((a, b) => a.order - b.order);
    const chapterIndex = eraChapters.findIndex(item => item.id === chapterId);
    if (chapterIndex < 0) {
        throw new LearningAccessError("This chapter changed. Open it again from My Journey.");
    }
    const precedingChapters = eraChapters.slice(0, chapterIndex);
    const chapterProgress = await readDocuments(query(
        collection(db, "studentChapterProgress"), where("userId", "==", user.uid)
    ));
    const completedChapters = new Set(chapterProgress.docs
        .filter(item => item.data().userId === user.uid && item.data().completed === true)
        .map(item => item.data().chapterId));
    const reviewingCompletedChapter = completedChapters.has(chapterId);
    const eraReady = Array.isArray(eraRequirements) && eraRequirements.every(id=>typeof id==='string'&&id&&completedChapters.has(id));
    const previousReady = precedingChapters.filter(item=>item.requiredForProgression!==false).every(item => completedChapters.has(item.id));
    // A newly configured prerequisite must not remove a completed lesson's review link.
    let reviewProgress = null;
    let reviewingCompletedMission = false;
    if (missionId && !reviewingCompletedChapter && (!eraReady || !previousReady)) {
        reviewProgress = await readDocuments(query(collection(db,"studentProgress"),where("userId","==",user.uid)));
        reviewingCompletedMission = reviewProgress.docs.some(item=>item.data().userId===user.uid&&item.data().missionId===missionId&&item.data().completed===true);
    }
    const preview = globalThis.__lakbayExplorationPreview === true;
    if (!preview && !reviewingCompletedChapter && !reviewingCompletedMission && !eraReady) {
        throw new LearningAccessError('Complete the required chapters in the previous era first.');
    }
    if (!preview && !reviewingCompletedChapter && !reviewingCompletedMission && !previousReady) {
        throw new LearningAccessError("Complete the previous chapters in this era first.");
    }

    if (!missionId) return chapter;
    const missionsSnapshot = await readDocuments(query(
        collection(db, "missions"), where("chapterId", "==", chapterId)
    ));
    const missions = missionsSnapshot.docs.map(item => ({ ...item.data(), id: item.id }))
        .filter(item => item.status === "active");
    if (missions.some(item => !Number.isFinite(item.order))) {
        throw new LearningAccessError("This mission's learning order needs to be checked. Open another chapter or try again later.");
    }
    missions.sort((a, b) => a.order - b.order);
    const missionIndex = missions.findIndex(item => item.id === missionId);
    if (missionIndex < 0) throw new LearningAccessError("This mission is not available in this chapter.");
    const progress = reviewProgress || await readDocuments(query(
        collection(db, "studentProgress"), where("userId", "==", user.uid)
    ));
    const completedMissions = new Set(progress.docs
        .filter(item => item.data().userId === user.uid && item.data().completed === true)
        .map(item => item.data().missionId));
    if (!preview && !completedMissions.has(missionId) && !missions.slice(0, missionIndex).every(item => completedMissions.has(item.id))) {
        throw new LearningAccessError("Complete the previous missions first.");
    }
    return missions[missionIndex];
}
