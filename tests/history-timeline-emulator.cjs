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
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-timeline-app-'));
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9341','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<60;i++){try{target=(await fetch('http://127.0.0.1:9341/json').then(r=>r.json())).find(t=>t.type==='page');if(target)break;}catch{}await delay(200);}if(!target)throw Error('Chrome did not start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const request=pending.get(message.id);if(request){pending.delete(message.id);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}});

 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await login('student@lakbay.local');await wait("location.pathname.includes('student-')");
 await send('Page.navigate',{url:base+'/pages/history-timeline.html'});
 await wait("document.body.classList.contains('authenticated')&&document.querySelectorAll('.history-timeline-stop').length>0&&document.getElementById('topXp')?.textContent==='0 XP'");
 check(true,'actual student authentication loads timeline and saved zero XP');
 check(await evaluate("(async()=>{const {app}=await import('/js/firebase-config.js');return app.options.projectId==='demo-lakbay-local';})()"),'real SDK remains in the isolated demo project');
 check(await evaluate("document.querySelectorAll('.history-timeline-stop').length===16"),'all 15 curriculum chapters and the introduction remain present');
 check(await evaluate("document.querySelector('[data-chapter-id=chapter-2]').dataset.state==='locked'&&!document.querySelector('[data-chapter-id=chapter-2] a')"),'actual saved progress does not unlock later chapters');
 await evaluate("(()=>{const f=document.getElementById('timelineEra');f.value='early-philippine-communities';f.dispatchEvent(new Event('change'));})()");
 await wait("document.querySelectorAll('.timeline-period').length===1");
 check(await evaluate("document.querySelector('.timeline-era-count b').textContent==='0 / 5'"),'era progress uses actual local Firestore chapter results');
 await evaluate("document.getElementById('retryTimeline').click()");await wait("!document.getElementById('retryTimeline').disabled&&document.querySelectorAll('.timeline-period').length===1");
 check(await evaluate("document.getElementById('timelineEra').value==='early-philippine-communities'"),'refresh preserves the chosen era');
 await wait("[...document.querySelectorAll('.timeline-chapter-art img')].every(img=>img.complete&&img.naturalWidth>0)");
 check(true,'reused chapter artwork loads successfully in the actual app');
 const shots=[];
 for(const width of [1440,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});await evaluate('window.scrollTo(0,0)');await delay(650);
  check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'actual timeline has no page overflow at '+width+'px');
  check(await evaluate("document.getElementById('topXp').getClientRects().length>0"),'shared saved-XP display stays visible at '+width+'px');
  const file='docs/validation/history-timeline-'+width+'-2026-11-06.png';const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(shot.data,'base64'));shots.push(file);
  await evaluate("document.querySelector('[data-chapter-id=chapter-1]').scrollIntoView({block:'center'})");await delay(650);const cardShot=await send('Page.captureScreenshot',{format:'png'});const cardFile='docs/validation/history-timeline-cards-'+width+'-2026-11-06.png';fs.writeFileSync(cardFile,Buffer.from(cardShot.data,'base64'));shots.push(cardFile);
 }
 const route=await evaluate("document.querySelector('.history-timeline-stop a').href");check(new URL(route).searchParams.get('chapter')==='era1-prologue'||new URL(route).searchParams.get('route')?.includes('era1-prologue'),'chapter action keeps its existing chapter route');
 await evaluate("document.querySelector('.history-timeline-stop a').click()");await wait("location.href.includes('mission.html')");check(true,'actual chapter action navigates to the existing mission route');
 const report={pass:true,verifiedAt:new Date().toISOString(),mode:'actual app and Firebase SDK; isolated local emulator; no production changes',checks,screenshots:shots};fs.writeFileSync('docs/validation/history-timeline-browser-2026-11-06.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(()=>{socket?.close();browser?.kill();});
