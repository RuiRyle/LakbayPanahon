import {evidenceDecisionCorrect} from "./evidence-decision.js";
import { learningDateKey, selectDailyChallenge } from "./daily-policy.js";
import { requireProgressionPolicy, progressionState } from "./progression-policy.js";
import { validateAdaptiveQuestionSet, diagnoseMissionTopics } from "./mission-assessment.js";
import { requirePassingScore } from "./activity-policy.js";
import { auth, db } from "./firebase-config.js";
import { requireLearningAccess } from "./learning-access.js";
import { collection, doc, getDocs, query, where, runTransaction, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Spark-compatible rewards. Rules protect ownership, catalog amounts and
// duplicate awards; full quiz grading still runs in the browser.
const rows = snapshot => snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
const normalize = value => typeof value === "string" ? value.trim().toUpperCase() : "";
const xpValue = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const find = async (name, field, value) => rows(await getDocs(query(collection(db, name), where(field, "==", value))));
const sameSavedTime = (a, b) => {
    const first = a?.toMillis?.(), second = b?.toMillis?.();
    return Number.isFinite(first) && first === second;
};

function grade(questions, answers) {
    if (!questions.length || !answers || Object.keys(answers).length !== questions.length) {
        throw new Error("Answer every question before submitting.");
    }
    let correctAnswers = 0;
    for (const question of questions) {
        if (!Object.hasOwn(answers, question.id)) throw new Error("Answer every question before submitting.");
        const answer = answers[question.id];
        if (question.evidenceTask) {
            if(evidenceDecisionCorrect(question,answer))correctAnswers++;
        } else if (question.gameType === "matching") {
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
    const now = new Date();
    const today = learningDateKey(now);
    const yesterday = learningDateKey(new Date(now.getTime() - 86400000));
    let activity, questions, catalog = null, reward = 0, recordId, recordCollection;
    let adaptiveFollowup = null;
    if (kind === "daily") {
        const challenges = rows(await getDocs(query(collection(db, "dailyChallenges"), where("status", "==", "active"))));
        activity = selectDailyChallenge(challenges, now);
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
            questions = validateAdaptiveQuestionSet(questions, activity, input.questionIds);
            const requestedAdaptive = input.adaptiveFollowup;
            if (requestedAdaptive !== undefined) {
                const ids = requestedAdaptive?.questionIds;
                const answers = requestedAdaptive?.answers;
                if (!Array.isArray(ids) || ids.length < 1 || ids.length > 3 || new Set(ids).size !== ids.length ||
                    ids.some(id => typeof id !== "string" || !id) || !answers || typeof answers !== "object" || Array.isArray(answers) ||
                    Object.keys(answers).length !== ids.length || Object.keys(answers).some(id => !ids.includes(id)) ||
                    ids.some(id => !["A", "B", "C", "D"].includes(normalize(answers[id])))) {
                    throw new Error("The personalized check is incomplete. Please retry the mission quiz.");
                }
                const bank = (await find("practiceQuestions", "missionId", missionId)).filter(item => item.status === "active");
                const adaptiveQuestions = ids.map(id => bank.find(item => item.id === id));
                if (adaptiveQuestions.some(question => !question || !question.topic ||
                    !["A", "B", "C", "D"].every(key => typeof question[`option${key}`] === "string") ||
                    !["A", "B", "C", "D"].includes(normalize(question.correctAnswer)))) {
                    throw new Error("A personalized check question changed. Please retry the mission quiz.");
                }
                const graded = grade(adaptiveQuestions, answers);
                adaptiveFollowup = {
                    questionIds: ids,
                    answers: Object.fromEntries(ids.map(id => [id, normalize(answers[id])])),
                    correctAnswers: graded.correctAnswers,
                    totalQuestions: adaptiveQuestions.length,
                    score: graded.score,
                    items: adaptiveQuestions.map(question => {
                        const selectedAnswer = normalize(answers[question.id]);
                        return {
                            questionId: question.id,
                            topic: question.topic.trim(),
                            difficulty: String(question.difficulty || "").trim().toLowerCase(),
                            selectedAnswer,
                            correctAnswer: normalize(question.correctAnswer),
                            isCorrect: selectedAnswer === normalize(question.correctAnswer)
                        };
                    })
                };
            }
            catalog = (await find("artifacts", "missionId", missionId)).find(item => item.status === "active") || null;
            reward = xpValue(mission.xpReward);
            recordId = missionId;
            recordCollection = "studentProgress";
        } else {
            const missions = (await find("missions", "chapterId", chapterId)).filter(item => item.status === "active");
            const completed = new Set((await find("studentProgress", "userId", user.uid))
                .filter(item => item.completed === true).map(item => item.missionId));
            if (!missions.length || (globalThis.__lakbayExplorationPreview!==true&&!missions.every(item => completed.has(item.id)))) throw new Error("Complete all chapter missions first.");
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
    const threshold = kind === "daily" ? 100 : requirePassingScore(activity);
    const passed = result.score >= threshold;
    const coreTopicsForReview = kind === "mission" ? diagnoseMissionTopics(questions, input.answers) : [];
    const adaptiveTopicsForReview = adaptiveFollowup?.items.filter(item => !item.isCorrect).map(item => item.topic) || [];
    const topicsForReview = [...new Set([...adaptiveTopicsForReview, ...coreTopicsForReview])]
        .slice(0, kind === "mission" ? questions.length : 0);
    if (globalThis.__lakbayExplorationPreview===true && kind!=='daily') {
        return {...result,passed,topicsForReview,preview:true,firstCompletion:false,xpReward:0,
            adaptiveFollowup, artifactResult:{artifact:null,newlyEarned:false},badgeResult:{badge:null,newlyEarned:false}};
    }
    if (!passed && kind !== "mission") return { ...result, passed: false, xpReward: 0 };
    if (kind === "mission" && (typeof input.attemptId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.attemptId))) {
        throw new Error("Start the mission quiz before submitting.");
    }
    const attemptRef = kind === "mission" ? doc(db, "studentQuizAttempts", user.uid + "_" + input.attemptId) : null;
    const profileRef = doc(db, "users", user.uid);
    const progressRef = doc(db, recordCollection, `${user.uid}_${recordId}`);
    const ownershipRef = catalog ? doc(db, kind === "mission" ? "studentArtifacts" : "studentBadges", `${user.uid}_${catalog.id}`) : null;
    const requireCurrentStudent = student => {
        if (auth.currentUser?.uid !== user.uid) throw new Error("Your account changed. Open the activity again.");
        if (!student || student.role !== "student" || student.status !== "active") throw new Error("An active student account is required.");
    };
    if (auth.currentUser?.uid !== user.uid) throw new Error("Your account changed. Open the activity again.");

    return runTransaction(db, async transaction => {
        const profile = await transaction.get(profileRef);
        const student = profile.data();
        requireCurrentStudent(student);
        const policySnapshot = await transaction.get(doc(db, "learningSettings", "progression"));
        const progressionPolicy = requireProgressionPolicy(policySnapshot.exists() ? policySnapshot.data() : null);
        const existingAttempt = attemptRef ? await transaction.get(attemptRef) : null;
        const progress = await transaction.get(progressRef);
        const owned = ownershipRef ? await transaction.get(ownershipRef) : null;
        requireCurrentStudent(student);
        if (existingAttempt?.exists()) {
            const previous = existingAttempt.data();
            if (previous.userId !== user.uid || previous.attemptId !== input.attemptId ||
                previous.quizId !== activity.id || previous.chapterId !== chapterId || previous.missionId !== missionId ||
                JSON.stringify(previous.questionIds) !== JSON.stringify(input.questionIds) ||
                Object.keys(input.answers).some(id => previous.answers?.[id] !== input.answers[id]) ||
                JSON.stringify(previous.response?.adaptiveFollowup?.questionIds || []) !== JSON.stringify(adaptiveFollowup?.questionIds || []) ||
                (adaptiveFollowup && adaptiveFollowup.questionIds.some(id =>
                    normalize(previous.response?.adaptiveFollowup?.answers?.[id]) !== adaptiveFollowup.answers[id]))) {
                throw new Error("This attempt was already submitted with different answers. Start a new retry.");
            }
            const saved = previous.response;
            const completion = progress.data();
            const completed = progress.exists() && completion.userId === user.uid && completion.completed === true &&
                completion.chapterId === chapterId && completion.missionId === missionId;
            // A saved response is a replay snapshot, never an authority to claim a
            // passing grade, reward, ownership, or a different result screen.
            if (!saved || previous.score !== result.score || previous.correctAnswers !== result.correctAnswers ||
                previous.totalQuestions !== questions.length || previous.passed !== passed ||
                saved.score !== result.score || saved.correctAnswers !== result.correctAnswers || saved.passed !== passed ||
                JSON.stringify(previous.topicsForReview) !== JSON.stringify(topicsForReview) ||
                JSON.stringify(saved.topicsForReview) !== JSON.stringify(topicsForReview) ||
                typeof saved.firstCompletion !== "boolean" || !Number.isSafeInteger(saved.xpReward) ||
                saved.xpReward !== (saved.firstCompletion ? reward : 0) ||
                (passed && !completed) ||
                (saved.firstCompletion && (!passed || !completed || completion.quizId !== activity.id ||
                    completion.xpEarned !== reward || !sameSavedTime(completion.completedAt, previous.completedAt)))) {
                throw new Error("This saved attempt could not be verified. Start a new quiz retry. Your saved progress is unchanged.");
            }
            const newlyEarned = !!(owned?.exists() && owned.data().userId === user.uid &&
                sameSavedTime(owned.data().earnedAt, previous.completedAt));
            return {...result, progressionPolicy, passed, topicsForReview,
                firstCompletion:saved.firstCompletion, xpReward:saved.xpReward,
                totalXp:xpValue(student.xp), level:progressionState(xpValue(student.xp), progressionPolicy).level,
                bestScore:Math.max(xpValue(completion?.bestScore), result.score), learningStreak:xpValue(student.learningStreak),
                artifactResult:{artifact:catalog,newlyEarned}, badgeResult:{badge:null,newlyEarned:false},
                ...(adaptiveFollowup ? {adaptiveFollowup} : {})};
        }
        const firstCompletion = passed && !progress.exists();
        const xpReward = firstCompletion ? reward : 0;
        const totalXp = xpValue(student.xp) + xpReward;
        const level = progressionState(totalXp, progressionPolicy).level;
        const newlyEarned = passed && !!ownershipRef && !owned.exists();
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
        } else if (passed && kind !== "daily") {
            transaction.update(progressRef, { bestScore, updatedAt: timestamp });
        }
        if (newlyEarned) {
            const ownership = { userId: user.uid, chapterId, earnedAt: timestamp };
            if (kind === "mission") Object.assign(ownership, { missionId, artifactId: catalog.id });
            else Object.assign(ownership, { challengeId: activity.id, badgeId: catalog.id });
            transaction.set(ownershipRef, ownership);
        }
        const response = { ...result, progressionPolicy, passed, topicsForReview, firstCompletion, xpReward, totalXp, level, bestScore, learningStreak: streak,
            artifactResult: { artifact: kind === "mission" ? catalog : null, newlyEarned },
            badgeResult: { badge: kind === "chapter" ? catalog : null, newlyEarned } };
        if (adaptiveFollowup) response.adaptiveFollowup = adaptiveFollowup;
        if (attemptRef) transaction.set(attemptRef, {userId: user.uid, chapterId, missionId, quizId: activity.id,
            attemptId: input.attemptId, questionIds: input.questionIds, answers: input.answers,
            score: result.score, correctAnswers: result.correctAnswers, totalQuestions: questions.length,
            passed, topicsForReview, completedAt: timestamp, response});
        return response;
    });
}
