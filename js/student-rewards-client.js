import { auth, db } from "./firebase-config.js";
import { requireLearningAccess } from "./learning-access.js";
import { collection, doc, getDocs, query, where, runTransaction, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Spark-compatible rewards. Rules protect ownership, catalog amounts and
// duplicate awards; full quiz grading still runs in the browser.
const rows = snapshot => snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
const ordered = items => items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
const normalize = value => typeof value === "string" ? value.trim().toUpperCase() : "";
const xpValue = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const dateKey = date => new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10);
const find = async (name, field, value) => rows(await getDocs(query(collection(db, name), where(field, "==", value))));

function grade(questions, answers) {
    if (!questions.length || !answers || Object.keys(answers).length !== questions.length) {
        throw new Error("Answer every question before submitting.");
    }
    let correctAnswers = 0;
    for (const question of questions) {
        if (!Object.hasOwn(answers, question.id)) throw new Error("Answer every question before submitting.");
        const answer = answers[question.id];
        if (question.gameType === "matching") {
            if (question.matchingPairs?.length && answer?.gameType === "matching" &&
                question.matchingPairs.every(pair => answer.matches?.[pair.left] === pair.right)) correctAnswers++;
        } else if (question.gameType === "tradeSimulation") {
            if (answer?.gameType === "tradeSimulation" && answer.quantity === Number(question.requiredQuantity)) correctAnswers++;
        } else if (["A", "B", "C", "D"].includes(normalize(question.correctAnswer)) &&
            normalize(answer) === normalize(question.correctAnswer)) correctAnswers++;
    }
    return { correctAnswers, score: Math.round(correctAnswers / questions.length * 100) };
}

export async function submitStudentActivity(input) {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in to save your progress.");
    const { kind, chapterId, missionId } = input;
    if (!["mission", "chapter", "daily"].includes(kind)) throw new Error("Invalid activity.");
    const today = dateKey(new Date());
    const yesterday = dateKey(new Date(Date.now() - 86400000));
    let activity, questions, catalog = null, reward = 0, recordId, recordCollection;
    if (kind === "daily") {
        const challenges = ordered(rows(await getDocs(collection(db, "dailyChallenges")))
            .filter(item => item.status === "active"));
        const day = Math.floor((Date.parse(today) - Date.UTC(Number(today.slice(0, 4)), 0, 1)) / 86400000);
        activity = challenges[day % challenges.length];
        if (!activity || activity.id !== input.challengeId) throw new Error("Reload today's daily challenge.");
        questions = [activity];
        reward = xpValue(activity.xpReward);
        recordId = today;
        recordCollection = "studentDailyChallenges";
    } else {
        const mission = await requireLearningAccess(chapterId, kind === "mission" ? missionId : null);
        if (kind === "mission") {
            activity = (await find("quizzes", "missionId", missionId))
                .find(item => item.id === input.quizId && item.status === "active");
            if (!activity) throw new Error("This quiz is unavailable.");
            questions = (await find("questions", "quizId", activity.id)).filter(item => item.status === "active");
            catalog = (await find("artifacts", "missionId", missionId)).find(item => item.status === "active") || null;
            reward = xpValue(mission.xpReward);
            recordId = missionId;
            recordCollection = "studentProgress";
        } else {
            const missions = (await find("missions", "chapterId", chapterId)).filter(item => item.status === "active");
            const completed = new Set((await find("studentProgress", "userId", user.uid))
                .filter(item => item.completed === true).map(item => item.missionId));
            if (!missions.length || !missions.every(item => completed.has(item.id))) throw new Error("Complete all chapter missions first.");
            activity = (await find("chapterChallenges", "chapterId", chapterId))
                .find(item => item.id === input.challengeId && item.status === "active");
            if (!activity) throw new Error("This chapter challenge is unavailable.");
            questions = (await find("chapterChallengeQuestions", "challengeId", activity.id)).filter(item => item.status === "active");
            catalog = (await find("badges", "chapterId", chapterId)).find(item => item.status === "active") || null;
            recordId = chapterId;
            recordCollection = "studentChapterProgress";
        }
    }
    const result = grade(questions, kind === "daily" ? { [activity.id]: input.answer } : input.answers);
    const threshold = kind === "daily" ? 100 : Number(activity.passingScore) || (kind === "chapter" ? 70 : 60);
    if (result.score < threshold) return { ...result, passed: false, xpReward: 0 };
    const profileRef = doc(db, "users", user.uid);
    const progressRef = doc(db, recordCollection, `${user.uid}_${recordId}`);
    const ownershipRef = catalog ? doc(db, kind === "mission" ? "studentArtifacts" : "studentBadges", `${user.uid}_${catalog.id}`) : null;

    return runTransaction(db, async transaction => {
        const profile = await transaction.get(profileRef);
        const progress = await transaction.get(progressRef);
        const owned = ownershipRef ? await transaction.get(ownershipRef) : null;
        const student = profile.data();
        if (!student || student.role !== "student" || student.status !== "active") throw new Error("An active student account is required.");
        const firstCompletion = !progress.exists();
        const xpReward = firstCompletion ? reward : 0;
        const totalXp = xpValue(student.xp) + xpReward;
        const level = Math.floor(totalXp / 100) + 1;
        const newlyEarned = !!ownershipRef && !owned.exists();
        const timestamp = serverTimestamp();
        const bestScore = Math.max(result.score, Number(progress.data()?.bestScore) || 0);
        let streak = Number(student.learningStreak) || 0;
        if (firstCompletion) {
            const record = { userId: user.uid, completed: true, bestScore, completedAt: timestamp, updatedAt: timestamp };
            if (kind === "mission") Object.assign(record, { chapterId, missionId, quizId: activity.id, xpEarned: reward });
            if (kind === "chapter") Object.assign(record, { chapterId, challengeId: activity.id });
            if (kind === "daily") {
                streak = student.lastStreakDate === today ? streak || 1 : student.lastStreakDate === yesterday ? streak + 1 : 1;
                Object.assign(record, { challengeId: activity.id, dateKey: today, correct: true, selectedAnswer: normalize(input.answer), xpEarned: reward });
            }
            transaction.set(progressRef, record);
            if (kind !== "chapter") {
                const update = { xp: totalXp, level, updatedAt: timestamp, lastRewardKind: kind, lastRewardId: recordId };
                if (kind === "daily") Object.assign(update, { learningStreak: streak, lastStreakDate: today });
                transaction.update(profileRef, update);
            }
        } else if (kind !== "daily") {
            transaction.update(progressRef, { bestScore, updatedAt: timestamp });
        }
        if (newlyEarned) {
            const ownership = { userId: user.uid, chapterId, earnedAt: timestamp };
            if (kind === "mission") Object.assign(ownership, { missionId, artifactId: catalog.id });
            else Object.assign(ownership, { challengeId: activity.id, badgeId: catalog.id });
            transaction.set(ownershipRef, ownership);
        }
        return { ...result, passed: true, firstCompletion, xpReward, totalXp, level, bestScore, learningStreak: streak,
            artifactResult: { artifact: kind === "mission" ? catalog : null, newlyEarned },
            badgeResult: { badge: kind === "chapter" ? catalog : null, newlyEarned } };
    });
}
