import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {instructionalSnapshot} from './instructional-snapshot.js';
import {chapterArtworkFor} from './chapter-artwork.js';
import {loadEras} from './chapters.js';

const atlas=document.getElementById('expeditionAtlas'),cards=document.getElementById('eraList');
const resume=document.createElement('section');
resume.className='atlas-resume';
resume.hidden=true;
atlas.before(resume);
const dialog=document.getElementById('atlasPreview'),content=document.getElementById('atlasPreviewContent');
const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
const rows=snapshot=>snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
let generation=0,catalog=null,returnFocus=null;
// Each scene evokes a particular place and moment within a longer era.
const scenesByEra = new Map([
 ['early-philippine-communities', {
  image: 'era-precolonial.jpg',
  alt: 'A riverside community with raised wooden homes, people carrying goods, and a wooden boat in precolonial Butuan.',
  caption: 'River life in precolonial Butuan'
 }],
 ['spanish-exploration-colonial-rule', {
  image: 'era-early-colonial.jpg',
  alt: 'People and boats at a landing on the Pasig River near stone fortifications in early colonial Manila.',
  caption: 'Manila under early Spanish rule'
 }],
 ['colonial-economic-social-cultural-change', {
  image: 'era-colonial-life.jpg',
  alt: 'Vendors and craftspeople trade textiles, ceramics, and baskets in a market near the port in Spanish-era Manila.',
  caption: 'Trade and daily life in colonial Manila'
 }],
 ['resistance-national-consciousness', {
  image: 'era-resistance.jpg',
  alt: 'Filipino women and men gather to read and discuss printed materials in a late nineteenth-century town.',
  caption: 'Reform ideas in the late colonial period'
 }]
]);
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
 resume.replaceChildren();
 resume.hidden=true;
 const eras=catalog.eras.filter(era=>era.status==='active').sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 let currentMarked=false;
 for(const era of eras){
  const card=[...cards.querySelectorAll('.era-card')].find(card=>card.dataset.eraId===era.id);if(!card)continue;
  card.dataset.expeditionEra=era.id;
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
  action.classList.add('lp-button',locked?'lp-button-secondary':'lp-button-primary');
  let progress=card.querySelector('.atlas-card-progress');
  if(!progress){progress=node('div','','atlas-card-progress');card.querySelector('.era-content').insertBefore(progress,action);}
  const unlockNote=card.querySelector('.era-unlock-note');if(unlockNote&&!card.dataset.editorialLayout)progress.before(unlockNote);
  progress.replaceChildren(node('span',completed+' / '+chapters.length+' chapters complete'));
  const meter=document.createElement('progress');meter.max=Math.max(1,chapters.length);meter.value=completed;meter.setAttribute('aria-label','Chapter completion: '+era.title);progress.append(meter);
  const visual=card.querySelector('.era-image');
  const destination=visual.querySelector('.destination-number');if(destination&&!card.dataset.editorialLayout)card.querySelector('.era-content').prepend(destination);
  visual.querySelectorAll('.era-authored-art').forEach(item=>item.remove());
  const image=card.querySelector('.era-destination-art');
  if(image&&!image.dataset.atlasArtwork){
   const fallback='../assets/brand/expedition-atlas.svg';
   const scene=scenesByEra.get(era.id);
   const note=node('span',scene?'Historical interpretation':'Symbolic editorial illustration','atlas-art-note');
   if(scene)note.prepend(node('span',scene.caption+' · ','atlas-art-description'));
   image.dataset.atlasArtwork='true';
   image.decoding='async';
   if(scene){
    image.classList.add('atlas-reconstructed-scene');
    image.alt=scene.alt;
   }
   image.addEventListener('error',()=>{
    image.classList.remove('atlas-reconstructed-scene');
    image.alt='';
    note.textContent='Symbolic editorial illustration';
    image.src=fallback;
   },{once:true});
   image.src=scene?'../assets/atlas/'+scene.image:fallback;
   visual.append(note);
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
  const stopScene=scenesByEra.get(era.id);
  if(stopScene)stop.style.setProperty('--atlas-stop-art','url("../assets/atlas/'+stopScene.image+'")');
  const stopTitle=node('span',era.title||'Historical destination','atlas-stop-title');
  const stopCopy=node('span','','atlas-stop-copy');
  const stopStatus=node('span',complete?'Completed':locked?'Locked · Preview':completed?'In progress':'Available','atlas-stop-status');
  stopCopy.append(stopTitle,stopStatus);
  stop.append(node('span',complete?'✓':String(eras.indexOf(era)+1).padStart(2,'0'),'atlas-stop-number'),stopCopy);
  stop.setAttribute('aria-label',(locked?'Preview ':complete?'Revisit ':'Select ')+(era.title||'era'));
  const currentChapter=chapters.find((chapter,index)=>
   chapter.contentReady!==false && !catalog.completed.has(chapter.id) &&
   chapters.slice(0,index).every(previous=>previous.contentReady===false ||
    previous.requiredForProgression===false || catalog.completed.has(previous.id)));
  const featured = !locked && Boolean(currentChapter) && !currentMarked;
  card.toggleAttribute('data-atlas-compact', !featured);
  if(featured){
   stop.setAttribute('aria-current','step');currentMarked=true;
   stopStatus.textContent='Current era';
   const label=node('h2',currentChapter.title||'Your current chapter');
   const action=node('a','Continue chapter','lp-button lp-button-primary');
   action.href='mission.html?'+new URLSearchParams({chapter:currentChapter.id});
   const artwork=chapterArtworkFor(currentChapter.id)?.src||(stopScene?'../assets/atlas/'+stopScene.image:null);
   if(artwork){
    const image=node('img','','atlas-resume-art');
    image.alt='';
    image.addEventListener('error',()=>image.remove(),{once:true});
    image.src=artwork;
    resume.append(image);
   }
   const seal=node('span','','atlas-resume-seal');seal.setAttribute('aria-hidden','true');
   const arrow=node('span','→','atlas-resume-arrow');arrow.setAttribute('aria-hidden','true');action.append(arrow);
   resume.append(seal,node('p','Your next chapter'),label,action);
   resume.hidden=false;
  }
  stop.addEventListener('click',()=>{for(const item of atlas.children)item.removeAttribute('aria-pressed');stop.setAttribute('aria-pressed','true');if(locked)preview(era,chapters,stop);else{card.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion')?'instant':'smooth'});action.focus({preventScroll:true});}});
  atlas.append(stop);
 }
}
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});});
// Watch card insertion only; changes inside an enhanced card must not trigger a loop.
observer.observe(cards,{childList:true});
async function loadAtlas(user){
 const request=++generation;catalog=null;atlas.replaceChildren();resume.replaceChildren();resume.hidden=true;if(dialog.open)dialog.close();if(!user)return;
 try{const [eras,chapters,progress]=await Promise.all([
  instructionalSnapshot('eras',()=>getDocs(collection(db,'eras'))),instructionalSnapshot('chapters',()=>getDocs(collection(db,'chapters'))),
  getDocs(query(collection(db,'studentChapterProgress'),where('userId','==',user.uid)))
 ]);if(request!==generation||auth.currentUser?.uid!==user.uid)return;
 catalog={uid:user.uid,eras:rows(eras),chapters:rows(chapters),completed:new Set(rows(progress).filter(row=>row.userId===user.uid&&row.completed===true).map(row=>row.chapterId))};enhance();
 }catch{
  if(request!==generation||auth.currentUser?.uid!==user.uid)return;
  const notice=node('p',cards.querySelector('.era-card')
   ? 'Could not load your map progress. You can still use the destination list.'
   : 'Could not load your map. Try again, or return to your journey.','lp-status-panel');
  notice.dataset.state='error';
  notice.setAttribute('role','status');
  const retry=node('button','Retry Map Progress','lp-button lp-button-secondary');
  retry.type='button';
  retry.addEventListener('click',async()=>{
   retry.disabled=true;
   await Promise.all([loadAtlas(user),cards.querySelector('.era-card') ? null : loadEras()]);
   if(document.activeElement===document.body&&auth.currentUser?.uid===user.uid){
    (resume.querySelector('a')||atlas.querySelector('button'))?.focus();
   }
  });
  const back=node('a','Back to Journey','lp-button lp-button-secondary');
  back.href='my-journey.html';
  const actions=node('div','','lp-recovery-actions');
  actions.append(retry,back);
  atlas.append(notice,actions);
 }
}
onAuthStateChanged(auth,loadAtlas);
window.addEventListener('pageshow',event=>{if(event.persisted)loadAtlas(auth.currentUser);});
document.getElementById('closeAtlasPreview').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>returnFocus?.isConnected&&returnFocus.focus());
const heading=document.querySelector('.explore-header');
const journey=document.querySelector('.explore-orientation a');if(journey){journey.classList.add('lp-button','lp-button-secondary');heading.append(journey);}
const utility=node('div','','atlas-utilities');heading.after(utility);
for(const button of heading.querySelectorAll('button'))if(button.textContent.includes('Refresh Learning Content')){button.classList.add('lp-button','lp-button-secondary');utility.append(button);}
window.addEventListener('pagehide',()=>{generation++;catalog=null;atlas.replaceChildren();resume.replaceChildren();resume.hidden=true;if(dialog.open)dialog.close();});
