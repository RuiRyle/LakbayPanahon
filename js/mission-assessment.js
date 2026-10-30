export function requireMissionPolicy(quiz) {
    if (!Number.isInteger(quiz.questionCount) || quiz.questionCount < 1 || quiz.questionCount > 200 ||
        typeof quiz.passingScore !== 'number' || !Number.isFinite(quiz.passingScore) || quiz.passingScore < 0 || quiz.passingScore > 100 ||
        !Array.isArray(quiz.questionBlueprint) || !quiz.questionBlueprint.length ||
        quiz.questionBlueprint.some(slot => !slot || typeof slot.topic !== 'string' || !slot.topic.trim() ||
            typeof slot.difficulty !== 'string' || !slot.difficulty.trim() || !Number.isInteger(slot.count) || slot.count < 1) ||
        quiz.questionBlueprint.reduce((sum, slot) => sum + slot.count, 0) !== quiz.questionCount ||
        new Set(quiz.questionBlueprint.map(slot => JSON.stringify([slot.topic, slot.difficulty]))).size !== quiz.questionBlueprint.length) {
        throw new Error('This quiz needs a valid questionCount, passingScore and topic/difficulty questionBlueprint in Firestore.');
    }
    return quiz;
}
function shuffled(items, random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
function preferredDifficulty(topicMastery, topic, fallback, difficultyLevels) {
    const mastery = topicMastery?.[topic];
    if (!mastery || typeof mastery !== 'object') return fallback;
    if (mastery.state === 'practice-goal-reached') return difficultyLevels.includes('hard') ? 'hard' : fallback;
    if (mastery.state === 'review-needed' || mastery.state === 'practising' || Number(mastery.missed) > 0) {
        return difficultyLevels.includes('easy') ? 'easy' : fallback;
    }
    const attempted = Number(mastery.attempted) || 0;
    const correct = Number(mastery.correct) || 0;
    if (attempted >= 2 && correct / attempted >= 0.8 && difficultyLevels.includes('hard')) return 'hard';
    return fallback;
}

function isSuitableMissionQuestion(question) {
    if (String(question?.difficulty || '').trim().toLowerCase() !== 'hard') return true;
    const key = String(question?.correctAnswer || '').trim().toUpperCase();
    const keyedAnswer = String(question?.[`option${key}`] || '').trim().toLowerCase();
    const repeatedTemplateAnswers = [
        'the note supports the point it states in this case; broader conclusions need more evidence.',
        'the note answers every question about this topic by itself.',
        'the note proves the opposite was true in every other place and time.'
    ];
    return !repeatedTemplateAnswers.includes(keyedAnswer);
}

function selectTopicQuestionQuota(bank, topic, preferred, fallback, difficultyLevels, count, excludedIds, seenIds, previousIds, random) {
    const available = bank.filter(question => question.status === 'active' && question.topic === topic &&
        question.id && !excludedIds.has(question.id) && String(question.difficulty || '').trim() && isSuitableMissionQuestion(question));
    const levels = [...difficultyLevels, ...[...new Set(available.map(question => String(question.difficulty).trim().toLowerCase()))]
        .filter(level => !difficultyLevels.includes(level))];
    const target = levels.includes(preferred) ? preferred : fallback;
    const targetIndex = levels.indexOf(target);
    const availableLevels = [...new Set(available.map(question => String(question.difficulty).trim().toLowerCase()))]
        .sort((first, second) => {
            const firstIndex = levels.indexOf(first), secondIndex = levels.indexOf(second);
            return Math.abs(firstIndex - targetIndex) - Math.abs(secondIndex - targetIndex) ||
                (first === fallback ? -1 : second === fallback ? 1 : 0) || firstIndex - secondIndex;
        });
    const seen = new Set(seenIds), previous = new Set(previousIds), selected = [];
    for (const level of availableLevels) {
        const pool = available.filter(question => String(question.difficulty).trim().toLowerCase() === level);
        const candidates = [
            ...shuffled(pool.filter(question => !seen.has(question.id)), random),
            ...shuffled(pool.filter(question => seen.has(question.id) && !previous.has(question.id)), random),
            ...shuffled(pool.filter(question => previous.has(question.id)), random)
        ];
        for (const question of candidates) {
            if (selected.length >= count) break;
            selected.push(question);
        }
        if (selected.length >= count) break;
    }
    return selected.length === count ? selected : null;
}

export function selectMissionQuestions(bank, quiz, previousIds = [], random = Math.random, seenIds = previousIds, topicMastery = {}) {
    requireMissionPolicy(quiz);
    const previous = new Set(previousIds), seen = new Set(seenIds), selected = [], ids = new Set();
    const configuredLevels = Array.isArray(quiz.practicePolicy?.difficultyLevels)
        ? quiz.practicePolicy.difficultyLevels.map(level => String(level || '').trim().toLowerCase()).filter(Boolean)
        : ['easy', 'medium', 'hard'];
    for (const slot of quiz.questionBlueprint) {
        const fallbackDifficulty = String(slot.difficulty || '').trim().toLowerCase();
        const targetDifficulty = preferredDifficulty(topicMastery, slot.topic, fallbackDifficulty, configuredLevels);
        const topicQuestions = selectTopicQuestionQuota(bank, slot.topic, targetDifficulty, fallbackDifficulty,
            configuredLevels, slot.count, ids, seen, previous, random);
        if (!topicQuestions) throw new Error('Not enough active questions for this quiz topic and difficulty coverage.');
        for (const question of topicQuestions) { ids.add(question.id); selected.push(question); }
    }
    return { questions: shuffled(selected, random), repeatedQuestions: selected.filter(q => seen.has(q.id)).length };
}
export function validateQuestionSet(bank, quiz, questionIds) {
    requireMissionPolicy(quiz);
    if (!Array.isArray(questionIds) || questionIds.length !== quiz.questionCount || new Set(questionIds).size !== questionIds.length) {
        throw new Error('Reload the mission quiz to get a complete question set.');
    }
    const byId = new Map(bank.filter(q => q.status === 'active').map(q => [q.id, q]));
    const selected = questionIds.map(id => byId.get(id));
    if (selected.some(q => !q) || quiz.questionBlueprint.some(slot => selected.filter(q => q.topic === slot.topic && q.difficulty === slot.difficulty).length !== slot.count)) {
        throw new Error('This quiz changed. Reload it before trying again.');
    }
    return selected;
}

// Adaptive runs may vary question difficulty while retaining the quiz's exact
// topic quotas, unique item count, and active four-choice question contract.
export function validateAdaptiveQuestionSet(bank, quiz, questionIds) {
    requireMissionPolicy(quiz);
    if (!Array.isArray(questionIds) || questionIds.length !== quiz.questionCount || new Set(questionIds).size !== questionIds.length) {
        throw new Error('Reload the mission quiz to get a complete adaptive question set.');
    }
    const byId = new Map(bank.filter(question => question.status === 'active').map(question => [question.id, question]));
    const selected = questionIds.map(id => byId.get(id));
    if (selected.some(question => !question || typeof question.topic !== 'string' || !question.topic.trim() ||
        typeof question.difficulty !== 'string' || !question.difficulty.trim() ||
        !['A', 'B', 'C', 'D'].every(key => typeof question[`option${key}`] === 'string') ||
        !['A', 'B', 'C', 'D'].includes(String(question.correctAnswer || '').trim().toUpperCase()))) {
        throw new Error('This adaptive quiz changed. Reload it before trying again.');
    }
    const expected = new Map();
    for (const slot of quiz.questionBlueprint) expected.set(slot.topic, (expected.get(slot.topic) || 0) + slot.count);
    const actual = new Map();
    for (const question of selected) actual.set(question.topic, (actual.get(question.topic) || 0) + 1);
    if (expected.size !== actual.size || [...expected].some(([topic, count]) => actual.get(topic) !== count)) {
        throw new Error('This adaptive question set no longer matches the mission topic coverage. Reload the quiz.');
    }
    return selected;
}
export function diagnoseMissionTopics(questions, answers) {
    return [...new Set(questions.filter(q => String(answers[q.id] || '').trim().toUpperCase() !== String(q.correctAnswer || '').trim().toUpperCase())
        .map(q => q.topic?.trim()).filter(Boolean))];
}

export function selectAdaptiveQuestion(bank, {
    usedIds = [],
    seenIds = [],
    topicWeights = {},
    topicAttempts = {},
    targetDifficulty,
    difficultyLevels = [],
    random = Math.random
} = {}) {
    const used = new Set(usedIds);
    let candidates = bank.filter(question => question.status === 'active' &&
        isSuitableMissionQuestion(question) &&
        question.id && typeof question.topic === 'string' && question.topic.trim() &&
        difficultyLevels.includes(String(question.difficulty || '').trim().toLowerCase()) && !used.has(question.id) &&
        ['A', 'B', 'C', 'D'].every(key => typeof question[`option${key}`] === 'string') &&
        ['A', 'B', 'C', 'D'].includes(String(question.correctAnswer || '').trim().toUpperCase()));
    if (!candidates.length) return null;

    const seen = new Set(seenIds);
    const fresh = candidates.filter(question => !seen.has(question.id));
    if (fresh.length) candidates = fresh;

    const topics = [...new Set(candidates.map(question => question.topic.trim()))];
    const topicRank = new Map(topics.map(topic => [topic, {
        weight: Number(topicWeights[topic]) || 0,
        attempts: Number(topicAttempts[topic]) || 0
    }]));
    topics.sort((first, second) => {
        const a = topicRank.get(first), b = topicRank.get(second);
        return b.weight - a.weight || a.attempts - b.attempts || first.localeCompare(second);
    });
    const preferredTopic = topics[0];
    candidates = candidates.filter(question => question.topic.trim() === preferredTopic);

    const targetIndex = difficultyLevels.indexOf(targetDifficulty);
    const distance = question => Math.abs(difficultyLevels.indexOf(String(question.difficulty || '').trim().toLowerCase()) - targetIndex);
    const nearest = Math.min(...candidates.map(distance));
    candidates = candidates.filter(question => distance(question) === nearest);
    return candidates[Math.floor(Math.max(0, Math.min(.999999, random())) * candidates.length)];
}

export function nextAdaptiveDifficulty(currentDifficulty, answeredCorrectly, difficultyLevels) {
    const normalizedLevels = difficultyLevels.map(level => String(level || '').trim().toLowerCase());
    const currentIndex = normalizedLevels.indexOf(String(currentDifficulty || '').trim().toLowerCase());
    if (currentIndex < 0 || !difficultyLevels.length) return currentDifficulty;
    const nextIndex = answeredCorrectly
        ? Math.min(currentIndex + 1, normalizedLevels.length - 1)
        : Math.max(currentIndex - 1, 0);
    return normalizedLevels[nextIndex];
}
