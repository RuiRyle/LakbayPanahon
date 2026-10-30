import {auth,db} from './firebase-config.js';
import {doc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// Store references only. Authored discoveries remain in storyScenes.
export async function saveEvidenceClues({chapterId,missionId,sceneId,indices}) {
    const uid=auth.currentUser?.uid;
    if(!uid || !chapterId || !missionId || !sceneId || !Array.isArray(indices) || !indices.length ||
        indices.some(i=>!Number.isInteger(i)||i<0)) throw Error('Open a clue before saving it.');
    const unique=[...new Set(indices)];
    await Promise.all(unique.map(clueIndex=>runTransaction(db,async transaction=>{
        if(auth.currentUser?.uid!==uid)throw Error('Your account changed.');
        const reference=doc(db,'studentEvidenceJournal',uid+'_'+sceneId+'_'+clueIndex);
        const previous=await transaction.get(reference);
        if(previous.exists())return;
        transaction.set(reference,{userId:uid,chapterId,missionId,sceneId,clueIndex,savedAt:serverTimestamp()});
    })));
    return auth.currentUser?.uid===uid;
}

export function mountEvidenceSaver({scene,chapterId,missionId,anchor,explored}) {
    document.getElementById('sceneEvidenceSaver')?.remove();
    if(!anchor || !Array.isArray(scene.exploreItems) || !scene.exploreItems.length)return;
    const uid=auth.currentUser?.uid,host=document.createElement('section');host.id='sceneEvidenceSaver';host.className='scene-evidence-saver';
    const heading=document.createElement('h3');heading.textContent='Your Evidence Journal';
    const copy=document.createElement('p');copy.textContent='Keep the clues you opened so you can find them later. Saving a clue does not earn XP or mean you have mastered it.';
    const save=document.createElement('button');save.type='button';save.className='text-button';save.textContent='Save Opened Clues';
    const link=document.createElement('a');link.href='my-journey.html#evidenceJournal';link.textContent='Open My Journal';link.className='text-button';
    const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    save.addEventListener('click',async()=>{
        if(auth.currentUser?.uid!==uid)return;
        const indices=explored();
        if(!indices.length){status.textContent='Open a clue above, then save it here.';return;}
        save.disabled=true;status.textContent='Saving your clues...';
        try{
            const current=await saveEvidenceClues({chapterId,missionId,sceneId:scene.id,indices});
            if(current&&host.isConnected)status.textContent='Your opened clues are saved. You can find them in My Journey.';
        }catch{if(auth.currentUser?.uid===uid&&host.isConnected)status.textContent='We could not confirm all clues were saved. Check your connection and try again; saved clues will not be duplicated.';}
        finally{if(auth.currentUser?.uid===uid&&host.isConnected)save.disabled=false;}
    });
    host.append(heading,copy,save,link,status);anchor.after(host);
}

export function resolveJournalEntries(records,scenes,missions,chapters,userId) {
    return records.filter(r=>r.userId===userId).map(record=>{
        const scene=scenes.find(s=>s.id===record.sceneId),mission=missions.find(m=>m.id===record.missionId),chapter=chapters.find(c=>c.id===record.chapterId);
        const clue=Number.isInteger(record.clueIndex)?scene?.exploreItems?.[record.clueIndex]:null;
        const available=scene?.status==='active'&&mission?.status==='active'&&chapter?.status==='active'&&chapter.contentReady!==false&&scene.missionId===mission.id&&mission.chapterId===chapter.id&&typeof clue?.discovery==='string';
        return {id:record.id,chapterId:record.chapterId,missionId:record.missionId,sceneId:record.sceneId,savedAt:record.savedAt,
            available:!!available,title:available?clue.title||'Lesson discovery':'Saved discovery unavailable',
            discovery:available?clue.discovery:'This lesson or clue has changed or is unavailable. You can remove this bookmark.',
            missionTitle:available?mission.title:'Unavailable lesson',topic:available?scene.reviewTopics?.[0]:null};
    }).sort((a,b)=>(b.savedAt?.toMillis?.()||0)-(a.savedAt?.toMillis?.()||0)||String(a.id).localeCompare(String(b.id)));
}
