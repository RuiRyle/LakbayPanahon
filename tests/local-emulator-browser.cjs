// Requires the dedicated local launcher. Real browser/SDK, loopback demo data only.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const delay=ms=>new Promise(r=>setTimeout(r,ms)),base='http://127.0.0.1:4173';
let browser,socket,sequence=0;const pending=new Map(),checks=[];
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout'));},25000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function wait(expression){for(let i=0;i<120;i++){try{if(await evaluate(expression))return;}catch{}await delay(200);}throw Error('Browser state did not become ready: '+expression+'; '+await evaluate('location.href+" "+document.body.innerText.slice(-1800)'));}
function check(value,label){if(!value)throw Error(label);checks.push(label);}
async function login(email){
 await send('Page.navigate',{url:base+'/pages/login.html'});await wait("document.readyState==='complete'&&document.getElementById('loginEmail')&&!document.querySelector('#loginForm [type=submit]').disabled");
 await evaluate(`(()=>{document.getElementById('loginEmail').value=${JSON.stringify(email)};document.getElementById('loginPassword').value='LakbayLocal123!';document.getElementById('loginForm').requestSubmit();})()`);
}
(async()=>{
 const environment=await fetch(base+'/js/firebase-environment.js').then(r=>r.text());check(environment.includes('demo-lakbay-local'),'dedicated server opts into the demo emulator project');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-emulator-browser-'));
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9337','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<60;i++){try{target=(await fetch('http://127.0.0.1:9337/json').then(r=>r.json())).find(t=>t.type==='page');if(target)break;}catch{}await delay(200);}if(!target)throw Error('Chrome did not start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const request=pending.get(message.id);if(request){pending.delete(message.id);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}});
 await send('Page.enable');await login('teacher@lakbay.local');
 await wait("location.pathname.endsWith('teacher-dashboard.html')&&document.body.classList.contains('authenticated')&&document.getElementById('refreshTeacher')&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("document.body.innerText.includes('LOCAL EMULATOR')"),'approved local teacher signs in through the actual page and sees emulator banner');
 check(await evaluate("(async()=>{const {app,auth}=await import('/js/firebase-config.js');return app.options.projectId==='demo-lakbay-local'&&auth.currentUser.emailVerified;})()"),'browser SDK uses demo project and local verified teacher');
 const classId=await evaluate("(async()=>{const c=await import('/js/teacher-class-client.js');const id=await c.createTeacherClass('Local emulator acceptance','Synthetic local records only');await c.rotateTeacherCode(id);return id;})()");
 const code=await evaluate(`(async()=>{const c=await import('/js/teacher-class-client.js');return(await c.loadTeacherClass(${JSON.stringify(classId)})).classroom.currentJoinCode;})()`);
 check(/^[A-Z0-9]{12}$/.test(code),'actual SDK generates an invitation code using local rules');
 await evaluate("(async()=>{const {auth}=await import('/js/firebase-config.js');const {signOut}=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');await signOut(auth);})()").catch(()=>{});
 await login('student@lakbay.local');await wait("location.pathname.includes('student-')");
 await send('Page.navigate',{url:base+'/pages/login.html'});await wait("document.getElementById('loginEmail')");
 // Public login page keeps the same local Auth session while allowing SDK acceptance calls.
 await wait("(async()=>{const {auth}=await import('/js/firebase-config.js');return auth.currentUser?.email==='student@lakbay.local';})()");
 const joined=await evaluate(`(async()=>{const {joinStudentClass}=await import('/js/student-class-client.js');return await joinStudentClass(${JSON.stringify(code)});})()`);
 check(joined.classId===classId,'actual local student joins the teacher class without online Firebase');
 const denied=await evaluate("(async()=>{const {db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');try{await f.getDocsFromServer(f.collection(db,'teacherSupportNotes'));return false;}catch(e){return e.code==='permission-denied';}})()");
 check(denied,'local student cannot read private teacher follow-ups');
 const report={mode:'real-browser-sdk-local-demo-emulators-only',verifiedAt:new Date().toISOString(),pass:true,checks};fs.writeFileSync(path.join(__dirname,'../docs/validation/local-emulator-browser-2026-11-05.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(()=>{socket?.close();browser?.kill();});
