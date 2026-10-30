const {test}=require('node:test'),assert=require('node:assert/strict');
const modules=Promise.all([import('../server/assessment/core.mjs'),import('../server/assessment/http.mjs'),import('../server/assessment/server.mjs'),import('../server/assessment/store.mjs')]);
const clone=value=>structuredClone(value);
function fixture(createService,overrides={}) {
 const rows=new Map(),add=(path,value)=>rows.set(path,clone(value));
 let now=Date.parse('2026-10-30T02:00:00Z'),next=0,tail=Promise.resolve(),commits=0;
 add('users/alice',{role:'student',status:'active',xp:0,level:1});
 add('users/bob',{role:'student',status:'active',xp:0,level:1});
 add('learningSettings/trustedAssessment',{enabled:true,mode:'trusted',schemaVersion:1,privateKeysReady:true,clientWritesBlocked:true,attemptTtlSeconds:1800,perMinuteAttempts:10,perStudentDailyAttempts:30,...overrides});
 add('learningSettings/progression',{version:1,xpPerLevel:100});
 add('eras/e1',{status:'active',requiredChapterIds:[]});add('eras/e2',{status:'active',requiredChapterIds:['c1']});
 add('chapters/c1',{status:'active',eraId:'e1',order:1});add('chapters/c2',{status:'active',eraId:'e1',order:2});add('chapters/c3',{status:'active',eraId:'e2',order:1});
 add('missions/m1',{status:'active',chapterId:'c1',order:1,xpReward:25});add('missions/m2',{status:'active',chapterId:'c1',order:2,xpReward:30});
 add('missions/m3',{status:'active',chapterId:'c2',order:1,xpReward:30});add('missions/m4',{status:'active',chapterId:'c3',order:1,xpReward:30});
 for(const [quizId,missionId]of [['quiz1','m1'],['quiz2','m2'],['quiz3','m3'],['quiz4','m4']]){
  add('quizzes/'+quizId,{status:'active',missionId,assessmentVersion:1,questionCount:5,passingScore:60,questionBlueprint:Array.from({length:5},(_,i)=>({topic:'topic'+i,difficulty:'medium',count:1}))});
  for(let i=0;i<10;i++){
   const id=quizId+'q'+i;add('questions/'+id,{status:'active',quizId,topic:'topic'+i%5,difficulty:'medium',question:'Prompt '+i,optionA:'A',optionB:'B',optionC:'C',optionD:'D'});
   add('assessmentAnswerKeys/questions_'+id,{questionCollection:'questions',questionId:id,activityId:quizId,assessmentVersion:1,correctAnswer:'A',privateNote:'Do not expose'});
  }
 }
 add('artifacts/art1',{status:'active',missionId:'m1',name:'Artifact'});
 add('chapterChallenges/final',{status:'active',chapterId:'c1',passingScore:70,assessmentVersion:1});
 const tasks=[
  {id:'choice',question:'Choice',optionA:'A',optionB:'B',optionC:'C',optionD:'D'},
  {id:'matching',question:'Match',gameType:'matching',matchingLeft:['left1','left2'],matchingRight:['right1','right2']},
  {id:'trade',question:'Trade',gameType:'tradeSimulation',startingQuantity:10},
  {id:'evidence',question:'Evidence',optionA:'A',optionB:'B',optionC:'C',optionD:'D',evidenceTask:{instructions:'Use a clue',cards:[{id:'clue1',sceneId:'s1',clueIndex:0},{id:'clue2',sceneId:'s1',clueIndex:1}]}}
 ];
 for(const task of tasks){add('chapterChallengeQuestions/'+task.id,{...task,status:'active',challengeId:'final'});add('assessmentAnswerKeys/chapterChallengeQuestions_'+task.id,{questionCollection:'chapterChallengeQuestions',questionId:task.id,activityId:'final',assessmentVersion:1,correctAnswer:'A',matches:{left1:'right2',left2:'right1'},requiredQuantity:3,correctEvidenceId:'clue2'});}
 add('badges/badge1',{status:'active',chapterId:'c1',name:'Chapter badge'});
 add('dailyChallenges/d1',{status:'active',assessmentVersion:1,question:'Daily',optionA:'A',optionB:'B',optionC:'C',optionD:'D',xpReward:10,order:1});
 add('assessmentAnswerKeys/dailyChallenges_d1',{questionCollection:'dailyChallenges',questionId:'d1',activityId:'d1',assessmentVersion:1,correctAnswer:'B'});
 const store={runTransaction(callback){const job=tail.then(async()=>{
  const writes=[],tx={
   get:async path=>rows.has(path)?{...clone(rows.get(path)),id:path.split('/')[1]}:null,
   list:async(collection,field,value)=>[...rows].filter(([path,row])=>path.startsWith(collection+'/')&&row[field]===value).map(([path,row])=>({...clone(row),id:path.split('/')[1]})),
   timestamp:()=>({serverTime:now}),create:(path,data)=>writes.push({kind:'create',path,data:clone(data)}),set:(path,data)=>writes.push({kind:'set',path,data:clone(data)}),update:(path,data)=>writes.push({kind:'update',path,data:clone(data)})};
  const result=await callback(tx);
  for(const write of writes){if(write.kind==='create'&&rows.has(write.path))throw Error('Duplicate create');if(write.kind==='update'&&!rows.has(write.path))throw Error('Missing update');}
  for(const write of writes)rows.set(write.path,write.kind==='update'?{...rows.get(write.path),...write.data}:write.data);
  if(writes.length)commits++;return clone(result);
 });tail=job.catch(()=>{});return job;}};
 const service=createService(store,{clock:()=>now,newId:()=>`${String(++next).padStart(8,'0')}-1111-4111-8111-111111111111`,randomNumber:()=>0.3});
 return {rows,add,service,store,advance:ms=>{now+=ms;},setNow:value=>{now=Date.parse(value);},get commits(){return commits;}};
}
const first={kind:'mission',chapterId:'c1',missionId:'m1',quizId:'quiz1'};
const correct=issued=>Object.fromEntries(issued.questions.map(q=>[q.id,'A']));
const deny=(operation,code)=>assert.rejects(operation,error=>error.code===code);

test('server issues five selected questions without answer keys, feedback maps or private metadata',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService),issued=await f.service.start('alice',first);
 assert.equal(issued.questions.length,5);assert.equal(issued.passingScore,60);
 const serialized=JSON.stringify(issued);for(const key of ['correctAnswer','privateNote','answerExplanations','keys'])assert.ok(!serialized.includes(key));
 assert.ok(f.rows.has('serverAssessmentAttempts/alice_'+issued.attemptId));assert.equal(f.rows.get('users/alice').xp,0);
});
test('server grades submitted answers, fails without XP and selects equivalent fresh retry questions',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService),issued=await f.service.start('alice',first);
 const result=await f.service.submit('alice',{attemptId:issued.attemptId,answers:Object.fromEntries(issued.questions.map(q=>[q.id,'B']))});
 assert.equal(result.passed,false);assert.equal(result.score,0);assert.equal(result.xpReward,0);assert.equal(f.rows.has('studentProgress/alice_m1'),false);
 const retry=await f.service.start('alice',first);assert.equal(retry.questions.length,5);assert.ok(retry.questions.every(q=>!issued.questions.some(old=>old.id===q.id)));
});
test('passing grade, progress, artifact and XP are atomic and replay-safe',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService),issued=await f.service.start('alice',first);
 const input={attemptId:issued.attemptId,answers:correct(issued)};
 const [a,b]=await Promise.all([f.service.submit('alice',input),f.service.submit('alice',input)]);
 assert.equal(a.score,100);assert.equal(a.firstCompletion,true);assert.equal(b.replayed,true);assert.equal(f.rows.get('users/alice').xp,25);
 assert.equal(f.rows.get('studentProgress/alice_m1').serverVerified,true);assert.ok(f.rows.has('studentArtifacts/alice_art1'));
 await deny(f.service.submit('alice',{...input,answers:{...input.answers,[issued.questions[0].id]:'B'}}),'assessment/attempt-conflict');
 const next=await f.service.start('alice',first),replay=await f.service.submit('alice',{attemptId:next.attemptId,answers:correct(next)});
 assert.equal(replay.firstCompletion,false);assert.equal(replay.xpReward,0);assert.equal(f.rows.get('users/alice').xp,25);
});
test('caller score, owner, XP, selected question IDs and invented attempts cannot control grading',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService);
 for(const extra of [{userId:'bob'},{score:100},{xpReward:9999},{questionIds:['easy']}])await deny(f.service.start('alice',{...first,...extra}),'assessment/invalid-request');
 const issued=await f.service.start('alice',first);
 await deny(f.service.submit('alice',{attemptId:issued.attemptId,answers:correct(issued),score:100}),'assessment/invalid-request');
 await deny(f.service.submit('bob',{attemptId:issued.attemptId,answers:correct(issued)}),'assessment/attempt-unavailable');
 await deny(f.service.submit('alice',{attemptId:'99999999-1111-4111-8111-111111111111',answers:{}}),'assessment/attempt-unavailable');
 await deny(f.service.submit('alice',{attemptId:issued.attemptId,answers:{...correct(issued),extra:'A'}}),'assessment/invalid-request');
});
test('expired, revoked and newly disabled attempts fail without writes',async()=>{
 const [{createAssessmentService}]=await modules;
 for(const mode of ['expired','inactive','disabled']){
  const f=fixture(createAssessmentService),issued=await f.service.start('alice',first),before=f.commits;
  if(mode==='expired')f.advance(1800001);if(mode==='inactive')f.rows.get('users/alice').status='disabled';if(mode==='disabled')f.rows.get('learningSettings/trustedAssessment').enabled=false;
  await deny(f.service.submit('alice',{attemptId:issued.attemptId,answers:correct(issued)}),mode==='expired'?'assessment/attempt-expired':mode==='inactive'?'assessment/forbidden':'assessment/not-active');assert.equal(f.commits,before);
 }
});
test('server enforces mission, chapter and era prerequisites without trusting browser progress',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService);
 await deny(f.service.start('alice',{kind:'mission',chapterId:'c1',missionId:'m2',quizId:'quiz2'}),'assessment/locked');
 f.add('studentProgress/alice_m1',{userId:'alice',completed:true});
 await deny(f.service.start('alice',{kind:'mission',chapterId:'c1',missionId:'m2',quizId:'quiz2'}),'assessment/locked');
 f.add('studentProgress/alice_m1',{userId:'alice',completed:true,serverVerified:true});
 assert.ok(await f.service.start('alice',{kind:'mission',chapterId:'c1',missionId:'m2',quizId:'quiz2'}));
 await deny(f.service.start('alice',{kind:'mission',chapterId:'c2',missionId:'m3',quizId:'quiz3'}),'assessment/locked');
 await deny(f.service.start('alice',{kind:'mission',chapterId:'c3',missionId:'m4',quizId:'quiz4'}),'assessment/locked');
 f.add('studentChapterProgress/alice_c1',{userId:'alice',completed:true,serverVerified:true});
 assert.ok(await f.service.start('alice',{kind:'mission',chapterId:'c2',missionId:'m3',quizId:'quiz3'}));
 assert.ok(await f.service.start('alice',{kind:'mission',chapterId:'c3',missionId:'m4',quizId:'quiz4'}));
});
test('chapter challenge grades matching, evidence, trade and choice tasks and awards one badge',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService);
 await deny(f.service.start('alice',{kind:'chapter',chapterId:'c1',challengeId:'final'}),'assessment/locked');
 for(const missionId of ['m1','m2'])f.add('studentProgress/alice_'+missionId,{userId:'alice',completed:true,serverVerified:true});
 const issued=await f.service.start('alice',{kind:'chapter',chapterId:'c1',challengeId:'final'}),serialized=JSON.stringify(issued);
 for(const secret of ['correctAnswer','correctEvidenceId','requiredQuantity','left1\":\"right2'])assert.ok(!serialized.includes(secret));
 const result=await f.service.submit('alice',{attemptId:issued.attemptId,answers:{choice:'A',matching:{gameType:'matching',matches:{left1:'right2',left2:'right1'}},trade:{gameType:'tradeSimulation',quantity:3},evidence:{gameType:'evidenceDecision',evidenceId:'clue2',conclusion:'A'}}});
 assert.equal(result.score,100);assert.equal(result.xpReward,0);assert.equal(result.badgeResult.newlyEarned,true);assert.ok(f.rows.has('studentBadges/alice_badge1'));
});
test('daily grading follows server date, pays once and rejects crossing midnight',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService);
 const issued=await f.service.start('alice',{kind:'daily',challengeId:'d1'}),input={attemptId:issued.attemptId,answers:{d1:'B'}};
 const result=await f.service.submit('alice',input);assert.equal(result.xpReward,10);assert.equal(result.learningStreak,1);
 const next=await f.service.start('alice',{kind:'daily',challengeId:'d1'}),replay=await f.service.submit('alice',{...input,attemptId:next.attemptId});assert.equal(replay.xpReward,0);assert.equal(f.rows.get('users/alice').xp,10);
 const g=fixture(createAssessmentService);g.setNow('2026-10-30T15:59:30Z');const old=await g.service.start('alice',{kind:'daily',challengeId:'d1'});g.advance(60000);
 await deny(g.service.submit('alice',{attemptId:old.attemptId,answers:{d1:'B'}}),'assessment/attempt-expired');
});
test('old public answer fields, missing private keys and changed activity versions fail closed',async()=>{
 const [{createAssessmentService}]=await modules;
 const leaked=fixture(createAssessmentService);for(const [path,q]of leaked.rows)if(path.startsWith('questions/'))q.correctAnswer='A';
 await deny(leaked.service.start('alice',first),'assessment/migration-required');
 const missing=fixture(createAssessmentService);for(const path of [...missing.rows.keys()])if(path.startsWith('assessmentAnswerKeys/'))missing.rows.delete(path);
 await deny(missing.service.start('alice',first),'assessment/key-unavailable');
 const changed=fixture(createAssessmentService),issued=await changed.service.start('alice',first);changed.rows.get('quizzes/quiz1').assessmentVersion++;
 await deny(changed.service.submit('alice',{attemptId:issued.attemptId,answers:correct(issued)}),'assessment/content-changed');
});
test('rate limits are atomic and do not reserve excess attempts',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService,{perMinuteAttempts:1});
 const results=await Promise.allSettled([f.service.start('alice',first),f.service.start('alice',first)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'assessment/rate-limit');
 assert.equal(f.rows.get('serverAssessmentUsage/alice_2026-10-30').count,1);
 const g=fixture(createAssessmentService,{perStudentDailyAttempts:1});await g.service.start('alice',first);g.advance(60000);await deny(g.service.start('alice',first),'assessment/rate-limit');
});
test('foreign or corrupt canonical records cannot be promoted to verified progress',async()=>{
 const [{createAssessmentService}]=await modules;
 const f=fixture(createAssessmentService),issued=await f.service.start('alice',first);
 f.add('studentProgress/alice_m1',{userId:'bob',completed:true,bestScore:100});
 await deny(f.service.submit('alice',{attemptId:issued.attemptId,answers:correct(issued)}),'assessment/record-conflict');
 assert.equal(f.rows.get('studentProgress/alice_m1').userId,'bob');assert.equal(f.rows.get('users/alice').xp,0);
});
test('deep or oversized answer objects are rejected before canonical hashing',async()=>{
 const [{createAssessmentService}]=await modules,f=fixture(createAssessmentService),issued=await f.service.start('alice',first);
 const deep={};let cursor=deep;for(let i=0;i<20;i++){cursor.next={};cursor=cursor.next;}
 await deny(f.service.submit('alice',{attemptId:issued.attemptId,answers:deep}),'assessment/invalid-request');
 await deny(f.service.submit('alice',{attemptId:issued.attemptId,answers:{q:'A'.repeat(5000)}}),'assessment/invalid-request');
});
test('Firestore adapter bounds catalog reads and queues Admin writes on the transaction',async()=>{
 const [,,, {createAssessmentStore}]=await modules;const calls=[];
 const query={where(field,op,value){calls.push(['where',field,op,value]);return this;},limit(n){calls.push(['limit',n]);return this;}};
 const raw={get:async target=>target===query?{size:1,docs:[{id:'q1',data:()=>({question:'Prompt'})}]}:{exists:true,id:'alice',data:()=>({role:'student'})},
  create:(...a)=>calls.push(['create',...a]),set:(...a)=>calls.push(['set',...a]),update:(...a)=>calls.push(['update',...a])};
 const store=createAssessmentStore({doc:path=>path,collection:()=>query,runTransaction:fn=>fn(raw)},()=> 'server-time');
 await store.runTransaction(async tx=>{assert.equal((await tx.get('users/alice')).role,'student');assert.equal((await tx.list('questions','quizId','q1'))[0].id,'q1');tx.create('serverAssessmentAttempts/a',{x:1});assert.equal(tx.timestamp(),'server-time');});
 assert.ok(calls.some(call=>call[0]==='limit'&&call[1]===401));assert.ok(calls.some(call=>call[0]==='create'));
});
test('deployment, origin, identity and App Check gates reject before service access',async()=>{
 const [, {createAssessmentProcessor}, {deploymentConfig}]=await modules;
 assert.throws(()=>deploymentConfig({}),/not approved/);
 assert.throws(()=>deploymentConfig({ASSESSMENT_ACTIVATION_APPROVED:'true',GOOGLE_CLOUD_PROJECT:'lakbaypanahon-1797e',ASSESSMENT_ALLOWED_ORIGINS:'https://school.example',GOOGLE_APPLICATION_CREDENTIALS:require('node:path').resolve('secret.json')}),/outside/);
 let called=0,verified=0;
 const processor=createAssessmentProcessor({verifyIdToken:async(token,revoked)=>{assert.equal(revoked,true);verified++;return{uid:'alice'};},verifyAppCheck:async()=>{},service:{start:async uid=>{assert.equal(uid,'alice');called++;return{ok:true};}}},{allowedOrigins:['https://school.example']});
 const req={method:'POST',path:'/api/assessment/start',headers:{origin:'https://school.example',authorization:'Bearer verified.token','x-firebase-appcheck':'verified-check','content-type':'application/json'},body:first};
 assert.equal((await processor({...req,headers:{...req.headers,origin:'https://evil.example'}})).status,403);assert.equal(called,0);assert.equal(verified,0);
 assert.equal((await processor({...req,headers:{...req.headers,authorization:''}})).status,401);assert.equal(called,0);
 assert.equal((await processor({...req,method:'OPTIONS'})).status,204);assert.equal(verified,0);
 assert.equal((await processor(req)).status,200);assert.equal(called,1);
 const rejected=createAssessmentProcessor({verifyIdToken:async()=>({uid:'alice'}),verifyAppCheck:async()=>{throw Error('Private credential details');},service:{start:()=>{throw Error('Must not run');}}},{allowedOrigins:['https://school.example']});
 const denial=await rejected(req);assert.equal(denial.status,401);assert.ok(!JSON.stringify(denial).includes('credential details'));
});

test('HTTP parsing limits bodies, rejects duplicate credentials, drains late errors and bounds response time',async()=>{
 const [,, {createNodeHandler}]=await modules,{EventEmitter}=require('node:events');
 function request(processor,changes={},options={}){
  const req=Object.assign(new EventEmitter(),{method:'POST',url:'/api/assessment/start',headers:{'content-type':'application/json'},rawHeaders:[],resume(){this.resumed=true;},...changes});
  let resolve;const done=new Promise(r=>{resolve=r;});
  const res=Object.assign(new EventEmitter(),{destroyed:false,status:null,headers:null,body:null,writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body;resolve(this);}});
  createNodeHandler(processor,{timeoutMs:30,maxBytes:100,...options})(req,res);return{req,res,done};
 }
 let calls=0;const processor=async request=>{calls++;return{status:200,body:{kind:request.body.kind}};};
 const valid=request(processor);valid.req.emit('data',Buffer.from('{"kind":"mission"}'));valid.req.emit('end');assert.equal((await valid.done).status,200);
 const invalid=request(processor);invalid.req.emit('data',Buffer.from('{bad'));invalid.req.emit('end');assert.equal((await invalid.done).status,400);assert.equal(calls,1);
 const duplicate=request(processor,{rawHeaders:['Authorization','a','authorization','b']});assert.equal((await duplicate.done).status,400);assert.equal(duplicate.req.resumed,true);assert.doesNotThrow(()=>duplicate.req.emit('error',Error('late private error')));
 const large=request(processor);large.req.emit('data',Buffer.alloc(101));assert.equal((await large.done).status,413);large.req.emit('error',Error('late'));assert.equal(calls,1);
 let finish;const slow=request(()=>new Promise(resolve=>{finish=resolve;}));slow.req.emit('data',Buffer.from('{}'));slow.req.emit('end');
 assert.equal((await slow.done).status,504);finish({status:200,body:{private:'late'}});await Promise.resolve();assert.equal(slow.res.status,504);assert.ok(!slow.res.body.includes('private'));
});
