// Audit-only reproductions. Refuses any non-local/non-demo Firestore target.
const {test,beforeEach,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module'),rf=createRequire(path.join(__dirname,'../functions/package.json'));
const {initializeApp,deleteApp}=rf('firebase-admin/app'),{getFirestore}=rf('firebase-admin/firestore');
const project='demo-lakbaypanahon',host=process.env.FIRESTORE_EMULATOR_HOST;
assert.match(host||'',/^(127\.0\.0\.1|localhost):8180$/,'Dedicated local demo emulator required');
const app=initializeApp({projectId:project}),db=getFirestore(app),base=`http://${host}/v1/projects/${project}/databases/(default)/documents`;
const {createStudentRewards}=require('../functions/student-rewards');
const seed={
 'users/alice':{role:'student',status:'active',firstName:'Audit',lastName:'Student',email:'alice@example.com',xp:0,level:1},
 'learningSettings/progression':{xpPerLevel:100,version:1},'eras/e1':{status:'active',requiredChapterIds:[]},
 'chapters/c1':{eraId:'e1',order:1,status:'active',contentReady:true},
 'missions/m1':{chapterId:'c1',order:1,status:'active',xpReward:25},'missions/m2':{chapterId:'c1',order:2,status:'active',xpReward:30},
 'quizzes/quiz1':{missionId:'m1',status:'active',passingScore:60,questionCount:5,questionBlueprint:[{topic:'topic',difficulty:'easy',count:5}]},
 'quizzes/quiz2':{missionId:'m2',status:'active',passingScore:60,questionCount:5,questionBlueprint:[{topic:'topic',difficulty:'easy',count:5}]},
 'artifacts/a1':{missionId:'m1',status:'active'},'artifacts/a2':{missionId:'m2',status:'active'},
 'chapterChallenges/final':{chapterId:'c1',status:'active',passingScore:60},'chapterChallengeQuestions/fq':{challengeId:'final',status:'active',correctAnswer:'A'},'badges/b1':{chapterId:'c1',status:'active'}
};
for(let i=1;i<=10;i++)seed['questions/q'+i]={quizId:'quiz1',status:'active',question:'Existing fixture question '+i,topic:'topic',difficulty:'easy',optionA:'Supported',optionB:'Other',optionC:'Another',optionD:'Fourth',correctAnswer:'A'};
const token=uid=>{const e=x=>Buffer.from(JSON.stringify(x)).toString('base64url');return e({alg:'none',typ:'JWT'})+'.'+e({sub:uid,user_id:uid,aud:project,iss:`https://securetoken.google.com/${project}`,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:'password'}})+'.';};
const encodeValue=x=>x===null?{nullValue:null}:typeof x==='string'?{stringValue:x}:typeof x==='boolean'?{booleanValue:x}:Array.isArray(x)?{arrayValue:{values:x.map(encodeValue)}}:x&&typeof x==='object'?{mapValue:{fields:encodeFields(x)}}:{integerValue:String(x)};
const encodeFields=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,encodeValue(v)]));
const decodeValue=x=>'stringValue'in x?x.stringValue:'booleanValue'in x?x.booleanValue:'integerValue'in x?Number(x.integerValue):'doubleValue'in x?x.doubleValue:'arrayValue'in x?(x.arrayValue.values||[]).map(decodeValue):'mapValue'in x?decodeFields(x.mapValue.fields||{}):{toMillis:()=>Date.parse(x.timestampValue)};
const decodeFields=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,decodeValue(v)]));
const rest=(method,suffix,body,uid='alice')=>fetch(base+(suffix.startsWith(':')?'':'/')+suffix,{method,headers:{Authorization:'Bearer '+token(uid),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
beforeEach(async()=>{const r=await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`,{method:'DELETE'});assert.equal(r.status,200);const batch=db.batch();for(const [key,row]of Object.entries(seed))batch.set(db.doc(key),row);await batch.commit();});
after(async()=>{await db.terminate();await deleteApp(app);});
// Reuse the existing authenticated REST adapter, loading current dependencies.
const old=fs.readFileSync(path.join(__dirname,'student-security.test.cjs'),'utf8');
let adapter=old.slice(old.indexOf('function freeClient('),old.indexOf("test('free-plan client"));
adapter=adapter.replace("['learning-access.js', 'student-rewards-client.js']","['daily-policy.js','progression-policy.js','mission-assessment.js','activity-policy.js','evidence-decision.js','learning-access.js','student-rewards-client.js']");
const freeClient=new Function('vm','fs','path','base','project','rest','encodeValue','encodeFields','decodeFields','__dirname',adapter+';return freeClient;')(vm,fs,path,base,project,rest,encodeValue,encodeFields,decodeFields,__dirname);
let sequence=0;const input=()=>({kind:'mission',chapterId:'c1',missionId:'m1',quizId:'quiz1',attemptId:`11111111-1111-4111-8111-${String(++sequence).padStart(12,'0')}`,questionIds:['q1','q2','q3','q4','q5'],answers:{q1:'A',q2:'A',q3:'A',q4:'A',q5:'A'}});
const write=(name,data,stamp=[],update=false)=>({update:{name:`projects/${project}/databases/(default)/documents/${name}`,fields:encodeFields(data)},...(stamp.length?{updateTransforms:stamp.map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}:{}),...(update?{updateMask:{fieldPaths:[...Object.keys(data),...stamp]}}:{})});
test('CONFIRMED: claimed locked mission completion and configured XP are accepted without a quiz attempt',async()=>{
 const writes=[write('studentProgress/alice_m2',{userId:'alice',chapterId:'c1',missionId:'m2',quizId:'quiz2',completed:true,bestScore:100,xpEarned:30},['completedAt','updatedAt']),write('users/alice',{xp:30,level:1,lastRewardKind:'mission',lastRewardId:'m2'},['updatedAt'],true)];
 const r=await rest('POST',':commit',{writes});assert.equal(r.status,200,await r.text());assert.equal((await db.doc('users/alice').get()).data().xp,30);assert.equal((await db.collection('studentQuizAttempts').get()).size,0);assert.equal((await db.doc('studentProgress/alice_m1').get()).exists,false);
});
test('CONFIRMED: chapter completion and badge are accepted without completed missions or challenge answers',async()=>{
 const r=await rest('POST',':commit',{writes:[write('studentChapterProgress/alice_c1',{userId:'alice',chapterId:'c1',challengeId:'final',completed:true,bestScore:100},['completedAt','updatedAt']),write('studentBadges/alice_b1',{userId:'alice',chapterId:'c1',challengeId:'final',badgeId:'b1'},['earnedAt'])]});assert.equal(r.status,200,await r.text());assert.equal((await db.collection('studentProgress').get()).size,0);
});
test('actual client concurrent distinct and same-attempt submissions award mission XP/artifact once',async()=>{
 const submit=freeClient(),a=input(),b=input();await Promise.all([submit(a),submit(a),submit(b)]);assert.equal((await db.doc('users/alice').get()).data().xp,25);assert.equal((await db.collection('studentArtifacts').get()).size,1);assert.equal((await db.collection('studentQuizAttempts').get()).size,2);
});
test('failure then success then restored replay retains completion and XP',async()=>{
 const submit=freeClient(),failed=input();failed.answers=Object.fromEntries(failed.questionIds.map(id=>[id,'B']));assert.equal((await submit(failed)).passed,false);assert.equal((await db.doc('users/alice').get()).data().xp,0);
 const passed=input();assert.equal((await submit(passed)).xpReward,25);assert.equal((await freeClient()(passed)).totalXp,25);assert.equal((await freeClient()(input())).xpReward,0);assert.equal((await db.collection('studentQuizAttempts').get()).size,3);
});
test('lost commit acknowledgement then reopened replay does not duplicate saved rewards',async()=>{
 const submit=freeClient(),request=input(),originalFetch=global.fetch;let interrupted=false;
 global.fetch=async(url,options)=>{const r=await originalFetch(url,options);if(!interrupted&&String(url).endsWith(':commit')&&options?.headers?.Authorization?.startsWith('Bearer ey')){interrupted=true;throw Error('Simulated lost acknowledgement after commit');}return r;};
 try{await assert.rejects(submit(request),/lost acknowledgement/);}finally{global.fetch=originalFetch;}
 assert.equal((await db.doc('users/alice').get()).data().xp,25);assert.equal((await freeClient()(request)).totalXp,25);assert.equal((await db.collection('studentQuizAttempts').get()).size,1);
});
test('CONFIRMED: callable grades the whole bank and rejects a valid five-question client submission',async()=>{
 const submit=createStudentRewards(db);await assert.rejects(submit({auth:{uid:'alice'},data:input()}),/Answer every question/);assert.equal((await db.doc('users/alice').get()).data().xp,0);
});
test('independent concurrent mission completions add both configured rewards without lost XP',async()=>{
 const batch=db.batch();for(const [key,row]of Object.entries({'eras/e2':{status:'active',requiredChapterIds:[]},'chapters/c2':{eraId:'e2',order:1,status:'active',contentReady:true},'missions/m3':{chapterId:'c2',order:1,status:'active',xpReward:40},'quizzes/quiz3':{...seed['quizzes/quiz1'],missionId:'m3'},'artifacts/a3':{status:'active',missionId:'m3'}}))batch.set(db.doc(key),row);
 for(let i=1;i<=5;i++)batch.set(db.doc('questions/r'+i),{...seed['questions/q'+i],quizId:'quiz3'});await batch.commit();
 const a=input(),b={...input(),chapterId:'c2',missionId:'m3',quizId:'quiz3',questionIds:['r1','r2','r3','r4','r5'],answers:{r1:'A',r2:'A',r3:'A',r4:'A',r5:'A'}};await Promise.all([freeClient()(a),freeClient()(b)]);
 assert.equal((await db.doc('users/alice').get()).data().xp,65);assert.equal((await db.collection('studentArtifacts').get()).size,2);
});
test('interruption before commit is atomic and later retry preserves the configured single reward',async()=>{
 const request=input(),originalFetch=global.fetch;global.fetch=async(url,options)=>{if(String(url).endsWith(':commit')&&options?.headers?.Authorization?.startsWith('Bearer ey'))throw Error('Simulated disconnect before commit');return originalFetch(url,options);};
 try{await assert.rejects(freeClient()(request),/before commit/);}finally{global.fetch=originalFetch;}
 assert.equal((await db.collection('studentProgress').get()).size,0);assert.equal((await db.collection('studentArtifacts').get()).size,0);assert.equal((await db.collection('studentQuizAttempts').get()).size,0);assert.equal((await db.doc('users/alice').get()).data().xp,0);assert.equal((await freeClient()(request)).xpReward,25);
});
test('failed replay cannot undo completion; missing artifact backfills without more XP; chapter badge repeats once',async()=>{
 const submit=freeClient();await submit(input());await db.doc('studentArtifacts/alice_a1').delete();assert.equal((await submit(input())).artifactResult.newlyEarned,true);
 const failed=input();failed.answers=Object.fromEntries(failed.questionIds.map(id=>[id,'B']));assert.equal((await submit(failed)).xpReward,0);assert.equal((await db.doc('studentProgress/alice_m1').get()).data().bestScore,100);
 await db.doc('studentProgress/alice_m2').set({userId:'alice',chapterId:'c1',missionId:'m2',completed:true,bestScore:100});
 const challenge={kind:'chapter',chapterId:'c1',challengeId:'final',answers:{fq:'A'}};await Promise.all([submit(challenge),freeClient()(challenge)]);assert.equal((await db.collection('studentBadges').get()).size,1);assert.equal((await db.doc('users/alice').get()).data().xp,25);assert.equal((await db.doc('studentChapterProgress/alice_c1').get()).data().completed,true);
});
