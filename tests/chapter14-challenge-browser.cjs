const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-chapter-'));
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
let html=fs.readFileSync(path.join(root,'pages/chapter-challenge.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const roadmapQuestions=require('../data/chapter14-challenge-migration.json').writes.filter(w=>w.path.startsWith('chapterChallengeQuestions/')).map(w=>({id:w.path.split('/')[1],...w.fields}));
const chapter14Scenes=[1,2,3,4,5].flatMap(n=>require('../data/chapter14-mission'+n+'-migration.json').writes.filter(w=>w.path.startsWith('storyScenes/')));
const chapter14Plan=require('../data/chapter14-challenge-migration.json');
const script=`
const auth={currentUser:{uid:'test'}},db={},records=new Map();
records.set('users/test',{role:'student',status:'active',xp:50,level:1});records.set('learningSettings/progression',{xpPerLevel:100,version:1});
records.set('chapters/c1',{id:'c1',status:'active',title:'Test Chapter'});records.set('missions/m1',{id:'m1',chapterId:'c1',status:'active'});records.set('studentProgress/test_m1',{userId:'test',missionId:'m1',chapterId:'c1',completed:true});
records.set('chapterChallenges/final',{id:'final',chapterId:'c1',status:'active',title:'Test Challenge',passingScore:75});records.set('badges/b1',{id:'b1',chapterId:'c1',status:'active',name:'Test Badge',description:'Chapter completed',icon:'X'});
const fixtureQuestions=[
 {id:'q1',gameType:'multipleChoice',question:'Choose an answer',optionA:'Correct',optionB:'Other',optionC:'Other',optionD:'Other',correctAnswer:'A'},
 {id:'q2',gameType:'historicalDecision',question:'Choose a decision',optionA:'Other',optionB:'Correct',optionC:'Other',optionD:'Other',correctAnswer:'B'},
 {id:'q3',gameType:'matching',question:'Match both items',matchingPairs:[{left:'First',right:'One'},{left:'Second',right:'Two'}]},
 {id:'q4',gameType:'tradeSimulation',question:'Offer three goods',startingQuantity:8,requiredQuantity:3,rewardQuantity:1,tradeGood:'crops',rewardGood:'pot'}
];
fixtureQuestions.forEach((q,index)=>records.set('chapterChallengeQuestions/'+q.id,{...q,challengeId:'final',status:'active',order:index+1,explanation:'Review this concept'}));
const collection=(_,name)=>({name}),doc=(_,name,id)=>name+'/'+id,where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
let fixtureLoadGate=null,fixtureSaveGate=null,fixtureAuthListener,fixtureSaveFailure=false,fixtureWrites=0,fixtureLoadFailure=false;
const getDoc=async key=>{if(fixtureLoadFailure)throw Error("Offline");if(key=== "chapters/c1" && fixtureLoadGate)await fixtureLoadGate;return ({id:key.split('/')[1],exists:()=>records.has(key),data:()=>records.get(key)});};
const getDocs=async ref=>{if(['chapterChallenges','chapterChallengeQuestions'].includes(ref.name)&&!ref.filters?.length)throw Error('Unscoped challenge catalog read');const docs=[...records].filter(([key,row])=>key.startsWith(ref.name+'/')&&(!ref.filters||ref.filters.every(f=>row[f.field]===f.value))).map(([key,row])=>({id:key.split('/')[1],data:()=>row}));return{docs,forEach:fn=>docs.forEach(fn)};};
const serverTimestamp=()=>({toMillis:()=>100});
const runTransaction=async(_,fn)=>{fixtureWrites++;if(fixtureSaveFailure)throw Error("Offline");const writes=[];const result=await fn({get:getDoc,set:(key,row)=>writes.push(()=>records.set(key,row)),update:(key,row)=>writes.push(()=>records.set(key,{...records.get(key),...row}))});writes.forEach(fn=>fn());if(fixtureSaveGate)await fixtureSaveGate;return result;};
const requireLearningAccess=async()=>records.get('chapters/c1');class LearningAccessError extends Error{}
const onAuthStateChanged=(_,fn)=>{fixtureAuthListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
${source('quiz-draft-policy.js')}
${source('daily-policy.js')}
${source('progression-policy.js')}
${source('activity-policy.js')}
${source('evidence-decision.js')}
${source('student-rewards-client.js')}
let fixtureNavigation='';

const restartControl=(()=>{${source('learning-draft.js')};return restartControl;})();
window.confirm=()=>true;
const fixtureDrafts=new Map(),fixtureDraftWrites=[];
const draftStatus=container=>{const p=document.createElement('p');container.prepend(p);return p;};
const learningDraft=(kind,chapter,mission)=>{const key=kind+chapter;let closed=false;return{read:async()=>fixtureDrafts.get(key)||null,save:state=>{if(!closed){fixtureDraftWrites.push(JSON.parse(JSON.stringify(state)));fixtureDrafts.set(key,JSON.parse(JSON.stringify(state)));}},clear:async()=>{closed=true;fixtureDrafts.delete(key);},close:()=>{closed=true;}};};
${source('chapter-continuation.js')}
${source('chapter-challenge.js').replace(/window\.location\.href\s*=/g, 'fixtureNavigation =')}
const tick=()=>new Promise(resolve=>setTimeout(resolve,40)),check=(value,message)=>{if(!value)throw Error(message);};
async function answerAll(correct){
 for(const q of fixtureQuestions){
   check(challengeQuestions[currentQuestionIndex].id===q.id,'Question order mismatch');
   let submit=document.getElementById('submitChallengeAnswer');check(submit.disabled,'Unanswered question can be submitted');
   if(q.gameType==='matching'){
      const selects=[...document.querySelectorAll('.matching-select')];
      selects[0].value='One';selects[0].dispatchEvent(new Event('change'));selects[1].value='One';selects[1].dispatchEvent(new Event('change'));
      check(selects[0].value===''&&submit.disabled,'Duplicate matching answer was accepted');
      selects.forEach((select,index)=>{select.value=q.matchingPairs[correct?index:1-index].right;select.dispatchEvent(new Event('change'));});
   }else if(q.gameType==='tradeSimulation'){
      const buttons=document.querySelectorAll('.trade-quantity-button');
      check(buttons[0].disabled,'Trade can go negative');for(let i=0;i<(correct?3:4);i++)buttons[1].click();
   }else{
      const answer=correct?q.correctAnswer:q.correctAnswer==='A'?'B':'A';document.querySelector('.challenge-option[data-answer="'+answer+'"]').click();
   }
   await tick();
   const priorIndex=currentQuestionIndex,priorScore=correctAnswers,priorAnswers=JSON.stringify(studentAnswers);
   const writesBeforeResume=fixtureDraftWrites.length;
   await loadChapterChallenge();await tick();
   check(fixtureDraftWrites.slice(writesBeforeResume).every(state=>state.index===priorIndex&&JSON.stringify(state.answers)===priorAnswers),'Chapter resume transiently overwrote submitted evidence');
   check(currentQuestionIndex===priorIndex&&correctAnswers===priorScore&&JSON.stringify(studentAnswers)===priorAnswers,'Chapter resume changed submitted evidence');
   if(q.gameType==='matching')check(Object.keys(selectedMatches).length===2,'Matching selections not restored');
   else if(q.gameType==='tradeSimulation')check(selectedTradeQuantity===(correct?3:4),'Trade quantity not restored');
   else check(selectedAnswer===(correct?q.correctAnswer:q.correctAnswer==='A'?'B':'A'),'Choice not restored');
   submit=document.getElementById('submitChallengeAnswer');
   check(!submit.disabled,'Completed interaction cannot be submitted');submit.click();await tick();
   if(currentQuestionIndex<challengeQuestions.length){const saved=fixtureDrafts.get('chapterc1');check(saved.partialQuestionId===challengeQuestions[currentQuestionIndex].id&&saved.choice===null&&Object.keys(saved.matches).length===0&&saved.quantity===0,'Next question saved previous partial inputs');}
 }
}
(async()=>{
 await tick();check(!beginChallengeButton.disabled,'Challenge did not unlock');
 fixtureLoadFailure=true;await loadChapterChallenge();
 check(beginChallengeButton.disabled&&!retryChapterLoadButton.hidden&&!chapterLoadPending,'Load failure lacks recovery');
 fixtureLoadFailure=false;retryChapterLoadButton.click();await tick();
 check(!beginChallengeButton.disabled&&retryChapterLoadButton.hidden,'Chapter load retry failed');
 check(!/[\u00f0]\u0178/.test(challengeStatus.textContent),'Challenge icon is corrupted');
 beginChallengeButton.click();
 const activeBefore=activeChallenge;fixtureAuthListener(auth.currentUser);await tick();
 check(challengeStarted&&activeChallenge===activeBefore,'Auth refresh restarted challenge');
 fixtureDrafts.set('chapterc1',{...fixtureDrafts.get('chapterc1'),partialQuestionId:'old-question',choice:'A',matches:{First:'One'},quantity:3});
 await loadChapterChallenge();await tick();
 check(selectedAnswer===null&&Object.keys(selectedMatches).length===0&&selectedTradeQuantity===0,'Stale partial input restored into a different question');
 restartChapterButton.click();await tick();
 check(!challengeStarted&&!beginChallengeButton.hidden,'Chapter restart did not return to fresh entry');
 beginChallengeButton.click();await answerAll(false);
 check(!!document.getElementById('chapterChallengeResult')&&!records.has('studentChapterProgress/test_c1'),'Failure incorrectly completed chapter');
 fixtureSaveFailure=true;
 document.getElementById('challengeResultPrimaryButton').click();await answerAll(true);
 check(!records.has('studentChapterProgress/test_c1'),'Failed save completed chapter');
 check(document.getElementById('challengeResultPrimaryButton').textContent.includes('Retry Saving'),'Save failure requires retake');
 const savedAnswers=JSON.stringify(studentAnswers),writesBefore=fixtureWrites;
 fixtureSaveFailure=false;
 document.getElementById('challengeResultPrimaryButton').click();
 document.getElementById('challengeResultPrimaryButton').click();await tick();
 check(JSON.stringify(studentAnswers)===savedAnswers,'Save retry reset answers');
 check(fixtureWrites===writesBefore+1,'Save retry overlapped');
 check(records.get('studentChapterProgress/test_c1')?.completed,'Chapter was not saved');
 check(records.has('studentBadges/test_b1')&&validatedChapterReward.newlyEarned,'Badge was not saved/displayed');
 check(records.get('users/test').xp===50,'Chapter unexpectedly changed mission XP');
 check(document.getElementById('chapterChallengeResult').textContent.includes('Chapter Complete'),'Success result missing');
 check(!document.getElementById('chapterChallengeResult').textContent.includes('Next Chapter Unlocked'),'Result promises unavailable content');
 document.getElementById('challengeResultPrimaryButton').click();check(fixtureNavigation==='chapters.html','Continue did not open chapter map');
 document.getElementById('challengeResultBackButton').click();check(fixtureNavigation==='mission.html?chapter=c1','Back did not preserve chapter');
 records.set('chapters/c2',{id:'c2',status:'active',title:'Next chapter <img src=x>',order:2});
 records.set('missions/m2',{id:'m2',chapterId:'c2',status:'active'});
 await showChallengeResult();
 check(document.getElementById('challengeResultPrimaryButton').textContent==='Continue to Next Chapter','Eligible next chapter missing');
 document.getElementById('challengeResultPrimaryButton').click();check(fixtureNavigation==='mission.html?chapter=c2','Wrong next chapter route');
 check(!document.querySelector('#chapterChallengeResult img'),'Chapter title rendered as HTML');
 const replay=await completeChapter();check(!replay.firstCompletion&&!validatedChapterReward.newlyEarned,'Replay duplicated badge');
 let releaseSave;fixtureSaveGate=new Promise(resolve=>{releaseSave=resolve;});
 const saving=showChallengeResult();await tick();
 auth.currentUser=null;fixtureAuthListener(null);releaseSave();await saving;fixtureSaveGate=null;
 check(!document.getElementById('chapterChallengeResult')&&validatedChapterReward===null,'Late save revealed signed-out result');
 let releaseLoad;fixtureLoadGate=new Promise(resolve=>{releaseLoad=resolve;});
 auth.currentUser={uid:'test'};fixtureAuthListener(auth.currentUser);await tick();
 auth.currentUser=null;fixtureAuthListener(null);releaseLoad();await tick();fixtureLoadGate=null;
 check(beginChallengeButton.disabled&&activeChallenge===null,'Late load unlocked signed-out challenge');
 auth.currentUser={uid:'test'};fixtureAuthListener(auth.currentUser);await tick();
 check(!beginChallengeButton.disabled,'Fresh sign-in did not recover');

 for(const row of ${JSON.stringify(chapter14Scenes)})records.set(row.path,{id:row.path.split('/')[1],...row.fields});
 records.delete('chapters/c2');records.delete('missions/m2');records.delete('missions/m1');records.delete('studentChapterProgress/test_c1');records.delete('studentBadges/test_b1');
 for(let n=1;n<=5;n++){const id='chapter14-mission'+n;records.set('missions/'+id,{id,chapterId:'c1',status:'active',order:n});if(n<5)records.set('studentProgress/test_'+id,{userId:'test',missionId:id,chapterId:'c1',completed:true});}
 records.set('chapterChallenges/final',{...${JSON.stringify(chapter14Plan.writes.find(w=>w.path.startsWith('chapterChallenges/')).fields)},chapterId:'c1'});
 records.set('badges/b1',{...${JSON.stringify(chapter14Plan.writes.find(w=>w.path.startsWith('badges/')).fields)},chapterId:'c1'});
 for(const key of [...records.keys()])if(key.startsWith('chapterChallengeQuestions/'))records.delete(key);
 fixtureQuestions.splice(0,fixtureQuestions.length,...${JSON.stringify(roadmapQuestions)});
 for(const q of fixtureQuestions)records.set('chapterChallengeQuestions/'+q.id,{...q,challengeId:'final'});
 await loadChapterChallenge();await tick();check(beginChallengeButton.disabled,'Chapter 14 unlocked without Mission 5');
 records.set('studentProgress/test_chapter14-mission5',{userId:'test',missionId:'chapter14-mission5',chapterId:'c1',completed:true});
 await loadChapterChallenge();await tick();check(!beginChallengeButton.disabled,'Chapter 14 stayed locked after all five missions');
 async function answerChapter5(correctCount){
 if(!challengeStarted)beginChallengeButton.click();await tick();
 for(const [i,q]of fixtureQuestions.entries()){
 check(challengeQuestions[currentQuestionIndex]?.id===q.id,'Chapter 14 question order changed: '+currentQuestionIndex+' expected '+q.id);const correct=i<correctCount;let submit=document.getElementById('submitChallengeAnswer');check(submit.disabled,'Unanswered Chapter 14 task accepted');
 if(q.evidenceTask){await tick();const clue=document.querySelector('.evidence-clue-select'),conclusion=document.querySelector('.evidence-conclusion-select');check(clue&&conclusion,'Chapter 14 evidence controls missing');
 clue.value=correct?q.evidenceTask.correctEvidenceId:q.evidenceTask.cards.find(c=>c.id!==q.evidenceTask.correctEvidenceId).id;clue.dispatchEvent(new Event('change'));check(submit.disabled,'Chapter 14 clue alone accepted');conclusion.value=q.correctAnswer;conclusion.dispatchEvent(new Event('change'));
 if(i===0){const before=JSON.stringify(selectedAnswer);await loadChapterChallenge();await tick();await tick();check(JSON.stringify(selectedAnswer)===before,'Chapter 14 evidence draft changed after resume');submit=document.getElementById('submitChallengeAnswer');}
 }else{for(const [j,select]of [...document.querySelectorAll('.matching-select')].entries()){const left=select.closest('.matching-row').querySelector('.matching-label').textContent.trim(),pair=q.matchingPairs.find(p=>p.left===left);select.value=correct?pair.right:q.matchingPairs[(j+1)%q.matchingPairs.length].right;select.dispatchEvent(new Event('change'));}}
 check(!submit.disabled,'Complete Chapter 14 task rejected');submit.click();await tick();
 }
 }
 await answerChapter5(6);check(!records.has('studentChapterProgress/test_c1')&&!records.has('studentBadges/test_b1'),'60 percent awarded chapter or badge');
 document.getElementById('challengeResultPrimaryButton').click();await tick();await answerChapter5(7);
 check(records.get('studentChapterProgress/test_c1')?.completed,'70 percent did not complete chapter');check(records.get('studentBadges/test_b1')?.badgeId==='b1','Chapter 14 badge missing');check(records.get('users/test').xp===50,'Chapter challenge duplicated mission XP');
 check(document.getElementById('chapterChallengeResult').textContent.includes('Contributions and Wider Belonging Investigator'),'Authored Chapter 14 badge name missing');
 document.getElementById('challengeResultPrimaryButton').click();check(fixtureNavigation==='chapters.html','Unfinished next chapter was promised');
 const repeat=await completeChapter();check(!repeat.firstCompletion&&!validatedChapterReward.newlyEarned,'Chapter 14 replay duplicated its badge');
 document.getElementById('result').textContent='PASS: Chapter 14 all-five-mission gate, 10 authored activities, two-part evidence grading, draft resume, 60% fail/70% pass, one-time badge, honest unavailable-content fallback';

})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.stack;});
`;
html=html.replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'chapter.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=15000','file:///'+file.replaceAll('\\','/')+'?chapter=c1'],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: browser returned no result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;

