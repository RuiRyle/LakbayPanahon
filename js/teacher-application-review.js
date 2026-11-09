import {auth,db} from './firebase-config.js';
import {executeAdminDecision} from './admin-decision-recovery.js';
import {doc,collection,getDocFromServer,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {reviewFields,EVIDENCE_DAYS} from './teacher-application-policy.js';
export async function reviewTeacherApplication(uid,expectedRevision,expectedProfileVersion,values){
 const user=auth.currentUser;if(!user)throw Error('Sign in as an administrator.');
 const current=()=>{if(auth.currentUser!==user)throw Error('Your session changed.');};
 const ref=doc(db,'teacherApplications',uid),profile=doc(db,'users',uid),event=doc(collection(db,'accountModeration')),review=doc(db,'teacherApplicationReviews',event.id);
 await executeAdminDecision(()=>runTransaction(db,async tx=>{
  const [actor,application,account]=await Promise.all([tx.get(doc(db,'users',user.uid)),tx.get(ref),tx.get(profile)]);current();
  if(actor.data()?.role!=='admin'||actor.data()?.status!=='active')throw Error('An active administrator account is required.');
  const a=application.data(),p=account.data();
  if(!a||a.status!=='submitted'||a.revision!==expectedRevision||p?.role!=='teacher'||(p.updatedAt?.toMillis?.()||p.createdAt?.toMillis?.()||0)!==expectedProfileVersion)throw Error('This application or account changed. Reload before deciding.');
  const result=reviewFields(a,values);
  if(result.decision==='approved'&&a.applicantType==='licensed_teacher'&&a.prcExpiresAt?.toMillis()<=Date.now())throw Error('The declared PRC expiry has passed. Request updated credentials.');
  if(result.decision==='approved'&&a.evidenceRevision){const evidence=await tx.get(doc(db,'teacherEvidence',uid));current();if(!evidence.exists()||evidence.data().revision!==a.evidenceRevision||evidence.data().uploadedAt.toMillis()+EVIDENCE_DAYS*86400000<=Date.now())throw Error('Supporting evidence is missing or expired. Request an updated submission.');}
  const status=result.decision==='approved'?p.status:p.status==='inactive'?'inactive':'pending';
  tx.update(ref,{status:result.decision,decisionReason:result.reason,reviewId:event.id,reviewedAt:serverTimestamp(),reviewedBy:user.uid,updatedAt:serverTimestamp(),evidenceRevision:0,evidenceName:'',evidenceUploadedAt:null});
  tx.update(profile,{status,teacherVerifiedRevision:result.decision==='approved'?a.revision:0,teacherAccessType:result.decision==='approved'?a.applicantType:'',teacherVerificationReviewId:event.id,moderationEventId:event.id,moderatedBy:user.uid,moderatedAt:serverTimestamp(),updatedAt:serverTimestamp()});
  tx.set(event,{userId:uid,actorId:user.uid,previousStatus:p.status,status,reason:result.reason,identityVerified:result.checks.identity,createdAt:serverTimestamp()});
  tx.set(review,{...result,userId:uid,actorId:user.uid,revision:a.revision,applicantType:a.applicantType,createdAt:serverTimestamp()});
  if(a.evidenceRevision)tx.delete(doc(db,'teacherEvidence',uid));
 }),async()=>{current();const actor=await getDocFromServer(doc(db,'users',user.uid));current();if(actor.data()?.role!=='admin'||actor.data()?.status!=='active')throw Error('An active administrator account is required.');const saved=await getDocFromServer(review);current();return saved;},{userId:uid,actorId:user.uid,revision:expectedRevision,decision:values.decision,reason:String(values.reason||'').trim()});current();
}
