import {createExplorerArt,explorerTheme} from './explorer-art.js';
export function renderEraArrival(host,era) {
    if(!host)return;
    host.replaceChildren();host.hidden=false;host.dataset.theme=explorerTheme(era.theme);
    const art=createExplorerArt('map');
    const copy=document.createElement('div');copy.className='era-arrival-copy';
    const kicker=document.createElement('span');kicker.className='eyebrow';kicker.textContent='YOUR NEXT STOP IN TIME';
    const title=document.createElement('strong');title.id='eraArrivalTitle';title.textContent=era.title||'A historical destination';
    copy.append(kicker,title);
    if(typeof era.dateRange==='string'&&era.dateRange.trim()){
        const period=document.createElement('p');period.className='arrival-period';period.textContent=era.dateRange;copy.append(period);
    }
    const note=document.createElement('p');note.textContent='Look around, follow the chapter trail, and see what the evidence reveals.';copy.append(note);
    const skip=document.createElement('button');skip.type='button';skip.className='text-button';skip.textContent='Skip arrival';
    skip.addEventListener('click',()=>{host.hidden=true;const heading=document.getElementById('eraOverviewTitle');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}});
    host.append(art,copy,skip);
}
