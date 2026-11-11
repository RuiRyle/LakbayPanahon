// Local demo emulator only. All writes belong to a temporary fixture account.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const project='demo-lakbay-local',root='http://127.0.0.1:8180/v1/projects/'+project+'/databases/(default)/documents',authRoot='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/';
const tag='class-edge-'+Date.now(),classId=tag,assignmentId=tag+'-assignment',checks=[],keys=[];let studentAccount,lastSubmission;const receiptOnly=process.argv.includes('--receipt-only');
function field(v){if(v instanceof Date)return {timestampValue:v.toISOString()};if(typeof v==='number')return {integerValue:String(v)};if(typeof v==='boolean')return {booleanValue:v};if(typeof v==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,field(x)]))}};return {stringValue:v};}
async function admin(path,method='GET',value){const response=await fetch(root+'/'+path,{method,headers:{Authorization:'Bearer owner','Content-Type':'application/json'},...(value?{body:JSON.stringify(value)}:{}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Local fixture '+method+' failed: '+response.status);return response.json().catch(()=>({}));}
async function seed(path,value){if(!keys.includes(path))keys.push(path);return admin(path,'PATCH',{fields:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,field(v)]))});}
async function callable(name,data){const response=await fetch('http://127.0.0.1:5001/'+project+'/asia-southeast1/'+name,{method:'POST',headers:{Authorization:'Bearer '+studentAccount.idToken,'Content-Type':'application/json'},body:JSON.stringify({data}),signal:AbortSignal.timeout(30000)});const value=await response.json();if(!response.ok)throw Error(JSON.stringify(value));return value.result;}
const identity={kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission1',quizId:'prologue-quiz1',classroom:{classId,assignmentId}};
const receipt=value=>{const {replayed,...saved}=value;return saved;};
const start=()=>callable('startStudentAssessment',{...identity,requestId:randomUUID()});
const advance=state=>callable('advanceStudentAssessment',{attemptId:state.attemptId,revision:state.revision,requestId:randomUUID(),action:'answer',questionId:state.questions[0].id,answer:'A'});
function check(value,label){assert.ok(value,label);checks.push(label);console.log('PASS: '+label);}
async function reject(work,code,label){await assert.rejects(work,new RegExp(code));check(true,label);}
async function complete(context){
 let state=await callable('startStudentAssessment',{kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission1',quizId:'prologue-quiz1',requestId:require('crypto').randomUUID(),...(context?{classroom:context}:{})});
 const answer=async q=>{const record=await admin('questions/'+q.id).catch(()=>null)||await admin('practiceQuestions/'+q.id);const raw=record.fields;if(raw.gameType?.stringValue==='matching')return {gameType:'matching',matches:Object.fromEntries(raw.matchingPairs.arrayValue.values.map(v=>[v.mapValue.fields.left.stringValue,v.mapValue.fields.right.stringValue]))};if(raw.gameType?.stringValue==='tradeSimulation')return {gameType:'tradeSimulation',quantity:Number(raw.requiredQuantity.integerValue)};if(raw.evidenceTask)return {gameType:'evidenceDecision',evidenceId:raw.evidenceTask.mapValue.fields.correctEvidenceId.stringValue,conclusion:raw.correctAnswer.stringValue};return raw.correctAnswer.stringValue;};
 for(let i=0;i<state.questions.length;i++)state=await callable('advanceStudentAssessment',{attemptId:state.attemptId,revision:state.revision,requestId:require('crypto').randomUUID(),action:'answer',questionId:state.questions[i].id,answer:await answer(state.questions[i])});
 if(state.followupLimit){state=await callable('advanceStudentAssessment',{attemptId:state.attemptId,revision:state.revision,requestId:require('crypto').randomUUID(),action:'followupStart'});for(let i=0;i<state.followupLimit;i++){if(i)state=await callable('advanceStudentAssessment',{attemptId:state.attemptId,revision:state.revision,requestId:require('crypto').randomUUID(),action:'followupNext'});const q=state.followupQuestions.at(-1);state=await callable('advanceStudentAssessment',{attemptId:state.attemptId,revision:state.revision,requestId:require('crypto').randomUUID(),action:'followupAnswer',questionId:q.id,answer:await answer(q)});}}
 lastSubmission={attemptId:state.attemptId,revision:state.revision};
 if(receiptOnly){const results=await Promise.all([callable('submitStudentActivity',lastSubmission),callable('submitStudentActivity',lastSubmission),callable('submitStudentActivity',lastSubmission)]);assert.deepEqual(receipt(results[0]),receipt(results[1]));assert.deepEqual(receipt(results[1]),receipt(results[2]));check(true,'concurrent completed submissions return an identical receipt');return results[0];}
 return callable('submitStudentActivity',lastSubmission);
}
(async()=>{
 const signup=await fetch(authRoot+'accounts:signUp?key=local-emulator-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:tag+'@example.com',password:'TemporaryLocal123!',returnSecureToken:true})});studentAccount=await signup.json();assert.ok(studentAccount.localId);const uid=studentAccount.localId;
 await seed('users/'+uid,{role:'student',status:'active',firstName:'Temporary',lastName:'Edge',xp:0,level:1});
 const joinedAt=new Date(Date.now()-60000),publishedAt=new Date(Date.now()-50000);
 const member={userId:uid,classId,status:'active',joinedAt};
 let assignment={classId,teacherId:'local-fixture',chapterId:identity.chapterId,missionId:identity.missionId,status:'published',publishedAt,submissionVersion:1};
 await seed('classes/'+classId,{teacherId:'local-fixture',name:'Temporary edge checks',status:'active'});await seed('classMembers/'+uid+'_'+classId,member);await seed('classAssignments/'+assignmentId,assignment);
 if(!receiptOnly){let state=await start();assignment={...assignment,submissionVersion:2};await seed('classAssignments/'+assignmentId,assignment);
 await reject(()=>advance(state),'classroom-changed','assignment revision invalidates an in-progress quiz');
 state=await start();await admin('classMembers/'+uid+'_'+classId,'DELETE');
 await reject(()=>advance(state),'classroom-unavailable','removed student cannot advance a pending classroom quiz');
 await seed('classMembers/'+uid+'_'+classId,{...member,joinedAt:new Date()});await new Promise(r=>setTimeout(r,5));
 await reject(()=>advance(state),'classroom-changed','rejoining does not revive a quiz issued under old membership');
 state=await start();assignment={...assignment,status:'closed',endedAt:new Date()};await seed('classAssignments/'+assignmentId,assignment);
 await reject(()=>advance(state),'classroom-unavailable','closing an assignment blocks its pending quiz');
 await reject(()=>start(),'classroom-unavailable','closed assignment cannot issue a new quiz');
 assignment={...assignment,status:'published',submissionVersion:3,publishedAt:new Date(Date.now()-1)};delete assignment.endedAt;await seed('classAssignments/'+assignmentId,assignment);await new Promise(r=>setTimeout(r,5));
 console.log('Waiting for the next local rate-limit window; protection remains enabled.');await new Promise(r=>setTimeout(r,61000));
 state=await start();const request={attemptId:state.attemptId,revision:state.revision,requestId:randomUUID(),action:'answer',questionId:state.questions[0].id,answer:'A'};
 const first=await callable('advanceStudentAssessment',request),again=await callable('advanceStudentAssessment',request);
 check(first.revision===again.revision,'repeated answer request replays the same revision');
 }
 const result=await complete({classId,assignmentId});check(result.passed,receiptOnly?'concurrent classroom submission completes successfully':'fresh valid classroom attempt can complete after earlier invalidated attempts');
 if(receiptOnly){const uid=studentAccount.localId,profile=await admin('users/'+uid),xp=profile.fields.xp.integerValue;const replay=await callable('submitStudentActivity',lastSubmission);assert.deepEqual(receipt(replay),receipt(result));assert.equal((await admin('users/'+uid)).fields.xp.integerValue,xp);check(true,'replayed completion preserves receipt and does not award XP again');const data=await admin('studentQuizAttempts?pageSize=1000');check((data.documents||[]).filter(d=>d.fields?.userId?.stringValue===uid).length===1,'concurrent submission writes one public quiz attempt');}
})().catch(error=>{process.exitCode=1;console.error(error.stack);checks.push({error:error.message});}).finally(async()=>{
 let clean=true;
 if(studentAccount?.localId){const uid=studentAccount.localId;
 for(const collection of ['studentProgress','studentQuizAttempts','serverAssessmentAttempts','serverAssessmentRequests','serverAssessmentHistory','serverAssessmentUsage','studentLearningDrafts','studentArtifacts','studentBadges','teacherStudentLinks']){try{let pageToken;do{const data=await admin(collection+'?pageSize=1000'+(pageToken?'&pageToken='+encodeURIComponent(pageToken):''));for(const row of data.documents||[])if(row.fields?.userId?.stringValue===uid)await admin(collection+'/'+row.name.split('/').at(-1),'DELETE');pageToken=data.nextPageToken;}while(pageToken);}catch{clean=false;}}
 for(const key of keys.reverse())try{await admin(key,'DELETE');}catch{clean=false;}
 try{const response=await fetch(authRoot+'accounts:delete?key=local-emulator-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:studentAccount.idToken})});if(!response.ok)clean=false;}catch{clean=false;}}
 if(!clean)process.exitCode=1;fs.writeFileSync(receiptOnly?'docs/validation/classroom-receipt-local-2026-11-11.json':'docs/validation/classroom-edge-local-2026-11-11.json',JSON.stringify({verifiedAt:new Date().toISOString(),pass:!process.exitCode,mode:'actual local Functions, Firestore and Auth; temporary fixture only',checks,cleanupCompleted:clean,limits:['Owner REST seeds mutations; does not certify teacher UI/security rules for each mutation','Answers supplied programmatically; not a learner usability test','Replayed requests simulate a lost response; not an actual network disconnection']},null,2));
});
