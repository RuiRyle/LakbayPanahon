// Publishes reviewed adaptive quiz items from local draft manifests. Dry-run by default.
const fs = require('node:fs');
const path = require('node:path');
const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
const root = path.join(__dirname, '..');
const sources = [
    '../data/mission1-adaptive-quiz-question-drafts.json',
    '../data/other-missions-adaptive-quiz-question-drafts.json'
].map(file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/^\uFEFF/, '')));
const projectId = 'lakbaypanahon-1797e';
const writes = sources.flatMap(source => {
    if (source.projectId !== projectId || !Array.isArray(source.writes)) throw Error('Unexpected adaptive question draft manifest.');
    return source.writes.map(item => {
        if (item.path?.split('/')[0] !== 'questions' || !item.create || item.fields?.status !== 'draft') {
            throw Error('Only new draft question documents may be published: ' + item.path);
        }
        const fields = {...item.fields, status: 'active'};
        if (!fields.quizId || !fields.topic || !['easy', 'medium', 'hard'].includes(String(fields.difficulty).toLowerCase()) ||
            !fields.question?.trim() || !['A', 'B', 'C', 'D'].includes(fields.correctAnswer) ||
            !['A', 'B', 'C', 'D'].every(letter => typeof fields[`option${letter}`] === 'string' && fields[`option${letter}`].trim()) ||
            !['A', 'B', 'C', 'D'].every(letter => fields.answerExplanations?.[letter]?.trim())) {
            throw Error('Incomplete adaptive quiz question: ' + item.path);
        }
        return {path: item.path, fields};
    });
});

if (new Set(writes.map(item => item.path)).size !== writes.length) throw Error('Duplicate question document paths in draft manifests.');
const quizIds = new Set(writes.map(item => item.fields.quizId));
const topics = new Set(writes.map(item => `${item.fields.quizId}|${item.fields.topic}`));
if (writes.length !== 660 || quizIds.size !== 66 || topics.size !== 330) {
    throw Error(`Unexpected coverage: ${writes.length} items, ${quizIds.size} quizzes, ${topics.size} topics.`);
}

function encode(value) {
    if (value === null) return {nullValue: null};
    if (typeof value === 'string') return {stringValue: value};
    if (typeof value === 'boolean') return {booleanValue: value};
    if (typeof value === 'number') return Number.isInteger(value) ? {integerValue: String(value)} : {doubleValue: value};
    if (Array.isArray(value)) return {arrayValue: {values: value.map(encode)}};
    return {mapValue: {fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]))}};
}

function decode(value) {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.integerValue !== undefined) return Number(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
    if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
    throw Error('Unsupported Firestore value.');
}

const canonical = value => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const equal = (first, second) => JSON.stringify(canonical(first)) === JSON.stringify(canonical(second));

async function main() {
    const apply = process.argv.includes('--apply');
    if (!apply) {
        console.log(`Local publication plan ready: ${writes.length} questions across ${quizIds.size} quizzes and ${topics.size} topics. No database access or writes performed.`);
        return;
    }
    if (!process.argv.includes('--publish-approved')) throw Error('Refusing publication without explicit project-owner approval.');
    if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Refusing to publish to an emulator.');

    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw Error('Run firebase login first.');
    const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
    const headers = {Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json'};
    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    const pending = [];
    const backups = [];

    for (let offset = 0; offset < writes.length; offset += 20) {
        const slice = writes.slice(offset, offset + 20);
        const results = await Promise.all(slice.map(async item => {
            const response = await fetch(`${base}/${item.path}`, {headers});
            if (!response.ok && response.status !== 404) throw Error(`${item.path} HTTP ${response.status}`);
            return {item, existing: response.ok ? await response.json() : null};
        }));

        for (const {item, existing} of results) {
            const encodedFields = Object.fromEntries(Object.entries(item.fields).map(([key, value]) => [key, encode(value)]));
            if (existing) {
                const current = Object.fromEntries(Object.entries(existing.fields || {}).map(([key, value]) => [key, decode(value)]));
                const equalExceptStatus = Object.entries(item.fields).every(([key, value]) => key === 'status' || equal(current[key], value));
                if (!equalExceptStatus || !['draft', 'active'].includes(current.status)) {
                    throw Error('Existing document differs from the reviewed draft: ' + item.path);
                }
                if (current.status === 'active') continue;
                backups.push({path: item.path, document: existing});
                pending.push({
                    update: {name: `${base.replace('https://firestore.googleapis.com/v1/', '')}/${item.path}`, fields: encodedFields},
                    updateMask: {fieldPaths: Object.keys(encodedFields)},
                    currentDocument: {updateTime: existing.updateTime}
                });
            } else {
                backups.push({path: item.path, document: null});
                pending.push({
                    update: {name: `${base.replace('https://firestore.googleapis.com/v1/', '')}/${item.path}`, fields: encodedFields},
                    updateMask: {fieldPaths: Object.keys(encodedFields)},
                    currentDocument: {exists: false}
                });
            }
        }
    }

    console.log(`Preflight passed: ${pending.length} new or draft questions will become active; ${writes.length - pending.length} are already active.`);
    if (!pending.length) return;
    const backupPath = path.join(__dirname, `../backups/adaptive-question-bank-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(backupPath), {recursive: true});
    fs.writeFileSync(backupPath, JSON.stringify(backups, null, 2));

    for (let offset = 0; offset < pending.length; offset += 400) {
        const batch = pending.slice(offset, offset + 400);
        const response = await fetch(`${base}:commit`, {method: 'POST', headers, body: JSON.stringify({writes: batch})});
        if (!response.ok) throw Error(`Firestore commit ${Math.floor(offset / 400) + 1} failed: HTTP ${response.status} ${await response.text()}`);
    }
    console.log(`Published ${pending.length} adaptive quiz questions. Backup: ${backupPath}`);
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
