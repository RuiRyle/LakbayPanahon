// Opt-in real SDK verification. Only synthetic temporary identities are modified.
// The common harness records recovery IDs and removes owned accounts/documents.
const h=require('./teacher-workflow-live.cjs');
const {evaluate,signIn,pass,denied,admin,api}=h;
const sdk=`const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');`;
async function decide(uid,status,identityVerified,reason){
 return evaluate(`(async()=>{const a=await import('/js/admin-accounts.js');const p=(await a.loadAdminAccount(${JSON.stringify(uid)})).profile;await a.moderateAccount({uid:p.id,expectedRole:p.role,expectedStatus:p.status,expectedVersion:p.updatedAt?.toMillis?.()||p.createdAt?.toMillis?.()||0,status:${JSON.stringify(status)},identityVerified:${JSON.stringify(identityVerified)},reason:${JSON.stringify(reason)}});})()`);
}
async function main(){
 h.configureAdmin();await h.launch();
 const operator=await h.createIdentity('teacher'),teacher=await h.createIdentity('teacher'),student=await h.createIdentity('student');
 // Trusted bootstrap is confined to this newly created fixture identity.
 await admin(api+'/users/'+operator.uid+'?updateMask.fieldPaths=role&updateMask.fieldPaths=status',{fields:{role:{stringValue:'admin'},status:{stringValue:'active'}}},'PATCH');h.registerAuditActor(operator.uid);
 await signIn(teacher);
 await denied(`(async()=>{const a=await import('/js/admin-accounts.js');return a.loadAdminAccount(${JSON.stringify(student.uid)});})()`,'Teacher cannot use administrator account tools');
 await denied(`(async()=>{const t=await import('/js/teacher-class-client.js');return t.loadTeacherClasses();})()`,'Pending teacher cannot open classroom tools before approval');
 await signIn(operator);
 const profile=await evaluate(`(async()=>{const a=await import('/js/admin-accounts.js');return(await a.loadAdminAccount(${JSON.stringify(teacher.uid)})).profile.status;})()`);
 if(profile!=='pending')throw Error('Expected isolated pending teacher.');pass('Administrator reads the isolated pending request');
 const missingVerification=await evaluate(`(async()=>{const a=await import('/js/admin-accounts.js');const p=(await a.loadAdminAccount(${JSON.stringify(teacher.uid)})).profile;try{await a.moderateAccount({uid:p.id,expectedRole:p.role,expectedStatus:p.status,expectedVersion:p.createdAt.toMillis(),status:'active',reason:'Identity not confirmed.',identityVerified:false});return false;}catch(e){return e.message.includes('Verify the teacher identity');}})()`);
 if(!missingVerification)throw Error('Verification confirmation was not enforced.');pass('Teacher approval requires the verification confirmation');
 await decide(teacher.uid,'active',true,'Isolated acceptance: teacher identity checked.');
 let history=await evaluate(`(async()=>{const a=await import('/js/admin-accounts.js');return(await a.loadAdminHistory(${JSON.stringify(teacher.uid)})).rows.map(r=>({status:r.status,previousStatus:r.previousStatus,actorId:r.actorId,id:r.id}));})()`);
 if(history.length!==1||history[0].status!=='active'||history[0].previousStatus!=='pending'||history[0].actorId!==operator.uid)throw Error('Missing matching approval audit record.');pass('Real approval atomically saves the teacher status and audit record');
 await denied(`(async()=>{${sdk}return f.updateDoc(f.doc(db,'accountModeration',${JSON.stringify(history[0].id)}),{reason:'Rewrite history'});})()`,'Administrator cannot rewrite a saved audit entry');
 await denied(`(async()=>{${sdk}return f.updateDoc(f.doc(db,'users',${JSON.stringify(teacher.uid)}),{status:'inactive'});})()`,'Direct status writes without audit are denied by Firestore');
 await signIn(teacher);
 const classId=await evaluate(`(async()=>{const t=await import('/js/teacher-class-client.js');return t.createTeacherClass('Isolated admin acceptance','Temporary acceptance class; removed after verification.');})()`);h.registerClass(classId);pass('Approved teacher can create an owned class');
 await signIn(operator);await decide(teacher.uid,'inactive',false,'Isolated acceptance: temporarily restrict teacher access.');
 await signIn(teacher);await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'classes',${JSON.stringify(classId)}));})()`,'Deactivated teacher loses protected classroom access');
 await signIn(operator);await decide(teacher.uid,'active',true,'Isolated acceptance: returning teacher identity checked.');
 await signIn(teacher);await evaluate(`(async()=>{const t=await import('/js/teacher-class-client.js');await t.loadTeacherClasses();})()`);pass('Verified teacher reactivation restores owned class access');
 await h.seedLearning(student,{id:'synthetic_admin_m1',chapterId:'synthetic_admin_c1'},1);
 await signIn(operator);await decide(student.uid,'inactive',false,'Isolated acceptance: student access restriction.');
 await signIn(student);await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'studentProgress',${JSON.stringify(student.uid+'_synthetic_admin_m1')}));})()`,'Deactivated student cannot read protected learning data');
 await signIn(operator);await decide(student.uid,'active',false,'Isolated acceptance: restore student access.');
 await signIn(student);
 const retained=await evaluate(`(async()=>{${sdk}const p=await f.getDocFromServer(f.doc(db,'studentProgress',${JSON.stringify(student.uid+'_synthetic_admin_m1')}));return p.exists()&&p.data().bestScore===80;})()`);
 if(!retained)throw Error('Restored student record missing.');pass('Student reactivation retains saved synthetic learning progress');
 await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'accountModeration',${JSON.stringify(history[0].id)}));})()`,'Student cannot read administrator audit reasons');
 await signIn(operator);
 await admin(api+'/users/'+operator.uid+'?updateMask.fieldPaths=status',{fields:{status:{stringValue:'inactive'}}},'PATCH');
 await denied(`(async()=>{${sdk}return f.getDocFromServer(f.doc(db,'users',${JSON.stringify(teacher.uid)}));})()`,'Revoked administrator loses access to other account profiles');
 h.report.status='pass';
}
main().catch(e=>{h.report.status='fail';h.report.error=e.message;console.error('FAIL: '+e.message);process.exitCode=1;}).finally(h.cleanup);
