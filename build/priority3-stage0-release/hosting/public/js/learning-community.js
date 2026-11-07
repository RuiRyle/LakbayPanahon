const communityMilestones=[
 ['Welcome shelter','A place to begin asking questions.','⌂',0],
 ['Story pavilion','A place to connect people, events and their stories.','▤',.25],
 ['Clue workshop','A place to examine sources and the limits of evidence.','⚒',.5],
 ['Exchange corner','A place to compare ideas and learn from different perspectives.','⇄',.75],
 ['History archive','A place to remember and revisit the discoveries across your missions.','✦',1]
];
export function learningCommunityState(groups,progress,userId){
 const available=groups.flatMap(era=>era.chapters.filter(c=>c.ready).flatMap(c=>c.missions.map(m=>({id:m.id,chapterId:c.id,title:m.title}))));
 const owned=progress.filter(row=>row.userId===userId&&row.completed===true),completed=available.filter(m=>owned.some(row=>row.missionId===m.id&&row.chapterId===m.chapterId));
 const total=available.length,count=completed.length;
 return {total,count,completed,stations:communityMilestones.map(([title,purpose,icon,share])=>({title,purpose,icon,required:total?Math.max(1,Math.ceil(total*share)):null,unlocked:total>0&&count>=Math.max(1,Math.ceil(total*share))}))};
}
export function renderLearningCommunity(host,state){
 host.replaceChildren();const node=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
 if(!state.total){host.append(node('p','Your community will appear when the mission catalog is available.'));return;}
 host.append(node('p',state.count+' of '+state.total+' available missions completed. Each saved mission helps reveal your learning community.'));
 const progress=document.createElement('progress');progress.className='community-progress';progress.max=state.total;progress.value=state.count;progress.setAttribute('aria-label','Completed missions building your learning community');host.append(progress);
 const scene=node('div');scene.className='community-scene';const image=document.createElement('img');image.src='../assets/discovery/then-community.svg';image.alt='An imagined community blueprint. The coloured area grows as learning places are revealed.';image.width=520;image.height=320;image.className='community-blueprint';const revealed=image.cloneNode();revealed.alt='';revealed.className='community-revealed';revealed.style.clipPath='inset(0 '+(100-state.stations.filter(s=>s.unlocked).length*20)+'% 0 0)';scene.append(image,revealed);host.append(scene,node('p','This is an imagined learning space inspired by community life, not a reconstruction of one historical place. Its buildings represent your learning progress.'));
 const stations=node('div');stations.className='community-stations';state.stations.forEach(station=>{const card=node('article');card.className='community-station';card.dataset.unlocked=String(station.unlocked);const icon=node('span',station.unlocked?station.icon:'◇');icon.setAttribute('aria-hidden','true');card.append(icon,node('strong',station.title),node('p',station.unlocked?'Built · '+station.purpose:'Reveals after '+station.required+' saved mission completions.'));
 if(station.unlocked){const details=node('details'),summary=node('summary','Explore this place');details.append(summary,node('p',station.purpose));const mission=state.completed[Math.min(state.completed.length-1,Math.max(0,station.required-1))];if(mission){const link=node('a','Revisit: '+(mission.title||'your completed lesson'));link.href='story.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id});details.append(link);}card.append(details);}stations.append(card);});host.append(stations,node('p','Buildings are visual milestones from saved mission completions. Opening them adds no XP or extra mission credit.'));
}
