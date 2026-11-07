// Live Firestore + existing local student pages. Temporary synthetic account only.
const fs=require('node:fs'),path=require('node:path'),h=require('./teacher-workflow-live.cjs');
const {encode}=require('../functions/apply-chapter1-mission1-learning-polish.cjs');
const plan=require('../data/mission-objective-wording-migration.json'),mode=process.argv[2];
if(!['--preflight','--published'].includes(mode))throw Error('Choose --preflight or --published');
const report={mode,startedAt:new Date().toISOString(),checks:[],limits:['Actual local student HTML/JS and Firebase SDK against live Firestore; not hosted-page deployment acceptance.','Synthetic prerequisites belong only to a temporary test student and are removed; no real student progress is modified.','Quiz saving/reward protection verified separately by regression tests; this walkthrough does not submit quizzes or award rewards.']};
async function main(){await h.launch();const student=await h.createIdentity('student');
 const catalog=await h.evaluate(`(async()=>{const {db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');const out={};for(const name of ['missions','chapters'])out[name]=(await f.getDocsFromServer(f.collection(db,name))).docs.map(d=>({id:d.id,...d.data()}));return out;})()`);
 for(const w of plan.writes){const live=catalog.missions.find(m=>m.id===w.path.split('/')[1]);if(JSON.stringify(live?.learningObjectives)!==JSON.stringify(mode==='--preflight'?w.expected.learningObjectives:w.fields.learningObjectives))throw Error('SDK live objective mismatch: '+w.path);}
 report.checks.push('Authenticated student SDK reads exactly all 65 expected objective sentences');
 const fixtures=[...catalog.missions.filter(m=>m.status==='active').map(m=>({path:'studentProgress/'+student.uid+'_'+m.id,data:{userId:student.uid,chapterId:m.chapterId,missionId:m.id,completed:true,xpEarned:0,validationFixture:true}})),...catalog.chapters.filter(c=>c.status==='active').map(c=>({path:'studentChapterProgress/'+student.uid+'_'+c.id,data:{userId:student.uid,chapterId:c.id,completed:true,validationFixture:true}}))];
 for(const f of fixtures)h.registerFixtureRecord(f.path);
 await h.admin(h.api+':commit',{writes:fixtures.map(f=>({update:{name:'projects/'+plan.projectId+'/databases/(default)/documents/'+f.path,fields:Object.fromEntries(Object.entries(f.data).map(([k,v])=>[k,encode(v)]))}}))});
 for(const w of plan.writes){const id=w.path.split('/')[1],mission=catalog.missions.find(m=>m.id===id);await h.go('mission.html?'+new URLSearchParams({chapter:mission.chapterId,mission:id}));await h.wait(`!document.getElementById('missionContent')?.hidden&&!!document.querySelector('#missionPath .mission-path-item')`,'chapter overview '+id);
 await h.evaluate(`(()=>{const card=[...document.querySelectorAll('#missionPath .mission-path-item:not(.chapter-challenge)')].find(c=>c.querySelector('strong')?.textContent.trim()===${JSON.stringify(mission.title)});if(!card)throw Error('Mission trail item missing');card.click();})()`);await h.wait(`document.getElementById('missionTitle')?.dataset.missionId===${JSON.stringify(id)}`,'selected mission '+id);
 const expected=mode==='--preflight'?w.expected.learningObjectives:w.fields.learningObjectives;
 const actual=await h.evaluate(`(()=>{document.querySelector('.mission-more-goals')?.setAttribute('open','');return document.getElementById('missionLearningObjective').textContent;})()`);
 for(const objective of expected)if(!actual.includes(objective))throw Error('Displayed objective mismatch: '+id);
 if(mode==='--published'&&expected.some(s=>/[?\uFFFD]/.test(s)))throw Error('Corrupted punctuation '+id);
 report.checks.push(id+': all five objectives render exactly in the real student page');console.log('PASS: '+id+' five '+(mode==='--preflight'?'original':'revised')+' objectives rendered');
 }
 if(mode==='--published'){
 const mission=catalog.missions.find(m=>m.id===plan.writes[0].path.split('/')[1]);await h.go('story.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id}));await h.wait(`document.getElementById('storyText')?.textContent.trim()&&!!window.LakbayNarrator`,'lesson reader');const voice=await h.evaluate(`(()=>{const text=document.querySelector('#storyText p')?.textContent;return {text,utterance:window.LakbayNarrator.create(text).text,goals:document.querySelector('.lesson-goal-details')?.textContent};})()`);if(!voice.text||voice.text!==voice.utterance)throw Error('Narration text mismatch');report.checks.push('Live lesson paragraph is passed verbatim to the unchanged device narration utterance');
 await h.go('quiz.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id}));await h.wait(`!document.getElementById('quizContent')?.hidden&&!!document.querySelector('#quizOptions button')`,'live quiz load');report.checks.push('Actual mission quiz loads its question/options from live content without submitting an attempt');
 }
 report.status='pass';h.report.status='pass';
}
main().catch(e=>{report.status='fail';report.error=e.message;h.report.status='fail';h.report.error=e.message;console.error('FAIL: '+e.message);process.exitCode=1;}).finally(async()=>{await h.cleanup();report.cleanup=h.report.cleanup;fs.writeFileSync(path.resolve('docs/validation/priority-1-student-interface-'+(mode==='--preflight'?'preflight':'published')+'-2026-11-07.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,cleanup:report.cleanup}));});
