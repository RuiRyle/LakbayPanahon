import {chapterArtworkFor} from './chapter-artwork.js';
import {buildJourneyPath} from './journey-path.js';

// Reused lesson illustrations; decorative only, never a second content catalog.
export function createHomeChapterArt(chapter = {}, {eager = false} = {}) {
    const art = document.createElement('img');
    const fallback = '../assets/brand/expedition-atlas.svg';
    const source = chapterArtworkFor(chapter.id)?.src || fallback;
    art.alt = ''; art.loading = eager ? 'eager' : 'lazy'; art.decoding = 'async';
    art.src = source;
    art.className = 'hq-chapter-illustration'; art.setAttribute('aria-hidden','true');
    art.addEventListener('error',()=>{if(art.dataset.fallback){art.remove();return;}art.dataset.fallback='true';art.src=fallback;});
    return art;
}

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
    if(!chapters.length){container.textContent='Your lessons are being prepared. Open the Chapter Map to see what is available.';return;}
    for(const chapter of chapters){
        const available=chapter.accessible&&chapter.missions.length>0;
        const row=document.createElement(available?'a':'article');
        row.className='home-lesson-row';
        row.dataset.state=chapter.completed?'complete':!available?'locked':chapter.current?'current':'available';
        if(row.dataset.state==='current')row.setAttribute('aria-current','step');
        if(available)row.href='mission.html?'+new URLSearchParams({chapter:chapter.id});
        const copy=document.createElement('div');copy.className='home-lesson-copy';
        const label=document.createElement('span');label.className='hq-chapter-label';
        label.textContent=chapter.order===0?'INTRODUCTION':Number.isFinite(chapter.order)?'CHAPTER '+chapter.order:'HISTORY CHAPTER';
        const title=document.createElement('h3');title.textContent=chapter.title||'Historical chapter';
        const description=document.createElement('p');description.className='hq-chapter-description';description.textContent=chapter.description||'';
        const note=document.createElement('p');note.textContent=!chapter.ready?'Lessons being prepared':!available?'Complete earlier chapters to unlock':chapter.completedMissions+' / '+chapter.missions.length+' missions completed';
        const track=document.createElement('div');track.className='home-lesson-track';
        track.setAttribute('role','progressbar');track.setAttribute('aria-label','Mission completion: '+(chapter.title||'Historical chapter'));
        track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(Math.max(1,chapter.missions.length)));track.setAttribute('aria-valuenow',String(chapter.completedMissions));
        const fill=document.createElement('div');fill.className='home-lesson-fill';
        fill.style.width=(chapter.missions.length?Math.round(chapter.completedMissions/chapter.missions.length*100):0)+'%';track.append(fill);
        copy.append(label,title);if(chapter.description)copy.append(description);copy.append(note,track);
        const badge=document.createElement('span');badge.className='home-lesson-state';
        badge.textContent=chapter.completed?'✓ Complete':!chapter.ready?'Preparing':!available?'Locked':chapter.current?'You’re here':'Open';
        if(chapter.completed){badge.textContent='Revisit';label.textContent+=' · COMPLETED';}
        const picture=document.createElement('div');picture.className='hq-trail-art';picture.append(createHomeChapterArt(chapter));
        row.append(picture,copy,badge);container.append(row);
    }
}
