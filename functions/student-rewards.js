const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');

const fail = (message, code = 'failed-precondition') => { throw new HttpsError(code, message); };
const validId = value => typeof value === 'string' && /^[^/]{1,128}$/.test(value) && value.trim() === value;
const rows = snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
const ordered = values => values.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
const normalize = value => typeof value === 'string' ? value.trim().toUpperCase() : '';
const xpValue = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;

function grade(questions, answers) {
    if (!questions.length || questions.length > 200) fail('No valid questions are available.');
    if (!answers || typeof answers !== 'object' || Array.isArray(answers) ||
        Object.keys(answers).length !== questions.length) fail('Answer every question.', 'invalid-argument');
    let correct = 0;
    for (const question of questions) {
        if (!Object.hasOwn(answers, question.id)) fail('Answer every question.', 'invalid-argument');
        const answer = answers[question.id];
        if (question.gameType === 'matching') {
            if (!Array.isArray(question.matchingPairs) || !question.matchingPairs.length) fail('Invalid matching question.');
            if (answer?.gameType === 'matching' && question.matchingPairs.every(pair =>
                answer.matches?.[pair.left] === pair.right)) correct++;
        } else if (question.gameType === 'tradeSimulation') {
            const required = Number(question.requiredQuantity);
            if (!Number.isInteger(required) || required < 1 || required > Number(question.startingQuantity)) fail('Invalid trade question.');
            if (answer?.gameType === 'tradeSimulation' && answer.quantity === required) correct++;
        } else {
            const expected = normalize(question.correctAnswer);
            if (!['A', 'B', 'C', 'D'].includes(expected)) fail('Invalid answer key.');
            if (!['A', 'B', 'C', 'D'].includes(normalize(answer))) fail('Invalid answer choice.', 'invalid-argument');
            if (normalize(answer) === expected) correct++;
        }
    }
    return { score: Math.round(correct / questions.length * 100), correctAnswers: correct };
}

function manilaDate(now = new Date()) {
    return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}

function createStudentRewards(db, clock = () => new Date()) {
    const ref = (name, id) => db.collection(name).doc(id);
    const find = async (name, field, value) => rows(await db.collection(name).where(field, '==', value).get());

    return async request => {
        const uid = request.auth?.uid;
        if (!uid) fail('Please sign in.', 'unauthenticated');
        const input = request.data || {};
        const kind = input.kind;
        if (!['mission', 'chapter', 'daily'].includes(kind)) fail('Invalid activity.', 'invalid-argument');
        const profileRef = ref('users', uid);
        const profile = await profileRef.get();
        if (!profile.exists || profile.data().role !== 'student' || profile.data().status !== 'active') {
            fail('An active student account is required.', 'permission-denied');
        }

        let chapterId = input.chapterId;
        let missionId = input.missionId;
        let activity;
        let mission;
        let questions;
        let reward = 0;
        let catalog = null;
        let completionRef;
        let ownershipRef = null;
        const today = manilaDate(clock());
        const yesterday = manilaDate(new Date(clock().getTime() - 86400000));

        if (kind === 'daily') {
            const challenges = ordered(rows(await db.collection('dailyChallenges').get()).filter(item => item.status === 'active'));
            const day = Math.floor((Date.parse(today) - Date.UTC(Number(today.slice(0, 4)), 0, 1)) / 86400000);
            activity = challenges[day % challenges.length];
            if (!activity || input.challengeId !== activity.id) fail('Reload today’s daily challenge.');
            questions = [activity];
            reward = xpValue(activity.xpReward);
            completionRef = ref('studentDailyChallenges', `${uid}_${today}`);
        } else {
            if (!validId(chapterId) || (kind === 'mission' && !validId(missionId))) fail('Invalid content IDs.', 'invalid-argument');
            const chapters = rows(await db.collection('chapters').get());
            const chapter = chapters.find(item => item.id === chapterId);
            if (!chapter || chapter.status !== 'active' || chapter.contentReady === false) fail('Chapter unavailable.');
            const era = ordered(chapters.filter(item => item.eraId === chapter.eraId && item.status === 'active' && item.contentReady !== false));
            const progress = await find('studentChapterProgress', 'userId', uid);
            const completed = new Set(progress.filter(item => item.completed === true).map(item => item.chapterId));
            if (!era.slice(0, era.findIndex(item => item.id === chapterId)).every(item => completed.has(item.id))) {
                fail('Complete the previous chapters first.', 'permission-denied');
            }
            const missions = ordered((await find('missions', 'chapterId', chapterId)).filter(item => item.status === 'active'));
            const missionProgress = await find('studentProgress', 'userId', uid);
            const completedMissions = new Set(missionProgress.filter(item => item.completed === true).map(item => item.missionId));
            if (kind === 'mission') {
                const index = missions.findIndex(item => item.id === missionId);
                if (index < 0 || !missions.slice(0, index).every(item => completedMissions.has(item.id))) {
                    fail('Mission unavailable or locked.', 'permission-denied');
                }
                mission = missions[index];
                activity = (await find('quizzes', 'missionId', missionId)).find(item => item.status === 'active' && item.id === input.quizId);
                if (!activity) fail('Quiz unavailable.');
                questions = (await find('questions', 'quizId', activity.id)).filter(item => item.status === 'active');
                reward = xpValue(mission.xpReward);
                catalog = (await find('artifacts', 'missionId', missionId)).find(item => item.status === 'active') || null;
                completionRef = ref('studentProgress', `${uid}_${missionId}`);
                if (catalog) ownershipRef = ref('studentArtifacts', `${uid}_${catalog.id}`);
            } else {
                if (!missions.length || !missions.every(item => completedMissions.has(item.id))) fail('Complete all chapter missions.', 'permission-denied');
                activity = (await find('chapterChallenges', 'chapterId', chapterId)).find(item => item.status === 'active' && item.id === input.challengeId);
                if (!activity) fail('Chapter challenge unavailable.');
                questions = (await find('chapterChallengeQuestions', 'challengeId', activity.id)).filter(item => item.status === 'active');
                catalog = (await find('badges', 'chapterId', chapterId)).find(item => item.status === 'active') || null;
                completionRef = ref('studentChapterProgress', `${uid}_${chapterId}`);
                if (catalog) ownershipRef = ref('studentBadges', `${uid}_${catalog.id}`);
            }
        }

        const result = grade(questions, kind === 'daily' ? { [activity.id]: input.answer } : input.answers);
        const threshold = kind === 'daily' ? 100 : Number(activity.passingScore) || (kind === 'chapter' ? 70 : 60);
        if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) fail('Invalid passing score.');
        const passed = result.score >= threshold;
        if (!passed) return { ...result, passed: false, xpReward: 0 };

        return db.runTransaction(async tx => {
            // Recheck the profile inside the transaction; retries cannot duplicate rewards.
            const studentSnapshot = await tx.get(profileRef);
            const completion = await tx.get(completionRef);
            const owned = ownershipRef ? await tx.get(ownershipRef) : null;
            const student = studentSnapshot.data();
            if (!student || student.role !== 'student' || student.status !== 'active') fail('Student account unavailable.', 'permission-denied');
            const firstCompletion = !completion.exists || completion.data().completed !== true;
            const xpReward = firstCompletion ? reward : 0;
            const totalXp = xpValue(student.xp) + xpReward;
            const level = Math.floor(totalXp / 100) + 1;
            const newlyEarned = !!ownershipRef && !owned.exists;
            const timestamp = FieldValue.serverTimestamp();
            const record = { userId: uid, completed: true, bestScore: Math.max(result.score, Number(completion.data()?.bestScore) || 0), updatedAt: timestamp };
            if (firstCompletion) record.completedAt = timestamp;
            if (kind === 'mission') Object.assign(record, { chapterId, missionId, quizId: activity.id });
            if (kind === 'chapter') Object.assign(record, { chapterId, challengeId: activity.id });
            let streak = Number(student.learningStreak) || 0;
            if (kind === 'daily') {
                if (firstCompletion) streak = student.lastStreakDate === today ? streak || 1 : student.lastStreakDate === yesterday ? streak + 1 : 1;
                Object.assign(record, { challengeId: activity.id, dateKey: today, correct: true, selectedAnswer: normalize(input.answer), xpEarned: firstCompletion ? reward : completion.data().xpEarned });
            }
            tx.set(completionRef, record, { merge: true });
            if (firstCompletion && kind !== 'chapter') {
                const update = { xp: totalXp, level, updatedAt: timestamp };
                if (kind === 'daily') Object.assign(update, { learningStreak: streak, lastStreakDate: today });
                tx.update(profileRef, update);
            }
            if (newlyEarned) {
                const ownership = { userId: uid, chapterId, earnedAt: timestamp };
                if (kind === 'mission') Object.assign(ownership, { missionId, artifactId: catalog.id });
                else Object.assign(ownership, { challengeId: activity.id, badgeId: catalog.id });
                tx.set(ownershipRef, ownership);
            }
            // Return only the catalog fields used by reward cards (no Firestore timestamps).
            const rewardItem = catalog ? Object.fromEntries(['id', 'name', 'title', 'description', 'icon', 'rarity'].filter(key => typeof catalog[key] === 'string').map(key => [key, catalog[key]])) : null;
            return { ...result, passed: true, firstCompletion, xpReward, totalXp, level, bestScore: record.bestScore,
                learningStreak: streak, artifactResult: { artifact: kind === 'mission' ? rewardItem : null, newlyEarned },
                badgeResult: { badge: kind === 'chapter' ? rewardItem : null, newlyEarned } };
        });
    };
}

module.exports = { createStudentRewards, grade, manilaDate };
