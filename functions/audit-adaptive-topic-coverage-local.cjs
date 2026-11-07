// Offline structural audit. Does not read Firebase or certify teaching adequacy.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
function audit(snapshot){
 const d=snapshot.collections,active=rows=>(rows||[]).filter(r=>r.status==='active'),missions=active(d.missions),issues=[],editorial=[],rows=[];
 for(const mission of missions){
  const scenes=active(d.storyScenes).filter(s=>s.missionId===mission.id),quizzes=active(d.quizzes).filter(q=>q.missionId===mission.id),practice=active(d.practiceQuestions).filter(q=>q.missionId===mission.id),topics=[...new Set(quizzes.flatMap(q=>(q.questionBlueprint||[]).map(slot=>slot.topic)))];
  for(const topic of topics){
   const mapped=scenes.filter(s=>s.reviewTopics?.includes(topic)),bank=practice.filter(q=>q.topic===topic),quizQuestions=active(d.questions).filter(q=>quizzes.some(quiz=>quiz.id===q.quizId)&&q.topic===topic),flags=[];
   if(!mapped.length)flags.push('No mapped lesson scene');
   if(mapped.some(s=>!String(s.content||'').trim()))flags.push('Mapped scene has no lesson text');
   if(!bank.length)flags.push('No targeted practice questions');
   if(!quizQuestions.length)flags.push('No matching quiz questions');
   const signature=p=>JSON.stringify([p?.version,p?.minDistinctQuestions,p?.minCleanSessions,p?.requiredDifficulty]),policy=bank[0]?.reviewEvidencePolicy;
   if(!policy||!Number.isInteger(policy.minDistinctQuestions)||policy.minDistinctQuestions<2||!Number.isInteger(policy.minCleanSessions)||policy.minCleanSessions<2||!Number.isInteger(policy.version)||policy.version<1||!policy.requiredDifficulty)flags.push('Missing or invalid review evidence policy');
   else {if(bank.some(q=>signature(q.reviewEvidencePolicy)!==signature(policy)))flags.push('Inconsistent topic evidence policies');if(new Set(bank.map(q=>q.id)).size<policy.minDistinctQuestions)flags.push('Too few distinct questions to reach the practice goal');if(!bank.some(q=>q.difficulty===policy.requiredDifficulty))flags.push('Required difficulty unavailable');}
   for(const question of [...bank,...quizQuestions]){
    if(!['A','B','C','D'].includes(question.correctAnswer)||!['A','B','C','D'].every(k=>String(question['option'+k]||'').trim()))issues.push({missionId:mission.id,topic,questionId:question.id,reason:'Invalid answer/options'});
    if(!String(question.explanation||'').trim())issues.push({missionId:mission.id,topic,questionId:question.id,reason:'Missing explanation'});
    const missing=['A','B','C','D'].filter(k=>!String(question.answerExplanations?.[k]||'').trim());
    if(missing.length)editorial.push({missionId:mission.id,topic,questionId:question.id,reason:'Missing choice-specific explanation',choices:missing});
    const wrong=['A','B','C','D'].filter(k=>k!==question.correctAnswer).map(k=>question.answerExplanations?.[k]?.trim());if(wrong.every(Boolean)&&new Set(wrong).size===1)editorial.push({missionId:mission.id,topic,questionId:question.id,reason:'Identical feedback for every distractor'});
   }
   for(const reason of flags)issues.push({missionId:mission.id,topic,reason});
   rows.push({missionId:mission.id,title:mission.title,topic,sceneIds:mapped.map(s=>s.id),practiceIds:bank.map(q=>q.id),quizQuestionIds:quizQuestions.map(q=>q.id),policy:policy||null});
  }
 }
 return {checkedAt:new Date().toISOString(),mode:'offline dated catalog plus repository verified overlays; no fresh production read',baselineAt:snapshot.auditedAt,counts:{missions:missions.length,topics:rows.length,issues:issues.length,editorialFlags:editorial.length},issues,editorial,topics:rows,limits:['Mapping and nonempty feedback do not establish historical accuracy or instructional adequacy.','Qualified-teacher review must evaluate claim, clue and reasoning in the actual text.','Catalog changes after this snapshot are not covered.']};
}
if(require.main===module){const report=audit(require('./audit-student-handoff.cjs').catalog().snapshot);fs.writeFileSync(path.join(root,'docs/validation/adaptive-topic-coverage-2026-11-06.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({counts:report.counts,issues:report.issues,editorial:report.editorial.slice(0,8)},null,2));if(report.issues.length)process.exitCode=1;}
module.exports={audit};
