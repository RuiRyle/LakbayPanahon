import {createExplorerArt,explorerTheme} from './explorer-art.js';
export function renderExplorerDesk(host,state) {
    if(!host)return;
    host.replaceChildren();
    host.dataset.theme=explorerTheme(state.eraTheme);
    host.closest('.journey-quest-card')?.setAttribute('data-desk-theme',host.dataset.theme);
    const destinations=[
        {kind:'map',name:'Chapter map',note:state.eraTitle||'Choose a destination',href:state.chapter?.eraId?'era.html?'+new URLSearchParams({era:state.chapter.eraId}):'chapters.html'},
        {kind:'journal',name:'Evidence Journal',note:'Revisit your saved clues',href:'my-journey.html#evidenceJournal'},
        {kind:'artifact',name:'Discovery Museum',note:'Explore your earned keepsakes',href:'achievements.html'}
    ];
    for(const item of destinations){
        const link=document.createElement('a');link.className='desk-object';link.href=item.href;
        const label=document.createElement('strong');label.textContent=item.name;
        const note=document.createElement('span');note.textContent=item.note;
        link.append(createExplorerArt(item.kind),label,note);host.append(link);
    }
}
