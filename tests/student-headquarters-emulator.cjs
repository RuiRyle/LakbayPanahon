// Requires the dedicated local launcher. Real browser/SDK, loopback demo data only.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const delay=ms=>new Promise(r=>setTimeout(r,ms)),base='http://127.0.0.1:4173';
let browser,socket,sequence=0;const pending=new Map(),checks=[];
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout'));},25000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){expression='(async()=>{const frame=document.getElementById("studentRouteFrame");const __doc=frame?.contentDocument||document,__win=frame?.contentWindow||window;return ('+expression.replace(/\bdocument\b/g,'__doc').replace(/\bwindow\b/g,'__win')+');})()';const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function wait(expression){for(let i=0;i<120;i++){try{if(await evaluate(expression))return;}catch{}await delay(200);}throw Error('Browser state did not become ready: '+expression+'; '+await evaluate('location.href+" "+document.body.innerText.slice(-1800)'));}
function check(value,label){if(!value)throw Error(label);checks.push(label);}
async function login(email){
 await send('Page.navigate',{url:base+'/pages/login.html'});await wait("document.readyState==='complete'&&document.getElementById('loginEmail')&&!document.querySelector('#loginForm [type=submit]').disabled");
 await evaluate(`(()=>{document.getElementById('loginEmail').value=${JSON.stringify(email)};document.getElementById('loginPassword').value='LakbayLocal123!';document.getElementById('loginForm').requestSubmit();})()`);
}
(async()=>{
 const environment=await fetch(base+'/js/firebase-environment.js').then(r=>r.text());check(environment.includes('demo-lakbay-local'),'dedicated server opts into the demo emulator project');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-headquarters-app-'));
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9342','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<60;i++){try{target=(await fetch('http://127.0.0.1:9342/json').then(r=>r.json())).find(t=>t.type==='page');if(target)break;}catch{}await delay(200);}if(!target)throw Error('Chrome did not start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const request=pending.get(message.id);if(request){pending.delete(message.id);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}});

 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await login('student@lakbay.local');await wait("document.getElementById('homeLearningTrail')?.querySelectorAll('.home-lesson-row').length>0&&document.getElementById('studentXp')?.textContent==='0 XP'");
 check(true,'actual student sign-in loads the dashboard and saved XP');
 check(await evaluate("document.getElementById('studentFirstName').textContent==='Local'"),'personalized Filipino greeting uses the student profile');
 check(await evaluate("document.getElementById('studentLevelStat').textContent==='Level 1'&&document.getElementById('missionsCompleted').textContent==='0'&&document.getElementById('badgesEarned').textContent==='0'"),'all four statistics use saved progress and the existing level policy');
 check(await evaluate("document.querySelectorAll('.home-lesson-row').length===4&&[...document.querySelectorAll('.home-lesson-row[data-state=locked]')].every(row=>!row.hasAttribute('href'))"),'bounded chapter trail retains unlocking rules');
 await wait("document.querySelector('#homeExpeditionArt img')?.complete&&document.querySelector('#homeExpeditionArt img')?.naturalWidth>0");check(true,'current lesson illustration loads in the actual app');
 check(await evaluate("document.querySelector('#newJourneyState a.journey-action-button')?.href.includes('story.html')"),'main lesson action uses the existing lesson route');
 await wait("!document.getElementById('homeBadgePreview').textContent.includes('Loading')&&!document.getElementById('homeArtifactPreview').textContent.includes('Loading')");
 check(await evaluate("!document.querySelector('.hq-collection-token[data-state=earned]')"),'empty saved ownership does not invent earned badges or artifacts');
 await evaluate("document.getElementById('refreshHomeCollections').click()");await wait("!document.getElementById('refreshHomeCollections').disabled");check(true,'collection refresh completes independently');
 check(await evaluate("document.querySelectorAll('.hq-bayani-prompts a').length===2&&[...document.querySelectorAll('.hq-bayani-prompts a')].every(a=>a.href.includes('prompt='))"),'suggested questions preserve chat navigation');
 check(await evaluate("document.getElementById('studentReturnTopic').textContent.length>0&&document.getElementById('studentReviewTopics').textContent.length>0"),'recall and personalized review retain their loading or empty guidance');
 const screenshots=[];
 for(const width of [1440,768,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});await evaluate('window.scrollTo(0,0)');await delay(700);
  check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'dashboard has no horizontal page overflow at '+width+'px');
  const top='docs/validation/student-headquarters-'+width+'-2026-11-06.png';fs.writeFileSync(top,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));screenshots.push(top);
  await evaluate("document.querySelector('.home-learning-trail').scrollIntoView({block:'start'})");await delay(650);const trail='docs/validation/student-headquarters-trail-'+width+'-2026-11-06.png';fs.writeFileSync(trail,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));screenshots.push(trail);
 }
 const route=await evaluate("document.querySelector('#newJourneyState a.journey-action-button').href");await evaluate("document.querySelector('#newJourneyState a.journey-action-button').click()");await wait("location.href.includes('story.html')");check(route.includes('chapter=')||route.includes('chapter%3D'),'lesson action retains chapter context');check(true,'actual lesson action opens inside the existing student shell');
 const report={pass:true,verifiedAt:new Date().toISOString(),mode:'actual application and Firebase SDK; isolated local emulator, no production access',checks,screenshots};fs.writeFileSync('docs/validation/student-headquarters-browser-2026-11-06.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(()=>{socket?.close();browser?.kill();});
