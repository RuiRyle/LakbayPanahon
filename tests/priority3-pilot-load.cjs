// Dedicated loopback demo only. Never run with a real project/database.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{randomUUID}=require('crypto'),{createRequire}=require('module');
const root=path.resolve(__dirname,'..'),rf=createRequire(path.join(root,'build/priority3-release/functions/package.json'));
assert.equal(process.env.GCLOUD_PROJECT,'demo-lakbaypanahon');assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8180');assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');
const {initializeApp,deleteApp}=rf('firebase-admin/app'),{getFirestore,FieldValue,Timestamp}=rf('firebase-admin/firestore'),{getAuth}=rf('firebase-admin/auth');
const app=initializeApp({projectId:'demo-lakbaypanahon'}),db=getFirestore(app),auth=getAuth(app),metrics=[],checks=[];
const adapterMode=process.env.PILOT_LOAD_MODE==='adapter';
let localHandlers;
if(adapterMode){process.env.FUNCTIONS_EMULATOR='true';localHandlers=rf('./assessment-callables.js').assessmentHandlers(db,()=>FieldValue.serverTimestamp());}
const methods={startStudentAssessment:'start',advanceStudentAssessment:'advance',resumeStudentAssessment:'resume',submitStudentActivity:'submit'};
const decode=v=>'stringValue'in v?v.stringValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'booleanValue'in v?v.booleanValue:'arrayValue'in v?(v.arrayValue.values||[]).map(decode):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,v])=>[k,decode(v)])):'nullValue'in v?null:v.timestampValue;
const catalog=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(root,'build/priority3-audit/readiness-catalog.json')))).map(([c,rows])=>[c,rows.map(row=>({id:row.id,...Object.fromEntries(Object.entries(row._fields).map(([k,v])=>[k,decode(v)]))}))]));
const mission=catalog.missions.find(x=>x.id==='mission-1'),quiz=catalog.quizzes.find(q=>q.missionId===mission.id&&q.status==='active'),bank=catalog.questions.filter(q=>q.quizId===quiz.id&&q.status==='active'),practice=catalog.practiceQuestions.filter(q=>q.missionId===mission.id&&q.status==='active');
const keyMap=new Map([...bank,...practice].map(q=>[q.id,q])),identity={kind:'mission',chapterId:mission.chapterId,missionId:mission.id,quizId:quiz.id};
function limiter(cap){let count=0;const queue=[];return async fn=>{if(count>=cap)await new Promise(r=>queue.push(r));count++;try{return await fn();}finally{count--;queue.shift()?.();}};}
const gates=Object.fromEntries(['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'].map(n=>[n,limiter(16)]));
let label='setup';
async function call(name,data,token,{retry=true}={}){
 const queued=performance.now();return gates[name](async()=>{const admitted=performance.now();for(let n=0;;n++){
  const t=performance.now();let body,status,error;
  try{
   if(adapterMode){const decoded=await auth.verifyIdToken(token);body={result:await localHandlers[methods[name]]({auth:{uid:decoded.uid},rawRequest:{headers:{authorization:'Bearer '+token}},data})};status=200;}
   else{const response=await fetch(`http://127.0.0.1:5001/demo-lakbaypanahon/asia-southeast1/${name}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data}),signal:AbortSignal.timeout(70000)});status=response.status;body=await response.json();if(body.error)error=body.error;}
  }catch(e){status=e.code==='unavailable'?503:e.code==='resource-exhausted'?429:e.code==='permission-denied'?403:e.code?400:undefined;error={message:e.message,details:e.details,status:status||'transport'};}
  metrics.push({phase:label,name,queueMs:admitted-queued,serviceMs:performance.now()-t,totalMs:performance.now()-queued,retry:n,status,error:error?.details?.assessmentCode||error?.message||null});
  if(!error)return body.result;
  if(retry&&n<2&&[429,500,503,504,undefined].includes(status)){await new Promise(r=>setTimeout(r,250*(n+1)));continue;}
  throw Object.assign(Error(error.message),{assessmentCode:error.details?.assessmentCode,status});
 }});
}
async function fixtureUser(uid,xp=0){
 const email=uid+'@pilot.invalid',password='Isolated-load-fixture-7362';await auth.createUser({uid,email,password});await db.doc('users/'+uid).set({role:'student',status:'active',firstName:'Synthetic',lastName:'Pilot',email,xp,level:Math.floor(xp/100)+1});
 const chapter=catalog.chapters.find(c=>c.id===mission.chapterId),era=catalog.eras.find(e=>e.id===chapter.eraId),prerequisites=new Set([...era.requiredChapterIds,...catalog.chapters.filter(c=>c.eraId===chapter.eraId&&c.order<chapter.order&&c.requiredForProgression!==false&&c.status==='active').map(c=>c.id)]);
 for(const chapterId of prerequisites)await db.doc('studentChapterProgress/'+uid+'_'+chapterId).set({userId:uid,chapterId,completed:true,bestScore:100});
 const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const b=await r.json();assert.ok(r.ok);return{uid,token:b.idToken};
}
const action=(u,s,data)=>call('advanceStudentAssessment',{attemptId:s.attemptId,revision:s.revision,requestId:randomUUID(),...data},u.token);
async function issue(u){return call('startStudentAssessment',{...identity,requestId:randomUUID()},u.token);}
async function finish(u,s,wrong=0,{recover=false}={}){
 const missed=[],shared=await import('../functions/assessment-shared/mission-assessment.mjs');
 for(let i=0;i<5;i++){
  const q=s.questions[i],original=keyMap.get(q.id),answer=i<wrong?['A','B','C','D'].find(x=>x!==original.correctAnswer):original.correctAnswer;
  if(i<wrong)missed.push(q.topic);
  const data={attemptId:s.attemptId,revision:s.revision,requestId:randomUUID(),action:'answer',questionId:q.id,answer};
  const before=s;s=await call('advanceStudentAssessment',data,u.token);
  assert.equal(s.questions.length,5);assert.equal(new Set(s.questions.map(x=>x.id)).size,5);
  if(i<4){
   const levels=['easy','medium','hard'].filter(level=>bank.some(q=>q.difficulty===level)),mastery=s.topicMastery||{},states=Object.values(mastery),count=states.reduce((n,x)=>n+(x.attempted||0),0),right=states.reduce((n,x)=>n+(x.correct||0),0);
   let wanted=states.some(x=>x.missed>0)?s.practicePolicy.reviewDifficulty:s.practicePolicy.startDifficulty;
   if(count){if(right/count>=s.practicePolicy.promoteAccuracy)wanted=levels.at(-1);else if(right/count<=s.practicePolicy.demoteAccuracy)wanted=levels[0];}
   if(!levels.includes(wanted))wanted=levels[Math.floor((levels.length-1)/2)];
   const remaining=new Map(quiz.questionBlueprint.map(x=>[x.topic,x.count])),weights=Object.fromEntries(Object.entries(mastery).map(([k,v])=>[k,v.missed||0])),attempts=Object.fromEntries(Object.entries(mastery).map(([k,v])=>[k,v.attempted||0])),prefix=s.questions.slice(0,i+1);
   for(const q of prefix){remaining.set(q.topic,remaining.get(q.topic)-1);const correct=s.answers[q.id]===keyMap.get(q.id).correctAnswer;weights[q.topic]=Math.max(0,(weights[q.topic]||0)+(correct?-1:1));attempts[q.topic]=(attempts[q.topic]||0)+1;wanted=shared.nextAdaptiveDifficulty(wanted,correct,levels);}
   const expected=shared.selectAdaptiveQuestion(bank.filter(q=>remaining.get(q.topic)>0),{usedIds:prefix.map(q=>q.id),topicWeights:weights,topicAttempts:attempts,targetDifficulty:wanted,difficultyLevels:levels,random:()=>0});
   assert.equal(s.questions[i+1].topic,expected.topic);assert.equal(Math.abs(levels.indexOf(s.questions[i+1].difficulty)-levels.indexOf(wanted)),Math.abs(levels.indexOf(expected.difficulty)-levels.indexOf(wanted)));
  }
  if(recover&&i===1){const replay=await call('advanceStudentAssessment',data,u.token);assert.equal(replay.revision,s.revision);const restored=await call('resumeStudentAssessment',{attemptId:s.attemptId},u.token);assert.deepEqual(restored.answers,s.answers);assert.deepEqual(restored.questions.map(x=>x.id),s.questions.map(x=>x.id));s=restored;
   await assert.rejects(call('advanceStudentAssessment',{attemptId:s.attemptId,revision:before.revision,requestId:randomUUID(),action:'answer',questionId:q.id,answer},u.token,{retry:false}),e=>/revision-conflict/.test(e.assessmentCode));
  }
 }
 shared.validateAdaptiveQuestionSet(bank,quiz,s.questions.map(x=>x.id));
 s=await action(u,s,{action:'followupStart'});
 if(missed.length&&s.followupQuestions.length){assert.ok(missed.includes(s.followupQuestions[0].topic));assert.equal(s.followupQuestions[0].difficulty,s.practicePolicy.reviewDifficulty);}
 for(let i=0;i<s.followupLimit;i++){const q=s.followupQuestions.at(-1);s=await action(u,s,{action:'followupAnswer',questionId:q.id,answer:keyMap.get(q.id).correctAnswer});if(i+1<s.followupLimit)s=await action(u,s,{action:'followupNext'});}
 return s;
}
const submit=(u,s)=>call('submitStudentActivity',{attemptId:s.attemptId,revision:s.revision},u.token);
function stats(rows){const sorted=rows.slice().sort((a,b)=>a-b),at=p=>sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]||0;return{count:sorted.length,p50Ms:at(.5),p95Ms:at(.95),p99Ms:at(.99),maxMs:at(1)};}
async function seedLocalCatalog(){
 const clear=await fetch('http://127.0.0.1:8180/emulator/v1/projects/demo-lakbaypanahon/databases/(default)/documents',{method:'DELETE'});assert.ok(clear.ok);
 const docs=Object.entries(catalog).flatMap(([c,rows])=>rows.map(row=>{const {id,...fields}=row;return[c+'/'+id,fields];}));
 docs.push(['learningSettings/progression',{xpPerLevel:100,version:1}],['learningSettings/securedAssessment',{enabled:true,protocolVersion:1,attemptTtlSeconds:7200,perMinuteAttempts:3,perStudentDailyAttempts:60}]);
 for(let i=0;i<docs.length;i+=400){const b=db.batch();for(const [p,d]of docs.slice(i,i+400))b.set(db.doc(p),d);await b.commit();}
}
async function main(){
 await seedLocalCatalog();
 const users=[];for(let i=0;i<30;i++)users.push(await fixtureUser('pilot-'+String(i).padStart(2,'0')));
 label='thirty-student-concurrent';const started=performance.now();
 const results=await Promise.all(users.map(async(u,i)=>{
  const wrong=i<10?0:i<20?2:3;let s=await issue(u);assert.ok(s.expiresAt-Date.now()>7100000&&s.expiresAt-Date.now()<=7200000);
  s=await finish(u,s,wrong,{recover:i%3===0});let r=await submit(u,s);assert.equal(r.score,(5-wrong)*20);
  if(!r.passed){assert.equal((await db.doc('users/'+u.uid).get()).data().xp,0);s=await finish(u,await issue(u),0);r=await submit(u,s);assert.equal(r.passed,true);}
  const duplicate=await submit(u,s);assert.equal(duplicate.totalXp,mission.xpReward);assert.equal((await db.doc('users/'+u.uid).get()).data().xp,mission.xpReward);return{uid:u.uid,score:r.score,xp:r.totalXp};
 }));
 checks.push('30 actual Auth users: simultaneous full-catalog assessments; correct/wrong/repeated mistakes; failure then retry; exact XP; five-question quotas; weak-topic/review difficulty; saved answer resume; delayed stale revision rejection; lost-acknowledgement action/result replay');
 const classElapsedMs=performance.now()-started;
 label='same-profile-contention';const u=await fixtureUser('pilot-contention'),states=await Promise.all([issue(u),issue(u)]),complete=await Promise.all(states.map(s=>finish(u,s,0)));
 const {createAssessmentService,assessmentStore}=require('../build/priority3-release/functions/student-assessment');
 const raw=assessmentStore(db,()=>FieldValue.serverTimestamp());let transactions=0,callbacks=0;
 const instrumented={run:fn=>{transactions++;return raw.run(tx=>{callbacks++;return fn(tx);});}};
 const service=createAssessmentService(instrumented),t=performance.now();
 const writes=await Promise.all([...complete,...complete,...complete].map(s=>service.submit(u.uid,{attemptId:s.attemptId,revision:s.revision})));
 const contentionElapsedMs=performance.now()-t;
 assert.equal(writes.filter(x=>x.xpReward>0&&!x.replayed).length,1);assert.equal((await db.doc('users/'+u.uid).get()).data().xp,mission.xpReward);
 checks.push('Six concurrent real Firestore result transactions across two passing attempts share a profile: one XP award and one canonical completion');
 label='legacy-compatibility';const old=await fixtureUser('pilot-legacy',777),artifact=catalog.artifacts.find(x=>x.missionId===mission.id),stamp=Timestamp.fromMillis(1000);
 await db.doc('studentProgress/'+old.uid+'_'+mission.id).set({userId:old.uid,missionId:mission.id,chapterId:mission.chapterId,completed:true,bestScore:100,completedAt:stamp});
 if(artifact)await db.doc('studentArtifacts/'+old.uid+'_'+artifact.id).set({userId:old.uid,artifactId:artifact.id,earnedAt:stamp});
 const legacy=await submit(old,await finish(old,await issue(old),0));assert.equal(legacy.totalXp,777);assert.equal(legacy.xpReward,0);const saved=(await db.doc('studentProgress/'+old.uid+'_'+mission.id).get()).data();assert.equal(saved.bestScore,100);assert.equal(saved.completedAt.toMillis(),1000);if(artifact)assert.equal((await db.doc('studentArtifacts/'+old.uid+'_'+artifact.id).get()).data().earnedAt.toMillis(),1000);
 checks.push('Legacy XP 777, best score 100, completion and earned timestamps retained; replay adds no XP');
 label='policy-boundaries';const quota=await fixtureUser('pilot-quota');for(let i=0;i<3;i++)await issue(quota);await assert.rejects(issue(quota),e=>/rate-limit/.test(e.assessmentCode));
 const expired=await fixtureUser('pilot-expired'),attempt=await issue(expired);await db.doc('serverAssessmentAttempts/'+expired.uid+'_'+attempt.attemptId).update({expiresAt:Date.now()-1});await assert.rejects(call('resumeStudentAssessment',{attemptId:attempt.attemptId},expired.token),e=>/expired/.test(e.assessmentCode));assert.equal((await db.doc('users/'+expired.uid).get()).data().xp,0);
 checks.push('Three new starts/minute accepted and fourth denied; two-hour issuance TTL observed; explicitly expired unfinished attempt fails without rewards');
 const phases=[...new Set(metrics.map(x=>x.phase))],summary={status:'pass',mode:adapterMode?'single-process-trusted-callable-adapter-real-Auth-and-Firestore':'functions-HTTP',project:'demo-lakbaypanahon',students:30,catalogCounts:Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.length])),checks,results,classElapsedMs,contention:{concurrentSubmissions:6,transactionInvocations:transactions,callbackExecutions:callbacks,retriedCallbacks:callbacks-transactions,elapsedMs:contentionElapsedMs},admission:{perCallable:16,interpretation:'Client-side admission slots approximate aggregate 2x8 in-flight capacity, not real Cloud Run instances/concurrency or cold starts'},timing:phases.map(phase=>({phase,byEndpoint:[...new Set(metrics.filter(r=>r.phase===phase).map(r=>r.name))].map(name=>{const rows=metrics.filter(r=>r.phase===phase&&r.name===name);return{name,service:stats(rows.map(x=>x.serviceMs)),endToEnd:stats(rows.map(x=>x.totalMs)),errors:rows.filter(x=>x.error).length,retryCalls:rows.filter(x=>x.retry>0).length};})})),limitations:['No production traffic, App Check provider, Cloud Run scaling or physical devices.','No thinking time; full educational snapshot but shallow synthetic student histories.','Actual per-student all-endpoint rate limiter is not implemented; start policy only.','Client admission is not server-side enforcement and adds observable queue time.','Adapter mode excludes HTTP gateway and Functions emulator worker-spawn overhead; real HTTP transport has a separate regression gate.']};
 fs.writeFileSync(path.join(root,'docs/validation/priority-3-pilot-load-2026-11-07.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
}
if(require.main===module)main().catch(e=>{fs.writeFileSync(path.join(root,'docs/validation/priority-3-pilot-load-2026-11-07.json'),JSON.stringify({status:'fail',error:e.stack,metrics,checks},null,2));console.error(e);process.exitCode=1;}).finally(async()=>{await db.terminate();await deleteApp(app);});
module.exports={seedLocalCatalog,fixtureUser,issue,finish,submit,call,db,app,mission,catalog,identity};
