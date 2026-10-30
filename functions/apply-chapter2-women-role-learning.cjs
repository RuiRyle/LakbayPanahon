// Scoped content update. Default mode is offline and never loads credentials.
const fs = require('node:fs');
const path = require('node:path');
const {isDeepStrictEqual: equal} = require('node:util');
const {encode, decode} = require('./apply-chapter1-mission1-learning-polish.cjs');
const root = path.join(__dirname, '..');
const planFile = path.join(root, 'data/chapter2-women-role-learning-migration.json');
const baselineSource = 'docs/validation/learning-content-snapshot.json';
// These plans are recorded as published; the separate Mission 1 family draft is intentionally excluded.
const overlaySources = ['beliefs-learning-migration.json', 'question-feedback-migration.json',
    'practice-feedback-migration.json', 'chapter2-reading-polish-migration.json'];
const scenePaths = ['storyScenes/chap2-mission2-scene1', 'storyScenes/chap2-mission2-scene6'];
const missionPath = 'missions/chapter2-mission2';
const questionPaths = ['questions/chap2-quiz2-question1', 'questions/chap2-quiz2-question1-retry'];
const practicePaths = ['practiceQuestions/mission-review-chapter2-mission2-spiritual-leadership',
    'practiceQuestions/mission-review-chapter2-mission2-spiritual-leadership-adaptive'];
const targetPaths = [...scenePaths, missionPath, ...questionPaths, ...practicePaths];
const assessmentFields = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation',
    'historicalClue', 'learningPoint', 'answerExplanations', 'sourceUrls', 'contentReviewStatus'];
const sceneFields = ['title','content','exploreIntroduction','exploreItems','checkQuestion','checkChoices',
    'checkCorrectAnswer','checkExplanation','decisionSituation','decisionQuestion','decisionChoices',
    'decisionCorrectAnswer','decisionExplanation','discoveryTitle','discoveryText','keyTerm',
    'keyTermDefinition','historicalInsight','imageAlt','imageCaption','learningHelp','sourceUrls',
    'contentReviewStatus'];
const evidencePolicy = {version:1, minCleanSessions:2, minDistinctQuestions:2, requiredDifficulty:'hard'};
const plainRecord = value => value && Object.getPrototypeOf(value) === Object.prototype;
const text = value => typeof value === 'string' && value.trim().length > 0;

function allowedFields(documentPath) {
    if (scenePaths.includes(documentPath)) return sceneFields;
    if (documentPath === missionPath) return ['learningObjective','learningObjectives','lessonRecap','sourceUrls'];
    return [...assessmentFields, ...(practicePaths.includes(documentPath) ? ['hint','answerHints'] : [])];
}

function validatePlan(candidate) {
    if (!plainRecord(candidate) || candidate.projectId !== 'lakbaypanahon-1797e') throw Error('Unexpected Firebase project.');
    if (!Array.isArray(candidate.writes) || candidate.writes.length !== targetPaths.length ||
        new Set(candidate.writes.map(write => write.path)).size !== targetPaths.length) {
        throw Error('Expected exactly the seven women-role learning document updates.');
    }
    for (const write of candidate.writes) {
        if (!targetPaths.includes(write.path) || write.create !== false) throw Error('Unexpected document or create: ' + write.path);
        if (!plainRecord(write.expected) || !plainRecord(write.fields) || !Object.keys(write.fields).length) {
            throw Error('Missing reviewed fields: ' + write.path);
        }
        const allowed = allowedFields(write.path);
        if (Object.keys(write.fields).some(key => !allowed.includes(key))) throw Error('Unexpected field update: ' + write.path);
        const absent = write.expectedAbsent || [];
        if (!Array.isArray(absent) || new Set(absent).size !== absent.length ||
            absent.some(key => !allowed.includes(key) || !Object.hasOwn(write.fields,key) || Object.hasOwn(write.expected,key))) {
            throw Error('Invalid absent-field guard: ' + write.path);
        }
        if (Object.keys(write.fields).some(key => !Object.hasOwn(write.expected,key) && !absent.includes(key))) {
            throw Error('Missing original field guard: ' + write.path);
        }
        // Validate values without accepting undefined, unsupported prototypes or credentials.
        encode(write.fields); encode(write.expected);
        const expected = write.expected, merged = {...expected,...write.fields};
        if (expected.status !== 'active') throw Error('Missing active identity guard: ' + write.path);
        if (scenePaths.includes(write.path)) {
            const order = write.path === scenePaths[0] ? 1 : 6;
            if (expected.missionId !== 'chapter2-mission2' || expected.order !== order ||
                !Array.isArray(expected.reviewTopics) || !expected.reviewTopics.includes('spiritual-leadership')) {
                throw Error('Missing scene identity guard: ' + write.path);
            }
            const help = merged.learningHelp;
            if (!text(merged.content) || !plainRecord(help) || !text(help.explanation) || !text(help.example) ||
                !text(help.guidingQuestion) || !Array.isArray(help.vocabulary) || !help.vocabulary.length ||
                help.vocabulary.some(item => !text(item.term) || !text(item.definition))) {
                throw Error('Incomplete scene teaching: ' + write.path);
            }
            if (!Array.isArray(merged.sourceUrls) || !merged.sourceUrls.length ||
                merged.sourceUrls.some(url => !text(url) || !url.startsWith('https://'))) {
                throw Error('Missing HTTPS scene source: ' + write.path);
            }
            for (const prefix of ['check','decision']) {
                const choices = merged[prefix+'Choices'];
                if (choices !== undefined && (!Array.isArray(choices) || choices.length < 2 ||
                    choices.some(choice => !text(choice)) || new Set(choices).size !== choices.length ||
                    !choices.includes(merged[prefix+'CorrectAnswer']))) throw Error('Invalid scene choices: ' + write.path);
            }
        } else if (write.path === missionPath) {
            if (expected.chapterId !== 'chapter-2' || expected.order !== 2 || expected.xpReward !== 45 ||
                !text(merged.learningObjective) || !text(merged.lessonRecap) || !Array.isArray(merged.learningObjectives) ||
                !merged.learningObjectives.length || merged.learningObjectives.some(item => !text(item)) ||
                !Array.isArray(merged.sourceUrls) || !merged.sourceUrls.length ||
                merged.sourceUrls.some(url => !text(url) || !url.startsWith('https://'))) {
                throw Error('Missing mission guard or learning summary: ' + write.path);
            }
        } else {
            const practice = practicePaths.includes(write.path);
            const order = practice ? write.path.endsWith('-adaptive') ? 300 : 100 : write.path.endsWith('-retry') ? 101 : 1;
            const difficulty = practice ? write.path.endsWith('-adaptive') ? 'hard' : 'easy' : 'medium';
            if (expected.correctAnswer !== (practice ? 'A' : 'B') || expected.topic !== 'spiritual-leadership' || expected.order !== order ||
                expected.difficulty !== difficulty || (practice ? expected.missionId !== 'chapter2-mission2' : expected.quizId !== 'chap2-quiz2') ||
                (practice && !equal(expected.reviewEvidencePolicy,evidencePolicy))) {
                throw Error('Missing assessment or evidence-policy guard: ' + write.path);
            }
            const options = ['A','B','C','D'].map(letter => merged['option'+letter]);
            if (!text(merged.question) || !text(merged.explanation) || !text(merged.learningPoint) ||
                options.some(option => !text(option)) || new Set(options).size !== 4 ||
                ['A','B','C','D'].some(letter => !text(merged.answerExplanations?.[letter]))) {
                throw Error('Incomplete answer feedback: ' + write.path);
            }
            if (practice && (!text(merged.hint) || ['B','C','D'].some(letter => !text(merged.answerHints?.[letter])))) {
                throw Error('Incomplete practice hints: ' + write.path);
            }
        }
    }
}

function compareDocument(write, current) {
    if (!current) throw Error('Missing reviewed document: ' + write.path);
    const matches = expected => Object.entries(expected).every(([key,value]) =>
        Object.hasOwn(current,key) && equal(current[key],value));
    const absent = write.expectedAbsent || [];
    // New fields may exist only when their complete, reviewed patch is already applied.
    const appliedAbsent = absent.filter(key => !Object.hasOwn(write.fields,key));
    if (matches({...write.expected,...write.fields}) && appliedAbsent.every(key => !Object.hasOwn(current,key))) {
        return 'already-applied';
    }
    if (!matches(write.expected) || absent.some(key => Object.hasOwn(current,key))) {
        throw Error('Content changed since review: ' + write.path);
    }
    return 'pending';
}

function buildLocalCatalog() {
    const snapshot = JSON.parse(fs.readFileSync(path.join(root,baselineSource),'utf8'));
    const catalog = new Map(Object.entries(snapshot.collections).flatMap(([collection,rows]) =>
        rows.map(row => [collection+'/'+row.id,structuredClone(row)])));
    for (const source of overlaySources) {
        const overlay = JSON.parse(fs.readFileSync(path.join(root,'data',source),'utf8'));
        for (const write of overlay.writes || []) catalog.set(write.path,
            {...catalog.get(write.path),...structuredClone(write.fields),id:write.path.split('/')[1]});
    }
    return {snapshot,catalog};
}

function checkLocal(candidate = JSON.parse(fs.readFileSync(planFile,'utf8'))) {
    validatePlan(candidate);
    const {snapshot,catalog} = buildLocalCatalog();
    const states = candidate.writes.map(write => ({path:write.path,state:compareDocument(write,catalog.get(write.path))}));
    return {mode:'offline-women-role-learning-draft-not-published',baselineAt:snapshot.auditedAt,
        documents:states.length,baselineSource,overlays:overlaySources,states,
        limits:['Compared only with a dated local snapshot and explicit overlays, not current Firestore.',
            'No historical accuracy, Grade 5 comprehension or curriculum approval is established by these checks.',
            'Changed lesson/question text can invalidate affected unfinished drafts under the existing version policy.']};
}

function guardedFields(document,write) {
    if (!document) return null;
    const keys = new Set([...Object.keys(write.expected),...Object.keys(write.fields),...(write.expectedAbsent || [])]);
    return Object.fromEntries([...keys].filter(key => document.fields?.[key] !== undefined)
        .map(key => [key,decode(document.fields[key])]));
}

function parseFlags(flags) {
    if (flags.some(flag => !['--check-local','--dry-run-live','--apply'].includes(flag)) ||
        new Set(flags).size !== flags.length || flags.length > 1) {
        throw Error('Use no flag or --check-local for offline validation; --dry-run-live or --apply must be explicit.');
    }
    return flags[0] || '--check-local';
}

async function main(flags = process.argv.slice(2)) {
    const mode = parseFlags(flags), candidate = JSON.parse(fs.readFileSync(planFile,'utf8'));
    validatePlan(candidate);
    if (mode === '--check-local') { console.log(JSON.stringify(checkLocal(candidate),null,2)); return; }
    if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Original project only.');
    const cli = require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
    const account = cli.getProjectDefaultAccount(root);
    if (!account) throw Error('Firebase CLI login required.');
    const token = await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
    const base = `https://firestore.googleapis.com/v1/projects/${candidate.projectId}/databases/(default)/documents`;
    const headers = {Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
    async function call(url,body) {
        const response = await fetch(url,{headers,...(body ? {method:'POST',body:JSON.stringify(body)} : {})});
        if (response.status === 404 && !body) return null;
        const result = await response.json();
        if (!response.ok) throw Error('Firestore request failed: HTTP '+response.status);
        return result;
    }
    const writes = [], backup = [];
    for (const write of candidate.writes) {
        const current = await call(base+'/'+write.path);
        if (compareDocument(write,guardedFields(current,write)) === 'already-applied') continue;
        if (!current.updateTime || current.name !== base.replace('https://firestore.googleapis.com/v1/','')+'/'+write.path) {
            throw Error('Missing reviewed document name/update-time precondition: '+write.path);
        }
        backup.push({path:write.path,document:current});
        writes.push({update:{name:current.name,fields:Object.fromEntries(Object.entries(write.fields).map(([key,value]) => [key,encode(value)]))},
            updateMask:{fieldPaths:Object.keys(write.fields)},currentDocument:{updateTime:current.updateTime}});
    }
    console.log(JSON.stringify({mode:mode === '--apply' ? 'apply' : 'live-dry-run',documentsToChange:writes.length}));
    if (mode !== '--apply' || !writes.length) return;
    const directory = path.join(root,'backups'); fs.mkdirSync(directory,{recursive:true});
    const backupFile = path.join(directory,'chapter2-women-role-learning-'+Date.now()+'.json');
    fs.writeFileSync(backupFile,JSON.stringify(backup,null,2),{flag:'wx'});
    await call(base+':commit',{writes});
    for (const write of candidate.writes) {
        const current = await call(base+'/'+write.path);
        if (compareDocument(write,guardedFields(current,write)) !== 'already-applied') throw Error('Readback mismatch: '+write.path);
    }
    console.log('Published and read back the seven scoped updates. Backup: '+backupFile);
}

module.exports = {validatePlan,compareDocument,checkLocal,encode,decode,guardedFields,buildLocalCatalog,parseFlags};
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
