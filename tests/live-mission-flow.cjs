// Explicit live smoke test: uses one temporary account and deletes its records afterward.
// No emulator or existing student account is used.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {randomUUID,randomBytes}=require('node:crypto');
const root=path.join(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
const config=fs.readFileSync(path.join(root,'js/firebase-config.js'),'utf8');
const apiKey=config.match(/apiKey:\s*"([^"]+)"/)[1];
const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
const fullBase=base.replace('https://firestore.googleapis.com/v1/','');
const encode=value=>value===null?{nullValue:null}:typeof value==='string'?{stringValue:value}:typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value}:Array.isArray(value)?{arrayValue:{values:value.map(encode)}}:{mapValue:{fields:fields(value)}};
const fields=value=>Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encode(v)]));
const decode=v=>'stringValue'in v?v.stringValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'booleanValue'in v?v.booleanValue:'timestampValue'in v?{toMillis:()=>Date.parse(v.timestampValue)}:'arrayValue'in v?(v.arrayValue.values||[]).map(decode):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,val])=>[k,decode(val)])):null;
const decodeDoc=doc=>Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,decode(v)]));
let identity,adminToken;const touched=new Set();
async function request(url,body,token){const response=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw new Error('HTTP '+response.status+' '+(data.error?.message||''));return data;}
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Live test only.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(root);adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const email='mission-flow-'+randomUUID()+'@example.com',password=randomBytes(24).toString('hex');
 identity=await request('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+apiKey,{email,password,returnSecureToken:true});
 const uid=identity.localId;let token=identity.idToken;
 touched.add('users/'+uid);
 await request(base+':commit',{writes:[{update:{name:fullBase+'/users/'+uid,fields:fields({firstName:'Flow',lastName:'TemporaryTest',email,role:'student',status:'active'})},currentDocument:{exists:false},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]}]},token);
 const snapshot=async ref=>{const response=await fetch(base+'/'+ref.key,{headers:{Authorization:'Bearer '+token}});if(response.status===404)return{exists:()=>false,data:()=>undefined};if(!response.ok)throw new Error('Read HTTP '+response.status+' '+await response.text());const row=decodeDoc(await response.json());return{exists:()=>true,data:()=>row};};
 const getDocs=async ref=>{const filters=(ref.filters||[]).map(f=>({fieldFilter:{field:{fieldPath:f.field},op:'EQUAL',value:encode(f.value)}}));const structuredQuery={from:[{collectionId:ref.name}],...(filters.length?{where:filters.length===1?filters[0]:{compositeFilter:{op:'AND',filters}}}:{})};const result=await request(base+':runQuery',{structuredQuery},token);return{docs:result.filter(item=>item.document).map(({document})=>({id:document.name.split('/').at(-1),data:()=>decodeDoc(document)}))};};
 const context=vm.createContext({console,auth:{currentUser:{uid}},db:{},
 collection:(_,name)=>({name}),doc:(_,name,id)=>({key:name+'/'+id}),where:(field,op,value)=>({field,value}),query:(ref,...filters)=>({...ref,filters}),getDoc:snapshot,getDocs,
 serverTimestamp:()=>({__serverTimestamp:true}),
 runTransaction:async(_,callback)=>{
   const writes=[];
   const makeWrite=(ref,data,update)=>{if(!ref.key.startsWith('users/'+uid)&&!ref.key.split('/')[1]?.startsWith(uid+'_'))throw new Error('Test write outside temporary account');touched.add(ref.key);const values={},transforms=[];for(const [key,value]of Object.entries(data)){if(value?.__serverTimestamp)transforms.push({fieldPath:key,setToServerValue:'REQUEST_TIME'});else values[key]=value;}return{update:{name:fullBase+'/'+ref.key,fields:fields(values)},...(update?{updateMask:{fieldPaths:Object.keys(data)}}:{}),...(transforms.length?{updateTransforms:transforms}:{})};};
   const result=await callback({get:snapshot,set:(ref,data)=>writes.push(makeWrite(ref,data,false)),update:(ref,data)=>writes.push(makeWrite(ref,data,true))});
   if(writes.length)await request(base+':commit',{writes},token);return result;
 }});
 context.getDocFromServer=snapshot;context.getDocsFromServer=getDocs;
 vm.runInContext(source('daily-policy.js')+source('progression-policy.js')+source('activity-policy.js')+source('mission-assessment.js')+source('learning-access.js')+source('student-rewards-client.js'),context);
 if(process.argv.includes('--security-only')){
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const assertDenied=async(label,action)=>{try{await action();}catch(error){if(/HTTP 403/.test(error.message))return;throw error;}throw Error(label+' was not denied');};
  const write=async(key,data,serverFields=[])=>{
   if(key!=='users/'+uid&&!key.split('/')[1]?.startsWith(uid+'_'))throw Error('Security fixture write outside its account');
   touched.add(key);
   return request(base+':commit',{writes:[{update:{name:fullBase+'/'+key,fields:fields(data)},currentDocument:{exists:false},
    ...(serverFields.length?{updateTransforms:serverFields.map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}:{})}]},token);
  };
  const alterProfile=values=>request(base+':commit',{writes:[{update:{name:fullBase+'/users/'+uid,fields:fields(values)},updateMask:{fieldPaths:Object.keys(values)}}]},token);
  await assertDenied('Role escalation',()=>alterProfile({role:'admin'}));
  await assertDenied('Direct XP inflation',()=>alterProfile({xp:999999}));
  const firstUnit=require('../data/prologue-learning-units.json').slice().sort((a,b)=>a.order-b.order)[0];
  const missionId=firstUnit.id,mission=(await snapshot({key:'missions/'+missionId})).data(),chapterId=mission.chapterId;
  const rows=s=>s.docs.map(d=>({...d.data(),id:d.id}));
  const quiz=rows(await getDocs({name:'quizzes',filters:[{field:'missionId',value:missionId}]})).find(q=>q.status==='active');
  check(quiz,'First prologue quiz unavailable');
  const bank=rows(await getDocs({name:'questions',filters:[{field:'quizId',value:quiz.id}]}));
  const selected=context.selectMissionQuestions(bank,quiz).questions;
  const input={kind:'mission',chapterId,missionId,quizId:quiz.id,attemptId:randomUUID(),questionIds:selected.map(q=>q.id),
   answers:Object.fromEntries(selected.map(q=>[q.id,q.correctAnswer==='A'?'B':'A']))};
  const failed=await context.submitStudentActivity(input);
  check(!failed.passed&&failed.xpReward===0,'Failing result mismatch');
  const replayFail=await context.submitStudentActivity(input);
  check(!replayFail.passed&&replayFail.xpReward===0,'Failed replay mismatch');
  const forgedId=randomUUID();
  await assertDenied('Forged response',()=>write('studentQuizAttempts/'+uid+'_'+forgedId,{
   userId:uid,chapterId,missionId,quizId:quiz.id,attemptId:forgedId,questionIds:input.questionIds,answers:input.answers,
   score:failed.score,correctAnswers:failed.correctAnswers,totalQuestions:selected.length,passed:false,
   topicsForReview:failed.topicsForReview,response:{...failed,passed:true,firstCompletion:true,xpReward:9999}
  },['completedAt']));
  const draftKey='studentLearningDrafts/'+uid+'_story_'+missionId;
  await write(draftKey,{userId:uid,kind:'story',chapterId,missionId,state:{securityFixture:true}},['updatedAt']);
  const invalidDraft='studentLearningDrafts/'+uid+'_chapter_security-missing-chapter';
  await assertDenied('Missing chapter draft',()=>write(invalidDraft,{userId:uid,kind:'chapter',chapterId:'security-missing-chapter',missionId:null,state:{}},['updatedAt']));
  await assertDenied('Mismatched practice',()=>write('studentPracticeProgress/'+uid+'_security-invalid',{
   userId:uid,chapterId:'security-missing-chapter',missionId,totalQuestions:1,firstTryCorrectCount:0,
   questionResults:[{questionId:'fixture',firstTryCorrect:false}],topicsForReview:[]
  },['completedAt']));
  const retry=context.selectMissionQuestions(bank,quiz,input.questionIds).questions;
  const passing={...input,attemptId:randomUUID(),questionIds:retry.map(q=>q.id),answers:Object.fromEntries(retry.map(q=>[q.id,q.correctAnswer]))};
  const pass=await context.submitStudentActivity(passing);
  check(pass.passed&&pass.firstCompletion&&pass.xpReward===mission.xpReward,'First completion did not save normally');
  const replay=await context.submitStudentActivity(passing);
  check(replay.passed&&replay.totalXp===pass.totalXp&&replay.xpReward===pass.xpReward,'Acknowledged replay mismatch');
  const newReplay=await context.submitStudentActivity({...passing,attemptId:randomUUID()});
  check(newReplay.passed&&!newReplay.firstCompletion&&newReplay.xpReward===0,'New replay duplicated XP');
  const profile=(await snapshot({key:'users/'+uid})).data();
  check(profile.xp===mission.xpReward&&profile.role==='student','Saved rewards or role mismatch');
  console.log('PASS: bounded live role/XP denial, failed attempt/replay, forged response denial, valid draft, invalid draft/practice denial, real mission reward batch and both replay paths.');
  return;
 }
 const quizzes=(await getDocs({name:'quizzes'})).docs.map(d=>({id:d.id,...d.data()}));
 const quiz=quizzes.find(q=>q.id==='quiz-1');if(!quiz)throw new Error('Smoke-test mission is unavailable');
 const mission=(await snapshot({key:'missions/'+quiz.missionId})).data();
 const bank=(await getDocs({name:'questions',filters:[{field:'quizId',value:quiz.id}]})).docs.map(d=>({id:d.id,...d.data()}));
 const first=context.selectMissionQuestions(bank,quiz).questions;
 const input={kind:'mission',chapterId:mission.chapterId,missionId:quiz.missionId,quizId:quiz.id,attemptId:randomUUID(),questionIds:first.map(q=>q.id),answers:Object.fromEntries(first.map(q=>[q.id,q.correctAnswer==='A'?'B':'A']))};
 const failed=await context.submitStudentActivity(input);if(failed.passed||failed.xpReward!==0||failed.topicsForReview.length!==5)throw new Error('Failure result mismatch');
 const saved=await snapshot({key:'studentQuizAttempts/'+uid+'_'+input.attemptId});if(!saved.exists())throw new Error('Failure was not saved');
 const retry=context.selectMissionQuestions(bank,quiz,input.questionIds);if(retry.repeatedQuestions)throw new Error('Retry repeated questions');
 const passing={...input,attemptId:randomUUID(),questionIds:retry.questions.map(q=>q.id),answers:Object.fromEntries(retry.questions.map((q,i)=>[q.id,i<3?q.correctAnswer:q.correctAnswer==='A'?'B':'A']))};
 const pass=await context.submitStudentActivity(passing);if(!pass.passed||pass.xpReward!==mission.xpReward)throw new Error('Passing reward mismatch');
 await context.submitStudentActivity(passing);
 const profile=(await snapshot({key:'users/'+uid})).data();if(profile.xp!==mission.xpReward)throw new Error('Duplicate XP');
 const asRows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id}));
 const chapterMissions=asRows(await getDocs({name:'missions',filters:[{field:'chapterId',value:mission.chapterId}]}))
    .filter(row=>row.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
 const challenge=asRows(await getDocs({name:'chapterChallenges',filters:[{field:'chapterId',value:mission.chapterId}]})).find(row=>row.status==='active');
 if(!challenge)throw new Error('The current chapter has no active challenge.');
 const finalQuestions=asRows(await getDocs({name:'chapterChallengeQuestions',filters:[{field:'challengeId',value:challenge.id}]})).filter(row=>row.status==='active');
 const answerFor=q=>q.gameType==='matching'?{gameType:'matching',matches:Object.fromEntries(q.matchingPairs.map(pair=>[pair.left,pair.right]))}
    :q.gameType==='tradeSimulation'?{gameType:'tradeSimulation',quantity:Number(q.requiredQuantity)}:q.correctAnswer;
 const finalInput={kind:'chapter',chapterId:mission.chapterId,challengeId:challenge.id,answers:Object.fromEntries(finalQuestions.map(q=>[q.id,answerFor(q)]))};
 if(chapterMissions.length>1){let rejected=false;try{await context.submitStudentActivity(finalInput);}catch(error){if(!error.message.includes('Complete all chapter missions'))throw error;rejected=true;}if(!rejected)throw new Error('Challenge skipped unfinished missions');}
 let expectedXp=mission.xpReward;
 for(const next of chapterMissions.filter(row=>row.id!==quiz.missionId)){
    const nextQuiz=quizzes.find(row=>row.missionId===next.id&&row.status==='active');if(!nextQuiz)throw new Error('Missing quiz for next mission');
    const nextBank=asRows(await getDocs({name:'questions',filters:[{field:'quizId',value:nextQuiz.id}]}));
    const selected=context.selectMissionQuestions(nextBank,nextQuiz).questions;
    const outcome=await context.submitStudentActivity({kind:'mission',chapterId:mission.chapterId,missionId:next.id,quizId:nextQuiz.id,attemptId:randomUUID(),questionIds:selected.map(q=>q.id),answers:Object.fromEntries(selected.map(q=>[q.id,q.correctAnswer]))});
    if(!outcome.passed||!outcome.firstCompletion)throw new Error('Next mission did not complete');expectedXp+=Number(next.xpReward)||0;
 }
 const chapterResult=await context.submitStudentActivity(finalInput);
 if(!chapterResult.passed||!chapterResult.badgeResult.newlyEarned)throw new Error('Chapter completion did not award its badge');
 const chapterReplay=await context.submitStudentActivity(finalInput);
 if(chapterReplay.badgeResult.newlyEarned||chapterReplay.xpReward!==0)throw new Error('Chapter replay duplicated rewards');
 const chapters=asRows(await getDocs({name:'chapters'}));const currentChapter=chapters.find(row=>row.id===mission.chapterId);
 const nextChapter=chapters.filter(row=>row.eraId===currentChapter.eraId&&row.status==='active'&&row.contentReady!==false)
    .sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id)).find(row=>(Number(row.order)||0)>(Number(currentChapter.order)||0));
 if(nextChapter)await context.requireLearningAccess(nextChapter.id);
 const dailyBank=asRows(await getDocs({name:'dailyChallenges'})).filter(row=>row.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
 if(!dailyBank.length)throw new Error('No active daily challenge');
 const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 const day=Math.floor((Date.parse(today)-Date.UTC(Number(today.slice(0,4)),0,1))/86400000);
 const daily=dailyBank[day%dailyBank.length];
 const wrong=await context.submitStudentActivity({kind:'daily',challengeId:daily.id,answer:daily.correctAnswer==='A'?'B':'A'});
 if(wrong.passed||wrong.xpReward!==0)throw new Error('Wrong daily answer earned a reward');
 const dailyInput={kind:'daily',challengeId:daily.id,answer:daily.correctAnswer};
 const dailyResult=await context.submitStudentActivity(dailyInput);
 if(!dailyResult.passed||!dailyResult.firstCompletion||dailyResult.learningStreak!==1)throw new Error('Daily completion did not save correctly');
 expectedXp+=Number(daily.xpReward)||0;
 const dailyReplay=await context.submitStudentActivity(dailyInput);
 if(dailyReplay.xpReward!==0||dailyReplay.learningStreak!==1)throw new Error('Daily replay duplicated XP or streak');
 const signedIn=await request('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+apiKey,{email,password,returnSecureToken:true});
 token=signedIn.idToken;
 const restored=(await snapshot({key:'users/'+uid})).data();if(restored.xp!==expectedXp)throw new Error('XP did not persist after fresh sign-in');
 if(!(await snapshot({key:'studentChapterProgress/'+uid+'_'+mission.chapterId})).data()?.completed)throw new Error('Chapter completion did not persist');
 if(!(await snapshot({key:'studentDailyChallenges/'+uid+'_'+today})).data()?.completed)throw new Error('Daily completion did not persist');
 const badges=asRows(await getDocs({name:'studentBadges',filters:[{field:'userId',value:uid}]}));
 const artifacts=asRows(await getDocs({name:'studentArtifacts',filters:[{field:'userId',value:uid}]}));
 if(badges.length!==1||!artifacts.length)throw new Error('Collections did not persist');
 console.log('PASS: live mission recovery, chapter prerequisites/completion and badge replay; next-chapter access '+(nextChapter?'verified':'not applicable')+'; daily correctness/replay/streak and fresh-sign-in persistence.');
}
async function cleanup(){
 if(!identity)return;
 const uid=identity.localId;
 const paths=[...touched];if(paths.some(key=>key!=='users/'+uid&&!key.split('/')[1]?.startsWith(uid+'_')))throw new Error('Invalid cleanup path');
 if(paths.length)await request(base+':commit',{writes:paths.map(key=>({delete:fullBase+'/'+key}))},adminToken);
 await request('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+apiKey,{idToken:identity.idToken});
 console.log('Removed the temporary test account and its learning records.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>cleanup().catch(error=>{console.error('Cleanup failed: '+error.message);process.exitCode=1;}));
