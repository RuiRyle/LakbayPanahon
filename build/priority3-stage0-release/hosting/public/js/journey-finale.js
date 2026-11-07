import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadJourneyFinale} from './journey-finale-client.js';
const status=document.getElementById('finaleStatus'),retry=document.getElementById('retryFinale'),locked=document.getElementById('finaleLocked'),experience=document.getElementById('finaleExperience'),stage=document.getElementById('finaleStage'),back=document.getElementById('finaleBack'),next=document.getElementById('finaleNext');
let generation=0,result=null,step=0,owner=null,reflection='',alias='',speaking=false;
const message='You did it, explorer! You completed this Philippine history journey. You explored clues, worked through challenges and discovered stories of people and communities. Keep asking questions, checking evidence and caring for our shared heritage. Your adventure continues!';
const text=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;};
const link=(label,href)=>{const a=text('a',label,'text-button');a.href=href;return a;};
const noteKey=()=> 'lakbay.finale-reflection:'+owner+':'+result.definition.id;
function stopAudio(){window.LakbayNarrator?.stop();speaking=false;}
function badge(){const card=document.createElement('div');card.className='finale-earned-badge';const icon=text('span','✦','finale-badge-seal');icon.setAttribute('aria-hidden','true');card.append(icon,text('span','JOURNEY COMPLETE','eyebrow'),text('strong','Philippine History Explorer'),text('p','Earned by completing this journey’s required missions and chapter challenges.'));return card;}
function statistic(host,label,count){const item=document.createElement('div');item.append(text('strong',count===null?'Not loaded':String(count)),text('span',label));host.append(item);}
function render(focus=true){
 if(!result?.state.eligible||auth.currentUser?.uid!==owner)return;
 stopAudio();stage.replaceChildren();document.getElementById('finaleStepCount').textContent='Celebration '+(step+1)+' of 3';
 const heading=document.getElementById('finaleStepTitle');heading.textContent=['You did it, explorer!','Look at what you discovered','A keepsake for your journey'][step];
 back.hidden=step===0;next.hidden=step===2;next.textContent=step===0?'See My Discoveries':'Get My Keepsake';
 if(step===0){
  const hero=document.createElement('div');hero.className='finale-celebration';const image=document.createElement('img');image.src='../assets/brand/bayani-explorer-still.svg';image.alt='Bayani, your explorer guide';image.width=160;image.height=167;
  hero.append(image,text('p',message,'finale-bayani-message'));stage.append(hero,badge());
  const hear=text('button','Hear Bayani’s message','text-button');hear.type='button';hear.addEventListener('click',()=>{if(speaking){stopAudio();hear.textContent='Hear Bayani’s message';return;}if(!window.LakbayNarrator||window.LakbayNarrator.enabled===false){status.textContent='Narration is off or unavailable. Bayani’s message is written above.';return;}speaking=true;hear.textContent='Stop message';window.LakbayNarrator.play(message,{onend:()=>{speaking=false;hear.textContent='Hear Bayani’s message';},onerror:()=>{speaking=false;hear.textContent='Hear Bayani’s message';status.textContent='Audio could not play. You can read the message above.';}});});stage.append(hear);
 }else if(step===1){
  const stats=document.createElement('div');stats.className='finale-stat-grid';statistic(stats,'Chapters completed',result.state.totalChapters);statistic(stats,'Missions completed',result.state.totalMissions);statistic(stats,'Artifacts collected',result.artifacts?new Set(result.artifacts.map(row=>row.artifactId).filter(Boolean)).size:null);statistic(stats,'Chapter badges',result.badges?new Set(result.badges.map(row=>row.badgeId).filter(Boolean)).size:null);stage.append(stats);
  const list=document.createElement('details'),summary=text('summary','Revisit your completed chapters'),chapters=document.createElement('ul');for(const chapter of result.definition.chapters){const item=document.createElement('li');item.append(link(chapter.title,'mission.html?'+new URLSearchParams({chapter:chapter.id})));chapters.append(item);}list.append(summary,chapters);stage.append(list);
  const label=text('label','Which discovery will you remember, and why?');label.htmlFor='finaleReflection';const input=document.createElement('textarea');input.id='finaleReflection';input.maxLength=1000;input.rows=4;input.value=reflection;input.placeholder='I will remember… because…';input.addEventListener('input',()=>reflection=input.value);
  const hint=text('p','Optional and ungraded. Your note is saved only on this browser when you choose Save. Keep personal contact details out.','finale-small');
  const save=text('button','Save My Thought','text-button'),clear=text('button','Clear My Thought','text-button'),saved=text('p','');saved.setAttribute('role','status');save.type=clear.type='button';
  save.addEventListener('click',()=>{if(auth.currentUser?.uid!==owner)return;try{localStorage.setItem(noteKey(),reflection);saved.textContent='Your thought is saved on this browser.';}catch{saved.textContent='This browser could not save your thought. Copy it before leaving.';}});
  clear.addEventListener('click',()=>{if(auth.currentUser?.uid!==owner)return;reflection='';input.value='';try{localStorage.removeItem(noteKey());saved.textContent='Your saved thought was cleared on this browser.';}catch{saved.textContent='The visible thought is cleared, but browser storage could not be updated.';}});stage.append(label,input,hint,save,clear,saved);
 }else{
  stage.append(badge(),text('p','Your missions gave you artifacts, your chapters earned badges, and your levels unlocked explorer styles. This badge marks finishing the whole selected journey.'));
  const nameLabel=text('label','Explorer name on your keepsake');nameLabel.htmlFor='finaleAlias';const name=document.createElement('input');name.id='finaleAlias';name.maxLength=40;name.value=alias;name.addEventListener('input',()=>alias=name.value);stage.append(nameLabel,name,text('p','The card downloads to your device. It is a system achievement, not an official school certificate.','finale-small'));
  const download=text('button','Download My Completion Card','primary-button');download.type='button';download.addEventListener('click',()=>downloadCard(download));stage.append(download);
  const choices=document.createElement('div');choices.className='finale-return-links';choices.append(link('Explore My Museum','achievements.html'),link('Review My Topics','my-journey.html'),link('Revisit the Timeline','history-timeline.html'));stage.append(text('h3','Your adventure continues'),choices);
  const replay=text('button','Replay This Celebration','text-button');replay.type='button';replay.addEventListener('click',()=>{step=0;render();});stage.append(replay,text('p','Your progress and collections stay saved. Replaying this ending gives no extra XP or duplicate rewards.','finale-small'));
 }
 if(focus){heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:'instant'});}
}
function downloadCard(button){
 if(!result?.state.eligible||auth.currentUser?.uid!==owner)return;const request=generation,uid=owner;
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;const ctx=canvas.getContext('2d');if(!ctx){status.textContent='This browser cannot create the card. Your achievement stays available here.';return;}
 ctx.fillStyle='#0b2034';ctx.fillRect(0,0,1200,800);ctx.strokeStyle='#dfbd70';ctx.lineWidth=3;ctx.strokeRect(30,30,1140,740);ctx.strokeRect(42,42,1116,716);ctx.textAlign='center';ctx.fillStyle='#e7c77f';ctx.font='bold 26px sans-serif';ctx.fillText('LAKBAYPANAHON · JOURNEY COMPLETE',600,110);
 ctx.beginPath();ctx.arc(600,225,65,0,Math.PI*2);ctx.fill();ctx.fillStyle='#15384b';ctx.font='64px sans-serif';ctx.fillText('✦',600,247);
 ctx.fillStyle='#f0f3ed';ctx.font='bold 44px sans-serif';ctx.fillText('Philippine History Explorer',600,350);ctx.font='38px sans-serif';ctx.fillText((alias.trim()||'Explorer').slice(0,40),600,420,1050);
 ctx.fillStyle='#cbdde6';ctx.font='26px sans-serif';ctx.fillText('Completed '+result.state.totalChapters+' chapters and '+result.state.totalMissions+' missions',600,495);
 const date=result.state.completedAt?new Intl.DateTimeFormat('en-PH',{dateStyle:'long',timeZone:'Asia/Manila'}).format(new Date(result.state.completedAt)):'Completion date unavailable';ctx.fillText(date,600,540);ctx.font='23px sans-serif';ctx.fillText('Keep asking questions. Follow the evidence. Care for our shared heritage.',600,615);ctx.font='18px sans-serif';ctx.fillText('Selected learning journey · System achievement · Not an official school certificate',600,710);
 button.disabled=true;canvas.toBlob(blob=>{if(request!==generation||auth.currentUser?.uid!==uid)return;button.disabled=false;if(!blob){status.textContent='The card could not be created. Please try again.';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LakbayPanahon-Journey-Complete.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Your completion card is ready to download.';},'image/png');
}
async function load(){
 const request=++generation;owner=auth.currentUser?.uid||null;const uid=owner;result=null;reflection='';alias='';step=0;stopAudio();stage.replaceChildren();locked.hidden=experience.hidden=true;retry.disabled=true;status.textContent=uid?'Checking saved mission and chapter completions...':'Sign in to view your journey finale.';if(!uid)return;
 try{
  const data=await loadJourneyFinale(uid,{collections:true});if(request!==generation||auth.currentUser?.uid!==uid)return;result=data;
  if(!data.state.eligible){locked.hidden=false;document.getElementById('finaleRemaining').textContent=data.state.chapterCount+' of '+data.state.totalChapters+' chapters and '+data.state.missionCount+' of '+data.state.totalMissions+' missions completed.';const progress=document.getElementById('finaleProgress');progress.max=data.state.totalChapters;progress.value=data.state.chapterCount;status.textContent='Your saved progress is up to date. Keep going at your own pace.';return;}
  alias=String(data.profile.firstName||'Explorer').slice(0,40);try{reflection=(localStorage.getItem(noteKey())||'').slice(0,1000);}catch{}
  experience.hidden=false;status.textContent='Journey complete. Your badge and keepsake are unlocked from saved progress; no extra XP is added.';render(false);
 }catch{if(request===generation)status.textContent='Your finale progress could not be verified. Check your connection and use Refresh Progress. Your saved learning is unchanged.';}
 finally{if(request===generation)retry.disabled=false;}
}
back.addEventListener('click',()=>{if(step>0){step--;render();}});next.addEventListener('click',()=>{if(step<2){step++;render();}});retry.addEventListener('click',load);onAuthStateChanged(auth,load);
window.addEventListener('pagehide',()=>{generation++;result=null;reflection='';alias='';stage.replaceChildren();locked.hidden=experience.hidden=true;stopAudio();});
window.addEventListener('pageshow',event=>{if(event.persisted)load();});
document.addEventListener('lakbay:narration-state',event=>{speaking=event.detail?.active===true;const button=stage.querySelector('button');if(step===0&&button){button.textContent=speaking?'Stop message':'Hear Bayani’s message';button.setAttribute('aria-pressed',String(speaking));}});
