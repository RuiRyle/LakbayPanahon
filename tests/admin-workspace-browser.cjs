const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-admin-ui-'));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const strip=name=>read(name).replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,'');
let mocks=read('tests/teacher-workspace-browser.cjs').match(/const mocks = `([\s\S]*?)`;/)[1]
    .replaceAll('teacher1','admin1').replace("{role:'teacher',status:'active',firstName:'Teacher'","{role:'admin',status:'active',firstName:'Admin'")
    .replace('cursor:value.id','cursor:typeof value===\'string\'?value:value.id');
mocks+=`\nfor(let i=0;i<26;i++)records.set('users/t'+String(i).padStart(2,'0'),{role:'teacher',status:'pending',firstName:i===0?'<img src=x>':'Teacher',lastName:'Applicant '+i,email:'teacher'+i+'@example.com'});\nrecords.set('studentProgress/student1_m1',{userId:'student1',completed:true,bestScore:80});\n`;
mocks+=`\nrecords.set('teacherApplications/t00',{userId:'t00',revision:1,status:'submitted',applicantType:'licensed_teacher',emailVerified:true,legalName:'Applicant Zero',institution:'Example School',locality:'Cebu',roleTitle:'Teacher',prcNumber:'1234567',prcExpiresAt:stamp(Date.parse('2030-01-01')),evidenceRevision:0});const deleteDoc=async ref=>records.delete(ref.name+'/'+ref.id);const reload=async()=>{},getIdToken=async()=>{},sendEmailVerification=async()=>{};\n`;
const exercise=`
const checks=[];
const waitFor=async(test,label)=>{for(let i=0;i<100;i++){if(test())return;await new Promise(r=>setTimeout(r,5));}throw Error('Timed out '+label+'; '+document.getElementById('adminStatus').textContent);};
const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
const idle=()=>waitFor(()=>!busy,'action');
const submit=id=>document.getElementById(id).dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
(async()=>{
 await waitFor(()=>document.body.classList.contains('authenticated')&&!busy&&document.querySelector('#adminAccounts button'),'initial queue');
 check(document.querySelectorAll('#adminAccounts button').length===25&&!document.getElementById('nextAccounts').disabled,'pending-teacher queue paginates at 25');
 document.getElementById('nextAccounts').click();await idle();check(document.querySelectorAll('#adminAccounts button').length===1,'next account page');
 document.getElementById('previousAccounts').click();await idle();check(document.querySelectorAll('#adminAccounts button').length===25,'previous account page');
 document.getElementById('reviewSubmittedApplications').click();await idle();check(document.querySelectorAll('#adminAccounts button').length===1,'submitted-application queue excludes incomplete accounts');
 document.querySelector('#adminAccounts button').click();await idle();
 check(selected.id==='t00'&&!document.querySelector('#adminAccounts img')&&!document.querySelector('#accountName img'),'profile names use safe text');
 document.getElementById('moderationReason').value='Identity checked with the applicant.';submit('moderationForm');await idle();
 check(document.getElementById('adminStatus').dataset.error==='true'&&records.get('users/t00').status==='pending','teacher approval requires verification');
 const reviewForm=document.querySelector('.qualification-review-form');reviewForm.elements.decision.value='approved';for(const key of ['identity','affiliation','prc'])reviewForm.elements[key].checked=true;reviewForm.elements.affiliationReference.value='Official school contact checked.';reviewForm.elements.credentialReference.value='PRC record checked.';reviewForm.elements.reason.value='Identity checked with the applicant.';reviewForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await waitFor(()=>records.get('users/t00').status==='active'&&selected?.status==='active'&&document.getElementById('accountHistory').textContent.includes('Identity checked'),'qualification approval');
 check(records.get('users/t00').status==='active'&&selected.status==='active','verified approval updates account');
 check(document.getElementById('accountHistory').textContent.includes('Identity checked with the applicant.'),'reason appears in audit history');
 document.getElementById('moderationReason').value='Classroom access is no longer needed.';submit('moderationForm');await idle();
 check(records.get('users/t00').status==='inactive'&&document.getElementById('accountHistory').querySelectorAll('article').length===2,'deactivation appends audit record');
 document.getElementById('moderationReason').value='Identity verified for returning teacher.';document.getElementById('teacherIdentityVerified').checked=true;submit('moderationForm');await idle();
 check(records.get('users/t00').status==='active','teacher reactivation works after verification');
 document.getElementById('accountRole').value='student';document.getElementById('accountRole').dispatchEvent(new Event('change'));submit('accountFilters');await idle();
 document.querySelector('#adminAccounts button').click();await idle();check(document.getElementById('identityCheck').hidden,'student management does not show teacher verification');
 document.getElementById('moderationReason').value='Temporary account restriction requested.';submit('moderationForm');await idle();
 check(records.get('users/student1').status==='inactive'&&records.get('studentProgress/student1_m1').bestScore===80,'student deactivation preserves learning progress');
 document.getElementById('accountRole').value='teacher';document.getElementById('accountStatusFilter').value='pending';submit('accountFilters');await idle();
 document.querySelector('#adminAccounts button').click();await idle();const target=selected.id,eventsBefore=[...records.keys()].filter(k=>k.startsWith('accountModeration/')).length;
 records.set('users/'+target,{...records.get('users/'+target),status:'inactive'});document.getElementById('teacherIdentityVerified').checked=true;document.getElementById('moderationReason').value='Identity checked for access.';submit('moderationForm');await idle();
 check(document.getElementById('adminStatus').textContent.includes('changed while')&&[...records.keys()].filter(k=>k.startsWith('accountModeration/')).length===eventsBefore,'stale account decision rejected without audit write');
 submit('accountFilters');await idle();document.querySelector('#adminAccounts button').click();await idle();
 records.set('users/'+selected.id,{...records.get('users/'+selected.id),updatedAt:serverTimestamp()});document.getElementById('teacherIdentityVerified').checked=true;document.getElementById('moderationReason').value='Identity checked for access.';submit('moderationForm');await idle();
 check(document.getElementById('adminStatus').textContent.includes('changed while'),'same-status profile change invalidates an old review');
 for(let i=0;i<26;i++)records.set('accountModeration/extra'+String(i).padStart(2,'0'),{userId:'t00',actorId:'admin1',previousStatus:'pending',status:'active',reason:'Historical sample decision '+i,createdAt:serverTimestamp()});
 document.getElementById('accountStatusFilter').value='active';submit('accountFilters');await idle();document.querySelector('#adminAccounts button').click();await idle();
 check(document.getElementById('accountHistory').querySelectorAll('article').length===25&&!document.getElementById('moreAccountHistory').hidden,'audit history is paginated');
 document.getElementById('moreAccountHistory').click();await idle();check(document.getElementById('accountHistory').querySelectorAll('article').length===29,'load more audit decisions without duplicates');
 readFailure=true;submit('accountFilters');await idle();check(document.getElementById('adminStatus').dataset.error==='true'&&document.getElementById('adminAccountDetail').hidden,'read error hides stale account details');
 readFailure=false;submit('accountFilters');await idle();check(document.querySelector('#adminAccounts button'),'refresh recovers after read failure');
 readFailure=true;await checkPageAccess(auth.currentUser);check(recoveryDialog.open&&getComputedStyle(recoveryDialog).visibility==='visible'&&document.querySelector('.teacher-shell').inert,'offline admin guard stays locked with visible retry');
 readFailure=false;recoveryDialog.querySelector('button').click();await waitFor(()=>document.body.classList.contains('authenticated'),'guard retry');
 check(document.documentElement.scrollWidth<=innerWidth+1,'no page overflow at '+innerWidth+'px');
 if(!location.search.includes('preview')){await signOut();check(document.getElementById('adminAccounts').childElementCount===0&&document.getElementById('accountHistory').childElementCount===0,'sign out clears profiles and reasons');}
 else{records.set('users/t00',{...records.get('users/t00'),firstName:'Maria',lastName:'Reyes'});submit('accountFilters');await idle();document.querySelector('#adminAccounts button').click();await idle();}
 parent.postMessage({state:'PASS',width:innerWidth,checks},'*');
})().catch(error=>parent.postMessage({state:'FAIL',width:innerWidth,error:error.stack},'*'));
`;
let html=read('pages/admin-dashboard.html').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]+>/g,'');
html=html.replace('../assets/brand/lakbay-sun.svg','data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets/brand/lakbay-sun.svg')).toString('base64'));
const css=['css/navy-gold-theme.css','css/expedition.css','css/teacher-workspace.css','css/admin-workspace.css','css/teacher-application.css'].map(read).join('\n');
const guard=strip('js/auth-guard.js').replace(/window\.location\.replace\(destination\);/g,'void destination;');
html=html.replace('</head>',`<style>${css}</style></head>`).replace('</body>',`<script type="module">${mocks}\n${strip('js/teacher-application-policy.js')}\n${strip('js/teacher-application-client.js')}\n${strip('js/teacher-application-review.js')}\n${strip('js/teacher-evidence-viewer.js')}\n${strip('js/teacher-review-panel.js')}\n${strip('js/admin-accounts.js')}\n${guard}\n${strip('js/admin-workspace.js')}\n${exercise}</script></body>`);
fs.writeFileSync(path.join(temp,'frame.html'),html);
fs.writeFileSync(path.join(temp,'index.html'),`<!doctype html><html><body><output id="result">RUNNING</output><iframe style="width:390px;height:850px" src="frame.html"></iframe><iframe style="width:1280px;height:850px" src="frame.html"></iframe><script>const results=[];addEventListener('message',e=>{if(typeof e.data==='object'&&['PASS','FAIL'].includes(e.data.state)){results.push(e.data);if(results.length===2)document.getElementById('result').textContent=JSON.stringify(results);}});</script></body></html>`);
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const result=spawnSync(chrome,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=10000','file:///'+path.join(temp,'index.html').replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:6*1024*1024,windowsHide:true});
if(result.error)throw result.error;
const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);let results;
try{results=JSON.parse(match?.[1].replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<'));}catch{}
const pass=results?.length===2&&results.every(r=>r.state==='PASS');
const sources=['js/admin-accounts.js','js/admin-workspace.js','js/auth-guard.js','pages/admin-dashboard.html','css/admin-workspace.css'].map(file=>({file,sha256:createHash('sha256').update(read(file)).digest('hex')}));
fs.writeFileSync(path.join(root,'docs/validation/admin-workspace-browser-2026-10-31.json'),JSON.stringify({mode:'local-browser-real-modules-mocked-firestore',verifiedAt:new Date().toISOString(),pass,sources,results:results||match?.[1]||'No result'},null,2));
console.log(JSON.stringify({pass,results},null,2));if(!pass){console.error(result.stderr.slice(-1000));process.exitCode=1;}
if(pass&&process.argv.includes('--preview')){
 fs.writeFileSync(path.join(temp,'preview.html'),'<!doctype html><html><body style="margin:0"><iframe style="border:0;width:100vw;height:100vh" src="frame.html?preview"></iframe></body></html>');
 const preview=spawnSync(chrome,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+path.join(temp,'preview-browser'),'--window-size=1440,1100','--screenshot='+path.join(root,'docs/validation/admin-workspace-local.png'),'--virtual-time-budget=10000','file:///'+path.join(temp,'preview.html').replaceAll('\\','/')],{encoding:'utf8',timeout:30000,windowsHide:true});if(preview.error)throw preview.error;if(preview.status!==0)throw Error('Preview failed');
}
