// Native Chrome keyboard input and a real reload of local Settings. No Firebase SDK/data.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-settings-keyboard-'));
const checks=[];let screenshot=null;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
async function main(){
 const css=['student.css','navy-gold-theme.css','student-settings.css','page-transition.css'].map(file=>fs.readFileSync(path.join(root,'css',file),'utf8')).join('\n');
 const code=fs.readFileSync(path.join(root,'js/page-transition.js'),'utf8');
 const setup="Object.defineProperty(window,'AudioContext',{value:undefined});Object.defineProperty(window,'webkitAudioContext',{value:undefined});document.body.classList.add('authenticated');";
 const html=fs.readFileSync(path.join(root,'pages/settings.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<script>'+setup+'\n'+code+'</script></body>');
 const server=http.createServer((req,res)=>{if(req.url!=='/settings.html'){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'"});res.end(html);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const profile=path.join(temp,'browser'),chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--window-size=1440,1000','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let launchError;chrome.on('error',error=>{launchError=error;});let ws,send;
 try{
  const portFile=path.join(profile,'DevToolsActivePort'),deadline=Date.now()+10000;
  while(!fs.existsSync(portFile)){if(launchError)throw launchError;if(Date.now()>deadline)throw Error('Chrome debugger did not start');await delay(50);}
  const port=fs.readFileSync(portFile,'utf8').split(/\r?\n/)[0];
  const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  const target=targets.find(row=>row.type==='page');if(!target)throw Error('Missing local Chrome page');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map(),events=new Map();
  ws.addEventListener('message',message=>{const payload=JSON.parse(message.data);if(payload.id){const request=pending.get(payload.id);if(!request)return;pending.delete(payload.id);clearTimeout(request.timer);payload.error?request.reject(Error(payload.error.message)):request.resolve(payload.result);}else if(events.has(payload.method)){events.get(payload.method)();events.delete(payload.method);}});
  send=(method,params={})=>new Promise((resolve,reject)=>{const request=++id,timer=setTimeout(()=>{pending.delete(request);reject(Error('Debugger deadline: '+method));},6000);pending.set(request,{resolve,reject,timer});ws.send(JSON.stringify({id:request,method,params}));});
  const event=name=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{events.delete(name);reject(Error('Page event deadline: '+name));},6000);events.set(name,()=>{clearTimeout(timer);resolve();});});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
  const key=async(value,code,number,text)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:value,code,windowsVirtualKeyCode:number,...(text?{text}:{} )});await send('Input.dispatchKeyEvent',{type:'keyUp',key:value,code,windowsVirtualKeyCode:number});await delay(30);};
  const focus=selector=>evaluate('document.querySelector('+JSON.stringify(selector)+').focus()');
  await send('Page.enable');let loaded=event('Page.loadEventFired');await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/settings.html'});await loaded;
  await evaluate("localStorage.setItem('fixture-unrelated','keep');sessionStorage.setItem('studentDraft:fixture','keep');");
  await focus('[data-preference-switch="sounds"]');await key(' ','Space',32,' ');
  assert(await evaluate("document.querySelector('[data-preference-switch=\"sounds\"]').getAttribute('aria-checked')==='false'"),'Space activates the focused sound switch');
  await key('Tab','Tab',9);assert(await evaluate("document.activeElement.id==='gameSoundVolume'"),'Tab reaches the sound-volume slider in DOM order');
  assert(await evaluate("document.activeElement.matches(':focus-visible')"),'Keyboard navigation exposes a visible-focus state');
  await key('ArrowRight','ArrowRight',39);assert(await evaluate("document.querySelector('#gameSoundVolume').value==='90'&&document.querySelector('#backgroundMusicVolume').value==='80'"),'Arrow key changes sound volume independently of music');
  await focus('[data-preference-switch="music"]');await key('Enter','Enter',13,'\r');
  assert(await evaluate("document.querySelector('[data-preference-switch=\"music\"]').getAttribute('aria-checked')==='false'"),'Enter activates the music switch');
  for(const name of ['motion','contrast']){await focus('[data-preference-switch="'+name+'"]');await key(' ','Space',32,' ');}
  assert(await evaluate("document.body.classList.contains('lakbay-reduce-motion')&&document.body.classList.contains('lakbay-high-contrast')"),'Space activates motion and contrast choices');
  await focus('[data-reading-size]');await key('ArrowDown','ArrowDown',40);await key('Enter','Enter',13,'\r');
  assert(await evaluate("document.documentElement.dataset.studentTextSize==='large'"),'Native select keyboard input changes reading size');
  const readState="JSON.stringify({sounds:document.querySelector('[data-preference-switch=\"sounds\"]').getAttribute('aria-checked'),music:document.querySelector('[data-preference-switch=\"music\"]').getAttribute('aria-checked'),volume:document.querySelector('#gameSoundVolume').value,reading:document.documentElement.dataset.studentTextSize,motion:document.body.classList.contains('lakbay-reduce-motion'),contrast:document.body.classList.contains('lakbay-high-contrast')})";
  const before=await evaluate(readState);loaded=event('Page.loadEventFired');await send('Page.reload',{ignoreCache:true});await loaded;
  assert(await evaluate(readState)===before,'Real page reload restores the chosen audio and display preferences');
  assert(await evaluate("localStorage.getItem('fixture-unrelated')==='keep'&&sessionStorage.getItem('studentDraft:fixture')==='keep'"),'Reload preserves unrelated local and tab data');
  await focus('[data-preferences-reset]');await key('Enter','Enter',13,'\r');
  assert(await evaluate("document.querySelector('#gameSoundVolume').value==='85'&&document.querySelector('#backgroundMusicVolume').value==='80'&&document.documentElement.dataset.studentTextSize==='standard'&&!document.body.classList.contains('lakbay-reduce-motion')&&!document.body.classList.contains('lakbay-high-contrast')"),'Keyboard Reset restores all display and volume defaults');
  assert(await evaluate("['sounds','music','focus-audio'].every(name=>document.querySelector('[data-preference-switch=\"'+name+'\"]').getAttribute('aria-checked')==='true')"),'Reset also restores sound, music and focus-audio switches');
  assert(await evaluate("localStorage.getItem('fixture-unrelated')==='keep'&&sessionStorage.getItem('studentDraft:fixture')==='keep'"),'Reset preserves unrelated local data and the draft sentinel');
  loaded=event('Page.loadEventFired');await send('Page.reload',{ignoreCache:true});await loaded;
  assert(await evaluate("document.querySelector('#gameSoundVolume').value==='85'&&document.querySelector('[data-preference-switch=\"sounds\"]').getAttribute('aria-checked')==='true'"),'Reset defaults survive another real reload');
  await evaluate('window.scrollTo(0,0)');await delay(250);
  screenshot=path.join(temp,'settings-keyboard.png');const capture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(screenshot,Buffer.from(capture.data,'base64'));
 }finally{
  if(send&&ws?.readyState===WebSocket.OPEN)await send('Browser.close').catch(()=>{});
  ws?.close();if(chrome.exitCode===null)chrome.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
}
main().then(()=>{write('pass');console.log('PASS: native keyboard switches, slider, reading select, real reload and non-destructive reset');console.log('Screenshot: '+screenshot);}).catch(error=>{write('fail',error.message);console.error('FAIL: '+error.message);process.exitCode=1;});
function write(status,error=null){const files=['pages/settings.html','js/page-transition.js','css/student.css','css/student-settings.css','css/navy-gold-theme.css'];fs.writeFileSync(path.join(root,'docs/validation/student-settings-keyboard-reload-local.json'),JSON.stringify({checkedAt:new Date().toISOString(),status,error,mode:'loopback-http-chrome-native-keyboard-real-reload',audio:'AudioContext disabled; no listening or signed-in-shell playback acceptance',checks,screenshot,sources:files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}))},null,2)+'\n');}
