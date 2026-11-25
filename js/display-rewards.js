import {createArtifactArtwork} from './museum-exhibits.js';
import {collection, doc, getDoc, getDocFromServer, getDocs, query, where, setDoc, deleteDoc, onSnapshot} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {auth, db} from './firebase-config.js';
import {rewardTrack} from './level-reward-policy.js';
import {animateAssessmentArrival} from './assessment-motion.js';

const slots={journal:'Journal cover',banner:'Profile banner',journey:'My Journey cover',artifact:'Featured artifact',frame:'Avatar frame'};
const placements={
 journal:['Evidence Journal on My Journey','my-journey.html#journalCover'],
 banner:['Header on My Profile','#profileBanner'],
 journey:['Top of My Journey','my-journey.html#journeyCover'],
 artifact:['Explorer card on My Profile','#profilePageName']
};
const scenes={boat:['butuan-boatbuilding.jpg','Illustration of boatbuilding in Butuan'],river:['era-precolonial.jpg','Illustration of river life in precolonial Butuan'],town:['era-early-colonial.jpg','Illustration of early colonial Manila']};
const element=(tag,label)=>Object.assign(document.createElement(tag),{textContent:label});
export const rewardLabel=r=>r.kind==='artifact'?r.name:r.name+' · '+slots[r.kind];
export function rewardArt(r){
 const art=element('span','');art.className='milestone-art';art.dataset.milestone=r.level;art.setAttribute('aria-hidden','true');
 if(r.frameId){art.classList.add('level-frame-sample');art.dataset.levelFrame=r.frameId;}
 const image=new Image();image.alt='';image.src=r.art?'../assets/atlas/'+r.art:'../assets/brand/lakbay-sun.svg';art.append(image);return art;
}
let owner=null, selected={}, artifacts=[], ready=false, artifactError=false;
let displayGeneration = 0;
const rewardOperations = new Map();
const cover=document.querySelector('.journal-hero-art');
const original=cover&&[cover.querySelector('img').getAttribute('src'),cover.querySelector('img').alt,cover.querySelector('figcaption').textContent];
function paint(level){
 const equipped=kind=>rewardTrack.find(r=>r.kind===kind&&r.level===selected[kind]?.level&&r.level<=level);
 const journal=equipped('journal');
 const journalCover=document.querySelector('.journal-equipped-cover');
 if(journalCover){
  const image=journalCover.querySelector('img');
  journalCover.hidden=!journal;
  journalCover.querySelector('figcaption').textContent=journal?journal.name+' cover':'';
  if(journal){
   journalCover.dataset.coverLevel=journal.level;
   const src='../assets/atlas/'+journal.art;
   if(image.getAttribute('src')!==src)image.setAttribute('src',src);
  }else{
   delete journalCover.dataset.coverLevel;
   image.removeAttribute('src');
  }
 }
 const identity=document.querySelector('.profile-identity-body');
 const artwork=equipped('banner');
 const bannerLabel=document.querySelector('.profile-identity-banner')?.querySelector('span');
 if(bannerLabel)bannerLabel.textContent=artwork?artwork.name+' · Equipped banner':'LAKBAYPANAHON EXPLORER';
 if(identity){
  if(artwork)identity.style.setProperty('--profile-cover','url("../assets/atlas/'+artwork.art+'")');
  else identity.style.removeProperty('--profile-cover');
  identity.toggleAttribute('data-equipped-cover',Boolean(artwork));
 }
 if(cover){
  const scene=equipped('journey')&&scenes[selected.journey.choice];
  const image=cover.querySelector('img');
  const src=scene?'../assets/atlas/'+scene[0]:original[0];
  if(image.getAttribute('src')!==src)image.setAttribute('src',src);
  image.alt=scene?scene[1]:original[1];
  cover.toggleAttribute('data-equipped-cover',Boolean(scene));
  const caption=cover.querySelector('figcaption');
  caption.textContent=scene?scene[1]+' · Equipped journey cover':original[2];
 }
 document.getElementById('featuredRewardArtifact')?.remove();
 const item=level>=25&&artifacts.find(item=>item.id===selected.artifact?.choice);
 if(item){const field=element('p','Featured artifact · '+item.name);field.id='featuredRewardArtifact';document.querySelector('.profile-identity-copy')?.append(field);}
}
export function watchDisplayRewards(uid,getLevel,refresh){
 document.getElementById('displayRewardNotice')?.replaceChildren();
 displayGeneration++;
 rewardOperations.clear();
 owner=uid;selected={};artifacts=[];ready=false;artifactError=false;paint(0);
 if(!uid||!document.querySelector('#levelRewardsCollection,#evidenceJournal'))return ()=>{};
 let active=true;
 const update=()=>{if(active&&owner===uid&&auth.currentUser?.uid===uid){paint(getLevel());refresh();}};
 const stop=onSnapshot(collection(db,'users',uid,'displayRewards'),{includeMetadataChanges:true},rows=>{
  if(!active||auth.currentUser?.uid!==uid||owner!==uid)return;
  if(rows.metadata?.hasPendingWrites)return;
  selected=Object.fromEntries(rows.docs.map(row=>[row.id,row.data()]));ready=true;update();
 },()=>{
  if(!active||auth.currentUser?.uid!==uid||owner!==uid)return;
  ready=false;
  update();
  const notice=document.getElementById('displayRewardNotice');
  if(notice)notice.textContent='Saved reward settings could not refresh. Reload My Profile to try again.';
 });
 let fetched=false;
 const load=async()=>{
  if(fetched||getLevel()<25||!document.getElementById('levelRewardsCollection'))return;
  fetched=true;
  try{
   const rows=await getDocs(query(collection(db,'studentArtifacts'),where('userId','==',uid)));
   const ids=[...new Set(rows.docs.map(row=>row.data().artifactId).filter(id=>typeof id==='string'&&id&&!id.includes('/')))];
   const catalog=await Promise.all(ids.map(id=>getDoc(doc(db,'artifacts',id))));
   if(active)artifacts=catalog.filter(s=>s.exists()&&(!s.data().status||s.data().status==='active')).map(s=>({...s.data(),id:s.id,name:s.data().name||s.data().title||s.id}));
  }catch{if(active)artifactError=true;}update();
 };
 const onLevel=()=>{if(!active||auth.currentUser?.uid!==uid||owner!==uid)return;paint(getLevel());void load();};window.addEventListener('explorer-level-ready',onLevel);onLevel();
 const session=displayGeneration;
 return ()=>{
  active=false;
  if(session===displayGeneration)displayGeneration++;
  stop();
  window.removeEventListener('explorer-level-ready',onLevel);
 };
}
export function displayCard(r,level,refresh){
 const card=element('article','');card.className='level-reward-card display-reward-card';card.id='reward-level-'+r.level;
 card.dataset.rewardKind=r.kind;
 const unlocked=level>=r.level, equipped=selected[r.kind]?.level===r.level;
 card.dataset.unlocked=String(unlocked);card.dataset.equipped=String(equipped);
 const status=element('strong',equipped?'On display':unlocked?'Owned':'Unlocks at Level '+r.level);
 const savedOperation=rewardOperations.get(r.kind);
 status.className='reward-ownership';
 const [placement,href]=placements[r.kind];
 card.append(rewardArt(r),status,element('h3',r.name),element('p','Appears on: '+placement));
 let picker;
 if(unlocked&&(r.kind==='artifact'||r.kind==='journey')){
  picker=element('select','');picker.setAttribute('aria-label',slots[r.kind]);
  const choices=r.kind==='journey'?Object.entries(scenes).map(([id,scene])=>({id,name:scene[1]})):artifacts;
  for(const {id,name} of choices)picker.add(new Option(name,id));
  if(equipped)picker.value=selected[r.kind].choice;
  if(savedOperation?.level===r.level&&choices.some(item=>item.id===savedOperation.choice))picker.value=savedOperation.choice;
  if(r.kind==='journey'){
   const preview=card.querySelector('.milestone-art img');
   const showScene=()=>{const scene=scenes[picker.value];if(scene)preview.src='../assets/atlas/'+scene[0];};
   picker.addEventListener('change',showScene);showScene();
  }
  card.append(picker);
  if(!choices.length)card.append(element('p',artifactError?'Your collection could not load. Refresh to retry.':'Earn a mission artifact to feature it here.'));
 }
 const button=element('button','');button.type='button';
 button.dataset.displayRewardAction=r.kind;
 const feedback=element('p','');
 feedback.id='display-reward-status-'+r.level;
 feedback.className='lp-status-panel display-reward-feedback';
 feedback.setAttribute('role','status');
 button.setAttribute('aria-describedby',feedback.id);
 const updateFeedback=()=>{
  const operation=rewardOperations.get(r.kind);
  const pending=operation?.state==='unconfirmed';
  button.disabled=!unlocked||operation?.state==='saving'||(pending?operation.level!==r.level:!ready||Boolean(picker&&!picker.value));
  if(picker)picker.disabled=pending||operation?.state==='saving';
  sync();
  feedback.dataset.state=operation?.state||'';
  feedback.textContent=operation?.level===r.level?operation.message:'';
 };
 const isEquippedChoice = () => equipped && (!picker || picker.value === selected[r.kind]?.choice);
 const sync = () => {
  const operation=rewardOperations.get(r.kind);
  if (!unlocked) button.textContent = 'Locked';
  else if (operation?.level===r.level&&operation.state==='unconfirmed') button.textContent='Check Saved Change';
  else if (r.kind === 'banner') button.textContent = isEquippedChoice() ? 'Unequip Banner' : 'Equip Banner';
  else if (r.kind === 'journal') button.textContent = isEquippedChoice() ? 'Unequip Cover' : 'Equip Cover';
  else button.textContent = isEquippedChoice() ? 'Remove' : 'Equip';
 };
 picker?.addEventListener('change',()=>{
  if(rewardOperations.get(r.kind)?.state==='error')rewardOperations.delete(r.kind);
  updateFeedback();
 });
 updateFeedback();
 const uid=owner,generation=displayGeneration;
 const current=()=>owner===uid&&auth.currentUser?.uid===uid&&displayGeneration===generation;
 const refreshControls=()=>{
  for(const item of document.querySelectorAll('.display-reward-card[data-reward-kind="'+r.kind+'"]')){
   item.dispatchEvent(new Event('reward-operation-changed'));
  }
 };
 card.addEventListener('reward-operation-changed',updateFeedback);
 button.onclick=async()=>{
  if(!current()||button.disabled||rewardOperations.get(r.kind)?.state==='saving')return;
  const ref=doc(db,'users',uid,'displayRewards',r.kind);
  const pending=rewardOperations.get(r.kind);
  const checking=pending?.state==='unconfirmed';
  const removing=checking?pending.removing:isEquippedChoice();
  const choice=checking?pending.choice:picker?.value||'';
  const previous=selected[r.kind];
  const hadFocus=document.activeElement===button;
  const notice=document.getElementById('displayRewardNotice');
  const mark=(state,message)=>rewardOperations.set(r.kind,{level:r.level,removing,choice,state,message});
  mark('saving',checking?'Checking your saved reward…':removing?'Removing this reward…':'Saving this reward…');
  refreshControls();
  const slowSave=setTimeout(()=>{
   if(!current())return;
   mark('saving','Still checking your saved reward. Keep this page open and reconnect if needed.');
   refreshControls();
  },6000);
  if(notice)notice.textContent='';
  const repaint=()=>{
   const restore=hadFocus&&(document.activeElement===button||document.activeElement===document.body||document.activeElement?.id==='levelRewardsStatus');
   paint(level);
   refresh();
   if(restore)document.getElementById(card.id)?.querySelector('[data-display-reward-action]')?.focus({preventScroll:true});
  };
  const recover=async()=>{
   const beforeRead=selected[r.kind];
   try{
    const snapshot=await getDocFromServer(ref);
    if(!current())return false;
    if(snapshot.metadata?.hasPendingWrites)throw Error('Reward write pending');
    const saved=snapshot.exists()?snapshot.data():undefined;
    if(selected[r.kind]===beforeRead){
     if(saved)selected[r.kind]=saved;else delete selected[r.kind];
    }
    const actual=selected[r.kind];
    if(removing?!actual:actual?.level===r.level&&actual?.choice===choice)return true;
    mark('error','This change is not on your account. You can try again.');
    ready=true;
    repaint();
   }catch{
    if(current())mark('unconfirmed','The save could not be confirmed. Check the saved change when you reconnect.');
   }
   return false;
  };
  try{
   if(checking){if(!await recover())return;}
   else{
    try{if(removing)await deleteDoc(ref);else await setDoc(ref,{level:r.level,choice});}
    catch{if(!current()||!await recover())return;}
   }
   if(!current())return;
   rewardOperations.delete(r.kind);
   // A newer snapshot of this slot takes precedence over this write's confirmation.
   const latest=selected[r.kind];
   if(latest?.level===previous?.level&&latest?.choice===previous?.choice){
    if(removing)delete selected[r.kind];else selected[r.kind]={level:r.level,choice};
   }
   repaint();
   if(!notice)return;
   const actual=selected[r.kind];
   const matches=removing?!actual:actual?.level===r.level&&actual?.choice===choice;
   notice.textContent=matches?(removing?r.name+' removed.':r.name+' equipped. '):'Your saved reward has changed. The current selection is shown below.';
   if(matches&&!removing){
    const link=element('a','View '+slots[r.kind].toLowerCase());
    link.href=href;
    notice.append(link);
   }
   animateAssessmentArrival(notice);
  }finally{
   clearTimeout(slowSave);
   if(current()){
    refreshControls();
    if(hadFocus&&document.activeElement===document.body)document.getElementById(card.id)?.querySelector('[data-display-reward-action]')?.focus({preventScroll:true});
   }
  }
 };
 card.append(button,feedback);
 if(equipped){
  const view=element('a','View '+slots[r.kind].toLowerCase());
  view.href=href;
  view.className='equipped-cover-link';card.append(view);
 }
 return card;
}
