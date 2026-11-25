import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer,onSnapshot,runTransaction,serverTimestamp,Timestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {reload,getIdToken,sendEmailVerification} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {applicationFields,safeEvidence,teacherEvidenceExpired} from './teacher-application-policy.js';
function applicationSession(){const user=auth.currentUser;if(!user)throw Error('Sign in to manage your application.');return{user,check(){if(auth.currentUser!==user)throw Error('Your session changed. Sign in again.');}};}
async function applicant(s){
 const p=await getDocFromServer(doc(db,'users',s.user.uid));s.check();
 if(!p.exists())throw Object.assign(Error('Finish setting up your teacher account.'),{code:'teacher/profile-missing'});
 if(p.data().role!=='teacher')throw Error('A teacher applicant account is required.');
 return p.data();
}
export async function refreshTeacherEmail(){const s=applicationSession();await reload(s.user);s.check();await getIdToken(s.user,true);s.check();return s.user.emailVerified===true;}
export async function sendTeacherVerification(){const s=applicationSession();await applicant(s);if(s.user.emailVerified)return;await sendEmailVerification(s.user,{url:new URL('teacher-application.html',location.href).href});s.check();}
export async function loadTeacherApplication(){
 const s=applicationSession(),profile=await applicant(s);
 const ref=doc(db,'teacherApplications',s.user.uid),snapshot=await getDocFromServer(ref);
 s.check();
 let application=snapshot.exists()?snapshot.data():null;
 if(application?.status==='submitted'&&application.emailVerified===false&&application.email===s.user.email&&s.user.emailVerified===true){
  await getIdToken(s.user,true);s.check();
  application=await runTransaction(db,async tx=>{
   const latest=await tx.get(ref);s.check();
   const data=latest.exists()?latest.data():null;
   if(data?.status!=='submitted'||data.emailVerified!==false||data.email!==s.user.email)return data;
   tx.update(ref,{emailVerified:true});
   return {...data,emailVerified:true};
  });s.check();
 }
 return {profile,application};
}
export function watchTeacherApplication(onApplication,onProfile,onError){
 const {user}=applicationSession();
 const subscribe=(name,callback)=>onSnapshot(doc(db,name,user.uid),{includeMetadataChanges:true},snapshot=>{
  if(auth.currentUser!==user||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
  callback(snapshot.exists()?snapshot.data():null);
 },error=>{if(auth.currentUser===user)onError(error);});
 const subscriptions=[subscribe('teacherApplications',onApplication),subscribe('users',onProfile)];
 return ()=>subscriptions.forEach(stop=>stop());
}
export async function readTeacherEvidence(uid,application){
 const s=applicationSession();if(!application?.evidenceRevision)return null;
 if(teacherEvidenceExpired(application.evidenceUploadedAt)){
  // The attachment may have been replaced since this application was loaded.
  await runTransaction(db,async tx=>{
   const latest=await tx.get(doc(db,'teacherApplications',uid));s.check();
   const current=latest.data();
   if(current?.evidenceRevision===application.evidenceRevision&&teacherEvidenceExpired(current.evidenceUploadedAt)){
    tx.delete(doc(db,'teacherEvidence',uid));
   }
  });s.check();return{expired:true};
 }
 const snapshot=await getDocFromServer(doc(db,'teacherEvidence',uid));s.check();
 if(!snapshot.exists())return{unavailable:true};const data=snapshot.data();
 if(data.revision!==application.evidenceRevision)throw Error('Evidence changed. Reload this application.');
 return data;
}
export async function saveTeacherApplication(values,{submit=false,file=null,removeEvidence=false,expectedRevision=0,expectedStatus=null,expectedReviewId=null}={}){
 const fields=applicationFields(values,submit),s=applicationSession();await applicant(s);
 if(submit)await refreshTeacherEmail();
 s.check();
 let evidence=null;
 if(file){safeEvidence(file);const bytes=new Uint8Array(await file.arrayBuffer());s.check();let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);evidence={mime:file.type,data:btoa(binary),name:file.name.slice(0,100)};}
 const ref=doc(db,'teacherApplications',s.user.uid),attachment=doc(db,'teacherEvidence',s.user.uid);
 let intended;
 try{await runTransaction(db,async tx=>{
  intended=undefined;
  const old=await tx.get(ref);s.check();const previous=old.exists()?old.data():null;
  if((previous?.revision||0)!==expectedRevision||(previous?.status||null)!==expectedStatus||(previous?.reviewId||null)!==expectedReviewId){
   throw Object.assign(Error('Your saved application changed while you were editing.'),{code:'teacher/stale-application'});
  }
  const revision=expectedRevision+1;
  const data={...fields,userId:s.user.uid,email:s.user.email,emailVerified:s.user.emailVerified===true,revision,status:submit?'submitted':'draft',updatedAt:serverTimestamp(),evidenceRevision:previous?.evidenceRevision||0,evidenceName:previous?.evidenceName||'',evidenceUploadedAt:previous?.evidenceUploadedAt||null};
  delete data.prcExpiry;data.prcExpiresAt=fields.prcExpiry?Timestamp.fromDate(new Date(fields.prcExpiry+'T23:59:59+08:00')):null;
  if(evidence){data.evidenceRevision=revision;data.evidenceName=evidence.name;data.evidenceUploadedAt=serverTimestamp();tx.set(attachment,{...evidence,userId:s.user.uid,revision,uploadedAt:serverTimestamp()});}
  else if(removeEvidence){data.evidenceRevision=0;data.evidenceName='';data.evidenceUploadedAt=null;tx.delete(attachment);}
  intended=data;
  tx.set(ref,data);
 });}catch(error){
  s.check();
  const code=String(error.code||'').split('/').pop();
  if(!intended||!['unavailable','deadline-exceeded','unknown','internal','cancelled'].includes(code))throw error;
  const savedSnapshot=await getDocFromServer(ref).catch(()=>null);s.check();
  const saved=savedSnapshot?.data();
  const {updatedAt,evidenceUploadedAt,prcExpiresAt,...exactFields}=intended;
  const matches=saved&&Object.entries(exactFields).every(([key,value])=>saved[key]===value)&&
   (saved.prcExpiresAt?.toMillis?.()??null)===(prcExpiresAt?.toMillis?.()??null);
  if(!matches)throw error;
  if(evidence){
   const image=await getDocFromServer(attachment).catch(()=>null);s.check();
   const stored=image?.data();
   if(stored?.revision!==intended.revision||stored.data!==evidence.data||stored.mime!==evidence.mime)throw error;
  }
 }
 s.check();
}
