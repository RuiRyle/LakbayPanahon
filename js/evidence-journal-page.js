import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,doc,getDoc,getDocs,deleteDoc,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {resolveJournalEntries} from './evidence-journal.js';
import {createDiscoveryPinControl} from './discovery-pins.js';

const journalHost=document.getElementById('evidenceJournalEntries'),journalStatus=document.getElementById('evidenceJournalStatus'),journalFilter=document.getElementById('evidenceJournalFilter'),journalRefresh=document.getElementById('refreshEvidenceJournal');
let journalGeneration=0,journalEntries=[],journalView='cards',journalOwner=null,journalLoadState='loading';
const isJournalReturn=()=>new URLSearchParams(location.search).get('fromJournal')==='1'||history.state?.fromJournal===true;
let returningToJournal=isJournalReturn();
const journalSearch=document.getElementById('journalSearch'),chapterFilter=document.getElementById('journalChapterFilter');
const browseTools=document.getElementById('journalBrowseTools');
const clearFilters=document.getElementById('clearJournalFilters');
const journalReturnKey=uid=>'lakbay:journal-return:'+uid;
const journalCards=()=>[...journalHost.querySelectorAll('[data-journal-entry]')];
function storeJournalReturn(uid,id){
    try{
        sessionStorage.setItem(journalReturnKey(uid),JSON.stringify({
            id,view:journalView,search:journalSearch?.value,chapter:chapterFilter?.value,mission:journalFilter.value,
            scrollY:window.scrollY
        }));
        history.replaceState({...history.state,fromJournal:true},'');
    }catch{}
}
function restoreJournalReturn(uid){
    if(!returningToJournal)return;
    returningToJournal=false;
    let state;
    try{state=JSON.parse(sessionStorage.getItem(journalReturnKey(uid)));}catch{}
    const id=state?.id;
    if(journalEntries.some(entry=>entry.id===id)){
        if(chapterFilter)chapterFilter.value=[...chapterFilter.options].some(option=>option.value===state.chapter)?state.chapter:'';
        updateMissionOptions();
        journalFilter.value=[...journalFilter.options].some(option=>option.value===state.mission)?state.mission:'';
        if(journalSearch)journalSearch.value=typeof state.search==='string'?state.search:'';
        if(['cards','notebook','timeline'].includes(state.view)){
            journalView=state.view;
            for(const tab of document.querySelectorAll('[data-journal-view]'))tab.setAttribute('aria-pressed',String(tab.dataset.journalView===journalView));
        }
    }else return;
    renderEvidenceJournal();
    const card=journalCards().find(item=>item.dataset.journalEntry===id);
    if(!card)return;
    if(Number.isFinite(state.scrollY))window.scrollTo({top:state.scrollY,behavior:'instant'});
    const rect=card.getBoundingClientRect();
    if(rect.top<0||rect.bottom>window.innerHeight)card.scrollIntoView({block:'nearest',behavior:'instant'});
    (card.querySelector(':scope > a, summary')||journalRefresh).focus({preventScroll:true});
}
for(const button of document.querySelectorAll('[data-journal-view]'))button.addEventListener('click',()=>{
 journalView=button.dataset.journalView;
 for(const tab of document.querySelectorAll('[data-journal-view]'))tab.setAttribute('aria-pressed',String(tab===button));
 renderEvidenceJournal();
});
journalSearch?.addEventListener('input',renderEvidenceJournal);
function updateMissionOptions(){
    const chapter=chapterFilter?.value;
    const choices=new Map(journalEntries.filter(entry=>!chapter||entry.chapterId===chapter).map(entry=>[entry.missionId,entry.missionTitle]));
    const previous=journalFilter.value;
    journalFilter.replaceChildren(new Option('All missions',''),...Array.from(choices,([id,title])=>new Option(title,id)));
    if(choices.has(previous))journalFilter.value=previous;
}
function updateChapterOptions(){
    if(!chapterFilter)return;
    const previous=chapterFilter.value;
    const choices=new Map(journalEntries.map(entry=>[entry.chapterId,entry.chapterTitle]));
    chapterFilter.replaceChildren(new Option('All chapters',''),...Array.from(choices,([id,title])=>new Option(title,id)));
    if(choices.has(previous))chapterFilter.value=previous;
}
chapterFilter?.addEventListener('change',()=>{updateMissionOptions();renderEvidenceJournal();});
function resetJournalFilters(){
    if(journalSearch)journalSearch.value='';
    if(chapterFilter)chapterFilter.value='';
    journalFilter.value='';
    updateMissionOptions();
    renderEvidenceJournal();
    journalSearch?.focus();
}
clearFilters?.addEventListener('click',resetJournalFilters);
function journalText(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
function journalNotice(state, message) {
    journalStatus.dataset.state = state;
    journalStatus.textContent = message;
}
function renderEvidenceJournal(){
    journalHost.replaceChildren();
    journalHost.dataset.view=journalView;
    if(browseTools)browseTools.hidden=journalEntries.length===0;
    const selected=journalFilter.value,search=(journalSearch?.value||'').trim().toLocaleLowerCase();
    const entries=journalEntries.filter(e=>(!selected||e.missionId===selected)&&(!chapterFilter?.value||e.chapterId===chapterFilter.value)&&(!search||[e.title,e.missionTitle,e.chapterTitle,e.discovery].join(' ').toLocaleLowerCase().includes(search)));
    if(clearFilters)clearFilters.hidden=(!search&&!selected&&!chapterFilter?.value)||(journalLoadState==='ready'&&entries.length===0);
    const filteredStatus=document.getElementById('journalFilterStatus');
    if(filteredStatus)filteredStatus.textContent=journalEntries.length
        ? (entries.length===journalEntries.length?`${entries.length} saved ${entries.length===1?'clue':'clues'}`:`Showing ${entries.length} of ${journalEntries.length} saved clues`)
        : '';
    if (journalLoadState !== 'ready') return;
    if(journalView==='timeline')entries.sort((a,b)=>(a.chapterOrder-b.chapterOrder)||(a.missionOrder-b.missionOrder)||(a.sceneOrder-b.sceneOrder)||String(a.id).localeCompare(String(b.id)));
    if(!entries.length){
        const message=journalText('div','');
        message.className='journal-empty-message lp-status-panel';
        message.dataset.state=journalEntries.length?'no-matches':'empty';
        message.append(
            journalText('strong',journalEntries.length?'No discoveries match these filters':'No saved clues yet'),
            journalText('span',journalEntries.length?'Clear your filters to see all saved clues.':'Open a clue in a lesson, then choose Save Opened Clues to add it here.')
        );
        journalHost.append(message);
        if (journalEntries.length) {
            const reset=journalText('button','Clear filters');
            reset.type='button';
            reset.className='lp-button lp-button-secondary';
            reset.addEventListener('click',resetJournalFilters);
            message.append(reset);
        } else {
            const example = journalText('div','');
            example.className = 'journal-starter-preview';
            const icon = journalText('span','');
            icon.className = 'interface-icon interface-icon--book-open';
            icon.setAttribute('aria-hidden','true');
            const copy = journalText('div','');
            copy.append(journalText('strong','Example of a saved clue'),journalText('p','A map’s legend tells you what its symbols mean.'));
            example.append(icon,copy);
            const start = journalText('a','Open the geography lesson');
            start.className = 'lp-button lp-button-primary';
            start.href = 'story.html?chapter=era1-prologue&mission=prologue-mission1';
            message.append(example, start);
        }
        return;
    }
    const uid=auth.currentUser?.uid;
    for(const entry of entries){
        const card=document.createElement('article');card.className='evidence-journal-card';card.dataset.journalEntry=entry.id;
        const context=journalText('div','');
        context.className='journal-clue-context';
        const icon=journalText('span','');
        icon.className='interface-icon interface-icon--book-open';
        icon.setAttribute('aria-hidden','true');
        context.append(icon,journalText('small',entry.missionTitle),journalText('span',entry.chapterTitle||'Saved chapter'));
        card.append(journalText('h3',entry.title),context,journalText('p',entry.discovery));
        if(entry.available){
            const link=journalText('a','Revisit the Explanation');
            link.className='text-button';
            link.href='story.html?'+new URLSearchParams({chapter:entry.chapterId,mission:entry.missionId,fromJournal:'1',...(entry.topic?{reviewTopic:entry.topic}:{})});
            link.addEventListener('click',()=>{if(auth.currentUser?.uid===uid)storeJournalReturn(uid,entry.id);});
            card.append(link);
        }
        const menu=document.createElement('details');menu.className='journal-entry-actions';menu.append(journalText('summary','Discovery actions'));
        const remove=journalText('button','Remove from Journal');remove.type='button';remove.className='text-button';
        const removalStatus=journalText('p','');
        removalStatus.className='lp-status-panel';
        removalStatus.setAttribute('role','status');
        remove.addEventListener('click',async()=>{
            if(auth.currentUser?.uid!==uid)return;
            const restoreFocus=card.contains(document.activeElement);
            remove.disabled=true;
            removalStatus.textContent='';
            try {
                await deleteDoc(doc(db,'studentEvidenceJournal',entry.id));
                if(auth.currentUser?.uid!==uid)return;
                const focused=restoreFocus&&(card.contains(document.activeElement)||document.activeElement===document.body);
                const cards=journalCards(),position=cards.indexOf(card);
                const neighbours=position<0?[]:[cards[position+1],cards[position-1]];
                journalEntries=journalEntries.filter(e=>e.id!==entry.id);
                updateChapterOptions();
                updateMissionOptions();
                renderEvidenceJournal();
                journalNotice('saved','Discovery removed from your journal.');
                if(focused){
                    const rendered=journalCards();
                    const next=neighbours.map(item=>rendered.find(card=>card.dataset.journalEntry===item?.dataset.journalEntry)).find(Boolean);
                    (next?.querySelector(':scope > a, summary')||journalHost.querySelector('button, a')||journalRefresh).focus();
                }
            }
            catch{
                if(auth.currentUser?.uid===uid && card.isConnected){
                    remove.disabled=false;
                    removalStatus.dataset.state='error';
                    removalStatus.textContent='We could not remove this clue. Check your connection and try again.';
                }
            }
        });
        if(entry.available)menu.append(createDiscoveryPinControl({userId:uid,kind:'journal',id:entry.id,isCurrent:()=>auth.currentUser?.uid===uid&&card.isConnected}));
        menu.append(remove,removalStatus);card.append(menu);journalHost.append(card);
    }
}
async function loadEvidenceJournal(){
    const uid=auth.currentUser?.uid,request=++journalGeneration;
    const current=()=>request===journalGeneration&&auth.currentUser?.uid===uid;
    const sameOwner=uid && journalOwner===uid;
    journalOwner=uid||null;
    if(browseTools)browseTools.hidden=true;
    journalLoadState=uid?'loading':'signed-out';
    journalEntries=[];journalHost.replaceChildren();journalRefresh.disabled=true;
    if(!sameOwner){
        journalFilter.replaceChildren(new Option('All missions',''));
        chapterFilter?.replaceChildren(new Option('All chapters',''));
        if(journalSearch)journalSearch.value='';
    }
    journalHost.setAttribute('aria-busy',String(Boolean(uid)));
    const filteredStatus=document.getElementById('journalFilterStatus');
    if(filteredStatus)filteredStatus.textContent='';
    journalNotice(journalLoadState,uid?'Loading your saved clues…':'Sign in to view your journal.');
    if(!uid)return;
    try{
        const saved=await getDocs(query(collection(db,'studentEvidenceJournal'),where('userId','==',uid)));
        if(!current())return;
        const records=saved.docs.map(d=>({...d.data(),id:d.id}));
        const names=['storyScenes','missions','chapters'],fields=['sceneId','missionId','chapterId'];
        let partial=false;
        const catalog=await Promise.all(names.map(async(name,i)=>{
            const keys=[...new Set(records.map(r=>r[fields[i]]).filter(v=>typeof v==='string'&&v))];
            const rows=[];
            for(let start=0;start<keys.length;start+=12){const result=await Promise.allSettled(keys.slice(start,start+12).map(id=>getDoc(doc(db,name,id))));for(const r of result){if(r.status==='rejected'){partial=true;continue;}if(r.value.exists())rows.push({...r.value.data(),id:r.value.id});}}
            return rows;
        }));
        if(!current())return;
        journalEntries=resolveJournalEntries(records,...catalog,uid).map(entry=>{
 const chapter=catalog[2].find(c=>c.id===entry.chapterId),mission=catalog[1].find(m=>m.id===entry.missionId),scene=catalog[0].find(c=>c.id===entry.sceneId);
 return {...entry,chapterTitle:chapter?.title||'Unavailable chapter',chapterOrder:Number(chapter?.order)||0,missionOrder:Number(mission?.order)||0,sceneOrder:Number(scene?.order)||0};
});
        updateChapterOptions();
        updateMissionOptions();
        journalLoadState='ready';
        renderEvidenceJournal();
        journalNotice(partial?'unconfirmed':'ready',partial?'Some lesson details could not load. Refresh your journal to retry.':'');
        restoreJournalReturn(uid);
    }catch{
        if(current()){
            journalLoadState='error';
            journalNotice('error','Your journal could not load. Check your connection, then choose Refresh Journal.');
        }
    }
    finally{if(current()){journalRefresh.disabled=false;journalHost.setAttribute('aria-busy','false');}}
}
if(journalHost){journalFilter.addEventListener('change',renderEvidenceJournal);journalRefresh.addEventListener('click',loadEvidenceJournal);onAuthStateChanged(auth,()=>{journalGeneration++;journalEntries=[];journalHost.replaceChildren();loadEvidenceJournal();});window.addEventListener('pageshow',e=>{if(e.persisted){returningToJournal=isJournalReturn();loadEvidenceJournal();}});}
