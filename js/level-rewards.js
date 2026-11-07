import {auth,db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {doc,onSnapshot,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {explorerRewards,explorerRewardState,equippedExplorerFrame} from './level-reward-policy.js';

const host=document.getElementById('levelRewardsCollection');
let generation=0,uid=null,state=null,frameId='none',saving=false,cosmeticsReady=false,stops=[],previousLevel=null;
const text=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;};
function paintFrame(){
 const equipped=auth.currentUser?.uid===uid&&state?equippedExplorerFrame(state.level,frameId):'none';
 for(const avatar of document.querySelectorAll('.profile-avatar,[data-student-avatar]:not(.student-profile-preview)'))if(avatar.dataset.levelFrame!==equipped)avatar.dataset.levelFrame=equipped;
}
function updateSummary(){
 let preview=document.getElementById('nextExplorerReward');const anchor=document.getElementById('nextLevelText');
 if(!preview&&anchor){preview=text('p','','next-explorer-reward');preview.id='nextExplorerReward';anchor.after(preview);}
 if(preview){preview.replaceChildren();if(state){preview.append(text('strong',state.title+' · Level '+state.level));preview.append(text('span',state.next?'Next reward at Level '+state.next.level+': '+state.next.title+' title and '+state.next.frameName+' frame.':'All explorer frames are unlocked. Keep building your history journey!'));const link=text('a','View Level Rewards');link.href='my-profile.html#levelRewardsCollection';preview.append(link);}else preview.textContent='Level rewards will appear when your saved level is available.';}
 const identity=document.querySelector('.profile-identity-copy');
 if(identity){let title=document.getElementById('profileExplorerTitle');if(!title){title=text('p','','explorer-earned-title');title.id='profileExplorerTitle';identity.append(title);}title.textContent=state?state.title+' · Level '+state.level:'';}
}
function renderCollection(){
 if(!host)return;const focused=host.contains(document.activeElement)?document.activeElement:null,focusedFrame=focused?.dataset.frameId,focusedStatus=focused?.id==='levelRewardsStatus';host.replaceChildren();host.append(text('span','YOUR EXPLORER REWARDS','eyebrow'),text('h2','Make your progress yours'),text('p','Earn titles and avatar frames as your level grows. These rewards change your look, not your quiz scores or access to lessons.'));
 const status=text('p',saving?'Saving your frame...':state?(cosmeticsReady?'Choose an unlocked frame. Your choice is saved to your account.':'Checking your saved frame...'):'Loading your saved level...');status.id='levelRewardsStatus';status.tabIndex=-1;status.setAttribute('role','status');status.setAttribute('aria-live','polite');host.append(status);
 if(!state)return;
 const grid=document.createElement('div');grid.className='level-reward-grid';
 for(const reward of explorerRewards){
  const unlocked=state.level>=reward.level,equipped=equippedExplorerFrame(state.level,frameId)===reward.frameId;
  const card=document.createElement('article');card.className='level-reward-card';card.dataset.unlocked=String(unlocked);
  const sample=text('span','✦','level-frame-sample');sample.dataset.levelFrame=reward.frameId;sample.setAttribute('aria-hidden','true');
  card.append(sample,text('span',unlocked?'Unlocked · Level '+reward.level:'Unlock at Level '+reward.level,'level-reward-state'),text('h3',reward.title),text('p',reward.frameName+' frame'));
  const button=text('button',!unlocked?'Keep exploring':equipped?'Equipped':'Equip Frame');button.type='button';button.disabled=!unlocked||equipped||saving||!cosmeticsReady;button.setAttribute('aria-label',(unlocked?'Equip ':'Unlock at Level '+reward.level+': ')+reward.frameName+' frame');button.setAttribute('aria-pressed',String(unlocked&&equipped));
  button.dataset.frameId=reward.frameId;
  button.addEventListener('click',()=>equip(reward.frameId));card.append(button);grid.append(card);
 }
 host.append(grid);
 if(focusedFrame||focusedStatus){const target=focusedFrame?grid.querySelector('[data-frame-id="'+focusedFrame+'"]'):null;(!target||target.disabled?status:target).focus({preventScroll:true});}
}
function celebrate(level){
 const key='lakbay.level-rewards.seen:'+uid;let previous=previousLevel;
 try{const stored=Number(sessionStorage.getItem(key));if(Number.isSafeInteger(stored)&&stored>0)previous=previous===null?stored:Math.max(previous,stored);sessionStorage.setItem(key,String(Math.max(previous||0,level)));}catch{}
 previousLevel=level;
 if(previous===null||level<=previous)return;
 document.getElementById('explorerLevelCelebration')?.remove();
 const banner=document.createElement('aside');banner.id='explorerLevelCelebration';banner.className='explorer-level-celebration';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');banner.setAttribute('aria-atomic','true');
 const unlocked=explorerRewards.filter(reward=>reward.level>previous&&reward.level<=level);
 const rewardState=explorerRewardState(level),badge=text('span','\u2605','level-celebration-star');badge.setAttribute('aria-hidden','true');
 const copy=text('div','','level-celebration-copy');copy.append(text('span',unlocked.length?'NEW EXPLORER REWARD':'YOUR JOURNEY IS GROWING','level-celebration-eyebrow'),text('strong','Level '+level+'! Keep exploring.'),text('p',unlocked.length?'You unlocked '+unlocked.map(reward=>reward.title+' and the '+reward.frameName+' frame').join('; ')+'.':rewardState.next?'Next reward: '+rewardState.next.title+' at Level '+rewardState.next.level+'.':'All explorer frames are unlocked. Your earned rewards stay available as you continue your history journey.'));banner.append(badge,copy);
 const link=text('a','See My Rewards');link.href='my-profile.html#levelRewardsCollection';const close=text('button','Dismiss');close.type='button';close.addEventListener('click',()=>banner.remove());const actions=text('div','','level-celebration-actions');actions.append(link,close);banner.append(actions);document.body.append(banner);
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('lakbay-reduce-motion'))banner.animate?.([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
}
async function equip(selected){
 if(saving||!cosmeticsReady||!state||auth.currentUser?.uid!==uid||equippedExplorerFrame(state.level,selected)!==selected)return;
 const request=generation,owner=uid; saving=true;renderCollection();const status=document.getElementById('levelRewardsStatus');if(status)status.textContent='Saving your frame...';
 try{
  await setDoc(doc(db,'studentCosmetics',owner),{frameId:selected,updatedAt:serverTimestamp()});
  if(request!==generation||auth.currentUser?.uid!==owner)return;
  frameId=selected;saving=false;renderCollection();paintFrame();const saved=document.getElementById('levelRewardsStatus');if(saved)saved.textContent='Your frame is saved to your account.';
 }catch{
  if(request!==generation)return;saving=false;renderCollection();const failed=document.getElementById('levelRewardsStatus');if(failed)failed.textContent='Your frame could not be saved. Check your connection and choose Equip Frame to try again.';
 }
}
function start(user){
 generation++;for(const stop of stops)stop();stops=[];uid=user?.uid||null;state=null;frameId='none';saving=false;cosmeticsReady=false;previousLevel=null;document.getElementById('explorerLevelCelebration')?.remove();paintFrame();updateSummary();renderCollection();
 if(!uid){const status=document.getElementById('levelRewardsStatus');if(status)status.textContent='Sign in to view your level rewards.';return;}
 const request=generation,owner=uid,current=()=>request===generation&&auth.currentUser?.uid===owner;
 const fail=()=>{if(!current())return;cosmeticsReady=false;renderCollection();const status=document.getElementById('levelRewardsStatus');if(status){status.textContent='Level rewards could not load. ';const retry=text('button','Try Again');retry.type='button';retry.addEventListener('click',()=>start(auth.currentUser));status.append(retry);}};
 stops.push(onSnapshot(doc(db,'users',owner),snapshot=>{
  if(!current()||snapshot.metadata?.hasPendingWrites)return;
  const profile=snapshot.exists()?snapshot.data():null;
  state=profile?.role==='student'&&profile.status==='active'?explorerRewardState(profile.level??(profile.xp===0?1:null)):null;
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
