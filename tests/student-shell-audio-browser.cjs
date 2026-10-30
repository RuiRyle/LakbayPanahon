// Real shell modules and Web Audio in Chrome; child Auth/data scripts are removed.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-shell-audio-')),checks=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const pages=new Set(['settings.html','student-dashboard.html','my-journey.html','story.html','quiz.html','practice.html','chapter-challenge.html']);
const modules=new Set(['student-shell.js','student-shell-route.js','student-audio-host.js']);
const probe=`(()=>{const Native=window.AudioContext||window.webkitAudioContext;window.__audioProbe={contexts:[],master:null,targets:[],errors:[]};window.addEventListener('error',event=>__audioProbe.errors.push(event.message));window.addEventListener('unhandledrejection',event=>__audioProbe.errors.push(String(event.reason)));if(!Native)return;window.AudioContext=class extends Native{constructor(...args){super(...args);__audioProbe.contexts.push(this);}createGain(){const node=super.createGain(),target=node.gain.setTargetAtTime.bind(node.gain);node.gain.setTargetAtTime=(value,time,constant)=>{if(constant===.75)__audioProbe.master=node;if(node===__audioProbe.master){node.__fixtureTarget=value;__audioProbe.targets.push(value);}return target(value,time,constant);};return node;}};})();`;
async function main(){
 const server=http.createServer((req,res)=>{
  try{
   const url=new URL(req.url,'http://local.invalid');let body,type='text/html; charset=utf-8';
   if(url.pathname==='/pages/student-shell.html')body=fs.readFileSync(path.join(root,'pages/student-shell.html'),'utf8');
   else if(url.pathname.startsWith('/js/')&&modules.has(url.pathname.slice(4))){body=fs.readFileSync(path.join(root,'js',url.pathname.slice(4)),'utf8');type='application/javascript';}
   else if(url.pathname.startsWith('/pages/')&&pages.has(url.pathname.slice(7))){
    const html=fs.readFileSync(path.join(root,url.pathname.slice(1)),'utf8');
    const css=[...html.matchAll(/<link\b[^>]*href=["']\.\.\/css\/([-a-z0-9]+\.css)["'][^>]*>/gi)].map(match=>fs.readFileSync(path.join(root,'css',match[1]),'utf8')).join('\n');
    const runtime=fs.readFileSync(path.join(root,'js/page-transition.js'),'utf8');
    body=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'').replace('</head>','<style>'+css+'</style></head>').replace('</body>',"<script>document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');\n"+runtime+'</script></body>');
   }else{res.writeHead(404);res.end();return;}
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; img-src 'self' data:; connect-src 'none'"});res.end(body);
  }catch{res.writeHead(500);res.end('Fixture error');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const profile=path.join(temp,'browser'),chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=document-user-activation-required','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--window-size=1440,1100','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws,send,launchError;chrome.on('error',error=>{launchError=error;});
 try{
  const portFile=path.join(profile,'DevToolsActivePort'),deadline=Date.now()+10000;
  while(!fs.existsSync(portFile)){if(launchError)throw launchError;if(Date.now()>deadline)throw Error('Chrome launch deadline');await delay(50);}
  const port=fs.readFileSync(portFile,'utf8').split(/\r?\n/)[0],targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  ws=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map();ws.addEventListener('message',event=>{const data=JSON.parse(event.data),request=pending.get(data.id);if(!request)return;pending.delete(data.id);clearTimeout(request.timer);data.error?request.reject(Error(data.error.message)):request.resolve(data.result);});
  send=(method,params={})=>new Promise((resolve,reject)=>{const request=++id,timer=setTimeout(()=>{pending.delete(request);reject(Error('Debugger deadline: '+method));},6000);pending.set(request,{resolve,reject,timer});ws.send(JSON.stringify({id:request,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
  const child=expression=>evaluate('(()=>{const w=document.getElementById("studentRouteFrame").contentWindow;return ('+expression+');})()');
  const wait=async(expression,message)=>{const until=Date.now()+7000;while(Date.now()<until){try{if(await evaluate(expression))return;}catch{}await delay(40);}throw Error(message);};
  await send('Page.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:probe});
  const base='http://127.0.0.1:'+server.address().port;
  await send('Page.navigate',{url:base+'/pages/student-shell.html?route=settings.html'});
  await wait('window.LakbayStudentAudio&&document.getElementById("studentRouteFrame")?.contentWindow?.document.querySelector("[data-music-start]")','Settings frame failed to load');
  const start=async()=>{
   await child('w.document.querySelector("[data-music-start]").focus()');
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
   await wait('window.LakbayStudentAudio.isPlaying()&&__audioProbe.master','Trusted keyboard gesture did not start shared Web Audio');
  };
  await start();check(await evaluate('__audioProbe.contexts.length===1&&__audioProbe.contexts[0].state==="running"'),'Trusted input starts one real running AudioContext');
  await evaluate('window.fixtureHost=LakbayStudentAudio;window.fixtureMaster=__audioProbe.master;window.fixtureOrigin=performance.timeOrigin;window.fixtureAudioTime=__audioProbe.contexts[0].currentTime');
  const route=async page=>{
   // A native frame navigation keeps the actual parent shell alive; no Auth/data module is run.
   await child('w.location.href='+JSON.stringify(page));
   await wait('document.getElementById("studentRouteFrame").contentWindow.location.pathname.endsWith('+JSON.stringify('/'+page)+')&&document.getElementById("studentRouteFrame").contentWindow.document.readyState==="complete"&&document.getElementById("shellLoading").hidden===true','Route did not load: '+page);
   await wait('new URLSearchParams(location.search).get("route")==='+JSON.stringify(page),'Shell route did not synchronize: '+page);
   await delay(100);
  };
  const target=()=>evaluate('__audioProbe.master.__fixtureTarget');
  for(const [page,level] of [['student-dashboard.html',1.12],['my-journey.html',1.12],['story.html',.3136],['quiz.html',.0001],['practice.html',.0001],['chapter-challenge.html',.0001],['settings.html',1.12]]){
   await route(page);
   check(await evaluate('performance.timeOrigin===fixtureOrigin&&LakbayStudentAudio===fixtureHost&&__audioProbe.master===fixtureMaster&&__audioProbe.contexts.length===1&&LakbayStudentAudio.isPlaying()'),'Shared player and music graph survive '+page);
   check(Math.abs((await target())-level)<.00001,'Expected background gain target on '+page);
  }
  check(await evaluate('__audioProbe.contexts[0].currentTime>fixtureAudioTime'),'Audio timeline continues across child-page navigation');
  await child('w.document.dispatchEvent(new w.CustomEvent("lakbay:daily-focus",{detail:{active:true}}))');check(Math.abs((await target())-.0001)<.00001,'Daily focus attenuates background music without restarting it');
  await child('w.document.dispatchEvent(new w.CustomEvent("lakbay:daily-focus",{detail:{active:false}}))');check(Math.abs((await target())-1.12)<.00001,'Leaving Daily Challenge focus restores normal music gain');
  await child('(()=>{const slider=w.document.querySelector("[data-volume-control=music]");slider.value="50";slider.dispatchEvent(new w.Event("input",{bubbles:true}));return true;})()');
  check(Math.abs((await target())-.7)<.00001,'Settings music volume updates the shared player');
  await child('w.document.querySelector("[data-preference-switch=\\"focus-audio\\"]").click()');
  await route('quiz.html');check(Math.abs((await target())-.7)<.00001,'Disabling Focus audio preserves the chosen volume on quiz entry');
  await route('settings.html');await child('w.document.querySelector("[data-preference-switch=\\"music\\"]").click()');
  check(await evaluate('!LakbayStudentAudio.isPlaying()'),'Music switch stops the shared player');
  await route('my-journey.html');check(await evaluate('!LakbayStudentAudio.isPlaying()'),'Music remains off after another page loads');
  await route('settings.html');await start();check(await evaluate('__audioProbe.contexts.length===1'),'Restart after turning music off reuses the existing AudioContext');
  await child('w.document.body.classList.remove("authenticated")');await wait('!LakbayStudentAudio.isPlaying()','Losing child authentication did not stop music');check(true,'Removing authenticated state stops shared background playback');
  check(await evaluate('__audioProbe.errors.length===0'),'No uncaught parent audio or module errors');
 }finally{
  if(send&&ws?.readyState===WebSocket.OPEN)await send('Browser.close').catch(()=>{});ws?.close();if(chrome.exitCode===null)chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
}
main().then(()=>{report('pass');console.log('PASS: shared shell/Web Audio continuity, reading/focus levels, volume, music-off persistence and auth-loss stop');}).catch(error=>{report('fail',error.message);console.error('FAIL: '+error.message);process.exitCode=1;});
function report(status,error=null){const files=['js/student-shell.js','js/student-shell-route.js','js/student-audio-host.js','js/page-transition.js','pages/student-shell.html'];fs.writeFileSync(path.join(root,'docs/validation/student-shell-audio-local.json'),JSON.stringify({checkedAt:new Date().toISOString(),status,error,mode:'loopback-real-shell-and-web-audio-with-simulated-child-auth',limits:'No Firebase/auth acceptance, speaker listening, waveform-quality judgment or fully populated learning screens',checks,sources:files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}))},null,2)+'\n');}
