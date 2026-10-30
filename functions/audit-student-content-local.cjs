// Candidate curriculum audit only. No Firebase, credentials or publication.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const {baseline,catalog,inputs}=require('./student-content-candidate-local.cjs').buildCandidateCatalog();
const rows=name=>[...catalog].filter(([p,r])=>p.startsWith(name+'/')&&r.status==='active').map(([p,r])=>({...r,path:p}));
const scenes=rows('storyScenes'),questions=rows('questions'),practice=rows('practiceQuestions');
const missingImages=scenes.filter(s=>!s.imageUrl||s.imageUrl.startsWith('../assets/')&&!fs.existsSync(path.join(root,s.imageUrl.slice(3)))).map(s=>({path:s.path,missionId:s.missionId,imageUrl:s.imageUrl||null}));
const sceneInteractionIssues=[];
for(const scene of scenes){
 for(const key of ['decisionChoices','checkChoices']){
  const choices=scene[key];if(!Array.isArray(choices))continue;
  const normalized=choices.map(value=>String(value).trim().toLowerCase().replace(/\s+/g,' '));
  if(new Set(normalized).size!==normalized.length)sceneInteractionIssues.push({path:scene.path,field:key,reason:'duplicate-choice'});
  const answer=scene[key==='decisionChoices'?'decisionCorrectAnswer':'checkCorrectAnswer'];
  if(answer&&!choices.includes(answer))sceneInteractionIssues.push({path:scene.path,field:key,reason:'missing-correct-choice'});
 }
}
const gaps=[],topics=[];
for(const quiz of rows('quizzes'))for(const slot of quiz.questionBlueprint||[]){
 const mapped=scenes.filter(s=>s.missionId===quiz.missionId&&s.reviewTopics?.includes(slot.topic));
 const bank=questions.filter(q=>q.quizId===quiz.id&&q.topic===slot.topic);
 const review=practice.filter(q=>q.missionId===quiz.missionId&&q.topic===slot.topic);
 const difficulty=quiz.practicePolicy?.reviewDifficulty;
 const item={missionId:quiz.missionId,topic:slot.topic,scenes:mapped.map(s=>s.id),mainVariants:bank.length,practiceItems:review.length,requestedDifficulty:difficulty||null,hasRequestedDifficulty:!difficulty||review.some(p=>p.difficulty===difficulty)};
 topics.push(item);
 if(!mapped.length||bank.length<2*(slot.count||1)||!review.length||!item.hasRequestedDifficulty)gaps.push(item);
}
const report={mode:'offline-candidate-not-live',baselineAt:baseline.auditedAt,inputs,limitations:['Explicit overlays are candidate authoring evidence, not verified publication order or current Firestore state.','Topic links and question counts do not establish semantic teaching adequacy.','Existing images are not independently reviewed for historical accuracy or instructional value.'],counts:{missions:rows('missions').length,scenes:scenes.length,topics:topics.length,missingImages:missingImages.length,structuralTopicGaps:gaps.length,sceneInteractionIssues:sceneInteractionIssues.length},missingImages,gaps,sceneInteractionIssues,topics};
fs.writeFileSync(path.join(root,'docs/validation/student-content-local.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({counts:report.counts,missingImages,gaps,sceneInteractionIssues},null,2));
