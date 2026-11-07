import {buildJourneyPath} from './journey-path.js';

// Uses the dashboard's existing catalog and owned progress; no additional reads.
export function homeTrailChapters(data, state) {
    const chapters=buildJourneyPath(data).flatMap(era=>era.chapters);
    const current=state.chapter?.id || chapters.find(chapter=>chapter.accessible&&!chapter.completed)?.id;
    const index=chapters.findIndex(chapter=>chapter.id===current);
    const start=Math.max(0,Math.min(index-1,chapters.length-4));
    return chapters.slice(start,start+4).map(chapter=>({...chapter,current:chapter.id===current}));
}

export function renderHomeLearningTrail(container,data,state) {
    if(!container)return;
    container.replaceChildren();
    const chapters=homeTrailChapters(data,state);
    if(!chapters.length){container.textContent='Your lessons are being prepared. Explore Chapters to check what is available.';return;}
    for(const chapter of chapters){
        const available=chapter.accessible&&chapter.missions.length>0;
        const row=document.createElement(available?'a':'article');
        row.className='home-lesson-row';
        row.dataset.state=chapter.completed?'complete':!available?'locked':chapter.current?'current':'available';
        if(available)row.href='mission.html?'+new URLSearchParams({chapter:chapter.id});
        const copy=document.createElement('div');copy.className='home-lesson-copy';
        const title=document.createElement('h3');title.textContent=chapter.title||'Historical chapter';
        const note=document.createElement('p');note.textContent=!chapter.ready?'Lessons being prepared':!available?'Complete earlier chapters to unlock':chapter.completedMissions+' / '+chapter.missions.length+' missions completed';
        const track=document.createElement('div');track.className='home-lesson-track';track.setAttribute('aria-hidden','true');
        const fill=document.createElement('div');fill.className='home-lesson-fill';
        fill.style.width=(chapter.missions.length?Math.round(chapter.completedMissions/chapter.missions.length*100):0)+'%';track.append(fill);
        copy.append(title,note,track);
        const badge=document.createElement('span');badge.className='home-lesson-state';
        badge.textContent=chapter.completed?'✓ Complete':!chapter.ready?'Preparing':!available?'Locked':chapter.current?'Continue':'Open';
        row.append(copy,badge);container.append(row);
    }
}
