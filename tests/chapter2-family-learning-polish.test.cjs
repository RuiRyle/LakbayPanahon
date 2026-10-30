const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {isDeepStrictEqual: equal} = require('node:util');
const publisher = require('../functions/apply-chapter2-family-learning-polish.cjs');
const {validatePlan,compareDocument,checkLocal,encode,decode,guardedFields,parseFlags} = publisher;
const plan = require('../data/chapter2-family-learning-polish-migration.json');
const cloned = () => structuredClone(plan);

test('only seven reviewed family-learning updates are permitted, never another account or content scope', () => {
    assert.doesNotThrow(() => validatePlan(plan));
    for (const mutate of [
        draft => { draft.projectId = 'another-project'; },
        draft => { draft.writes[0].path = 'users/student'; },
        draft => { draft.writes[0].create = true; },
        draft => { draft.writes.pop(); },
        draft => { draft.writes[1].path = draft.writes[0].path; },
        draft => { draft.writes[0].fields.reviewTopics = ['another-topic']; },
        draft => { draft.writes[0].fields.imageUrl = 'https://outside.example/image.png'; }
    ]) {
        const draft = cloned(); mutate(draft); assert.throws(() => validatePlan(draft));
    }
});

test('identity, reward, answer and adaptive-evidence guards cannot be weakened', () => {
    const find = (draft,prefix) => draft.writes.find(write => write.path.startsWith(prefix));
    for (const mutate of [
        draft => { find(draft,'storyScenes/').expected.missionId = 'other'; },
        draft => { find(draft,'storyScenes/').expected.order = 9; },
        draft => { find(draft,'missions/').expected.xpReward = 500; },
        draft => { find(draft,'missions/').fields.xpReward = 500; },
        draft => { find(draft,'missions/').fields.order = 2; },
        draft => { find(draft,'questions/').expected.correctAnswer = 'A'; },
        draft => { find(draft,'questions/').fields.correctAnswer = 'A'; },
        draft => { find(draft,'questions/').expected.quizId = 'another-quiz'; },
        draft => { find(draft,'practiceQuestions/').expected.topic = 'another-topic'; },
        draft => { find(draft,'practiceQuestions/').expected.reviewEvidencePolicy.minCleanSessions = 1; },
        draft => { find(draft,'practiceQuestions/').fields.reviewEvidencePolicy = {version:1}; },
        draft => { draft.writes.find(write => write.path.endsWith('-adaptive')).expected.difficulty = 'easy'; }
    ]) {
        const draft = cloned(); mutate(draft); assert.throws(() => validatePlan(draft));
    }
});

test('every mutated field has an exact old-value or explicit absent-field guard', () => {
    for (const write of plan.writes) {
        for (const key of Object.keys(write.fields)) {
            assert.ok(Object.hasOwn(write.expected,key) || write.expectedAbsent?.includes(key),write.path+':'+key);
            const draft = cloned(), target = draft.writes.find(item => item.path === write.path);
            delete target.expected[key];
            target.expectedAbsent = (target.expectedAbsent || []).filter(item => item !== key);
            assert.throws(() => validatePlan(draft),undefined,write.path+':'+key);
        }
    }
    const draft = cloned(), write = draft.writes[0];
    write.expectedAbsent = [...(write.expectedAbsent || []),'missionId'];
    assert.throws(() => validatePlan(draft),/absent-field guard/);
});

test('baseline and complete applied state compare exactly without changing the source objects', () => {
    for (const write of plan.writes) {
        const original = structuredClone(write.expected), copy = structuredClone(original);
        for (const key of write.expectedAbsent || []) delete original[key];
        assert.equal(compareDocument(write,original),'pending',write.path);
        assert.deepEqual(original,copy);
        const applied = {...original,...structuredClone(write.fields)};
        assert.equal(compareDocument(write,applied),'already-applied',write.path);
        assert.deepEqual(original,copy);
    }
});

test('partial application, absent-field drift and changed identity stop even an otherwise applied patch', () => {
    let partialCases = 0, absentCases = 0;
    for (const write of plan.writes) {
        assert.throws(() => compareDocument(write,null),/Missing reviewed document/);
        const baseline = structuredClone(write.expected);
        const changes = Object.entries(write.fields).filter(([key,value]) =>
            !Object.hasOwn(baseline,key) || !equal(baseline[key],value));
        if (changes.length > 1) {
            const [key,value] = changes[0];
            assert.throws(() => compareDocument(write,{...baseline,[key]:value}),/changed since review/,write.path);
            partialCases++;
        }
        for (const key of write.expectedAbsent || []) {
            assert.throws(() => compareDocument(write,{...baseline,[key]:'new author content'}),/changed since review/);
            absentCases++;
        }
        assert.throws(() => compareDocument(write,{...baseline,...write.fields,status:'inactive'}),/changed since review/);
    }
    assert.ok(partialCases >= 4,'The lesson/assessment patches must be protected against partial application.');
    assert.ok(absentCases > 0,'New authored fields must have absence guards.');
});

test('live field decoding retains newly authored absent fields so drift cannot be hidden', () => {
    const write = plan.writes.find(item => item.expectedAbsent?.length);
    assert.ok(write);
    const key = write.expectedAbsent[0];
    const current = {...write.expected,[key]:'new field from another author'};
    const document = {fields:Object.fromEntries(Object.entries(current).map(([name,value]) => [name,encode(value)]))};
    assert.equal(guardedFields(document,write)[key],current[key]);
    assert.throws(() => compareDocument(write,guardedFields(document,write)),/changed since review/);
});

test('Firestore encoding round-trips every patch and original guard including Unicode and nested feedback', () => {
    for (const write of plan.writes) {
        assert.deepEqual(decode(encode(write.fields)),write.fields);
        assert.deepEqual(decode(encode(write.expected)),write.expected);
    }
    const example = {note:'Pamilya — pananagutan',values:[null,false,3,0.25],feedback:{C:'Tama. May ambag ang kababaihan.'}};
    assert.deepEqual(decode(encode(example)),example);
    assert.throws(() => encode({unsupported:undefined}),/Unsupported/);
});

test('offline comparison uses the dated snapshot and explicit published overlays without mutating them', () => {
    const sources = [
        'docs/validation/learning-content-snapshot.json',
        ...['social-roles-learning-migration.json','chapter2-reading-polish-migration.json',
            'chapter2-feedback-polish-migration.json','chapter2-beginner-practice-migration.json'].map(file => 'data/'+file)
    ];
    const before = sources.map(file => fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
    const result = checkLocal();
    assert.equal(result.mode,'offline-family-learning-draft-not-published');
    assert.equal(result.documents,7);
    assert.equal(result.overlays.length,4);
    assert.ok(result.states.every(item => item.state === 'pending'));
    assert.deepEqual(sources.map(file => fs.readFileSync(path.join(__dirname,'..',file),'utf8')),before);
});

test('family learning moves from recall to a new retry and a genuine two-clue practice inference', () => {
    const merged = documentPath => {
        const write = plan.writes.find(item => item.path === documentPath);
        assert.ok(write,documentPath);
        return {...write.expected,...write.fields};
    };
    const scene = merged('storyScenes/chap2-mission1-scene3');
    const main = merged('questions/chap2-quiz1-question3');
    const retry = merged('questions/chap2-quiz1-question3-retry');
    const easy = merged('practiceQuestions/chap2-mission1-practice3');
    const hard = merged('practiceQuestions/chap2-mission1-practice3-adaptive');
    const options = item => ['A','B','C','D'].map(letter => item['option'+letter]);
    assert.match(scene.content,/made-up child/);
    assert.match(scene.content,/documented example from Ifugao/);
    assert.match(scene.content,/does not tell us exactly when the chants began/);
    assert.ok(scene.sourceUrls.some(url => url.includes('unesco.emb-japan.go.jp')));
    assert.notEqual(main.question,retry.question);
    assert.notDeepEqual(options(main),options(retry),'Retry should be a distinct equivalent item.');
    assert.notEqual(easy.question,hard.question);
    assert.notDeepEqual(options(easy),options(hard),'Hard practice should require a new inference.');
    assert.match(hard.question,/grandmother/);
    assert.match(hard.question,/aunt/);
    assert.match(hard.optionC,/knowledge and help one another across homes/);
    assert.match(hard.learningPoint,/Family ties/);
    assert.doesNotMatch(hard.question,/UNESCO|source|fictional/i,'The family topic should not be gated on source vocabulary.');
    for (const item of [easy,hard]) {
        for (const letter of ['A','B','D']) {
            assert.ok(item.answerHints[letter].length > 20);
            assert.ok(!item.answerHints[letter].includes(item.optionC),'A retry hint should not reveal the answer.');
            assert.ok(item.answerExplanations[letter].length > 20);
        }
        assert.deepEqual(item.reviewEvidencePolicy,{version:1,minCleanSessions:2,minDistinctQuestions:2,requiredDifficulty:'hard'});
    }
});

test('local mode is the default and ambiguous or unknown publication flags are rejected', () => {
    assert.equal(parseFlags([]),'--check-local');
    assert.equal(parseFlags(['--check-local']),'--check-local');
    assert.equal(parseFlags(['--dry-run-live']),'--dry-run-live');
    assert.equal(parseFlags(['--apply']),'--apply');
    for (const flags of [['--apply','--check-local'],['--apply','--apply'],['--dry-run'],['--emulator']]) {
        assert.throws(() => parseFlags(flags));
    }
});

test('executing the publisher without flags never loads CLI credentials or invokes fetch', async () => {
    const source = fs.readFileSync(path.join(__dirname,'../functions/apply-chapter2-family-learning-polish.cjs'),'utf8');
    let report;
    const module = {exports:{}};
    const fakeRequire = name => {
        if (name === 'node:fs') return fs;
        if (name === 'node:path') return path;
        if (name === 'node:util') return {isDeepStrictEqual:equal};
        if (name === './apply-chapter1-mission1-learning-polish.cjs') return {encode,decode};
        throw Error('Unexpected credential or external module access: '+name);
    };
    fakeRequire.main = module;
    const context = vm.createContext({module,require:fakeRequire,__dirname:path.join(__dirname,'../functions'),
        structuredClone,console:{log(value) { report = JSON.parse(value); },error(message) { throw Error(message); }},
        process:{argv:['node','local-publisher'],env:new Proxy({}, {get() { throw Error('Unexpected environment/credential access'); }})},
        fetch() { throw Error('Unexpected network call'); }});
    // Content validation is exercised above in its native module realm. Here
    // isolate CLI dispatch so any attempted credential/network access is visible.
    const instrumented = source.replace('if (require.main === module)',
        "validatePlan = () => {}; checkLocal = () => ({mode:'offline-family-learning-draft-not-published',documents:7});\nif (require.main === module)");
    vm.runInContext(instrumented,context);
    await Promise.resolve();
    assert.equal(report.mode,'offline-family-learning-draft-not-published');
    assert.equal(report.documents,7);
});
