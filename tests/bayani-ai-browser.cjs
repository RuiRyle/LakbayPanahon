const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-bayani-'));
let html=fs.readFileSync(path.join(root,'pages/bayani-ai.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const source=fs.readFileSync(path.join(root,'js/bayani-ai.js'),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'');
const requestSource=fs.readFileSync(path.join(root,'js/bayani-request.js'),'utf8').replace(/export /g,'').replace('function withBayaniDeadline(','function actualBayaniDeadline(');
const css=['student.css','bayani-ai.css','navy-gold-theme.css'].map(name=>fs.readFileSync(path.join(root,'css',name),'utf8').replace(/^\uFEFF/,'')).join('\n');
const script=`
${requestSource}
let nextTimer=0;
const deadlineTimers=new Map();
const withBayaniDeadline=(operation,milliseconds)=>actualBayaniDeadline(operation,milliseconds,{
 setTimer(callback,delay){const id=++nextTimer;deadlineTimers.set(id,{callback,delay});return id;},
 clearTimer(id){deadlineTimers.delete(id);}
});
const auth={currentUser:{uid:'student'}};
let listener,connectionFails=true,connectionGate=null,replyFails=false,replyError=Error('Offline'),replyText='Explanation <img src=x onerror=bad>',gate=null,calls=[],connections=0;
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const connectBayani=async()=>{
 connections++;
 if(connectionGate)await connectionGate;
 if(connectionFails)throw Error('Unavailable');
 return {settings:{maxMessageCharacters:2000,welcomeMessage:'Welcome from Firestore'},send:async(message,history)=>{
  calls.push({message,history:JSON.parse(JSON.stringify(history))});
  if(gate)await gate;
  if(replyFails)throw replyError;
  return replyText;
 }};
};
${source}
const tick=()=>new Promise(r=>setTimeout(r,60));
const check=(ok,message)=>{if(!ok)throw Error(message);};
const submit=value=>{input.value=value;form.requestSubmit();};
const expireDeadline=milliseconds=>{
 const entry=[...deadlineTimers.entries()].find(([,timer])=>timer.delay===milliseconds);
 check(entry,'Expected deadline timer missing');deadlineTimers.delete(entry[0]);entry[1].callback();
};
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');
 await tick();check(input.disabled&&!retry.hidden,'Unavailable connection lacks retry');
 connectionFails=false;
 let releaseConnection;connectionGate=new Promise(r=>releaseConnection=r);retry.click();await tick();
 check(input.disabled&&retry.hidden,'Pending connection unexpectedly enabled chat');
 expireDeadline(30000);await tick();
 check(input.disabled&&!retry.hidden&&status.textContent.includes('too long to connect'),'Slow connection lacks deadline recovery');
 const beforeLateConnection=connections;connectionGate=null;releaseConnection();await tick();
 check(input.disabled&&!retry.hidden&&!log.children.length&&connections===beforeLateConnection,'Late connection returned or retried after timeout');
 retry.click();await tick();
 check(!input.disabled&&log.textContent.includes('Welcome from Firestore'),'Reconnect failed');
 submit('Explain trade');await tick();
 check(calls.length===1&&log.textContent.includes('<img src=x')&&!log.querySelector('img'),'Reply missing or rendered unsafe HTML');
 submit('Can you explain further?');await tick();
 check(calls[1].history.length===2,'Conversation context missing');
 replyFails=true;submit('Keep this question');await tick();
 check(input.value==='Keep this question'&&!input.disabled&&!log.textContent.includes('Keep this question'),'Failure lost draft or duplicated user message');
 check(status.textContent.includes('internet connection'),'Offline failure lacks connection guidance');
 replyError=Object.assign(Error('Sensitive provider detail'),{code:'resource-exhausted'});submit('Keep quota question');await tick();
 check(input.value==='Keep quota question'&&status.textContent.includes('usage limit')&&!status.textContent.includes('Sensitive'),'Quota failure lost draft or exposed provider detail');
 for(const code of ['ai/response-blocked','ai/response-error','ai/invalid-content']){
  replyError=Object.assign(Error('Sensitive provider detail'),{code});submit('Rephrase this question');await tick();
  check(input.value==='Rephrase this question'&&!input.disabled&&!status.textContent.includes('Sensitive'),'Known reply error lost question or exposed provider detail');
  check(/different way|rephrasing/.test(status.textContent)&&!status.textContent.includes('sending your question again'),'Known reply error requested an unchanged retry');
 }
 replyFails=false;replyText='  ';submit('No text question');await tick();
 check(input.value==='No text question'&&status.textContent.includes('different way')&&history.length===4,'Empty reply lost question or entered conversation history');
 replyText='Explanation <img src=x onerror=bad>';
 let releaseSlow;gate=new Promise(r=>releaseSlow=r);submit('Keep slow question');await tick();
 const beforeReplyTimeout=calls.length;expireDeadline(45000);await tick();
 check(input.value==='Keep slow question'&&!input.disabled&&!send.disabled&&status.textContent.includes('too long to reply')&&history.length===4,'Slow reply lost question or left controls disabled');
 check(!log.textContent.includes('Keep slow question')&&calls.length===beforeReplyTimeout,'Slow reply duplicated a question or retried automatically');
 let releaseNext;gate=new Promise(r=>releaseNext=r);submit('Question after timeout');await tick();
 releaseSlow();await tick();
 check(busy&&input.disabled&&status.textContent.includes('thinking')&&history.length===4,'Late answer changed the next request');
 gate=null;releaseNext();await tick();
 check(!input.disabled&&history.length===6&&!log.textContent.includes('Keep slow question'),'Reply after timeout did not recover cleanly');
 let release;gate=new Promise(r=>release=r);const beforeLogout=calls.length;submit('Old account question');form.requestSubmit();await tick();
 check(calls.length===beforeLogout+1,'Busy request allowed duplicate submission');
 auth.currentUser=null;listener(null);gate=null;release();await tick();
 check(!log.children.length&&input.disabled,'Late reply leaked after logout');
 auth.currentUser={uid:'other'};listener(auth.currentUser);await tick();
 check(log.children.length===1&&history.length===0,'New account retained previous chat');
 const beforeNewChat=connections;document.getElementById('newBayaniChat').click();await tick();
 check(history.length===0&&!input.value&&log.children.length===0&&connections===beforeNewChat,'New chat did not clear locally');
 let releaseReset;gate=new Promise(r=>releaseReset=r);submit('Question before reset');await tick();
 document.getElementById('newBayaniChat').click();gate=null;releaseReset();await tick();
 check(!log.children.length&&history.length===0&&connections===beforeNewChat,'Late reply returned after New Chat');
 submit('Question before leaving');await tick();window.dispatchEvent(new PageTransitionEvent('pagehide'));
 check(!log.children.length&&history.length===0&&input.disabled,'Page exit retained chat');
 window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));await tick();
 check(!input.disabled&&history.length===0,'History navigation did not reconnect cleanly');
 check(deadlineTimers.size===0,'Settled requests retained deadline timers');
 check(document.documentElement.scrollWidth<=window.innerWidth,'Chat layout overflows horizontally');
 const hostile='<img data-attack src=x onerror="window.renderAttack=1"><svg data-attack onload="window.renderAttack=1"></svg><script data-attack>window.renderAttack=1<'+ '/script>';
 const markdown='**'+hostile+'**\\n\\n- [unsafe](javascript:alert(1))\\n1. '+hostile;
 const assistant=bubble('assistant',markdown),student=bubble('user',hostile);
 await tick();
 check(!log.querySelector('img,svg,script,a,[onerror],[onload]')&&window.renderAttack===undefined,'Chat interpreted hostile HTML or markdown URLs');
 check(assistant.querySelector('.bayani-message-content strong').textContent===hostile&&assistant.querySelector('ul')&&assistant.querySelector('ol'),'Safe markdown lost literal text or list formatting');
 check(student.querySelector('p').textContent===hostile,'Student message lost literal text');
 ${process.argv.includes('--preview') ? "client=null;busy=false;log.replaceChildren();input.disabled=send.disabled=true;retry.hidden=false;status.textContent='Bayani AI is unavailable right now. Please try connecting again later.';syncChatAppearance();" : ''}
 document.getElementById('result').textContent='PASS: chat deadlines, draft recovery, known reply errors, local New Chat, session isolation and hostile HTML/markdown';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'bayani.html');fs.writeFileSync(file,html);
const r=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--window-size=1440,1100','--screenshot='+path.join(temp,'bayani.png'),'--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=5000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(r.error)throw r.error;
const result=r.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];
console.log(result||'FAIL: no result');console.log('Screenshot: '+path.join(temp,'bayani.png'));
process.exitCode=result?.startsWith('PASS:')?0:1;
