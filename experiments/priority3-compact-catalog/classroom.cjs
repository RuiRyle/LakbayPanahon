'use strict';
// Synthetic query-shape workload, not an instrumented production/browser trace.
const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto'),p=require('./bootstrap.cjs');
const read=(phase,ref)=>p.meter.outside(phase,ref);
const write=(phase,ref,value)=>p.meter.run(phase,()=>p.db.runTransaction(async tx=>{tx.set(ref,value);}));
const histories=['studentChapterProgress','studentProgress','studentQuizAttempts','studentLearningDrafts','studentPracticeProgress','studentReviewEvents','studentArtifacts','studentBadges'];
const shared=false,catalogPromises=new Map();
async function dashboard(u,phase){await read(phase,p.db.doc('users/'+u.uid));for(const c of ['chapters','eras','missions','chapterChallenges']){const key=u.uid+':'+c;if(!shared)await read(phase,p.db.collection(c));else{if(!catalogPromises.has(key))catalogPromises.set(key,read(phase,p.db.collection(c)));await catalogPromises.get(key);}}for(const c of histories)await read(phase,p.db.collection(c).where('userId','==',u.uid));await read(phase,p.db.doc('learningSettings/progression'));}
async function main(){
 await p.fixture.seedLocalCatalog();const missions=['mission-1','mission-2'].map(id=>p.catalog.missions.find(m=>m.id===id));
 // Scene and historical distributions are explicit assumptions, absent from the pinned catalog.
 for(const m of missions)for(let i=0;i<8;i++)await p.db.doc('storyScenes/local-'+m.id+'-'+i).set({missionId:m.id,order:i,status:'active',text:'Synthetic teaching content'});
 const users=[];for(let i=0;i<30;i++)users.push(await p.fixture.fixtureUser('full-journey-'+i));
 await Promise.all(users.map(u=>dashboard(u,'initial-dashboard')));
 for(const m of missions){
  await Promise.all(users.map(async u=>{
   const phase='story-and-drafts';for(const path of ['users/'+u.uid,'chapters/'+m.chapterId,'missions/'+m.id])await read(phase,p.db.doc(path));await read(phase,p.db.collection('storyScenes').where('missionId','==',m.id));await read(phase,p.db.collection('quizzes').where('missionId','==',m.id));
   const ref=p.db.doc('studentLearningDrafts/'+u.uid+'_story_'+m.id);await read(phase,ref);
   // Match learning-draft.js transaction read, write, committed timestamp read.
   for(let scene=0;scene<8;scene++){await p.meter.run(phase,()=>p.db.runTransaction(async tx=>{await tx.get(ref);tx.set(ref,{userId:u.uid,kind:'story',chapterId:m.chapterId,missionId:m.id,state:{sceneId:String(scene)}});}));await read(phase,ref);}
  }));
  const quiz=p.catalog.quizzes.find(q=>q.missionId===m.id&&q.status==='active'),identity={kind:'mission',chapterId:m.chapterId,missionId:m.id,quizId:quiz.id};
  await Promise.all(users.map(async(u,i)=>{let state=await p.call(p.names[0],{...identity,requestId:randomUUID()},u,'two-mission-assessments');state=await p.finish(u,state,i%3===0?2:0,'two-mission-assessments',identity);const result=await p.submit(u,state,'two-mission-assessments');assert.equal(result.passed,true);await Promise.all([p.submit(u,state,'lost-response-replay'),p.submit(u,state,'lost-response-replay')]);}));
  await Promise.all(users.map(u=>dashboard(u,'return-dashboard')));
  p.advanceSchoolTime();
 }
 // Actual daily and chapter assessments in this run, no arithmetic substitution.
 const dailyPolicy=await import('../priority3-netlify/service/assessment-shared/daily-policy.mjs'),day=dailyPolicy.selectDailyChallenge(p.catalog.dailyChallenges);
 async function activity(user,identity,answers,phase){let state=await p.call(p.names[0],{...identity,requestId:randomUUID()},user,phase);state=await p.call(p.names[1],{attemptId:state.attemptId,revision:state.revision,requestId:randomUUID(),action:'answers',answers},user,phase);const first=await p.submit(user,state,phase);const replays=await Promise.all([p.submit(user,state,phase+'-replays'),p.submit(user,state,phase+'-replays')]);assert.ok(replays.every(r=>r.totalXp===first.totalXp));return first;}
 await Promise.all(users.map(u=>activity(u,{kind:'daily',challengeId:day.id},{[day.id]:day.correctAnswer},'daily-30')));p.advanceSchoolTime();
 const chapterId=missions[0].chapterId,challenge=p.catalog.chapterChallenges.find(c=>c.chapterId===chapterId&&c.status==='active'),bank=p.catalog.chapterChallengeQuestions.filter(q=>q.challengeId===challenge.id&&q.status==='active');
 const answers=Object.fromEntries(bank.map(q=>[q.id,q.evidenceTask?{gameType:'evidenceDecision',evidenceId:q.evidenceTask.correctEvidenceId,conclusion:q.correctAnswer}:q.gameType==='matching'?{gameType:'matching',matches:Object.fromEntries(q.matchingPairs.map(pair=>[pair.left,pair.right]))}:q.gameType==='tradeSimulation'?{gameType:'tradeSimulation',quantity:Number(q.requiredQuantity)}:q.correctAnswer]));
 await Promise.all(users.map(u=>activity(u,{kind:'chapter',chapterId,challengeId:challenge.id},answers,'chapter-30')));
 // Four teacher refreshes; actual report query shapes, plus explicit approval/ownership reads.
 for(let refresh=0;refresh<(shared?2:4);refresh++){
  for(const path of ['users/local-teacher','teacherApplications/local-teacher','classes/local-class'])await read('teacher-monitoring',p.db.doc(path));
  for(const u of users){await read('teacher-monitoring',p.db.doc('classMembers/'+u.uid+'_local-class'));await write('teacher-monitoring',p.db.doc('teacherStudentLinks/local-teacher_'+u.uid),{teacherId:'local-teacher',userId:u.uid,classId:'local-class'});await read('teacher-monitoring',p.db.doc('users/'+u.uid));for(const c of ['studentProgress','studentQuizAttempts'])await read('teacher-monitoring',p.db.collection(c).where('userId','==',u.uid));}
 }
 // Invariant assertions outside workload meter: no duplicate XP/artifacts/badges.
 for(const u of users){const profile=(await p.db.doc('users/'+u.uid).get()).data();assert.equal(profile.xp,missions.reduce((sum,m)=>sum+m.xpReward,0)+day.xpReward);assert.equal((await p.db.collection('studentArtifacts').where('userId','==',u.uid).get()).size,2);assert.equal((await p.db.collection('studentBadges').where('userId','==',u.uid).get()).size,1);}
 const phases=Object.fromEntries([...new Set(p.meter.events.map(e=>e.phase))].map(phase=>[phase,p.meter.total(phase)])),total=p.meter.total(),memoAtEnd={...require('../priority3-read-efficiency/memo-store.cjs').stats};
 const report={status:'pass',students:30,missionsPerStudent:2,scenesPerMission:8,storyAutosavesPerMission:8,teacherFullClassRefreshes:4,replaysPerCompletion:2,operations:total,phases,quota:{reads:50000,writes:20000,deletes:20000,targetWith20PercentReserve:{reads:40000,writes:16000,deletes:16000}},limitations:['Synthetic Admin SDK query-shape replay, not a full browser or rules-billing trace.','Scene count and fresh histories assumed; historical growth, practice/review activity, daily/chapter assessments, rule-dependent and index-entry reads are additional.','Seeding and assertions excluded. No cleanup deletes scheduled in workload.','No production data, real credentials, Netlify account or deployment.']};
 report.teacherFullClassRefreshes=shared?2:4;report.dailyAndChapterIncluded=true;report.replaysPerCompletion=2;report.mode='compact';report.publication=p.publication;report.memoStats=memoAtEnd;report.securityProbes=shared?await require('../priority3-read-efficiency/security-probes.cjs')(p):{status:'not-run-baseline'};report.rankedCollections=Object.entries(total.collections).map(([collection,v])=>({collection,reads:v.minimumReadUnits})).sort((a,b)=>b.reads-a.reads);report.limitations=report.limitations.filter(s=>!s.includes('daily/chapter assessments'));report.limitations.push('Five-minute synthetic lesson intervals preserve start throttling without sleeping. Auth/App Check verification and policy limits are unchanged.','Sharing mode assumes three dashboard consumers in one owned page lifecycle; navigation/reload starts a fresh cache. No application integration or authorization/result cache.','Optimized mode uses two teacher full-class refreshes instead of four; fewer observations, not equivalent real-time monitoring.');
 assert.equal(total.committedDeletes,0);fs.writeFileSync('docs/validation/priority-3-compact-catalog-'+report.mode+'-2026-11-07.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,mode:report.mode,reads:total.minimumReadUnits,writes:total.committedWrites,deletes:total.committedDeletes,memoStats:report.memoStats,phases:Object.fromEntries(Object.entries(phases).map(([k,v])=>[k,{reads:v.minimumReadUnits,writes:v.committedWrites,deletes:v.committedDeletes}]))}));
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(p.cleanup);
