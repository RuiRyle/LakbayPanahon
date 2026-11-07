// Topic diagnostics are saved signals, not question correctness or mastery scores.
export function summarizeQuizTopics(results,now=Date.now()) {
    const topics=new Map();let available=0,uncertainMissions=0;
    const get=(missionId,topic)=>{
        const key=JSON.stringify([missionId,topic]);
        if(!topics.has(key))topics.set(key,{missionId,topic,historicalAttempts:0,currentStudents:0});
        return topics.get(key);
    };
    for(const result of results){
        if(result.status!=='fulfilled')continue;available++;
        const byMission=new Map();
        for(const attempt of result.value.attempts||[]){
            if(typeof attempt.missionId!=='string'||!attempt.missionId)continue;
            const labels=[...new Set((Array.isArray(attempt.topicsForReview)?attempt.topicsForReview:[]).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()))];
            for(const topic of labels)get(attempt.missionId,topic).historicalAttempts++;
            if(!byMission.has(attempt.missionId))byMission.set(attempt.missionId,[]);
            byMission.get(attempt.missionId).push({...attempt,topics:labels});
        }
        for(const [missionId,attempts] of byMission){
            if(attempts.some(a=>{const time=a.completedAt?.toMillis?.();return !Number.isFinite(time)||time<=0||time>now;})){uncertainMissions++;continue;}
            attempts.sort((a,b)=>b.completedAt.toMillis()-a.completedAt.toMillis());
            if(attempts.length>1&&attempts[0].completedAt.toMillis()===attempts[1].completedAt.toMillis()){uncertainMissions++;continue;}
            for(const topic of attempts[0].topics)get(missionId,topic).currentStudents++;
        }
    }
    return {available,unavailable:results.length-available,uncertainMissions,topics:[...topics.values()].sort((a,b)=>b.currentStudents-a.currentStudents||b.historicalAttempts-a.historicalAttempts||a.topic.localeCompare(b.topic))};
}
