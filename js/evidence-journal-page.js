import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,doc,getDoc,getDocs,deleteDoc,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {resolveJournalEntries} from './evidence-journal.js';

const journalHost=document.getElementById('evidenceJournalEntries'),journalStatus=document.getElementById('evidenceJournalStatus'),journalFilter=document.getElementById('evidenceJournalFilter'),journalRefresh=document.getElementById('refreshEvidenceJournal');
let journalGeneration=0,journalEntries=[];
function journalText(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
function renderEvidenceJournal(){
    journalHost.replaceChildren();
    const selected=journalFilter.value,entries=journalEntries.filter(e=>!selected||e.missionId===selected);
    if(!entries.length){journalHost.append(journalText('p','No discoveries saved here yet. Open clues in a lesson, then choose Save Opened Clues.'));return;}
    const uid=auth.currentUser?.uid;
    for(const entry of entries){
        const card=document.createElement('article');card.className='evidence-journal-card';
        card.append(journalText('span',entry.missionTitle),journalText('h3',entry.title),journalText('p',entry.discovery));
        if(entry.available){const link=journalText('a','Revisit the Explanation');link.className='text-button';link.href='story.html?'+new URLSearchParams({chapter:entry.chapterId,mission:entry.missionId,...(entry.topic?{reviewTopic:entry.topic}:{})});card.append(link);}
        const remove=journalText('button','Remove from Journal');remove.type='button';remove.className='text-button';
        remove.addEventListener('click',async()=>{
            if(auth.currentUser?.uid!==uid)return;
            remove.disabled=true;
            try{await deleteDoc(doc(db,'studentEvidenceJournal',entry.id));if(auth.currentUser?.uid!==uid)return;journalEntries=journalEntries.filter(e=>e.id!==entry.id);renderEvidenceJournal();journalStatus.textContent='Discovery removed. Your lesson progress is unchanged.';}
            catch{if(auth.currentUser?.uid===uid){remove.disabled=false;journalStatus.textContent='We could not remove this discovery. Try again when connected.';}}
        });
        card.append(remove);journalHost.append(card);
    }
}
async function loadEvidenceJournal(){
    const uid=auth.currentUser?.uid,request=++journalGeneration;
    const current=()=>request===journalGeneration&&auth.currentUser?.uid===uid;
    journalEntries=[];journalHost.replaceChildren();journalRefresh.disabled=true;journalFilter.replaceChildren(new Option('All missions',''));
    journalStatus.textContent=uid?'Loading your saved discoveries...':'Sign in to view your journal.';
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
        journalEntries=resolveJournalEntries(records,...catalog,uid);
        const options=new Map(journalEntries.map(e=>[e.missionId,e.missionTitle]));
        for(const [id,title]of options)journalFilter.add(new Option(title,id));
        renderEvidenceJournal();
        journalStatus.textContent=partial?'Some lesson details could not load. Refresh your journal to retry.':journalEntries.length+' saved discoveries. These are learning bookmarks, not mastery scores.';
    }catch{if(current())journalStatus.textContent='Your journal could not load. Check your connection, then choose Refresh Journal. You can still continue your lessons.';}
    finally{if(current())journalRefresh.disabled=false;}
}
if(journalHost){journalFilter.addEventListener('change',renderEvidenceJournal);journalRefresh.addEventListener('click',loadEvidenceJournal);onAuthStateChanged(auth,()=>{journalGeneration++;journalEntries=[];journalHost.replaceChildren();loadEvidenceJournal();});window.addEventListener('pageshow',e=>{if(e.persisted)loadEvidenceJournal();});}
