// Requires the dedicated local launcher. Real browser/SDK, loopback demo data only.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const delay=ms=>new Promise(r=>setTimeout(r,ms));let base='http://127.0.0.1:4173',server;
let browser,socket,sequence=0;const pending=new Map(),checks=[];
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout'));},25000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});socket.send(JSON.stringify({id,method,params}));});}
const contexts=new Map();
async function evaluate(expression){const tree=await send('Page.getFrameTree');const child=tree.frameTree.childFrames?.find(f=>f.frame.url.includes('/pages/'));const contextId=child&&contexts.get(child.frame.id);const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,...(contextId?{contextId}:{})});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}async function wait(expression){for(let i=0;i<120;i++){try{if(await evaluate(expression))return;}catch{}await delay(200);}throw Error('Browser state did not become ready: '+expression+'; '+await evaluate('location.href+" "+document.body.innerText.slice(-1800)'));}
function check(value,label){if(!value)throw Error(label);checks.push(label);}
async function login(email){
 await send('Page.navigate',{url:base+'/pages/login.html'});await wait("document.readyState==='complete'&&document.getElementById('loginEmail')&&!document.querySelector('#loginForm [type=submit]').disabled");
 await evaluate(`(()=>{document.getElementById('loginEmail').value=${JSON.stringify(email)};document.getElementById('loginPassword').value='LakbayLocal123!';document.getElementById('loginForm').requestSubmit();})()`);
}
(async()=>{
 if(process.argv[2]){
  const {resolvePackage,createStudentWebServer}=require('../tools/serve-student-web.cjs');
  server=createStudentWebServer(resolvePackage(process.argv[2]));const fallback=server.listeners('request')[0];server.removeAllListeners('request');
  server.on('request',(req,res)=>{if(new URL(req.url,'http://localhost').pathname==='/js/firebase-environment.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end('export const firebaseEnvironment={mode:"emulator",projectId:"demo-lakbay-local"};');return;}const original=res.writeHead.bind(res);res.writeHead=(code,headers)=>{if(headers?.['Content-Security-Policy'])headers['Content-Security-Policy']=headers['Content-Security-Policy'].replace("connect-src 'self'","connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8180 http://127.0.0.1:5001 ws://127.0.0.1:8180");return original(code,headers);};fallback(req,res);});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port;
 }
 const environment=await fetch(base+'/js/firebase-environment.js').then(r=>r.text());check(environment.includes('demo-lakbay-local'),'dedicated server opts into the demo emulator project');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-emulator-browser-'));
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9337','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<60;i++){try{target=(await fetch('http://127.0.0.1:9337/json').then(r=>r.json())).find(t=>t.type==='page');if(target)break;}catch{}await delay(200);}if(!target)throw Error('Chrome did not start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.executionContextCreated'&&message.params.context.auxData?.isDefault)contexts.set(message.params.context.auxData.frameId,message.params.context.id);const request=pending.get(message.id);if(request){pending.delete(message.id);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}});
 await send('Page.enable');await send('Runtime.enable');await login('student@lakbay.local');
 await wait("location.pathname.includes('student-')");
 await send('Page.navigate',{url:base+'/pages/story.html?chapter=era1-prologue&mission=prologue-mission1'});
 await wait("document.getElementById('storyContent')&&!document.getElementById('storyContent').hidden");
 check(await evaluate("!!document.getElementById('storyMissionTitle').textContent.trim()"),'authenticated prologue lesson loads from seeded catalog');
 await send('Page.reload');
 await wait("document.getElementById('storyContent')&&!document.getElementById('storyContent').hidden");
 check(true,'lesson reopens after browser reload');
 await send('Page.navigate',{url:base+'/pages/quiz.html?chapter=era1-prologue&mission=prologue-mission1'});
 await wait("document.querySelector('#quizOptions button')&&!document.getElementById('quizContent').hidden");
 await evaluate("document.querySelector('#quizMissionBriefing button')?.click()");
 const bank=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections.questions;
 for(let i=0;i<5;i++){
  const state=await evaluate(`(async()=>{const c=await import('/js/student-assessment-client.js');return c.assessmentState({kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission1',quizId:'prologue-quiz1'});})()`);
  const correct=bank.find(q=>q.id===state.questions[i].id).correctAnswer;
  const answer=process.argv.includes('--fail')?(correct==='A'?'B':'A'):correct;
  await evaluate(`document.querySelector('#quizOptions button[data-option="${answer}"]').click();document.querySelector('#nextQuestionButton, #nextQuestion').click()`);
  await wait(`(async()=>{const c=await import('/js/student-assessment-client.js');return Object.keys(c.assessmentState({kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission1',quizId:'prologue-quiz1'})?.answers||{}).length===${i+1};})()`);
 }
 check(true,'five answers submitted through actual quiz controls');
 await wait("!!document.querySelector('#flagReviewPanel button:last-child')");
 await evaluate("document.querySelector('#flagReviewPanel button:last-child').click()");
 await wait("document.getElementById('questionNumber').textContent.includes('PERSONALIZED')");
 for(let i=0;i<3;i++){
  await evaluate("document.querySelector('#quizOptions button[data-option=\"B\"]').click();document.querySelector('#nextQuestionButton, #nextQuestion').click()");
  await wait("!document.getElementById('historicalClueCard')?.hidden");
  await evaluate("document.querySelector('#nextQuestionButton, #nextQuestion').click()");
  if(i<2)await wait(`document.getElementById('questionNumber').textContent.includes('${i+2}')&&!document.querySelector('#quizOptions button').disabled`);
 }
 await wait("document.getElementById('quizResult')&&!document.getElementById('quizResult').hidden");
 check(await evaluate("document.getElementById('quizScore').textContent.trim()") === (process.argv.includes('--fail')?'0%':'100%'),'actual quiz controls display the expected graded result');
 await send('Page.reload');
 await wait("document.getElementById('quizResult')&&!document.getElementById('quizResult').hidden");
 check(true,'saved quiz result survives browser reload'); const xp=await evaluate("(async()=>{const {auth,db}=await import('/js/firebase-config.js');await auth.authStateReady();const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');return(await f.getDocFromServer(f.doc(db,'users',auth.currentUser.uid))).data().xp;})()");
 check(xp===40,'lesson/result reloads preserve the one 40 XP award');
 if(process.argv.includes('--fail')){
  check(await evaluate("!!document.querySelector('a[href*=\"practice.html\"]')&&!!document.querySelector('a[href*=\"reviewTopic\"]')"),'failed result offers targeted lesson and practice links');
  await evaluate("document.getElementById('retryQuizButton').click()");
  await wait("document.querySelector('#quizOptions button')&&!document.getElementById('quizContent').hidden");
  check(await evaluate("(async()=>{const c=await import('/js/student-assessment-client.js');return Object.keys(c.assessmentState({kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission1',quizId:'prologue-quiz1'}).answers).length===0;})()"),'explicit retry opens a fresh unanswered attempt');
 }
 const report={mode:'actual-pages-local-seeded-student',scenario:process.argv.includes('--fail')?'failure-reload-retry':'passing-reload',package:process.argv[2]||'running-local-server',verifiedAt:new Date().toISOString(),pass:true,checks,limits:['Requires prior local-secured-catalog-smoke pass on fresh seeded student','Does not exercise full lesson interactions or a new student unlocking the next mission']};
 fs.writeFileSync(path.join(__dirname,'../docs/validation/local-study-browser-'+(process.argv.includes('--fail')?'failure-':'')+'2026-11-09.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(error=>{fs.writeFileSync(path.join(__dirname,'../docs/validation/local-study-browser-'+(process.argv.includes('--fail')?'failure-':'')+'2026-11-09.json'),JSON.stringify({pass:false,verifiedAt:new Date().toISOString(),checks,error:error.message},null,2));console.error(error.stack);process.exitCode=1;}).finally(()=>{socket?.close();browser?.kill();server?.closeAllConnections();server?.close();});
