// Offline audit of the dated catalog plus hash-verified published content overlays.
// No Firebase, learner writes, AI calls or curriculum-approval claims.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function catalog(includeContentCompletion=true,includeChapter6=true,includeChapter7=true,includeQualityFixes=true){
 const snapshot=require('./build-chapter4-learning-clarity.cjs').publishedBaseline();
 const overlays=[['chapter4-learning-clarity','chapter4-learning-clarity-publication'],['chapter5-mission1-learning-initial-published','chapter5-mission1-learning-initial-publication'],...Array.from({length:4},(_,i)=>['chapter5-mission'+(i+1)+'-learning-migration','chapter5-mission'+(i+1)+'-learning-publication'])];
 if(includeContentCompletion&&fs.existsSync(path.join(root,'docs/validation/student-content-completion-publication-2026-10-31.json')))overlays.push(['student-content-completion-migration','student-content-completion-publication']);
 if(includeChapter6&&fs.existsSync(path.join(root,'docs/validation/chapter6-learning-clarity-publication-2026-10-31.json')))overlays.push(['chapter6-learning-clarity-migration','chapter6-learning-clarity-publication']);
 if(includeChapter7&&fs.existsSync(path.join(root,'docs/validation/chapter7-learning-clarity-publication-2026-10-31.json')))overlays.push(['chapter7-learning-clarity-migration','chapter7-learning-clarity-publication']);
 if(includeQualityFixes&&fs.existsSync(path.join(root,'docs/validation/content-quality-fixes-publication-2026-10-31.json')))overlays.push(['content-quality-fixes-migration','content-quality-fixes-publication']);
 const proofs=[];
 for(let [data,proof] of overlays){if(data==='chapter4-learning-clarity')data+='-migration';const raw=fs.readFileSync(path.join(root,'data',data+'.json')),evidence=JSON.parse(fs.readFileSync(path.join(root,'docs/validation',proof+'-2026-10-31.json'),'utf8'));
  if(evidence.mode!=='published-and-read-back'||crypto.createHash('sha256').update(raw).digest('hex')!==evidence.planHash)throw Error('Unverified publication '+data);
  for(const w of JSON.parse(raw).writes){const [name,id]=w.path.split('/'),row=snapshot.collections[name]?.find(r=>r.id===id);if(!row)throw Error('Missing baseline '+w.path);Object.assign(row,w.fields);}
  proofs.push({plan:data,sha256:evidence.planHash});
 }return {snapshot,proofs};
}
function audit(){
 const {snapshot,proofs}=catalog(),d=snapshot.collections,active=rows=>rows.filter(r=>r.status==='active'),runtime=vm.createContext({});
 for(const file of ['journey-path','student-journey','mission-assessment','practice-review','mission-review'])vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace(/export /g,''),runtime);
 const issues=[],missions=active(d.missions),rows=[];
 for(const m of missions){const quizzes=active(d.quizzes).filter(q=>q.missionId===m.id),scenes=active(d.storyScenes).filter(s=>s.missionId===m.id);let topicCount=0;
  try{if(quizzes.length!==1)throw Error('Expected one quiz');const q=quizzes[0],bank=active(d.questions).filter(x=>x.quizId===q.id),practice=active(d.practiceQuestions).filter(x=>x.missionId===m.id),first=runtime.selectMissionQuestions(bank,q,[],()=>0.2),retry=runtime.selectMissionQuestions(bank,q,first.questions.map(x=>x.id),()=>0.8);
   runtime.validateQuestionSet(bank,q,retry.questions.map(x=>x.id));runtime.requirePracticePolicy(q.practicePolicy);
   if(first.questions.length!==5||retry.questions.length!==5||retry.repeatedQuestions!==0)throw Error('Initial/retry coverage is incomplete');
   for(const slot of q.questionBlueprint){topicCount++;if(!scenes.some(s=>s.reviewTopics?.includes(slot.topic)&&String(s.content||'').trim()))throw Error('Missing lesson for '+slot.topic);const items=practice.filter(x=>x.topic===slot.topic);if(!items.some(x=>x.difficulty==='easy')||!items.some(x=>x.difficulty==='hard'))throw Error('Missing practice difficulty for '+slot.topic);}
   for(const item of [...bank,...practice]){if(!['A','B','C','D'].every(k=>String(item['option'+k]||'').trim()))throw Error('Missing choice '+item.id);if(!String(item.explanation||'').trim())throw Error('Missing feedback '+item.id);if(!String(item['option'+item.correctAnswer]||'').trim())throw Error('Missing scoring answer '+item.id);}
   for(const scene of scenes){const choices=scene.decisionChoices||scene.checkChoices,answer=scene.decisionChoices?scene.decisionCorrectAnswer:scene.checkCorrectAnswer;if(!choices?.includes(answer))throw Error('Broken scene activity '+scene.id);}
  }catch(error){issues.push({missionId:m.id,message:error.message});}
  rows.push({id:m.id,title:m.title,scenes:scenes.length,topics:topicCount});
 }
 const state={userId:'offline-handoff-fixture',eras:d.eras,chapters:d.chapters,missions:d.missions,challenges:d.chapterChallenges,chapterProgress:[],missionProgress:[],attempts:[],drafts:[]},steps=[],seen=new Set();
 for(let i=0;i<100;i++){const next=runtime.resolveStudentJourney(state);if(next.kind==='complete'){steps.push({kind:'complete',...next.completion,latestChapter:next.completion.latestChapter?.id});break;}
  const id=next.mission?.id||next.chapter?.id,key=next.kind+':'+id;if(!id||seen.has(key)||!['mission','challenge'].includes(next.kind)){issues.push({route:key,message:'Route stopped or repeated'});break;}seen.add(key);
  const route=runtime.buildJourneyPath(state).flatMap(e=>e.chapters).find(c=>c.id===next.chapter.id);
  if(next.kind==='mission'){if(!route?.missions.find(m=>m.id===id)?.accessible)issues.push({route:key,message:'Home recommends a locked mission'});state.missionProgress.push({userId:state.userId,chapterId:next.chapter.id,missionId:id,completed:true});}
  else{if(!route?.challengeAccessible)issues.push({route:key,message:'Home recommends a locked challenge'});state.chapterProgress.push({userId:state.userId,chapterId:id,completed:true});}steps.push({kind:next.kind,id});
 }
 const final=steps.at(-1);if(final?.kind!=='complete'||final.missionCount!==66||final.chapterCount!==16)issues.push({message:'Expected completion of all 66 missions and 16 chapters'});
 const sourceReview=active(d.storyScenes).filter(s=>!s.sourceUrls?.length).map(s=>({id:s.id,missionId:s.missionId,parentSources:d.missions.find(m=>m.id===s.missionId)?.sourceUrls||[],reason:'No scene-level source URLs; check attribution and supporting evidence.'}));
 const feedbackReview=active(d.practiceQuestions).filter(q=>!['A','B','C','D'].every(k=>String(q.answerExplanations?.[k]||'').trim())).map(q=>({id:q.id,missionId:q.missionId,topic:q.topic,reason:'Shared explanation available; choice-specific feedback needs editorial review.'}));
 return {checkedAt:new Date().toISOString(),mode:'offline-catalog-and-synthetic-progression',baselineAt:snapshot.auditedAt,status:issues.length?'fail':'pass',missions:rows,counts:{missions:rows.length,scenes:rows.reduce((n,m)=>n+m.scenes,0),topics:rows.reduce((n,m)=>n+m.topics,0),completedMissions:state.missionProgress.length,completedChapters:state.chapterProgress.length},steps,issues,publicationProofs:proofs,editorial:require('./audit-learning-clarity.cjs').audit(snapshot).counts,feedbackReview,sourceReview,limits:['Dated catalog plus verified published overlays; not a fresh live curriculum read.','Synthetic completion tests navigation only; it does not write or verify learner saves.','Shared feedback supports the existing practice route; missing choice-specific coaching is tracked separately, not treated as absent feedback.','Topic mapping and structural checks do not establish factual accuracy, teaching adequacy or child comprehension.']};
}
if(require.main===module){const report=audit();fs.writeFileSync(path.join(root,'docs/validation/student-handoff-audit-2026-10-31.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,counts:report.counts,issues:report.issues,editorial:report.editorial},null,2));if(report.status!=='pass')process.exitCode=1;}
module.exports={catalog,audit};
