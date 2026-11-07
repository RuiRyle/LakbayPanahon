// Actual local dashboard/browser check. Disposable fixtures, no production access.
const fs=require('fs'),path=require('path'),os=require('os'),{spawn}=require('child_process'),assert=require('assert/strict');
const base='http://127.0.0.1:4173',rest='http://127.0.0.1:8180/v1/projects/demo-lakbay-local/databases/(default)/documents',fixture='overview-browser-'+Date.now(),records=[],checks=[];
let browser,socket,seq=0,reportLink,previousLink;const pending=new Map(),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function admin(relative,method='GET',body){const r=await fetch(rest+'/'+relative,{method,headers:{Authorization:'Bearer owner','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Local fixture request failed '+r.status);return r.json().catch(()=>({}));}
const fields=object=>Object.fromEntries(Object.entries(object).map(([k,v])=>[k,v instanceof Date?{timestampValue:v.toISOString()}:{stringValue:v}]));
async function seed(relative,data){await admin(relative,'PATCH',{fields:fields(data)});records.push(relative);}
async function uid(email){const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-emulator-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'LakbayLocal123!',returnSecureToken:true})});assert.equal(r.status,200);return (await r.json()).localId;}
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser timeout'));},30000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function wait(expression){for(let i=0;i<160;i++){if(await evaluate(expression).catch(()=>false))return;await delay(250);}throw Error('Browser state failed: '+expression+'; '+await evaluate('document.body.innerText.slice(-1800)'));}
async function clickClassCard(id){
 await evaluate("document.querySelector('.teacher-class-card[data-class-id=\""+id+"\"]').scrollIntoView({block:'center',behavior:'instant'})");await delay(200);
 const point=await evaluate("(()=>{const r=document.querySelector('.teacher-class-card[data-class-id=\""+id+"\"]').getBoundingClientRect();return{x:r.left+24,y:r.top+24};})()");
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
}
function check(value,label){assert.ok(value,label);checks.push(label);}
(async()=>{
 const teacher=await uid('teacher@lakbay.local'),student=await uid('student@lakbay.local');
 reportLink='teacherStudentLinks/'+teacher+'_'+student;previousLink=await admin(reportLink).catch(()=>null);
 await seed('classes/'+fixture,{name:'Overview validation class',teacherId:teacher,teacherName:'Local facilitator',status:'active',currentJoinCode:''});
 await seed('classMembers/'+student+'_'+fixture,{userId:student,classId:fixture,status:'active'});
 await seed('classes/'+fixture+'/classmates/'+student,{displayName:'Explorer Example'});
 await seed('classAssignments/'+fixture,{classId:fixture,title:'Discuss evidence together',missionId:'fixture',status:'published',updatedAt:new Date()});
 await seed('classHelpRequests/'+fixture,{classId:fixture,userId:student,status:'open',message:'Please explain the map clue.',updatedAt:new Date()});
 await seed('classReviewReflections/'+fixture,{classId:fixture,userId:student,reviewId:fixture,body:'My explanation',response:'',submittedAt:new Date()});
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-overview-'));browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9339','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
 let target;for(let i=0;i<60;i++){try{target=(await fetch('http://127.0.0.1:9339/json').then(r=>r.json())).find(t=>t.type==='page');if(target)break;}catch{}await delay(200);}if(!target)throw Error('Chrome failed to start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));socket.addEventListener('message',event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await send('Page.enable');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__teacherMotionStarts=[];const originalAnimate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.dataset?.teacherMotion==='ready')window.__teacherMotionStarts.push({duration:options?.duration,delay:options?.delay});return originalAnimate.call(this,frames,options);};"});
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1200,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/pages/login.html'});await wait("document.readyState==='complete'&&document.getElementById('loginEmail')");
 await evaluate("(()=>{document.getElementById('loginEmail').value='teacher@lakbay.local';document.getElementById('loginPassword').value='LakbayLocal123!';document.getElementById('loginForm').requestSubmit();})()");
 await wait("location.pathname.endsWith('teacher-dashboard.html')&&document.querySelector('.overview-scope')?.textContent.includes('Snapshot:')");
 check(await evaluate("document.querySelectorAll('.overview-metric').length===4"),'overview presents four teaching summary cards without selecting a class');
 await wait("window.__teacherMotionStarts.length>0");
 check(await evaluate("window.__teacherMotionStarts.some(item=>item.duration===480)&&window.__teacherMotionStarts.every(item=>item.delay<=260)"),'dashboard entrances run with bounded stagger and short durations');
 check(await evaluate("document.querySelector('.overview-attention').textContent.includes('Explorer Example')&&document.querySelector('.overview-attention').textContent.includes('Question waiting')"),'real pending student request and chosen display name appear in follow-ups');
 check(await evaluate("document.querySelector('.overview-attention').textContent.includes('Understanding check to review')"),'unanswered student explanation appears in response priorities');
 await evaluate("[...document.querySelectorAll('.attention-filters button')].find(b=>b.textContent==='Questions').click()");
 check(await evaluate("document.querySelectorAll('.attention-card').length>0&&[...document.querySelectorAll('.attention-card')].every(e=>e.dataset.followupType==='question')"),'Make a Difference separates private questions from explanations');
 const followupURL=await evaluate("document.querySelector('.attention-action').href");
 check(new URL(followupURL).searchParams.get('request')===fixture&&new URL(followupURL).searchParams.get('followup')==='help','question action retains the exact private request context');
 await evaluate("[...document.querySelectorAll('.attention-filters button')].find(b=>b.textContent==='Explanations').click()");
 check(await evaluate("document.querySelectorAll('.attention-card').length>0&&[...document.querySelectorAll('.attention-card')].every(e=>e.dataset.followupType==='explanation')"),'Make a Difference filters student explanations');
 await evaluate("[...document.querySelectorAll('.attention-filters button')].find(b=>b.textContent==='All follow-ups').click()");
 check(await evaluate("document.querySelector('.overview-event-list').textContent.includes('Discuss evidence together')"),'saved teaching activity appears automatically');
 await evaluate("[...document.querySelectorAll('.pulse-filters button')].find(b=>b.textContent==='Student check-ins').click()");
 check(await evaluate("document.querySelectorAll('.pulse-event').length>0&&[...document.querySelectorAll('.pulse-event .overview-row-context')].every(e=>e.textContent.startsWith('Student '))"),'Classroom Pulse isolates student check-ins');
 await evaluate("[...document.querySelectorAll('.pulse-filters button')].find(b=>b.textContent==='Teaching updates').click()");
 check(await evaluate("document.querySelectorAll('.pulse-event').length>0&&[...document.querySelectorAll('.pulse-event .overview-row-context')].every(e=>!e.textContent.startsWith('Student '))"),'Classroom Pulse isolates teaching updates');
 check(await evaluate("[...document.querySelectorAll('.pulse-event-link')].every(link=>new URL(link.href).searchParams.has('class'))&&[...document.querySelectorAll('.pulse-event-link')].some(link=>new URL(link.href).searchParams.get('assignment')==="+JSON.stringify(fixture)+")"),'Pulse links retain class and learning-activity context');
 await evaluate("[...document.querySelectorAll('.pulse-filters button')].find(b=>b.textContent==='All activity').click()");
 check(await evaluate("[...document.querySelectorAll('.overview-class-card')].some(e=>e.textContent.includes('Overview validation class')&&e.querySelector('[data-room-stat=students] strong')?.textContent==='1')"),'class cards show saved membership and activity summaries');
 check(await evaluate("(()=>{const card=[...document.querySelectorAll('.overview-class-card')].find(e=>e.textContent.includes('Overview validation class'));return card.querySelector('[data-room-stat=goals] strong').textContent==='1'&&card.querySelector('[data-room-stat=reviews] strong').textContent==='0'&&card.querySelector('.overview-class-summary').textContent.includes('2 follow-ups');})()"),'classroom cards separate verified counts and pending guidance status');
 check(await evaluate("[...document.querySelectorAll('.overview-class-card a')].every(a=>new URL(a.href).searchParams.has('class'))"),'class shortcuts retain their class context');
 check(await evaluate("!document.querySelector('.teacher-overview-home').textContent.includes('Load Class Summary')"),'dashboard no longer requires loading individual summary cards');
 await delay(900);await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-overview-desktop.png',Buffer.from(r.data,'base64')));
 await evaluate("document.querySelector('.overview-classrooms').scrollIntoView({block:'center'})");await delay(800);
 await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-your-classrooms-desktop.png',Buffer.from(r.data,'base64')));
 await evaluate('window.scrollTo(0,0)');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(400);
 check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'teacher overview fits a 390px mobile viewport');
 await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-overview-mobile.png',Buffer.from(r.data,'base64')));
 await evaluate("document.querySelector('.overview-classrooms').scrollIntoView({block:'start'})");await delay(700);
 await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-your-classrooms-mobile.png',Buffer.from(r.data,'base64')));
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1200,deviceScaleFactor:1,mobile:false});

 for(let i=0;i<12;i++)await seed('classes/'+fixture+'-directory-'+i,{name:'Directory classroom '+String(i).padStart(2,'0'),teacherId:teacher,teacherName:'Local facilitator',status:i===11?'archived':'active',currentJoinCode:''});
 await send('Page.navigate',{url:base+'/pages/teacher-classes.html'});
 await wait("document.getElementById('classroomDirectoryFilters')&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("document.querySelector('.classroom-workspace').hidden&&!document.querySelector('.classroom-expanded-content')"),'My Classes is a directory without embedded classroom details');
 check(await evaluate("document.querySelectorAll('#teacherClasses .teacher-class-card:not([hidden])').length===12&&document.getElementById('classroomDirectoryPagination').textContent.includes('Next')"),'many classrooms are limited to twelve cards per directory page');
 await evaluate("[...document.querySelectorAll('#classroomDirectoryPagination button')].find(b=>b.textContent==='Next').click()");
 check(await evaluate("document.querySelectorAll('#teacherClasses .teacher-class-card:not([hidden])').length===1"),'directory next page shows remaining active classrooms');
 await evaluate("(()=>{const q=document.getElementById('classroomDirectorySearch');q.value='Overview validation';q.dispatchEvent(new Event('input',{bubbles:true}));})()");
 check(await evaluate("document.querySelectorAll('#teacherClasses .teacher-class-card:not([hidden])').length===1&&document.querySelector('.teacher-class-card:not([hidden]) a').href.includes('teacher-classroom.html?class=')"),'class search narrows the list and cards link to dedicated classroom pages');
 await clickClassCard(fixture);
 await wait("location.pathname.endsWith('teacher-classroom.html')&&document.querySelector('.teacher-class-overview h2')?.textContent==='Overview validation class'&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("document.getElementById('teacherClassPicker').hidden&&document.getElementById('teacherClassroomBack').href.endsWith('teacher-classes.html')"),'classroom page hides the directory and provides Back to My Classes');
 check(await evaluate("document.querySelectorAll('.active-room-actions>button').length===3&&document.querySelectorAll('.teacher-class-stats>div').length===3"),'classroom page contains teaching shortcuts and verified class summaries');
 check(await evaluate("document.querySelector('.invite-title-copy>strong').textContent==='Invite students to Overview validation class'&&document.getElementById('copyTeacherCode').disabled"),'invitation clearly names its classroom with no inactive code sharing');
 await evaluate("document.getElementById('rotateTeacherCode').click()");
 await wait("/^[A-Z0-9]{12}$/.test(document.getElementById('teacherJoinCode').textContent)&&!document.getElementById('refreshTeacher').disabled");
 records.push('classJoinCodes/'+await evaluate("document.getElementById('teacherJoinCode').textContent"));
 check(await evaluate("!document.getElementById('copyTeacherCode').disabled&&!document.getElementById('revokeTeacherCode').disabled"),'dedicated classroom invitation generates a valid shareable code');
 await evaluate("(()=>{document.querySelector('.teacher-settings').open=true;document.getElementById('editClassName').value='Unsaved edit';document.querySelector('.class-edit-actions button+button').click();})()");
 check(await evaluate("document.getElementById('editClassName').value==='Overview validation class'&&!document.querySelector('.teacher-settings').open"),'classroom edit cancellation restores saved details');
 check(await evaluate("document.querySelectorAll('.class-archive-effects li').length===4&&!!document.querySelector('.teacher-class-safety #archiveClass')"),'classroom archive controls explain their effects');
 await evaluate("(()=>{document.querySelector('.teacher-settings').open=true;document.getElementById('editClassDescription').value='A focused history classroom.';document.getElementById('editClassForm').requestSubmit();})()");
 await wait("!document.getElementById('refreshTeacher').disabled&&document.querySelector('.teacher-class-overview').textContent.includes('A focused history classroom.')");
 check(await evaluate("location.pathname.endsWith('teacher-classroom.html')&&document.getElementById('teacherClassPicker').hidden"),'saving classroom details stays on its dedicated page');
 await evaluate("(()=>{document.querySelector('.teacher-class-safety').open=true;document.getElementById('archiveClass').click();})()");
 await wait("document.getElementById('archiveClass').textContent==='Restore Class'&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("document.getElementById('activeClassTools').hidden"),'archiving disables classroom invitations on the classroom page');
 await evaluate("document.getElementById('archiveClass').click()");
 await wait("document.getElementById('archiveClass').textContent==='Archive Class'&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("!document.getElementById('activeClassTools').hidden&&document.getElementById('copyTeacherCode').disabled"),'restoring returns the classroom without reactivating its old invitation');
 await evaluate("document.getElementById('activeClassTools').scrollIntoView({block:'start',behavior:'instant'})");await delay(200);
 await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-classroom-page-desktop.png',Buffer.from(r.data,'base64')));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
 check(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'classroom detail page fits a 390px viewport');
 await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-classroom-page-mobile.png',Buffer.from(r.data,'base64')));
 await evaluate("document.getElementById('teacherClassroomBack').click()");
 await wait("location.pathname.endsWith('teacher-classes.html')&&document.getElementById('classroomDirectoryFilters')&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('.classroom-workspace').hidden"),'returning to the directory is clean and fits mobile');
 await evaluate("(()=>{const q=document.getElementById('classroomDirectoryState');q.value='archived';q.dispatchEvent(new Event('input',{bubbles:true}));})()");
 check(await evaluate("document.querySelectorAll('#teacherClasses .teacher-class-card:not([hidden])').length===1&&document.querySelector('#teacherClasses .teacher-class-card:not([hidden])').dataset.archived==='true'"),'archived classroom filter is independent of the active list');
 await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync('docs/validation/teacher-classroom-directory-mobile.png',Buffer.from(r.data,'base64')));
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1200,deviceScaleFactor:1,mobile:false});
 await evaluate("(()=>{document.querySelector('.teacher-class-creation').open=true;document.getElementById('newClassName').value='New classroom interface check';document.getElementById('createClassForm').requestSubmit();})()");
 await wait("location.pathname.endsWith('teacher-classroom.html')&&document.querySelector('.active-room-identity h2')?.textContent==='New classroom interface check'&&!document.getElementById('refreshTeacher').disabled");
 records.push('classes/'+await evaluate("new URL(location.href).searchParams.get('class')"));
 check(await evaluate("document.getElementById('teacherClassPicker').hidden"),'creating a classroom opens its dedicated page');
 await send('Page.reload',{ignoreCache:true});
 await wait("document.querySelector('.active-room-identity h2')?.textContent==='New classroom interface check'&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("location.pathname.endsWith('teacher-classroom.html')&&!!document.getElementById('teacherClassroomBack')"),'dedicated classroom URL survives reload');
 await send('Page.navigate',{url:base+'/pages/teacher-classroom.html?class=missing-classroom'});
 await wait("document.getElementById('teacherClassroomBack')&&!document.getElementById('refreshTeacher').disabled");
 check(await evaluate("document.querySelector('.classroom-workspace').hidden&&document.getElementById('teacherClassroomBack').href.endsWith('teacher-classes.html')"),'missing classroom URL offers a safe route back without another class details');
 await send('Page.navigate',{url:followupURL});
 await wait("document.querySelector('.teacher-followup-target')?.dataset.followupId==="+JSON.stringify(fixture));
 check(await evaluate("document.querySelector('.teacher-followup-target').closest('details').open"),'dashboard student follow-up route continues to work');
 console.log(JSON.stringify({pass:true,mode:'local-browser-sdk; disposable classroom fixtures',checks},null,2));
})().catch(error=>{console.error(error.stack);process.exitCode=1;}).finally(async()=>{socket?.close();browser?.kill();for(const relative of records.reverse())await admin(relative,'DELETE').catch(()=>{});if(reportLink){const current=await admin(reportLink).catch(()=>null);if(current?.fields?.classId?.stringValue===fixture){if(previousLink?.fields)await admin(reportLink,'PATCH',{fields:previousLink.fields});else await admin(reportLink,'DELETE');}}});
