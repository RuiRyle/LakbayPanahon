// Actual staged HTML/JS + CSP headers and live Firebase, temporary identities only.
const {randomUUID,randomBytes}=require('node:crypto');
const h=require('./teacher-workflow-live.cjs');
const {evaluate,go,wait,pass,admin,api}=h;
async function login(identity){
 await go('login.html');await wait(`document.getElementById('loginForm')&&!document.querySelector('#loginForm [type=submit]').disabled`,'sign-in form');
 await evaluate(`(()=>{document.getElementById('loginEmail').value=${JSON.stringify(identity.email)};document.getElementById('loginPassword').value=${JSON.stringify(identity.password)};document.getElementById('rememberMe').checked=false;document.getElementById('loginForm').requestSubmit();})()`);
}
async function main(){
 if(process.argv[3])h.configureHostedRelease(process.argv[2],process.argv[3]);else h.configureStagedRelease(process.argv[2]||'build/student-web-lWuxmY');await h.launch();
 const teacher={role:'teacher',email:'lakbay-isolated-'+randomUUID()+'@example.com',password:randomBytes(24).toString('hex')};
 await go('teacher-register.html');await wait(`document.getElementById('teacherRegisterForm')`,'teacher registration');
 await evaluate(`(()=>{const fields={teacherFirstName:'Isolated',teacherLastName:'Teacher',teacherEmail:${JSON.stringify(teacher.email)},teacherPassword:${JSON.stringify(teacher.password)},teacherConfirmPassword:${JSON.stringify(teacher.password)}};for(const [id,value]of Object.entries(fields))document.getElementById(id).value=value;document.getElementById('teacherTerms').checked=true;document.getElementById('teacherRegisterForm').requestSubmit();})()`);
 await wait(`(async()=>{const {auth}=await import('/js/firebase-config.js');return!!auth.currentUser;})()`,'temporary teacher identity');
 teacher.uid=await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');return auth.currentUser.uid;})()`);h.registerIdentity(teacher);
 await wait(`!document.getElementById('teacherRegistrationContinue').hidden`,'confirmed teacher profile');
 const profile=await evaluate(`(async()=>{const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');const d=(await f.getDocFromServer(f.doc(db,'users',auth.currentUser.uid))).data();return{role:d.role,status:d.status};})()`);
 if(profile.role!=='teacher'||profile.status!=='pending')throw Error('Teacher registration did not preserve approval requirement.');pass('Staged teacher registration confirms a real pending profile under CSP');
 await login(teacher);await wait(`document.getElementById('loginMessage')?.textContent.includes('waiting for administrator')`,'pending-account notice');pass('Normal sign-in explains pending teacher approval without opening classroom tools');
 const operator=await h.createIdentity('teacher'),student=await h.createIdentity('student');
 await admin(api+'/users/'+operator.uid+'?updateMask.fieldPaths=role&updateMask.fieldPaths=status',{fields:{role:{stringValue:'admin'},status:{stringValue:'active'}}},'PATCH');h.registerAuditActor(operator.uid);
 await login(student);await wait(`location.pathname.endsWith('student-dashboard.html')&&document.body.classList.contains('authenticated')`,'normal student Home');
 if(!await evaluate('globalThis.__lakbayExplorationPreview===false'))throw Error('Student normal progression is not the default.');pass('Normal student sign-in reaches authenticated Home inside the persistent shell');
 await login(operator);await wait(`location.pathname.endsWith('admin-dashboard.html')&&document.body.classList.contains('authenticated')`,'administrator workspace');pass('Normal administrator sign-in reaches its protected workspace under CSP');
 await evaluate(`(async()=>{const a=await import('/js/admin-accounts.js');const p=(await a.loadAdminAccount(${JSON.stringify(teacher.uid)})).profile;await a.moderateAccount({uid:p.id,expectedRole:p.role,expectedStatus:p.status,expectedVersion:p.updatedAt?.toMillis?.()||p.createdAt?.toMillis?.()||0,status:'active',reason:'Isolated staged sign-in check: teacher identity confirmed.',identityVerified:true});})()`);
 pass('Administrator approval saves through the staged client with its audit record');
 await login(teacher);await wait(`location.pathname.endsWith('teacher-dashboard.html')&&document.body.classList.contains('authenticated')&&!document.getElementById('refreshTeacher').disabled`,'approved teacher workspace');
 if(await evaluate(`document.getElementById('teacherStatus').dataset.error==='true'`))throw Error('Teacher tools failed after login.');pass('Approved teacher sign-in reaches its classroom workspace under CSP');
 await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');const a=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');await a.signOut(auth);})()`);
 await wait(`location.pathname.endsWith('login.html')`,'sign-out redirect');pass('Protected workspace sign-out returns to Sign In');h.report.status='pass';
}
main().catch(e=>{h.report.status='fail';h.report.error=e.message;console.error('FAIL: '+e.message);process.exitCode=1;}).finally(h.cleanup);
