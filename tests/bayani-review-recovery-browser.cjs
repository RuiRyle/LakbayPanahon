'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const output=path.resolve('build/bayani-review-recovery-browser');fs.mkdirSync(output,{recursive:true});
const original=fs.readFileSync('pages/bayani-ai.html','utf8');
let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const source=fs.readFileSync('js/bayani-review.js','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'');
const css=[...original.matchAll(/<link\b[^>]*href="\.\.\/css\/([^"]+)"[^>]*>/g)].map(match=>fs.readFileSync('css/'+match[1],'utf8')).join('\n');
const script=`
const auth={currentUser:{uid:'synthetic-student'}},db={};
let fails=true,reads=0,release=null;
const onAuthStateChanged=()=>{},doc=()=>null,collection=()=>null,where=()=>null,query=()=>null;
const getDocFromServer=async()=>{reads++;if(release)await release.promise;if(fails)throw Error('offline');return{exists:()=>true,data:()=>({status:'active',chapterId:'c1',title:'Trade and community'})};};
const getDocs=async()=>({docs:[{data:()=>({title:'A lesson',content:'Communities exchanged goods and ideas through trade. '.repeat(5)})}]});
const withBayaniDeadline=operation=>operation(),BAYANI_REPLY_TIMEOUT_MS=100,BAYANI_CONNECT_TIMEOUT_MS=100;
let aiCalls=0;
const connectBayani=async()=>({settings:{maxMessageCharacters:2000},send:async()=>{aiCalls++;return 'synthetic';}}),parseReviewQuestion=()=>({question:'What connects communities?',options:{A:'Trade',B:'A wall',C:'Silence',D:'Isolation'},answer:'A',explanation:'Trade supports exchange.'}),reviewPrompt=()=> 'Synthetic fixture prompt';
${source}
const verify=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');
 await prepare();verify(!retryLesson.hidden&&!retryLesson.disabled&&generate.disabled,'Failure recovery missing');
 retryLesson.focus();verify(document.activeElement===retryLesson,'Retry cannot receive keyboard focus');
 fails=false;let resolve;release={promise:new Promise(r=>resolve=r)};
 retryLesson.click();retryLesson.click();verify(reads===2&&generate.disabled,'Duplicate retry or premature generation');
 resolve();await new Promise(r=>setTimeout(r,40));
 verify(retryLesson.hidden&&!generate.disabled,'Successful retry did not restore review');
 verify(document.activeElement===generate,'Focus lost after retry control disappears');
 verify(!document.getElementById('reviewSourceLesson').hidden,'Source lesson link missing');
 verify(aiCalls===0,'Lesson retry invoked AI');
 generate.click();await new Promise(r=>setTimeout(r,40));
 const answer=document.getElementById('reviewQuestionOptions').children[0];answer.click();check.click();
 verify(feedback.textContent.includes('suggested answer')&&document.activeElement===feedback,'Checked feedback or focus missing');
 verify(check.disabled&&[...document.getElementById('reviewQuestionOptions').children].every(button=>button.disabled),'Checked answers remain editable');
 verify(document.documentElement.scrollWidth<=window.innerWidth,'Horizontal overflow');
 document.getElementById('result').textContent='PASS: retry, duplicate guard, final practice feedback, keyboard focus and layout';
})().catch(error=>document.getElementById('result').textContent='FAIL: '+error.message);
`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(output,'fixture.html');fs.writeFileSync(file,html);
const results=[];
(async()=>{
for(const width of [1440,900,390]){
 const profile=fs.mkdtempSync(path.join(output,'cdp-'+width+'-'));
 const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;
 try{
  let port;for(let i=0;i<100;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await new Promise(r=>setTimeout(r,50));}}
  if(!port)throw Error('Chrome did not start');
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();ws=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));let id=0;const pending=new Map();
  ws.addEventListener('message',event=>{const value=JSON.parse(event.data);if(pending.has(value.id)){pending.get(value.id)(value);pending.delete(value.id);}});
  const send=(method,params={})=>new Promise(resolve=>{const next=++id;pending.set(next,resolve);ws.send(JSON.stringify({id:next,method,params}));});
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await send('Page.navigate',{url:'file:///'+file.replaceAll('\\','/')+'?mission=m1&chapter=c1'});
  let message='RUNNING';for(let i=0;i<100;i++){const r=await send('Runtime.evaluate',{expression:"document.getElementById('result')?.textContent",returnByValue:true});message=r.result?.result?.value||'RUNNING';if(message!=='RUNNING')break;await new Promise(r=>setTimeout(r,50));}
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'review-'+width+'.png'),Buffer.from(screenshot.result.data,'base64'));
  results.push({width,message,pass:message.startsWith('PASS:')});
 }finally{ws?.close();child.kill();}
}
fs.writeFileSync('docs/validation/bayani-review-recovery-browser-2026-11-09.json',JSON.stringify({mode:'isolated-browser-mocked-SDK-no-network',results},null,2)+'\n');
console.log(JSON.stringify(results));process.exitCode=results.every(row=>row.pass)?0:1;
})().catch(error=>{console.error(error);process.exitCode=1;});
