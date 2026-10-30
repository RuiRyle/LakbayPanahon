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
test('quiz diagnoses stay after one practice answer and a new quiz replaces old diagnoses',()=>{
 const timestamp=n=>({toMillis:()=>n});
 const questions=[{id:'p1',status:'active',missionId:'m1',topic:'trade',topicLabel:'Trade'}];
 const attempts=[{id:'a1',missionId:'m1',topicsForReview:['trade'],completedAt:timestamp(10)}];
 assert.equal(pure.missionReviewTopics(attempts,[],questions)[0].topic,'trade');
 assert.equal(pure.missionReviewTopics(attempts,[],questions)[0].source,'quiz');
 assert.equal(pure.missionReviewTopics(attempts,[],questions)[0].attempted,0);
 const sessions=[{id:'s1',missionId:'m1',completedAt:timestamp(20),questionResults:[{questionId:'p1',firstTryCorrect:true}]}];
 assert.equal(pure.missionReviewTopics(attempts,sessions,questions).length,1);
 assert.equal(pure.missionReviewTopics([...attempts,{id:'a2',missionId:'m1',topicsForReview:[],completedAt:timestamp(30)}],[],questions).length,0);
});
function fixture(){
 const records=new Map();
 for(const q of data.quizzes)records.set('quizzes/'+q.id,q);
 for(const q of data.questions)records.set('questions/'+q.id,q);
 records.set('learningSettings/progression',{xpPerLevel:100,version:1});
 records.set('users/alice',{role:'student',status:'active',xp:0,level:1});
 records.set('artifacts/art1',{id:'art1',missionId:'mission-1',status:'active'});
 const snapshot=(key)=>({exists:()=>records.has(key),data:()=>records.get(key)});
 const context=vm.createContext({console,auth:{currentUser:{uid:'alice'}},db:{},
   requireLearningAccess:async()=>({xpReward:25}), requirePassingScore:q=>q.passingScore,
   collection:(_,name)=>({name}),doc:(_,name,id)=>name+'/'+id,
   where:(field,op,value)=>({field,value}),query:(ref,...filters)=>({...ref,filters}),
   getDocs:async ref=>({docs:[...records].filter(([key,row])=>key.startsWith(ref.name+'/')&&(!ref.filters||ref.filters.every(f=>row[f.field]===f.value))).map(([key,row])=>({id:key.split('/')[1],data:()=>row}))}),
   serverTimestamp:()=>({toMillis:()=>100}),
   runTransaction:async(_,fn)=>{const writes=[];const result=await fn({get:async key=>snapshot(key),set:(key,value)=>writes.push(()=>records.set(key,value)),update:(key,value)=>writes.push(()=>records.set(key,{...records.get(key),...value}))});writes.forEach(write=>write());return result;}
 });
 vm.runInContext(read('daily-policy.js')+read('progression-policy.js')+read('mission-assessment.js')+read('student-rewards-client.js'),context);
 return {context,records};
}
test('0?2 answers fail with no XP; 3?5 complete and reward once; attempts survive retry',async()=>{
 for(let correct=0;correct<=5;correct++){
   const {context,records}=fixture();
   const questions=pure.selectMissionQuestions(bank,quiz).questions;
   const answers=Object.fromEntries(questions.map((q,i)=>[q.id,i<correct?q.correctAnswer:(q.correctAnswer==='A'?'B':'A')]));
   const input={kind:'mission',chapterId:'chapter-1',missionId:'mission-1',quizId:quiz.id,attemptId:'11111111-1111-4111-8111-111111111111',questionIds:questions.map(q=>q.id),answers};
   const result=await context.submitStudentActivity(input);
   assert.equal(result.passed,correct>=3);assert.equal(result.xpReward,correct>=3?25:0);
   assert.equal(records.has('studentProgress/alice_mission-1'),correct>=3);
   assert.equal(records.has('studentArtifacts/alice_art1'),correct>=3);
   assert.equal(records.get('users/alice').xp,correct>=3?25:0);
   assert.equal(records.get('studentQuizAttempts/alice_'+input.attemptId).correctAnswers,correct);
   await context.submitStudentActivity(input);
   assert.equal(records.get('users/alice').xp,correct>=3?25:0);
   const otherId=questions[0].id;
   await assert.rejects(context.submitStudentActivity({...input,answers:{...answers,[otherId]:answers[otherId]==='A'?'B':'A'}}),/different answers/);
   if(correct>=3){const replay=await context.submitStudentActivity({...input,attemptId:'22222222-2222-4222-8222-222222222222'});assert.equal(replay.xpReward,0);}
 }
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

test('reward transactions read Firestore progression and refresh cached replay displays',async()=>{
 const {context,records}=fixture();
 records.set('learningSettings/progression',{xpPerLevel:50,version:2});
 records.set('users/alice',{role:'student',status:'active',xp:90,level:1});
 const questions=pure.selectMissionQuestions(bank,quiz).questions;
 const input={kind:'mission',chapterId:'chapter-1',missionId:'mission-1',quizId:quiz.id,attemptId:'11111111-1111-4111-8111-111111111111',questionIds:questions.map(q=>q.id),answers:Object.fromEntries(questions.map(q=>[q.id,q.correctAnswer]))};
 const result=await context.submitStudentActivity(input);
 assert.equal(result.totalXp,115);assert.equal(result.level,3);assert.equal(records.get('users/alice').level,3);
 records.set('learningSettings/progression',{xpPerLevel:25,version:3});
 const replay=await context.submitStudentActivity(input);assert.equal(replay.level,5);assert.equal(replay.totalXp,115);
 assert.equal(records.get('users/alice').xp,115);
 records.delete('learningSettings/progression');
 const before=records.size;
 await assert.rejects(context.submitStudentActivity({...input,attemptId:'22222222-2222-4222-8222-222222222222'}),/progression/);
 assert.equal(records.size,before);assert.equal(records.get('users/alice').xp,115);
});

function replayFixture(correct=true) {
 const state=fixture(),selected=pure.selectMissionQuestions(bank,quiz).questions;
 const input={kind:'mission',chapterId:'chapter-1',missionId:'mission-1',quizId:quiz.id,
  attemptId:'11111111-1111-4111-8111-111111111111',questionIds:selected.map(q=>q.id),
  answers:Object.fromEntries(selected.map(q=>[q.id,correct?q.correctAnswer:q.correctAnswer==='A'?'B':'A']))};
 return {...state,input,key:'studentQuizAttempts/alice_'+input.attemptId};
}

test('a forged saved response cannot turn a failed replay into a passing reward display',async()=>{
 const {context,records,input,key}=replayFixture(false);
 await context.submitStudentActivity(input);
 const previous=records.get(key);
 previous.response={...previous.response,passed:true,score:100,firstCompletion:true,xpReward:9999};
 await assert.rejects(context.submitStudentActivity(input),/saved attempt could not be verified/);
 assert.equal(records.get('users/alice').xp,0);
 assert.equal(records.has('studentProgress/alice_mission-1'),false);
});

test('replay refuses inflated rewards and claimed completions without a matching saved completion',async()=>{
 for(const tamper of [
  state=>{state.records.get(state.key).response.xpReward=9999;},
  state=>{state.records.delete('studentProgress/alice_mission-1');},
  state=>{state.records.get('studentProgress/alice_mission-1').completedAt={toMillis:()=>0};}
 ]) {
  const state=replayFixture();await state.context.submitStudentActivity(state.input);tamper(state);
  await assert.rejects(state.context.submitStudentActivity(state.input),/saved attempt could not be verified/);
 }
});

test('replay builds reward/catalog output from current records instead of arbitrary saved fields',async()=>{
 const {context,records,input,key}=replayFixture();await context.submitStudentActivity(input);
 Object.assign(records.get(key).response,{totalXp:999999,level:99999,learningStreak:9999,
  redirectUrl:'javascript:alert(1)',artifactResult:{artifact:{id:'fake'},newlyEarned:false}});
 const result=await context.submitStudentActivity(input);
 assert.equal(result.totalXp,25);assert.equal(result.level,1);assert.equal(result.learningStreak,0);
 assert.equal(result.redirectUrl,undefined);assert.equal(result.artifactResult.artifact.id,'art1');
 assert.equal(result.artifactResult.newlyEarned,true);
});

test('inactive and changed accounts cannot receive an old successful replay',async()=>{
 const state=replayFixture();await state.context.submitStudentActivity(state.input);
 state.records.get('users/alice').status='disabled';
 await assert.rejects(state.context.submitStudentActivity(state.input),/active student account/);
 const next=replayFixture();let finish;
 next.context.requireLearningAccess=()=>new Promise(resolve=>{finish=()=>resolve({xpReward:25});});
 const pending=next.context.submitStudentActivity(next.input);
 next.context.auth.currentUser={uid:'bob'};finish();
 await assert.rejects(pending,/account changed/);
 assert.equal(next.records.has(next.key),false);
});

test('daily streaks advance on consecutive days, reset after gaps, and never grow on replay',async()=>{
 const now=new Date();
 for(const [offset,previousStreak,expected]of [[1,3,4],[2,3,1],[0,4,4]]){
   const {context,records}=fixture();
   const lastStreakDate=context.learningDateKey(new Date(now.getTime()-offset*86400000));
   records.set('users/alice',{role:'student',status:'active',xp:0,level:1,learningStreak:previousStreak,lastStreakDate});
   records.set('dailyChallenges/d1',{id:'d1',status:'active',order:1,correctAnswer:'A',xpReward:10});
   const input={kind:'daily',challengeId:'d1',answer:'A'};
   const result=await context.submitStudentActivity(input);assert.equal(result.learningStreak,expected);
   assert.equal(records.get('users/alice').xp,10);
   const replay=await context.submitStudentActivity(input);assert.equal(replay.learningStreak,expected);assert.equal(replay.xpReward,0);
   assert.equal(records.get('users/alice').xp,10);
 }
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

test('local preview grades mission answers without transactions or reward records',async()=>{
 const {context,records}=fixture();context.__lakbayExplorationPreview=true;
 context.runTransaction=()=>{throw Error('Preview must not write');};
 const selected=pure.selectMissionQuestions(bank,quiz).questions;
 const before=JSON.stringify([...records]);
 for(const correct of [0,3,5]){
  const result=await context.submitStudentActivity({kind:'mission',chapterId:'c1',missionId:'mission-1',quizId:quiz.id,attemptId:'11111111-1111-4111-8111-111111111111',questionIds:selected.map(q=>q.id),answers:Object.fromEntries(selected.map((q,i)=>[q.id,i<correct?q.correctAnswer:q.correctAnswer==='A'?'B':'A']))});
  assert.equal(result.preview,true);assert.equal(result.passed,correct>=3);assert.equal(result.xpReward,0);assert.equal(result.firstCompletion,false);assert.equal(result.artifactResult.newlyEarned,false);
 }
 assert.equal(JSON.stringify([...records]),before);
});

test('local preview can grade a chapter challenge without prerequisite completions or badge writes',async()=>{
 const {context,records}=fixture();context.__lakbayExplorationPreview=true;context.runTransaction=()=>{throw Error('Preview must not write');};
 records.set('missions/m-test',{chapterId:'preview-chapter',status:'active'});
 records.set('chapterChallenges/ch-test',{chapterId:'preview-chapter',status:'active',passingScore:70});
 records.set('chapterChallengeQuestions/q-test',{challengeId:'ch-test',status:'active',correctAnswer:'B'});
 const before=JSON.stringify([...records]);const result=await context.submitStudentActivity({kind:'chapter',chapterId:'preview-chapter',challengeId:'ch-test',answers:{'q-test':'B'}});
 assert.equal(result.passed,true);assert.equal(result.preview,true);assert.equal(result.badgeResult.newlyEarned,false);assert.equal(JSON.stringify([...records]),before);
});
