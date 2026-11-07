import {auth,db} from './firebase-config.js';
import {doc,getDoc} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {validatedDiscoveryCase} from './discovery-cases.js';

// Museum-only, lazy lookup. Mission/Story already have this document.
export async function loadDiscoveryCase(chapterId,missionId) {
    const user=auth.currentUser;
    const id=value=>typeof value==='string'&&value.trim()&&!value.includes('/');
    if(!user||!id(chapterId)||!id(missionId))throw Error('This mission is unavailable.');
    const snapshot=await getDoc(doc(db,'missions',missionId));
    if(auth.currentUser!==user)throw Error('Your session changed.');
    if(!snapshot.exists())return null;
    const mission={...snapshot.data(),id:missionId};
    if(mission.chapterId!==chapterId||mission.status!=='active')return null;
    if(mission.discoveryCase===undefined)return null;
    const activity=validatedDiscoveryCase(mission);
    if(!activity)throw Error('The discovery details are unavailable.');
    return activity;
}
