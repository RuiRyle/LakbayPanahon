import {auth,db} from './firebase-config.js';
import {executeAdminDecision} from './admin-decision-recovery.js';
import {doc,collection,query,where,orderBy,documentId,limit,startAfter,getDocFromServer,getDocsFromServer,onSnapshot,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

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
    if(!['all','teacher','student'].includes(role)||!['all','pending','active','inactive'].includes(status))throw Error('Choose a valid account filter.');
    const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(query(collection(db,'users'),where('role',role==='all'?'in':'==',role==='all'?['teacher','student']:role),...(status==='all'?[]:[where('status','==',status)]),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26)));s.check();
    const page=snapshot.docs.slice(0,25);
    return {rows:page.map(d=>({...d.data(),id:d.id})),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null};
}
export async function loadAdminAccount(uid) {
    const s=session();await administrator(s);
    const profile=await getDocFromServer(targetRef(uid));s.check();
    if(!profile.exists())throw Error('This account is unavailable. Refresh the list.');
    return {profile:{...profile.data(),id:profile.id}};
}
function applicationSummary(id, application, profile, stage) {
    return {
        ...application, id, firstName: application?.legalName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' '),
        lastName: '', email: application?.email || profile?.email || '', status: application?.status || 'not_submitted',
        applicationStage: stage
    };
}
function needsActivation(application, profile) {
    return profile?.status === 'pending' && application?.status === 'approved' && application.emailVerified === true &&
        Number.isInteger(application.revision) && application.revision > 0 && application.revision === profile.teacherVerifiedRevision;
}
const applicationStatuses={review:['submitted'],ready:['submitted'],email:['submitted'],revision:['needs_changes'],reviewed:['approved','declined']};
function applicationQueueQuery(group,cursor){
    const profiles=['activation','awaiting'].includes(group);
    const statuses=applicationStatuses[group];
    const source=collection(db,profiles?'users':'teacherApplications');
    const filters=profiles?[where('role','==','teacher'),where('status','==','pending')]
        :[where('status',statuses.length===1?'==':'in',statuses.length===1?statuses[0]:statuses)];
    return query(source,...filters,orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(26));
}
function applicationQueueVersion(snapshot){
    return JSON.stringify(snapshot.docs.map(entry=>{
        const row=entry.data();
        return [entry.id,row.status,row.revision,row.emailVerified,row.teacherVerifiedRevision,row.updatedAt?.toMillis?.()];
    }));
}
async function loadApplicationWorkPage(s, group, cursor) {
    const activation = group === 'activation';
    const snapshot = await getDocsFromServer(applicationQueueQuery(group,cursor));
    s.check();
    const page = snapshot.docs.slice(0,25);
    const rows = await Promise.all(page.map(async entry => {
        if (activation) {
            const profile = entry.data();
            const result = await getDocFromServer(doc(db,'teacherApplications',entry.id));
            s.check();
            const application = result.exists() ? result.data() : null;
            return needsActivation(application,profile) ? applicationSummary(entry.id,application,profile,'Approved · activation incomplete') : null;
        }
        const application = entry.data(), verified = application.emailVerified === true;
        if (verified !== (group === 'ready')) return null;
        let profile;
        if (!application.legalName || !application.email) {
            const result = await getDocFromServer(targetRef(entry.id));
            s.check();
            profile = result.exists() ? result.data() : null;
        }
        return applicationSummary(entry.id,application,profile,verified?'Ready for review':'Waiting for email verification');
    }));
    s.check();
    return {rows:rows.filter(Boolean),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null,sourcePageCount:page.length,sourceVersion:applicationQueueVersion(snapshot)};
}
export async function loadSubmittedTeacherApplications(cursor=null,group='pending'){
    const statuses={pending:['submitted'],review:['submitted'],ready:[],email:[],activation:[],awaiting:[],revision:['needs_changes'],reviewed:['approved','declined']}[group];
    if(!statuses)throw Error('Choose a valid application status.');
    const s=session();await administrator(s);
    if(['ready','email','activation'].includes(group))return loadApplicationWorkPage(s,group,cursor);
    if(group==='awaiting'){
        const snapshot=await getDocsFromServer(applicationQueueQuery(group,cursor));s.check();
        const page=snapshot.docs.slice(0,25);
        const checked=await Promise.all(page.map(async d=>{const profile=d.data(),form=await getDocFromServer(doc(db,'teacherApplications',d.id));s.check();const application=form.exists()?form.data():null;if(application&&!['draft'].includes(application.status))return null;return{...application,id:d.id,firstName:application?.legalName||[profile.firstName,profile.lastName].filter(Boolean).join(' '),lastName:'',email:application?.email||profile.email||'',status:application?.status||'not_submitted',applicationStage:application?'Draft - not submitted':'Application not submitted'};}));s.check();
        return{rows:checked.filter(Boolean),hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null,sourcePageCount:page.length,sourceVersion:applicationQueueVersion(snapshot)};
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
    const snapshot=await getDocsFromServer(applicationQueueQuery(group,cursor));s.check();
    const page=snapshot.docs.slice(0,25);
    const rows=await Promise.all(page.map(async d=>{const application=d.data();let profile=null;if(!application.legalName||!application.email){const snapshot=await getDocFromServer(doc(db,'users',d.id));s.check();profile=snapshot.exists()?snapshot.data():null;}return{...application,id:d.id,firstName:application.legalName||[profile?.firstName,profile?.lastName].filter(Boolean).join(' '),lastName:'',email:application.email||profile?.email||''};}));s.check();
    return{rows,hasNext:snapshot.size>25,cursor:page.at(-1)?.id||null,sourceVersion:applicationQueueVersion(snapshot)};
}
export async function loadAdminHistory(uid,cursor=null) {
    targetRef(uid);const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(accountHistoryQuery(uid,cursor));s.check();
    return historyPage(snapshot);
}
function accountHistoryQuery(uid,cursor=null) {
    return query(collection(db,'accountModeration'),where('userId','==',uid),orderBy('createdAt','desc'),orderBy(documentId(),'desc'),...(cursor?[startAfter(cursor)]:[]),limit(26));
}
function historyPage(snapshot) {
    const page=snapshot.docs.slice(0,25);
    return {rows:page.map(d=>({...d.data(),id:d.id})),hasNext:snapshot.size>25,cursor:page.at(-1)||null};
}
function recentDecisionQuery(uid) {
    return query(collection(db,'accountModeration'),where('actorId','==',uid),orderBy('createdAt','desc'),orderBy(documentId(),'desc'),limit(11));
}
function savedDecisions(snapshot) {
    return {decisions:snapshot.docs.slice(0,10).map(d=>({...d.data(),id:d.id})),moreDecisions:snapshot.size>10};
}
export async function loadAdminRecentDecisions() {
    const s=session();await administrator(s);
    const snapshot=await getDocsFromServer(recentDecisionQuery(s.user.uid));s.check();
    return savedDecisions(snapshot);
}
function watchAdminAudit(makeQuery,format,{onRecords,onConnection,onError}) {
    const s=session();
    let stopped=false;
    let unsubscribe;
    const current=()=>!stopped&&auth.currentUser===s.user;
    const fail=error=>{if(current())onError(error);};
    administrator(s).then(()=>{
        if(!current())return;
        unsubscribe=onSnapshot(makeQuery(s.user.uid),{includeMetadataChanges:true},snapshot=>{
            if(!current())return;
            onConnection(!snapshot.metadata.fromCache);
            if(!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites)onRecords(format(snapshot));
        },fail);
    }).catch(fail);
    return ()=>{stopped=true;unsubscribe?.();};
}
export function watchAdminRecentDecisions(callbacks) {
    return watchAdminAudit(recentDecisionQuery,savedDecisions,callbacks);
}
export function watchAdminAccountHistory(uid,callbacks) {
    targetRef(uid);
    return watchAdminAudit(()=>accountHistoryQuery(uid),historyPage,callbacks);
}
export function watchAdminApplicationQueue(group,cursor,onChange,onError) {
    return watchAdminAudit(()=>applicationQueueQuery(group,cursor),applicationQueueVersion,{onRecords:onChange,onConnection:()=>{},onError});
}
export async function loadAdminOverview() {
    const s=session();await administrator(s);
    const [applications,decisions,pendingTeachers]=await Promise.all([
        getDocsFromServer(query(collection(db,'teacherApplications'),where('status','==','submitted'),orderBy(documentId()),limit(26))),
        getDocsFromServer(recentDecisionQuery(s.user.uid)),
        getDocsFromServer(query(collection(db,'users'),where('role','==','teacher'),where('status','==','pending'),orderBy(documentId()),limit(26)))
    ]);s.check();
    const submitted=applications.docs.slice(0,25).map(d=>({...d.data(),id:d.id}));
    const applicationMap=new Map(submitted.map(a=>[a.id,a]));
    const profiles=pendingTeachers.docs.slice(0,25).map(d=>({...d.data(),id:d.id}));
    await Promise.all(profiles.filter(p=>!applicationMap.has(p.id)).map(async p=>{const a=await getDocFromServer(doc(db,'teacherApplications',p.id));s.check();applicationMap.set(p.id,a.exists()?{...a.data(),id:a.id}:null);}));s.check();
    const workQueue = {
        ready: {count:submitted.filter(application=>application.emailVerified===true).length, more:applications.size>25},
        email: {count:submitted.filter(application=>application.emailVerified!==true).length, more:applications.size>25},
        activation: {count:profiles.filter(profile=>needsActivation(applicationMap.get(profile.id),profile)).length, more:pendingTeachers.size>25}
    };
    const teacherQueue=profiles.map(p=>{
        const a=applicationMap.get(p.id),status=a?.status;
        const workGroup=status==='submitted'?(a.emailVerified===true?'ready':'email'):needsActivation(a,p)?'activation':null;
        const stage=workGroup==='ready'?'Ready for review':workGroup==='email'?'Waiting for email verification':workGroup==='activation'?'Approved — awaiting activation':status==='approved'?'Approval needs recheck':status==='needs_changes'?'Changes requested':status==='declined'?'Application declined':!a||status==='draft'?'Application not submitted':'Application status unavailable';
        return{id:p.id,legalName:a?.legalName||[p.firstName,p.lastName].filter(Boolean).join(' '),email:p.email||a?.email||'',stage,workGroup,reviewApplication:status==='submitted'};
    });
    const seen=new Set(teacherQueue.map(p=>p.id));
    for(const a of submitted)if(!seen.has(a.id)){teacherQueue.push({...a,stage:a.emailVerified===true?'Ready for review':'Waiting for email verification',workGroup:a.emailVerified===true?'ready':'email',reviewApplication:true});seen.add(a.id);}
    return {applications:submitted,moreApplications:applications.size>25,workQueue,
        teacherQueue,moreTeacherQueue:pendingTeachers.size>25||applications.size>25,pendingTeacherCount:profiles.length,morePendingTeachers:pendingTeachers.size>25,
        ...savedDecisions(decisions)};
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
        if(current.status!==expectedStatus||current.role!==expectedRole||version!==expectedVersion)throw Object.assign(Error('This account changed while you were reviewing it. Refresh before deciding.'),{code:'admin/stale-account'});
        const details=moderationDetails(current,status,reason,identityVerified);
        if(current.role==='teacher'&&status==='active'){
            const application=await tx.get(doc(db,'teacherApplications',uid));s.check();
            if(!application.exists()||application.data().status!=='approved'||application.data().revision!==current.teacherVerifiedRevision)throw Error('Review and approve the submitted qualification application first. A checkbox alone cannot grant classroom access.');
        }
        tx.update(ref,{status:details.status,updatedAt:serverTimestamp(),moderatedAt:serverTimestamp(),moderatedBy:s.user.uid,moderationEventId:event.id});
        tx.set(event,{userId:uid,actorId:s.user.uid,previousStatus:current.status,...details,createdAt:serverTimestamp()});
    }),async()=>{s.check();await administrator(s);const result=await getDocFromServer(event);s.check();return result;},{userId:uid,actorId:s.user.uid,previousStatus:expectedStatus,status,reason:String(reason||'').trim(),identityVerified:identityVerified===true});s.check();
}
// Pair an account audit with its immutable qualification review, never infer a review outcome from account status.
export async function loadAdminDecisionReview(record){
    const s=session();await administrator(s);
    return readAdminDecisionReview(s,record);
}
async function readAdminDecisionReview(s,record) {
    if(!record||typeof record.id!=='string'||!record.id||record.id.includes('/'))throw Error('Invalid decision record.');
    targetRef(record.userId);
    const snapshot=await getDocFromServer(doc(db,'teacherApplicationReviews',record.id));s.check();
    if(!snapshot.exists())return null;
    const review=snapshot.data();
    if(review.userId!==record.userId||review.actorId!==record.actorId||review.reason!==record.reason||!['approved','declined','needs_changes'].includes(review.decision)||!Number.isInteger(review.revision)||review.revision<1)throw Error('Qualification audit does not match this account decision. Inspect its saved history.');
    return {decision:review.decision,revision:review.revision};
}
export async function loadAdminDecisionDetails(userIds,records) {
    const s=session();await administrator(s);
    const [profiles,reviews]=await Promise.all([
        Promise.all(userIds.map(async uid=>{
            try {
                const snapshot=await getDocFromServer(targetRef(uid));s.check();
                return [uid,snapshot.exists()?snapshot.data():null];
            } catch {return [uid,null];}
        })),
        Promise.all(records.map(async record=>{
            try {return [record.id,await readAdminDecisionReview(s,record)];}
            catch {return [record.id,null];}
        }))
    ]);
    s.check();
    return {profiles,reviews};
}
