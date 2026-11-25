import {watchDisplayRewards,displayCard,rewardLabel,rewardArt} from './display-rewards.js';
import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {doc,getDocFromServer,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {rewardTrack,nextMilestone,explorerRewards,explorerRewardState,equippedExplorerFrame,unframedExplorer} from './level-reward-policy.js';
import {saveStudentAppearance} from './classmate-appearance.js';

const host=document.getElementById('levelRewardsCollection');
let generation=0,uid=null,state=null,frameId='none',saving=false,cosmeticsReady=false,stops=[],previousLevel=null;
let failedFrame = null;
let pendingFrame = null;
const text=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;};
let totalXp=null,stepXp=null;
function paintFrame(){
 const equipped=cosmeticsReady&&auth.currentUser?.uid===uid&&state?equippedExplorerFrame(state.level,frameId):null;
 for(const avatar of document.querySelectorAll('.profile-avatar,[data-student-avatar]:not(.student-profile-preview)')){
  if(equipped===null||equipped===unframedExplorer)delete avatar.dataset.levelFrame;
  else if(avatar.dataset.levelFrame!==equipped)avatar.dataset.levelFrame=equipped;
 }
 const label=document.getElementById('profileEquippedFrame');
 if(label){
  const reward=explorerRewards.find(item=>item.frameId===equipped);
  const copy=equipped===unframedExplorer?'No frame equipped':reward?reward.frameName+' frame equipped':'';
  if(label.textContent!==copy)label.textContent=copy;
  label.hidden=!copy;
 }
}
function updateSummary(){
 const dashboardTitle=document.getElementById('dashboardExplorerTitle');
 if(dashboardTitle)dashboardTitle.textContent=state?.title??'';
 const preview=document.getElementById('nextExplorerReward');
 if(preview){
  preview.replaceChildren();
  if(state){
   const next=nextMilestone(state.level);
   if(next){
    preview.append(
     text('small','NEXT REWARD · LOCKED','next-reward-status'),
     rewardArt(next),
     text('strong',rewardLabel(next)),
     text('span','Unlocks at Level '+next.level+(Number.isSafeInteger(totalXp)&&stepXp?' \u00b7 '+Math.max(0,(next.level-1)*stepXp-totalXp)+' XP to go':''))
    );
   }else{
    preview.append(text('strong','All level rewards unlocked'),text('span','Keep building your history journey!'));
   }
   const link=text('a','View Level Rewards');
   link.href='my-profile.html#levelRewardsCollection';
   preview.append(link);
  }else preview.textContent='Level rewards will appear when your saved level is available.';
 }
 const identity=document.querySelector('.profile-identity-copy');
 if(identity){let title=document.getElementById('profileExplorerTitle');if(!title){title=text('p','','explorer-earned-title');title.id='profileExplorerTitle';identity.append(title);}title.textContent=state?state.title+' · Level '+state.level:'';}
}
const categories=new Map([
 ['frame','Avatar frames'],['journal','Journal covers'],['banner','Profile banners'],
 ['journey','Journey covers'],['artifact','Featured artifact']
]);
function linkedCategory(){
 return rewardTrack.find(r=>'#reward-level-'+r.level===location.hash)?.kind;
}
let category=linkedCategory()||'frame';
let openedLinkedFrame=false;
window.addEventListener('hashchange',()=>{
 const linked=linkedCategory();
 if(host&&linked){category=linked;renderCollection();document.getElementById(location.hash.slice(1))?.scrollIntoView();}
});
function renderCollection(){
 if(!host)return;
 const focused=host.contains(document.activeElement)?document.activeElement:null;
 const focusedFrame=focused?.dataset.frameId,focusedStatus=focused?.id==='levelRewardsStatus';
 const openPreview=host.querySelector('.level-frame-preview[open]')?.dataset.previewFrame;
 const equippedFrame=state&&cosmeticsReady?equippedExplorerFrame(state.level,frameId):null;
 const equippedReward=explorerRewards.find(reward=>reward.frameId===equippedFrame);
 const header=text('header','','level-rewards-heading');
 const intro=text('div','');
 intro.append(text('span','EXPLORER REWARDS','eyebrow'),text('h2','Explorer reward track'),text('p','Choose a reward to personalize your explorer.'));
 header.append(intro);
 const summary=text('dl','','level-rewards-summary');
 if(equippedFrame!==null)summary.append(text('dt','Wearing now'),text('dd',equippedReward?.frameName||'No frame'));
 if(state && nextMilestone(state.level))summary.append(text('dt','Next unlock'),text('dd',rewardLabel(nextMilestone(state.level))));
 if(summary.childElementCount)header.append(summary);
 host.replaceChildren(header);
 const status=text('p',saving?'Saving your frame...':state?(cosmeticsReady?'Your frame choice saves to your account.':'Checking your saved frame...'):'Loading your saved level...');status.id='levelRewardsStatus';status.tabIndex=-1;status.setAttribute('role','status');host.append(status);
 if(!state)return;
 const linkedFrame = !openedLinkedFrame && new URLSearchParams(location.search).get('preview') === 'frame'
  ? explorerRewards.find(reward => reward.level <= state.level && '#reward-level-' + reward.level === location.hash)?.frameId
  : null;
 const filters=text('div','','reward-category-list');
 filters.setAttribute('role','group');filters.setAttribute('aria-label','Reward categories');
 for(const [kind,label] of categories){
  const button=text('button','');button.type='button';button.dataset.category=kind;
  const sample = rewardTrack.find(reward => reward.kind === kind && (kind !== 'frame' || reward.level > 1));
  if (sample) {
   const thumbnail=document.createElement('img');
   thumbnail.className='reward-category-thumbnail';
   thumbnail.alt='';
   thumbnail.width=28;
   thumbnail.height=24;
   thumbnail.src=sample.art?'../assets/atlas/'+sample.art:'../assets/brand/lakbay-sun.svg';
   button.append(thumbnail);
  }
  button.append(text('span',label,'reward-category-label'));
  button.setAttribute('aria-pressed',String(kind===category));
  button.setAttribute('aria-controls','rewardCategoryCards');
  button.onclick=()=>{category=kind;renderCollection();};
  filters.append(button);
 }
 host.append(filters);
 const items=rewardTrack.filter(r=>r.kind===category);
 const count=items.filter(r=>r.level<=state.level).length;
 const heading=text('h3',categories.get(category),'reward-category-heading');
 heading.append(text('small',count+' of '+items.length+' unlocked'));
 host.append(heading);
 const grid=document.createElement('div');grid.className='level-reward-grid';grid.id='rewardCategoryCards';
 for(const reward of items){
  if(reward.kind!=='frame'){grid.append(displayCard(reward,state.level,renderCollection));continue;}
  const unlocked=state.level>=reward.level,equipped=equippedFrame===reward.frameId;
  const card=document.createElement('article');card.className='level-reward-card';card.id='reward-level-'+reward.level;card.dataset.unlocked=String(unlocked);card.dataset.equipped=String(equipped);
  const sample=text('span','','level-frame-sample');sample.dataset.levelFrame=reward.frameId;sample.setAttribute('aria-hidden','true');
  const seal=document.createElement('img');
  seal.src='../assets/brand/lakbay-sun.svg';
  seal.alt='';
  sample.append(seal);
  card.append(sample,text('span',equipped?'Wearing now':unlocked?'Owned':'Unlocks at Level '+reward.level,'reward-ownership'),text('h3',reward.frameName),text('p',reward.title+' title'),text('p','Appears around your avatar on My Profile and in the student header.'));
  const button=text('button',!unlocked?'Locked':equipped?'Unequip Frame':'Equip Frame');button.type='button';button.disabled=!unlocked||saving||!cosmeticsReady;button.setAttribute('aria-label',(equipped?'Unequip ':unlocked?'Equip ':'Unlock at Level '+reward.level+': ')+reward.frameName+' frame');
  button.dataset.frameId=reward.frameId;
  const checking=pendingFrame?.triedFrame===reward.frameId;
  if(pendingFrame){
   button.disabled=!unlocked||saving||!checking;
   if(checking){button.textContent='Check Saved Change';button.setAttribute('aria-label','Check saved change for '+reward.frameName+' frame');}
  }
  button.addEventListener('click',()=>equip(checking?pendingFrame.selected:equipped?unframedExplorer:reward.frameId));card.append(button);
  if (checking||failedFrame === reward.frameId) {
   const error = text('p',checking?'The save could not be confirmed. Check the saved change when you reconnect.':'This change is not on your account. You can try this frame again.','lp-status-panel display-reward-feedback');
   error.id = 'frame-save-error-' + reward.level;
   error.dataset.state = 'error';
   button.setAttribute('aria-describedby',error.id);
   card.append(error);
  }
  const preview=document.createElement('details');preview.className='level-frame-preview';preview.name='avatar-frame-preview';preview.dataset.previewFrame=reward.frameId;
  const summary=text('summary','Preview on your avatar');
  summary.setAttribute('aria-label','Preview on your avatar: '+reward.frameName);
  const portrait=text('span','','level-frame-preview-portrait');
  portrait.dataset.levelFrame=reward.frameId;
  portrait.setAttribute('aria-hidden','true');
  const previewNote=equipped?'This frame is on your avatar.':unlocked?'Preview only. Use Equip Frame to save it.':'Preview only. Unlocks at Level '+reward.level+'.';
  preview.append(summary,portrait,text('p',previewNote,'level-frame-preview-note'));
  preview.addEventListener('toggle',()=>{
   if(!preview.open)return;
   const currentAvatar=document.querySelector('.profile-page-avatar');
   const image=currentAvatar?.querySelector('img');
   const name=document.getElementById('profilePageName')?.textContent.trim();
   const initial=currentAvatar?.textContent.trim()||Array.from(name||'S')[0].toLocaleUpperCase();
   if(image && (!image.complete || image.naturalWidth)){
    const copy=image.cloneNode();
    copy.addEventListener('error',()=>{if(copy.parentNode===portrait)portrait.textContent=initial;},{once:true});
    portrait.replaceChildren(copy);
   }else portrait.textContent=initial;
  });
  const openFromLink=linkedFrame===reward.frameId;
  preview.open=openPreview===reward.frameId||openFromLink;
  if(openFromLink){
   openedLinkedFrame=true;
   requestAnimationFrame(()=>{if(card.isConnected)card.scrollIntoView({block:'nearest'});});
  }
  card.append(preview);
  grid.append(card);
 }
 host.append(grid);
 if(focused?.dataset.category)filters.querySelector('[data-category="'+focused.dataset.category+'"]').focus({preventScroll:true});
 const focusedPreview=focused?.closest('.level-frame-preview')?.dataset.previewFrame;
 if(focused?.dataset.displayRewardAction){
  const replacement=document.getElementById(focused.closest('.level-reward-card')?.id)?.querySelector('button');
  (!replacement||replacement.disabled?status:replacement).focus({preventScroll:true});
 }
 if(focusedFrame||focusedStatus||focusedPreview){
  const target=focusedFrame?grid.querySelector('[data-frame-id="'+focusedFrame+'"]'):focusedPreview?grid.querySelector('[data-preview-frame="'+focusedPreview+'"] summary'):null;
  (!target||target.disabled?status:target).focus({preventScroll:true});
 }
}
const rewardNotice = {
 frame: ['Preview frame','Try it around your avatar in My Profile.'],
 journal: ['View journal cover','Equip it to change the cover of your Evidence Journal.'],
 banner: ['View profile banner','Equip it to change the artwork at the top of My Profile.'],
 journey: ['View journey cover','Equip it to change the cover of My Journey.'],
 artifact: ['Choose featured artifact','Pick a collected keepsake to show in your profile.'],
};
function celebrate(level){
 const key='lakbay.level-rewards.seen:'+uid;let previous=previousLevel;
 try{const stored=Number(sessionStorage.getItem(key));if(Number.isSafeInteger(stored)&&stored>0)previous=previous===null?stored:Math.max(previous,stored);sessionStorage.setItem(key,String(Math.max(previous||0,level)));}catch{}
 previousLevel=level;
 if(previous===null||level<=previous)return;
 document.getElementById('explorerLevelCelebration')?.remove();
 const banner=document.createElement('aside');banner.id='explorerLevelCelebration';banner.className='explorer-level-celebration';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');banner.setAttribute('aria-atomic','true');
 const unlocked=rewardTrack.filter(reward=>reward.level>previous&&reward.level<=level);
 const latest=unlocked[unlocked.length-1];
 if(latest?.kind==='journal')banner.dataset.rewardKind='journal';
 const notice=latest&&rewardNotice[latest.kind];
 const badge=text('span','\u2605','level-celebration-star');badge.setAttribute('aria-hidden','true');
 const copy=text('div','','level-celebration-copy');
 copy.append(
  text('span',latest?'LEVEL '+level+' · REWARD UNLOCKED':'LEVEL '+level,'level-celebration-eyebrow'),
  text('strong',latest?rewardLabel(latest):'Keep exploring'),
  text('p',latest
   ? ((unlocked.length>1?'You unlocked '+unlocked.length+' rewards. ':'')+(notice?.[1]||'Find them in My Profile.'))
   : nextMilestone(level)?'Next reward: '+rewardLabel(nextMilestone(level))+' at Level '+nextMilestone(level).level+'.':'Your earned rewards are available in My Profile.')
 );
 banner.append(latest?rewardArt(latest):badge,copy);
 const link=text('a',notice?.[0]||'View level rewards');
 link.href='my-profile.html'+(latest?.kind==='frame'?'?preview=frame':'')+'#'+(latest?'reward-level-'+latest.level:'levelRewardsCollection');
 const close=text('button','Dismiss');close.type='button';close.addEventListener('click',()=>banner.remove());const actions=text('div','','level-celebration-actions');actions.append(link,close);banner.append(actions);document.body.append(banner);
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('lakbay-reduce-motion')&&banner.getClientRects().length)banner.animate?.([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
}
async function equip(selected){
 const checking=Boolean(pendingFrame);
 if(saving||(!cosmeticsReady&&!checking)||!state||auth.currentUser?.uid!==uid||equippedExplorerFrame(state.level,selected)!==selected)return;
 const removing=selected===unframedExplorer;
 const triedFrame=pendingFrame?.triedFrame??(removing?frameId:selected);
 const hadFocus=document.activeElement?.dataset.frameId===triedFrame;
 failedFrame = null;
 const request=generation,owner=uid;
 const current=()=>request===generation&&auth.currentUser?.uid===owner;
 const originalFrame=frameId;
 const finish=()=>{
  const restore=hadFocus&&(document.activeElement===document.body||document.activeElement?.id==='levelRewardsStatus');
  saving=false;renderCollection();paintFrame();
  if(restore)host.querySelector('[data-frame-id="'+triedFrame+'"]')?.focus({preventScroll:true});
 };
 const recover=async()=>{
  const beforeRead=frameId;
  try{
   const snapshot=await getDocFromServer(doc(db,'studentCosmetics',owner));
   if(!current())return false;
   if(snapshot.metadata?.hasPendingWrites)throw Error('Frame write pending');
   if(frameId===beforeRead)frameId=snapshot.exists()?snapshot.data().frameId:unframedExplorer;
   cosmeticsReady=true;pendingFrame=null;
   if(frameId===selected)return true;
   failedFrame=triedFrame;
  }catch{
   if(!current())return false;
   pendingFrame={triedFrame,selected};
  }
  finish();return false;
 };
 saving=true;renderCollection();const status=document.getElementById('levelRewardsStatus');if(status)status.textContent=checking?'Checking your saved frame...':removing?'Removing your frame...':'Saving your frame...';
 const slowSave=setTimeout(()=>{
  const waiting=document.getElementById('levelRewardsStatus');
  if(current()&&waiting)waiting.textContent='Still checking your saved frame. Keep this page open and reconnect if needed.';
 },6000);
 try{
  if(checking){if(!await recover())return;}
  else{
   try{await saveStudentAppearance(owner,'studentCosmetics',{frameId:selected,updatedAt:serverTimestamp()});}
   catch{if(!current()||!await recover())return;}
  }
  if(!current())return;
  if(frameId===originalFrame)frameId=selected;
  pendingFrame=null;
  finish();
  const saved=document.getElementById('levelRewardsStatus');
  if(saved){
   const reward=explorerRewards.find(item=>item.frameId===selected);
   saved.textContent=frameId!==selected?'Your saved frame has changed. Your current frame is shown below.':removing?'Frame unequipped.':reward.frameName+' is equipped.';
   if(document.getElementById('profileEquippedFrame')){
    const view=text('a','View on your profile','level-frame-view');
    view.href='#profileEquippedFrame';
    saved.after(view);
   }
  }
 }finally{clearTimeout(slowSave);if(current()&&saving)finish();}
}
function start(user){
 failedFrame = null;
 pendingFrame = null;
 if(uid!==user?.uid)openedLinkedFrame=false;
 generation++;for(const stop of stops)stop();stops=[];uid=user?.uid||null;state=null;frameId='none';saving=false;cosmeticsReady=false;previousLevel=null;document.getElementById('explorerLevelCelebration')?.remove();paintFrame();updateSummary();renderCollection();
 totalXp=null;stepXp=null;stops.push(watchDisplayRewards(uid,()=>state?.level||0,renderCollection));
 if(!uid){const status=document.getElementById('levelRewardsStatus');if(status)status.textContent='Sign in to view your level rewards.';return;}
 const request=generation,owner=uid,current=()=>request===generation&&auth.currentUser?.uid===owner;
 const fail=()=>{if(!current())return;cosmeticsReady=false;renderCollection();paintFrame();const status=document.getElementById('levelRewardsStatus');if(status){status.textContent='Level rewards could not load. ';const retry=text('button','Try Again');retry.type='button';retry.addEventListener('click',()=>start(auth.currentUser));status.append(retry);}};
 if(document.getElementById('nextExplorerReward'))stops.push(onSnapshot(doc(db,'learningSettings','progression'),row=>{if(current()){stepXp=row.data()?.xpPerLevel;updateSummary();}},()=>{}));
 stops.push(onSnapshot(doc(db,'users',owner),snapshot=>{
  if(!current()||snapshot.metadata?.hasPendingWrites)return;
  const profile=snapshot.exists()?snapshot.data():null;
  state=profile?.role==='student'&&profile.status==='active'?explorerRewardState(profile.level??(profile.xp===0?1:null)):null;
  totalXp=profile?.xp;window.dispatchEvent(new Event('explorer-level-ready'));
  if(state&&!snapshot.metadata?.fromCache)celebrate(state.level);else if(!state)document.getElementById('explorerLevelCelebration')?.remove();
  updateSummary();renderCollection();paintFrame();
 },()=>{if(current()){state=null;updateSummary();paintFrame();fail();}}));
 stops.push(onSnapshot(doc(db,'studentCosmetics',owner),snapshot=>{
  if(!current()||snapshot.metadata?.hasPendingWrites)return;
  frameId=snapshot.exists()?snapshot.data().frameId:'none';cosmeticsReady=true;if(!saving)renderCollection();paintFrame();
 },fail));
}
function stopCelebrationMotion(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion'))for(const animation of document.getElementById('explorerLevelCelebration')?.getAnimations?.()||[])animation.cancel();}
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');motionPreference.addEventListener('change',stopCelebrationMotion);
const observer=new MutationObserver(()=>{paintFrame();stopCelebrationMotion();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
onAuthStateChanged(auth,start);
window.addEventListener('pagehide',()=>{generation++;for(const stop of stops)stop();stops=[];observer.disconnect();motionPreference.removeEventListener('change',stopCelebrationMotion);});
window.addEventListener('pageshow',event=>{if(event.persisted){motionPreference.addEventListener('change',stopCelebrationMotion);observer.observe(document.body,{subtree:true,childList:true});start(auth.currentUser);}});
