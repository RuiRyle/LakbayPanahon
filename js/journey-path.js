// Era prerequisites are authored as requiredChapterIds in Firestore.
const pathOrder = rows => rows.slice().sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
export function buildJourneyPath({userId,eras,chapters,missions,challenges,chapterProgress,missionProgress}) {
    const completedChapters = new Set(chapterProgress.filter(p=>p.userId===userId&&p.completed===true).map(p=>p.chapterId));
    const completedMissions = new Set(missionProgress.filter(p=>p.userId===userId&&p.completed===true).map(p=>p.missionId));
    const groups = pathOrder(eras.filter(era=>era.status==='active')).map(era=>({...era,chapters:[]}));
    if(chapters.some(c=>c.status==='active'&&!c.eraId))groups.push({id:null,title:'Learning chapters',chapters:[]});
    for(const era of groups) {
        const requirements=era.requiredChapterIds===undefined?[]:era.requiredChapterIds;
        const preview=globalThis.__lakbayExplorationPreview===true;
        const eraAccessible=preview||(Array.isArray(requirements)&&requirements.every(id=>typeof id==='string'&&id&&completedChapters.has(id)));
        era.accessible=eraAccessible;
        const previous=[];
        for(const chapter of pathOrder(chapters.filter(c=>c.status==='active'&&(c.eraId||null)===era.id))) {
            const ready=chapter.contentReady!==false;
            const accessible=ready&&(preview||completedChapters.has(chapter.id)||(eraAccessible&&previous.every(id=>completedChapters.has(id))));
            const rows=pathOrder(missions.filter(m=>m.chapterId===chapter.id&&m.status==='active'));
            const missionRows=rows.map((mission,index)=>({...mission,completed:completedMissions.has(mission.id),accessible:ready&&(preview||completedMissions.has(mission.id)||(accessible&&rows.slice(0,index).every(m=>completedMissions.has(m.id))))}));
            const challenge=pathOrder(challenges.filter(c=>c.chapterId===chapter.id&&c.status==='active'))[0];
            era.chapters.push({...chapter,ready,accessible,completed:completedChapters.has(chapter.id),missions:missionRows,
                completedMissions:missionRows.filter(m=>m.completed).length,challenge,
                challengeAccessible:accessible&&rows.length>0&&(preview||rows.every(m=>completedMissions.has(m.id)))&&!!challenge});
            if(ready&&chapter.requiredForProgression!==false)previous.push(chapter.id);
        }
    }
    return groups.filter(era=>era.chapters.length);
}
