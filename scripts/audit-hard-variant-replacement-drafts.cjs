const fs = require('node:fs');

const filePath = 'data/other-missions-adaptive-hard-replacement-drafts.json';
const draft = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const rows = Array.isArray(draft.writes) ? draft.writes : [];
const letters = ['A', 'B', 'C', 'D'];
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const prompts = new Set();
const groups = new Map();
const answerPositions = Object.fromEntries(letters.map(letter => [letter, 0]));
const errors = [];
let duplicatePrompts = 0;
let oldTemplateKeys = 0;
let oldTemplateDistractors = 0;
let keyLengthRatioOver170Percent = 0;
let maxKeyLengthRatio = 0;
let totalPromptWords = 0;
let maxPromptWords = 0;

for (const [index, write] of rows.entries()) {
    const question = write.fields || {};
    const label = write.path || `row ${index + 1}`;
    const options = letters.map(letter => String(question[`option${letter}`] || '').trim());
    const key = String(question.correctAnswer || '').trim().toUpperCase();
    const prompt = String(question.question || '').trim();
    const answer = options[letters.indexOf(key)] || '';

    if (!question.quizId || !question.topic || question.difficulty !== 'hard' ||
        question.status !== 'draft' || write.create !== false || !prompt || options.some(option => !option)) {
        errors.push(`${label}: missing or invalid draft fields`);
    }
    if (!letters.includes(key)) errors.push(`${label}: invalid answer key`);
    if (new Set(options.map(normalize)).size !== 4) errors.push(`${label}: duplicate choices`);
    if (!question.answerExplanations || letters.some(letter => !String(question.answerExplanations[letter] || '').trim())) {
        errors.push(`${label}: incomplete answer explanations`);
    }

    const normalizedPrompt = normalize(prompt);
    if (prompts.has(normalizedPrompt)) duplicatePrompts++;
    prompts.add(normalizedPrompt);

    if (answer.toLowerCase() === 'the note supports the point it states in this case; broader conclusions need more evidence.') {
        oldTemplateKeys++;
    }
    if (options.some(option => /answers every question about this topic by itself|proves the opposite was true in every other place and time/i.test(option))) {
        oldTemplateDistractors++;
    }

    const keyIndex = letters.indexOf(key);
    if (keyIndex >= 0) answerPositions[key]++;
    const distractorLengths = options.filter((_, optionIndex) => optionIndex !== keyIndex).map(option => option.length);
    const ratio = answer.length / Math.max(1, ...distractorLengths);
    maxKeyLengthRatio = Math.max(maxKeyLengthRatio, ratio);
    if (ratio > 1.7) keyLengthRatioOver170Percent++;

    const wordCount = prompt ? prompt.split(/\s+/).length : 0;
    totalPromptWords += wordCount;
    maxPromptWords = Math.max(maxPromptWords, wordCount);
    const quizTopics = groups.get(question.quizId) || new Set();
    quizTopics.add(question.topic);
    groups.set(question.quizId, quizTopics);
}

if (rows.length !== draft.draftQuestionCount) errors.push('draftQuestionCount does not match writes length');
if (rows.length !== 325) errors.push(`expected 325 replacement drafts, found ${rows.length}`);
if (groups.size !== 65 || [...groups.values()].some(topics => topics.size !== 5)) {
    errors.push('expected five distinct topic replacements for each of 65 quizzes');
}
if (duplicatePrompts) errors.push(`${duplicatePrompts} duplicate prompts found`);
if (oldTemplateKeys || oldTemplateDistractors) errors.push('old generic hard-item template remains');
if (keyLengthRatioOver170Percent) errors.push(`${keyLengthRatioOver170Percent} keyed answers exceed 1.7 times the longest distractor`);

const result = {
    items: rows.length,
    quizCount: groups.size,
    topicCount: [...groups.values()].reduce((sum, topics) => sum + topics.size, 0),
    missingOrInvalidFields: errors.filter(error => /missing or invalid/.test(error)).length,
    invalidKeys: errors.filter(error => /invalid answer key/.test(error)).length,
    duplicateChoices: errors.filter(error => /duplicate choices/.test(error)).length,
    incompleteFeedback: errors.filter(error => /incomplete answer/.test(error)).length,
    duplicatePrompts,
    oldGenericKeys: oldTemplateKeys,
    oldGenericDistractors: oldTemplateDistractors,
    keyPositions: answerPositions,
    keyedAnswerLengthRatioOver170Percent: keyLengthRatioOver170Percent,
    maxKeyToDistractorLengthRatio: Number(maxKeyLengthRatio.toFixed(2)),
    averagePromptWords: Number((totalPromptWords / Math.max(1, rows.length)).toFixed(1)),
    maxPromptWords,
    reviewStatus: draft.reviewStatus
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) {
    process.stderr.write(`${errors.map(error => `- ${error}`).join('\n')}\n`);
    process.exitCode = 1;
}
