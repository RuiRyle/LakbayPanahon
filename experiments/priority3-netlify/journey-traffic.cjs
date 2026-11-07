'use strict';
// Synthetic query-shape workload, not an instrumented production/browser trace.
const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto'),p=require('./proof.cjs');
const read=(phase,ref)=>p.meter.outside(phase,ref);
const write=(phase,ref,value)=>p.meter.run(phase,()=>p.db.runTransaction(async tx=>{tx.set(ref,value);}));
const histories=['studentChapterProgress','studentProgress','studentQuizAttempts','studentLearningDrafts','studentPracticeProgress','studentReviewEvents','studentArtifacts','studentBadges'];
const shared=process.env.SHARE_DISPLAY_CATALOG==='1',catalogPromises=new Map();
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
 }
 // Four teacher refreshes; actual report query shapes, plus explicit approval/ownership reads.
 for(let refresh=0;refresh<4;refresh++){
  for(const path of ['users/local-teacher','teacherApplications/local-teacher','classes/local-class'])await read('teacher-monitoring',p.db.doc(path));
  for(const u of users){await read('teacher-monitoring',p.db.doc('classMembers/'+u.uid+'_local-class'));await write('teacher-monitoring',p.db.doc('teacherStudentLinks/local-teacher_'+u.uid),{teacherId:'local-teacher',userId:u.uid,classId:'local-class'});await read('teacher-monitoring',p.db.doc('users/'+u.uid));for(const c of ['studentProgress','studentQuizAttempts'])await read('teacher-monitoring',p.db.collection(c).where('userId','==',u.uid));}
 }
 const phases=Object.fromEntries([...new Set(p.meter.events.map(e=>e.phase))].map(phase=>[phase,p.meter.total(phase)])),total=p.meter.total();
 const report={status:'pass',students:30,missionsPerStudent:2,scenesPerMission:8,storyAutosavesPerMission:8,teacherFullClassRefreshes:4,replaysPerCompletion:2,operations:total,phases,quota:{reads:50000,writes:20000,deletes:20000,targetWith20PercentReserve:{reads:40000,writes:16000,deletes:16000}},limitations:['Synthetic Admin SDK query-shape replay, not a full browser or rules-billing trace.','Scene count and fresh histories assumed; historical growth, practice/review activity, daily/chapter assessments, rule-dependent and index-entry reads are additional.','Seeding and assertions excluded. No cleanup deletes scheduled in workload.','No production data, real credentials, Netlify account or deployment.']};
 report.experimentalDisplaySharing=shared;report.limitations.push('Sharing mode assumes three dashboard consumers in one owned page lifecycle; navigation/reload starts a fresh cache. No application integration or authorization/result cache.');
 assert.equal(total.committedDeletes,0);fs.writeFileSync('docs/validation/priority-3-netlify-full-journey'+(shared?'-shared':'')+'-2026-11-07.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,reads:total.minimumReadUnits,writes:total.committedWrites,deletes:total.committedDeletes,phases:Object.fromEntries(Object.entries(phases).map(([k,v])=>[k,{reads:v.minimumReadUnits,writes:v.committedWrites,deletes:v.committedDeletes}]))}));
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(p.cleanup);
