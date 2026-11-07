import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer,runTransaction,serverTimestamp,Timestamp,deleteDoc} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {reload,getIdToken,sendEmailVerification} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {applicationFields,safeEvidence,EVIDENCE_DAYS} from './teacher-application-policy.js';
function applicationSession(){const user=auth.currentUser;if(!user)throw Error('Sign in to manage your application.');return{user,check(){if(auth.currentUser!==user)throw Error('Your session changed. Sign in again.');}};}
async function applicant(s){const p=await getDocFromServer(doc(db,'users',s.user.uid));s.check();if(!p.exists()||p.data().role!=='teacher')throw Error('A teacher applicant account is required.');return p.data();}
export async function refreshTeacherEmail(){const s=applicationSession();await reload(s.user);s.check();await getIdToken(s.user,true);s.check();return s.user.emailVerified===true;}
export async function sendTeacherVerification(){const s=applicationSession();await applicant(s);if(s.user.emailVerified)return;await sendEmailVerification(s.user,{url:new URL('teacher-application.html',location.href).href});s.check();}
export async function loadTeacherApplication(){const s=applicationSession();const profile=await applicant(s);const snapshot=await getDocFromServer(doc(db,'teacherApplications',s.user.uid));s.check();return{profile,application:snapshot.exists()?snapshot.data():null};}
export async function readTeacherEvidence(uid,application){
 const s=applicationSession();if(!application?.evidenceRevision)return null;
 if(!application.evidenceUploadedAt?.toMillis||application.evidenceUploadedAt.toMillis()+EVIDENCE_DAYS*86400000<=Date.now()){
  await deleteDoc(doc(db,'teacherEvidence',uid));s.check();return{expired:true};
 }
 const snapshot=await getDocFromServer(doc(db,'teacherEvidence',uid));s.check();
 if(!snapshot.exists())return{unavailable:true};const data=snapshot.data();
 if(data.revision!==application.evidenceRevision)throw Error('Evidence changed. Reload this application.');
 return data;
}
export async function saveTeacherApplication(values,{submit=false,file=null,removeEvidence=false,expectedRevision=0}={}){
 const fields=applicationFields(values,submit),s=applicationSession();await applicant(s);
 if(submit&&!await refreshTeacherEmail())throw Error('Verify your email, then choose Check Email Status before submitting.');s.check();
 let evidence=null;
 if(file){safeEvidence(file);const bytes=new Uint8Array(await file.arrayBuffer());s.check();let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);evidence={mime:file.type,data:btoa(binary),name:file.name.slice(0,100)};}
 const ref=doc(db,'teacherApplications',s.user.uid),attachment=doc(db,'teacherEvidence',s.user.uid);
 await runTransaction(db,async tx=>{
  const old=await tx.get(ref);s.check();const previous=old.exists()?old.data():null;
  if((previous?.revision||0)!==expectedRevision)throw Error('Your application changed. Refresh before saving.');
  const revision=expectedRevision+1;
  const data={...fields,userId:s.user.uid,email:s.user.email,emailVerified:s.user.emailVerified===true,revision,status:submit?'submitted':'draft',updatedAt:serverTimestamp(),evidenceRevision:previous?.evidenceRevision||0,evidenceName:previous?.evidenceName||'',evidenceUploadedAt:previous?.evidenceUploadedAt||null};
  delete data.prcExpiry;data.prcExpiresAt=fields.prcExpiry?Timestamp.fromDate(new Date(fields.prcExpiry+'T23:59:59+08:00')):null;
  if(evidence){data.evidenceRevision=revision;data.evidenceName=evidence.name;data.evidenceUploadedAt=serverTimestamp();tx.set(attachment,{...evidence,userId:s.user.uid,revision,uploadedAt:serverTimestamp()});}
  else if(removeEvidence){data.evidenceRevision=0;data.evidenceName='';data.evidenceUploadedAt=null;tx.delete(attachment);}
  tx.set(ref,data);
 });s.check();
}
