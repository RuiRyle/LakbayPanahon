const { requireProgressionPolicy, progressionState } = require('./progression-policy');
﻿
const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');
const { createHash } = require('node:crypto');

const fail = (message, code = 'failed-precondition') => {
    throw new HttpsError(code, message);
};

const validId = value =>
    typeof value === 'string' &&
    /^[^/]{1,128}$/.test(value) &&
    value.trim() === value;

const validAttemptId = value =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const rows = snapshot =>
    snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

const ordered = values =>
    values.sort(
        (a, b) =>
            (Number(a.order) || 0) - (Number(b.order) || 0)
    );

const normalize = value =>
    typeof value === 'string'
        ? value.trim().toUpperCase()
        : '';

const xpValue = value =>
    Number.isSafeInteger(Number(value)) && Number(value) >= 0
        ? Number(value)
        : 0;

function grade(questions, answers) {
    if (!questions.length || questions.length > 200) {
        fail('No valid questions are available.');
    }

    if (
        !answers ||
        typeof answers !== 'object' ||
        Array.isArray(answers) ||
        Object.keys(answers).length !== questions.length
    ) {
        fail('Answer every question.', 'invalid-argument');
    }

    let correct = 0;

    for (const question of questions) {
        if (!Object.hasOwn(answers, question.id)) {
            fail('Answer every question.', 'invalid-argument');
        }

        const answer = answers[question.id];

        if (question.gameType === 'matching') {
            if (
                !Array.isArray(question.matchingPairs) ||
                !question.matchingPairs.length
            ) {
                fail('Invalid matching question.');
            }

            if (
                answer?.gameType === 'matching' &&
                question.matchingPairs.every(
                    pair =>
                        answer.matches?.[pair.left] === pair.right
                )
            ) {
                correct++;
            }
        } else if (question.gameType === 'tradeSimulation') {
            const required = Number(question.requiredQuantity);

            if (
                !Number.isInteger(required) ||
                required < 1 ||
                required > Number(question.startingQuantity)
            ) {
                fail('Invalid trade question.');
            }

            if (
                answer?.gameType === 'tradeSimulation' &&
                answer.quantity === required
            ) {
                correct++;
            }
        } else {
            const expected = normalize(question.correctAnswer);

            if (!['A', 'B', 'C', 'D'].includes(expected)) {
                fail('Invalid answer key.');
            }

            if (
                !['A', 'B', 'C', 'D'].includes(normalize(answer))
            ) {
                fail('Invalid answer choice.', 'invalid-argument');
            }

            if (normalize(answer) === expected) {
                correct++;
            }
        }
    }

    return {
        score: Math.round(correct / questions.length * 100),
        correctAnswers: correct
    };
}

function diagnoseWeakTopics(questions, answers) {
    const topicsForReview = new Set();

    for (const question of questions) {
        let incorrect = false;
        const answer = answers?.[question.id];

        if (question.gameType === 'matching') {
            incorrect =
                !Array.isArray(question.matchingPairs) ||
                answer?.gameType !== 'matching' ||
                !question.matchingPairs.every(
                    pair =>
                        answer.matches?.[pair.left] === pair.right
                );
        } else if (question.gameType === 'tradeSimulation') {
            incorrect =
                answer?.gameType !== 'tradeSimulation' ||
                answer.quantity !==
                    Number(question.requiredQuantity);
        } else {
            incorrect =
                normalize(answer) !==
                normalize(question.correctAnswer);
        }

        const topic =
            typeof question.topic === 'string'
                ? question.topic.trim()
                : '';

        if (incorrect && topic) {
            topicsForReview.add(topic);
        }
    }

    return [...topicsForReview];
}

// Bind each attempt ID to the exact submitted answers.
// This also supports structured matching and trade answers.
function answerFingerprint(questions, answers) {
    const canonical = questions
        .map(question => [
            question.id,
            answers[question.id]
        ])
        .sort((a, b) => a[0].localeCompare(b[0]));

    const stable = value => {
        if (Array.isArray(value)) {
            return value.map(stable);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.keys(value)
                    .sort()
                    .map(key => [
                        key,
                        stable(value[key])
                    ])
            );
        }

        return value;
    };

    return createHash('sha256')
        .update(JSON.stringify(stable(canonical)))
        .digest('hex');
}

function manilaDate(now = new Date()) {
    return new Date(
        now.getTime() + 8 * 3600000
    ).toISOString().slice(0, 10);
}

module.exports = {
    createStudentRewards: (db) => require('./assessment-callables').assessmentHandlers(db,()=>FieldValue.serverTimestamp()).submit,
    grade,
    diagnoseWeakTopics,
    manilaDate
};
