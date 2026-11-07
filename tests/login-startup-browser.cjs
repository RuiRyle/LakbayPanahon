// No sign-in, account writes, or Firestore data reads: startup presentation only.
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.LAKBAY_PREVIEW_URL||'http://localhost:56738',checks=[];let chrome,ws,next=0;const pending=new Map(),delay=ms=>new Promise(r=>setTimeout(r,ms));
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout'));},15000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result?.value;}
async function wait(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await delay(200);}throw Error('State timeout: '+expression);}
function check(value,label){assert.ok(value,label);checks.push(label);}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-login-startup-'));chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9336','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});let target;for(let i=0;i<60;i++){try{target=(await fetch('http://127.0.0.1:9336/json').then(r=>r.json())).find(t=>t.type==='page');if(target)break;}catch{}await delay(200);}if(!target)throw Error('Chrome startup failed');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Page.navigate',{url:base+'/pages/login.html'});await wait("document.getElementById('loginForm')?.dataset.authReady==='true'");
 const timing=await evaluate("(()=>{const n=performance.getEntriesByType('navigation')[0];return{pageMs:Math.round(performance.now()),responseMs:Math.round(n.responseEnd),domReadyMs:Math.round(n.domContentLoadedEventEnd),slowestResources:performance.getEntriesByType('resource').sort((a,b)=>b.duration-a.duration).slice(0,8).map(r=>({url:r.name,durationMs:Math.round(r.duration),bytes:r.transferSize}))};})()");console.log('LOGIN_STARTUP_TIMING '+JSON.stringify(timing));
 check(await evaluate("document.readyState==='complete'&&!document.querySelector('#loginForm button[type=submit]').disabled&&!document.querySelector('.route-transition-overlay')"),'normal login becomes ready without a loading overlay');
 await evaluate("document.querySelector('.password-toggle').click()");
 check(await evaluate("document.getElementById('loginPassword').type==='text'"),'async auth initialization attaches login controls');
 await send('Network.setBlockedURLs',{urls:['*gstatic.com/firebasejs/*']});await send('Page.reload',{ignoreCache:true});
 await wait("document.readyState==='complete'&&!!document.getElementById('loginForm')&&document.getElementById('loginForm').dataset.authReady!=='true'");
 check(await evaluate("document.querySelector('.auth-page').checkVisibility({checkVisibilityCSS:true,checkOpacity:true})&&document.body.classList.contains('page-visible')"),'login renders even when remote Firebase scripts are blocked');
 check(await evaluate("document.querySelector('#loginForm button[type=submit]').disabled&&document.getElementById('loginForm').dataset.authReady!=='true'"),'unready authentication cannot submit account credentials');
 check(await evaluate("(()=>{const event=new Event('submit',{cancelable:true,bubbles:true});document.getElementById('loginForm').dispatchEvent(event);return event.defaultPrevented;})()"),'native form submission is prevented before authentication initialization');
 await wait("document.getElementById('loginMessage').textContent.includes('taking longer')");
 check(await evaluate("document.getElementById('loginMessage').textContent.includes('reload')&&!document.querySelector('.route-transition-overlay')"),'blocked script download shows useful recovery guidance instead of an endless loader');
 await send('Network.setBlockedURLs',{urls:[]});await send('Page.reload',{ignoreCache:true});await wait("document.getElementById('loginForm')?.dataset.authReady==='true'");
 check(await evaluate("!document.querySelector('#loginForm button[type=submit]').disabled&&!document.getElementById('loginMessage').textContent"),'reload recovers sign-in after the script connection returns');

 await send('Page.navigate',{url:base+'/pages/teacher-register.html'});
 await wait("location.pathname.endsWith('teacher-application.html')&&document.body.dataset.setupPhase==='account'&&document.getElementById('teacherRegisterForm')?.dataset.authReady==='true'");
 check(await evaluate("document.body.dataset.unifiedTeacherSetup==='true'&&!document.getElementById('teacherSetupAccount').hidden&&document.getElementById('applicationWorkspace').hidden"),'legacy registration URL opens the unified account setup in the actual Firebase-connected preview');
 check(await evaluate("document.querySelectorAll('[data-application-step]').length===4&&!document.querySelector('#teacherRegisterForm button[type=submit]').disabled"),'unified setup has four steps and its secure account handler is ready');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(250);
 check(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'unified registration page fits mobile before account creation');
 console.log(JSON.stringify({pass:true,mode:'real-browser-login-startup-only; no sign-in or Firestore reads',checks},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{ws?.close();chrome?.kill();});
