// Follow-up timing is a discussion aid, not evidence that a note caused learning gains.
export function followupQuizEvidence(note,attempts,now=Date.now()) {
    const anchor=note.statusAt?.toMillis?.();
    if(!Number.isFinite(anchor)||anchor<=0||anchor>now)return {available:false,attempts:[],latest:null,uncertain:true};
    const relevant=attempts.filter(item=>item.missionId===note.missionId);
    const dated=relevant.filter(item=>{const time=item.completedAt?.toMillis?.();return Number.isFinite(time)&&time>anchor&&time<=now;}).sort((a,b)=>b.completedAt.toMillis()-a.completedAt.toMillis());
    const uncertain=relevant.some(item=>{const time=item.completedAt?.toMillis?.();return !Number.isFinite(time)||time<=0||time>now;});
    const tied=dated.length>1&&dated[0].completedAt.toMillis()===dated[1].completedAt.toMillis();
    return {available:true,attempts:dated,latest:tied||uncertain?null:dated[0]||null,uncertain:tied||uncertain};
}
// Labels describe saved quiz evidence, never ability or attendance.
export function quizSupportSignals(records,now=Date.now()){
 const time=row=>row.completedAt?.toMillis?.(),attempts=[...records].sort((a,b)=>(time(b)||0)-(time(a)||0)),latest=new Map(),ambiguous=new Set();
 for(const attempt of attempts){
  if(!attempt.missionId)continue;
  const at=time(attempt);
  if(!Number.isFinite(at)||at<=0||at>now){ambiguous.add(attempt.missionId);continue;}
  if(!latest.has(attempt.missionId))latest.set(attempt.missionId,attempt);
  else if(time(latest.get(attempt.missionId))===at)ambiguous.add(attempt.missionId);
 }
 const review=[...latest.values()].filter(a=>!ambiguous.has(a.missionId)&&(a.passed===false||(Array.isArray(a.topicsForReview)&&a.topicsForReview.some(t=>typeof t==='string'&&t.trim()))));
 const latestAt=Math.max(0,...[...latest.values()].map(time));
 return {attempts,ambiguous,review,latestAt};
}
export function quizSupportLabel(signals){
 if(!signals)return {state:'unavailable',label:'Results unavailable',reason:'Saved quiz results could not be loaded.',next:'Refresh results before deciding whether support is needed.'};
 if(!signals.attempts.length)return {state:'no-evidence',label:'No quiz evidence yet',reason:'No saved quiz attempts were found. This does not establish inactivity or difficulty.',next:'Help the student start an available lesson and return after practice.'};
 if(signals.review.length)return {state:'review',label:'Review suggested',reason:'A latest dated quiz result records an unsuccessful attempt or a topic to revisit.'+(signals.ambiguous.size?' Other mission results have uncertain dates.':''),next:'Check the dated topic evidence and ask the student to explain a supporting clue.'};
 if(signals.ambiguous.size)return {state:'uncertain',label:'Evidence needs checking',reason:'Some quiz dates are missing, tied or ahead of the current time; a definite latest result cannot be selected.',next:'Check saved attempt dates before judging progress.'};
 return {state:'no-signal',label:'No current quiz review signal',reason:'The latest dated quiz results do not flag a topic. This does not establish mastery or recent attendance.',next:'Ask for an explanation or a new example to check understanding.'};
}
