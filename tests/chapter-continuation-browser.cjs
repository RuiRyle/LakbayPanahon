const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-chapter-'));
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
let html=fs.readFileSync(path.join(root,'pages/chapter-challenge.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const themeCss=['student.css','chapter-challenge.css','navy-gold-theme.css'].map(file=>fs.readFileSync(path.join(root,'css',file),'utf8').replace(/@import[^;]+;/g,'')).join('\n');
html=html.replace('</head>','<style>'+themeCss+'</style></head>');
const script=`
document.body.classList.remove('auth-checking');document.body.classList.add('authenticated');
const auth={currentUser:{uid:'test'}},db={},records=new Map();
records.set('users/test',{role:'student',status:'active',xp:50,level:1});records.set('learningSettings/progression',{xpPerLevel:100,version:1});
records.set('chapters/c1',{id:'c1',status:'active',title:'Test Chapter',eraId:'e1'});records.set('missions/m1',{id:'m1',chapterId:'c1',status:'active'});records.set('studentProgress/test_m1',{userId:'test',missionId:'m1',chapterId:'c1',completed:true});
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
const catalogReads=[];let continuationReadFailure=false,continuationReadGate=null;
const getDocs=async ref=>{
 if(ref.name==='chapters'){if(!ref.filters?.some(f=>f.field==='eraId'&&f.value==='e1'))throw Error('Unscoped chapter continuation read');if(continuationReadGate)await continuationReadGate;if(continuationReadFailure)throw Error('Offline continuation');}
 if(ref.name==='missions'&&!ref.filters?.some(f=>f.field==='chapterId'))throw Error('Unscoped mission read');
 catalogReads.push(ref);
const docs=[...records].filter(([key,row])=>key.startsWith(ref.name+'/')&&(!ref.filters||ref.filters.every(f=>row[f.field]===f.value))).map(([key,row])=>({id:key.split('/')[1],data:()=>row}));return{docs,forEach:fn=>docs.forEach(fn)};};
const serverTimestamp=()=>({toMillis:()=>100});
const runTransaction=async(_,fn)=>{fixtureWrites++;if(fixtureSaveFailure)throw Error("Offline");const writes=[];const result=await fn({get:getDoc,set:(key,row)=>writes.push(()=>records.set(key,row)),update:(key,row)=>writes.push(()=>records.set(key,{...records.get(key),...row}))});writes.forEach(fn=>fn());if(fixtureSaveGate)await fixtureSaveGate;return result;};
const requireLearningAccess=async()=>records.get('chapters/c1');class LearningAccessError extends Error{}
const onAuthStateChanged=(_,fn)=>{fixtureAuthListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
${source('quiz-draft-policy.js')}
${source('daily-policy.js')}
${source('progression-policy.js')}
${source('activity-policy.js')}
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
 const luminance=color=>color.match(/[0-9.]+/g).slice(0,3).map(Number).map(value=>{const v=value/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
 const contrast=(text,background)=>{const values=[luminance(text),luminance(background)].sort((a,b)=>b-a);return (values[0]+.05)/(values[1]+.05);};
 const nextPanel=document.querySelector('.chapter-next-unlock'),nextHeading=nextPanel.querySelector('h3');
 check(contrast(getComputedStyle(nextHeading).color,getComputedStyle(nextPanel).backgroundColor)>=4.5,'Next-step panel has unreadable heading contrast');
 check(contrast(getComputedStyle(document.getElementById('challengeResultPrimaryButton')).color,getComputedStyle(document.getElementById('challengeResultPrimaryButton')).backgroundColor)>=4.5,'Primary continuation button has unreadable text');
 check(getComputedStyle(document.getElementById('challengeResultBackButton')).backgroundColor!=='rgb(255, 255, 255)','Back action still has an unthemed white background');
 check(!document.getElementById('chapterChallengeResult').textContent.includes('Next Chapter Unlocked'),'Result promises unavailable content');
 document.getElementById('challengeResultPrimaryButton').click();check(fixtureNavigation==='era.html?era=e1','Final chapter did not return to its era');
 document.getElementById('challengeResultBackButton').click();check(fixtureNavigation==='mission.html?chapter=c1','Back did not preserve chapter');
 check(document.getElementById('challengeResultPrimaryButton').textContent==='Return to Era','Era return label missing');
 check(!catalogReads.some(ref=>ref.name==='missions'&&ref.filters?.some(f=>f.field==='chapterId'&&f.value!=='c1')),'Final chapter fetched unrelated missions');
 records.set('chapters/c2',{id:'c2',status:'active',title:'Next chapter <img src=x>',order:2,eraId:'e1'});
 records.set('missions/m2',{id:'m2',chapterId:'c2',status:'active'});
 await showChallengeResult();
 check(document.getElementById('challengeResultPrimaryButton').textContent==='Continue to Next Chapter','Eligible next chapter missing');
 document.getElementById('challengeResultPrimaryButton').click();check(fixtureNavigation==='mission.html?chapter=c2','Wrong next chapter route');
 check(!document.querySelector('#chapterChallengeResult img'),'Chapter title rendered as HTML');
 check(catalogReads.some(ref=>ref.name==='missions'&&ref.filters?.some(f=>f.field==='chapterId'&&f.value==='c2')),'Next chapter was not checked with a scoped query');
 continuationReadFailure=true;await showChallengeResult();
 check(document.getElementById('chapterChallengeResult').classList.contains('passed')&&records.get('studentChapterProgress/test_c1')?.completed,'Navigation failure changed acknowledged completion');
 check(document.getElementById('challengeResultPrimaryButton').textContent==='Return to Era','Read failure retained stale next chapter');
 check(!document.getElementById('retryChapterContinuationButton').hidden&&document.querySelector('.chapter-continuation-status').dataset.state==='error','Read failure lacks visible next-step recovery');
 check(document.querySelector('.chapter-continuation-status').textContent.includes('Your chapter is saved'),'Read failure obscures acknowledged completion');
 document.getElementById('challengeResultPrimaryButton').click();check(fixtureNavigation==='era.html?era=e1','Navigation failure lost safe era return');
 continuationReadFailure=false;
 let releaseContinuation;continuationReadGate=new Promise(resolve=>{releaseContinuation=resolve;});
 const rewardsBeforeRetry=fixtureWrites,readsBeforeRetry=catalogReads.filter(ref=>ref.name==='studentChapterProgress').length;
 const nextStepButton=document.getElementById('challengeResultPrimaryButton');
 document.getElementById('retryChapterContinuationButton').focus();
 document.getElementById('retryChapterContinuationButton').click();document.getElementById('retryChapterContinuationButton').click();await tick();
 check(nextStepButton.disabled&&nextStepButton.getAttribute('aria-busy')==='true'&&document.querySelector('.chapter-continuation-status').dataset.state==='loading','Pending next step allows an early fallback click');
 fixtureNavigation='';nextStepButton.click();check(fixtureNavigation==='','Pending next step navigated before lookup finished');
 check(catalogReads.filter(ref=>ref.name==='studentChapterProgress').length===readsBeforeRetry+1,'Repeated retry started overlapping next-step reads');
 releaseContinuation();await tick();await tick();continuationReadGate=null;
 check(!nextStepButton.disabled&&!nextStepButton.hasAttribute('aria-busy')&&nextStepButton.textContent==='Continue to Next Chapter','Next-step retry did not recover');
 check(document.activeElement===nextStepButton,'Explicit keyboard retry lost focus after recovery');
 check(document.getElementById('retryChapterContinuationButton').hidden&&fixtureWrites===rewardsBeforeRetry,'Navigation retry resubmitted chapter rewards');
 nextStepButton.click();check(fixtureNavigation==='mission.html?chapter=c2','Recovered continuation lost the next chapter');
 const replay=await completeChapter();check(!replay.firstCompletion&&!validatedChapterReward.newlyEarned,'Replay duplicated badge');
 globalThis.__lakbayExplorationPreview=true;const beforePreviewWrites=fixtureWrites;await showChallengeResult();
 check(document.getElementById('chapterChallengeResult').textContent.includes('Preview: passing score')&&document.getElementById('chapterChallengeResult').textContent.includes('no chapter completion'),'Preview challenge claims saved completion');
 check(fixtureWrites===beforePreviewWrites,'Preview challenge saved completion');globalThis.__lakbayExplorationPreview=false;
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
 studentAnswers=JSON.parse(savedAnswers);correctAnswers=fixtureQuestions.length;
 let releaseLateContinuation;continuationReadGate=new Promise(resolve=>{releaseLateContinuation=resolve;});
 const lateContinuation=showChallengeResult();await tick();
 check(document.getElementById('challengeResultPrimaryButton')?.disabled,'Late-lookup fixture did not reach pending state');
 auth.currentUser=null;fixtureAuthListener(null);releaseLateContinuation();await lateContinuation;continuationReadGate=null;
 check(!document.getElementById('chapterChallengeResult'),'Late continuation revealed a signed-out result');
 document.getElementById('result').textContent='PASS: scoped continuation reads, pending-action guard, visible retry without reward resubmission, next-chapter route and session recovery';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html=html.replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'chapter.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=5000','file:///'+file.replaceAll('\\','/')+'?chapter=c1'],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: browser returned no result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
