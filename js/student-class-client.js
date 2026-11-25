import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer,getDocsFromServer,collection,query,where,runTransaction,serverTimestamp,writeBatch} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
export function normalizeClassCode(value){const code=String(value||'').replace(/[\s-]/g,'').toUpperCase();if(!/^[A-Z0-9]{12}$/.test(code))throw Error('Enter the 12-character code your teacher provided.');return code;}
function deliveryUncertain(error){
    return ['unavailable','deadline-exceeded','unknown','internal'].includes(String(error?.code||'').replace(/^firestore\//,''));
}
async function confirmMembership(user,classId,joined,error){
    if(!deliveryUncertain(error)||auth.currentUser!==user)throw error;
    let memberships;
    try{memberships=await getDocsFromServer(query(collection(db,'classMembers'),where('userId','==',user.uid)));}
    catch{throw Object.assign(Error('The change could not be confirmed. Use Refresh Classes to check your membership.'),{code:'class/membership-unconfirmed'});}
    if(auth.currentUser!==user)throw Error('Your session changed. Please sign in again.');
    const member=memberships.docs.find(snapshot=>snapshot.data().userId===user.uid&&snapshot.data().classId===classId);
    if(joined?member?.data().status==='active':!member)return;
    throw Object.assign(Error('The change could not be confirmed. Use Refresh Classes to check your membership.'),{code:'class/membership-unconfirmed'});
}
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
    const memberships=await getDocsFromServer(query(collection(db,'classMembers'),where('userId','==',user.uid)));
    current();
    const data=invite.data();
    if(memberships.docs.some(snapshot=>{const member=snapshot.data();return member.userId===user.uid&&member.status==='active'&&member.classId!==data.classId;})) {
        throw Error('You can join only one class. Leave your current class before joining another. Your learning progress will stay saved.');
    }
    if(data.status!=='active'||typeof data.classId!=='string'||!data.classId||data.classId.includes('/'))throw unavailable();
    if(data.expiresAt!=null) {
        let expires;
        try { expires=data.expiresAt.toMillis(); } catch { throw unavailable(); }
        if(!Number.isFinite(expires)||expires<=Date.now())throw unavailable();
    }
    if(confirmClass && !await confirmClass({classId:data.classId,className:data.className||'',teacherName:data.teacherName||'',code}))return {cancelled:true};
    current();
    const membership=doc(db,'classMembers',user.uid+'_'+data.classId);
    const slot=doc(db,'studentClassSlots',user.uid);
    const result=await runTransaction(db,async tx=>{
        current();
        const reserved=await tx.get(slot);
        current();
        if(reserved.exists()&&reserved.data().classId!==data.classId) {
            const previousId=reserved.data().classId;
            if(typeof previousId!=='string'||!previousId||previousId.includes('/'))throw Error('Your class membership needs to be checked by your teacher.');
            const previous=await tx.get(doc(db,'classMembers',user.uid+'_'+previousId));
            current();
            if(previous.exists())throw Error('You can join only one class. Leave your current class before joining another.');
        }
        const existing=await tx.get(membership);
        current();
        if(existing.exists()) {
            const member=existing.data();
            if(member.userId!==user.uid||member.classId!==data.classId||member.status!=='active') {
                throw Error('Your membership is not active. Ask your teacher to check it before joining again.');
            }
            tx.set(slot,{classId:data.classId});
            return {classId:data.classId,alreadyJoined:true};
        }
        tx.set(membership,{userId:user.uid,classId:data.classId,joinCode:code,status:'active',joinedAt:serverTimestamp()});
        tx.set(slot,{classId:data.classId});
        return {classId:data.classId,alreadyJoined:false};
    }).catch(async error=>{
        await confirmMembership(user,data.classId,true,error);
        return {classId:data.classId,alreadyJoined:false};
    });
    current();
    return result;
}
export async function leaveStudentClass(classId){
    const user=auth.currentUser;
    if(!user)throw Error('Sign in to leave a class.');
    if(typeof classId!=='string'||!classId||classId.includes('/'))throw Error('Invalid class.');
    const batch=writeBatch(db);
    batch.delete(doc(db,'classes',classId,'classmates',user.uid));
    batch.delete(doc(db,'classMembers',user.uid+'_'+classId));
    try{await batch.commit();}catch(error){await confirmMembership(user,classId,false,error);}
}
