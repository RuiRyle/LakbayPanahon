const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),{randomUUID}=require('node:crypto');
const {createAssessmentService}=require('../functions/student-assessment');
const ms=1700000000000,stamp=n=>({toMillis:()=>n});
const context=vm.createContext({});vm.runInContext(fs.readFileSync('js/classroom-submission-policy.js','utf8').replace(/export /g,''),context);
vm.runInContext(fs.readFileSync('js/teacher-class-policy.js','utf8').replace(/export /g,''),context);
function fixture(){
 let now=ms;const rows=new Map(),add=(p,v)=>rows.set(p,v);
 add('users/u',{role:'student',status:'active',xp:25,level:1});add('learningSettings/securedAssessment',{enabled:true,protocolVersion:1,attemptTtlSeconds:600,perStudentDailyAttempts:50,perMinuteAttempts:20});add('learningSettings/progression',{version:1,xpPerLevel:100});
 add('eras/e',{status:'active',requiredChapterIds:[]});add('chapters/c',{status:'active',eraId:'e',order:1});add('missions/m',{status:'active',chapterId:'c',order:1,xpReward:25});
 add('studentProgress/u_m',{userId:'u',chapterId:'c',missionId:'m',completed:true,bestScore:100});
 add('quizzes/q',{status:'active',missionId:'m',questionCount:5,passingScore:60,questionBlueprint:[{topic:'t',difficulty:'medium',count:5}]});
 for(let i=0;i<5;i++)add('questions/q'+i,{status:'active',quizId:'q',topic:'t',difficulty:'medium',question:'Question '+i,optionA:'Correct',optionB:'Other',optionC:'Other C',optionD:'Other D',correctAnswer:'A',order:i});
 add('classes/class',{status:'active'});add('classMembers/u_class',{userId:'u',classId:'class',status:'active',joinedAt:stamp(ms-1000)});
 add('classAssignments/a',{classId:'class',chapterId:'c',missionId:'m',status:'published',publishedAt:stamp(ms-2000),submissionVersion:1});
 const store={run:async fn=>{const writes=[];const tx={get:async p=>rows.has(p)?{...rows.get(p),id:p.split('/')[1]}:null,list:async(c,k,v)=>[...rows].filter(([p,r])=>p.startsWith(c+'/')&&r[k]===v).map(([p,r])=>({...r,id:p.split('/')[1]})),create:(p,v)=>writes.push([p,v]),set:(p,v)=>writes.push([p,v]),update:(p,v)=>writes.push([p,{...rows.get(p),...v}]),stamp:()=>stamp(now),timestamp:()=>stamp(now)};const value=await fn(tx);for(const [p,v]of writes)rows.set(p,v);return value;}};
 return {rows,service:createAssessmentService(store,{clock:()=>now,newId:randomUUID,random:()=>.3}),advance:()=>now+=500,identity:{kind:'mission',chapterId:'c',missionId:'m',quizId:'q',classroom:{classId:'class',assignmentId:'a'}}};
}
test('solo completion and unrelated attempts cannot complete a classroom assignment',()=>{
 const assignment={id:'a',classId:'class',chapterId:'c',missionId:'m',status:'published',publishedAt:stamp(ms-2000),submissionVersion:1},member={userId:'u',classId:'class',status:'active',joinedAt:stamp(ms-1000)};
 const solo={id:'solo',userId:'u',chapterId:'c',missionId:'m',passed:true,score:100,completedAt:stamp(ms)};
 assert.equal(context.classroomAssignmentEvidence(assignment,[solo],member,'u',ms).completed,false);
 const linked={...solo,classroom:{classId:'class',assignmentId:'a',version:1,joinedAtKey:'ms:'+(ms-1000),assignedAt:ms-2000,issuedAt:ms-500}};
 assert.equal(context.classroomAssignmentEvidence(assignment,[linked],member,'u',ms).completed,true);
 for(const patch of [{assignmentId:'other'},{classId:'other'},{version:2},{joinedAtKey:'old'},{issuedAt:ms-3000}])assert.equal(context.classroomAssignmentEvidence(assignment,[{...linked,classroom:{...linked.classroom,...patch}}],member,'u',ms).completed,false);
 assert.equal(context.classroomAssignmentEvidence({...assignment,submissionVersion:2},[linked],member,'u',ms).completed,false);
});
test('trusted issuance binds classroom context and rejects revisions, removal and invented assignments',async()=>{
 const f=fixture(),issued=await f.service.start('u',{...f.identity,requestId:randomUUID()});assert.equal(issued.classroom.assignmentId,'a');assert.equal(issued.classroom.version,1);
 f.rows.get('classAssignments/a').submissionVersion=2;await assert.rejects(()=>f.service.resume('u',{attemptId:issued.attemptId}),e=>e.code==='assessment/classroom-changed');
 f.rows.get('classAssignments/a').submissionVersion=1;f.rows.delete('classMembers/u_class');await assert.rejects(()=>f.service.resume('u',{attemptId:issued.attemptId}),e=>e.code==='assessment/classroom-unavailable');
 await assert.rejects(()=>f.service.start('u',{...f.identity,classroom:{classId:'class',assignmentId:'invented'},requestId:randomUUID()}));
});
test('fresh classroom submission saves its linkage without repeating personal XP',async()=>{
 const f=fixture();let issued=await f.service.start('u',{...f.identity,requestId:randomUUID()});
 for(let i=0;i<5;i++){const question=issued.questions[i];issued=await f.service.advance('u',{attemptId:issued.attemptId,revision:issued.revision,requestId:randomUUID(),action:'answer',questionId:question.id,answer:'A'});}
 f.advance();const result=await f.service.submit('u',{attemptId:issued.attemptId,revision:issued.revision});
 assert.equal(result.passed,true);assert.equal(result.xpReward,0);assert.equal(f.rows.get('users/u').xp,25);
 const saved=f.rows.get('studentQuizAttempts/u_'+issued.attemptId);assert.equal(saved.classroom.assignmentId,'a');assert.equal(saved.classroom.version,1);
 const evidence=context.classroomAssignmentEvidence({...f.rows.get('classAssignments/a'),id:'a'},[{...saved,id:'result'}],f.rows.get('classMembers/u_class'),'u',ms+500);assert.equal(evidence.completed,true);
});

test('closed assignment preserves earlier submissions and rejoining preserves their history',()=>{
 const assignment={id:'a',classId:'class',chapterId:'c',missionId:'m',status:'closed',publishedAt:stamp(ms),endedAt:stamp(ms),submissionVersion:1};
 const member={userId:'u',classId:'class',status:'active',joinedAt:stamp(ms-100)};
 const saved={id:'record',userId:'u',chapterId:'c',missionId:'m',passed:true,score:100,completedAt:stamp(ms-300),classroom:{classId:'class',assignmentId:'a',version:1,joinedAtKey:'ms:'+(ms-1000),joinedAt:ms-1000,issuedAt:ms-500,assignedAt:ms-2000}};
 assert.equal(context.classroomAssignmentEvidence(assignment,[saved],member,'u',ms).completed,true);
 assert.equal(context.classroomAssignmentEvidence(assignment,[{...saved,completedAt:stamp(ms+1)}],member,'u',ms).completed,false);
});

test('targeted classroom reviews also reject unrelated solo attempts',()=>{
 const assignment={id:'review',classId:'class',chapterId:'c',missionId:'m',assignedAt:stamp(ms-1000),status:'published'};
 const attempt={id:'result',userId:'u',chapterId:'c',missionId:'m',passed:true,score:100,completedAt:stamp(ms)};
 assert.equal(context.reviewEvidence(assignment,[attempt],'u',ms).completed,false);
 const linked={...attempt,classroom:{classId:'class',assignmentId:'review',version:1,issuedAt:ms-100,joinedAt:ms-2000,assignedAt:ms-1000}};
 assert.equal(context.reviewEvidence(assignment,[linked],'u',ms).completed,true);
});

test('classroom best score and completion survive a lower later retry while latest stays accurate',()=>{
 const assignment={id:'a',classId:'class',chapterId:'c',missionId:'m',status:'published',publishedAt:stamp(ms-2000),submissionVersion:1},member={userId:'u',classId:'class',status:'active',joinedAt:stamp(ms-1000)};
 const attempt={id:'pass',userId:'u',chapterId:'c',missionId:'m',passed:true,score:80,completedAt:stamp(ms-100),classroom:{classId:'class',assignmentId:'a',version:1,joinedAtKey:'ms:'+(ms-1000),assignedAt:ms-2000,issuedAt:ms-500}};
 const evidence=context.classroomAssignmentEvidence(assignment,[attempt,{...attempt,id:'retry',passed:false,score:40,completedAt:stamp(ms)}],member,'u',ms);
 assert.equal(evidence.completed,true);assert.equal(evidence.bestScore,80);assert.equal(evidence.latest,40);assert.equal(evidence.passingAttemptId,'pass');
});

test('editable main questions do not reveal answer keys or explanations before submission',async()=>{const f=fixture();for(let i=0;i<5;i++)Object.assign(f.rows.get('questions/q'+i),{explanation:'PRIVATE_FEEDBACK',answerExplanations:{A:'PRIVATE_FEEDBACK'}});let state=await f.service.start('u',{...f.identity,requestId:randomUUID()});for(let i=0;i<5;i++){assert.ok(state.questions.every(q=>!('correctAnswer' in q)&&!('explanation' in q)&&!('answerExplanations' in q)));const q=state.questions[i];state=await f.service.advance('u',{attemptId:state.attemptId,revision:state.revision,requestId:randomUUID(),action:'answer',questionId:q.id,answer:'A'});assert.ok(!JSON.stringify(state.questions).includes('PRIVATE_FEEDBACK'));}const result=await f.service.submit('u',{attemptId:state.attemptId,revision:state.revision});assert.equal(result.passed,true);const resumed=await f.service.resume('u',{attemptId:state.attemptId});assert.equal(resumed.questions[0].correctAnswer,'A');});

test('chapter issuance supplies playable game fields without grading keys',async()=>{const f=fixture();f.rows.set('chapterChallenges/final',{chapterId:'c',status:'active',passingScore:100});f.rows.set('chapterChallengeQuestions/match',{challengeId:'final',status:'active',order:1,gameType:'matching',question:'Match',matchingPairs:[{left:'First',right:'Two'},{left:'Second',right:'One'}]});f.rows.set('chapterChallengeQuestions/trade',{challengeId:'final',status:'active',order:2,gameType:'tradeSimulation',question:'Trade',startingQuantity:8,requiredQuantity:3,rewardQuantity:1,tradeGood:'crops',rewardGood:'pot'});const issued=await f.service.start('u',{kind:'chapter',chapterId:'c',challengeId:'final',requestId:randomUUID()});const matching=issued.questions.find(q=>q.gameType==='matching'),trade=issued.questions.find(q=>q.gameType==='tradeSimulation');assert.deepEqual(Array.from(matching.matchingLeft),['First','Second']);assert.deepEqual(Array.from(matching.matchingRight),['One','Two']);assert.equal(matching.matchingPairs,undefined);assert.equal(trade.requiredQuantity,undefined);assert.equal(trade.rewardQuantity,1);assert.equal(trade.tradeGood,'crops');assert.equal(trade.rewardGood,'pot');});
