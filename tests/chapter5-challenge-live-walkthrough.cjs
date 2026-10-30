// Explicit live desktop acceptance: real pages/SDK, original project, isolated temporary account.
// Uses the existing Firebase CLI login only for this temporary account's fixtures and cleanup.
const fs=require('fs'),http=require('http'),path=require('path'),os=require('os'),{spawn}=require('child_process'),{randomUUID,randomBytes}=require('crypto');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-chapter5-challenge-live-')),port=19417,debug=19418;
const args=process.argv.slice(2),recoveryTailOnly=args.includes('--recovery-tail-only'),recoveryFile=path.join(dir,'test-account.json');
let chrome,server,ws,uid,adminToken,temporaryIdentity,quotaFailure;const pending=new Map();let seq=0;const report=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const quotaPattern=/\b429\b|resource-exhausted|reached its usage limit/i;
function stopForQuota(){
 if(!quotaFailure)quotaFailure=Error('Live Firestore returned HTTP 429/resource-exhausted. Stopped the walkthrough to avoid repeated live reads.');
 for(const [id,p] of pending)if(p.method==='Runtime.evaluate'){pending.delete(id);p.reject(quotaFailure);}
}
function send(method,params={}){return new Promise((resolve,reject)=>{if(ws?.readyState!==1)return reject(Error('Browser connection is not open'));const id=++seq;pending.set(id,{resolve,reject,method});ws.send(JSON.stringify({id,method,params}));});}
async function evaluateTop(expression){if(quotaFailure)throw quotaFailure;const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);if(quotaFailure)throw quotaFailure;return r.result?.value;}
// Student pages redirect into a persistent same-origin shell. Run activity code in
// that frame's own realm so document, location, events and SDK imports all agree.
async function evaluate(expression){return evaluateTop(`(()=>{
 const frame=document.getElementById('studentRouteFrame');
 if(!frame){if(document.body?.dataset.role==='student')throw Error('Student shell is opening');return (0,eval)(${JSON.stringify(expression)});}
 const activity=frame.contentWindow;
 if(!activity||activity.location.href==='about:blank')throw Error('Student content frame is loading');
 if(activity.location.origin!==location.origin)throw Error('Acceptance failure: student content frame is not same-origin');
 return activity.eval(${JSON.stringify(expression)});
})()`);}
async function wait(expression,label){
 for(let i=0;i<120;i++){
  try{if(await evaluate(`(async()=>{if(new RegExp(${JSON.stringify(quotaPattern.source)},'i').test(document.body?.innerText||''))throw Error('Firestore resource-exhausted: the page reports its usage limit.');return await (${expression});})()`))return;}
  catch(error){if(quotaFailure||quotaPattern.test(String(error?.message||error))||String(error?.message||error).includes('Acceptance failure:'))throw quotaFailure||error;}
  await pause(250);
 }
 throw Error('Timed out: '+label+' '+await evaluate('document.body.innerText.slice(-1800)'));
}
async function go(url){await send('Page.navigate',{url:url.startsWith('http')?url:`http://localhost:${port}/pages/${url}`});await pause(700);await wait('document.readyState==="complete"','page ready');}
async function click(selector){await wait(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e&&!e.disabled&&e.getClientRects().length>0&&!e.closest('[hidden],[inert]');})()`,"visible enabled control "+selector);await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length||e.closest('[hidden],[inert]'))throw Error('Unavailable control: '+${JSON.stringify(selector)}+' '+document.body.innerText.slice(-1200));e.click();})()`);await pause(350);}
function pass(message){report.push(message);console.log('PASS: '+message);}
const sdk=`const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');`;
const catalogCache=new Map();
async function catalog(name,field,value){if(!field)throw Error('Live catalog reads must be scoped');const key=JSON.stringify([name,field,value]);if(catalogCache.has(key))return catalogCache.get(key);const ref='f.query(f.collection(db,'+JSON.stringify(name)+'),f.where('+JSON.stringify(field)+',"==",'+JSON.stringify(value)+'))';const rows=await evaluate(`(async()=>{${sdk}return (await f.getDocs(${ref})).docs.map(d=>({id:d.id,...d.data()}));})()`);catalogCache.set(key,rows);return rows;}
async function catalogDoc(name,id){const key=JSON.stringify([name,id]);if(catalogCache.has(key))return catalogCache.get(key);const row=await evaluate(`(async()=>{${sdk}const snapshot=await f.getDoc(f.doc(db,${JSON.stringify(name)},${JSON.stringify(id)}));return snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null;})()`);catalogCache.set(key,row);return row;}
async function runQuiz(mission,fail=false){
 await go('quiz.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id}));await wait('document.querySelector("#quizContent")&&!document.querySelector("#quizContent").hidden&&document.querySelector("#quizOptions button")','quiz loaded');
 if(await evaluate('!!document.querySelector("#quizMissionBriefing button")'))await click('#quizMissionBriefing button');
 await wait('globalThis.__lakbayExplorationPreview===false&&!document.getElementById("questionCard").hidden','visible quiz under normal learning locks');
 const bank=await catalog('questions','quizId',mission.quizId),ids=[];
 for(let n=0;n<5;n++){const text=await evaluate('document.getElementById("questionText").textContent.trim()');const q=bank.find(q=>q.quizId===mission.quizId&&q.question?.trim()===text);if(!q)throw Error('Quiz question not found in live Firestore');ids.push(q.id);await click('#quizOptions [data-option="'+(fail?(q.correctAnswer==='A'?'B':'A'):q.correctAnswer)+'"]');if(n===0)await refreshDraft('quiz',mission.id,'#quizContent','document.querySelector("#quizOptions button")&&!document.getElementById("quizContent").hidden&&!document.getElementById("questionCard").hidden');await click('#nextQuestionButton');}
 await wait('!document.getElementById("flagReviewPanel").hidden','answer journal');await click('#flagReviewPanel button:last-child');await wait('!document.getElementById("quizResult").hidden','quiz saved');const title=await evaluate('document.getElementById("quizResultTitle").textContent');if(fail?!title.includes('Training'):!title.includes('Passed'))throw Error('Unexpected quiz result '+title);pass((fail?'Failed':'Passed')+' mission '+mission.id+' through actual controls');return ids;
}
const verifiedRefresh = new Set();
const canonical = value => JSON.stringify((function sort(item){return Array.isArray(item)?item.map(sort):item&&typeof item==='object'?Object.fromEntries(Object.keys(item).sort().map(key=>[key,sort(item[key])])):item;})(value));
async function refreshDraft(kind, scope, container, ready, label=kind) {
 if(verifiedRefresh.has(label))return;
 const savedStatus = JSON.stringify(container+' > p[role="status"]');
 await wait(`document.querySelector(${savedStatus})?.textContent.startsWith('Your place is saved')`,label+' save confirmation');
 const read = `(async()=>{${sdk}return (await f.getDocFromServer(f.doc(db,'studentLearningDrafts',auth.currentUser.uid+'_'+${JSON.stringify(kind)}+'_'+${JSON.stringify(scope)}))).data()?.state;})()`;
 const before=await evaluate(read);if(!before)throw Error(label+' draft missing');
 const activityRoute=await evaluate('location.href');
 // Reload the top page as a learner's F5 would, and require the displayed activity
 // route to survive along with its draft (including navigation inside the shell).
 await send('Page.reload');await pause(700);await wait('location.href==='+JSON.stringify(activityRoute)+'&&('+ready+')',label+' restored activity route and interface');
 await wait(`document.querySelector(${savedStatus})?.textContent.startsWith('Your place is saved')`,label+' restored draft');
 const after=await evaluate(read);if(canonical(before)!==canonical(after))throw Error(label+' refresh changed saved answers or position');
 verifiedRefresh.add(label);pass(label+' refresh preserved saved answers, position and session');
}
async function ownedRecords(name){return evaluate(`(async()=>{${sdk}return (await f.getDocs(f.query(f.collection(db,${JSON.stringify(name)}),f.where('userId','==',auth.currentUser.uid)))).docs.map(d=>({id:d.id,...d.data()}));})()`);}
async function savedIdentity(){return evaluate(`(async()=>{${sdk}const p=(await f.getDocFromServer(f.doc(db,'users',auth.currentUser.uid))).data();return {firstName:p.firstName,lastName:p.lastName,avatarId:p.avatarId,xp:p.xp??0,learningStreak:p.learningStreak};})()`);}
async function runChapter(first){
 await go('chapter-challenge.html?chapter='+first.chapterId);await wait('!document.getElementById("beginChallengeButton").disabled','all-four-mission challenge gate');await click('#beginChallengeButton');
 const bank=await catalog('chapterChallengeQuestions','challengeId','challenge-5');
 for(let i=0;i<10;i++){
 await wait('!!document.getElementById("challengeQuestionText")','challenge question');const text=await evaluate('document.getElementById("challengeQuestionText").textContent.trim()'),q=bank.find(q=>q.challengeId==='challenge-5'&&q.question?.trim()===text);if(!q)throw Error('Unrecognized Chapter 5 challenge question');
 if(q.evidenceTask){await wait('!!document.querySelector(".evidence-clue-select")','source clues loaded');await evaluate('(()=>{const q='+JSON.stringify(q)+';const clue=document.querySelector(".evidence-clue-select"),conclusion=document.querySelector(".evidence-conclusion-select");clue.value=q.evidenceTask.correctEvidenceId;clue.dispatchEvent(new Event("change"));conclusion.value=q.correctAnswer;conclusion.dispatchEvent(new Event("change"));})()');}
 else if(q.gameType==='matching')await evaluate('(()=>{const q='+JSON.stringify(q)+';for(const select of document.querySelectorAll(".matching-select")){const left=select.closest(".matching-row").querySelector(".matching-label").textContent.trim();select.value=q.matchingPairs.find(p=>p.left===left).right;select.dispatchEvent(new Event("change"));}})()');
 else throw Error('Unexpected Chapter 5 game type');
 await wait('!document.getElementById("submitChallengeAnswer").disabled','complete chapter evidence/answer');
 await refreshDraft('chapter',first.chapterId,'.chapter-challenge-intro','!!document.getElementById("chapterChallengeQuiz")','Chapter 5 '+(q.evidenceTask?'evidence':'matching'));
 await click('#submitChallengeAnswer');
 }
 await wait('!!document.getElementById("chapterChallengeResult")','challenge result');
 const chapter5=await catalogDoc('chapters',first.chapterId),chapter6=await catalogDoc('chapters','chapter-6');const ready6=!!chapter6&&chapter6.status==='active'&&chapter6.contentReady!==false&&(await catalog('missions','chapterId','chapter-6')).some(m=>m.status==='active');const expected=ready6?'Continue to Next Chapter':chapter5?.eraId?'Return to Era':'Explore Chapters';
 await wait(`(()=>{const status=document.querySelector('.chapter-continuation-status'),button=document.getElementById('challengeResultPrimaryButton');if(status?.dataset.state==='error')throw Error('Acceptance failure: '+status.textContent);return status?.dataset.state==='ready'&&button&&!button.disabled&&button.textContent.includes(${JSON.stringify(expected)});})()`,'resolved chapter continuation '+expected);
 const completed=await evaluate('(async()=>{'+sdk+'return (await f.getDocFromServer(f.doc(db,"studentChapterProgress",auth.currentUser.uid+"_chapter-5"))).data()?.completed;})()');if(completed!==true)throw Error('Chapter completion was not acknowledged by Firestore');
 if(recoveryTailOnly){await evaluate('document.querySelector(".chapter-continuation-status").scrollIntoView({block:"center",behavior:"instant"})');const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'chapter-result.png'),Buffer.from(screenshot.data,'base64'));}
 pass('All ten Chapter 5 tasks completed through actual evidence and matching controls; result offers '+expected);
 return expected;
}
async function recoveryChecks(first){
 const missing='missing-'+randomUUID();
 for(const [page,error,retry] of [['story','storyError','retryStoryLoadButton'],['quiz','quizError','retryQuizLoadButton'],['practice','practiceError','retryPracticeLoadButton']]){
   await go(page+'.html?chapter='+first.chapterId+'&mission='+missing);
   await wait(`!document.getElementById(${JSON.stringify(error)}).hidden&&!document.getElementById(${JSON.stringify(retry)}).hidden`,page+' missing-content recovery');
   pass(page+' missing mission shows an error and retry instead of learning content');
 }
 await go('quiz.html?chapter='+first.chapterId+'&mission='+first.id);await wait('document.querySelector("#quizOptions button")&&!document.getElementById("quizContent").hidden','quiz for connectivity checks');
 if(await evaluate('!!document.querySelector("#quizMissionBriefing button")'))await click('#quizMissionBriefing button');
 await wait('globalThis.__lakbayExplorationPreview===false&&!document.getElementById("questionCard").hidden','visible connectivity-check quiz under normal locks');
 await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.startsWith("Your place is saved")`,'initial connectivity draft save');
 const questionId=await evaluate(`(async()=>{${sdk}const state=(await f.getDocFromServer(f.doc(db,'studentLearningDrafts',auth.currentUser.uid+'_quiz_'+${JSON.stringify(first.id)}))).data()?.state;return state?.questionIds?.[state.index];})()`);if(!questionId)throw Error('Connectivity-check question was not saved');
 try{
   await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
   await click('#quizOptions [data-option="A"]');await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.includes("offline")`,'offline unsaved message');
   pass('Offline answer clearly reports that the latest place is not saved');
 } finally {await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
 await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.startsWith("Your place is saved")`,'reconnected draft confirmation');
 const restored=await evaluate(`(async()=>{${sdk}return (await f.getDocFromServer(f.doc(db,'studentLearningDrafts',auth.currentUser.uid+'_quiz_'+${JSON.stringify(first.id)}))).data()?.state;})()`);if(restored?.answers?.[questionId]!=='A')throw Error('Offline answer was not saved after reconnect');pass('Reconnecting saved the pending answer to original Firestore');
 await send('Network.emulateNetworkConditions',{offline:false,latency:350,downloadThroughput:120000,uploadThroughput:120000});
 try{await click('#quizOptions [data-option="B"]');await wait(`document.querySelector('#quizContent > p[role="status"]').textContent.startsWith("Your place is saved")`,'slow-network draft save');const slow=await evaluate(`(async()=>{${sdk}return (await f.getDocFromServer(f.doc(db,'studentLearningDrafts',auth.currentUser.uid+'_quiz_'+${JSON.stringify(first.id)}))).data()?.state;})()`);if(slow?.answers?.[questionId]!=='B')throw Error('Slow-network answer B was not saved to Firestore');pass('A slow connection retained answer B and confirmed it in Firestore');}
 finally{await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
}
async function chapterContinuationChecks(replay){
 const xpBeforeChapter=Number((await savedIdentity()).xp),chapter={chapterId:'chapter-5'},expected=await runChapter(chapter);
 let badges=(await ownedRecords('studentBadges')).filter(b=>b.badgeId==='first-encounters-investigator');if(badges.length!==1)throw Error('Chapter 5 badge missing or duplicated');if(Number((await savedIdentity()).xp)!==xpBeforeChapter)throw Error('Chapter challenge changed configured mission XP');pass('Chapter completion awards the authored badge without duplicate mission XP');
 if(expected!=='Continue to Next Chapter')throw Error('Chapter 6 is unavailable; the actual Chapter 6 result action remains unverified');
 await click('#challengeResultPrimaryButton');await wait('location.pathname.includes("mission.html")&&new URLSearchParams(location.search).get("chapter")==="chapter-6"&&globalThis.__lakbayExplorationPreview===false&&!document.getElementById("missionContent").hidden','Chapter 6 continuation');pass('Chapter 5 result opened unlocked Chapter 6 under normal locks');
 if(recoveryTailOnly){const activityRoute=await evaluate('location.href');await send('Page.reload');await pause(700);await wait('location.href==='+JSON.stringify(activityRoute)+'&&location.pathname.includes("mission.html")&&new URLSearchParams(location.search).get("chapter")==="chapter-6"&&globalThis.__lakbayExplorationPreview===false&&!document.getElementById("missionContent").hidden','Chapter 6 route after real top-page refresh');pass('A real top-page refresh preserved the actual Chapter 6 activity route, normal locks and mission content');}
 if(replay){await runChapter(chapter);badges=(await ownedRecords('studentBadges')).filter(b=>b.badgeId==='first-encounters-investigator');if(badges.length!==1||Number((await savedIdentity()).xp)!==xpBeforeChapter)throw Error('Chapter replay duplicated rewards');pass('Chapter challenge replay preserves one badge and existing XP');}
}
async function main(){
 if(args.length>1||args.some(arg=>!['--validation-only','--recovery-tail-only'].includes(arg)))throw Error('Usage: node tests/chapter5-challenge-live-walkthrough.cjs [--validation-only | --recovery-tail-only]');
 if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Original project only');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));const account=cli.getProjectDefaultAccount(root);adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)||!/^\/(pages|js|css|assets|images|fonts)\//.test(req.url)){res.writeHead(404);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(port,'127.0.0.1',r));
 chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1000','--remote-debugging-port='+debug,'--user-data-dir='+path.join(dir,'profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break;}catch{await pause(250);}}if(!tabs)throw Error('Chrome did not start');ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.method==='Network.responseReceived'&&m.params?.response?.status===429&&m.params.response.url.includes('firestore.googleapis.com'))stopForQuota();
  if(m.method==='Runtime.consoleAPICalled'&&quotaPattern.test((m.params?.args||[]).map(arg=>arg.description||arg.value||'').join(' ')))stopForQuota();
  if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
 });await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await go('register.html');await wait('document.querySelector("#studentRegisterForm")','registration');const email='desktop-'+randomUUID()+'@example.com',password=randomBytes(20).toString('hex');await evaluate(`(()=>{for(const [id,value]of Object.entries(${JSON.stringify({firstName:'Desktop',lastName:'TemporaryTest',studentEmail:email,studentPassword:password,studentConfirmPassword:password})})){document.getElementById(id).value=value;}document.getElementById('studentTerms').checked=true;})()`);
 if(args.includes('--validation-only')){
 await evaluate("(()=>{document.getElementById('firstName').value='';document.getElementById('studentRegisterForm').requestSubmit();})()");if(!await evaluate('!document.getElementById("firstName").validity.valid'))throw Error('Blank required name accepted');pass('Registration blocks blank required fields');
 await evaluate("(()=>{document.getElementById('firstName').value='Desktop';document.getElementById('studentTerms').checked=false;document.getElementById('studentRegisterForm').requestSubmit();})()");await wait('!document.getElementById("studentTerms").validity.valid||document.getElementById("studentRegisterMessage").textContent.includes("accept the terms")','terms validation');pass('Registration requires accepted terms');
 await evaluate("(()=>{document.getElementById('studentTerms').checked=true;document.getElementById('studentConfirmPassword').value='different-password';document.getElementById('studentRegisterForm').requestSubmit();})()");await wait('document.getElementById("studentRegisterMessage").textContent.includes("do not match")','password mismatch validation');const signedIn=await evaluate("(async()=>{const {auth}=await import('/js/firebase-config.js');return !!auth.currentUser;})()");if(signedIn)throw Error('Invalid registration created an account');pass('Mismatched passwords show an error without creating an account');console.log('Walkthrough report: '+dir);return;
 }
 temporaryIdentity={email,password};fs.writeFileSync(recoveryFile,JSON.stringify(temporaryIdentity));
 await evaluate("document.getElementById('studentRegisterForm').requestSubmit()");
 await wait(`(async()=>{const {auth}=await import('/js/firebase-config.js');return !!auth.currentUser;})()`,'registration auth');uid=await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');return auth.currentUser.uid;})()`);fs.writeFileSync(recoveryFile,JSON.stringify({uid,...temporaryIdentity}));await wait('!document.getElementById("studentRegistrationContinue").hidden','profile created');pass('Actual registration form created a student profile');
 if(!recoveryTailOnly){await click('#studentRegistrationContinue');await wait('location.pathname.includes("student-dashboard")','dashboard navigation');await pause(2000);pass('Registration continued to dashboard');}
 await evaluate("sessionStorage.setItem('lakbayExplorationPreview','off')");
 if(!recoveryTailOnly){await go('student-dashboard.html');await wait('globalThis.__lakbayExplorationPreview===false','normal progression mode');}
 const chapter5=await catalogDoc('chapters','chapter-5');
 const era=chapter5?.eraId?await catalogDoc('eras',chapter5.eraId):null;
 if(!chapter5||!era||!Array.isArray(era.requiredChapterIds)||!era.requiredChapterIds.length||era.requiredChapterIds.some(id=>typeof id!=='string'||!id||id==='chapter-5'))throw Error('Chapter 5 era prerequisites unavailable');
 const missionIds=['chapter5-mission1','chapter5-mission2','chapter5-mission3','chapter5-mission4'];
 const missions=await catalog('missions','chapterId','chapter-5');if(missions.filter(m=>m.status==='active').length!==4||missionIds.some(id=>!missions.some(m=>m.id===id&&m.status==='active')))throw Error('Expected four active Chapter 5 missions');
 const quizMissionIds=recoveryTailOnly?['chapter5-mission2']:missionIds,quizzes=(await Promise.all(quizMissionIds.map(id=>catalog('quizzes','missionId',id)))).flat();
 const replayQuiz=quizzes.find(q=>q.missionId==='chapter5-mission2'&&q.status==='active');if(!replayQuiz)throw Error('Mission 2 active quiz unavailable');
 const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
 const nameBase=base.replace('https://firestore.googleapis.com/v1/','');
 const timestamp=new Date().toISOString();
 const writes=era.requiredChapterIds.map(chapterId=>({update:{name:nameBase+'/studentChapterProgress/'+uid+'_'+chapterId,fields:{userId:{stringValue:uid},chapterId:{stringValue:chapterId},completed:{booleanValue:true},completedAt:{timestampValue:timestamp}}},currentDocument:{exists:false}}));
 if(recoveryTailOnly)for(const missionId of missionIds)writes.push({update:{name:nameBase+'/studentProgress/'+uid+'_'+missionId,fields:{userId:{stringValue:uid},chapterId:{stringValue:'chapter-5'},missionId:{stringValue:missionId},completed:{booleanValue:true},bestScore:{integerValue:'100'},completedAt:{timestampValue:timestamp},updatedAt:{timestampValue:timestamp}}},currentDocument:{exists:false}});
 const seeded=await fetch(base+':commit',{method:'POST',headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},body:JSON.stringify({writes})});
 if(!seeded.ok)throw Error('Could not seed temporary earlier-era prerequisites: '+seeded.status);
 pass('Only the temporary account received earlier-era prerequisite fixture records');
 if(recoveryTailOnly){
  pass('Recovery-tail fixture seeded four temporary Chapter 5 mission completions; no chapter completion, badge, XP or artifact was seeded. This does not verify first-time mission completion.');
  const mission={...missions.find(m=>m.id==='chapter5-mission2'),quizId:replayQuiz.id},xpBefore=Number((await savedIdentity()).xp)||0;
  await runQuiz(mission);if(Number((await savedIdentity()).xp)!==xpBefore)throw Error('Mission 2 replay duplicated XP');pass('Interrupted Mission 2 replay completed and preserved existing XP');
  await recoveryChecks(mission);
  await chapterContinuationChecks(false);console.log('Walkthrough report: '+dir);return;
 }
 const sceneBank=(await Promise.all(missionIds.map(id=>catalog('storyScenes','missionId',id)))).flat();
 for(const id of missionIds){
 const mission={...missions.find(m=>m.id===id),quizId:quizzes.find(q=>q.missionId===id&&q.status==='active').id};const initialXp=Number((await savedIdentity()).xp)||0;
 await go('story.html?chapter=chapter-5&mission='+mission.id);await wait('!document.getElementById("storyContent").hidden','lesson loaded');const seen=new Set();
 for(let i=0;i<10;i++){
 if(await evaluate('!document.getElementById("storyCompleteSection").hidden'))break;
 const title=await evaluate('document.getElementById("sceneTitle").textContent.trim()'),scene=sceneBank.find(s=>s.missionId===mission.id&&s.title?.trim()===title);if(!scene)throw Error('Scene not found: '+title);seen.add(scene.id);
 await wait('document.getElementById("storySceneImage").naturalWidth>0','authored illustration');
 await evaluate('document.querySelectorAll(".story-explore-choice:not(:disabled)").forEach(b=>b.click())');
 await evaluate('(()=>{const wanted='+JSON.stringify(scene.decisionCorrectAnswer)+';const b=[...document.querySelectorAll(".story-decision-choice")].find(b=>b.textContent.includes(wanted));if(!b)throw Error("Decision missing");if(!b.disabled)b.click();})()');
 if(scene.order===2)await refreshDraft('story',mission.id,'#storyContent','!document.getElementById("storyContent").hidden&&document.getElementById("sceneTitle").textContent.trim()==='+JSON.stringify(scene.title),mission.id+' lesson');
 await click('#continueStoryButton');
 }
 if(seen.size!==6)throw Error('Expected six scenes for '+mission.id);await wait('!document.getElementById("storyCompleteSection").hidden','lesson completion');pass(mission.id+' completed six illustrated scenes using actual clue and decision controls');
 if((Number((await savedIdentity()).xp)||0)!==initialXp)throw Error('Lesson awarded quiz XP early');
 if(id==='chapter5-mission1'){
  const failed=await runQuiz(mission,true);
  if((Number((await savedIdentity()).xp)||0)!==initialXp)throw Error('Failed quiz awarded XP');
  const reviewUrl=await evaluate('document.querySelector(".result-topic-route a").href');
  await go(reviewUrl);await wait('!document.getElementById("storyContent").hidden&&document.getElementById("topicReviewNotice")','mapped lesson review');
  if((await evaluate('document.getElementById("topicReviewNotice").textContent')).includes('not been configured'))throw Error('Chapter 5 review topic lacks a mapped scene');
  for(let step=0;step<10;step++){
   if(await evaluate('!document.getElementById("storyCompleteSection").hidden'))break;
   const title=await evaluate('document.getElementById("sceneTitle").textContent.trim()'),scene=sceneBank.find(s=>s.missionId===mission.id&&s.title?.trim()===title);if(!scene)throw Error('Review scene missing: '+title);
   await evaluate('document.querySelectorAll(".story-explore-choice:not(:disabled)").forEach(button=>button.click())');
   await evaluate('(()=>{const answer='+JSON.stringify(scene.decisionCorrectAnswer)+';const button=[...document.querySelectorAll(".story-decision-choice")].find(item=>item.textContent.includes(answer));if(button&&!button.disabled)button.click();})()');
   await click('#continueStoryButton');
  }
  await wait('!document.getElementById("storyCompleteSection").hidden','mapped lesson review completion');
  await click('#quizButton');await wait('location.pathname.includes("practice.html")&&document.querySelector("#practiceOptions button")','review to targeted practice');
  if(await evaluate('!!document.querySelector("#guidedPracticeIntro button")'))await click('#guidedPracticeIntro button');
  const practiceBank=await catalog('practiceQuestions','missionId',mission.id);
  for(let step=0;step<30;step++){
   if(await evaluate('!document.getElementById("practiceComplete").hidden'))break;
   const prompt=await evaluate('document.getElementById("practiceQuestion").textContent.trim()'),question=practiceBank.find(row=>row.question?.trim()===prompt);if(!question)throw Error('Targeted practice question missing');
   await click('#practiceOptions [data-option="'+question.correctAnswer+'"]');await click('#checkAnswerButton');await click('#checkAnswerButton');
  }
  await wait('document.getElementById("practiceSaveStatus").textContent.includes("has been saved")','targeted practice saved');
  if((Number((await savedIdentity()).xp)||0)!==initialXp)throw Error('Practice awarded mission XP');
  pass('Chapter 5 failed quiz led through mapped lesson and saved targeted practice without XP');
  await click('#retryMissionQuizButton');const retried=await runQuiz(mission);if(retried.some(question=>failed.includes(question)))throw Error('Chapter 5 retry reused a failed-attempt question');
  pass('Chapter 5 retry used five different questions');
 } else await runQuiz(mission);
 if(Number((await savedIdentity()).xp)!==initialXp+Number(mission.xpReward))throw Error('Wrong configured XP for '+mission.id);
 if(!(await ownedRecords('studentArtifacts')).some(a=>a.missionId===mission.id))throw Error('Missing artifact for '+mission.id);pass(mission.id+' awarded configured one-time XP and collectible');
 const xp=Number((await savedIdentity()).xp);await runQuiz(mission);if(Number((await savedIdentity()).xp)!==xp)throw Error('Replay duplicated XP');pass(mission.id+' replay preserved XP');
 }
 if((await ownedRecords('studentChapterProgress')).some(p=>p.chapterId==='chapter-5'&&p.completed))throw Error('Partial chapter completed early');
 if((await ownedRecords('studentBadges')).some(p=>p.chapterId==='chapter-5'))throw Error('Partial chapter badge awarded early');
 pass('Mission completion alone does not grant the chapter badge');
 await chapterContinuationChecks(true);
 console.log('Walkthrough report: '+dir);
}
async function cleanup(){
 // Stop client SDK retries before removing the temporary identity and its records.
 ws?.close();chrome?.kill();server?.close();
 if(temporaryIdentity&&adminToken)try{
  const headers={Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},authBase='https://identitytoolkit.googleapis.com/v1/projects/lakbaypanahon-1797e/accounts';
  // The email lookup also recovers an account created before an interrupted UID read.
  const lookup=await fetch(authBase+':lookup',{method:'POST',headers,body:JSON.stringify(uid?{localId:[uid]}:{email:[temporaryIdentity.email]})});if(!lookup.ok)throw Error('Temporary Auth lookup '+lookup.status);
  const users=(await lookup.json()).users||[];if(users.length>1||users[0]&&(users[0].email!==temporaryIdentity.email||uid&&users[0].localId!==uid))throw Error('Temporary Auth ownership mismatch');
  if(users[0]){uid=users[0].localId;fs.writeFileSync(recoveryFile,JSON.stringify({uid,...temporaryIdentity}));const deleted=await fetch(authBase+':delete',{method:'POST',headers,body:JSON.stringify({localId:uid})});if(!deleted.ok)throw Error('Temporary Auth deletion '+deleted.status);console.log('Removed temporary Auth account before owned Firestore cleanup');}
  if(uid){
   if(!/^[A-Za-z0-9]{20,40}$/.test(uid)||!/^desktop-[0-9a-f-]{36}@example\.com$/.test(temporaryIdentity.email))throw Error('Unexpected temporary account identity');
   const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents',names=[];
   for(const name of ['studentProgress','studentQuizAttempts','studentPracticeProgress','studentReviewEvents','studentLearningDrafts','studentChapterProgress','studentDailyChallenges','studentArtifacts','studentBadges','studentEvidenceJournal']){
    const r=await fetch(base+':runQuery',{method:'POST',headers,body:JSON.stringify({structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}}}})});if(!r.ok)throw Error('Cleanup query '+r.status);
    for(const row of await r.json()){if(!row.document)continue;if(row.document.fields?.userId?.stringValue!==uid||!row.document.name.startsWith('projects/lakbaypanahon-1797e/databases/(default)/documents/'+name+'/'))throw Error('Cleanup ownership mismatch');names.push(row.document.name);}
   }
   names.push('projects/lakbaypanahon-1797e/databases/(default)/documents/users/'+uid);if(names.length>500)throw Error('Too many owned records for one cleanup batch');
   const r=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes:names.map(name=>({delete:name}))})});if(!r.ok)throw Error('Cleanup commit '+r.status);console.log('Removed temporary account and '+names.length+' owned learning/profile records');
  }
  fs.rmSync(recoveryFile,{force:true});
 }catch(error){console.error('CLEANUP REQUIRED: '+error.message+'; keep recovery file '+recoveryFile);report.push('CLEANUP REQUIRED: '+error.message);process.exitCode=1;}
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));
}
main().catch(async e=>{console.error(e.message);report.push('FAIL: '+e.message);if(ws?.readyState===1)await send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(dir,'failure.png'),Buffer.from(r.data,'base64'))).catch(()=>{});console.log('Walkthrough report: '+dir);process.exitCode=1;}).finally(cleanup);
