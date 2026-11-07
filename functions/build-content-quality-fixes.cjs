// Reuse existing authored lesson checks; do not generate new historical events or sources.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const supplemental=require('../data/quality-fix-hard-cases.cjs');
const easyStems=require('../data/quality-fix-easy-stems.cjs');
const {readingParts,normalize}=require('../js/lesson-narration-text.js');
const letters=['A','B','C','D'],oldAnswer='The note supports the point it states in this case; broader conclusions need more evidence.';
function publishedBaseline(){return require('./audit-student-handoff.cjs').catalog(true,true,true,false).snapshot;}
function coach(option,question,explanation){
 let reason;
 if(/what larger claim would require|what .*not establish|what cannot|which claim.*(need|beyond|unproven)|what .*not prove|what .*not tell|which conclusion.*not/i.test(question))reason='The task asks what needs more evidence, not just a familiar detail.';
 else if(/human worth|peoples? worth|cultural worth|intelligence|rank.*ancestry|ancestry rank|less worthy|inferior|backward/i.test(option))reason='A social label or political relationship is not a measure of human worth or ability.';
 else if(/perform.*(worship|prayer)|adopt.*faith|sharing family religion|performing a prayer/i.test(option))reason='Learning about religious history does not require classmates to practise a faith for marks.';
 else if(/invent.*(speech|dialogue)|exact speech|imagined.*quot|fiction.*(proof|quotation)/i.test(option))reason='An invented classroom statement cannot establish a historical person’s exact words.';
 else if(/guarantee|automatically|automatic|permanent peace/i.test(option))reason='An aim or event does not guarantee a later result.';
 else if(/every|\ball\b|identical|universa|entire|everyone|unchanged|\balways\b|\bnever\b/i.test(option))reason='Check whether this all-or-nothing claim goes beyond the case’s evidence.';
 else if(/\bonly\b|\balone\b/i.test(option))reason='Check the other contributions or evidence included in this case.';
 else if(/private (thought|motive|belief)|everyone.s (thought|feeling)|complete (biography|motive)/i.test(option))reason='A recorded action or title does not disclose every private thought or motive.';
 else if(/without (evidence|people|work|other record)|evidence unnecessary|remove.*need.*(evidence|dates)|dates.*cannot matter|ignoring.*knowledge/i.test(option))reason='This removes a part of the explanation that still needs evidence, people or context.';
 else reason='Match this choice to the task, then compare it with the supported detail.';
 const sentences=[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(explanation.replace(/^Correct[.!]\s*/i,''))].map(x=>x.segment.trim());
 const supported=sentences.find(s=>s.split(/\s+/).length>3)||explanation;
 return 'Recheck “'+option+'”: '+reason+' '+supported;
}
function build(snapshot=publishedBaseline()){
 const d=snapshot.collections,pending=new Map(),provenance=[],summary={hardQuestions:0,easyStems:0,repeatedFeedbackRecords:0,obsoleteNotices:0,reflowedScenes:0,reusedLessonCases:0,supplementalCases:0};
 const put=(name,row,fields)=>{const key=name+'/'+row.id;if(!pending.has(key)){const {id,...expected}=row;pending.set(key,{path:key,create:false,expected,expectedAbsent:[],fields:{}});}const w=pending.get(key);Object.assign(w.fields,fields);w.expectedAbsent=Object.keys(w.fields).filter(k=>!Object.hasOwn(w.expected,k));};
 for(const q of d.questions.filter(q=>q.status==='active'&&q['option'+q.correctAnswer]===oldAnswer)){
  const quiz=d.quizzes.find(x=>x.id===q.quizId),scene=d.storyScenes.find(s=>s.status==='active'&&s.missionId===quiz.missionId&&s.reviewTopics?.length===1&&s.reviewTopics.includes(q.topic)&&((s.decisionChoices?.length===4&&s.decisionChoices.includes(s.decisionCorrectAnswer))||(s.checkChoices?.length===4&&s.checkChoices.includes(s.checkCorrectAnswer))));
  let question,options,correct,explanation,source;
  if(scene){const decision=scene.decisionChoices?.length===4&&scene.decisionChoices.includes(scene.decisionCorrectAnswer);options=decision?scene.decisionChoices:scene.checkChoices;correct=decision?scene.decisionCorrectAnswer:scene.checkCorrectAnswer;question='Apply the lesson about '+scene.title+': '+(decision?(scene.decisionSituation||scene.decisionQuestion):scene.checkQuestion);explanation=(decision?scene.decisionExplanation:scene.checkExplanation)||q.learningPoint||q.explanation;source='storyScenes/'+scene.id;summary.reusedLessonCases++;}
  else{const item=supplemental[q.topic];if(!item)throw Error('Missing supplemental case '+q.id);[question,correct,...options]=item;explanation=options.pop();options=[correct,...options];source='supplemental/'+q.topic;summary.supplementalCases++;}
  if(scene&&!/[?][”"']?$/.test(question.trim()))question+=' '+(scene.decisionChoices?scene.decisionQuestion:scene.checkQuestion);
  if(new Set(options).size!==4||!options.includes(correct)||!question||!explanation)throw Error('Incomplete source case '+q.id);
  const wrong=options.filter(v=>v!==correct),answerText={[q.correctAnswer]:correct};letters.filter(k=>k!==q.correctAnswer).forEach((k,i)=>answerText[k]=wrong[i]);
  put('questions',q,{question,...Object.fromEntries(letters.map(k=>['option'+k,answerText[k]])),explanation,answerExplanations:Object.fromEntries(letters.map(k=>[k,k===q.correctAnswer?explanation:coach(answerText[k],question,explanation)])),historicalClue:explanation,learningPoint:q.learningPoint||explanation});
  provenance.push({questionId:q.id,topic:q.topic,source});summary.hardQuestions++;
 }
 for(const q of d.questions.filter(q=>q.status==='active'&&/^Which choice best matches the lesson.s main idea/.test(q.question))){
  const base=d.questions.find(r=>r.quizId===q.quizId&&r.topic===q.topic&&!r.id.includes('adaptive')&&letters.every(k=>r['option'+k]===q['option'+k])&&r.correctAnswer===q.correctAnswer);
  const question=base?.question||easyStems[q.topic];if(!question)throw Error('Unreviewed easy stem '+q.id);
  put('questions',q,{question});summary.easyStems++;
 }
 for(const name of ['questions','practiceQuestions'])for(const q of d[name].filter(q=>q.status==='active')){
  if(pending.get(name+'/'+q.id)?.fields.optionA!==undefined)continue;
  const wrong=letters.filter(k=>k!==q.correctAnswer).map(k=>q.answerExplanations?.[k]);
  if(!wrong.every(v=>typeof v==='string'&&v.trim())||new Set(wrong).size!==1)continue;
  const explanation=q.explanation;if(!explanation)throw Error('Missing supported explanation '+q.id);
  const question=pending.get(name+'/'+q.id)?.fields.question||q.question;
  put(name,q,{answerExplanations:Object.fromEntries(letters.map(k=>[k,k===q.correctAnswer?(q.answerExplanations?.[k]||explanation):coach(q['option'+k],question,explanation)]))});summary.repeatedFeedbackRecords++;
 }
 for(const s of d.storyScenes.filter(s=>s.status==='active')){
  let content=s.content,changed=false;
  if(/remain unfinished|still being prepared|still need to be built|only .*prepared here/i.test(content)){
   const mission=d.missions.find(m=>m.id===s.missionId),missions=d.missions.filter(m=>m.chapterId===mission.chapterId&&m.status==='active'),challenge=d.chapterChallenges.find(c=>c.chapterId===mission.chapterId&&c.status==='active'),quiz=d.quizzes.find(q=>q.missionId===mission.id&&q.status==='active');
   if(!challenge||!quiz)throw Error('Cannot confirm real completion route '+s.id);
   const paragraphs=content.split(/\n\s*\n/);paragraphs[paragraphs.length-1]='The mission quiz has '+quiz.questionCount+' questions. Answer at least '+Math.ceil(quiz.questionCount*quiz.passingScore/100)+' correctly to pass and earn the mission reward once. If you need help, revisit the linked lesson, practise and retry. Complete all '+missions.length+' chapter missions, then pass the chapter challenge to finish the chapter.';content=paragraphs.join('\n\n');changed=true;summary.obsoleteNotices++;
  }
  const reflowed=content.split(/\n\s*\n/).flatMap(p=>p.trim().split(/\s+/).length>70?readingParts(p):[p.trim()]).filter(Boolean).join('\n\n');
  if(normalize(reflowed)!==normalize(content))throw Error('Reading text changed '+s.id);
  if(reflowed!==content){content=reflowed;changed=true;summary.reflowedScenes++;}
  if(changed)put('storyScenes',s,{content});
 }
 return {projectId:'lakbaypanahon-1797e',baselineAt:snapshot.auditedAt,scope:'Existing lesson-case hard questions, contextual feedback, verified completion notices and whole-sentence paragraph formatting. No scoring policy, rewards or learner writes.',summary,provenance,writes:[...pending.values()]};
}
function validatePlan(plan){if(plan.projectId!=='lakbaypanahon-1797e'||plan.summary?.hardQuestions!==225||plan.summary?.obsoleteNotices!==22||!plan.writes.length||new Set(plan.writes.map(w=>w.path)).size!==plan.writes.length)throw Error('Unexpected quality-fix scope');for(const w of plan.writes){const allowed=w.path.startsWith('storyScenes/')?['content']:/^(questions|practiceQuestions)\//.test(w.path)?['question','optionA','optionB','optionC','optionD','explanation','answerExplanations','historicalClue','learningPoint']:[];if(w.create!==false||w.expected?.status!=='active'||Object.keys(w.fields).some(k=>!allowed.includes(k)))throw Error('Protected field change');}return true;}
if(require.main===module){const p=build();validatePlan(p);fs.writeFileSync(path.join(root,'data/content-quality-fixes-migration.json'),JSON.stringify(p,null,2));console.log(JSON.stringify({documents:p.writes.length,...p.summary}));}
module.exports={build,validatePlan,publishedBaseline};
