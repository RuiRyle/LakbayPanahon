// Offline reviewer trace only; never imports Firebase or executes a migration.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {buildCandidateCatalog}=require('./student-content-candidate-local.cjs');
const root=path.resolve(__dirname,'..'),{baseline,catalog,inputs}=buildCandidateCatalog();
if(process.argv.length>2)throw Error('This local review accepts no publication or network flags.');
const rows=name=>[...catalog].filter(([key,row])=>key.startsWith(name+'/')&&row.status==='active').map(([key,row])=>({...row,path:key}));
const text=value=>typeof value==='string'&&value.trim().length>0;
const chapters=rows('chapters').filter(row=>['chapter-2','chapter-3','chapter-4'].includes(row.id));
const chapterIds=new Set(chapters.map(row=>row.id)),missions=rows('missions').filter(row=>chapterIds.has(row.chapterId));
const missionIds=new Set(missions.map(row=>row.id)),scenes=rows('storyScenes').filter(row=>missionIds.has(row.missionId)),quizzes=rows('quizzes').filter(row=>missionIds.has(row.missionId)),questions=rows('questions'),practice=rows('practiceQuestions');
const findings=[],topics=[];
const flag=(severity,kind,record,topic)=>findings.push({severity,kind,path:record.path,topic});
const reason=(question,key)=>text(question.answerExplanations?.[key])||text(question.explanation);
for(const quiz of quizzes){
 for(const slot of quiz.questionBlueprint||[]){
  const mapped=scenes.filter(row=>row.missionId===quiz.missionId&&row.reviewTopics?.includes(slot.topic));
  const main=questions.filter(row=>row.quizId===quiz.id&&row.topic===slot.topic);
  const coaching=practice.filter(row=>row.missionId===quiz.missionId&&row.topic===slot.topic);
  if(!mapped.length)flag('error','missing-lesson-mapping',quiz,slot.topic);
  if(main.length<2*(slot.count||1))flag('error','insufficient-main-retry-variants',quiz,slot.topic);
  if(!coaching.length)flag('error','missing-practice',quiz,slot.topic);
  for(const scene of mapped){
   if(!text(scene.content))flag('error','missing-lesson-body',scene,slot.topic);
   if(!text(scene.learningHelp?.explanation)||!text(scene.learningHelp?.example))flag('review','worked-help-gap',scene,slot.topic);
  }
  for(const question of [...main,...coaching]){
   if(!['A','B','C','D'].includes(question.correctAnswer)||!['A','B','C','D'].every(key=>text(question['option'+key])))flag('error','invalid-choice-question',question,slot.topic);
   if(!reason(question,question.correctAnswer))flag('error','missing-correct-reason',question,slot.topic);
   if(!text(question.learningPoint))flag('review','missing-key-idea',question,slot.topic);
  }
  for(const question of main)if(!['A','B','C','D'].every(key=>text(question.answerExplanations?.[key])))flag('review','generic-main-feedback',question,slot.topic);
  const hintSupport=coaching.map(question=>{
   const wrong=['A','B','C','D'].filter(key=>key!==question.correctAnswer);
   const selected=wrong.every(key=>text(question.answerHints?.[key]));
   const shared=text(question.hint)||text(question.historicalClue);
   const support=selected?'choice-specific':shared?'shared-hint':text(question.explanation)?'explanation-fallback':'missing';
   if(support==='explanation-fallback')flag('review','full-explanation-used-as-hint',question,slot.topic);
   if(support==='missing')flag('error','missing-wrong-answer-support',question,slot.topic);
   return{path:question.path,support};
  });
  const mission=missions.find(row=>row.id===quiz.missionId);
  topics.push({chapterId:mission.chapterId,missionId:mission.id,topic:slot.topic,lessonScenes:mapped.map(row=>row.path),mainVariants:main.map(row=>row.path),practice:hintSupport,reviewUrl:'story.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id,reviewTopic:slot.topic}),practiceUrl:'practice.html?'+new URLSearchParams({chapter:mission.chapterId,mission:mission.id,topic:slot.topic,review:'1'}),semanticApproval:'not-established'});
 }
}
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const para=value=>'<p>'+escape(value).replaceAll('\n','<br>')+'</p>';
const item=record=>'<code>'+escape(record.path)+'</code>';
const renderQuestion=question=>'<article>'+item(question)+para(question.question)+'<ol type="A">'+['A','B','C','D'].map(key=>'<li>'+escape(question['option'+key])+(key===question.correctAnswer?' <strong>Correct</strong>':'')+'</li>').join('')+'</ol>'+para('Shared explanation: '+(question.explanation||'Not authored'))+['A','B','C','D'].map(key=>para(key+' feedback: '+(question.answerExplanations?.[key]||'Uses shared explanation'))).join('')+para('Key idea: '+(question.learningPoint||'Not authored'))+(question.path.startsWith('practiceQuestions/')?['A','B','C','D'].filter(key=>key!==question.correctAnswer).map(key=>para(key+' hint: '+(question.answerHints?.[key]||question.hint||question.historicalClue||'[Falls back to full explanation]'))).join(''):'')+'</article>';
const sections=topics.map((topic,index)=>{
 const lesson=topic.lessonScenes.map(key=>catalog.get(key)).map(scene=>'<article>'+item({path:'storyScenes/'+scene.id})+'<h3>'+escape(scene.title)+'</h3>'+para(scene.content)+para('Simpler explanation: '+(scene.learningHelp?.explanation||'Not authored'))+para('Worked example: '+(scene.learningHelp?.example||'Not authored'))+para('Guiding question: '+(scene.learningHelp?.guidingQuestion||'Not authored'))+'</article>').join('');
 return '<section id="topic-'+index+'"><h2>'+escape(topic.chapterId+' / '+topic.missionId+' / '+topic.topic)+'</h2><p class="note">Review path: '+escape(topic.reviewUrl)+'</p><h3>Teach / revisit</h3>'+lesson+'<h3>Main quiz / retry</h3>'+topic.mainVariants.map(key=>renderQuestion({...catalog.get(key),path:key})).join('')+'<h3>Practice hints / explanations</h3>'+topic.practice.map(({path:key})=>renderQuestion({...catalog.get(key),path:key})).join('')+'<p class="review">Reviewer: Does the lesson teach the reasoning asked here? Can a Grade 5 learner understand each hint? Is the example qualified correctly? Record an approval or a specific correction; tags/counts do not prove learning.</p></section>';
}).join('');
const buildRoot=path.join(root,'build');fs.mkdirSync(buildRoot,{recursive:true});const output=fs.mkdtempSync(path.join(buildRoot,'student-review-')),packet=path.join(output,'chapters234-review.html');
fs.writeFileSync(packet,'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chapters 2–4 reviewer packet</title><style>body{max-width:1100px;margin:32px auto;padding:20px;background:#081629;color:#d9e4ef;font:16px/1.7 system-ui}h1,h2,strong,a{color:#e8c778}h2{margin-top:48px}article{padding:20px;margin:14px 0;border:1px solid #36516e;border-radius:12px;background:#112840}p,li,code{overflow-wrap:anywhere}.note,.review{padding:16px;background:#19334b}a:focus-visible{outline:3px solid #e8c778}code{color:#aebfd2}@media print{body,article{background:white;color:black}h1,h2,strong,a,code{color:black}section{break-before:page}}</style><h1>Chapters 2–4: adult reviewer packet</h1><p class="note">LOCAL CANDIDATE — includes unpublished Chapter 2 family/women-role drafts. Not current Firestore or a student handout. Answer keys are included for adult review. No historical, teacher or comprehension approval is inferred.</p><nav>'+topics.map((topic,index)=>'<a href="#topic-'+index+'">'+escape(topic.chapterId+' / '+topic.topic)+'</a>').join(' · ')+'</nav>'+sections+'</html>');
const sourceFiles=['docs/validation/learning-content-snapshot.json',...new Set(inputs.map(file=>'data/'+file))];
const report={checkedAt:new Date().toISOString(),mode:'offline-candidate-not-live',baselineAt:baseline.auditedAt,status:findings.some(row=>row.severity==='error')?'structural-gaps':'structural-trace-complete',counts:{chapters:chapters.length,missions:missions.length,scenes:scenes.length,topics:topics.length,errors:findings.filter(row=>row.severity==='error').length,reviewFlags:findings.filter(row=>row.severity==='review').length},findings,topics,packet:path.relative(root,packet).replaceAll('\\','/'),limits:['No Firebase calls or publication.','Candidate overlays include pending drafts and are not verified live state.','Hint fields, mappings and counts require semantic, historical and Grade 5 review.'],sources:sourceFiles.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}))};
fs.writeFileSync(path.join(root,'docs/validation/chapters234-learning-review-local.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({counts:report.counts,findings,packet:report.packet},null,2));if(report.counts.errors)process.exitCode=1;
