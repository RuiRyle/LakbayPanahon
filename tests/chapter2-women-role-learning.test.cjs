const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {isDeepStrictEqual: equal} = require('node:util');
const publisher = require('../functions/apply-chapter2-women-role-learning.cjs');
const {validatePlan,compareDocument,checkLocal,encode,decode,guardedFields,parseFlags} = publisher;
const plan = require('../data/chapter2-women-role-learning-migration.json');
const clone = () => structuredClone(plan);
const root = path.join(__dirname,'..');
const paths = [
    'storyScenes/chap2-mission2-scene1',
    'storyScenes/chap2-mission2-scene6',
    'missions/chapter2-mission2',
    'questions/chap2-quiz2-question1',
    'questions/chap2-quiz2-question1-retry',
    'practiceQuestions/mission-review-chapter2-mission2-spiritual-leadership',
    'practiceQuestions/mission-review-chapter2-mission2-spiritual-leadership-adaptive'
];
const item = documentPath => plan.writes.find(write => write.path === documentPath);
const merged = documentPath => ({...item(documentPath).expected,...item(documentPath).fields});
const variants = documentPath => ['A','B','C','D'].map(letter => merged(documentPath)['option'+letter]);

test('only the seven reviewed content documents can change', () => {
    assert.doesNotThrow(() => validatePlan(plan));
    assert.deepEqual(new Set(plan.writes.map(write => write.path)),new Set(paths));
    for (const mutate of [
        draft => { draft.projectId='different-project'; },
        draft => { draft.writes.pop(); },
        draft => { draft.writes[0].path='users/student'; },
        draft => { draft.writes[0].create=true; },
        draft => { draft.writes[1].path=draft.writes[0].path; },
        draft => { draft.writes[0].fields.imageUrl='https://example.com/unreviewed.png'; },
        draft => { draft.writes[1].fields.reviewTopics=['unreviewed-topic']; },
        draft => { draft.writes[2].fields.xpReward=500; }
    ]) {
        const draft=clone();mutate(draft);assert.throws(() => validatePlan(draft));
    }
});

test('identity, quiz, reward, and adaptive evidence policies stay fixed', () => {
    const locate=(draft,documentPath)=>draft.writes.find(write=>write.path===documentPath);
    const source=paths[0],mission=paths[2],main=paths[3],practice=paths[5],hard=paths[6];
    for (const mutate of [
        draft=>{locate(draft,source).expected.missionId='another-mission';},
        draft=>{locate(draft,source).expected.order=3;},
        draft=>{locate(draft,source).expected.reviewTopics=[];},
        draft=>{locate(draft,mission).expected.xpReward=90;},
        draft=>{locate(draft,mission).expected.order=1;},
        draft=>{locate(draft,main).expected.correctAnswer='A';},
        draft=>{locate(draft,main).expected.quizId='another-quiz';},
        draft=>{locate(draft,main).fields.correctAnswer='C';},
        draft=>{locate(draft,practice).expected.correctAnswer='B';},
        draft=>{locate(draft,practice).expected.reviewEvidencePolicy.minCleanSessions=1;},
        draft=>{locate(draft,hard).expected.difficulty='easy';},
        draft=>{locate(draft,hard).fields.reviewEvidencePolicy={version:1};}
    ]) {
        const draft=clone();mutate(draft);assert.throws(() => validatePlan(draft));
    }
});

test('every changed field is guarded against a reviewed old or absent value', () => {
    for (const write of plan.writes) for (const key of Object.keys(write.fields)) {
        assert.ok(Object.hasOwn(write.expected,key)||write.expectedAbsent?.includes(key),write.path+':'+key);
        const draft=clone(),target=draft.writes.find(row=>row.path===write.path);
        delete target.expected[key];
        target.expectedAbsent=(target.expectedAbsent||[]).filter(name=>name!==key);
        assert.throws(()=>validatePlan(draft),undefined,write.path+':'+key);
    }
    const draft=clone();draft.writes[0].expectedAbsent=[...(draft.writes[0].expectedAbsent||[]),'missionId'];
    assert.throws(()=>validatePlan(draft),/absent-field guard/);
});

test('baseline is pending, complete patch is idempotent, and drift stops publication', () => {
    let partial=0,absent=0;
    for (const write of plan.writes) {
        const baseline=structuredClone(write.expected);
        assert.equal(compareDocument(write,baseline),'pending',write.path);
        const applied={...baseline,...structuredClone(write.fields)};
        assert.equal(compareDocument(write,applied),'already-applied',write.path);
        assert.throws(()=>compareDocument(write,null),/Missing reviewed document/);
        assert.throws(()=>compareDocument(write,{...applied,status:'inactive'}),/changed since review/);
        const changed=Object.entries(write.fields).filter(([key,value])=>
            !Object.hasOwn(baseline,key)||!equal(baseline[key],value));
        if(changed.length>1){
            const [key,value]=changed[0];
            assert.throws(()=>compareDocument(write,{...baseline,[key]:value}),/changed since review/,write.path);
            partial++;
        }
        for(const key of write.expectedAbsent||[]){
            assert.throws(()=>compareDocument(write,{...baseline,[key]:'new author value'}),/changed since review/,write.path);
            absent++;
        }
    }
    assert.ok(partial>=4);
    assert.ok(absent>0);
});

test('newly present fields are included in live guard decoding', () => {
    const write=plan.writes.find(row=>row.expectedAbsent?.length);
    assert.ok(write);
    const key=write.expectedAbsent[0],current={...write.expected,[key]:'authored elsewhere'};
    const document={fields:Object.fromEntries(Object.entries(current).map(([name,value])=>[name,encode(value)]))};
    assert.equal(guardedFields(document,write)[key],'authored elsewhere');
    assert.throws(()=>compareDocument(write,guardedFields(document,write)),/changed since review/);
});

test('Firestore value encoding preserves nested source teaching and Unicode', () => {
    for(const write of plan.writes){
        assert.deepEqual(decode(encode(write.expected)),write.expected);
        assert.deepEqual(decode(encode(write.fields)),write.fields);
    }
    const example={term:'kababaihan',note:'Tungkulin — pananagutan',feedback:{A:'Tama'},numbers:[0,1.5]};
    assert.deepEqual(decode(encode(example)),example);
    assert.throws(()=>encode({unsupported:undefined}),/Unsupported/);
});

test('source-scoped lesson aligns with distinct quiz and graded practice', () => {
    const scene=merged(paths[0]),recap=merged(paths[1]);
    const main=merged(paths[3]),retry=merged(paths[4]),easy=merged(paths[5]),hard=merged(paths[6]);
    assert.ok(scene.sourceUrls.some(url=>url.startsWith('https://')));
    assert.ok(recap.sourceUrls.some(url=>url.startsWith('https://')));
    assert.match(scene.content,/woman|women/i);
    assert.match(scene.content,/source|account/i);
    assert.notEqual(main.question,retry.question);
    assert.notDeepEqual(variants(paths[3]),variants(paths[4]));
    assert.notEqual(easy.question,hard.question);
    assert.notDeepEqual(variants(paths[5]),variants(paths[6]));
    for (const assessment of [main,retry,easy,hard]) {
        assert.match(assessment.learningPoint,/woman|women|babaylan|catolonan/i);
        for(const letter of ['A','B','C','D'])assert.ok(assessment.answerExplanations[letter]?.length>15);
    }
    for(const assessment of [easy,hard]){
        for(const letter of ['B','C','D']){
            assert.ok(assessment.answerHints[letter]?.length>15);
            assert.ok(!assessment.answerHints[letter].includes(assessment.optionA),'Hint must not reveal correct option.');
        }
        assert.deepEqual(assessment.reviewEvidencePolicy,{version:1,minCleanSessions:2,minDistinctQuestions:2,requiredDifficulty:'hard'});
    }
});

test('offline local check uses the dated snapshot and explicit published overlays only', () => {
    const sources=['docs/validation/learning-content-snapshot.json',
        ...['beliefs-learning-migration.json','question-feedback-migration.json',
            'practice-feedback-migration.json','chapter2-reading-polish-migration.json'].map(name=>'data/'+name)];
    const before=sources.map(name=>fs.readFileSync(path.join(root,name),'utf8'));
    const report=checkLocal();
    assert.equal(report.mode,'offline-women-role-learning-draft-not-published');
    assert.equal(report.documents,7);
    assert.equal(report.overlays.length,4);
    assert.ok(report.states.every(state=>state.state==='pending'));
    assert.deepEqual(sources.map(name=>fs.readFileSync(path.join(root,name),'utf8')),before);
});

test('offline is default; live reads and writes need one explicit flag', () => {
    assert.equal(parseFlags([]),'--check-local');
    assert.equal(parseFlags(['--check-local']),'--check-local');
    assert.equal(parseFlags(['--dry-run-live']),'--dry-run-live');
    assert.equal(parseFlags(['--apply']),'--apply');
    for(const flags of [['--apply','--check-local'],['--apply','--apply'],['--dry-run'],['--emulator']]){
        assert.throws(()=>parseFlags(flags));
    }
});

test('default CLI does not inspect credentials or call network', async () => {
    const source=fs.readFileSync(path.join(root,'functions/apply-chapter2-women-role-learning.cjs'),'utf8');
    let report;
    const module={exports:{}};
    const fakeRequire=name=>{
        if(name==='node:fs')return fs;
        if(name==='node:path')return path;
        if(name==='node:util')return {isDeepStrictEqual:equal};
        if(name==='./apply-chapter1-mission1-learning-polish.cjs')return {encode,decode};
        throw Error('Unexpected credential or external import: '+name);
    };
    fakeRequire.main=module;
    const context=vm.createContext({module,require:fakeRequire,__dirname:path.join(root,'functions'),structuredClone,
        console:{log(value){report=JSON.parse(value);},error(message){throw Error(message);}},
        process:{argv:['node','local-publisher'],env:new Proxy({}, {get(){throw Error('Credential access');}})},
        fetch(){throw Error('Network access');}});
    const instrumented=source.replace('if (require.main === module)',
        "validatePlan=()=>{};checkLocal=()=>({mode:'offline-women-role-learning-draft-not-published',documents:7});\nif (require.main === module)");
    vm.runInContext(instrumented,context);
    await Promise.resolve();
    assert.equal(report.mode,'offline-women-role-learning-draft-not-published');
    assert.equal(report.documents,7);
});
