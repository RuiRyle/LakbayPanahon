const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-register-'));
let html=fs.readFileSync(path.join(root,'pages/register.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const style=fs.readFileSync(path.join(root,'css/auth.css'),'utf8');
const source=fs.readFileSync(path.join(root,'js/auth-ui.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
const script=`
const auth={currentUser:null},db={},profiles=new Map();let createCalls=0,saveCalls=0;
const browserSessionPersistence={},browserLocalPersistence={},setPersistence=async()=>{};
const doc=(_,name,id)=>name+'/'+id,serverTimestamp=()=> 'server-time';
const createUserWithEmailAndPassword=async(_,email,password)=>{createCalls++;await new Promise(resolve=>setTimeout(resolve,40));auth.currentUser={uid:'new-student',email};return{user:auth.currentUser};};
const getDocFromServer=async key=>({exists:()=>profiles.has(key),data:()=>profiles.get(key)});
const setDoc=async(key,data)=>{saveCalls++;if(saveCalls===1)throw Object.assign(Error('Offline'),{code:'unavailable'});profiles.set(key,data);throw Object.assign(Error('Lost acknowledgement'),{code:'unavailable'});};
${source}
const tick=()=>new Promise(resolve=>setTimeout(resolve,90)),check=(value,message)=>{if(!value)throw Error(message);};
(async()=>{
 await tick();const form=document.getElementById('studentRegisterForm'),message=document.getElementById('studentRegisterMessage');
 check(document.getElementById('studentAccountNoticeTitle').textContent.includes('Before you create'),'Test-version account notice missing');
 check(!document.querySelector('.terms').textContent.includes('I agree to the Terms'),'Unpublished policy presented as an agreement');
 const input=(id,value)=>{document.getElementById(id).value=value;};
 check(getComputedStyle(document.getElementById('studentRegistrationContinue')).display==='none','Continue link visible before registration');
 input('firstName','  Ana  ');input('lastName',' Cruz ');input('studentEmail','student@example.com');input('studentPassword','secret123');input('studentConfirmPassword','different');document.getElementById('studentTerms').checked=true;
 form.requestSubmit();await tick();check(createCalls===0&&message.textContent.includes('do not match'),'Password mismatch created an account');
 input('studentConfirmPassword','secret123');
 form.dispatchEvent(new Event('submit',{cancelable:true}));form.dispatchEvent(new Event('submit',{cancelable:true}));await tick();
 check(createCalls===1&&saveCalls===1&&!profiles.size,'Duplicate submit or failure recovery incorrect');
 check(message.textContent.includes('Retry Create Student Account'),'Profile recovery guidance missing');
 form.requestSubmit();await tick();
 check(createCalls===1&&saveCalls===2,'Retry created another authentication account');
 const saved=profiles.get('users/new-student');check(saved.firstName==='Ana'&&saved.role==='student'&&saved.status==='active'&&!('xp'in saved),'Profile data invalid');
 check(!document.getElementById('studentRegistrationContinue').hidden,'Success lacks dashboard link');
 check(form.querySelector('[type=submit]').disabled,'Completed registration can submit again');
 check(document.documentElement.scrollWidth<=window.innerWidth+1,'Registration overflows narrow viewport');
 document.getElementById('result').textContent='PASS: password validation, duplicate prevention, profile retry, lost acknowledgement, dashboard link and narrow layout';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html=html.replace('</head>','<style>'+style+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'register.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=390,844','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=3000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
