const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createAssessmentService}=require('../functions/student-assessment');
const clone=v=>Array.isArray(v)?v.map(clone):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clone(x)])):v;
function fixture(){
 let now=1700000000000,queue=Promise.resolve();const rows=new Map(),stamp=()=>({toMillis:()=>now});
 rows.set('users/u',{role:'student',status:'active',xp:0});rows.set('users/other',{role:'student',status:'active',xp:0});
 rows.set('learningSettings/securedAssessment',{enabled:true,protocolVersion:1,attemptTtlSeconds:600,perStudentDailyAttempts:1000,perMinuteAttempts:100});rows.set('learningSettings/progression',{version:1,xpPerLevel:100});
 rows.set('eras/e',{status:'active',requiredChapterIds:[]});rows.set('chapters/c',{status:'active',eraId:'e',order:1});rows.set('missions/m',{status:'active',chapterId:'c',order:1,xpReward:25});
 rows.set('artifacts/a',{status:'active',missionId:'m',name:'Fixture collectible'});
 rows.set('quizzes/q',{status:'active',missionId:'m',questionCount:5,passingScore:60,questionBlueprint:[{topic:'t',difficulty:'medium',count:5}],practicePolicy:{difficultyLevels:['easy','medium','hard'],startDifficulty:'easy',reviewDifficulty:'easy',questionLimit:5,promoteAccuracy:.8,demoteAccuracy:.4}});
 const question={status:'active',topic:'t',question:'Fixture question',optionA:'Correct',optionB:'Other',optionC:'Third',optionD:'Fourth',correctAnswer:'A'};
 for(let i=0;i<10;i++)rows.set('questions/q'+i,{...question,quizId:'q',order:i,difficulty:'medium'});
 for(let i=0;i<4;i++)rows.set('practiceQuestions/p'+i,{...question,missionId:'m',difficulty:['easy','medium','hard','easy'][i]});
 const store={run(fn){const execute=async()=>{
  const writes=new Map();const tx={get:async p=>rows.has(p)?{...clone(rows.get(p)),id:p.split('/')[1]}:null,
   list:async(c,k,v,filters=[])=>[...rows].filter(([p,r])=>p.startsWith(c+'/')&&r[k]===v&&filters.every(([a,b])=>r[a]===b)).map(([p,r])=>({...clone(r),id:p.split('/')[1]})),
   set:(p,v)=>writes.set(p,clone(v)),update:(p,v)=>writes.set(p,{...clone(rows.get(p)),...clone(v)}),
   create:(p,v)=>{if(rows.has(p)||writes.has(p))throw Error('Duplicate create');writes.set(p,clone(v));},stamp,timestamp:stamp};
  const value=await fn(tx);for(const [p,v]of writes)rows.set(p,v);return value;
 };const task=queue.then(execute);queue=task.catch(()=>{});return task;}};
 return {rows,service:createAssessmentService(store,{clock:()=>now,newId:randomUUID,random:()=>.3}),identity:{kind:'mission',chapterId:'c',missionId:'m',quizId:'q'},tick:()=>now+=700000};
}
async function answered(f,count){let state=await f.service.start('u',{...f.identity,requestId:randomUUID()});for(let i=0;i<5;i++)state=await f.service.advance('u',{attemptId:state.attemptId,revision:state.revision,requestId:randomUUID(),action:'answer',questionId:state.questions[i].id,answer:i<count?'A':'B'});return state;}
const input=s=>({attemptId:s.attemptId,revision:s.revision});

test('expedition locks answers, offers one lifeline and ends on the third mistake', async () => {
 const f = fixture();
 let state = await f.service.start('u', {...f.identity, requestId:randomUUID()});
 const act = (action, questionId, answer) => f.service.advance('u', {
  ...input(state), requestId:randomUUID(), action, questionId, ...(answer && {answer})
 });
 assert.equal(state.expedition.hearts, 3);
 state = await act('lifeline', state.questions[0].id);
 assert.equal(state.expedition.lifeline.option, 'B');
 await assert.rejects(act('lifeline', state.questions[0].id));
 await assert.rejects(act('lockAnswer', state.questions[0].id, 'B'));
 state = await act('lockAnswer', state.questions[0].id, 'C');
 assert.equal(state.expedition.lastCorrect, false);
 assert.equal(state.expedition.hearts, 2);
 assert.equal(state.questions[0].correctAnswer, undefined);
 await assert.rejects(act('answer', state.questions[0].id, 'A'));
 await assert.rejects(act('lockAnswer', state.questions[0].id, 'A'));
 for (let index = 1; index < 3; index++) {
  state = await act('lockAnswer', state.questions[index].id, 'B');
 }
 assert.equal(state.expedition.hearts, 0);
 assert.equal(state.expedition.exhausted, true);
 await assert.rejects(act('lockAnswer', state.questions[3].id, 'A'));
 await assert.rejects(act('lifeline', state.questions[3].id));
 await assert.rejects(act('followupStart'));
 assert.equal((await f.service.resume('u', {attemptId:state.attemptId})).expedition.exhausted, true);
 const result = await f.service.submit('u', input(state));
 assert.equal(result.score, 0);
 assert.equal(result.passed, false);
 assert.equal(result.totalQuestions, 5);
 assert.equal(result.reviewQuestions.length, 3);
 assert.equal(result.xpReward, 0);
 assert.equal(f.rows.has('studentProgress/u_m'), false);
 const resumed = await f.service.resume('u', {attemptId:state.attemptId});
 assert.equal(resumed.result.passed, false);
 assert.equal(resumed.questions[3].correctAnswer, undefined);
 assert.equal((await f.service.submit('u', input(state))).replayed, true);
 const retry = await f.service.start('u', {...f.identity, requestId:randomUUID()});
 assert.notEqual(retry.attemptId, state.attemptId);
 assert.equal(retry.expedition.hearts, 3);
});

test('losing the last heart on the final question fails even at the passing score', async () => {
 const f = fixture();
 const quiz = f.rows.get('quizzes/q');
 quiz.passingScore = 40;
 let state = await f.service.start('u', {...f.identity, requestId:randomUUID()});
 for (let index = 0; index < quiz.questionCount; index++) {
  const request = {...input(state), requestId:randomUUID(), action:'lockAnswer',
   questionId:state.questions[index].id, answer:index < 2 ? 'A' : 'B'};
  state = await f.service.advance('u', request);
  assert.equal(state.expedition.hearts, Math.min(3, 4 - index));
  if (index === 0) {
   const replay = await f.service.advance('u', request);
   assert.equal(replay.expedition.hearts, 3);
  }
 }
 const result = await f.service.submit('u', input(state));
 assert.equal(result.score, 40);
 assert.equal(result.passed, false);
 assert.equal(result.xpReward, 0);
});

test('the displayed minimum correct count matches rounded mission scores', async () => {
 const {minimumMissionCorrect} = await import('../js/mission-assessment.js');
 assert.equal(minimumMissionCorrect(15, 67), 10);
 assert.equal(minimumMissionCorrect(3, 67.5), 3);
 assert.equal(minimumMissionCorrect(5, 60), 3);
 assert.equal(minimumMissionCorrect(5, 0), 0);
 assert.equal(minimumMissionCorrect(5, 100), 5);
});

for(const correct of [0,1,2,3,4,5])test(correct+'/5 saves immediately with optional practice, exact pass boundary and eligible XP',async()=>{
 const f=fixture(),state=await answered(f,correct);assert.equal(state.followupLimit,0);assert.equal(state.followupStarted,false);
 const result=await f.service.submit('u',input(state));assert.equal(result.score,correct*20);assert.equal(result.passed,correct>=3);assert.equal(result.xpReward,correct>=3?25:0);
 assert.equal(result.adaptiveFollowup,undefined);assert.equal(f.rows.has('studentProgress/u_m'),correct>=3);
 assert.equal(f.rows.get('studentQuizAttempts/u_'+state.attemptId).passed,correct>=3);
 assert.deepEqual(result.topicsForReview,correct===5?[]:['t']);assert.equal(result.reviewQuestions.length,5);
 assert.equal(f.rows.get('users/u').xp,correct>=3?25:0);
});
test('failed attempts persist, retry uses a new equivalent set, passing earns once, later failure preserves completion',async()=>{
 const f=fixture(),failed=await answered(f,2);await f.service.submit('u',input(failed));
 const retry=await answered(f,3);assert.notEqual(retry.attemptId,failed.attemptId);assert.equal(retry.attemptNumber,2);assert(retry.questions.every(q=>!failed.questions.some(old=>old.id===q.id)));
 assert.equal((await f.service.submit('u',input(retry))).xpReward,25);
 const replay=await answered(f,5);assert.equal((await f.service.submit('u',input(replay))).xpReward,0);
 const laterFail=await answered(f,0);assert.equal((await f.service.submit('u',input(laterFail))).passed,false);
 assert.equal(f.rows.get('studentProgress/u_m').completed,true);assert.equal(f.rows.get('studentProgress/u_m').bestScore,100);assert.equal(f.rows.get('users/u').xp,25);
 assert.equal([...f.rows.keys()].filter(p=>p.startsWith('studentQuizAttempts/')).length,4);assert.equal([...f.rows.keys()].filter(p=>p.startsWith('studentArtifacts/')).length,1);
});
test('concurrent duplicate submissions, lost acknowledgements and expired receipt recovery never duplicate XP',async()=>{
 const f=fixture(),state=await answered(f,5);const results=await Promise.all([f.service.submit('u',input(state)),f.service.submit('u',input(state))]);
 assert.equal(results[1].replayed,true);assert.equal(f.rows.get('users/u').xp,25);
 f.tick();const resumed=await f.service.resume('u',{attemptId:state.attemptId});assert.equal(resumed.result.passed,true);
 const recovered=await f.service.submit('u',input(state));assert.equal(recovered.replayed,true);assert.equal(f.rows.get('users/u').xp,25);
 assert.equal([...f.rows.keys()].filter(p=>p.startsWith('studentQuizAttempts/')).length,1);
});
for(const mode of ['not-started','partial','complete'])test('legacy '+mode+' practice does not block main saving; complete legacy evidence stays replayable',async()=>{
 const f=fixture(),state=await answered(f,3),row=f.rows.get('serverAssessmentAttempts/u_'+state.attemptId);
 row.followupLimit=mode==='complete'?1:3;row.followupStarted=mode!=='not-started';
 row.followups=mode==='not-started'?[]:[{...f.rows.get('practiceQuestions/p0'),id:'p0'}];row.followupAnswers=mode==='complete'?{p0:'B'}:{};
 const resumed=await f.service.resume('u',{attemptId:state.attemptId});assert.equal(Object.keys(resumed.answers).length,5);
 const result=await f.service.submit('u',input(resumed));assert.equal(result.score,60);assert.equal(result.xpReward,25);assert.equal(!!result.adaptiveFollowup,mode==='complete');
 assert.equal((await f.service.resume('u',{attemptId:state.attemptId})).result.score,60);assert.equal((await f.service.submit('u',input(state))).replayed,true);
});
test('incomplete main answers, foreign accounts, stale revisions and expired unfinished attempts stay rejected',async()=>{
 const f=fixture(),state=await f.service.start('u',{...f.identity,requestId:randomUUID()});
 await assert.rejects(f.service.submit('u',input(state)),e=>e.code==='assessment/incomplete');
 await assert.rejects(f.service.resume('other',{attemptId:state.attemptId}),e=>e.code==='assessment/attempt-unavailable');
 await assert.rejects(f.service.submit('u',{...input(state),revision:99}),e=>e.code==='assessment/revision-conflict');
 f.tick();await assert.rejects(f.service.submit('u',input(state)),e=>e.code==='assessment/attempt-expired');assert.equal(f.rows.get('users/u').xp,0);
});

test('feedback-only bank drift still blocks unfinished saving, while committed F1 receipts remain immutable',async()=>{
 const f=fixture(),state=await answered(f,5),practice=f.rows.get('practiceQuestions/p0');
 practice.answerExplanations={A:'New correct feedback',B:'New selected feedback'};
 await assert.rejects(f.service.submit('u',input(state)),e=>e.code==='assessment/content-changed');
 assert.equal(f.rows.has('studentQuizAttempts/u_'+state.attemptId),false);assert.equal(f.rows.get('users/u').xp,0);
 delete practice.answerExplanations;
 const committed=await f.service.submit('u',input(state));
 f.rows.get('practiceQuestions/p0').answerExplanations={A:'A later feedback revision'};
 const resumed=await f.service.resume('u',{attemptId:state.attemptId});assert.deepEqual(resumed.result,committed);
 assert.equal((await f.service.submit('u',input(state))).replayed,true);assert.equal(f.rows.get('users/u').xp,25);
});

test('synthetic retired/replacement practice identities reject unfinished issuance but preserve saved F1 receipts and XP',async()=>{
 const f=fixture(),committedState=await answered(f,5),committed=await f.service.submit('u',input(committedState));
 const pending=await answered(f,5),old=f.rows.get('practiceQuestions/p0');
 f.rows.set('practiceQuestions/p0',{...old,status:'inactive'});
 f.rows.set('practiceQuestions/synthetic-replacement-p0',{...old,question:'Synthetic replacement task'});
 await assert.rejects(f.service.submit('u',input(pending)),e=>e.code==='assessment/content-changed');
 assert.deepEqual((await f.service.resume('u',{attemptId:committedState.attemptId})).result,committed);
 assert.equal((await f.service.submit('u',input(committedState))).replayed,true);
 assert.equal(f.rows.get('users/u').xp,25);assert.equal(f.rows.has('studentQuizAttempts/u_'+pending.attemptId),false);
});

test('classroom failures and retries retain assignment evidence and report completion only after a saved pass',async()=>{
 const f=fixture(),now=1700000000000;
 const member={userId:'u',classId:'class',status:'active',joinedAt:{toMillis:()=>now-1000}};
 const assignment={id:'assignment',classId:'class',chapterId:'c',missionId:'m',status:'published',publishedAt:{toMillis:()=>now-2000},submissionVersion:1};
 f.rows.set('classes/class',{status:'active'});f.rows.set('classMembers/u_class',member);f.rows.set('classAssignments/assignment',assignment);f.identity.classroom={classId:'class',assignmentId:'assignment'};
 const {classroomAssignmentEvidence}=await import('../js/classroom-submission-policy.js');
 const attempts=()=>[...f.rows].filter(([p])=>p.startsWith('studentQuizAttempts/')).map(([p,row])=>({...row,id:p.split('/')[1]}));
 const fail=await answered(f,2);await f.service.submit('u',input(fail));assert.equal(classroomAssignmentEvidence(assignment,attempts(),member,'u',now).completed,false);
 assert.equal(attempts()[0].classroom.assignmentId,'assignment');assert.equal(attempts()[0].score,40);
 const pass=await answered(f,3);await f.service.submit('u',input(pass));
 const evidence=classroomAssignmentEvidence(assignment,attempts(),member,'u',now);assert.equal(evidence.completed,true);assert.equal(evidence.bestScore,60);assert.equal(f.rows.get('users/u').xp,25);
 const replay=await f.service.submit('u',input(pass));assert.equal(replay.replayed,true);assert.equal(attempts().length,2);
});
