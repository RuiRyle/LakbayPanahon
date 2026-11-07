import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer,runTransaction,serverTimestamp,deleteDoc,writeBatch} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
export function normalizeClassCode(value){const code=String(value||'').replace(/[\s-]/g,'').toUpperCase();if(!/^[A-Z0-9]{12}$/.test(code))throw Error('Enter the 12-character code your teacher provided.');return code;}
export async function joinStudentClass(value, confirmClass) {
    const user=auth.currentUser;
    if(!user)throw Error('Sign in to join a class.');
    const current=()=>{
        if(auth.currentUser!==user||auth.currentUser?.uid!==user.uid)throw Error('Your session changed. Please sign in again.');
    };
    const unavailable=()=>Error('That class code is unavailable. Check the code with your teacher.');
    const code=normalizeClassCode(value),invite=await getDocFromServer(doc(db,'classJoinCodes',code));
    current();
    if(!invite.exists())throw unavailable();
    const data=invite.data();
    if(data.status!=='active'||typeof data.classId!=='string'||!data.classId||data.classId.includes('/'))throw unavailable();
    if(data.expiresAt!=null) {
        let expires;
        try { expires=data.expiresAt.toMillis(); } catch { throw unavailable(); }
        if(!Number.isFinite(expires)||expires<=Date.now())throw unavailable();
    }
    if(confirmClass && !await confirmClass({classId:data.classId,className:data.className||'',teacherName:data.teacherName||'',code}))return {cancelled:true};
    current();
    const membership=doc(db,'classMembers',user.uid+'_'+data.classId);
    const result=await runTransaction(db,async tx=>{
        current();
        const existing=await tx.get(membership);
        current();
        if(existing.exists()) {
            const member=existing.data();
            if(member.userId!==user.uid||member.classId!==data.classId||member.status!=='active') {
                throw Error('Your membership is not active. Ask your teacher to check it before joining again.');
            }
            return {classId:data.classId,alreadyJoined:true};
        }
        tx.set(membership,{userId:user.uid,classId:data.classId,joinCode:code,status:'active',joinedAt:serverTimestamp()});
        return {classId:data.classId,alreadyJoined:false};
    });
    current();
    return result;
}
export async function leaveStudentClass(classId){const user=auth.currentUser;if(!user)throw Error('Sign in to leave a class.');if(typeof classId!=='string'||!classId||classId.includes('/'))throw Error('Invalid class.');const batch=writeBatch(db);batch.delete(doc(db,'classes',classId,'classmates',user.uid));batch.delete(doc(db,'classMembers',user.uid+'_'+classId));await batch.commit();}
