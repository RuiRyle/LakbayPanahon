import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {doc,getDoc} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {readDiscoveryPins,discoveryPinKey,createDiscoveryPinControl} from './discovery-pins.js';
import {createExplorerArt} from './explorer-art.js';
import {resolveJournalEntries} from './evidence-journal.js';

const grid=document.getElementById('discoveryWallEntries'),status=document.getElementById('discoveryWallStatus'),refresh=document.getElementById('refreshDiscoveryWall');
let generation=0;
const safeId=value=>typeof value==='string'&&value.length>0&&value.length<=256&&!value.includes('/');
async function pinnedDiscovery(userId,pin){
    const ownership=await getDoc(doc(db,pin.kind==='artifact'?'studentArtifacts':'studentEvidenceJournal',pin.kind==='artifact'?userId+'_'+pin.id:pin.id));
    if(!ownership.exists())return null;
    const record={...ownership.data(),id:ownership.id};if(record.userId!==userId)return null;
    if(pin.kind==='artifact'){
        if(record.artifactId!==pin.id)return null;
        const catalog=await getDoc(doc(db,'artifacts',pin.id));if(!catalog.exists())return null;
        const item=catalog.data();if(item.status&&item.status!=='active')return null;
        return {kind:'artifact',title:item.name||item.title||'Earned artifact',copy:item.description||'A keepsake from your learning journey.',icon:typeof (item.icon||item.emoji)==='string'?(item.icon||item.emoji).slice(0,80):'',href:'achievements.html'};
    }
    if(![record.sceneId,record.missionId,record.chapterId].every(safeId))return null;
    const catalog=await Promise.all(['storyScenes','missions','chapters'].map((name,index)=>getDoc(doc(db,name,[record.sceneId,record.missionId,record.chapterId][index]))));
    const rows=catalog.map(snapshot=>snapshot.exists()?[{...snapshot.data(),id:snapshot.id}]:[]);
    const entry=resolveJournalEntries([record],...rows,userId)[0];
    return entry?.available?{kind:'journal',title:entry.title,copy:entry.discovery,href:'story.html?'+new URLSearchParams({chapter:entry.chapterId,mission:entry.missionId})}:null;
}
function renderWallEntry(pin,item,userId,isCurrent){
    const card=document.createElement('article');card.className='discovery-wall-card';
    if(item?.icon){const icon=document.createElement('div');icon.className='discovery-wall-authored-icon';icon.setAttribute('aria-hidden','true');icon.textContent=item.icon;card.append(icon);}
    else card.append(createExplorerArt(pin.kind==='artifact'?'artifact':'journal'));
    const type=document.createElement('span');type.className='eyebrow';type.textContent=pin.kind==='artifact'?'EARNED KEEPSAKE':'SAVED DISCOVERY';
    const heading=document.createElement('h3');heading.textContent=item?.title||'Discovery unavailable';
    const copy=document.createElement('p');copy.textContent=item?.copy||'This discovery could not be opened. Refresh to retry, or remove its pin.';
    card.append(type,heading,copy);
    if(item){const link=document.createElement('a');link.className='text-button';link.textContent=pin.kind==='artifact'?'Open collection':'Revisit lesson';link.href=item.href;card.append(link);}
    card.append(createDiscoveryPinControl({userId,...pin,isCurrent,onChange:loadDiscoveryWall,showWallLink:false}));grid.append(card);
}
async function loadDiscoveryWall(){
    const userId=auth.currentUser?.uid,request=++generation;
    const isCurrent=()=>request===generation&&auth.currentUser?.uid===userId;
    grid.replaceChildren();refresh.disabled=true;
    if(!userId){status.textContent='Sign in to see your discovery wall.';return;}
    const saved=readDiscoveryPins(userId);
    if(!saved.available){status.textContent='Your pins could not be read in this browser. Your journal and collections are still available.';refresh.disabled=false;return;}
    if(!saved.pins.length){status.textContent='Make this space yours. Pin up to three earned artifacts or saved journal discoveries using Pin to My Profile.';refresh.disabled=false;return;}
    status.textContent='Opening your pinned discoveries...';
    const results=await Promise.allSettled(saved.pins.map(pin=>pinnedDiscovery(userId,pin)));
    if(!isCurrent())return;
    results.forEach((result,index)=>renderWallEntry(saved.pins[index],result.status==='fulfilled'?result.value:null,userId,isCurrent));
    status.textContent=results.some(result=>result.status==='rejected'||!result.value)?'Some pinned discoveries could not be opened. Refresh to retry.':'Your discoveries, chosen by you.';
    refresh.disabled=false;
}
if(grid){
    refresh.addEventListener('click',loadDiscoveryWall);
    onAuthStateChanged(auth,loadDiscoveryWall);
    window.addEventListener('pageshow',event=>{if(event.persisted)loadDiscoveryWall();});
    window.addEventListener('pagehide',()=>{generation++;grid.replaceChildren();status.textContent='';});
    window.addEventListener('storage',event=>{if(auth.currentUser&&(event.key===null||event.key===discoveryPinKey(auth.currentUser.uid)))loadDiscoveryWall();});
}
