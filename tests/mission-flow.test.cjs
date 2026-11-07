const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../js',name),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
const pure=vm.createContext({});
vm.runInContext(read('mission-assessment.js')+read('practice-review.js')+read('mission-review.js'),pure);
const plan=require('../data/mission-quiz-flow-migration.json');
const original=require('./fixtures/mission-quiz-catalog.json');
const data={quizzes:original.quizzes,questions:original.questions,practiceQuestions:original.practice};
for(const write of plan.writes){const [name,id]=write.path.split('/');const rows=data[name];const old=rows.find(row=>row.id===id);if(old)Object.assign(old,write.fields);else rows.push({id,...write.fields});}
for(const file of ['barangay-scenario-quiz.json','livelihood-scenario-quiz.json','grade5-quiz-wording.json']){for(const write of require('../data/'+file).writes){const id=write.path.split('/')[1];const question=data.questions.find(q=>q.id===id);if(!question)throw Error('Missing fixture '+id);Object.assign(question,write.fields);}}
const quiz=data.quizzes.find(q=>q.id==='quiz-1');
const bank=data.questions.filter(q=>q.quizId===quiz.id);
test('every live mission has five objectives, equivalent unused retries and practice coverage',()=>{
 for(const quiz of data.quizzes){
    const bank=data.questions.filter(q=>q.quizId===quiz.id);
    const first=pure.selectMissionQuestions(bank,quiz,[],()=>0.2);
    const second=pure.selectMissionQuestions(bank,quiz,first.questions.map(q=>q.id),()=>0.8);
    assert.equal(first.questions.length,5);assert.equal(second.repeatedQuestions,0);
    pure.validateQuestionSet(bank,quiz,second.questions.map(q=>q.id));
    assert.equal(Math.ceil(quiz.passingScore*quiz.questionCount/100),3);
    pure.requirePracticePolicy(quiz.practicePolicy);
    for(const slot of quiz.questionBlueprint){
      const practice=data.practiceQuestions.filter(q=>q.missionId===quiz.missionId&&q.topic===slot.topic);
      assert.ok(practice.length>=2,quiz.id+' '+slot.topic);
      assert.ok(new Set(practice.map(q=>q.difficulty)).size>=2);
      assert.ok(practice.every(p=>!bank.some(q=>q.question===p.question)));
    }
 }
});
test('scored mission starts at a mastery-based level and falls back to available items',()=>{
 const topic=quiz.questionBlueprint[0].topic;
 const variants=bank.flatMap(question=>[
   {...question,id:'easy-'+question.id,difficulty:'easy'},
   {...question,id:'hard-'+question.id,difficulty:'hard'}
 ]);
 const review=pure.selectMissionQuestions([...bank,...variants],quiz,[],()=>0.2,[],{
   [topic]:{state:'review-needed',attempted:1,correct:0,missed:1}
 });
 assert.equal(review.questions.find(question=>question.topic===topic).difficulty,'easy');
 assert.ok(review.questions.filter(question=>question.topic!==topic).every(question=>question.difficulty==='medium'));
 const mastered=pure.selectMissionQuestions([...bank,...variants],quiz,[],()=>0.2,[],{
   [topic]:{state:'practice-goal-reached',attempted:3,correct:3,missed:0}
 });
 assert.equal(mastered.questions.find(question=>question.topic===topic).difficulty,'hard');
 const fallback=pure.selectMissionQuestions(bank,quiz,[],()=>0.2,[],{
   [topic]:{state:'review-needed',attempted:1,correct:0,missed:1}
 });
 assert.ok(fallback.questions.every(question=>question.difficulty==='medium'));
});
test('mastery-based starting level fills real two-question topic quotas with mixed difficulty items',()=>{
 const topic=quiz.questionBlueprint[0].topic;
 const twoQuestionQuiz={...quiz,questionCount:2,questionBlueprint:[{topic,difficulty:'medium',count:2}]};
 const variants=['medium-1','medium-2','easy-1','hard-1'].map(id=>({
   id,quizId:quiz.id,topic,difficulty:id.split('-')[0],status:'active',
   optionA:'A',optionB:'B',optionC:'C',optionD:'D',correctAnswer:'A'
 }));
 const review=pure.selectMissionQuestions(variants,twoQuestionQuiz,[],()=>0,[],{
   [topic]:{state:'review-needed',attempted:1,correct:0,missed:1}
 });
 assert.equal(Array.from(review.questions,question=>question.difficulty).sort().join(','),'easy,medium');
 const mastered=pure.selectMissionQuestions(variants,twoQuestionQuiz,[],()=>0,[],{
   [topic]:{state:'practice-goal-reached',attempted:3,correct:3,missed:0}
 });
 assert.equal(Array.from(mastered.questions,question=>question.difficulty).sort().join(','),'hard,medium');
 const firstRun=pure.selectMissionQuestions(variants,twoQuestionQuiz,[],()=>0,[],{});
 assert.equal(Array.from(firstRun.questions,question=>question.difficulty).join(','),'medium,medium');
});
test('repeated boilerplate hard variants are skipped until they are replaced',()=>{
 const topic=quiz.questionBlueprint[0].topic;
 const oneQuestionQuiz={...quiz,questionCount:1,questionBlueprint:[{topic,difficulty:'medium',count:1}]};
 const medium={...bank[0],id:'usable-medium',topic,difficulty:'medium',status:'active'};
 const weakHard={...bank[0],id:'weak-template-hard',topic,difficulty:'hard',status:'active',
   optionA:'The note supports the point it states in this case; broader conclusions need more evidence.',correctAnswer:'A'};
 const mixed=pure.selectMissionQuestions([medium,weakHard],oneQuestionQuiz,[],()=>0,[],{
   [topic]:{state:'practice-goal-reached',attempted:3,correct:3,missed:0}
 });
 assert.equal(mixed.questions[0].id,'usable-medium');
 assert.equal(pure.selectAdaptiveQuestion([medium,weakHard],{usedIds:[],targetDifficulty:'hard',difficultyLevels:['easy','medium','hard']}).id,'usable-medium');
 assert.equal(pure.validateAdaptiveQuestionSet([medium,weakHard],oneQuestionQuiz,['weak-template-hard'])[0].id,'weak-template-hard');
});
test('limited banks disclose repeats without changing assessment coverage',()=>{
 const small=bank.filter(q=>!q.id.endsWith('-retry'));
 const result=pure.selectMissionQuestions(small,quiz,small.map(q=>q.id));
 assert.equal(result.repeatedQuestions,5);
 assert.throws(()=>pure.selectMissionQuestions(small.slice(1),quiz),/Not enough/);
 assert.throws(()=>pure.validateQuestionSet(bank,quiz,Array(5).fill(bank[0].id)),/complete question set/);
 assert.throws(()=>pure.requireMissionPolicy({...quiz,questionCount:undefined}),/Firestore/);
});
test('exhausted banks disclose questions seen on older attempts while avoiding the immediate previous set',()=>{
 const first=pure.selectMissionQuestions(bank,quiz).questions;
 const second=pure.selectMissionQuestions(bank,quiz,first.map(q=>q.id)).questions;
 const third=pure.selectMissionQuestions(bank,quiz,second.map(q=>q.id),()=>0.5,[...first,...second].map(q=>q.id));
 assert.equal(third.repeatedQuestions,5);
 assert.ok(third.questions.every(q=>!second.some(p=>p.id===q.id)));
});
test('adaptive selection covers weak topics before repeating and changes difficulty',()=>{
 const script=fs.readFileSync(path.join(__dirname,'../js/practice.js'),'utf8').replace(/\r\n/g,'\n');
 const begin=script.indexOf('function selectNextQuestion()');
 const end=script.indexOf('async function loadPractice()',begin);
 const context=vm.createContext({remainingQuestions:[{id:'a-easy',topic:'a',difficulty:'easy'},{id:'a-hard',topic:'a',difficulty:'hard'},{id:'b-easy',topic:'b',difficulty:'easy'}],adaptiveMode:true,targetDifficulty:'easy',reviewTopics:['a','b'],practiceResults:[],difficultyLevels:['easy','medium','hard'],currentQuestion:null,
 normalizeDifficulty:value=>value,difficultyDistance:(a,b)=>Math.abs(['easy','medium','hard'].indexOf(a)-['easy','medium','hard'].indexOf(b))});
 vm.runInContext(script.slice(begin,end),context);
 const first=context.selectNextQuestion();assert.equal(first.id,'a-easy');
 context.practiceResults.push({topic:'a'});context.currentQuestion=first;context.updateAdaptiveDifficulty(true);
 assert.equal(context.targetDifficulty,'medium');
 assert.equal(context.selectNextQuestion().id,'b-easy');
 context.currentQuestion={difficulty:'medium'};context.updateAdaptiveDifficulty(false);assert.equal(context.targetDifficulty,'easy');
});

test('quiz review ignores retired topics and malformed diagnoses',()=>{
 const completedAt={toMillis:()=>10};
 const questions=[{id:'p1',missionId:'m1',status:'active',topic:'trade',topicLabel:'Current trade label'},
 {id:'p2',missionId:'m1',status:'inactive',topic:'retired'}];
 const attempts=[{id:'a1',missionId:'m1',completedAt,topicsForReview:['trade','retired','removed',null,'']}];
 const topics=pure.missionReviewTopics(attempts,[],questions);
 assert.equal(topics.length,1);
 assert.equal(topics[0].topic,'trade');assert.equal(topics[0].label,'Current trade label');
 assert.equal(pure.missionReviewTopics([{...attempts[0],topicsForReview:'trade'}],[],questions).length,0);
 assert.equal(pure.missionReviewTopics([{...attempts[0],missionId:'m2'}],[],questions).length,0);
});

test('freshness never replaces required topic/difficulty slots when only some slots have new questions',()=>{
 const policy={questionCount:5,passingScore:60,questionBlueprint:[{topic:'trade',difficulty:'easy',count:2},{topic:'roles',difficulty:'medium',count:3}]};
 const make=(id,topic,difficulty)=>({id,topic,difficulty,status:'active'});
 const questions=[...['t1','t2','t3','t4'].map(id=>make(id,'trade','easy')),...['r1','r2','r3','r4'].map(id=>make(id,'roles','medium')),make('wrong-level','roles','easy'),{...make('retired','roles','medium'),status:'inactive'}];
 const previous=['t1','t2','r1','r2','r3'];
 const retry=pure.selectMissionQuestions(questions,policy,previous,()=>0.5,previous);
 assert.equal(retry.questions.length,5);
 assert.equal(retry.questions.filter(q=>q.topic==='trade'&&q.difficulty==='easy').length,2);
 assert.equal(retry.questions.filter(q=>q.topic==='roles'&&q.difficulty==='medium').length,3);
 assert.equal(retry.repeatedQuestions,2);
 assert.ok(retry.questions.some(q=>q.id==='r4'));
 assert.ok(retry.questions.some(q=>q.id==='t3')&&retry.questions.some(q=>q.id==='t4'));
 pure.validateQuestionSet(questions,policy,retry.questions.map(q=>q.id));
});

test('scenario variants contain four distinct choices and answer-specific feedback',()=>{for(const quiz of data.quizzes.filter(q=>['quiz-1','quiz-2'].includes(q.id))){for(const q of data.questions.filter(q=>q.quizId===quiz.id)){assert.equal(new Set(['A','B','C','D'].map(k=>q['option'+k])).size,4);assert.ok(q['option'+q.correctAnswer]);for(const k of ['A','B','C','D'])assert.ok(q.answerExplanations[k]);}}});


// Reward authority, forged replays and transaction recovery are covered by
// student-security.test.cjs against real Auth/Functions/Firestore emulators.
