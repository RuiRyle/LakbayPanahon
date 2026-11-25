import {createExplorerArt} from './explorer-art.js';
export function chapterArtifactIds(records,userId,chapterId){
    return [...new Set(records.filter(row=>row.userId===userId&&row.chapterId===chapterId&&typeof row.artifactId==='string'&&row.artifactId.length>0&&row.artifactId.length<=256&&!row.artifactId.includes('/')).map(row=>row.artifactId))].slice(0,3);
}
export function renderChapterKeepsake(host,{chapter,firstCompletion,nextChapter,badgeArtwork,artifacts=[],artifactsAvailable=false}){
    if(!host)return;
    host.classList.toggle('has-next-chapter', Boolean(nextChapter));
    const existing=host.querySelector('.chapter-keepsake-trail');
    if(!existing)host.replaceChildren();host.dataset.first=String(firstCompletion);
    const heading=document.createElement('h3');heading.textContent=firstCompletion?'Chapter complete':'Chapter discoveries';
    const copy=document.createElement('p');copy.textContent=chapter.description?.trim?.() || 'Think of one clue from this chapter that helped you explain the past.';
    const trail=document.createElement('div');trail.className='chapter-keepsake-trail';
    const items=[
        {art:'seal',label:firstCompletion?'PASSPORT STAMP RECORDED':'CHAPTER ALREADY RECORDED',title:chapter.title||'Chapter complete',href:'my-journey.html#passportTitle',action:'Open my passport'},
        {art:'artifact',label:'YOUR MISSION KEEPSAKES',title:artifacts.length?artifacts.map(item=>item.title).join(' · '):artifactsAvailable?'Explore your discovery museum':'Revisit your mission collections',href:'achievements.html',action:'Open my museum'},
        {art:'map',label:nextChapter?'YOUR NEXT DESTINATION':'YOUR JOURNEY CONTINUES',title:nextChapter?.title||'Choose your next discovery'}
    ];
    if(existing){
        host.querySelector('h3').textContent=heading.textContent;
        items.forEach((item,index)=>{
            const step=existing.children[index];step.querySelector('.eyebrow').textContent=item.label;step.querySelector('strong').textContent=item.title;
        });
        return;
    }
    for(const item of items){
        const step=document.createElement('div');step.className='chapter-keepsake-step';
        step.append(item.art === 'seal' && badgeArtwork ? badgeArtwork : createExplorerArt(item.art));
        const label=document.createElement('span');label.className='eyebrow';label.textContent=item.label;
        const title=document.createElement('strong');title.textContent=item.title;
        step.append(label,title);
        if (item.href) {
            const link=document.createElement('a');link.href=item.href;link.textContent=item.action;link.className='text-button';step.append(link);
        }
        trail.append(step);
    }
    host.append(heading,copy,trail);
}
