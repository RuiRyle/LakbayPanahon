import {auth,db} from './firebase-config.js';
import {doc,collection,query,where,orderBy,documentId,limit,startAfter,getDocFromServer,getDocsFromServer,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

function session() {
    const user=auth.currentUser;
    if(!user)throw Error('Sign in with an administrator account.');
    return {user,check(){if(auth.currentUser!==user)throw Error('Your session changed. Sign in again.');}};
}
async function administrator(s) {
    const profile=await getDocFromServer(doc(db,'users',s.user.uid));s.check();
    if(!profile.exists()||profile.data().role!=='admin'||profile.data().status!=='active')throw Error('An active administrator account is required.');
}
function targetRef(uid) {
    if(typeof uid!=='string'||!uid||uid.includes('/'))throw Error('Invalid account.');
    return doc(db,'users',uid);
}
export function moderationDetails(profile,status,reason,identityVerified) {
    if(!['student','teacher'].includes(profile.role)||!['pending','active','inactive'].includes(profile.status))throw Error('This account cannot be managed here.');
    if(!['active','inactive'].includes(status)||status===profile.status)throw Error('Choose a different account status.');
    const note=String(reason||'').trim();
    if(note.length<5||note.length>500)throw Error('Enter a reason between 5 and 500 characters.');
    if(profile.role==='teacher'&&status==='active'&&identityVerified!==true)throw Error('Verify the teacher identity before granting access.');
    return {status,reason:note,identityVerified:identityVerified===true};
}
export async function loadAdminAccounts({role='teacher',status='pending',cursor=null}={}) {
    if(!['teacher','student'].includes(role)||!['pending','active','inactive'].includes(status))throw Error('Choose a valid account filter.');
    const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(query(collection(db,'users'),where('role','==',role),where('status','==',status),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
    const page=snapshot.docs.slice(0,25);
    return {rows:page.map(d=>({...d.data(),id:d.id})),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null};
}
export async function loadAdminAccount(uid) {
    const s=session();await administrator(s);
    const profile=await getDocFromServer(targetRef(uid));s.check();
    if(!profile.exists())throw Error('This account is unavailable. Refresh the list.');
    return {profile:{...profile.data(),id:profile.id}};
}
export async function loadSubmittedTeacherApplications(cursor=null){
    const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(query(collection(db,'teacherApplications'),where('status','==','submitted'),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
    const page=snapshot.docs.slice(0,25);
    return{rows:page.map(d=>({...d.data(),id:d.id,firstName:d.data().legalName,lastName:''})),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null};
}
export async function loadAdminHistory(uid,cursor=null) {
    targetRef(uid);const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(query(collection(db,'accountModeration'),where('userId','==',uid),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
    const page=snapshot.docs.slice(0,25);
    return {rows:page.map(d=>({...d.data(),id:d.id})),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null};
}
export async function moderateAccount({uid,expectedStatus,expectedRole,expectedVersion,status,reason,identityVerified=false}) {
    const s=session();await administrator(s);
    if(uid===s.user.uid)throw Error('You cannot change your own access.');
    const ref=targetRef(uid),event=doc(collection(db,'accountModeration'));
    await runTransaction(db,async tx=>{
        const snapshot=await tx.get(ref);s.check();
        if(!snapshot.exists())throw Error('This account is unavailable.');
        const current=snapshot.data();
        const version=current.updatedAt?.toMillis?.()||current.createdAt?.toMillis?.()||0;
        if(current.status!==expectedStatus||current.role!==expectedRole||version!==expectedVersion)throw Error('This account changed while you were reviewing it. Refresh before deciding.');
        const details=moderationDetails(current,status,reason,identityVerified);
        if(current.role==='teacher'&&status==='active'){
            const application=await tx.get(doc(db,'teacherApplications',uid));s.check();
            if(!application.exists()||application.data().status!=='approved'||application.data().revision!==current.teacherVerifiedRevision)throw Error('Review and approve the submitted qualification application first. A checkbox alone cannot grant classroom access.');
        }
        tx.update(ref,{status:details.status,updatedAt:serverTimestamp(),moderatedAt:serverTimestamp(),moderatedBy:s.user.uid,moderationEventId:event.id});
        tx.set(event,{userId:uid,actorId:s.user.uid,previousStatus:current.status,...details,createdAt:serverTimestamp()});
    });s.check();
}
