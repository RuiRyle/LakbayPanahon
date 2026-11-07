// Runtime behavior only. Authored cases live in missions/{missionId}.discoveryCase.
export function validatedDiscoveryCase(mission) {
    const activity=mission?.discoveryCase;
    const text=value=>typeof value==='string'&&value.trim().length>0;
    const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
    const index=(value,length)=>Number.isInteger(value)&&value>=0&&value<length;
    if(!record(activity)||activity.version!==1||!text(mission.id)||!text(mission.chapterId)||
        activity.missionId!==mission.id||activity.chapterId!==mission.chapterId||
        !['id','title','goal','setting','question','explanation','claim','limit'].every(key=>text(activity[key]))||
        !Array.isArray(activity.clues)||activity.clues.length<2||activity.clues.length>8||
        !activity.clues.every(clue=>record(clue)&&text(clue.title)&&text(clue.text))||
        !Array.isArray(activity.claims)||activity.claims.length<2||activity.claims.length>6||
        !activity.claims.every(text)||new Set(activity.claims.map(value=>value.trim())).size!==activity.claims.length||
        !index(activity.answer,activity.claims.length)||!index(activity.support,activity.clues.length)||
        !Array.isArray(activity.compare)||!activity.compare.length||activity.compare.length>6||
        !activity.compare.every(item=>record(item)&&text(item.label)&&text(item.reason)&&['similar','changed'].includes(item.answer))||
        !record(activity.source)||!text(activity.source.title))return null;
    if(activity.source.lesson!==true){
        try{const url=new URL(activity.source.url);if(url.protocol!=='https:'||url.username||url.password)return null;}catch{return null;}
    }
    return {...activity,clues:activity.clues.map(item=>({...item})),claims:[...activity.claims],compare:activity.compare.map(item=>({...item})),source:{...activity.source}};
}
export function discoveryResponse(activity,choice){return Number.isInteger(choice)&&choice===activity.answer;}
export function discoveryLessonUrl(activity){return 'story.html?'+new URLSearchParams({chapter:activity.chapterId,mission:activity.missionId});}
