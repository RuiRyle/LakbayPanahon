import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {instructionalSnapshot} from './instructional-snapshot.js';

const atlas=document.getElementById('expeditionAtlas'),cards=document.getElementById('eraList');
const dialog=document.getElementById('atlasPreview'),content=document.getElementById('atlasPreviewContent');
const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
const rows=snapshot=>snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
let generation=0,catalog=null,returnFocus=null;
const artByEra={
 'early-philippine-communities':['../assets/atlas/maritime.svg',true],
 'spanish-exploration-colonial-rule':['../assets/atlas/navigation.svg',true],
 'colonial-economic-social-cultural-change':['../assets/atlas/archive.svg',true],
 'resistance-national-consciousness':['../assets/atlas/voices.svg',true]
};
function preview(era,chapters,trigger){
 content.replaceChildren();returnFocus=trigger;
 const title=node('h2',era.title||'Historical destination');title.id='atlasPreviewTitle';content.append(title);
 if(era.dateRange)content.append(node('p',era.dateRange,'atlas-period'));
 if(era.description)content.append(node('p',era.description));
 content.append(node('h3','Chapters in this destination'));
 const list=node('ol','');for(const chapter of chapters)list.append(node('li',chapter.title||'Historical chapter'));content.append(list);
 const goals=Array.isArray(era.learningObjectives)?era.learningObjectives.filter(item=>typeof item==='string'&&item.trim()):[];
 if(goals.length){content.append(node('h3','Learning objectives'));const objectives=node('ul','');for(const goal of goals)objectives.append(node('li',goal));content.append(objectives);}
 content.append(node('h3','Unlocking requirements'),node('p',era.unlockMessage||'Complete the required chapters before opening restricted lessons.'));
 const requirements=era.requiredChapterIds;
 if(Array.isArray(requirements)&&requirements.length){const required=node('ul','');for(const id of requirements)required.append(node('li',catalog.chapters.find(chapter=>chapter.id===id)?.title||'Required chapter information unavailable'));content.append(required);}
 content.append(node('p','This preview does not unlock lessons, change progress, or award XP.','atlas-preview-note'));
 if(!dialog.open)dialog.showModal();
}
function enhance(){
 if(!catalog||!auth.currentUser||catalog.uid!==auth.currentUser.uid)return;
 atlas.replaceChildren();
 const eras=catalog.eras.filter(era=>era.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 let currentMarked=false;
 for(const era of eras){
  const card=[...cards.querySelectorAll('.era-card')].find(card=>card.dataset.eraId===era.id);if(!card)continue;
  const chapters=catalog.chapters.filter(chapter=>chapter.status==='active'&&chapter.eraId===era.id).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  const completed=chapters.filter(chapter=>catalog.completed.has(chapter.id)).length;
  const locked=card.dataset.locked==='true';const complete=chapters.length>0&&completed===chapters.length;
  const state=complete?'complete':locked?'locked':completed?'ongoing':'available';card.dataset.atlasState=state;
  const status=card.querySelector('.era-status');status.textContent=complete?'Completed':locked?'Locked · Preview':completed?'Ongoing':'Available';
  const original=card.querySelector('.era-button');if(!original)continue;
  let action=original;
  if(locked&&original.tagName==='A'){
   action=node('button','Preview destination','era-button');action.type='button';original.replaceWith(action);action.addEventListener('click',()=>preview(era,chapters,action));
  }else if(!locked)action.textContent=complete?'Revisit era':completed?'Continue era':'Explore era';
  let progress=card.querySelector('.atlas-card-progress');
  if(!progress){progress=node('div','','atlas-card-progress');card.querySelector('.era-content').insertBefore(progress,action);}
  const unlockNote=card.querySelector('.era-unlock-note');if(unlockNote&&!card.dataset.editorialLayout)progress.before(unlockNote);
  progress.replaceChildren(node('span',completed+' / '+chapters.length+' chapters complete'));
  const meter=document.createElement('progress');meter.max=Math.max(1,chapters.length);meter.value=completed;meter.setAttribute('aria-label','Chapter completion: '+era.title);progress.append(meter);
  const visual=card.querySelector('.era-image');
  const destination=visual.querySelector('.destination-number');if(destination&&!card.dataset.editorialLayout)card.querySelector('.era-content').prepend(destination);
  visual.querySelectorAll('.era-authored-art').forEach(item=>item.remove());
  const image=card.querySelector('.era-destination-art');
  if(image&&!image.dataset.atlasArtwork){const [source,symbolic]=artByEra[era.id]||['../assets/brand/expedition-atlas.svg',true];image.src=source;image.dataset.atlasArtwork='true';image.decoding='async';
   image.addEventListener('error',()=>{image.src='../assets/brand/expedition-atlas.svg';},{once:true});
   if(symbolic){const note=node('span','Symbolic editorial illustration','atlas-art-note');visual.append(note);}
  }
  if(!card.dataset.editorialLayout){
   const body=card.querySelector('.era-content');
   const heading=node('div','','atlas-card-heading');
   for(const selector of ['.destination-number','.era-status','h3','.era-date-range']){const item=body.querySelector(selector);if(item)heading.append(item);}
   const description=node('div','','atlas-card-description');
   for(const item of [...body.children])if(item.tagName==='P'&&!item.classList.contains('era-unlock-note'))description.append(item);
   const requirements=node('div','','atlas-card-requirements');if(unlockNote)requirements.append(unlockNote);
   const footer=node('div','','atlas-card-footer');footer.append(progress,action);
   body.replaceChildren(heading,description,requirements,footer);card.dataset.editorialLayout='true';
  }
  const stop=node('button','','atlas-stop');stop.type='button';stop.dataset.state=state;
  stop.append(node('span',complete?'✓':String(eras.indexOf(era)+1).padStart(2,'0'),'atlas-stop-number'),node('span',era.title||'Historical destination'));
  stop.setAttribute('aria-label',(locked?'Preview ':complete?'Revisit ':'Select ')+(era.title||'era'));
  if(!locked&&!complete&&!currentMarked){stop.setAttribute('aria-current','step');currentMarked=true;}
  stop.addEventListener('click',()=>{for(const item of atlas.children)item.removeAttribute('aria-pressed');stop.setAttribute('aria-pressed','true');if(locked)preview(era,chapters,stop);else{card.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion')?'instant':'smooth'});action.focus({preventScroll:true});}});
  atlas.append(stop);
 }
}
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});});
// Watch card insertion only; changes inside an enhanced card must not trigger a loop.
observer.observe(cards,{childList:true});
async function loadAtlas(user){
 const request=++generation;catalog=null;atlas.replaceChildren();if(dialog.open)dialog.close();if(!user)return;
 try{const [eras,chapters,progress]=await Promise.all([
  instructionalSnapshot('eras',()=>getDocs(collection(db,'eras'))),instructionalSnapshot('chapters',()=>getDocs(collection(db,'chapters'))),
  getDocs(query(collection(db,'studentChapterProgress'),where('userId','==',user.uid)))
 ]);if(request!==generation||auth.currentUser?.uid!==user.uid)return;
 catalog={uid:user.uid,eras:rows(eras),chapters:rows(chapters),completed:new Set(rows(progress).filter(row=>row.userId===user.uid&&row.completed===true).map(row=>row.chapterId))};enhance();
 }catch{if(request===generation)atlas.textContent='Atlas progress could not load. The existing destination controls remain available below.';}
}
onAuthStateChanged(auth,loadAtlas);
window.addEventListener('pageshow',event=>{if(event.persisted)loadAtlas(auth.currentUser);});
document.getElementById('closeAtlasPreview').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>returnFocus?.isConnected&&returnFocus.focus());
const heading=document.querySelector('.explore-header');
const journey=document.querySelector('.explore-orientation a');if(journey)heading.append(journey);
const utility=node('div','','atlas-utilities');heading.after(utility);
for(const button of heading.querySelectorAll('button'))if(button.textContent.includes('Refresh Learning Content'))utility.append(button);
window.addEventListener('pagehide',()=>{generation++;catalog=null;atlas.replaceChildren();if(dialog.open)dialog.close();});
