// Offline reviewer packet from the dated catalog plus hash-verified publications.
// Never changes live curriculum or marks a competency approved.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),{catalog}=require('./audit-student-handoff.cjs');
function main(){
 const {snapshot,proofs}=catalog(),d=snapshot.collections;
 const review=JSON.parse(fs.readFileSync(path.join(root,'data/grade5-coverage-review.json'),'utf8'));
 const partial=review.competencies.filter(c=>c.status==='partial');
 const rows=partial.map(c=>({...c,reviewStatus:'awaiting-human-review',evidence:c.missions.map(id=>{
  const mission=d.missions.find(m=>m.id===id),scenes=d.storyScenes.filter(s=>s.missionId===id&&s.status==='active').sort((a,b)=>a.order-b.order),quizzes=d.quizzes.filter(q=>q.missionId===id&&q.status==='active');
  const questions=d.questions.filter(q=>quizzes.some(quiz=>quiz.id===q.quizId)&&q.status==='active');
  return{missionId:id,title:mission?.title||'Mission not located',chapterId:mission?.chapterId||null,objective:mission?.learningObjective||'',guide:mission?.learningGuide||null,sources:mission?.sourceUrls||[],scenes:scenes.map(s=>({id:s.id,title:s.title,content:s.content,sourceUrls:s.sourceUrls||[],reviewTopics:s.reviewTopics||[]})),questions:questions.map(q=>({id:q.id,topic:q.topic,question:q.question,choices:Object.fromEntries(['A','B','C','D'].map(k=>[k,q['option'+k]])),correctAnswer:q.correctAnswer,explanation:q.explanation}))};
 })}));
 if(rows.length!==13||rows.some(c=>c.evidence.some(m=>!m.chapterId||!m.scenes.length)))throw Error('Expected 13 mapped partial targets with actual lesson evidence.');
 const report={preparedAt:new Date().toISOString(),mode:'offline-human-review-packet-not-approval',baselineAt:snapshot.auditedAt,editorialReviewDate:review.reviewDate,provisionalBaseline:review.baseline,publicationProofs:proofs,partialTargets:rows};
 const json=JSON.stringify(report,null,2);fs.writeFileSync(path.join(root,'docs/validation/learning-review-packet-2026-11-01.json'),json);
 const out=['# Grade 5 content review packet','',`Prepared 1 November 2026. **13 targets await human review.** The original findings are dated ${review.reviewDate}; they may be partly addressed by subsequent teaching revisions. Do not infer adequacy from the old label or from keyword matches.`, '', 'This packet uses the dated curriculum snapshot plus hash-verified published overlays, not a fresh full-database download. It contains assessment answers: keep it with adult reviewers, not in the learner task sheet. It is excluded from the public website package.','', 'For each target: read the current teaching and questions; verify historical claims against the listed sources; identify a concrete missing/unclear passage; propose a small correction; record reviewer/date and a learner explanation check. Statuses: needs correction / suitable for supervised playtest / needs specialist input. None means DepEd certification.',''];
 for(const c of rows){out.push(`## ${c.id}: ${c.focus}`,'',`Earlier finding: ${c.finding}`,'',`Suggested teaching/check: ${c.nextActivity}`,'');for(const m of c.evidence){out.push(`### ${m.missionId}: ${m.title}`,'',`Objective: ${m.objective}`,'',...m.sources.map(url=>`- ${url}`),'');for(const s of m.scenes)out.push(`#### ${s.id}: ${s.title}`,'',s.content,'');out.push('#### Existing assessment samples','');for(const q of m.questions.slice(0,5))out.push(`- ${q.id} (${q.topic}): ${q.question}`,...Object.entries(q.choices).map(([k,v])=>`  - ${k}: ${v}`),`  - Key: ${q.correctAnswer}. ${q.explanation}`);out.push('');}out.push('Reviewer/date: __________','', 'Specific correction or approval-for-playtest rationale: __________','', 'Student explanation to check: __________','');}
 fs.writeFileSync(path.join(root,'docs/learning-review-packet.md'),out.join('\n'));
 console.log(JSON.stringify({targets:rows.length,missionReferences:rows.reduce((n,c)=>n+c.evidence.length,0),sha256:crypto.createHash('sha256').update(json).digest('hex'),classificationChanged:false,liveRecordsChanged:false}));
}
if(require.main===module)main();
