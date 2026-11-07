const identifier=value=>typeof value==='string'&&value.length>0&&value.length<=200&&!/[\/\u0000-\u001f]/.test(value);
export function validateFinaleDefinition(value){
 if(!value||value.enabled!==true||!identifier(value.id)||!Array.isArray(value.chapters)||!value.chapters.length||!Array.isArray(value.missions)||!value.missions.length)throw Error('The journey finale is not configured.');
 const chapters=new Set();for(const chapter of value.chapters){if(!identifier(chapter.id)||chapters.has(chapter.id)||typeof chapter.title!=='string'||!chapter.title.trim())throw Error('Invalid finale chapters.');chapters.add(chapter.id);}
 const missions=new Set();for(const mission of value.missions){if(!identifier(mission.id)||missions.has(mission.id)||!chapters.has(mission.chapterId))throw Error('Invalid finale missions.');missions.add(mission.id);}
 if(value.chapters.some(chapter=>!value.missions.some(mission=>mission.chapterId===chapter.id))||!chapters.has(value.finalChapterId))throw Error('Incomplete finale definition.');
 return value;
}
export function journeyFinaleState({definition,userId,chapterProgress=[],missionProgress=[]}){
 const config=validateFinaleDefinition(definition);
 if(!identifier(userId))throw Error('Sign in to view the journey finale.');
 const chapters=new Map(chapterProgress.filter(row=>row.userId===userId&&row.completed===true).map(row=>[row.chapterId,row]));
 const missions=new Set(missionProgress.filter(row=>row.userId===userId&&row.completed===true&&config.missions.some(item=>item.id===row.missionId&&item.chapterId===row.chapterId)).map(row=>row.missionId));
 const doneChapters=config.chapters.filter(chapter=>chapters.has(chapter.id)),missingChapters=config.chapters.filter(chapter=>!chapters.has(chapter.id)),missingMissions=config.missions.filter(mission=>!missions.has(mission.id));
 const eligible=!missingChapters.length&&!missingMissions.length;
 const times=doneChapters.map(chapter=>{try{const time=chapters.get(chapter.id).completedAt?.toMillis?.();return Number.isFinite(time)&&time>0?time:null;}catch{return null;}});
 return {eligible,chapterCount:doneChapters.length,totalChapters:config.chapters.length,missionCount:config.missions.length-missingMissions.length,totalMissions:config.missions.length,missingChapters,missingMissions,completedAt:eligible&&times.every(Boolean)?Math.max(...times):null};
}
