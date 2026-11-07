// Bounded real-SDK check against the configured project. Creates only temporary
// identities/classes, seeds labelled synthetic learning records for those users,
// then removes them. Does not claim those seeded scores were earned in gameplay.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process'),{randomUUID,randomBytes,createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-teacher-live-'));
const api=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const report={mode:'real-sdk-isolated-accounts-local-pages-live-firestore',startedAt:new Date().toISOString(),steps:[],cleanup:'not-needed',limitations:['Learning completion/attempt fixtures are synthetic, not earned quiz results.','Local pages with live Firebase; not hosted website acceptance.','No real teacher or learner account is used.']};
const identities=[],known=new Set(),pending=new Map();
const frameContexts=new Map();
const auditActors=new Set();
let reportFile='teacher-workflow-live-2026-10-31.json',sourceFiles=['js/teacher-class-client.js','js/teacher-workspace.js','js/my-class.js','firestore.rules'];
let stagedPackage=null;
let hostedBase=null;
let server,chrome,ws,base,adminToken,classId,sequence=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function pass(name,details={}){report.steps.push({name,status:'pass',...details});console.log('PASS: '+name);}
function recovery(){fs.writeFileSync(path.join(dir,'recovery.json'),JSON.stringify({project,uids:identities.map(i=>i.uid),classId,known:[...known]},null,2),{mode:0o600});}
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timed out: '+method));},30000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});}
async function raw(expression,contextId){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,...(contextId?{contextId}:{})});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function evaluate(expression){
    if(!await raw("!!document.getElementById('studentRouteFrame')"))return raw(expression);
    const tree=await send('Page.getFrameTree');
    const target=tree.frameTree.childFrames?.find(item=>item.frame.url.startsWith(base+'/pages/'));
    if(!target)throw Error('Student frame is not ready.');
    const contextId=frameContexts.get(target.frame.id);if(!contextId)throw Error('Student frame execution context is not ready.');
    return raw(expression,contextId);
}
async function wait(expression,label){for(let i=0;i<100;i++){try{if(await evaluate(expression))return;}catch{}await pause(200);}throw Error('Timed out: '+label+(report.suppressPageText?'':'; '+await evaluate('document.body.innerText.slice(-1000)')));}
async function go(route){await send('Page.navigate',{url:base+'/pages/'+route});await pause(300);await wait('document.readyState==="complete"','page load');}
async function click(selector){await wait(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});return el&&!el.disabled&&el.getClientRects().length;})()`,'visible '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
async function idle(){await wait(`!document.getElementById('teacherStatus').textContent.includes('Working...')&&!document.getElementById('refreshTeacher').disabled`,'teacher action');const error=await evaluate(`document.getElementById('teacherStatus').dataset.error==='true'?document.getElementById('teacherStatus').textContent:''`);if(error)throw Error(error);}
const sdk=`const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');`;
async function query(name,field,value){return evaluate(`(async()=>{${sdk}return(await f.getDocsFromServer(f.query(f.collection(db,${JSON.stringify(name)}),f.where(${JSON.stringify(field)},'==',${JSON.stringify(value)})))).docs.map(d=>({id:d.id,...d.data()}));})()`);}
async function denied(expression,label){const error=await evaluate(`(async()=>{try{await (${expression});return null;}catch(e){return e.code||e.message;}})()`);if(!error)throw Error('Unexpected access: '+label);if(!/permission-denied|approved teacher account|active administrator account|class code is unavailable/i.test(error))throw Error('Unexpected failure instead of an access denial: '+error);pass(label,{observedError:error});}
async function admin(url,body,method=body?'POST':'GET'){
    const response=await fetch(url,{method,headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('Isolated fixture administration HTTP '+response.status);
    return response.json();
}
const encode=value=>typeof value==='string'?{stringValue:value}:typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?{integerValue:String(value)}:Array.isArray(value)?{arrayValue:{values:value.map(encode)}}:{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encode(v)]))}};
async function seedLearning(student,mission,number){
    if(!identities.some(i=>i.uid===student.uid&&i.role==='student'))throw Error('Fixture identity mismatch.');
    const records=[['studentProgress/'+student.uid+'_'+mission.id,{userId:student.uid,chapterId:mission.chapterId,missionId:mission.id,completed:true,bestScore:80,xpEarned:0}],['studentQuizAttempts/'+student.uid+'_synthetic'+number,{userId:student.uid,chapterId:mission.chapterId,missionId:mission.id,score:80,passed:true,topicsForReview:[]}]];
    for(const [record]of records)known.add(record);recovery();
    await admin(api+':commit',{writes:records.map(([record,data])=>({update:{name:`projects/${project}/databases/(default)/documents/`+record,fields:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,encode(value)]))},updateTransforms:[{fieldPath:'completedAt',setToServerValue:'REQUEST_TIME'}]}))});
}
async function createIdentity(role){
    await go('teacher-live-check.html');
    const identity={role,email:'lakbay-isolated-'+randomUUID()+'@example.com',password:randomBytes(24).toString('hex')};
    const uid=await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');const a=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');const credential=await a.createUserWithEmailAndPassword(auth,${JSON.stringify(identity.email)},${JSON.stringify(identity.password)});return credential.user.uid;})()`);
    identity.uid=uid;identities.push(identity);known.add('users/'+uid);report.cleanup='pending';recovery();
    await evaluate(`(async()=>{${sdk}await f.setDoc(f.doc(db,'users',auth.currentUser.uid),{role:${JSON.stringify(role)},status:${JSON.stringify(role==='teacher'?'pending':'active')},firstName:'Isolated',lastName:${JSON.stringify(role==='teacher'?'Teacher':'Student')},email:auth.currentUser.email,createdAt:f.serverTimestamp()});})()`);
    return identity;
}
async function signIn(identity){await go('teacher-live-check.html');await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');const a=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');await a.signOut(auth);await a.signInWithEmailAndPassword(auth,${JSON.stringify(identity.email)},${JSON.stringify(identity.password)});})()`);}
async function teacherPage(identity){await signIn(identity);await go('teacher-dashboard.html');await wait(`document.body.classList.contains('authenticated')&&document.querySelector('#teacherClasses button')`,'teacher class');await click('#teacherClasses button');await idle();}
async function studentPage(identity){await signIn(identity);await go('student-shell.html?route=my-class.html');await wait(`location.pathname.endsWith('my-class.html')&&document.body.classList.contains('authenticated')&&!document.getElementById('joinClassButton').disabled`,'student class page');}
async function submitPublication(kind,values){await click(`[data-teacher-tab="${kind==='announcement'?'announcements':'assignments'}"]`);await evaluate(`(()=>{const form=document.getElementById(${JSON.stringify(kind+'Form')});for(const [key,value]of Object.entries(${JSON.stringify(values)}))form.elements.namedItem(key).value=value;form.requestSubmit();})()`);await idle();}
async function launch(){
    if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('This opt-in check uses the configured project.');
    const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required.');
    adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
    if(!hostedBase){
    server=stagedPackage?require('../tools/serve-student-web.cjs').createStudentWebServer(stagedPackage):http.createServer((request,response)=>{
        const url=new URL(request.url,'http://localhost');
        if(url.pathname==='/pages/teacher-live-check.html'){response.setHeader('Content-Type','text/html');return response.end('<!doctype html><html><body>Isolated acceptance check</body></html>');}
        const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
        if(!file.startsWith(root+path.sep)||!/^\/(pages|js|css|assets)\//.test(url.pathname)){response.writeHead(404);return response.end();}
        fs.readFile(file,(error,data)=>{if(error){response.writeHead(404);return response.end();}response.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');response.end(data);});
    });await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://localhost:'+server.address().port;
    }else base=hostedBase;
    const profileDir=path.join(dir,'chrome');
    chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profileDir,'about:blank'],{windowsHide:true,stdio:'ignore'});
    const active=path.join(profileDir,'DevToolsActivePort');for(let i=0;i<80&&!fs.existsSync(active);i++)await pause(150);
    const port=fs.readFileSync(active,'utf8').split('\n')[0],tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
    ws.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result);}if(msg.method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});if(msg.method==='Runtime.executionContextCreated'&&msg.params.context.auxData?.isDefault)frameContexts.set(msg.params.context.auxData.frameId,msg.params.context.id);if(msg.method==='Runtime.executionContextsCleared')frameContexts.clear();if(msg.method==='Runtime.executionContextDestroyed')for(const [frame,id]of frameContexts)if(id===msg.params.executionContextId)frameContexts.delete(frame);});
    await send('Page.enable');await send('Runtime.enable');
}
async function main(){
    await launch();
    const teacher=await createIdentity('teacher');
    await denied(`(async()=>{const t=await import('/js/teacher-class-client.js');return t.loadTeacherClasses();})()`,'Pending teacher cannot open classroom tools');
    const other=await createIdentity('teacher'),student=await createIdentity('student');
    for(const identity of [teacher,other])await admin(api+'/users/'+identity.uid+'?updateMask.fieldPaths=status',{fields:{status:{stringValue:'active'}}},'PATCH');
    await signIn(teacher);await go('teacher-dashboard.html');await wait(`document.body.classList.contains('authenticated')&&!document.getElementById('refreshTeacher').disabled`,'approved teacher dashboard');
    await evaluate(`(()=>{document.querySelector('#createClassForm').closest('details').open=true;document.getElementById('newClassName').value='Isolated acceptance class';document.getElementById('newClassDescription').value='Temporary automated acceptance records; removed after verification.';document.getElementById('createClassForm').requestSubmit();})()`);await idle();
    const classes=await query('classes','teacherId',teacher.uid);if(classes.length!==1)throw Error('Unexpected isolated class count.');classId=classes[0].id;known.add('classes/'+classId);recovery();
    pass('Approved teacher creates a real owned class through the dashboard');
    await click('#rotateTeacherCode');await idle();const code=await evaluate(`document.getElementById('teacherJoinCode').textContent`);if(!/^[A-Z0-9]{12}$/.test(code))throw Error('Code was not saved.');known.add('classJoinCodes/'+code);recovery();
    pass('Dashboard generates and saves a working invitation code');
    const missions=await evaluate(`(async()=>{const t=await import('/js/teacher-class-client.js');return t.loadTeacherMissions();})()`),ordered=missions.filter(m=>m.chapterId==='era1-prologue').sort((a,b)=>a.order-b.order);if(ordered.length<3)throw Error('Expected published prologue missions.');
    await seedLearning(student,ordered[0],1);
    await submitPublication('announcement',{title:'Historical clues',body:'Bring one historical clue to our discussion.',status:'draft'});
    const news=(await query('classAnnouncements','classId',classId))[0];if(!news)throw Error('No saved draft.');known.add('classAnnouncements/'+news.id);recovery();
    for(const mission of [ordered[0],ordered[1],ordered.at(-1)])await submitPublication('assignment',{missionId:mission.id,instructions:'Explore the lesson, then explain one clue.',status:'published'});
    pass('Teacher saves a draft announcement and publishes existing mission assignments');
    await studentPage(student);
    await evaluate(`(()=>{document.getElementById('classCode').value=${JSON.stringify(code)};document.getElementById('joinClassForm').requestSubmit();})()`);
    await wait(`!!document.querySelector('.student-class-card')`,'joined class');known.add('classMembers/'+student.uid+'_'+classId);recovery();
    pass('Student joins through the normal My Class interface');
    await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'classAnnouncements',${JSON.stringify(news.id)}));})()`,'Joined student cannot read announcement drafts');
    const states=await evaluate(`[...document.querySelectorAll('.class-assignment')].map(el=>({state:el.dataset.state,title:el.querySelector('h4').textContent,hasLessonLink:!!el.querySelector('a[href*="story.html"]')}))`);
    report.assignmentStates=states;
    if(!states.some(s=>s.state==='complete')||!states.some(s=>s.state==='locked'&&!s.hasLessonLink))throw Error('Expected independent completion and locked assignment: '+JSON.stringify(states));
    pass('Earlier independent completion counts and a locked assignment stays locked');
    await teacherPage(teacher);await click('[data-teacher-tab="students"]');await click('#teacherRoster button');await idle();
    if(!await evaluate(`document.getElementById('studentReport').textContent.includes('1 completed missions')`))throw Error('Expected earlier completion in teacher report.');known.add('teacherStudentLinks/'+teacher.uid+'_'+student.uid);recovery();
    pass('Owning teacher opens the joined student name, saved completion and quiz report');
    await seedLearning(student,ordered[1],2);await click('#refreshTeacher');await idle();await click('[data-teacher-tab="students"]');await click('#teacherRoster button');await idle();
    if(!await evaluate(`document.getElementById('studentReport').textContent.includes('2 completed missions')`))throw Error('Updated completion missing.');
    pass('Teacher refresh picks up a newly saved synthetic completion');
    await click('[data-teacher-tab="announcements"]');await evaluate(`[...document.querySelectorAll('#announcementList button')].find(b=>b.textContent==='Publish').click()`);await idle();
    await click('[data-teacher-tab="overview"]');await click('#rotateTeacherCode');await idle();const newCode=await evaluate(`document.getElementById('teacherJoinCode').textContent`);known.add('classJoinCodes/'+newCode);recovery();
    pass('Teacher publishes the announcement and rotates the invitation atomically');
    await studentPage(student);await wait(`document.querySelector('.student-class-card')?.textContent.includes('Bring one historical clue')`,'published announcement');
    pass('Joined student sees the published announcement in My Class');
    await click('.student-class-card button');await wait(`!document.querySelector('.student-class-card')`,'left class');
    if((await query('studentProgress','userId',student.uid)).length!==2)throw Error('Leaving changed progress.');
    await denied(`(async()=>{const join=await import('/js/student-class-client.js');return join.joinStudentClass(${JSON.stringify(code)});})()`,'Replaced invitation no longer admits students');
    pass('Leaving through My Class preserves the student learning records');
    await signIn(teacher);
    await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'studentProgress',${JSON.stringify(student.uid+'_'+ordered[0].id)}));})()`,'Leaving immediately denies further teacher reads despite retained report link');
    await signIn(other);
    await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'classes',${JSON.stringify(classId)}));})()`,'Another approved teacher cannot read the class');
    await denied(`(async()=>{${sdk}return f.getDocsFromServer(f.query(f.collection(db,'classMembers'),f.where('classId','==',${JSON.stringify(classId)})));})()`,'Another approved teacher cannot query the roster');
    await denied(`(async()=>{${sdk}return f.getDocsFromServer(f.query(f.collection(db,'studentQuizAttempts'),f.where('userId','==',${JSON.stringify(student.uid)})));})()`,'Another approved teacher cannot query the student quiz results');
    await teacherPage(teacher);await click('#archiveClass');await idle();
    if(!await evaluate(`document.getElementById('activeClassTools').hidden&&document.getElementById('archiveNote').hidden===false`))throw Error('Archive controls did not update.');
    pass('Real class archive disables invitations and publication');report.status='pass';
}
async function cleanup(){
    try{
        for(const identity of identities)await admin(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:delete`,{localId:identity.uid});
        if(classId){
            const own=await admin(api+'/classes/'+classId);if(!identities.some(i=>i.uid===own.fields?.teacherId?.stringValue))throw Error('Cleanup class ownership mismatch.');
            for(const collection of ['classJoinCodes','classAssignments','classAnnouncements','classMembers','classReviewAssignments','classReviewReflections','classHelpRequests','classFeedback','teacherSupportNotes']){
                const rows=await admin(api+':runQuery',{structuredQuery:{from:[{collectionId:collection}],where:{fieldFilter:{field:{fieldPath:'classId'},op:'EQUAL',value:{stringValue:classId}}}}});
                for(const row of rows){if(!row.document)continue;if(row.document.fields?.classId?.stringValue!==classId)throw Error('Cleanup class mismatch.');if(collection==='classMembers'&&!identities.some(i=>i.uid===row.document.fields?.userId?.stringValue))throw Error('Nonfixture membership found; inspect manually.');known.add(collection+'/'+row.document.name.split('/').at(-1));}
            }
        }
        for(const actorId of auditActors){
            const rows=await admin(api+':runQuery',{structuredQuery:{from:[{collectionId:'accountModeration'}],where:{fieldFilter:{field:{fieldPath:'actorId'},op:'EQUAL',value:{stringValue:actorId}}}}});
            for(const row of rows){if(!row.document)continue;if(row.document.fields?.actorId?.stringValue!==actorId||!identities.some(i=>i.uid===row.document.fields?.userId?.stringValue))throw Error('Nonfixture audit entry found; inspect manually.');known.add('accountModeration/'+row.document.name.split('/').at(-1));}
            const reviews=await admin(api+':runQuery',{structuredQuery:{from:[{collectionId:'teacherApplicationReviews'}],where:{fieldFilter:{field:{fieldPath:'actorId'},op:'EQUAL',value:{stringValue:actorId}}}}});for(const row of reviews){if(!row.document)continue;if(!identities.some(i=>i.uid===row.document.fields?.userId?.stringValue))throw Error('Nonfixture qualification review found.');known.add('teacherApplicationReviews/'+row.document.name.split('/').at(-1));}
        }
        for(const identity of identities){known.add('teacherApplications/'+identity.uid);known.add('teacherEvidence/'+identity.uid);}
        if(known.size)await admin(api+':commit',{writes:[...known].map(record=>({delete:`projects/${project}/databases/(default)/documents/`+record}))});
        report.cleanup='complete';report.removedTemporaryAccounts=identities.length;report.removedOwnedDocuments=known.size;
        if(fs.existsSync(path.join(dir,'recovery.json')))fs.unlinkSync(path.join(dir,'recovery.json'));
        console.log(`CLEANUP: ${identities.length} temporary accounts and ${known.size} owned documents removed`);
    }catch(error){report.cleanup='needs-follow-up';report.cleanupError=error.message;process.exitCode=1;console.error('Cleanup requires follow-up: '+path.join(dir,'recovery.json'));}
    ws?.close();chrome?.kill();server?.close();report.finishedAt=new Date().toISOString();
    report.sources=sourceFiles.map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
    fs.writeFileSync(path.join(root,'docs/validation',reportFile),JSON.stringify(report,null,2));
}
function configureCurrentTeacherCycle(){reportFile='teacher-current-cycle-live-2026-11-05.json';report.mode='real-sdk-temporary-teacher-student-cycle';report.limitations=['Temporary synthetic identities only; no existing teacher/student account is used.','Trusted fixture approval is not professional credential verification.','Saved learning records are labelled synthetic; this is not a complete quiz gameplay or human usability test.','Local bootstrap with production Firebase, not deployed hosted acceptance.'];}
function registerFixtureRecord(record){if(typeof record!=='string'||record.includes('..')||!identities.some(i=>record.includes(i.uid)))throw Error('Record is not scoped to a temporary identity.');known.add(record);recovery();}
function configureAdmin(){reportFile='admin-workflow-live-2026-10-31.json';sourceFiles=['js/admin-accounts.js','js/admin-workspace.js','js/auth-guard.js','firestore.rules'];report.mode='real-sdk-isolated-admin-accounts-local-client-live-firestore';}
function registerAuditActor(uid){if(!identities.some(i=>i.uid===uid))throw Error('Unowned audit actor.');auditActors.add(uid);}
function registerClass(id){classId=id;known.add('classes/'+id);recovery();}
function registerIdentity(identity){if(!identity.uid||!identity.email?.startsWith('lakbay-isolated-'))throw Error('Unrecognised temporary identity.');identities.push(identity);known.add('users/'+identity.uid);report.cleanup='pending';recovery();}
function configureStagedRelease(folder){stagedPackage=require('../tools/serve-student-web.cjs').resolvePackage(folder);reportFile='staged-role-auth-live-2026-10-31.json';sourceFiles=['js/auth-ui.js','pages/teacher-register.html','pages/login.html','js/auth-guard.js'];report.mode='real-sdk-staged-local-security-headers-live-firebase';report.package=path.relative(root,stagedPackage);report.limitations=['Local HTTP with staged security headers; not deployed HTTPS hosting.','Only temporary identities are modified; no human usability or email delivery acceptance.'];}
function configureHostedRelease(folder,value){configureStagedRelease(folder);const url=new URL(value);if(url.protocol!=='https:'||!/^lakbaypanahon-1797e--release-review-[a-z0-9-]+\.web\.app$/.test(url.hostname)||url.pathname!=='/'||url.username||url.password||url.search||url.hash)throw Error('Use only the approved Firebase preview origin.');hostedBase=url.origin;reportFile='hosted-role-auth-live-2026-10-31.json';report.mode='real-sdk-hosted-https-preview-live-firebase';report.url=hostedBase;report.limitations=['Temporary identities only; no real learner or teacher account is modified.','Role routing and registration acceptance, not human usability/content/device/audio acceptance.'];}
function configureQualification(folder,value){configureHostedRelease(folder,value);reportFile='teacher-qualification-live-2026-10-31.json';sourceFiles=['js/teacher-application-client.js','js/teacher-application-review.js','js/teacher-application.js','js/teacher-review-panel.js','js/auth-ui.js','js/auth-guard.js','firestore.rules'];report.mode='hosted-real-sdk-isolated-qualification-workflow';report.limitations=['Only synthetic temporary identities and evidence are used.','Email verification for the test identity is set through trusted Auth administration; no verification emails are sent.','PRC/institution references are synthetic fixture records, not actual credential checks.','Human email delivery, institutional verification and usability acceptance remain separate.'];}
if(require.main===module)main().catch(error=>{report.status='fail';report.error=error.message;console.error('FAIL: '+error.message);process.exitCode=1;}).finally(cleanup);
function configurePriority2Production(){hostedBase='https://lakbaypanahon-1797e.web.app';reportFile='priority-2-production-harness-2026-11-07.json';sourceFiles=['js/mission-assessment.js','js/learning-draft.js'];report.mode='hosted-production-isolated-priority2';report.limitations=['Temporary identities only.','Separate browser frames, not physical devices.'];}
async function evaluateNamedFrame(name,expression){const tree=await send('Page.getFrameTree');const frame=tree.frameTree.childFrames?.find(item=>item.frame.name===name);const context=frame&&frameContexts.get(frame.frame.id);if(!context)throw Error('Frame not ready: '+name);return raw(expression,context);}
module.exports={launch,createIdentity,signIn,go,evaluate,wait,click,query,admin,pass,denied,seedLearning,report,configureAdmin,configureStagedRelease,configureHostedRelease,configureQualification,registerIdentity,registerAuditActor,registerClass,registerFixtureRecord,configureCurrentTeacherCycle,cleanup,api,configurePriority2Production,evaluateNamedFrame};
