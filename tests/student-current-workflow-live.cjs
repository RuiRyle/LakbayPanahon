// Bounded real-SDK walkthrough. One isolated temporary student; no real learner account.
// Uses the normal-learning default in a fresh Chrome profile. Owned records are removed afterward.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-current-flow-'));
const report={startedAt:new Date().toISOString(),mode:'live-sdk-isolated-student',scope:'First prologue mission, weak-topic recovery, saved retry, next mission and reconnect',steps:[],cleanup:'not-needed'};
let server,chrome,ws,base,uid,adminToken,quotaFailure=false,sequence=0;
const pending=new Map(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sdk="const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');";
function pass(message){report.steps.push({status:'pass',message});console.log('PASS: '+message);}
function send(method,params={}){return new Promise((resolve,reject)=>{
    const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timed out: '+method));},25000);
    pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});ws.send(JSON.stringify({id,method,params}));
});}
async function raw(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function evaluate(expression){return raw(`(()=>{const target=document.getElementById('studentRouteFrame')?.contentWindow||window;return target.eval(${JSON.stringify(expression)});})()`);}
async function wait(expression,label){
    for(let i=0;i<100;i++){
        if(quotaFailure)throw Error('Firestore quota error detected; live walkthrough stopped.');
        try{if(await evaluate(expression))return;}catch(error){if(/quota error/.test(error.message))throw error;}
        await pause(250);
    }
    throw Error('Timed out: '+label+' — '+await evaluate('document.body.innerText.slice(-900)'));
}
async function go(route){const url=base+'/pages/'+route;
    if(await raw("!!document.getElementById('studentRouteFrame')"))await raw(`document.getElementById('studentRouteFrame').src=${JSON.stringify(url)}`);
    else await send('Page.navigate',{url});
    await pause(450);await wait('document.readyState==="complete"','page ready');
}
async function click(selector){await wait(`(()=>{const node=document.querySelector(${JSON.stringify(selector)});return node&&!node.disabled&&node.getClientRects().length;})()`,'visible '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(160);}
async function query(name,field,value){return evaluate(`(async()=>{${sdk}return(await f.getDocs(f.query(f.collection(db,${JSON.stringify(name)}),f.where(${JSON.stringify(field)},'==',${JSON.stringify(value)})))).docs.map(d=>({id:d.id,...d.data()}));})()`);}
async function profile(){return evaluate(`(async()=>{${sdk}const data=(await f.getDocFromServer(f.doc(db,'users',auth.currentUser.uid))).data();return{xp:Number(data.xp)||0,role:data.role};})()`);}
async function saveConfirmed(kind){const selector=kind==='story'?'#storyProgressActions .story-draft-status':'#quizContent > p[role="status"]';await wait(`document.querySelector(${JSON.stringify(selector)})?.textContent.startsWith('Your place is saved')`,kind+' save acknowledgement');}
async function screenshot(name){const result=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,name+'.png'),Buffer.from(result.data,'base64'));}
async function visualCheck(label,width){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<700});await pause(250);
    if(!await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))throw Error(label+' overflows at '+width+'px');
    await screenshot(label+'-'+width);pass(label+' has no horizontal overflow at an exact '+width+'px viewport');
}
async function readLesson(mission,sceneBank,{refresh=false}={}){
    await wait('!document.getElementById("storyContent").hidden','lesson loaded');
    const visited=new Set();let refreshed=false,currentScene;
    for(let attempt=0;attempt<130;attempt++){
        if(await evaluate('!document.getElementById("storyCompleteSection").hidden'))break;
        const state=await evaluate(`(()=>{const visible=id=>{const node=document.getElementById(id);return node&&!node.hidden&&!node.classList.contains('lesson-shelved');};return{reading:visible('storyText'),understanding:visible('lessonUnderstanding'),explore:visible('storyExplore'),decision:visible('storyDecision'),check:visible('storyQuickCheck'),clueHunt:visible('storyClueHunt'),title:document.getElementById('sceneTitle').textContent.trim(),position:document.getElementById('sceneProgressText').textContent,nextDisabled:document.querySelector('.lesson-flow .begin-mission-button').disabled};})()`);
        const index=Number(state.position.match(/Scene (\d+)/)?.[1]||1)-1;
        const displayedTitle=await evaluate('document.getElementById("sceneTitle").textContent.trim()');
        const mapped=sceneBank.find(scene=>scene.title?.trim()===displayedTitle);
        if(mapped)currentScene=mapped;
        const ordered=sceneBank.slice().sort((a,b)=>Number(a.order)-Number(b.order));
        const scene=currentScene||ordered[index];if(!scene)throw Error('Cannot identify authored scene for '+state.position);
        visited.add(scene.id);
        if(state.explore)await evaluate(`document.querySelectorAll('#storyExploreChoices button').forEach(button=>{if(button.getAttribute('aria-expanded')!=='true')button.click();})`);
        if(state.clueHunt&&scene.clueHunt?.correctAnswer){await evaluate(`(()=>{const answer=${JSON.stringify(scene.clueHunt.correctAnswer)};const button=[...document.querySelectorAll('#storyClueHuntChoices button')].find(b=>b.textContent.trim()===answer);if(button&&!button.disabled)button.click();})()`);}
        if(state.decision&&scene.decisionCorrectAnswer)await evaluate(`(()=>{const answer=${JSON.stringify(scene.decisionCorrectAnswer)};const button=[...document.querySelectorAll('#storyDecisionChoices button')].find(b=>b.textContent.trim()===answer);if(button&&!button.disabled)button.click();})()`);
        if(state.check&&scene.checkCorrectAnswer)await evaluate(`(()=>{const answer=${JSON.stringify(scene.checkCorrectAnswer)};const button=[...document.querySelectorAll('#quickCheckChoices button')].find(b=>b.dataset.answer===answer||b.textContent.trim()===answer);if(button&&!button.disabled)button.click();})()`);
        if(refresh&&!refreshed&&state.explore){
            await saveConfirmed('story');await send('Page.reload');await pause(600);await wait('document.getElementById("storyContent")&&!document.getElementById("storyContent").hidden','story after top-page refresh');
            await saveConfirmed('story');refreshed=true;pass('Actual top-page refresh restores the saved lesson scene and explored clues');continue;
        }
        await click('.lesson-flow .begin-mission-button');
    }
    await wait('!document.getElementById("storyCompleteSection").hidden','lesson completed');
    pass(`Completed ${visited.size} authored scene(s) through the one-activity Back/Continue interface`);
}
async function answerQuiz(bank,fail,{refresh=false,adaptiveBank=[]}={}){
    await wait('document.getElementById("quizContent")&&!document.getElementById("quizContent").hidden','quiz ready');
    if(await evaluate('!!document.querySelector("#quizMissionBriefing button")'))await click('#quizMissionBriefing button');
    const used=[];
    for(let index=0;index<5;index++){
        await wait('document.querySelector("#quizOptions button")&&!document.getElementById("questionCard").hidden','question');
        const rendered=await evaluate(`({text:document.getElementById('questionText').textContent.trim(),options:Object.fromEntries([...document.querySelectorAll('#quizOptions button')].map(b=>[b.dataset.option,b.querySelector('.quiz-option-text')?.textContent.trim()]))})`);
        const text=rendered.text,question=bank.find(item=>item.question?.trim()===text&&Object.entries(rendered.options).every(([key,value])=>String(item['option'+key]||'').trim()===value));
        if(!question)throw Error('Displayed quiz question not in its scoped active bank');used.push(question.id);
        const answer=fail?(question.correctAnswer==='A'?'B':'A'):question.correctAnswer;
        await click('#quizOptions [data-option="'+answer+'"]');
        if(refresh&&index===0){
            await saveConfirmed('quiz');await send('Page.reload');await pause(600);
            await wait(`document.querySelector('#quizOptions button.selected')?.dataset.option===${JSON.stringify(answer)}`,'saved selected answer after refresh');
            if(await evaluate('document.getElementById("questionText").textContent.trim()')!==text)throw Error('Refresh replaced the saved question');
            pass('Quiz answer and question identity survive an actual top-page reload');
        }
        await click('#nextQuestionButton');
    }
    await wait('!document.getElementById("flagReviewPanel").hidden','answer review');await click('#flagReviewPanel button:last-child');
    for(let extra=0;extra<24;extra++){
        if(await evaluate('!document.getElementById("quizResult").hidden'))break;
        const personalized=await evaluate('document.getElementById("questionProgress").textContent.startsWith("Personalized check")');
        if(!personalized){await pause(250);continue;}
        const prompt=await evaluate('document.getElementById("questionText").textContent.trim()'),question=adaptiveBank.find(row=>row.question?.trim()===prompt);
        if(!question)throw Error('Personalized check missing from the scoped practice bank');
        const answer=fail?(question.correctAnswer==='A'?'B':'A'):question.correctAnswer;
        const selector='#quizOptions [data-option="'+answer+'"]';
        if(await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});return b&&!b.disabled;})()`))await click(selector);
        await wait(`!document.getElementById('quizResult').hidden||(()=>{const b=document.getElementById('nextQuestionButton');return b&&!b.disabled&&b.getClientRects().length;})()`,'personalized feedback or saved result');
        if(await evaluate('!document.getElementById("quizResult").hidden'))break;
        await evaluate(`(()=>{const b=document.getElementById('nextQuestionButton');if(b&&!b.disabled&&b.getClientRects().length)b.click();})()`);await pause(160);
    }
    await wait('!document.getElementById("quizResult").hidden','acknowledged quiz result');
    const title=await evaluate('document.getElementById("quizResultTitle").textContent');
    if(fail?title.includes('Passed'):!title.includes('Passed'))throw Error('Unexpected quiz outcome');
    const saved=(await query('studentQuizAttempts','userId',uid)).find(row=>row.quizId===bank[0]?.quizId&&row.passed===!fail);
    if(!saved||!Array.isArray(saved.questionIds))throw Error('Cannot verify saved question identities from the owned attempt');
    pass(fail?'A genuine failed quiz saves without XP and offers mapped recovery':'A passing retry saves and confirms the mission result');return saved.questionIds;
}
async function adminRequest(endpoint,body){
    const response=await fetch(endpoint,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('Owned test cleanup HTTP '+response.status);return response.json();
}
async function finishChapter(missions,identity,{includeFirst=false}={}){
    report.scope+='; all four prologue missions, chapter challenge/replay, continuation and logout/login';
    for(const mission of includeFirst?missions:missions.slice(1)){
        const quiz=(await query('quizzes','missionId',mission.id)).find(row=>row.status==='active');
        if(!quiz)throw Error('Missing quiz for '+mission.id);
        const [scenes,bank,practice]=await Promise.all([query('storyScenes','missionId',mission.id),query('questions','quizId',quiz.id),query('practiceQuestions','missionId',mission.id)]);
        await go('story.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id}));
        await readLesson(mission,scenes.filter(row=>row.status==='active'));
        await click('#quizButton');await answerQuiz(bank,false,{adaptiveBank:practice});
        if(!(await query('studentProgress','userId',uid)).some(row=>row.missionId===mission.id&&row.completed===true))throw Error('Missing mission completion '+mission.id);
        pass('Saved completed mission '+mission.id);
    }
    const chapterId=missions[0].chapterId,challenge=(await query('chapterChallenges','chapterId',chapterId)).find(row=>row.status==='active');
    if(!challenge)throw Error('Missing chapter challenge');
    const questions=(await query('chapterChallengeQuestions','challengeId',challenge.id)).filter(row=>row.status==='active');
    async function playChallenge(){
        await go('chapter-challenge.html?'+new URLSearchParams({chapter:chapterId}));await click('#beginChallengeButton');
        for(let i=0;i<30;i++){
            if(await evaluate('!!document.querySelector("#chapterChallengeResult.passed")'))break;
            await wait('!!document.getElementById("challengeQuestionText")||!!document.querySelector("#chapterChallengeResult.passed")','challenge question or saved result');
            if(await evaluate('!!document.querySelector("#chapterChallengeResult.passed")'))break;
            const rendered=await evaluate(`({text:document.getElementById('challengeQuestionText').textContent.trim(),labels:[...document.querySelectorAll('#challengeOptions .matching-label')].map(n=>n.textContent.trim())})`);
            const text=rendered.text,question=questions.find(row=>row.question?.trim()===text&&(!rendered.labels.length||rendered.labels.every(label=>row.matchingPairs?.some(pair=>pair.left.trim()===label))));
            if(!question)throw Error('Challenge question absent from scoped bank: '+text);
            if(question.evidenceTask){
                await wait('!!document.querySelector(".evidence-clue-select")','evidence loaded');
                await evaluate(`(()=>{for(const [selector,value]of ${JSON.stringify([['.evidence-clue-select',question.evidenceTask.correctEvidenceId],['.evidence-conclusion-select',question.correctAnswer]])}){const s=document.querySelector(selector);s.value=value;s.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
            }else if(question.gameType==='matching'){
                await evaluate(`(()=>{const pairs=${JSON.stringify(question.matchingPairs)};for(const row of document.querySelectorAll('.matching-row')){const pair=pairs.find(p=>p.left===row.querySelector('label').textContent);const s=row.querySelector('select');s.value=pair.right;s.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
            }else if(question.gameType==='tradeSimulation'){
                for(let n=0;n<Number(question.requiredQuantity);n++)await click('.trade-quantity-button:last-child');
            }else await click('#challengeOptions [data-answer="'+question.correctAnswer+'"]');
            await click('#submitChallengeAnswer');
        }
        await wait('!!document.querySelector("#chapterChallengeResult.passed")&&!!document.getElementById("challengeResultPrimaryButton")&&!document.getElementById("challengeResultPrimaryButton").disabled','saved challenge result');
    }
    await playChallenge();
    const saved=(await query('studentChapterProgress','userId',uid)).find(row=>row.chapterId===chapterId&&row.completed===true);
    if(!saved)throw Error('Chapter completion not saved');
    const earned=await profile(),badges=await query('studentBadges','userId',uid);
    if(!badges.some(row=>row.chapterId===chapterId))throw Error('Chapter badge not saved');
    pass('Full prologue chapter and badge saved after its final challenge');
    await visualCheck('chapter-complete',1440);await visualCheck('chapter-complete',390);
    await click('#challengeResultPrimaryButton');await wait('location.pathname.endsWith("mission.html")||location.pathname.endsWith("era.html")','chapter continuation');
    const destination=await evaluate('location.pathname+location.search');
    await wait('document.body.classList.contains("authenticated")','continuation authorized');pass('Saved chapter result opens its authorized next destination');
    await playChallenge();if((await profile()).xp!==earned.xp||(await query('studentBadges','userId',uid)).length!==badges.length)throw Error('Challenge replay duplicated rewards');
    pass('Replaying the chapter challenge awards no duplicate XP or badge');
    await go('student-dashboard.html');await click('.logout-button');await wait('location.pathname.endsWith("login.html")','signed-out page');
    await wait(`(async()=>{const {auth}=await import('/js/firebase-config.js');return !auth.currentUser;})()`,'Auth signed out');pass('Visible logout clears the authenticated session');
    await evaluate(`(()=>{document.getElementById('loginEmail').value=${JSON.stringify(identity.studentEmail)};document.getElementById('loginPassword').value=${JSON.stringify(identity.studentPassword)};document.getElementById('loginForm').requestSubmit();})()`);
    await wait('location.pathname.endsWith("student-dashboard.html")&&document.body.classList.contains("authenticated")','signed-in Home');
    if((await profile()).xp!==earned.xp||!(await query('studentChapterProgress','userId',uid)).some(row=>row.chapterId===chapterId&&row.completed===true)||(await query('studentProgress','userId',uid)).filter(row=>row.chapterId===chapterId&&row.completed===true).length!==missions.length)throw Error('Saved chapter state changed after login');
    pass('Login restores all chapter missions, chapter completion and unchanged XP');
    report.chapter={missionCount:missions.length,badgeCount:badges.length,continuation:destination};
}
async function cleanup(){
    try{
        if(uid&&adminToken){
            // Revoke the isolated test identity first, even if Firestore quota later prevents cleanup.
            await adminRequest('https://identitytoolkit.googleapis.com/v1/projects/'+project+'/accounts:delete',{localId:uid});
            const api='https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents',names=[];
            for(const collection of ['studentProgress','studentQuizAttempts','studentPracticeProgress','studentReviewEvents','studentLearningDrafts','studentChapterProgress','studentDailyChallenges','studentArtifacts','studentBadges','studentEvidenceJournal','classMembers']){
                const rows=await adminRequest(api+':runQuery',{structuredQuery:{from:[{collectionId:collection}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}}}});
                for(const row of rows){if(!row.document)continue;if(row.document.fields?.userId?.stringValue!==uid)throw Error('Cleanup ownership mismatch');names.push(row.document.name);}
            }
            names.push('projects/'+project+'/databases/(default)/documents/users/'+uid);
            await adminRequest(api+':commit',{writes:names.map(name=>({delete:name}))});
            report.cleanup='complete';report.removedOwnedDocuments=names.length;fs.unlinkSync(path.join(dir,'temporary-account.json'));console.log('CLEANUP: temporary Auth account and '+names.length+' owned documents removed');
        }
    }catch(error){report.cleanup='needs-follow-up';report.cleanupError=error.message;console.error('CLEANUP REQUIRED: '+error.message+'; recovery file '+path.join(dir,'temporary-account.json'));process.exitCode=1;}
    ws?.close();chrome?.kill();server?.close();
    report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.log('Report: '+path.join(dir,'report.json'));
}
async function main(){
    if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('This bounded check uses the existing project, not emulators.');
    const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);
    if(!account)throw Error('Existing Firebase CLI login required.');adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
    server=http.createServer((request,response)=>{
        const url=new URL(request.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
        if(!file.startsWith(root+path.sep)||!/^\/(pages|js|css|assets)\//.test(url.pathname)){response.writeHead(404);return response.end();}
        fs.readFile(file,(error,data)=>{if(error){response.writeHead(404);return response.end();}response.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');response.end(data);});
    });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://localhost:'+server.address().port;
    const profileDir=path.join(dir,'chrome-profile');
    chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1050','--remote-debugging-port=0','--user-data-dir='+profileDir,'about:blank'],{windowsHide:true,stdio:'ignore'});
    chrome.on('error',error=>console.error('Chrome launch: '+error.message));
    const activePort=path.join(profileDir,'DevToolsActivePort');for(let i=0;i<80&&!fs.existsSync(activePort);i++)await pause(150);
    const port=fs.readFileSync(activePort,'utf8').split('\n')[0],tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    ws=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
    ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}if(message.method==='Runtime.consoleAPICalled'&&/resource-exhausted|quota exceeded|HTTP 429/.test(JSON.stringify(message.params)))quotaFailure=true;});
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
    // New isolated browser: exercise the shipped normal-mode default, without forcing it off.
    await go('register.html');await wait('document.getElementById("studentRegisterForm")','registration');
    const identity={firstName:'Capstone',lastName:'TemporaryTest',studentEmail:'capstone-flow-'+randomUUID()+'@example.com',studentPassword:randomBytes(24).toString('hex')};identity.studentConfirmPassword=identity.studentPassword;
    await evaluate(`(()=>{for(const [id,value]of Object.entries(${JSON.stringify(identity)}))document.getElementById(id).value=value;document.getElementById('studentTerms').checked=true;document.getElementById('studentRegisterForm').requestSubmit();})()`);
    await wait(`(async()=>{const {auth}=await import('/js/firebase-config.js');return!!auth.currentUser;})()`,'temporary registration identity');
    uid=await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');return auth.currentUser.uid;})()`);
    fs.writeFileSync(path.join(dir,'temporary-account.json'),JSON.stringify({uid,project,createdAt:new Date().toISOString()}),{mode:0o600});report.cleanup='pending';
    await wait('!document.getElementById("studentRegistrationContinue").hidden','registration profile saved');pass('Real registration saves the isolated student profile');
    await click('#studentRegistrationContinue');await wait('location.pathname.endsWith("student-dashboard.html")&&document.body.classList.contains("authenticated")','authenticated Home');
    pass('Registration opens the authenticated student dashboard');
    if(await evaluate('globalThis.__lakbayExplorationPreview!==false'))throw Error('Fresh student session did not default to normal learning');
    pass('Fresh student session uses normal learning without a testing-mode override');
    const missions=(await query('missions','chapterId','era1-prologue')).filter(row=>row.status==='active').sort((a,b)=>Number(a.order)-Number(b.order));
    if(process.argv.includes('--chapter-only')){
        report.scope='Full prologue chapter: all missions, challenge/replay, continuation and logout/login';
        await finishChapter(missions,identity,{includeFirst:true});report.status='pass';return;
    }
    const mission=missions[0];if(!mission)throw Error('First prologue mission missing');
    const quizzes=await query('quizzes','missionId',mission.id),quiz=quizzes.find(row=>row.status==='active');if(!quiz)throw Error('Active mission quiz missing');
    const [sceneBank,bank,practiceBank]=await Promise.all([query('storyScenes','missionId',mission.id),query('questions','quizId',quiz.id),query('practiceQuestions','missionId',mission.id)]);
    const initial=await profile();
    await go('story.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id}));await readLesson(mission,sceneBank.filter(row=>row.status==='active'),{refresh:true});
    await visualCheck('lesson-recap',390);await visualCheck('lesson-recap',1440);
    await click('#quizButton');const failed=await answerQuiz(bank,true,{refresh:true,adaptiveBank:practiceBank});
    if((await profile()).xp!==initial.xp)throw Error('A failed attempt changed XP');
    const reviewUrl=await evaluate('document.querySelector(".result-topic-route a")?.href');if(!reviewUrl)throw Error('No lesson-review route after failure');
    await go('my-journey.html');await wait('!document.getElementById("journeyPageContent").hidden&&document.querySelector("#journeyReviewTopics .journey-topic-card")','saved review-needed topic');pass('My Journey shows the saved weak-topic recovery action');
    await go(new URL(reviewUrl).pathname.split('/').pop()+new URL(reviewUrl).search);await wait('document.getElementById("topicReviewNotice")','mapped review');
    if(await evaluate('document.getElementById("topicReviewNotice").textContent.includes("not been configured")'))throw Error('Weak topic does not map to a lesson');
    await readLesson(mission,sceneBank.filter(row=>row.status==='active'));await click('#quizButton');await wait('location.pathname.endsWith("practice.html")&&!document.getElementById("practiceContent").hidden','targeted practice');
    if(await evaluate('!!document.querySelector("#guidedPracticeIntro button")'))await click('#guidedPracticeIntro button');
    for(let count=0;count<20;count++){
        if(await evaluate('!document.getElementById("practiceComplete").hidden'))break;
        const text=await evaluate('document.getElementById("practiceQuestion").textContent.trim()'),question=practiceBank.find(row=>row.question?.trim()===text);if(!question)throw Error('Practice prompt missing from scoped bank');
        await click('#practiceOptions [data-option="'+question.correctAnswer+'"]');await click('#checkAnswerButton');await click('#checkAnswerButton');
    }
    await wait('document.getElementById("practiceSaveStatus").textContent.includes("has been saved")','practice save');pass('Mapped lesson review leads to targeted practice with acknowledged saving');
    await click('#retryMissionQuizButton');const retried=await answerQuiz(bank,false,{adaptiveBank:practiceBank});
    const overlap=retried.filter(id=>failed.includes(id));report.retry={failedQuestionIds:failed,passedQuestionIds:retried,repeated:overlap};
    for(const id of overlap){
        const repeated=bank.find(question=>question.id===id);
        if(repeated&&bank.some(question=>question.status==='active'&&question.topic===repeated.topic&&question.difficulty===repeated.difficulty&&!failed.includes(question.id)&&!retried.includes(question.id)))throw Error('Retry repeated an item while an unused equivalent at the same level was available');
    }
    const completed=await profile();if(completed.xp!==initial.xp+Number(mission.xpReward))throw Error('Configured XP was not awarded exactly once');pass('Retry preserves topic coverage, uses available equivalents and awards configured XP once');
    await visualCheck('passing-result',390);await visualCheck('passing-result',1440);
    await click('#continueResultButton');await wait('location.pathname.endsWith("story.html")||location.pathname.endsWith("mission.html")','next learning route');pass('Saved result exposes its next learning destination');
    // Actual network disconnect/reconnect, bounded to one fresh quiz draft.
    await go('quiz.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id}));await wait('!document.getElementById("quizContent").hidden','replay quiz');
    if(await evaluate('!!document.querySelector("#quizMissionBriefing button")'))await click('#quizMissionBriefing button');
    await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    try{await click('#quizOptions [data-option="A"]');await wait(`document.querySelector('#quizContent > p[role="status"]')?.textContent.toLowerCase().includes('offline')`,'offline save notice');}
    finally{await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
    await saveConfirmed('quiz');pass('A real network disconnect reports unsaved work and reconnect reaches save acknowledgement');
    if((await profile()).xp!==completed.xp)throw Error('An unfinished replay changed XP');
    if(process.argv.includes('--chapter'))await finishChapter(missions,identity);
    report.status='pass';
}
main().catch(async error=>{report.status='fail';report.error=error.message;console.error('FAIL: '+error.message);if(ws?.readyState===1)await screenshot('failure').catch(()=>{});process.exitCode=1;}).finally(cleanup);
