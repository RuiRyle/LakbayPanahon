const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const snapshotPath = path.join(root, 'docs', 'validation', 'learning-content-snapshot.json');
const outputPath = path.join(dataDir, 'other-missions-adaptive-hard-replacement-drafts.json');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function firstSentence(value) {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    const match = normalized.match(/^(.+?[.!?])(?:\s|$)/);
    return (match ? match[1] : normalized).trim();
}

function addSource(sources, question) {
    if (!question?.quizId || !question?.topic || !question?.learningPoint || !question?.historicalClue) return;
    if (!question.optionA || !question.optionB || !question.optionC || !question.optionD || !question.correctAnswer) return;
    const key = `${question.quizId}|${question.topic}`;
    const existing = sources.get(key);
    if (!existing || Number(question.order) < Number(existing.order)) sources.set(key, question);
}

const snapshot = readJson(snapshotPath);
const sources = new Map();
for (const question of snapshot.collections?.questions || []) {
    if (question.status === 'active') addSource(sources, question);
}

const sourceFiles = fs.readdirSync(dataDir)
    .filter(name => name.endsWith('.json') &&
        !name.includes('adaptive-quiz-question-drafts') &&
        !name.includes('adaptive-hard-replacement-drafts'))
    .map(name => path.join(dataDir, name))
    .sort((first, second) => fs.statSync(first).mtimeMs - fs.statSync(second).mtimeMs);

for (const filePath of sourceFiles) {
    let migration;
    try {
        migration = readJson(filePath);
    } catch {
        continue;
    }
    for (const write of migration.writes || []) {
        if (write.path?.startsWith('questions/')) addSource(sources, write.fields);
    }
}

const quizzes = new Map();
for (const question of sources.values()) {
    if (question.quizId === 'quiz-1') continue;
    const group = quizzes.get(question.quizId) || [];
    group.push(question);
    quizzes.set(question.quizId, group);
}

const writes = [];
let quizIndex = 0;
for (const [quizId, unsortedTopics] of [...quizzes.entries()].sort(([first], [second]) => first.localeCompare(second))) {
    const topics = unsortedTopics.sort((first, second) => Number(first.order) - Number(second.order) ||
        String(first.topic).localeCompare(String(second.topic)));
    if (topics.length !== 5) continue;

    for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
        const source = topics[topicIndex];
        const sibling = topics[(topicIndex + 1) % topics.length];
        const topicLabel = String(source.topicLabel || source.topic).trim();
        const siblingLabel = String(sibling.topicLabel || sibling.topic).trim();
        const topicClue = firstSentence(source.historicalClue);
        const siblingClue = firstSentence(sibling.historicalClue);

        const options = [
            {
                correct: true,
                text: `The first note supports its point about ${topicLabel}; the second supports its point about ${siblingLabel}. Neither proves one rule for every community.`,
                feedback: `Each note supports a focused point about its topic. The notes do not establish one pattern for all communities.`
            },
            {
                correct: false,
                text: `The first note proves that every community followed the same practice described for ${topicLabel}.`,
                feedback: `The first note has a limited scope; it does not show that every community or period followed the same pattern.`
            },
            {
                correct: false,
                text: `The second note about ${siblingLabel} disproves the first; both points cannot describe community life.`,
                feedback: `A point about ${siblingLabel} does not cancel a separate point about ${topicLabel}.`
            },
            {
                correct: false,
                text: `The note about ${topicLabel} caused the point about ${siblingLabel} everywhere, though neither note states that link.`,
                feedback: `The notes describe separate findings. They do not state that one caused the other.`
            }
        ];

        const correctIndex = (quizIndex + topicIndex) % 4;
        const arranged = Array(4);
        const distractors = options.filter(option => !option.correct);
        let distractorIndex = 0;
        for (let index = 0; index < arranged.length; index++) {
            arranged[index] = index === correctIndex ? options[0] : distractors[distractorIndex++];
        }
        const letters = ['A', 'B', 'C', 'D'];
        const fields = {
            quizId,
            topic: source.topic,
            topicLabel,
            difficulty: 'hard',
            status: 'draft',
            question: `A class compares two notes: ${topicLabel}: "${topicClue}" ${siblingLabel}: "${siblingClue}" Which conclusion fits both?`,
            correctAnswer: letters[correctIndex],
            explanation: `The note about ${topicLabel} and the note about ${siblingLabel} support separate, focused points. They do not establish a universal rule or a causal link.`,
            learningPoint: String(source.learningPoint).trim(),
            answerExplanations: {}
        };
        for (let index = 0; index < letters.length; index++) {
            const letter = letters[index];
            fields[`option${letter}`] = arranged[index].text;
            fields.answerExplanations[letter] = arranged[index].feedback;
        }

        const safeTopic = String(source.topic).replace(/[^a-zA-Z0-9-]/g, '-');
        writes.push({
            path: `questions/${quizId}-question-${safeTopic}-adaptive-hard`,
            create: false,
            fields
        });
    }
    quizIndex++;
}

const payload = {
    projectId: 'lakbaypanahon-1797e',
    generatedAt: new Date().toISOString().slice(0, 10),
    reviewStatus: 'Draft replacements generated from the existing topic evidence and learning points; not educator-reviewed or published',
    sourceSnapshot: 'docs/validation/learning-content-snapshot.json (2026-10-27) plus source question migrations in data/',
    excludedQuiz: 'quiz-1; its five hand-authored hard items were not part of the repeated-template finding',
    draftQuestionCount: writes.length,
    writes
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote ${writes.length} draft hard replacements to ${path.relative(root, outputPath)}\n`);
