// Explicit live desktop acceptance: real pages/SDK, original project, isolated temporary account.
// Uses the existing Firebase CLI login only to remove this test account's owned records.
const fs=require('fs'),http=require('http'),path=require('path'),os=require('os'),{spawn}=require('child_process'),{randomUUID,randomBytes}=require('crypto');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-desktop-')),port=19337,debug=19338;
let chrome,server,ws,uid,adminToken;const pending=new Map();let seq=0;const report=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function wait(expression,label){for(let i=0;i<120;i++){try{if(await evaluate(expression))return;}catch{}await pause(250);}throw Error('Timed out: '+label+' '+await evaluate('document.body.innerText.slice(-1800)'));}
async function go(url){await send('Page.navigate',{url:url.startsWith('http')?url:`http://localhost:${port}/pages/${url}`});await pause(700);await wait('document.readyState==="complete"','page ready');}
async function click(selector){await wait(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e&&!e.disabled;})()`,"enabled control "+selector);await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable control: '+${JSON.stringify(selector)}+' '+document.body.innerText.slice(-1200));e.click();})()`);await pause(350);}
function pass(message){report.push(message);console.log('PASS: '+message);}
const sdk=`const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');`;
async function catalog(name){return evaluate(`(async()=>{${sdk}return (await f.getDocs(f.collection(db,${JSON.stringify(name)}))).docs.map(d=>({id:d.id,...d.data()}));})()`);}
async function runQuiz(mission,fail=false){await go(`quiz.html?chapter=${mission.chapterId}&mission=${mission.id}`);await wait('document.querySelector("#quizContent")&&!document.querySelector("#quizContent").hidden&&document.querySelector("#quizOptions button")','quiz loaded');const bank=await catalog('questions');let ids=[];for(let n=0;n<5;n++){const text=await evaluate('document.querySelector("#questionText").textContent.trim()');const q=bank.find(q=>q.question?.trim()===text);if(!q)throw Error('Quiz question not found in Firestore');ids.push(q.id);await click(`#quizOptions [data-option="${fail?(q.correctAnswer==='A'?'B':'A'):q.correctAnswer}"]`);await click('#nextQuestionButton');if(n===0)await refreshDraft('quiz',mission.id,'#quizContent','document.querySelector("#quizOptions button:disabled")&&!document.getElementById("quizContent").hidden');await click('#nextQuestionButton');}await wait('!document.querySelector("#quizResult").hidden','quiz saved');const title=await evaluate('document.querySelector("#quizResultTitle").textContent');pass((fail?'Failed':'Passed')+' mission '+mission.id+': '+title.trim());return ids;}
const verifiedRefresh = new Set();
const canonical = value => JSON.stringify((function sort(item){return Array.isArray(item)?item.map(sort):item&&typeof item==='object'?Object.fromEntries(Object.keys(item).sort().map(key=>[key,sort(item[key])])):item;})(value));
async function refreshDraft(kind, scope, container, ready, label=kind) {
 if(verifiedRefresh.has(label))return;
 const savedStatus = JSON.stringify(container+' > p[role="status"]');
 await wait(`document.querySelector(${savedStatus})?.textContent.startsWith('Your place is saved')`,label+' save confirmation');
 const read = `(async()=>{${sdk}return (await f.getDocFromServer(f.doc(db,'studentLearningDrafts',auth.currentUser.uid+'_'+${JSON.stringify(kind)}+'_'+${JSON.stringify(scope)}))).data()?.state;})()`;
 const before=await evaluate(read);if(!before)throw Error(label+' draft missing');
 await send('Page.reload');await pause(700);await wait(ready,label+' restored interface');
 await wait(`document.querySelector(${savedStatus})?.textContent.startsWith('Your place is saved')`,label+' restored draft');
 const after=await evaluate(read);if(canonical(before)!==canonical(after))throw Error(label+' refresh changed saved answers or position');
 verifiedRefresh.add(label);pass(label+' refresh preserved saved answers, position and session');
}
async function ownedRecords(name){return evaluate(`(async()=>{${sdk}return (await f.getDocs(f.query(f.collection(db,${JSON.stringify(name)}),f.where('userId','==',auth.currentUser.uid)))).docs.map(d=>({id:d.id,...d.data()}));})()`);}
async function savedIdentity(){return evaluate(`(async()=>{${sdk}const p=(await f.getDocFromServer(f.doc(db,'users',auth.currentUser.uid))).data();return {firstName:p.firstName,lastName:p.lastName,avatarId:p.avatarId,xp:p.xp,learningStreak:p.learningStreak};})()`);}
async function runChapter(first){ await go(`chapter-challenge.html?chapter=${first.chapterId}`);await wait('!document.getElementById("beginChallengeButton").disabled','chapter unlocked');await click('#beginChallengeButton');const challengeBank=await catalog('chapterChallengeQuestions');for(let i=0;i<40;i++){if(await evaluate('!document.getElementById("chapterChallengeQuiz")'))break;const state=await evaluate(`(()=>{const e=document.querySelector('#challengeQuestionText');return {text:e?.textContent.trim(),body:document.body.innerText.slice(-500)};})()`);const q=challengeBank.find(q=>q.question?.trim()===state.text);if(!q){console.log('CHAPTER STATE: '+JSON.stringify(state));break;}console.log('Chapter question: '+q.id+' '+q.gameType);if(q.gameType==='matching')await evaluate(`(()=>{const q=${JSON.stringify(q)};document.querySelectorAll('.matching-select').forEach(s=>{const left=s.closest('.matching-row').querySelector('.matching-label').textContent.trim();s.value=q.matchingPairs.find(p=>p.left===left).right;s.dispatchEvent(new Event('change'));});})()`);else if(q.gameType==='tradeSimulation')for(let n=0;n<Number(q.requiredQuantity);n++)await evaluate("document.querySelectorAll('.trade-quantity-button')[1].click()");else await click(`.challenge-option[data-answer="${q.correctAnswer}"]`);await wait('document.getElementById("submitChallengeAnswer")&&!document.getElementById("submitChallengeAnswer").disabled','chapter answer selected');await refreshDraft('chapter',first.chapterId,'.chapter-challenge-intro','!!document.getElementById("chapterChallengeQuiz")',q.gameType+' chapter');await click('#submitChallengeAnswer');}
 await wait(`(async()=>{${sdk}return (await f.getDoc(f.doc(db,'studentChapterProgress',auth.currentUser.uid+'_'+${JSON.stringify(first.chapterId)}))).data()?.completed;})()`,'chapter completion saved');
}
async function recoveryChecks(first){
 const missing='missing-'+randomUUID();
 for(const [page,error,retry] of [['story','storyError','retryStoryLoadButton'],['quiz','quizError','retryQuizLoadButton'],['practice','practiceError','retryPracticeLoadButton']]){
   await go(page+'.html?chapter='+first.chapterId+'&mission='+missing);
   await wait(`!document.getElementById(${JSON.stringify(error)}).hidden&&!document.getElementById(${JSON.stringify(retry)}).hidden`,page+' missing-content recovery');
   pass(page+' missing mission shows an error and retry instead of learning content');
 }
 await go('quiz.html?chapter='+first.chapterId+'&mission='+first.id);await wait('document.querySelector("#quizOptions button")&&!document.getElementById("quizContent").hidden','quiz for connectivity checks');
 await send('Network.enable');
 try{
   await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
   await click('#quizOptions [data-option="A"]');await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.includes("offline")`,'offline unsaved message');
   pass('Offline answer clearly reports that the latest place is not saved');
 } finally {await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
 await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.startsWith("Your place is saved")`,'reconnected draft confirmation');
 const restored=await evaluate(`(async()=>{${sdk}return (await f.getDocFromServer(f.doc(db,'studentLearningDrafts',auth.currentUser.uid+'_quiz_'+${JSON.stringify(first.id)}))).data()?.state;})()`);if(!Object.values(restored?.answers||{}).includes('A'))throw Error('Offline answer was not saved after reconnect');pass('Reconnecting saved the pending answer to original Firestore');
 await send('Network.emulateNetworkConditions',{offline:false,latency:350,downloadThroughput:120000,uploadThroughput:120000});
 try{await click('#quizOptions [data-option="B"]');await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.startsWith("Your place is saved")`,'slow-network draft save');pass('A slow connection retained the answer and reached confirmed save');}
 finally{await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
}
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Original project only');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));const account=cli.getProjectDefaultAccount(root);adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)||!/^\/(pages|js|css|assets|images|fonts)\//.test(req.url)){res.writeHead(404);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(port,'127.0.0.1',r));
 chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1000','--remote-debugging-port='+debug,'--user-data-dir='+path.join(dir,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break;}catch{await pause(250);}}if(!tabs)throw Error('Chrome did not start');ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await send('Page.enable');
 await go('register.html');await wait('document.querySelector("#studentRegisterForm")','registration');const email='desktop-'+randomUUID()+'@example.com',password=randomBytes(20).toString('hex');await evaluate(`(()=>{for(const [id,value]of Object.entries(${JSON.stringify({firstName:'Desktop',lastName:'TemporaryTest',studentEmail:email,studentPassword:password,studentConfirmPassword:password})})){document.getElementById(id).value=value;}document.getElementById('studentTerms').checked=true;})()`);
 if(process.argv.includes('--validation-only')){
 await evaluate("(()=>{document.getElementById('firstName').value='';document.getElementById('studentRegisterForm').requestSubmit();})()");if(!await evaluate('!document.getElementById("firstName").validity.valid'))throw Error('Blank required name accepted');pass('Registration blocks blank required fields');
 await evaluate("(()=>{document.getElementById('firstName').value='Desktop';document.getElementById('studentTerms').checked=false;document.getElementById('studentRegisterForm').requestSubmit();})()");await wait('!document.getElementById("studentTerms").validity.valid||document.getElementById("studentRegisterMessage").textContent.includes("accept the terms")','terms validation');pass('Registration requires accepted terms');
 await evaluate("(()=>{document.getElementById('studentTerms').checked=true;document.getElementById('studentConfirmPassword').value='different-password';document.getElementById('studentRegisterForm').requestSubmit();})()");await wait('document.getElementById("studentRegisterMessage").textContent.includes("do not match")','password mismatch validation');const signedIn=await evaluate("(async()=>{const {auth}=await import('/js/firebase-config.js');return !!auth.currentUser;})()");if(signedIn)throw Error('Invalid registration created an account');pass('Mismatched passwords show an error without creating an account');console.log('Walkthrough report: '+dir);return;
 }
 await evaluate("document.getElementById('studentRegisterForm').requestSubmit()");
 await wait(`(async()=>{const {auth}=await import('/js/firebase-config.js');return !!auth.currentUser;})()`,'registration auth');uid=await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');return auth.currentUser.uid;})()`);fs.writeFileSync(path.join(dir,'test-account.json'),JSON.stringify({uid,email,password}));await wait('!document.getElementById("studentRegistrationContinue").hidden','profile created');pass('Actual registration form created a student profile');
 await click('#studentRegistrationContinue');await wait('location.pathname.includes("student-dashboard")','dashboard navigation');await pause(2000);pass('Registration continued to dashboard');
 if(process.argv.includes('--preview-sweep')){
  const initialXp=Number((await savedIdentity()).xp)||0;
  const chapters=(await catalog('chapters')).filter(row=>row.status==='active'&&row.contentReady!==false);
  const missions=(await catalog('missions')).filter(row=>row.status==='active');
  const challenges=(await catalog('chapterChallenges')).filter(row=>row.status==='active');
  if(chapters.length<15)throw Error('Fewer than 15 active chapters are published');
  if(challenges.length<11)throw Error('Fewer than 11 active chapter challenges are published');
  for(const chapter of chapters){
   const first=missions.filter(row=>row.chapterId===chapter.id).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id))[0];
   if(!first)throw Error('No active mission for '+chapter.id);
   await go('mission.html?chapter='+encodeURIComponent(chapter.id));
   await wait('!document.getElementById("missionContent").hidden','mission page '+chapter.id);
   await go('story.html?chapter='+encodeURIComponent(chapter.id)+'&mission='+encodeURIComponent(first.id));
   await wait('!document.getElementById("storyContent").hidden&&document.getElementById("sceneTitle").textContent.trim()','first lesson '+chapter.id);
   pass('Preview opened '+chapter.id+' and its first lesson');
  }
  for(const challenge of challenges){
   await go('chapter-challenge.html?chapter='+encodeURIComponent(challenge.chapterId));
   await wait('!document.getElementById("beginChallengeButton").disabled','challenge preview '+challenge.chapterId);
   pass('Preview opened challenge for '+challenge.chapterId);
  }
  for(const name of ['studentProgress','studentChapterProgress','studentQuizAttempts','studentBadges'])if((await ownedRecords(name)).length)throw Error('Preview sweep created unexpected '+name+' records');
  if((Number((await savedIdentity()).xp)||0)!==initialXp)throw Error('Preview sweep changed student XP');
  pass('Chapter sweep created no completion, attempt, badge or XP reward');
  console.log('Walkthrough report: '+dir);return;
 }
 if(process.argv.includes('--normal-mission-smoke')||process.argv.includes('--return-to-learn-smoke')){
  await evaluate("sessionStorage.setItem('lakbayExplorationPreview','off')");
  await go('student-dashboard.html');
  await wait('globalThis.__lakbayExplorationPreview===false&&document.querySelector(".journey-action-button")','normal student journey');
  const destination=new URL(await evaluate('document.querySelector(".journey-action-button").href'));
  const chapterId=destination.searchParams.get('chapter'),missionId=destination.searchParams.get('mission');
  if(!chapterId||!missionId)throw Error('First mission was not recommended');
  const activeMissions=await catalog('missions');
  const mission=activeMissions.find(row=>row.id===missionId&&row.chapterId===chapterId);
  if(!mission)throw Error('Recommended mission is not in the active catalog');
  await go('story.html?chapter='+encodeURIComponent(chapterId)+'&mission='+encodeURIComponent(missionId));
  await wait('!document.getElementById("storyContent").hidden&&document.getElementById("sceneTitle").textContent.trim()','normal first lesson');
  pass('Normal prerequisite path opened the first lesson');
  const initialXp=Number((await savedIdentity()).xp)||0;
  const chapterMissions=activeMissions.filter(row=>row.chapterId===chapterId&&row.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
  async function readQuizBank(targetMissionId){return evaluate(`(async()=>{${sdk}const quizzes=await f.getDocs(f.query(f.collection(db,'quizzes'),f.where('missionId','==',${JSON.stringify(targetMissionId)})));const quiz=quizzes.docs.find(d=>d.data().status==='active');if(!quiz)throw Error('No active mission quiz');return (await f.getDocs(f.query(f.collection(db,'questions'),f.where('quizId','==',quiz.id)))).docs.map(d=>({id:d.id,...d.data()}));})()`);}
  const bank=await readQuizBank(missionId);
  async function submitCorrectQuiz(targetMissionId,targetBank){
   await go('quiz.html?chapter='+encodeURIComponent(chapterId)+'&mission='+encodeURIComponent(targetMissionId));
   await wait('!document.getElementById("quizContent").hidden&&document.querySelector("#quizOptions button")','normal mission quiz');
   for(let number=0;number<5;number++){
    const question=await evaluate('document.getElementById("questionText").textContent.trim()');
    const expected=targetBank.find(row=>row.question?.trim()===question);
    if(!expected)throw Error('Displayed quiz question is absent from the mission bank');
    await click('#quizOptions [data-option="'+expected.correctAnswer+'"]');
    await click('#nextQuestionButton');
   }
   await click('#flagReviewPanel button:last-child');
   await wait('!document.getElementById("quizResult").hidden','saved mission result');
  }
  await submitCorrectQuiz(missionId,bank);
  const progress=await ownedRecords('studentProgress');
  if(!progress.some(row=>row.missionId===missionId&&row.completed===true))throw Error('Passing quiz did not save mission completion');
  const earnedXp=Number((await savedIdentity()).xp)||0;
  if(earnedXp-initialXp!==Number(mission.xpReward))throw Error('First completion XP did not match the authored mission reward: start '+initialXp+', end '+earnedXp+', expected +'+mission.xpReward);
  pass('Normal quiz saved completion and awarded authored XP once');
  if(process.argv.includes('--return-to-learn-smoke')){
   const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
   const headers={Authorization:'Bearer '+adminToken,'Content-Type':'application/json'};
   const age=new Date(Date.now()-5*86400000).toISOString();
   const aged=[];
   for(const name of ['studentProgress','studentQuizAttempts']){
    const response=await fetch(base+':runQuery',{method:'POST',headers,body:JSON.stringify({structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}}}})});
    if(!response.ok)throw Error('Could not read temporary '+name);
    for(const row of await response.json())if(row.document?.fields?.missionId?.stringValue===missionId)aged.push(row.document);
   }
   if(aged.length<2)throw Error('Temporary mission completion or quiz attempt missing');
   const writes=aged.map(document=>({update:{name:document.name,fields:{completedAt:{timestampValue:age}}},updateMask:{fieldPaths:['completedAt']},currentDocument:{updateTime:document.updateTime}}));
   const update=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes})});
   if(!update.ok)throw Error('Could not age temporary learning records');
   await go('student-dashboard.html');
   await wait('document.querySelector(".return-topic-card a")','due return-to-learn card');
   const due=await evaluate('(()=>{const card=document.querySelector(".return-topic-card");return {title:card.querySelector("h3").textContent,story:card.querySelector("a").href,practice:card.querySelectorAll("a")[1].href};})()');
   const story=new URL(due.story),practice=new URL(due.practice),topic=story.searchParams.get('reviewTopic');
   if(!story.pathname.endsWith('/story.html')||story.searchParams.get('mission')!==missionId||practice.searchParams.get('topic')!==topic)throw Error('Due memory card routes to the wrong lesson or practice topic');
   pass('Aged temporary mission showed an authored topic with lesson and practice links');
   const practiceBank=await catalog('practiceQuestions');
   const recallPrompt=await evaluate('document.querySelector(".return-recall-prompt")?.textContent.trim()');
   const recallQuestion=practiceBank.find(row=>row.missionId===missionId&&row.topic===topic&&row.question?.trim()===recallPrompt);
   if(!recallQuestion)throw Error('Due memory card lacks an authored recall question');
   await click('.return-recall-options button[data-option="'+recallQuestion.correctAnswer+'"]');
   await wait('document.querySelector(".return-recall-feedback")?.textContent.includes("Good thinking")','recall feedback');
   pass('One-question recall check used Firestore content and gave answer feedback');
   await click('.return-recall-check .text-button');
   const rotated=await evaluate('new URL(document.querySelector(".return-topic-card a").href).searchParams.get("reviewTopic")');
   if(rotated===topic)throw Error('Another Memory Clue repeated the same topic');
   pass('Another Memory Clue opened a different due topic');
   const practiceQuestion=practiceBank.find(row=>row.missionId===missionId&&row.topic===topic&&row.status==='active');
   if(!practiceQuestion)throw Error('No active practice question for due topic');
   const practiceDocument=base.replace('https://firestore.googleapis.com/v1/','')+'/studentPracticeProgress/'+uid+'_return_to_learn_check';
   const recent=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes:[{update:{name:practiceDocument,fields:{userId:{stringValue:uid},missionId:{stringValue:missionId},chapterId:{stringValue:chapterId},completedAt:{timestampValue:new Date().toISOString()},questionResults:{arrayValue:{values:[{mapValue:{fields:{questionId:{stringValue:practiceQuestion.id},topic:{stringValue:topic},firstTryCorrect:{booleanValue:true}}}}]}}}},currentDocument:{exists:false}}]})});
   if(!recent.ok)throw Error('Could not save temporary recent-practice evidence: '+recent.status+' '+(await recent.text()).slice(0,400));
   await go('student-dashboard.html');
   await wait('document.querySelector(".return-topic-card a")','next due return-to-learn card');
   const next=await evaluate('new URL(document.querySelector(".return-topic-card a").href).searchParams.get("reviewTopic")');
   if(next===topic)throw Error('Recent practice did not postpone the reviewed topic');
   pass('Recent saved practice postponed that topic and Home offered another due topic');
   console.log('Walkthrough report: '+dir);return;
  }
  await submitCorrectQuiz(missionId,bank);
  if((Number((await savedIdentity()).xp)||0)!==earnedXp)throw Error('Mission replay duplicated XP');
  if((await ownedRecords('studentProgress')).filter(row=>row.missionId===missionId).length!==1)throw Error('Mission replay duplicated completion');
  pass('Mission replay retained one completion and awarded no extra XP');
  for(const nextMission of chapterMissions.filter(row=>row.id!==missionId)){
   await submitCorrectQuiz(nextMission.id,await readQuizBank(nextMission.id));
   if(!(await ownedRecords('studentProgress')).some(row=>row.missionId===nextMission.id&&row.completed===true))throw Error('Mission did not complete: '+nextMission.id);
   pass('Completed '+nextMission.id+' under normal prerequisites');
  }
  const chapterXp=Number((await savedIdentity()).xp)||0;
  if(chapterXp-initialXp!==chapterMissions.reduce((sum,row)=>sum+Number(row.xpReward||0),0))throw Error('Chapter mission XP differs from authored rewards');
  const chapterChallenges=await evaluate(`(async()=>{${sdk}return (await f.getDocs(f.query(f.collection(db,'chapterChallenges'),f.where('chapterId','==',${JSON.stringify(chapterId)})))).docs.map(d=>({id:d.id,...d.data()}));})()`);
  const chapterChallenge=chapterChallenges.find(row=>row.status==='active');
  if(!chapterChallenge)throw Error('No active challenge for the completed chapter');
  const challengeBank=await evaluate(`(async()=>{${sdk}return (await f.getDocs(f.query(f.collection(db,'chapterChallengeQuestions'),f.where('challengeId','==',${JSON.stringify(chapterChallenge.id)})))).docs.map(d=>({id:d.id,...d.data()}));})()`);
  if(challengeBank.length!==10)throw Error('Chapter challenge bank does not have ten activities');
  async function submitCorrectChallenge(){
   await go('chapter-challenge.html?chapter='+encodeURIComponent(chapterId));
   await wait('!document.getElementById("beginChallengeButton").disabled','normal chapter challenge');
   await click('#beginChallengeButton');
   for(let number=0;number<10;number++){
    await wait('document.getElementById("challengeQuestionText")?.textContent.trim()','chapter activity '+(number+1));
    const prompt=await evaluate('document.getElementById("challengeQuestionText").textContent.trim()');
    const question=challengeBank.find(row=>Number(row.order)===number+1);
    if(!question||question.question?.trim()!==prompt)throw Error('Displayed chapter task differs from the ordered active bank');
    if(question.gameType==='matching'){
     await evaluate(`(()=>{const pairs=${JSON.stringify(question.matchingPairs)};document.querySelectorAll('.matching-select').forEach(select=>{const left=select.closest('.matching-row').querySelector('.matching-label').textContent.trim();select.value=pairs.find(pair=>pair.left===left).right;select.dispatchEvent(new Event('change'));});})()`);
    }else if(question.evidenceTask){
     await evaluate(`(()=>{const clue=document.querySelector('.evidence-clue-select'),conclusion=document.querySelector('.evidence-conclusion-select');clue.value=${JSON.stringify(question.evidenceTask.correctEvidenceId)};clue.dispatchEvent(new Event('change'));conclusion.value=${JSON.stringify(question.correctAnswer)};conclusion.dispatchEvent(new Event('change'));})()`);
    }else await click('.challenge-option[data-answer="'+question.correctAnswer+'"]');
    await click('#submitChallengeAnswer');
   }
   await wait('!!document.getElementById("chapterChallengeResult")','saved chapter result');
  }
  await submitCorrectChallenge();
  const chaptersAfter=await ownedRecords('studentChapterProgress'),badgesAfter=await ownedRecords('studentBadges');
  if(chaptersAfter.filter(row=>row.chapterId===chapterId&&row.completed===true).length!==1)throw Error('Passing challenge did not save one chapter completion');
  if(badgesAfter.filter(row=>row.chapterId===chapterId).length!==1)throw Error('Passing challenge did not save one badge');
  if((Number((await savedIdentity()).xp)||0)!==chapterXp)throw Error('Zero-XP chapter challenge changed student XP');
  pass('Normal chapter challenge saved one completion and badge without extra XP');
  await wait('document.getElementById("challengeResultPrimaryButton")&&!document.getElementById("challengeResultPrimaryButton").disabled','chapter continuation action');
  await click('#challengeResultPrimaryButton');
  await wait('location.pathname.includes("mission.html")&&!document.getElementById("missionContent").hidden','next chapter mission page');
  const nextChapter=new URL(await evaluate('location.href')).searchParams.get('chapter');
  if(nextChapter!=='chapter-1')throw Error('Prologue continuation did not open Chapter 1');
  pass('Prologue challenge continued to unlocked Chapter 1');
  await submitCorrectChallenge();
  if((await ownedRecords('studentChapterProgress')).filter(row=>row.chapterId===chapterId).length!==1||(await ownedRecords('studentBadges')).filter(row=>row.chapterId===chapterId).length!==1)throw Error('Challenge replay duplicated completion or badge');
  pass('Chapter challenge replay did not duplicate completion or badge');
  console.log('Walkthrough report: '+dir);return;
 }
 if(process.argv.includes('--preview-challenge-smoke')){
  const initialXp=Number((await savedIdentity()).xp)||0;
  await go('chapter-challenge.html?chapter=chapter-15');
  await wait('globalThis.__lakbayExplorationPreview===true&&!document.getElementById("beginChallengeButton").disabled','Chapter 15 preview challenge');
  const bank=await evaluate(`(async()=>{${sdk}return (await f.getDocs(f.query(f.collection(db,'chapterChallengeQuestions'),f.where('challengeId','==','challenge-15')))).docs.map(d=>({id:d.id,...d.data()}));})()`);
  if(bank.length!==10)throw Error('Chapter 15 challenge bank does not have ten activities');
  await click('#beginChallengeButton');
  for(let number=0;number<10;number++){
   await wait('document.getElementById("challengeQuestionText")?.textContent.trim()','Chapter 15 activity '+(number+1));
   const prompt=await evaluate('document.getElementById("challengeQuestionText").textContent.trim()');
   const question=bank.find(row=>row.question?.trim()===prompt);
   if(!question)throw Error('Displayed challenge task is absent from the active bank');
   if(question.evidenceTask){
    await evaluate(`(()=>{const clue=document.querySelector('.evidence-clue-select'),conclusion=document.querySelector('.evidence-conclusion-select');clue.value=${JSON.stringify(question.evidenceTask.correctEvidenceId)};clue.dispatchEvent(new Event('change'));conclusion.value=${JSON.stringify(question.correctAnswer)};conclusion.dispatchEvent(new Event('change'));})()`);
   }else if(question.gameType==='matching'){
    await evaluate(`(()=>{const pairs=${JSON.stringify(question.matchingPairs)};document.querySelectorAll('.matching-select').forEach(select=>{const left=select.closest('.matching-row').querySelector('.matching-label').textContent.trim();select.value=pairs.find(pair=>pair.left===left).right;select.dispatchEvent(new Event('change'));});})()`);
   }else throw Error('Unexpected Chapter 15 challenge activity type');
   await click('#submitChallengeAnswer');
  }
  await wait('!!document.getElementById("chapterChallengeResult")','Chapter 15 preview result');
  pass('Chapter 15 graded all ten evidence and matching activities in preview');
  for(const name of ['studentChapterProgress','studentBadges'])if((await ownedRecords(name)).length)throw Error('Preview challenge saved unexpected '+name+' records');
  if((Number((await savedIdentity()).xp)||0)!==initialXp)throw Error('Preview challenge changed student XP');
  pass('Chapter 15 preview challenge awarded no badge, completion or XP');
  console.log('Walkthrough report: '+dir);return;
 }
 if(process.argv.includes('--preview-smoke')){
  const initialXp=(await savedIdentity()).xp;
  await go('era.html?era=resistance-national-consciousness');
  await wait('!document.getElementById("eraOverview").hidden&&document.getElementById("eraProgressPanel")&&!document.getElementById("eraProgressPanel").hidden','Era 4 overview');
  if(!await evaluate('globalThis.__lakbayExplorationPreview===true'))throw Error('Local exploration preview is unavailable');
  pass('Authenticated Era 4 overview loaded with exploration preview');
  await go('story.html?chapter=chapter-15&mission=chapter15-mission1');
  await wait('!document.getElementById("storyContent").hidden&&document.getElementById("sceneTitle").textContent.trim()','Chapter 15 lesson');
  pass('Authenticated Chapter 15 lesson loaded');
  await evaluate('document.getElementById("storyReadingCard").scrollIntoView({block:"start"})');
  await send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(dir,'chapter15-first-scene.png'),Buffer.from(r.data,'base64')));
  await go('quiz.html?chapter=chapter-15&mission=chapter15-mission1');
  await wait('!document.getElementById("quizContent").hidden&&document.querySelector("#quizOptions button")','Chapter 15 quiz');
  pass('Authenticated Chapter 15 main quiz loaded in preview');
  for(let question=0;question<5;question++){
   await click('#quizOptions [data-option="A"]');
   await click('#nextQuestionButton');
  }
  await click('#flagReviewPanel button:last-child');
  await wait('!document.getElementById("quizResult").hidden','Chapter 15 preview quiz result');
  pass('Chapter 15 five-question quiz graded in preview');
  await go('chapter-challenge.html?chapter=chapter-15');
  await wait('!document.getElementById("beginChallengeButton").disabled','Chapter 15 challenge preview');
  pass('Authenticated Chapter 15 challenge is available for preview');
  for(const name of ['studentProgress','studentChapterProgress','studentQuizAttempts','studentBadges'])if((await ownedRecords(name)).length)throw Error('Preview smoke created unexpected '+name+' records');
  if((await savedIdentity()).xp!==initialXp)throw Error('Preview smoke changed student XP');
  pass('Preview navigation created no completion, attempt, badge or XP reward');
  console.log('Walkthrough report: '+dir);return;
 }
 await click('#profileButton');await wait('document.querySelector(".student-profile-dialog[open] input[name=avatarId]")','Firestore avatar catalog');await evaluate(`(()=>{const form=document.getElementById('studentProfileForm');form.elements.firstName.value='Desktop Updated';form.querySelector('input[name=avatarId]').click();form.requestSubmit();})()`);await wait('document.getElementById("studentProfileStatus").textContent.includes("Profile saved")','profile save');await click('.student-profile-close');pass('Profile form saved a name and Firestore catalog avatar');
 const missions=(await catalog('missions')).filter(m=>m.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));const quizzes=await catalog('quizzes');await wait('document.querySelector(".journey-action-button")','dashboard learning action');const journeyUrl=await evaluate('document.querySelector(".journey-action-button").href');const recommendedMission=new URL(journeyUrl).searchParams.get('mission');const first=missions.find(m=>m.id===recommendedMission);if(!first)throw Error('No configured mission');if(process.argv.includes('--recovery-only')){await recoveryChecks(first);console.log('Walkthrough report: '+dir);return;}
 await go(`story.html?chapter=${first.chapterId}&mission=${first.id}`);await wait('!document.getElementById("storyContent").hidden','lesson');for(let i=0;i<80;i++){if(await evaluate('!document.getElementById("storyCompleteSection").hidden'))break;await evaluate(`(()=>{document.querySelectorAll('.story-explore-choice:not(:disabled),.story-decision-choice:not(:disabled),.quick-check-choice:not(:disabled)').forEach(e=>e.click());const b=document.getElementById('continueStoryButton');if(!b.disabled)b.click();})()`);await pause(200);}await wait('!document.getElementById("storyCompleteSection").hidden','lesson recap');pass('Actual lesson interactions reached recap');await wait('document.querySelector("#storyContent > p[role=status]").textContent.startsWith("Your place is saved")','lesson draft save');await send('Page.reload');await pause(1500);await wait('!document.getElementById("storyCompleteSection").hidden','recap refresh');pass('Lesson recap persisted after refresh');
 const failedIds=await runQuiz(first,true);await click('#continueResultButton');await wait('location.pathname.includes("practice.html")','failure to practice navigation');await wait('document.querySelector("#practiceOptions button")','targeted practice');const practiceBank=await catalog('practiceQuestions');for(let i=0;i<50;i++){if(await evaluate('!document.getElementById("practiceComplete").hidden'))break;const text=await evaluate('document.getElementById("practiceQuestion").textContent.trim()');const q=practiceBank.find(q=>q.question?.trim()===text);if(!q)throw Error('Practice question not found');await click(`#practiceOptions [data-option="${q.correctAnswer}"]`);await click('#checkAnswerButton');await refreshDraft('practice',first.id,'#practiceContent','document.querySelector("#practiceOptions button")&&!document.getElementById("practiceContent").hidden');await click('#checkAnswerButton');}await wait('!document.getElementById("practiceComplete").hidden','practice complete');await wait('document.getElementById("practiceSaveStatus").textContent.includes("has been saved")','practice save');pass('Targeted practice completed and saved through actual controls');await click('#retryMissionQuizButton');await wait('location.pathname.includes("quiz.html")','practice to quiz navigation');const retryIds=await runQuiz(first);if(retryIds.some(id=>failedIds.includes(id)))throw Error('Immediate retry repeated questions');pass('Retry used an equivalent fresh question set');await click('#continueResultButton');await wait('location.pathname.includes("mission.html")&&!document.getElementById("missionContent").hidden','passed quiz to mission journey');const locked=await evaluate('document.querySelectorAll(".mission-path-item.locked:not(.chapter-challenge)").length');if(locked)throw Error('Next mission remained locked');pass('Passing returned to the journey and unlocked the next mission');
 for(const mission of missions.filter(m=>m.chapterId===first.chapterId&&m.id!==first.id))await runQuiz(mission);
 await runChapter(first);
 const records=await evaluate(`(async()=>{${sdk}return {chapter:(await f.getDoc(f.doc(db,'studentChapterProgress',auth.currentUser.uid+'_'+${JSON.stringify(first.chapterId)}))).data(),profile:(await f.getDoc(f.doc(db,'users',auth.currentUser.uid))).data()};})()`);if(!records.chapter?.completed)throw Error('Chapter UI completion not confirmed');pass('Chapter challenge saved completion');await wait('document.getElementById("challengeResultPrimaryButton")?.textContent.includes("Next Chapter")','next chapter continuation');await click('#challengeResultPrimaryButton');await wait('location.pathname.includes("mission.html")&&!document.getElementById("missionContent").hidden','next chapter access');pass('Continue to Next Chapter opened the unlocked mission journey');
 await go('student-dashboard.html');await pause(2000);await send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(dir,'dashboard.png'),Buffer.from(r.data,'base64')));pass('Dashboard loaded after chapter completion');
 const beforeReplay=await evaluate(`(async()=>{${sdk}return (await f.getDoc(f.doc(db,'users',auth.currentUser.uid))).data().xp;})()`);await runQuiz(first);const afterReplay=await evaluate(`(async()=>{${sdk}return (await f.getDoc(f.doc(db,'users',auth.currentUser.uid))).data().xp;})()`);if(beforeReplay!==afterReplay)throw Error('Replay duplicated XP');pass('Mission replay awarded no duplicate XP');
 const artifactsBefore=await ownedRecords('studentArtifacts'),badgesBefore=await ownedRecords('studentBadges');if(!artifactsBefore.length||badgesBefore.length!==1)throw Error('Expected earned collections missing');
 await runChapter(first);const badgesAfter=await ownedRecords('studentBadges');if(canonical(badgesBefore.map(b=>b.id).sort())!==canonical(badgesAfter.map(b=>b.id).sort()))throw Error('Chapter replay duplicated badges');pass('Chapter replay retained exactly one earned badge');
 const artifactsAfter=await ownedRecords('studentArtifacts');if(canonical(artifactsBefore.map(a=>a.id).sort())!==canonical(artifactsAfter.map(a=>a.id).sort()))throw Error('Replay duplicated artifact ownership');pass('Mission replay retained original artifact ownership');
 await go('achievements.html');await click('#toggleBadges');await wait('document.querySelectorAll(".achievement-badge-card").length===1&&document.getElementById("earnedBadgeCount").textContent==="1"','earned badge page');await click('#toggleArtifacts');await wait('document.getElementById("badges").hidden&&!document.getElementById("artifacts").hidden&&Number(document.getElementById("artifactCount").textContent)>0&&document.querySelectorAll(".artifact-card").length>0','artifacts on achievements');pass('Achievements displayed earned badges and artifact collections');
 await go('student-dashboard.html');await wait('document.querySelector("#bayaniAI a[href=\"bayani-ai.html\"]")','Bayani AI entry');pass('Bayani AI replaced the Daily Challenge dashboard entry');
 const identityBeforeLogin=await savedIdentity();const collectionIdsBefore={artifacts:(await ownedRecords('studentArtifacts')).map(a=>a.id).sort(),badges:(await ownedRecords('studentBadges')).map(b=>b.id).sort(),missions:(await ownedRecords('studentProgress')).map(m=>m.id).sort(),chapters:(await ownedRecords('studentChapterProgress')).map(c=>c.id).sort()};
 await click('.logout-button');await wait('location.pathname.includes("login.html")','logout redirect');pass('Actual Log Out control returned to login');await wait('document.getElementById("loginForm")','login form');await evaluate(`(()=>{document.getElementById('loginEmail').value=${JSON.stringify(email)};document.getElementById('loginPassword').value=${JSON.stringify(password)};document.getElementById('loginForm').requestSubmit();})()`);await wait('location.pathname.includes("student-dashboard")','fresh sign-in dashboard');await wait('document.querySelector(".journey-action-button")','restored journey');const restored=await evaluate(`(async()=>{${sdk}return (await f.getDoc(f.doc(db,'users',auth.currentUser.uid))).data().xp;})()`);if(restored!==identityBeforeLogin.xp)throw Error('XP changed after fresh login');if(canonical(await savedIdentity())!==canonical(identityBeforeLogin))throw Error('Saved profile/rewards changed after fresh login');const collectionIdsAfter={artifacts:(await ownedRecords('studentArtifacts')).map(a=>a.id).sort(),badges:(await ownedRecords('studentBadges')).map(b=>b.id).sort(),missions:(await ownedRecords('studentProgress')).map(m=>m.id).sort(),chapters:(await ownedRecords('studentChapterProgress')).map(c=>c.id).sort()};if(canonical(collectionIdsBefore)!==canonical(collectionIdsAfter))throw Error('Collections/progress changed after fresh login');pass('Actual login restored edited profile/avatar, XP/streak, missions, chapter, artifacts and badge ownership');
 console.log('Walkthrough report: '+dir);
}
async function cleanup(){if(uid&&adminToken){try{const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';const names=[];for(const name of ['studentProgress','studentQuizAttempts','studentPracticeProgress','studentReviewEvents','studentLearningDrafts','studentChapterProgress','studentDailyChallenges','studentArtifacts','studentBadges']){const r=await fetch(base+':runQuery',{method:'POST',headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}}}})});if(!r.ok)throw Error('Cleanup query '+r.status);for(const row of await r.json()){if(!row.document)continue;if(row.document.fields.userId.stringValue!==uid)throw Error('Cleanup ownership mismatch');names.push(row.document.name);}}names.push('projects/lakbaypanahon-1797e/databases/(default)/documents/users/'+uid);const r=await fetch(base+':commit',{method:'POST',headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},body:JSON.stringify({writes:names.map(name=>({delete:name}))})});if(!r.ok)throw Error('Cleanup commit '+r.status);const deleted=await fetch('https://identitytoolkit.googleapis.com/v1/projects/lakbaypanahon-1797e/accounts:delete',{method:'POST',headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},body:JSON.stringify({localId:uid})});if(!deleted.ok)throw Error('Temporary auth deletion '+deleted.status);fs.rmSync(path.join(dir,'test-account.json'),{force:true});console.log('Removed temporary account and owned learning records');}catch(error){console.error('CLEANUP REQUIRED: '+error.message+'; recovery file '+path.join(dir,'test-account.json'));process.exitCode=1;}}ws?.close();chrome?.kill();server?.close();fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));}
main().catch(async e=>{console.error(e.message);report.push('FAIL: '+e.message);if(ws?.readyState===1)await send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(dir,'failure.png'),Buffer.from(r.data,'base64'))).catch(()=>{});console.log('Walkthrough report: '+dir);process.exitCode=1;}).finally(cleanup);
