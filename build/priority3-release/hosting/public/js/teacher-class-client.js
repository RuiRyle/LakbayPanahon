import {auth, db} from './firebase-config.js';
import {doc, collection, query, where, orderBy, documentId, startAfter, limit, getDocsFromServer, getDocFromServer, runTransaction, serverTimestamp, Timestamp, setDoc, updateDoc,writeBatch} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {classDetails, invitationCode, publishedDetails, assignmentDueMillis,reviewEvidence,publicationVersion,assignmentProgressState,reviewLearningStages,activeReviewDuplicates,reviewInterventionSummary} from './teacher-class-policy.js';
import {buildJourneyPath,assignmentReadiness} from './journey-path.js';

function session() {
    const user = auth.currentUser;
    if (!user) throw Error('Sign in to manage your classes.');
    return {user, check() { if (auth.currentUser !== user) throw Error('Your session changed. Sign in again.'); }};
}
async function approved(s) {
    const [snapshot,application] = await Promise.all([getDocFromServer(doc(db,'users',s.user.uid)),getDocFromServer(doc(db,'teacherApplications',s.user.uid))]);
    s.check();
    if (!snapshot.exists() || snapshot.data().role !== 'teacher' || snapshot.data().status !== 'active') throw Error('An approved teacher account is required.');
    if(s.user.emailVerified!==true||!application.exists()||application.data().status!=='approved'||application.data().revision!==snapshot.data().teacherVerifiedRevision)throw Error('Complete your verified-email teacher application before opening classroom tools.');
    return snapshot.data();
}
function refFor(name, id) {
    if (typeof id !== 'string' || !id || id.includes('/')) throw Error('Invalid record.');
    return doc(db, name, id);
}
async function owned(s, classId, active = true) {
    await approved(s);
    const snapshot = await getDocFromServer(refFor('classes', classId));
    s.check();
    if (!snapshot.exists() || snapshot.data().teacherId !== s.user.uid) throw Error('This class is unavailable.');
    if (active && snapshot.data().status !== 'active') throw Error('Restore this class before making changes.');
    return {id: snapshot.id, ...snapshot.data()};
}
async function list(s, name, filters) {
    const rows = [];
    let cursor;
    do {
        const batch = await getDocsFromServer(query(collection(db, name), ...filters, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(100)));
        s.check();
        rows.push(...batch.docs.map(d => ({...d.data(), id: d.id})));
        if (rows.length > 5000) throw Error('This view is too large to load safely. No partial report is shown.');
        if (batch.size < 100) return rows;
        cursor = batch.docs.at(-1);
    } while (true);
}
export async function loadTeacherClasses() {
    const s = session(); await approved(s);
    return list(s, 'classes', [where('teacherId', '==', s.user.uid)]);
}
export async function loadTeacherDashboard(classIds){
    if(!Array.isArray(classIds)||classIds.length>6||new Set(classIds).size!==classIds.length)throw Error('Load up to six classes in the dashboard.');
    const s=session();await approved(s);const results=[];
    for(let offset=0;offset<classIds.length;offset+=2){
        const group=await Promise.allSettled(classIds.slice(offset,offset+2).map(async classId=>{
            const classroom=await getDocFromServer(refFor('classes',classId));s.check();
            if(!classroom.exists()||classroom.data().teacherId!==s.user.uid||classroom.data().status!=='active')throw Error('Class unavailable.');
            const kinds=['classMembers','classAssignments','classReviewAssignments','classAnnouncements','classHelpRequests','classReviewReflections','classmates'];
            const snapshots=await Promise.allSettled(kinds.map(name=>getDocsFromServer(query(name==='classmates'?collection(db,'classes',classId,'classmates'):collection(db,name),...(name==='classmates'?[]:[where('classId','==',classId)]),...(name==='classMembers'?[where('status','==','active')]:[]),orderBy(documentId()),limit(101)))));s.check();
            return {classId,collections:Object.fromEntries(kinds.map((name,index)=>{const result=snapshots[index];return [name,result.status==='fulfilled'?{rows:result.value.docs.slice(0,100).map(d=>({...d.data(),id:d.id})),limited:result.value.size>100}:{rows:[],unavailable:true}];}))};
        }));s.check();group.forEach((result,index)=>results.push(result.status==='fulfilled'?result.value:{classId:classIds[offset+index],unavailable:true}));
    }
    return results;
}
export async function removeTeacherClassMember(classId,userId) {
    const s=session();await owned(s,classId);
    const reference=refFor('classMembers',userId+'_'+classId);
    await runTransaction(db,async tx=>{
        const snapshot=await tx.get(reference);s.check();
        if(!snapshot.exists()||snapshot.data().classId!==classId||snapshot.data().userId!==userId||snapshot.data().status!=='active')throw Error('This student is no longer an active member. Refresh the class.');
        tx.delete(reference);
        tx.delete(doc(db,'classes',classId,'classmates',userId));
    });s.check();
}
export async function createTeacherClass(name, description) {
    const values = classDetails(name, description), s = session(), profile = await approved(s);
    const ref = doc(collection(db, 'classes'));
    const title=profile.teacherAccessType==='student_teacher'?'Student teacher':profile.teacherAccessType==='facilitator'?'Facilitator':'Teacher';
    await setDoc(ref, {...values, teacherId: s.user.uid, teacherName: (title+' '+[profile.firstName, profile.lastName].filter(Boolean).join(' ')).slice(0, 200), status: 'active', currentJoinCode: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp()});
    s.check(); return ref.id;
}
export async function editTeacherClass(classId, name, description) {
    const values = classDetails(name, description), s = session(); await owned(s, classId);
    await updateDoc(refFor('classes', classId), {...values, updatedAt: serverTimestamp()}); s.check();
}
export async function setTeacherClassStatus(classId, status) {
    if (!['active', 'archived'].includes(status)) throw Error('Invalid class status.');
    const s = session(); await owned(s, classId, false);
    await updateDoc(refFor('classes', classId), {status, currentJoinCode: '', updatedAt: serverTimestamp()}); s.check();
}
export async function rotateTeacherCode(classId, revokeOnly = false) {
    const s = session(); await owned(s, classId);
    const code = revokeOnly ? '' : invitationCode();
    const result = await runTransaction(db, async tx => {
        s.check();
        const ref = refFor('classes', classId), snapshot = await tx.get(ref);
        if (!snapshot.exists() || snapshot.data().teacherId !== s.user.uid || snapshot.data().status !== 'active') throw Error('This class is unavailable.');
        if (code) {
            const collision = await tx.get(doc(db, 'classJoinCodes', code));
            if (collision.exists()) throw Error('Unable to reserve a code. Please try again.');
        }
        tx.update(ref, {currentJoinCode: code, updatedAt: serverTimestamp()});
        if (snapshot.data().currentJoinCode) tx.update(doc(db, 'classJoinCodes', snapshot.data().currentJoinCode), {status: 'revoked'});
        if (code) tx.set(doc(db, 'classJoinCodes', code), {classId, teacherId: s.user.uid, className:snapshot.data().name,teacherName:snapshot.data().teacherName,status: 'active', expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000), createdAt: serverTimestamp()});
        return code;
    });
    s.check(); return result;
}
export async function loadTeacherClass(classId) {
    const s = session(), ref=refFor('classes',classId);
    // Rules protect the class read independently; verify account and class
    // together instead of waiting through three sequential round trips.
    const [,snapshot]=await Promise.all([approved(s),getDocFromServer(ref)]);s.check();
    if(!snapshot.exists()||snapshot.data().teacherId!==s.user.uid)throw Error('This class is unavailable.');
    const classroom={id:snapshot.id,...snapshot.data()};
    const [members, announcements, goals, reviews] = await Promise.all([
        list(s, 'classMembers', [where('classId', '==', classId), where('status', '==', 'active')]),
        list(s, 'classAnnouncements', [where('classId', '==', classId)]),
        list(s, 'classAssignments', [where('classId', '==', classId)]),
        list(s, 'classReviewAssignments', [where('classId', '==', classId)])
    ]);
    let invitation = null;
    if (classroom.currentJoinCode) {
        const snapshot = await getDocFromServer(doc(db, 'classJoinCodes', classroom.currentJoinCode)); s.check();
        if (snapshot.exists()) invitation = snapshot.data();
    }
    return {classroom, members, announcements, assignments:[...goals,...reviews.map(a=>({...a,assignmentType:'targeted-review'}))], invitation};
}
export async function loadTeacherClassRoster(classId){
    const s=session(),classroom=await owned(s,classId);
    const members=await list(s,'classMembers',[where('classId','==',classId),where('status','==','active')]);s.check();
    return {classroom,members};
}
export async function loadTeacherStudent(classId,userId){
    const s=session();await owned(s,classId);return readTeacherStudent(s,classId,userId);
}
export async function loadTeacherStudentBatch(classId,userIds){
    if(!Array.isArray(userIds)||userIds.length>20||new Set(userIds).size!==userIds.length)throw Error('Load up to 20 distinct students at a time.');
    const s=session();await owned(s,classId);const results=[];
    for(let offset=0;offset<userIds.length;offset+=3){results.push(...await Promise.allSettled(userIds.slice(offset,offset+3).map(userId=>readTeacherStudent(s,classId,userId))));s.check();}
    return results;
}
async function readTeacherStudent(s,classId,userId){
    const member = await getDocFromServer(refFor('classMembers', userId + '_' + classId)); s.check();
    if (!member.exists() || member.data().userId !== userId || member.data().classId !== classId || member.data().status !== 'active') throw Error('This student is no longer an active member.');
    // Rules recheck ownership and membership on EVERY subsequent report read.
    await setDoc(doc(db, 'teacherStudentLinks', s.user.uid + '_' + userId), {teacherId: s.user.uid, userId, classId}); s.check();
    const [profile, progress, attempts] = await Promise.all([
        getDocFromServer(refFor('users', userId)),
        list(s, 'studentProgress', [where('userId', '==', userId)]),
        list(s, 'studentQuizAttempts', [where('userId', '==', userId)])
    ]);
    s.check();
    return {userId, profile: profile.exists() ? profile.data() : null, progress, attempts};
}
export async function loadTeacherRosterNames(classId, userIds) {
    if (!Array.isArray(userIds) || userIds.length > 20) throw Error('Load up to 20 students at a time.');
    const s = session(); await owned(s, classId);
    const result = [];
    for (let offset = 0; offset < userIds.length; offset += 5) {
        const batch = await Promise.allSettled(userIds.slice(offset, offset + 5).map(async userId => {
            await setDoc(refFor('teacherStudentLinks', s.user.uid + '_' + userId), {teacherId:s.user.uid, userId, classId}); s.check();
            const profile = await getDocFromServer(refFor('users', userId)); s.check();
            if (!profile.exists()) throw Error('Profile unavailable.');
            return {userId, name:[profile.data().firstName,profile.data().lastName].filter(Boolean).join(' ')};
        }));
        s.check();
        batch.forEach((item, i) => result.push(item.status === 'fulfilled' ? item.value : {userId:userIds[offset+i],unavailable:true}));
    }
    return result;
}
export async function loadTeacherMissions({includeReviewTopics=true}={}) {
    const s = session(); await approved(s);
    const [missions, chapters, scenes] = await Promise.all([
        list(s, 'missions', [where('status', '==', 'active')]),
        list(s, 'chapters', [where('status', '==', 'active')]),
        includeReviewTopics?list(s, 'storyScenes', [where('status', '==', 'active')]):[]
    ]);
    s.check();
    return missions.map(mission => {
        const chapter = chapters.find(item => item.id === mission.chapterId);
        // Display metadata only; assignment writes still use the existing fields.
        const topics=new Map();for(const scene of scenes.filter(scene=>scene.missionId===mission.id))for(const topic of (Array.isArray(scene.reviewTopics)?scene.reviewTopics:[]))if(typeof topic==='string'&&topic.trim()&&!topics.has(topic))topics.set(topic,{key:topic,sceneId:scene.id,label:topic.replace(/[-_]+/g,' ')});
        return {...mission, chapterTitle: chapter?.title || '', chapterOrder: chapter?.order ?? null,reviewTopics:[...topics.values()]};
    });
}
export async function loadTeacherAssignmentProgress(classId, missionId, userIds) {
    const assignment=typeof missionId==='object'?missionId:null;missionId=assignment?.missionId||missionId;
    if (!Array.isArray(userIds) || userIds.length > 20 || new Set(userIds).size !== userIds.length) throw Error('Load up to 20 students at a time.');
    const s = session(); await owned(s, classId);
    const results = [];
    for (let offset = 0; offset < userIds.length; offset += 5) {
        const ids = userIds.slice(offset, offset + 5);
        const batch = await Promise.allSettled(ids.map(async userId => {
            const member = await getDocFromServer(refFor('classMembers', userId + '_' + classId)); s.check();
            if (!member.exists() || member.data().userId !== userId || member.data().classId !== classId || member.data().status !== 'active') throw Error('Membership changed.');
            await setDoc(refFor('teacherStudentLinks', s.user.uid + '_' + userId), {teacherId:s.user.uid, userId, classId}); s.check();
            if(assignment?.assignmentType==='targeted-review'){
                if(assignment.userId!==userId)throw Error('This review belongs to another student.');
                const requested=!!assignment.reflectionQuestion;
                const reflectionRead=requested&&assignment.id?getDocsFromServer(query(collection(db,'classReviewReflections'),where('classId','==',classId),where(documentId(),'==',assignment.id),limit(1))).then(snapshot=>{const row=snapshot.docs[0]?.data()||null;return {row,available:!row||(row.userId===userId&&row.reviewId===assignment.id)};},()=>({row:null,available:false})):Promise.resolve({row:null,available:!requested});
                const [attempts,reflection]=await Promise.all([list(s,'studentQuizAttempts',[where('userId','==',userId)]),reflectionRead]);s.check();
                const evidence=reviewEvidence(assignment,attempts,userId),stages=reviewLearningStages(evidence,reflection.row,{requested,reflectionAvailable:reflection.available});
                const responseTime=reflection.row?.respondedAt?.toMillis?.(),assignedTime=assignment.assignedAt?.toMillis?.();
                const followup=stages.guidance==='sent'&&Number.isFinite(responseTime)&&responseTime>=assignedTime&&responseTime<=Date.now()?reviewEvidence({...assignment,assignedAt:reflection.row.respondedAt},attempts,userId):null;
                const intervention=reviewInterventionSummary(evidence,stages,followup);
                return {userId,progress:{...evidence,chapterId:assignment.chapterId,missionId,reviewEvidence:evidence,reviewStages:stages,reviewIntervention:intervention},unavailable:evidence.unavailable};
            }
            // An empty owner-filtered query is authorized; getting a missing
            // completion cannot establish resource.data.userId in teacher rules.
            const progress = await list(s, 'studentProgress', [where('userId', '==', userId)]); s.check();
            const data = progress.find(record => record.missionId === missionId) || null;
            if (data && (data.userId !== userId || data.missionId !== missionId)) throw Error('Progress context changed.');
            if(assignment&&['closed','withdrawn'].includes(assignment.status)){const state=assignmentProgressState(data,assignment);return {userId,progress:data?{...data,completed:state.status==='completed'}:null,unavailable:state.status==='unavailable'};}
            return {userId, progress:data};
        }));
        s.check();
        batch.forEach((item, index) => results.push(item.status === 'fulfilled' ? item.value : {userId:ids[index], unavailable:true}));
    }
    return results;
}
export function newTeacherPublicationId(){return doc(collection(db,'classAssignments')).id;}
function reviewPublishError(message){return Object.assign(Error(message),{code:'failed-precondition'});}
async function prepareReviewPublication(s,classId,fields,userIds,excludedIds,confirmNewRound){
    const ref=refFor('classReviewPublicationState',classId);
    let state,existing;
    try{state=await getDocFromServer(ref);existing=fields.status==='published'?await list(s,'classReviewAssignments',[where('classId','==',classId)]):[];}catch(error){throw reviewPublishError('Could not check existing reviews. Nothing was submitted. Check the connection and try again.');}
    s.check();
    const duplicates=fields.status==='published'?activeReviewDuplicates(existing,classId,fields.missionId,userIds,excludedIds):[];
    if(duplicates.length&&!(typeof confirmNewRound==='function'&&await confirmNewRound(duplicates)))throw reviewPublishError('No new reviews were submitted. Open the existing review, or confirm a new round. Your instructions are preserved.');
    return {ref,version:state.exists()?state.data().revision:0};
}
async function checkReviewPublication(tx,prepared){
    const current=await tx.get(prepared.ref),revision=current.exists()?current.data().revision:0;
    if(revision!==prepared.version)throw reviewPublishError('Reviews changed in another tab or device. Nothing was submitted. Check the latest reviews and submit again to confirm your choice.');
}
function advanceReviewPublication(tx,prepared,classId){tx.set(prepared.ref,{classId,revision:prepared.version+1,updatedAt:serverTimestamp()});}
export async function saveTeacherPublication(classId, kind, values, id = null, creationId = null, confirmNewRound = null) {
    if (!['announcement', 'assignment'].includes(kind)) throw Error('Invalid classroom item.');
    const fields = publishedDetails(kind, values), s = session(); await owned(s, classId);
    if (kind === 'assignment') {
        if (Object.hasOwn(values,'dueDate')) {
            const deadline = assignmentDueMillis(values.dueDate);
            if (deadline !== null) fields.dueAt = Timestamp.fromMillis(deadline);
        } else if (values.dueAt?.toMillis) fields.dueAt = values.dueAt;
    }
    const review=kind==='assignment'&&values.assignmentType==='targeted-review';
    if(review){fields.assignmentType='targeted-review';fields.userId=values.userId;refFor('users',values.userId);Object.assign(fields,reviewTeachingFields(values));}
    const name = kind === 'announcement' ? 'classAnnouncements' : review?'classReviewAssignments':'classAssignments';
    const ref = id ? refFor(name, id) : creationId?refFor(name,creationId):doc(collection(db, name));
    let prepared=null;
    if(review){
        const old=id?await getDocFromServer(ref):null;s.check();
        // Published edits do not start a new round, but still advance the class revision.
        const checking=old?.exists()&&old.data().status==='published'?{...fields,status:'draft'}:fields;
        prepared=await prepareReviewPublication(s,classId,checking,[values.userId],[ref.id],confirmNewRound);
    }
    await runTransaction(db, async tx => {
        if(prepared)await checkReviewPublication(tx,prepared);
        let previous=null;
        if (id) {
            const old = await tx.get(ref); s.check();
            if (!old.exists() || old.data().classId !== classId) throw Error('This classroom item is unavailable.');
            previous=old.data();
            if(typeof values.expectedVersion!=='string'||publicationVersion(previous)!==values.expectedVersion)throw Object.assign(Error('This item changed after you opened it. Your edits are kept. Copy any text you need, cancel editing, refresh the saved list, and reopen the latest item before saving.'),{code:'failed-precondition'});
        }
        const ending=kind==='assignment'&&['closed','withdrawn'].includes(fields.status);
        if(kind==='assignment'&&(previous&&['closed','withdrawn'].includes(previous.status)||ending&&(!previous||previous.status!=='published')))throw Object.assign(Error('Only a published activity can be ended. Ended activities stay read-only; create a new activity to assign it again.'),{code:'failed-precondition'});
        if(ending)fields.endedAt=serverTimestamp();
        if(review){if(previous&&(previous.userId!==values.userId||previous.missionId!==fields.missionId||previous.chapterId!==fields.chapterId))throw Error('Create a new review to change its student or mission.');fields.assignedAt=previous?.assignedAt||(fields.status==='published'?serverTimestamp():null);}
        if(prepared)advanceReviewPublication(tx,prepared,classId);
        tx.set(ref, {...fields, classId, publishedAt: serverTimestamp(), updatedAt: serverTimestamp()});
    });
    s.check(); return ref.id;
}
export async function createTeacherReviews(classId,values,userIds,recordIds=null,confirmNewRound=null){
    if(!Array.isArray(userIds)||!userIds.length||userIds.length>10||new Set(userIds).size!==userIds.length)throw Error('Choose 1 to 10 students for this review.');
    if(recordIds&&(userIds.some(userId=>typeof recordIds[userId]!=='string'||!recordIds[userId]||recordIds[userId].includes('/'))||new Set(userIds.map(userId=>recordIds[userId])).size!==userIds.length))throw Error('Invalid review request IDs.');
    const s=session();await owned(s,classId);const fields={...publishedDetails('assignment',values),...reviewTeachingFields(values)},deadline=assignmentDueMillis(values.dueDate);
    if(deadline!==null)fields.dueAt=Timestamp.fromMillis(deadline);
    const ids=recordIds||Object.fromEntries(userIds.map(userId=>[userId,doc(collection(db,'classReviewAssignments')).id]));
    const prepared=await prepareReviewPublication(s,classId,fields,userIds,Object.values(ids),confirmNewRound);
    await runTransaction(db,async tx=>{
        await checkReviewPublication(tx,prepared);
        const members=await Promise.all(userIds.map(userId=>tx.get(refFor('classMembers',userId+'_'+classId))));s.check();
        members.forEach((member,index)=>{if(!member.exists()||member.data().status!=='active'||member.data().userId!==userIds[index]||member.data().classId!==classId)throw reviewPublishError('A selected student is no longer in this class. Reload the student list.');});
        advanceReviewPublication(tx,prepared,classId);
        for(const userId of userIds)tx.set(refFor('classReviewAssignments',ids[userId]),{...fields,classId,userId,assignmentType:'targeted-review',assignedAt:fields.status==='published'?serverTimestamp():null,publishedAt:serverTimestamp(),updatedAt:serverTimestamp()});
    });s.check();
}
function reviewTeachingFields(values){
    const reviewTopic=String(values.reviewTopic||'').trim(),reviewSceneId=String(values.reviewSceneId||'').trim(),reflectionQuestion=String(values.reflectionQuestion||'').trim();
    if(reviewTopic.length>150||reviewSceneId.length>150||reflectionQuestion.length>500||reviewSceneId.includes('/'))throw Error('Check your topic and understanding prompt.');
    if(!!reviewTopic!==!!reviewSceneId)throw Error('Choose an available mapped review topic.');
    return {reviewTopic,reviewSceneId,reflectionQuestion};
}
export async function loadTeacherReadiness(classId,missionId,userIds){
    const s=session();await owned(s,classId);
    if(!Array.isArray(userIds)||userIds.length>20)throw Error('Check up to 20 students at a time.');
    const [eras,chapters,missions]=await Promise.all(['eras','chapters','missions'].map(name=>list(s,name,[where('status','==','active')])));s.check();
    const mission=missions.find(m=>m.id===missionId);if(!mission)throw Error('Mission unavailable.');const results=[];
    for(let offset=0;offset<userIds.length;offset+=5){const group=await Promise.allSettled(userIds.slice(offset,offset+5).map(async userId=>{const member=await getDocFromServer(refFor('classMembers',userId+'_'+classId));s.check();if(!member.exists()||member.data().userId!==userId||member.data().status!=='active')throw Error('Membership changed.');await setDoc(refFor('teacherStudentLinks',s.user.uid+'_'+userId),{teacherId:s.user.uid,userId,classId});s.check();const [profile,progress,chapterProgress,attempts]=await Promise.all([getDocFromServer(refFor('users',userId)),list(s,'studentProgress',[where('userId','==',userId)]),list(s,'studentChapterProgress',[where('userId','==',userId)]),list(s,'studentQuizAttempts',[where('userId','==',userId)])]);s.check();const report={profile:profile.exists()?profile.data():null,progress,attempts};const path=buildJourneyPath({userId,eras,chapters,missions,challenges:[],chapterProgress,missionProgress:report.progress}).flatMap(e=>e.chapters.flatMap(c=>c.missions));return {userId,name:[report.profile?.firstName,report.profile?.lastName].filter(Boolean).join(' ')||'Student',...assignmentReadiness(path,{missionId,chapterId:mission.chapterId}),latestScore:[...report.attempts].filter(a=>a.missionId===missionId&&a.chapterId===mission.chapterId).sort((a,b)=>(b.completedAt?.toMillis?.()||0)-(a.completedAt?.toMillis?.()||0))[0]?.score};}));group.forEach((r,i)=>results.push(r.status==='fulfilled'?r.value:{userId:userIds[offset+i],state:'unknown'}));s.check();}
    return results;
}
export async function loadTeacherFeedback(classId, userId) {
    const s = session(); await owned(s, classId);
    const membership = await getDocFromServer(refFor('classMembers', userId + '_' + classId)); s.check();
    if (!membership.exists() || membership.data().status !== 'active' || membership.data().userId !== userId) throw Error('This student is no longer an active member.');
    return list(s, 'classFeedback', [where('classId','==',classId),where('userId','==',userId),where('teacherId','==',s.user.uid)]);
}
export async function sendTeacherFeedback(classId, userId, missionId, body) {
    const message = String(body ?? '').trim();
    if (!message || message.length > 1500) throw Error('Write feedback using 1 to 1500 characters.');
    const s = session(); await owned(s, classId);
    refFor('users',userId); refFor('missions',missionId);
    const target = refFor('classFeedback',classId + '_' + userId + '_' + missionId);
    await runTransaction(db, async tx => {
        const [member, mission, previous] = await Promise.all([tx.get(refFor('classMembers',userId + '_' + classId)),tx.get(refFor('missions',missionId)),tx.get(target)]); s.check();
        if (!member.exists() || member.data().userId !== userId || member.data().status !== 'active') throw Error('This student is no longer an active member.');
        if (!mission.exists() || mission.data().status !== 'active') throw Error('Choose an available mission.');
        const old = previous.exists() ? previous.data() : null;
        if (old && (old.classId !== classId || old.userId !== userId || old.missionId !== missionId || old.teacherId !== s.user.uid)) throw Error('Feedback context changed. Refresh and try again.');
        tx.set(target,{classId,userId,teacherId:s.user.uid,missionId,chapterId:mission.data().chapterId,body:message,revision:(old?.revision || 0)+1,createdAt:old?.createdAt || serverTimestamp(),updatedAt:serverTimestamp(),readAt:null});
    }); s.check();
}
export async function loadTeacherSupportNotes(classId,userId) {
    const s=session();await owned(s,classId);
    const member=await getDocFromServer(refFor('classMembers',userId+'_'+classId));s.check();
    if(!member.exists()||member.data().userId!==userId||member.data().status!=='active')throw Error('This student is no longer an active member.');
    return list(s,'teacherSupportNotes',[where('classId','==',classId),where('userId','==',userId),where('teacherId','==',s.user.uid)]);
}
export async function saveTeacherSupportNote(classId,userId,missionId,status,note,expectedRevision) {
    const body=String(note??'').trim();
    if(!['planned','discussed'].includes(status)||!body||body.length>1500)throw Error('Choose a follow-up status and write a note using 1 to 1500 characters.');
    if(!Number.isInteger(expectedRevision)||expectedRevision<0)throw Error('Reload follow-up notes before saving.');
    const s=session();await owned(s,classId);refFor('users',userId);refFor('missions',missionId);
    const target=refFor('teacherSupportNotes',classId+'_'+userId+'_'+missionId);
    await runTransaction(db,async tx=>{
        const [member,mission,previous]=await Promise.all([tx.get(refFor('classMembers',userId+'_'+classId)),tx.get(refFor('missions',missionId)),tx.get(target)]);s.check();
        if(!member.exists()||member.data().userId!==userId||member.data().status!=='active')throw Error('This student is no longer an active member.');
        if(!mission.exists()||mission.data().status!=='active')throw Error('Choose an available mission.');
        const old=previous.exists()?previous.data():null;
        if(old&&(old.classId!==classId||old.userId!==userId||old.missionId!==missionId||old.teacherId!==s.user.uid))throw Error('Follow-up context changed.');
        if((old?.revision||0)!==expectedRevision)throw Error('This follow-up changed in another session. Reload notes before saving your changes.');
        tx.set(target,{classId,userId,teacherId:s.user.uid,missionId,chapterId:mission.data().chapterId,status,note:body,revision:expectedRevision+1,createdAt:old?.createdAt||serverTimestamp(),updatedAt:serverTimestamp(),statusAt:old?.status===status?old.statusAt:serverTimestamp()});
    });s.check();
}

export async function loadTeacherAccountSettings(){
    const s=session(),profile=await approved(s);
    const [application,avatarResult]=await Promise.all([getDocFromServer(refFor('teacherApplications',s.user.uid)),list(s,'avatars',[where('status','==','active')]).then(avatars=>({avatars}),()=>({avatars:[],avatarUnavailable:true}))]);s.check();
    return {profile,application:application.exists()?application.data():null,avatarUnavailable:!!avatarResult.avatarUnavailable,avatars:avatarResult.avatars.filter(a=>a.kind==='initials'||a.kind==='emoji'&&typeof a.icon==='string'&&a.icon.length<30)};
}
export async function saveTeacherAccountAvatar(avatarId){
    const s=session();await approved(s);const avatar=await getDocFromServer(refFor('avatars',avatarId));s.check();if(!avatar.exists()||avatar.data().status!=='active'||!['initials','emoji'].includes(avatar.data().kind))throw Error('Choose an available avatar.');
    await updateDoc(refFor('users',s.user.uid),{avatarId,updatedAt:serverTimestamp()});s.check();
}
