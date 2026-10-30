import { reviewTopicsFromHistory } from "./practice-review.js";
const time = record => record.completedAt?.toMillis?.() || 0;
export function requireReviewEvidencePolicy(value){
 if(!value||!Number.isInteger(value.version)||value.version<1||!Number.isInteger(value.minDistinctQuestions)||value.minDistinctQuestions<2||!Number.isInteger(value.minCleanSessions)||value.minCleanSessions<2||typeof value.requiredDifficulty!=='string'||!value.requiredDifficulty.trim())throw Error('Configure a review evidence policy in the practice catalog.');
 return value;
}
export function missionTopicStates(attempts,sessions,questions,reviewEvents=[]){
 const active=questions.filter(q=>q.status==='active'&&typeof q.topic==='string'&&q.topic.trim()&&q.missionId&&q.id),groups=new Map(),latest=new Map();
 for(const q of active){const key=JSON.stringify([q.missionId,q.topic.trim()]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
 for(const a of attempts.filter(a=>time(a)>0&&Array.isArray(a.topicsForReview)).slice().sort((a,b)=>time(b)-time(a)||String(b.id||'').localeCompare(String(a.id||''))))if(!latest.has(a.missionId))latest.set(a.missionId,a);
 const states=[];
 for(const bank of groups.values()){
  const missionId=bank[0].missionId,topic=bank[0].topic.trim(),quiz=latest.get(missionId),anchor=quiz?time(quiz):0,diagnosed=quiz?.topicsForReview.some(t=>typeof t==='string'&&t.trim()===topic),byId=new Map(bank.map(q=>[q.id,q]));
  const validSessions=sessions.filter(s=>s.missionId===missionId&&time(s)>anchor&&Array.isArray(s.questionResults)).slice().sort((a,b)=>time(b)-time(a)||String(b.id||'').localeCompare(String(a.id||'')));
  const results=s=>{const seen=new Set();return s.questionResults.filter(r=>r&&typeof r.firstTryCorrect==='boolean'&&byId.has(r.questionId)&&!seen.has(r.questionId)&&(seen.add(r.questionId),true));};
  const latestResults=new Map();for(const session of validSessions)for(const result of results(session))if(!latestResults.has(result.questionId))latestResults.set(result.questionId,{...result,at:time(session)});
  const currentMisses=[...latestResults.values()].filter(r=>!r.firstTryCorrect).length;
  const historicalMiss=validSessions.some(s=>results(s).some(r=>!r.firstTryCorrect));
  if(!diagnosed&&!historicalMiss&&!currentMisses)continue;
  let policy=null;try{policy=requireReviewEvidencePolicy(bank[0].reviewEvidencePolicy);const signature=JSON.stringify([policy.version,policy.minDistinctQuestions,policy.minCleanSessions,policy.requiredDifficulty]);if(!bank.every(q=>JSON.stringify([q.reviewEvidencePolicy?.version,q.reviewEvidencePolicy?.minDistinctQuestions,q.reviewEvidencePolicy?.minCleanSessions,q.reviewEvidencePolicy?.requiredDifficulty])===signature))policy=null;}catch{}
  const lastMistake=Math.max(anchor,...validSessions.filter(s=>results(s).some(r=>!r.firstTryCorrect)).map(time));
  const clean=validSessions.filter(s=>time(s)>lastMistake&&results(s).length>0&&results(s).every(r=>r.firstTryCorrect));
  const correctIds=new Set(clean.flatMap(s=>results(s).map(r=>r.questionId))),cleanSessions=new Set(clean.map(s=>s.id||String(time(s))));
  const difficultyMet=policy&&[...correctIds].some(id=>byId.get(id)?.difficulty===policy.requiredDifficulty);
  const reached=!!policy&&correctIds.size>=policy.minDistinctQuestions&&cleanSessions.size>=policy.minCleanSessions&&difficultyMet&&!currentMisses;
  const reviewed=reviewEvents.some(e=>e.missionId===missionId&&e.topic===topic&&e.kind==='lesson-review'&&time(e)>Math.max(anchor,lastMistake));
  const state=reached?'practice-goal-reached':validSessions.length?'practising':reviewed?'lesson-revisited':'review-needed';
  states.push({missionId,topic,label:bank[0].topicLabel||topic,source:diagnosed?'quiz':'practice',attempted:latestResults.size,correct:[...latestResults.values()].filter(r=>r.firstTryCorrect).length,missed:reached?0:Math.max(1,currentMisses),state,lessonRevisited:reviewed,evidenceAvailable:!!policy,distinctCorrect:correctIds.size,cleanSessions:cleanSessions.size,requiredQuestions:policy?.minDistinctQuestions,requiredSessions:policy?.minCleanSessions,requiredDifficulty:policy?.requiredDifficulty,difficultyMet:!!difficultyMet});
 }
 return states.sort((a,b)=>b.missed-a.missed||a.label.localeCompare(b.label));
}
export function missionReviewTopics(attempts,sessions,questions,reviewEvents=[]){return missionTopicStates(attempts,sessions,questions,reviewEvents).filter(t=>t.state!=='practice-goal-reached');}
export function requirePracticePolicy(policy) {
    if (!policy || !Array.isArray(policy.difficultyLevels) || !policy.difficultyLevels.length ||
        policy.difficultyLevels.some(value => typeof value !== "string" || !value.trim()) ||
        new Set(policy.difficultyLevels).size !== policy.difficultyLevels.length ||
        !policy.difficultyLevels.includes(policy.startDifficulty) || !policy.difficultyLevels.includes(policy.reviewDifficulty) ||
        !Number.isInteger(policy.questionLimit) || policy.questionLimit < 1 || policy.questionLimit > 200 ||
        typeof policy.promoteAccuracy !== "number" || typeof policy.demoteAccuracy !== "number" ||
        !Number.isFinite(policy.promoteAccuracy) || !Number.isFinite(policy.demoteAccuracy) ||
        policy.demoteAccuracy < 0 || policy.promoteAccuracy > 1 || policy.demoteAccuracy >= policy.promoteAccuracy) {
        throw new Error("Configure a valid practicePolicy in this mission's Firestore quiz document.");
    }
    return policy;
}
