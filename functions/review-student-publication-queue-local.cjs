// Offline compatibility review. Does not call or execute any publication script.
const fs=require('node:fs'),path=require('node:path'),{isDeepStrictEqual:equal}=require('node:util');
const root=path.join(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const snapshot=read('docs/validation/learning-content-snapshot.json');
const catalog=new Map(Object.entries(snapshot.collections).flatMap(([name,rows])=>rows.map(row=>[name+'/'+row.id,row])));
const prerequisites=['social-roles-learning-migration','beliefs-learning-migration','islam-exchange-learning-migration','writing-learning-migration','chapter5-mission1-migration','chapter5-mission2-migration','chapter5-mission3-migration','chapter5-mission4-migration','chapter5-challenge-migration','chapter5-published-recap-migration','chapter6-mission4-migration'];
for(const name of prerequisites)for(const w of read('data/'+name+'.json').writes||[])catalog.set(w.path,{...catalog.get(w.path),...w.fields});
const scopes={
 'mission2-easy-review':null,
 'chapter1-mission1-practice-polish':['missionId','topic','topicLabel','status','difficulty','order','question','optionA','optionB','optionC','optionD','correctAnswer','explanation','learningPoint','hint','answerHints','answerExplanations','reviewEvidencePolicy','contentReviewStatus'],
 'chapter1-mission1-learning-polish':['content','learningHelp','decisionSituation','decisionQuestion','decisionChoices','decisionCorrectAnswer','decisionExplanation','answerExplanations','learningPoint','optionA','optionB','optionC'],
 'chapter2-reading-polish':['content'],
 'chapter6-help-polish':['learningHelp'],
 'chapter5-continuation-wording':['content'],
 'chapter4-learning-polish':['content','decisionQuestion','decisionChoices','decisionExplanation','learningHelp'],
 'chapter3-decision-quality':['decisionQuestion','decisionChoices','decisionExplanation'],
 'chapter2-scene-quality':['decisionChoices'],
 'chapter2-feedback-polish':['answerExplanations','learningPoint'],
 'chapter2-beginner-practice':null
};
const errors=[],touched=new Set(),plans=[];
for(const [name,allowed]of Object.entries(scopes)){
 const plan=read('data/'+name+'-migration.json');
 if(name==='chapter1-mission1-learning-polish')require('./apply-chapter1-mission1-learning-polish.cjs').validatePlan(plan);
 if(name==='chapter1-mission1-practice-polish')require('./apply-chapter1-mission1-practice-polish.cjs').validatePlan(plan);
 if(plan.projectId!=='lakbaypanahon-1797e')errors.push(name+': unexpected project');
 for(const requirement of plan.prerequisites||[])for(const [key,value]of Object.entries(requirement.expected||{}))if(!equal(catalog.get(requirement.path)?.[key],value))errors.push(requirement.path+': missing prerequisite '+key);
 for(const w of plan.writes){
  const before=catalog.get(w.path);
  if(w.create&&before)errors.push(w.path+': creation collision');
  if(!w.create&&!before&&!w.createIfMissing)errors.push(w.path+': missing baseline');
  if(before||!w.createIfMissing)for(const [key,value]of Object.entries(w.expected||{}))if(!equal(before?.[key],value))errors.push(w.path+': prerequisite differs at '+key);
  for(const key of Object.keys(w.fields)){
   if(allowed&&!allowed.includes(key))errors.push(w.path+': unexpected edit '+key);
   const id=w.path+'#'+key;if(touched.has(id))errors.push(id+': overlapping queued edit');touched.add(id);
  }
  if(!allowed){
   if(!w.create||!w.path.startsWith('practiceQuestions/')||w.fields.difficulty!=='easy')errors.push(w.path+': unexpected practice scope');
   const old=snapshot.collections.practiceQuestions.find(p=>p.missionId===w.fields.missionId&&p.topic===w.fields.topic);
   if(!equal(old?.reviewEvidencePolicy,w.fields.reviewEvidencePolicy))errors.push(w.path+': evidence policy changed');
  }
  catalog.set(w.path,{...before,...w.fields});
 }
 plans.push({plan:name,documents:plan.writes.length,allowedFields:allowed||'new easy practice records only'});
}
const policy=read('data/bayani-teaching-policy.json');
if(policy.projectId!=='lakbaypanahon-1797e'||policy.documentPath!=='learningSettings/bayaniAI'||!policy.systemInstruction?.trim())errors.push('Unexpected Bayani target or empty instructions');
const report={mode:'offline-only-not-authority-to-publish',baselineAt:snapshot.auditedAt,prerequisiteCandidates:prerequisites,plans,bayani:{document:policy.documentPath,field:'systemInstruction'},errors,limitations:['Compatibility is against a dated snapshot plus explicit local prerequisite candidates, not current Firestore.','The prerequisite candidates are not instructions to republish those full plans. Inspect current live state first.','Does not independently approve historical accuracy, learner suitability or AI behavior.']};
fs.writeFileSync(path.join(root,'docs/validation/student-publication-queue-local.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));process.exitCode=errors.length?1:0;
