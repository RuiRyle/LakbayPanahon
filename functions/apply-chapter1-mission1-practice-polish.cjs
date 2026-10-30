// Five beginner items only. --check-local uses no credentials or network.
const fs = require('node:fs');
const path = require('node:path');
const {isDeepStrictEqual: equal} = require('node:util');
const {encode, decode} = require('./apply-chapter1-mission1-learning-polish.cjs');
const root = path.join(__dirname, '..');
const plan = require('../data/chapter1-mission1-practice-polish-migration.json');
const snapshot = require('../docs/validation/learning-content-snapshot.json');
const earlierDraft = require('../data/easy-review-gaps-migration.json');
const feedbackFields = ['hint', 'answerHints', 'explanation', 'learningPoint', 'answerExplanations'];
const draftWrites = earlierDraft.writes.filter(write => write.fields.missionId === 'mission-1');
const existing = snapshot.collections.practiceQuestions.find(question => question.id === 'practice2-1');
const {id: existingId, ...existingFields} = existing;
const originals = new Map([...draftWrites.map(write => [write.path, write.fields]), ['practiceQuestions/' + existingId, existingFields]]);

function validatePlan(candidate) {
    if (candidate.projectId !== 'lakbaypanahon-1797e' || candidate.writes?.length !== 5 ||
        new Set(candidate.writes.map(write => write.path)).size !== 5) throw Error('Unexpected project or item count.');
    for (const write of candidate.writes) {
        const original = originals.get(write.path);
        if (!original || write.create !== false || write.createIfMissing !== draftWrites.some(item => item.path === write.path)) throw Error('Unexpected practice target: ' + write.path);
        if (!equal(write.expected, original)) throw Error('Original practice guard changed: ' + write.path);
        const allowed = write.createIfMissing ? [...Object.keys(original), 'answerHints'] : feedbackFields;
        if (!write.fields || Object.keys(write.fields).some(key => !allowed.includes(key))) throw Error('Unexpected field edit: ' + write.path);
        const question = {...write.expected, ...write.fields};
        for (const key of ['missionId', 'topic', 'topicLabel', 'status', 'difficulty', 'order', 'correctAnswer', 'reviewEvidencePolicy']) {
            if (!equal(question[key], original[key])) throw Error('Practice identity, difficulty or evidence policy changed: ' + write.path + '/' + key);
        }
        if (question.missionId !== 'mission-1' || question.status !== 'active' || question.difficulty !== 'easy') throw Error('Unexpected question identity.');
        if (write.createIfMissing && Object.keys(original).some(key => !Object.hasOwn(write.fields, key))) throw Error('Incomplete create fields.');
        const absent = Object.keys(write.fields).filter(key => !Object.hasOwn(original, key)).sort();
        if (!equal([...write.expectedAbsent].sort(), absent)) throw Error('Missing absence guard: ' + write.path);
        const letters = ['A', 'B', 'C', 'D'];
        const choices = letters.map(letter => question['option' + letter]);
        if (!question.question?.trim() || choices.some(choice => typeof choice !== 'string' || !choice.trim()) || new Set(choices).size !== 4) throw Error('Invalid practice choices.');
        const wrong = letters.filter(letter => letter !== question.correctAnswer);
        if (!equal(Object.keys(question.answerHints || {}).sort(), wrong) || wrong.some(letter => !question.answerHints[letter]?.trim())) throw Error('Missing choice-specific hints.');
        if (new Set(Object.values(question.answerHints)).size !== 3 || letters.some(letter => !question.answerExplanations?.[letter]?.trim())) throw Error('Incomplete or repeated coaching.');
        if (!question.hint?.trim() || !question.explanation?.trim() || !question.learningPoint?.trim() ||
            question.answerExplanations[question.correctAnswer] === question.learningPoint) throw Error('Missing or duplicated explanation/key idea.');
    }
}

function compareDocument(write, current) {
    if (!current) {
        if (write.createIfMissing) return 'create';
        throw Error('Missing existing practice question: ' + write.path);
    }
    const matches = fields => Object.entries(fields).every(([key, value]) => equal(current[key], value));
    if (matches({...write.expected, ...write.fields})) return 'already-applied';
    if (!matches(write.expected) || write.expectedAbsent.some(key => current[key] !== undefined)) throw Error('Practice content changed since review: ' + write.path);
    return 'update';
}

function checkLocal() {
    validatePlan(plan);
    const scenes = snapshot.collections.storyScenes.filter(scene => scene.missionId === 'mission-1');
    const rows = plan.writes.map(write => {
        const current = snapshot.collections.practiceQuestions.find(question => question.id === write.path.split('/')[1]);
        const mode = compareDocument(write, current);
        if (write.createIfMissing) compareDocument(write, originals.get(write.path));
        return {path: write.path, modeAgainstDatedSnapshot: mode, topic: write.expected.topic,
            lessonScenes: scenes.filter(scene => scene.reviewTopics?.includes(write.expected.topic)).map(scene => scene.id)};
    });
    if (rows.some(row => !row.lessonScenes.length) || new Set(rows.map(row => row.topic)).size !== 5) throw Error('Missing lesson/topic coverage.');
    return {mode: 'offline-editorial-comparison-not-live', baselineAt: snapshot.auditedAt, items: rows,
        limits: ['Prepared easy items may or may not already exist in Firestore.', 'Editorial and structural checks do not establish Grade 5 learner comprehension.']};
}

function readFields(document, write) {
    if (!document) return null;
    const keys = new Set([...Object.keys(write.expected), ...Object.keys(write.fields), ...write.expectedAbsent]);
    return Object.fromEntries([...keys].filter(key => document.fields?.[key] !== undefined).map(key => [key, decode(document.fields[key])]));
}

async function main() {
    const flags = process.argv.slice(2);
    if (flags.length > 1 || flags.some(flag => !['--check-local', '--apply'].includes(flag))) throw Error('Use --check-local, --apply, or no flag for a live dry run.');
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
    const writes = [], backup = [], report = [];
    for (const write of plan.writes) {
        const document = await call(base + '/' + write.path);
        const content = readFields(document, write);
        const mode = compareDocument(write, content);
        report.push({path: write.path, action: mode});
        if (mode === 'already-applied') continue;
        const changed = Object.fromEntries(Object.entries(write.fields).filter(([key, value]) => !equal(content?.[key], value)));
        if (document && !document.updateTime) throw Error('Missing update-time guard: ' + write.path);
        writes.push({update: {name: base.replace('https://firestore.googleapis.com/v1/', '') + '/' + write.path,
            fields: Object.fromEntries(Object.entries(changed).map(([key, value]) => [key, encode(value)]))},
            updateMask: {fieldPaths: Object.keys(changed)}, currentDocument: document ? {updateTime: document.updateTime} : {exists: false}});
        backup.push({path: write.path, document});
    }
    console.log(JSON.stringify({mode: flags.includes('--apply') ? 'apply' : 'live-dry-run', documentsToChange: writes.length, items: report}, null, 2));
    if (!flags.includes('--apply') || !writes.length) return;
    const directory = path.join(root, 'backups');
    fs.mkdirSync(directory, {recursive: true});
    const backupFile = path.join(directory, 'chapter1-mission1-practice-polish-' + Date.now() + '.json');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    await call(base + ':commit', {writes});
    for (const write of plan.writes) {
        const saved = await call(base + '/' + write.path);
        if (compareDocument(write, readFields(saved, write)) !== 'already-applied') throw Error('Readback mismatch: ' + write.path);
    }
    console.log('Published and read back five beginner-practice items. Backup: ' + backupFile);
}

module.exports = {validatePlan, compareDocument, checkLocal};
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
