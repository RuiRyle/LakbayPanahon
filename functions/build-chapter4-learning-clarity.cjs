// Offline authoring compiler for the remaining three Chapter 4 missions.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),{missions}=require('../data/chapter4-learning-clarity-authoring.cjs');
const decisionQuestions=[
  [
    "What question helps a class study a spoken account?",
    "Which description fits the labelled ka teaching sign?",
    "Which caption distinguishes the copperplate from the teaching card?",
    "What should be checked before sharing this writing example?",
    "What should a learner check before repeating the claimed translation?"
  ],
  [
    "Which material fits the stated bending task, and why?",
    "Which sequence matches the worked making model?",
    "What would explain the skill behind the displayed object?",
    "What should a report do with the invented design meaning?",
    "Which explanation connects the changed tool with continuing knowledge?"
  ],
  [
    "How should the two named examples be described?",
    "What else matters besides climate in explaining a community?",
    "What should be checked before explaining the difference between the accounts?",
    "What similarity and difference fit the two source summaries?",
    "How should the poster replace its claim about every community?"
  ],
  [
    "How can the display connect examples with contributions?",
    "How could this display include more relevant voices?",
    "What do the two sources support together?",
    "What should a project check before using the craftsperson's work?",
    "Which report connects heritage contributions with sources and limits?"
  ]
];
function build(snapshot){const d=snapshot.collections,writes=[],status='Authored Chapter 4 clarity revision; independent teacher and learner review pending';
 const put=(name,row,fields)=>{if(!row||row.status!=='active')throw Error('Active baseline required');const {id,...expected}=row;writes.push({path:name+'/'+id,create:false,expected,expectedAbsent:Object.keys(fields).filter(k=>!Object.hasOwn(expected,k)),fields});};
 missions.forEach((m,missionIndex)=>{const old=d.missions.find(row=>row.id===m.id),scenes=d.storyScenes.filter(s=>s.missionId===m.id&&s.status==='active').sort((a,b)=>a.order-b.order);if(scenes.length!==5||m.topics.length!==5)throw Error('Expected five teaching scenes and topics');
  put('missions',old,{learningObjective:m.question,learningObjectives:m.objectives,lessonRecap:m.topics.map(t=>t.point).join(' '),contentReviewStatus:status});
  m.topics.forEach((t,index)=>{const scene=scenes[index];if(!scene.reviewTopics.includes(t.id)||t.items.length!==6||t.wrong.length!==4)throw Error('Authored topic mapping mismatch');
   const vocabulary=[{term:scene.keyTerm,definition:scene.keyTermDefinition}],example=t.items[1][0]+' '+t.items[1][1];
   put('storyScenes',scene,{title:t.title,content:t.paragraphs.join('\n\n'),exploreIntroduction:'Read each clue. Connect the observation with the idea it supports.',exploreItems:[{title:'Understand the idea',hint:'What does this explain?',discovery:t.point,icon:'🔎'},{title:'Work through an example',hint:'Connect this case to the idea.',discovery:example,icon:'📜'},{title:'Check a common mix-up',hint:'What would need different evidence?',discovery:t.wrong[0][1],icon:'🧠'}],learningHelp:{explanation:t.point,vocabulary,example,guidingQuestion:'Which detail supports your explanation, and what remains unknown?'},decisionQuestion:decisionQuestions[missionIndex][index],discoveryTitle:'Remember: '+t.title,discoveryText:t.point,contentReviewStatus:status});
   const main=d.questions.filter(q=>q.quizId===m.quiz&&q.topic===t.id&&q.status==='active'),practice=d.practiceQuestions.filter(q=>q.missionId===m.id&&q.topic===t.id&&q.status==='active');if(main.length!==4||practice.length!==2)throw Error('Unexpected question bank size');
   const ordered=[main.find(q=>!q.id.includes('-retry')&&!q.id.includes('-adaptive-')),main.find(q=>q.id.endsWith('-retry')),main.find(q=>q.id.endsWith('-adaptive-easy')),main.find(q=>q.id.endsWith('-adaptive-hard')),practice.find(q=>q.difficulty==='easy'),practice.find(q=>q.difficulty==='hard')];
   ordered.forEach((row,variant)=>{if(!row)throw Error('Missing variant');const [question,correct,explanation]=t.items[variant],wrong=t.wrong.slice(variant%4).concat(t.wrong.slice(0,variant%4)).slice(0,3),letters=['A','B','C','D'],remaining=letters.filter(k=>k!==row.correctAnswer),answers={[row.correctAnswer]:{text:correct,feedback:explanation}};remaining.forEach((k,i)=>answers[k]={text:wrong[i][0],feedback:wrong[i][1]});
    const hint='Compare the specific observation with the idea: '+t.title.toLowerCase()+'.';put(variant<4?'questions':'practiceQuestions',row,{question,...Object.fromEntries(letters.map(k=>['option'+k,answers[k].text])),explanation,answerExplanations:Object.fromEntries(letters.map(k=>[k,answers[k].feedback])),historicalClue:t.point,learningPoint:t.point,...(variant>=4?{hint,answerHints:Object.fromEntries(letters.map(k=>[k,hint]))}:{}),contentReviewStatus:status});
   });
  });
 });return {projectId:'lakbaypanahon-1797e',baselineAt:snapshot.auditedAt,scope:'Four Chapter 4 missions: 20 scene bodies/help/questions and 120 assessment records; preserve topic mapping, decision answer keys, grading, routes, evidence policies and rewards.',writes};
}
if(require.main===module){const snapshot=publishedBaseline(),plan=build(snapshot);fs.writeFileSync(path.join(root,'data/chapter4-learning-clarity-migration.json'),JSON.stringify(plan,null,2));let md='# Chapter 4: remaining mission content revision\n\nPrepared 31 October 2026. **Authoring review copy**. Check the separate Chapter 4 publication report for its current status. Source lessons, images, topic mappings, decision answer strings, difficulty policies and rewards are retained. Independent teaching/source review is pending.\n\n';for(const m of missions){md+='## '+m.id+'\n\n'+m.question+'\n\n';for(const t of m.topics){md+='### '+t.title+'\n\n'+t.paragraphs.join('\n\n')+'\n\n**Key idea:** '+t.point+'\n\n<details>\n<summary>Reviewer: six question situations, supported answers and explanations</summary>\n\n';for(const [q,answer,why]of t.items)md+='- **'+q+'** '+answer+' '+why+'\n';md+='\n</details>\n\n';}}fs.writeFileSync(path.join(root,'docs/chapter4-learning-clarity-review.md'),md);console.log('Prepared '+plan.writes.length+' guarded records for four missions. Nothing published.');}
function validatePlan(plan){
 if(plan.projectId!=='lakbaypanahon-1797e'||plan.writes?.length!==144||new Set(plan.writes.map(w=>w.path)).size!==144)throw Error('Expected 144 reviewed Chapter 4 documents');
 const assessment=['question','optionA','optionB','optionC','optionD','explanation','answerExplanations','historicalClue','learningPoint','hint','answerHints','contentReviewStatus'];
 for(const w of plan.writes){const old=w.expected;if(w.create!==false||old?.status!=='active')throw Error('Active baseline required');let allowed;
  if(missions.some(m=>w.path==='missions/'+m.id)){if(old.chapterId!=='chapter-4'||typeof old.xpReward!=='number')throw Error('Mission identity required');allowed=['introduction','learningObjective','learningObjectives','lessonRecap','contentReviewStatus'];}
  else if(missions.some(m=>w.path.startsWith('storyScenes/'+m.id+'-scene'))){if(!missions.some(m=>m.id===old.missionId)||!Array.isArray(old.reviewTopics))throw Error('Scene identity required');allowed=['title','content','exploreIntroduction','exploreItems','learningHelp','decisionQuestion','discoveryTitle','discoveryText','contentReviewStatus'];}
  else if(w.path.startsWith('questions/')&&missions.some(m=>m.quiz===old.quizId)||w.path.startsWith('practiceQuestions/')&&missions.some(m=>m.id===old.missionId)){if(!['A','B','C','D'].includes(old.correctAnswer)||!old.topic||!old.difficulty)throw Error('Assessment identity required');if(w.path.startsWith('practiceQuestions/')&&!old.reviewEvidencePolicy)throw Error('Practice policy guard missing');allowed=assessment;}
  else throw Error('Out-of-scope record');
  if(Object.keys(w.fields).some(k=>!allowed.includes(k)))throw Error('Protected field change');if(Object.keys(w.fields).some(k=>!Object.hasOwn(old,k)&&!w.expectedAbsent?.includes(k)))throw Error('Missing field guard');
 }
 return true;
}
function publishedBaseline(){const crypto=require('node:crypto'),snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/learning-content-snapshot-2026-10-31.json'),'utf8'));for(const [planFile,proofFile]of [['data/all-mission-learning-migration.json','docs/validation/all-mission-learning-publication-2026-10-31.json'],['data/chapter4-learning-clarity-initial-published.json','docs/validation/chapter4-learning-clarity-initial-publication-2026-10-31.json']]){const raw=fs.readFileSync(path.join(root,planFile)),proof=JSON.parse(fs.readFileSync(path.join(root,proofFile),'utf8'));if(proof.mode!=='published-and-read-back'||crypto.createHash('sha256').update(raw).digest('hex')!==proof.planHash)throw Error('Verified prior publication required');for(const w of JSON.parse(raw).writes){const [name,id]=w.path.split('/'),row=snapshot.collections[name].find(r=>r.id===id);if(!row)throw Error('Missing overlay record');Object.assign(row,w.fields);}}return snapshot;}
module.exports={build,validatePlan,publishedBaseline};
