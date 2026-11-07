import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {instructionalSnapshot} from './instructional-snapshot.js';

const collectionPreviews = [
    {host:'homeBadgePreview',catalog:'badges',owned:'studentBadges',key:'badgeId',fallback:'\u2726',label:'badge'},
    {host:'homeArtifactPreview',catalog:'artifacts',owned:'studentArtifacts',key:'artifactId',fallback:'\u25c8',label:'artifact'}
];
let collectionGeneration = 0, previewOwner = null;
const previousOwnership = new Map();
const previewRows = snapshot => snapshot.docs.map(row => ({...row.data(),id:row.id}));

export function renderDashboardCollection(host,catalog,ownership,userId,definition,previous=null) {
    host.replaceChildren();
    const owned = new Set(ownership.filter(row => row.userId === userId && typeof row[definition.key] === 'string').map(row=>row[definition.key]));
    const rows = catalog.filter(row=>row.status==='active'||definition.catalog==='artifacts'&&!row.status).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
    const earned = rows.filter(row=>owned.has(row.id)).slice(0,3);
    const locked = rows.filter(row=>!owned.has(row.id)).slice(0,earned.length ? 1 : 3);
    for (const item of [...earned,...locked]) {
        const unlocked=owned.has(item.id),tile=document.createElement('span');
        tile.className='hq-collection-token';tile.dataset.state=unlocked?'earned':'locked';
        tile.title=(unlocked?'Earned: ':'Not earned yet: ')+(item.name||definition.label);
        if(unlocked&&previous&&!previous.has(item.id))tile.classList.add('hq-newly-earned');
        const icon=document.createElement('span');icon.className='hq-token-icon';icon.setAttribute('aria-hidden','true');
        icon.textContent=unlocked?(typeof item.icon==='string'?item.icon:definition.fallback):'\u25c7';
        const name=document.createElement('span');name.className='hq-token-name';name.textContent=item.name||definition.label;
        const state=document.createElement('small');state.textContent=unlocked?'Earned':'Locked';
        tile.append(icon,name,state);host.append(tile);
    }
    if(!earned.length){const note=document.createElement('span');note.className='hq-collection-note';note.textContent=owned.size?'Some earned items are unavailable here. Open Collections to check.':'Your earned '+definition.label+'s will appear here as you learn.';host.append(note);}
    if(!rows.length&&!owned.size)host.textContent='This collection is being prepared.';
    return owned;
}

async function loadDashboardCollections(user) {
    const request=++collectionGeneration,uid=user?.uid;
    if(previewOwner!==uid)previousOwnership.clear();previewOwner=uid;
    const current=()=>request===collectionGeneration&&auth.currentUser?.uid===uid;
    const reload=document.getElementById('refreshHomeCollections');if(reload)reload.disabled=true;
    for(const definition of collectionPreviews){const host=document.getElementById(definition.host);if(host)host.textContent=uid?'Loading saved collection...':'Sign in to view your collection.';}
    if(!uid)return;
    await Promise.all(collectionPreviews.map(async definition=>{
        const host=document.getElementById(definition.host);if(!host)return;
        try{
            const [catalog,ownership]=await Promise.all([
                instructionalSnapshot(definition.catalog,()=>getDocs(collection(db,definition.catalog))),
                getDocs(query(collection(db,definition.owned),where('userId','==',uid)))
            ]);
            if(!current())return;
            previousOwnership.set(definition.key,renderDashboardCollection(host,previewRows(catalog),previewRows(ownership),uid,definition,previousOwnership.get(definition.key)));
        }catch{if(current())host.textContent='Collection preview could not load. Refresh or open Collections; your earned items are unchanged.';}
    }));
    if(current()&&reload)reload.disabled=false;
}
document.getElementById('refreshHomeCollections')?.addEventListener('click',()=>loadDashboardCollections(auth.currentUser));
onAuthStateChanged(auth,loadDashboardCollections);
window.addEventListener('pagehide',()=>{collectionGeneration++;previousOwnership.clear();for(const definition of collectionPreviews)document.getElementById(definition.host)?.replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted)loadDashboardCollections(auth.currentUser);});
