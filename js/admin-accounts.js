import {auth,db} from './firebase-config.js';
import {executeAdminDecision} from './admin-decision-recovery.js';
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
export async function loadSubmittedTeacherApplications(cursor=null,group='pending'){
    const statuses={pending:['submitted'],review:['submitted'],awaiting:[],revision:['needs_changes'],reviewed:['approved','declined']}[group];
    if(!statuses)throw Error('Choose a valid application status.');
    const s=session();await administrator(s);
    if(group==='awaiting'){
        const snapshot=await getDocsFromServer(query(collection(db,'users'),where('role','==','teacher'),where('status','==','pending'),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
        const page=snapshot.docs.slice(0,25);
        const checked=await Promise.all(page.map(async d=>{const profile=d.data(),form=await getDocFromServer(doc(db,'teacherApplications',d.id));s.check();const application=form.exists()?form.data():null;if(application&&!['draft'].includes(application.status))return null;return{...application,id:d.id,firstName:application?.legalName||[profile.firstName,profile.lastName].filter(Boolean).join(' '),lastName:'',email:application?.email||profile.email||'',status:application?.status||'not_submitted',applicationStage:application?'Draft - not submitted':'Application not submitted'};}));s.check();
        return{rows:checked.filter(Boolean),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null,sourcePageCount:page.length};
    }
    if(group==='pending'){
        const after=cursor?[startAfter(cursor)]:[];
        const [submitted,pending]=await Promise.all([
            getDocsFromServer(query(collection(db,'teacherApplications'),where('status','==','submitted'),orderBy(documentId()),...after,limit(26))),
            getDocsFromServer(query(collection(db,'users'),where('role','==','teacher'),where('status','==','pending'),orderBy(documentId()),...after,limit(26)))
        ]);s.check();
        const forms=new Map(submitted.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
        const profiles=new Map(pending.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
        const ids=[...new Set([...forms.keys(),...profiles.keys()])].sort();
        const page=ids.slice(0,25);
        const rows=await Promise.all(page.map(async id=>{
            let a=forms.get(id),p=profiles.get(id);
            if(!a){const snap=await getDocFromServer(doc(db,'teacherApplications',id));s.check();a=snap.exists()?snap.data():null;}
            if(!p){const snap=await getDocFromServer(doc(db,'users',id));s.check();p=snap.exists()?snap.data():null;}
            const stage=a?.status==='submitted'?'Qualifications awaiting review':a?.status==='approved'?(Number.isInteger(a.revision)&&a.revision>0&&a.revision===p?.teacherVerifiedRevision?'Approved qualifications - awaiting activation':'Approval needs recheck'):a?.status==='needs_changes'?'Changes requested':a?.status==='declined'?'Application declined':!a||a.status==='draft'?'Application not submitted':'Application status unavailable';
            return{...a,id,firstName:a?.legalName||[p?.firstName,p?.lastName].filter(Boolean).join(' '),lastName:'',email:a?.email||p?.email||'',status:a?.status||'not_submitted',applicationStage:stage};
        }));s.check();
        return{rows,hasNext:ids.length>25||submitted.size>25||pending.size>25,cursor:page.at(-1)||null};
    }
    const snapshot=await getDocsFromServer(query(collection(db,'teacherApplications'),where('status',statuses.length===1?'==':'in',statuses.length===1?statuses[0]:statuses),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
    const page=snapshot.docs.slice(0,25);
    const rows=await Promise.all(page.map(async d=>{const application=d.data();let profile=null;if(!application.legalName||!application.email){const snapshot=await getDocFromServer(doc(db,'users',d.id));s.check();profile=snapshot.exists()?snapshot.data():null;}return{...application,id:d.id,firstName:application.legalName||[profile?.firstName,profile?.lastName].filter(Boolean).join(' '),lastName:'',email:application.email||profile?.email||''};}));s.check();
    return{rows,hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null};
}
export async function loadAdminHistory(uid,cursor=null) {
    targetRef(uid);const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(query(collection(db,'accountModeration'),where('userId','==',uid),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
    const page=snapshot.docs.slice(0,25);
    return {rows:page.map(d=>({...d.data(),id:d.id})),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null};
}
export async function loadAdminOverview() {
    const s=session();await administrator(s);
    const [applications,decisions,pendingTeachers]=await Promise.all([
        getDocsFromServer(query(collection(db,'teacherApplications'),where('status','==','submitted'),orderBy(documentId()),limit(26))),
        getDocsFromServer(query(collection(db,'accountModeration'),where('actorId','==',s.user.uid),orderBy(documentId()),limit(11))),
        getDocsFromServer(query(collection(db,'users'),where('role','==','teacher'),where('status','==','pending'),orderBy(documentId()),limit(26)))
    ]);s.check();
    const submitted=applications.docs.slice(0,25).map(d=>({...d.data(),id:d.id}));
    const applicationMap=new Map(submitted.map(a=>[a.id,a]));
    const profiles=pendingTeachers.docs.slice(0,25).map(d=>({...d.data(),id:d.id}));
    await Promise.all(profiles.filter(p=>!applicationMap.has(p.id)).map(async p=>{const a=await getDocFromServer(doc(db,'teacherApplications',p.id));s.check();applicationMap.set(p.id,a.exists()?{...a.data(),id:a.id}:null);}));s.check();
    const teacherQueue=profiles.map(p=>{
        const a=applicationMap.get(p.id),status=a?.status;
        const stage=status==='submitted'?'Qualifications awaiting review':status==='approved'?(Number.isInteger(a.revision)&&a.revision>0&&a.revision===p.teacherVerifiedRevision?'Approved — awaiting activation':'Approval needs recheck'):status==='needs_changes'?'Changes requested':status==='declined'?'Application declined':!a||status==='draft'?'Application not submitted':'Application status unavailable';
        return{id:p.id,legalName:a?.legalName||[p.firstName,p.lastName].filter(Boolean).join(' '),email:p.email||a?.email||'',stage,reviewApplication:status==='submitted'};
    });
    const seen=new Set(teacherQueue.map(p=>p.id));
    for(const a of submitted)if(!seen.has(a.id)){teacherQueue.push({...a,stage:'Qualifications awaiting review',reviewApplication:true});seen.add(a.id);}
    return {applications:applications.docs.slice(0,25).map(d=>({...d.data(),id:d.id})),moreApplications:applications.size>25,
        teacherQueue,moreTeacherQueue:pendingTeachers.size>25||applications.size>25,pendingTeacherCount:profiles.length,morePendingTeachers:pendingTeachers.size>25,
        decisions:decisions.docs.slice(0,10).map(d=>({...d.data(),id:d.id})),moreDecisions:decisions.size>10};
}
export async function moderateAccount({uid,expectedStatus,expectedRole,expectedVersion,status,reason,identityVerified=false}) {
    const s=session();await administrator(s);
    if(uid===s.user.uid)throw Error('You cannot change your own access.');
    const ref=targetRef(uid),event=doc(collection(db,'accountModeration'));
    await executeAdminDecision(()=>runTransaction(db,async tx=>{
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
    }),async()=>{s.check();await administrator(s);const result=await getDocFromServer(event);s.check();return result;},{userId:uid,actorId:s.user.uid,previousStatus:expectedStatus,status,reason:String(reason||'').trim(),identityVerified:identityVerified===true});s.check();
}
