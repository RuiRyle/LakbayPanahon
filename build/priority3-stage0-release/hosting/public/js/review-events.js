import {auth,db} from './firebase-config.js';
import {collection,doc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// Reading evidence is separate from quiz grades, practice and rewards.
export async function recordLessonReview({chapterId,missionId,topic,sceneIds}) {
    if(globalThis.__lakbayExplorationPreview===true)return true;
    const uid=auth.currentUser?.uid;
    if(!uid || !chapterId || !missionId || typeof topic!=='string' || !topic.trim() ||
        !Array.isArray(sceneIds) || !sceneIds.length || new Set(sceneIds).size!==sceneIds.length) throw Error('Review information is incomplete.');
    const reference=doc(collection(db,'studentReviewEvents'));
    await setDoc(reference,{userId:uid,chapterId,missionId,topic:topic.trim(),sceneIds,
        kind:'lesson-review',completedAt:serverTimestamp()});
    return auth.currentUser?.uid===uid;
}
