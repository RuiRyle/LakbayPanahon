import {auth,db} from './firebase-config.js';
import {collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const artNames={
 'early-philippine-communities':'maritime',
 'spanish-exploration-colonial-rule':'navigation',
 'colonial-economic-social-cultural-change':'archive',
 'resistance-national-consciousness':'voices'
};
const chapterScenes={
 'chapter-1':'../assets/story/chapter-1-mission-1-scene-1.png',
 'chapter-2':'../assets/story/chapter-2-mission-1-scene-1.png',
 'chapter-3':'../assets/story/chapter3-mission1-scene1.png'
};
let renderVersion=0;
const text=(tag,value,cls)=>{const node=document.createElement(tag);node.textContent=value;if(cls)node.className=cls;return node;};
document.addEventListener('lakbay:era-rendered',async event=>{
 const version=++renderVersion,uid=auth.currentUser?.uid;
 const {era,destinations}=event.detail;
 const art=document.getElementById('eraOverviewArt');art.replaceChildren();
 const image=document.createElement('img');
 const scene=era.id==='early-philippine-communities'?'../assets/story/chapter3-mission1-scene1.png':null;
 image.src=scene||'../assets/atlas/'+(artNames[era.id]||'navigation')+'.svg';image.alt='';image.decoding='async';
 art.dataset.artwork=scene?'historical':'symbolic';
 image.addEventListener('error',()=>{image.src='../assets/atlas/'+(artNames[era.id]||'navigation')+'.svg';art.dataset.artwork='symbolic';art.querySelector('.era-art-caption').textContent='Symbolic editorial illustration';},{once:true});
 art.append(image,text('span',scene?'From the maritime trade lesson · editorial illustration':'Symbolic editorial illustration','era-art-caption'));
 const percent=destinations.length?Math.round(destinations.filter(row=>row.isCompleted).length/destinations.length*100):0;
 document.getElementById('eraCompletionPercent').textContent=percent+'%';
 const action=document.getElementById('eraContinue');if(!action.hidden)action.textContent=destinations.every(row=>row.isCompleted)?'Review a chapter':'Continue Learning';
 const cards=[...document.querySelectorAll('#chapterList .chapter-card')];
 let currentMarked=false;
 for(const [index,card]of cards.entries()){
  const destination=destinations[index];if(!destination)continue;
  const available=destination.isUnlocked&&destination.isContentReady;
  card.dataset.expeditionState=destination.isCompleted?'completed':available&&!currentMarked?'current':available?'available':'locked';
  if(available&&!destination.isCompleted&&!currentMarked)currentMarked=true;
  const button=card.querySelector('.chapter-button');
  if(!button.disabled)button.textContent=destination.isCompleted?'Review Chapter':'Continue Chapter';
  if(!available){const hint=text('p',destination.isContentReady?'Complete the required earlier chapters to open this chapter.':'This chapter is being prepared.','era-chapter-requirement');card.querySelector('.chapter-content').append(hint);}
  const progress=text('p','Checking saved mission progress…','era-mission-progress');card.querySelector('.chapter-content').insertBefore(progress,button);
  const side=text('div','','era-chapter-actions');
  const status=card.querySelector('.chapter-label');
  if(status)side.append(status);side.append(button);
  const requirement=card.querySelector('.era-chapter-requirement');if(requirement)side.append(requirement);
  card.append(side);
  const milestone=card.querySelector('.chapter-number');const visual=text('div','','era-chapter-visual');
  if(milestone)visual.append(milestone);
  const sceneUrl=chapterScenes[destination.chapter.id];
  if(sceneUrl){const thumb=document.createElement('img');thumb.src=sceneUrl;thumb.alt='';thumb.loading='lazy';thumb.decoding='async';thumb.addEventListener('error',()=>thumb.remove(),{once:true});visual.append(thumb);}
  card.prepend(visual);
 }
 // The existing objectives remain intact; icons are purely decorative.
 for(const item of document.querySelectorAll('#eraDiscoveryList li'))item.classList.add('era-discovery-tile');
 if(!uid)return;
 try{
  const [missions,progress]=await Promise.all([
   getDocs(query(collection(db,'missions'),where('status','==','active'))),
   getDocs(query(collection(db,'studentProgress'),where('userId','==',uid)))
  ]);
  if(version!==renderVersion||auth.currentUser?.uid!==uid)return;
  const owned=new Set(progress.docs.map(row=>row.data()).filter(row=>row.userId===uid&&row.completed===true).map(row=>row.missionId));
  const catalog=missions.docs.map(row=>({...row.data(),id:row.id}));
  cards.forEach((card,index)=>{const destination=destinations[index];if(!destination)return;const rows=catalog.filter(row=>row.chapterId===destination.chapter.id);const done=rows.filter(row=>owned.has(row.id)).length;const label=card.querySelector('.era-mission-progress');label.textContent=rows.length?done+' / '+rows.length+' missions complete':'No missions published yet';
   if(rows.length){const meter=document.createElement('progress');meter.max=rows.length;meter.value=done;meter.setAttribute('aria-label','Mission progress: '+destination.chapter.title);label.append(meter);}
  });
 }catch{if(version===renderVersion&&auth.currentUser?.uid===uid)for(const card of cards)card.querySelector('.era-mission-progress').textContent='Mission progress unavailable. Chapter access is unchanged.';}
});
window.addEventListener('pagehide',()=>{renderVersion++;});
