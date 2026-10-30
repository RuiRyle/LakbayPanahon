// Scoped editorial publication. --check-local never loads credentials or contacts Firebase.
const fs = require('node:fs');
const path = require('node:path');
const {isDeepStrictEqual: equal} = require('node:util');
const root = path.join(__dirname, '..');
const plan = require('../data/chapter1-mission1-learning-polish-migration.json');
const scenePaths = Array.from({length: 6}, (_, i) => `storyScenes/mission1-scene${i + 1}`);
const questionPaths = Array.from({length: 5}, (_, i) =>
    ['', '-retry'].map(suffix => `questions/quiz-1-question-${i + 1}${suffix}`)).flat();
const questionOptionRepairs = new Map([
    ['questions/quiz-1-question-1-retry', 'optionA'],
    ['questions/quiz-1-question-2-retry', 'optionB'],
    ['questions/quiz-1-question-3-retry', 'optionB'],
    ['questions/quiz-1-question-5-retry', 'optionC']
]);

function validatePlan(candidate) {
    if (candidate.projectId !== 'lakbaypanahon-1797e') throw Error('Unexpected Firebase project.');
    const paths = [...scenePaths, ...questionPaths];
    if (!Array.isArray(candidate.writes) || candidate.writes.length !== paths.length ||
        new Set(candidate.writes.map(write => write.path)).size !== paths.length) {
        throw Error('Expected exactly six scenes and ten main/retry question updates.');
    }
    for (const write of candidate.writes) {
        if (!paths.includes(write.path) || write.create !== false) throw Error('Unexpected document or create: ' + write.path);
        const scene = scenePaths.includes(write.path);
        const allowed = scene ? ['content', 'learningHelp'] : ['answerExplanations', 'learningPoint'];
        if (write.path === scenePaths[0]) allowed.push('decisionSituation', 'decisionQuestion', 'decisionChoices', 'decisionCorrectAnswer', 'decisionExplanation');
        if (questionOptionRepairs.has(write.path)) allowed.push(questionOptionRepairs.get(write.path));
        if (!write.fields || !Object.keys(write.fields).length || Object.keys(write.fields).some(key => !allowed.includes(key))) {
            throw Error('Unexpected field update: ' + write.path);
        }
        if (!write.expected || write.expected.status !== 'active' ||
            (scene ? write.expected.missionId !== 'mission-1' : write.expected.quizId !== 'quiz-1')) {
            throw Error('Missing identity guard: ' + write.path);
        }
        if (Object.keys(write.fields).some(key => !Object.hasOwn(write.expected, key))) throw Error('Missing original field guard: ' + write.path);
        const merged = {...write.expected, ...write.fields};
        if (scene) {
            const help = merged.learningHelp;
            if (!merged.content?.trim() || !help?.explanation?.trim() || !help.example?.trim() || !help.guidingQuestion?.trim() ||
                !help.vocabulary?.length || help.vocabulary.some(word => !word.term?.trim() || !word.definition?.trim())) {
                throw Error('Incomplete scene teaching: ' + write.path);
            }
            if (!Array.isArray(merged.decisionChoices) || merged.decisionChoices.length < 2 ||
                new Set(merged.decisionChoices).size !== merged.decisionChoices.length ||
                !merged.decisionChoices.includes(merged.decisionCorrectAnswer)) throw Error('Invalid scene choices: ' + write.path);
        } else {
            if (!['A', 'B', 'C', 'D'].includes(merged.correctAnswer) || !merged.topic || !merged.difficulty ||
                !merged.question?.trim() || !merged.learningPoint?.trim()) throw Error('Incomplete quiz guard or feedback: ' + write.path);
            const options = ['A', 'B', 'C', 'D'].map(letter => merged['option' + letter]);
            if (options.some(option => typeof option !== 'string' || !option.trim()) || new Set(options).size !== 4 ||
                ['A', 'B', 'C', 'D'].some(letter => !merged.answerExplanations?.[letter]?.trim())) {
                throw Error('Incomplete answer feedback: ' + write.path);
            }
        }
    }
}

function compareDocument(write, current) {
    if (!current) throw Error('Missing reviewed document: ' + write.path);
    const matches = expected => Object.entries(expected).every(([key, value]) => equal(current[key], value));
    // An already-applied update must still retain every unedited identity/content guard.
    if (matches({...write.expected, ...write.fields})) return 'already-applied';
    if (!matches(write.expected)) throw Error('Content changed since review: ' + write.path);
    return 'pending';
}

function checkLocal() {
    validatePlan(plan);
    const snapshot = JSON.parse(fs.readFileSync(path.join(root, plan.baselineSource), 'utf8'));
    const scenes = snapshot.collections.storyScenes.filter(scene => scene.missionId === 'mission-1');
    const quizzes = snapshot.collections.quizzes.filter(quiz => quiz.missionId === 'mission-1');
    if (quizzes.length !== 1 || quizzes[0].id !== 'quiz-1') throw Error('Unexpected mission quiz.');
    const sceneChanges = [];
    for (const write of plan.writes) {
        const [collection, id] = write.path.split('/');
        const row = snapshot.collections[collection]?.find(item => item.id === id);
        compareDocument(write, row);
        if (collection === 'storyScenes') {
            const words = text => text.trim().split(/\s+/).length;
            sceneChanges.push({scene: id, beforeWords: words(row.content), afterWords: words(write.fields.content)});
        }
    }
    const topics = quizzes[0].questionBlueprint.map(slot => ({topic: slot.topic,
        scenes: scenes.filter(scene => scene.reviewTopics?.includes(slot.topic)).map(scene => scene.id),
        questionVariants: snapshot.collections.questions.filter(question => question.quizId === 'quiz-1' && question.topic === slot.topic).length}));
    if (topics.length !== 5 || topics.some(topic => !topic.scenes.length || topic.questionVariants < 2)) throw Error('Topic coverage is incomplete.');
    return {mode: 'offline-editorial-draft-not-published', baselineAt: snapshot.auditedAt,
        documents: plan.writes.length, scenes: sceneChanges, topics,
        limits: ['Compared with a dated snapshot, not current Firestore.',
            'Structural coverage and word counts are not historical approval or Grade 5 comprehension results.',
            'Publishing changed scene text/options will invalidate affected unfinished drafts under the existing version policy.']};
}

function encode(value) {
    if (value === null) return {nullValue: null};
    if (typeof value === 'string') return {stringValue: value};
    if (typeof value === 'boolean') return {booleanValue: value};
    if (typeof value === 'number' && Number.isFinite(value)) return Number.isInteger(value) ? {integerValue: String(value)} : {doubleValue: value};
    if (Array.isArray(value)) return {arrayValue: {values: value.map(encode)}};
    if (value && Object.getPrototypeOf(value) === Object.prototype) return {mapValue: {fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]))}};
    throw Error('Unsupported Firestore value.');
}
function decode(value) {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.integerValue !== undefined) return Number(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
    if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
    throw Error('Unexpected Firestore value type.');
}

function guardedFields(document, write) {
    if (!document) return null;
    return Object.fromEntries(Object.keys(write.expected).filter(key => document.fields?.[key] !== undefined)
        .map(key => [key, decode(document.fields[key])]));
}

async function main() {
    const flags = process.argv.slice(2);
    if (flags.some(flag => !['--check-local', '--apply'].includes(flag)) || new Set(flags).size !== flags.length || flags.length > 1) {
        throw Error('Use --check-local, --apply, or no flag for live dry-run.');
    }
    validatePlan(plan);
    if (flags.includes('--check-local')) { console.log(JSON.stringify(checkLocal(), null, 2)); return; }
    if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Original project only.');
    const cli = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
    const account = cli.getProjectDefaultAccount(root);
    if (!account) throw Error('Firebase CLI login required.');
    const token = await cli.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const base = `https://firestore.googleapis.com/v1/projects/${plan.projectId}/databases/(default)/documents`;
    const headers = {Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json'};
    async function call(url, body) {
        const response = await fetch(url, {headers, ...(body ? {method: 'POST', body: JSON.stringify(body)} : {})});
        if (response.status === 404 && !body) return null;
        const result = await response.json();
        if (!response.ok) throw Error('HTTP ' + response.status + ': ' + (result.error?.message || 'Firestore request failed'));
        return result;
    }
    const writes = [], backup = [];
    // Bounded sequential reads stop at the first quota error or guard conflict.
    for (const write of plan.writes) {
        const current = await call(base + '/' + write.path);
        const content = guardedFields(current, write);
        if (compareDocument(write, content) === 'already-applied') continue;
        if (!current.updateTime) throw Error('Missing update-time precondition: ' + write.path);
        backup.push({path: write.path, document: current});
        writes.push({update: {name: current.name, fields: Object.fromEntries(Object.entries(write.fields).map(([key, value]) => [key, encode(value)]))},
            updateMask: {fieldPaths: Object.keys(write.fields)}, currentDocument: {updateTime: current.updateTime}});
    }
    console.log(JSON.stringify({mode: flags.includes('--apply') ? 'apply' : 'live-dry-run', documentsToChange: writes.length}));
    if (!flags.includes('--apply') || !writes.length) return;
    const directory = path.join(root, 'backups');
    fs.mkdirSync(directory, {recursive: true});
    const backupFile = path.join(directory, 'chapter1-mission1-learning-polish-' + Date.now() + '.json');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    await call(base + ':commit', {writes});
    for (const write of plan.writes) {
        const current = await call(base + '/' + write.path);
        const content = guardedFields(current, write);
        if (compareDocument(write, content) !== 'already-applied') throw Error('Readback mismatch: ' + write.path);
    }
    console.log('Published and read back the scoped lesson updates. Backup: ' + backupFile);
}

module.exports = {validatePlan, compareDocument, checkLocal, encode, decode};
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
