const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');
const snapshot = rows => ({ docs: rows.map(row => ({ id: row.id, data: () => row })) });

function accessFixture(overrides = {}) {
    const reads = [];
    const data = {
        users: [{ id: 'student', role: 'student', status: 'active' }],
        eras: [{id:'e1',status:'active'},{id:'e2',status:'active'}],
        chapters: [
            { id: 'c1', eraId: 'e1', status: 'active', order: 1 },
            { id: 'c2', eraId: 'e1', status: 'active', order: 2 },
            { id: 'other-era', eraId: 'e2', status: 'active', order: 1 }
        ],
        missions: [
            { id: 'm1', chapterId: 'c1', status: 'active', order: 1 },
            { id: 'm2', chapterId: 'c1', status: 'active', order: 2 }
        ],
        studentProgress: [], studentChapterProgress: [], ...overrides
    };
    const context = vm.createContext({
        auth: { currentUser: { uid: 'student' } }, db: {},
        collection: (_, name) => ({ name }),
        doc: (_, name, id) => ({ name, id }),
        where: (field, _, value) => ({ field, value }),
        query: (ref, condition) => ({ ...ref, condition }),
        getDocFromServer: async ref => {
            const row = data[ref.name].find(item => item.id === ref.id);
            return { exists: () => !!row, data: () => row };
        },
        getDocsFromServer: async ref => {
            reads.push(ref);
            return snapshot(data[ref.name].filter(row =>
                !ref.condition || row[ref.condition.field] === ref.condition.value));
        }
    });
    const source = read('learning-access.js').replace(/import[\s\S]*?from\s+"[^"]+";/g, '')
        .replace(/export /g, '');
    vm.runInContext(source + '\nglobalThis.check = requireLearningAccess;', context);
    context.reads = reads;
    return context;
}

test('lesson access reads only chapters in the selected era', async () => {
    const context = accessFixture();
    await context.check('c1', 'm1');
    const chapters = context.reads.filter(ref => ref.name === 'chapters');
    assert.equal(chapters.length, 1);
    assert.equal(chapters[0].condition.field, 'eraId');
    assert.equal(chapters[0].condition.value, 'e1');
});

test('first mission and first chapter in another era need no classroom', async () => {
    const context = accessFixture();
    assert.equal((await context.check('c1', 'm1')).id, 'm1');
    assert.equal((await context.check('other-era')).id, 'other-era');
});

test('direct links cannot skip mission or chapter prerequisites', async () => {
    const context = accessFixture();
    await assert.rejects(context.check('c1', 'm2'), /previous missions/);
    await assert.rejects(context.check('c2'), /previous chapters/);
    await assert.rejects(context.check('c2', 'm1'), /previous chapters/);
});

test('saved completion unlocks the next activity after a new page load', async () => {
    const context = accessFixture({
        studentProgress: [{ id: 'p1', userId: 'student', missionId: 'm1', completed: true }],
        studentChapterProgress: [{ id: 'p2', userId: 'student', chapterId: 'c1', completed: true }]
    });
    assert.equal((await context.check('c1', 'm2')).id, 'm2');
    assert.equal((await context.check('c2')).id, 'c2');
    await assert.rejects(context.check('c2', 'm1'), /not available in this chapter/);
});

test('another student completion does not unlock an activity', async () => {
    const context = accessFixture({ studentProgress: [
        { id: 'p1', userId: 'someone-else', missionId: 'm1', completed: true }
    ] });
    await assert.rejects(context.check('c1', 'm2'), /previous missions/);
});

test('unpublished chapters and inactive accounts cannot load activities', async () => {
    const context = accessFixture({ chapters: [{ id: 'c1', status: 'active', contentReady: false }] });
    await assert.rejects(context.check('c1'), /not available/);
    const inactive = accessFixture({ users: [{ id: 'student', role: 'student', status: 'disabled' }] });
    await assert.rejects(inactive.check('c1'), /active student/);
    inactive.auth.currentUser = null;
    await assert.rejects(inactive.check('c1'), /sign in/);
});

test('mission quiz delegates reward handling to the shared activity service', async () => {
    let submitted;
    const context = vm.createContext({
        chapterId: 'c1', missionId: 'm1', currentQuiz: { id: 'q1' },
        studentAnswers: { question1: 'A' }, lastArtifactResult: null,
        submitStudentActivity: async data => {
            submitted = data;
            return { passed: true, xpReward: 25, artifactResult: { newlyEarned: true } };
        }
    });
    const source = read('quiz.js');
    const start = source.indexOf('async function completeMission(');
    const end = source.indexOf('async function awardMissionArtifact(', start);
    vm.runInContext(source.slice(start, end) + '\nglobalThis.complete = completeMission;', context);
    assert.equal((await context.complete()).xpReward, 25);
    assert.equal(submitted.kind, 'mission');
    assert.equal(submitted.answers.question1, 'A');
    assert.equal(context.lastArtifactResult.newlyEarned, true);
    context.submitStudentActivity = async () => ({ passed: false });
    await assert.rejects(context.complete(), /could not be confirmed/);
});
test('practice save failure is visible and retry reuses an acknowledged record', async () => {
    let stored = null;
    let writes = 0;
    const context = vm.createContext({
        currentUser: { uid: 'student' }, chapterId: 'c1', missionId: 'm1',
        practiceResults: [{ questionId: 'q1', topic: 'trade', firstTryCorrect: false, attempts: 2 }],
        practiceSessionReference: { id: 'stable-session' },
        practiceSessionGeneration: 1, practiceSavePending: false, practiceDraftReady: false, practiceDraft: null,
        practiceSaveStatus: { textContent: '' },
        document: { getElementById: () => null },
        refreshPracticeReview: async () => {},
        retryPracticeSaveButton: { hidden: true, disabled: false },
        retryMissionQuizButton: { disabled: false },
        serverTimestamp: () => 'timestamp',
        getDoc: async () => ({ exists: () => !!stored, data: () => stored }),
        setDoc: async (_, data) => {
            writes++;
            if (writes === 1) throw new Error('Offline');
            stored = data;
            // Simulate a response lost after the server accepted the write.
            throw new Error('Connection lost');
        },
        console: { log() {}, warn() {}, error() {} }
    });
    const source = read('practice.js');
    const save = source.slice(source.indexOf('async function savePracticeSession()'),
        source.indexOf('async function finishPractice()'));
    const persist = source.slice(source.indexOf('async function persistPracticeSession()'),
        source.indexOf('retryPracticeSaveButton.addEventListener'));
    vm.runInContext(save + persist + '\nglobalThis.persist = persistPracticeSession;', context);
    await context.persist();
    assert.match(context.practiceSaveStatus.textContent, /could not confirm.*saved/);
    assert.match(context.practiceSaveStatus.textContent, /Retry Saving Progress/);
    assert.equal(context.retryPracticeSaveButton.hidden, false);
    assert.equal(context.retryMissionQuizButton.disabled, false);
    await context.persist();
    assert.match(context.practiceSaveStatus.textContent, /has been saved/);
    assert.equal(context.retryPracticeSaveButton.hidden, true);
    assert.equal(writes, 2);
    assert.equal(stored.topicsForReview[0], 'trade');

    let releaseSave;
    context.setDoc = async () => { writes++; await new Promise(resolve => { releaseSave = resolve; }); };
    const pending = context.persist();
    await context.persist();
    assert.equal(writes, 3, 'Overlapping saves must be ignored');
    context.practiceSessionGeneration++;
    context.currentUser = null;
    context.practiceSaveStatus.textContent = 'Signed out';
    releaseSave();
    await pending;
    assert.equal(context.practiceSaveStatus.textContent, 'Signed out', 'A late save must not change the signed-out UI');
});

test('direct learning access rejects an inactive or missing parent era',async()=>{
 await assert.rejects(accessFixture({eras:[{id:'e1',status:'inactive'}]}).check('c1','m1'),/era is not available/);
 await assert.rejects(accessFixture({eras:[]}).check('c1','m1'),/era is not available/);
});

test('configured era prerequisites require every owned chapter completion',async()=>{
 const eras=[{id:'e1',status:'active'},{id:'e2',status:'active',requiredChapterIds:['c1','c2']}];
 for(const studentChapterProgress of [[],[{userId:'student',chapterId:'c1',completed:true}],[{userId:'student',chapterId:'c1',completed:true},{userId:'other',chapterId:'c2',completed:true}]]){
  await assert.rejects(accessFixture({eras,studentChapterProgress}).check('other-era'),/previous era/);
 }
 const unlocked=accessFixture({eras,studentChapterProgress:['c1','c2'].map(chapterId=>({userId:'student',chapterId,completed:true}))});
 assert.equal((await unlocked.check('other-era')).id,'other-era');
});

test('completed missions remain reviewable without unlocking new work in a newly locked era',async()=>{
 const context=accessFixture({eras:[{id:'e1',status:'active',requiredChapterIds:['earlier']}],studentProgress:[{userId:'student',missionId:'m1',completed:true}]});
 assert.equal((await context.check('c1','m1')).id,'m1');
 await assert.rejects(context.check('c1','m2'),/previous era/);
 await assert.rejects(context.check('c1'),/previous era/);
 const completedChapter=accessFixture({eras:[{id:'e1',status:'active',requiredChapterIds:['earlier']}],studentChapterProgress:[{userId:'student',chapterId:'c1',completed:true}]});
 assert.equal((await completedChapter.check('c1')).id,'c1');
});

test('malformed era requirements cannot silently unlock new lessons',async()=>{
 for(const requiredChapterIds of [null,'c1',[null],['']]){
  const context=accessFixture({eras:[{id:'e1',status:'active',requiredChapterIds}]});
  await assert.rejects(context.check('c1'),/previous era/);
 }
});

test('local preview opens active chapter and mission links while retaining account/content validation',async()=>{
 const context=accessFixture({eras:[{id:'e1',status:'active',requiredChapterIds:['missing']}]});context.__lakbayExplorationPreview=true;
 assert.equal((await context.check('c2')).id,'c2');assert.equal((await context.check('c1','m2')).id,'m2');
 await assert.rejects(context.check('c1','unknown'),/not available/);
 context.auth.currentUser=null;await assert.rejects(context.check('c1'),/sign in/);
});

test('access checks require fresh server state and never fall back to cached approval', async () => {
 const context=accessFixture();
 context.getDoc=()=>{throw Error('Cached document access must not be used');};
 context.getDocs=()=>{throw Error('Cached collection access must not be used');};
 assert.equal((await context.check('c1','m1')).id,'m1');
 context.getDocsFromServer=async()=>{throw Error('Server unavailable');};
 await assert.rejects(context.check('c1','m1'),/Server unavailable/);
});

test('an account change during access verification cannot approve the departing account',async()=>{
 const context=accessFixture(),read=context.getDocFromServer;
 let finish;
 context.getDocFromServer=ref=>new Promise(resolve=>{finish=async()=>resolve(await read(ref));});
 const pending=context.check('c1','m1');
 context.auth.currentUser={uid:'another-student'};
 await finish();
 await assert.rejects(pending,/account changed/);
});

test('invalid learning identifiers are rejected before any database read',async()=>{
 const context=accessFixture();
 context.getDocFromServer=()=>{throw Error('Must not read');};
 for(const chapterId of ['',null,{},'../c1','c1/other',' c1','c1\u0000','..']) {
  await assert.rejects(context.check(chapterId),/learning link is invalid/);
 }
 for(const missionId of ['',false,'../m1','m1/other']) {
  await assert.rejects(context.check('c1',missionId),/learning link is invalid/);
 }
});

test('malformed parent eras and missing selected catalog rows cannot bypass ordering',async()=>{
 for(const eraId of [null,{},'',false,'../e1']) {
  const context=accessFixture({chapters:[{id:'c1',status:'active',eraId}]});
  await assert.rejects(context.check('c1'),/era is not available/);
 }
 const context=accessFixture(),read=context.getDocsFromServer;
 context.getDocsFromServer=ref=>ref.name==='chapters'?Promise.resolve({docs:[]}):read(ref);
 await assert.rejects(context.check('c1'),/chapter changed/);
});

test('invalid catalog order cannot silently place later content before its prerequisites',async()=>{
 for(const order of [undefined,null,'2','invalid',NaN,Infinity]) {
  const chapter=accessFixture({chapters:[{id:'c1',status:'active',eraId:'e1',order}]});
  await assert.rejects(chapter.check('c1'),/learning order needs/);
  const mission=accessFixture({missions:[{id:'m1',status:'active',chapterId:'c1',order}]});
  await assert.rejects(mission.check('c1','m1'),/learning order needs/);
 }
});
