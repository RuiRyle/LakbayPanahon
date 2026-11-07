const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-teacher-register-'));
let html=fs.readFileSync(path.join(root,'pages/teacher-register.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const source=fs.readFileSync(path.join(root,'js/auth-ui.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
const css=['auth.css','navy-gold-theme.css','expedition.css'].map(name=>fs.readFileSync(path.join(root,'css',name),'utf8')).join('\n');
const script=`
const auth={currentUser:null},db={},profiles=new Map();let createCalls=0,saveCalls=0;
const browserSessionPersistence={},browserLocalPersistence={},setPersistence=async()=>{};
const doc=(_,name,id)=>name+'/'+id,serverTimestamp=()=> 'server-time';
const createUserWithEmailAndPassword=async(_,email)=>{createCalls++;await new Promise(resolve=>setTimeout(resolve,30));auth.currentUser={uid:'new-teacher',email};return{user:auth.currentUser};};
const getDocFromServer=async key=>({exists:()=>profiles.has(key),data:()=>profiles.get(key)});
const setDoc=async(key,data)=>{saveCalls++;if(saveCalls===1)throw Object.assign(Error('Offline'),{code:'unavailable'});profiles.set(key,data);throw Object.assign(Error('Lost acknowledgement'),{code:'unavailable'});};
${source}
const tick=()=>new Promise(resolve=>setTimeout(resolve,90)),checks=[];
const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
(async()=>{
 await tick();const form=document.getElementById('teacherRegisterForm'),message=document.getElementById('teacherRegisterMessage');
 const input=(id,value)=>document.getElementById(id).value=value;
 check(getComputedStyle(document.getElementById('teacherRegistrationContinue')).display==='none','sign-in action hidden before profile confirmation');
 check(!document.querySelector('.terms').textContent.includes('I agree to the Terms'),'notice does not assert agreement to unpublished policies');
 input('teacherFirstName',' Ana ');input('teacherLastName',' Cruz ');input('teacherEmail','teacher@example.com');input('teacherPassword','secret123');input('teacherConfirmPassword','different');document.getElementById('teacherTerms').checked=true;
 form.requestSubmit();await tick();check(createCalls===0&&message.textContent.includes('do not match'),'password mismatch creates no identity');
 input('teacherConfirmPassword','secret123');form.dispatchEvent(new Event('submit',{cancelable:true}));form.dispatchEvent(new Event('submit',{cancelable:true}));await tick();
 check(createCalls===1&&saveCalls===1&&!profiles.size,'duplicate submit blocked while profile save fails');
 check(message.textContent.includes('Retry Register as Teacher'),'retry guidance preserves recoverable signup');
 check(document.getElementById('teacherPassword').disabled&&document.getElementById('teacherConfirmPassword').disabled,'retry keeps original sign-in password');
 input('teacherEmail','changed@example.com');form.requestSubmit();await tick();check(createCalls===1&&saveCalls===1&&message.textContent.includes('before changing the email'),'partial signup cannot silently change its identity');
 input('teacherEmail','teacher@example.com');form.requestSubmit();await tick();
 check(createCalls===1&&saveCalls===2,'profile retry reuses the original Auth identity');
 const saved=profiles.get('users/new-teacher');check(saved.firstName==='Ana'&&saved.role==='teacher'&&saved.status==='pending'&&!('xp'in saved),'new teacher profile remains pending and has no rewards');
 check(!document.getElementById('teacherRegistrationContinue').hidden&&document.getElementById('teacherRegistrationContinue').getAttribute('href')==='teacher-application.html','confirmed signup offers the qualification portal');
 check(form.querySelector('[type=submit]').disabled&&message.textContent.includes('qualifications for review'),'success preserves qualification review and blocks resubmission');
 check(document.documentElement.scrollWidth<=innerWidth+1,'no horizontal overflow at '+innerWidth+'px');
 parent.postMessage({state:'PASS',width:innerWidth,checks},'*');
})().catch(error=>parent.postMessage({state:'FAIL',width:innerWidth,error:error.message},'*'));
`;
html=html.replace('</head>',`<style>${css}</style></head>`).replace('</body>',`<script type="module">${script}</script></body>`);
fs.writeFileSync(path.join(temp,'frame.html'),html);
fs.writeFileSync(path.join(temp,'index.html'),'<!doctype html><html><body><output id="result">RUNNING</output><iframe style="width:390px;height:850px" src="frame.html"></iframe><iframe style="width:1280px;height:850px" src="frame.html"></iframe><script>const results=[];addEventListener("message",e=>{if(typeof e.data==="object"&&["PASS","FAIL"].includes(e.data.state)){results.push(e.data);if(results.length===2)document.getElementById("result").textContent=JSON.stringify(results);}});</script></body></html>');
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=4000','file:///'+path.join(temp,'index.html').replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:6*1024*1024,windowsHide:true});
if(result.error)throw result.error;
const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);let results;try{results=JSON.parse(match?.[1].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'));}catch{}
const pass=results?.length===2&&results.every(r=>r.state==='PASS');
const sources=['js/auth-ui.js','pages/teacher-register.html'].map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
fs.writeFileSync(path.join(root,'docs/validation/teacher-registration-browser-2026-10-31.json'),JSON.stringify({mode:'local-browser-real-form-mocked-firebase',verifiedAt:new Date().toISOString(),pass,sources,results:results||match?.[1]||'No result'},null,2));
console.log(JSON.stringify({pass,results},null,2));if(!pass){console.error(result.stderr.slice(-1000));process.exitCode=1;}
