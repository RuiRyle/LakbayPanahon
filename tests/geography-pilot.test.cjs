const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const plan=require('../data/geography-pilot-migration.json');
const old=require('../docs/validation/learning-content-snapshot.json').collections;
const docs=plan.writes.map(w=>({path:w.path,...old[w.path.split('/')[0]]?.find(d=>d.id===w.path.split('/')[1]),...w.fields}));
test('geography pilot is a guarded lesson/assessment update with no progress or reward mutations',()=>{
 assert.equal(plan.writes.length,27);assert.ok(plan.writes.every(w=>/^(missions|storyScenes|questions|practiceQuestions)\//.test(w.path)));
 for(const w of plan.writes){assert.ok(!('xpReward' in w.fields));if(!w.create)assert.ok(w.expected);}
 assert.ok(!plan.writes.some(w=>w.path.startsWith('quizzes/')));
});
test('six teaching scenes supply maps, non-repeated observations, decisions and a synthesis recap',()=>{
 const scenes=docs.filter(d=>d.path.startsWith('storyScenes/'));assert.equal(scenes.length,6);
 for(const s of scenes){assert.equal(s.imageFit,'contain');const file=path.join(__dirname,'..',s.imageUrl.slice(3));assert.ok(fs.existsSync(file));assert.ok(fs.readFileSync(file,'utf8').includes('<desc>'));assert.equal(s.exploreItems.length,3);assert.ok(s.exploreItems.every(i=>!s.content.includes(i.discovery)));assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));}
 assert.ok(scenes[1].content.includes('Step 1.'));assert.equal(scenes[5].reviewTopics.length,5);
});
test('five-topic quizzes have unused retries and separate practice after the pilot update',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/mission-assessment.js'),'utf8').replace(/export /g,''),ctx);
 const quiz=old.quizzes.find(q=>q.id==='prologue-quiz1');const bank=docs.filter(d=>d.path.startsWith('questions/')).map(d=>({...d,id:d.path.split('/')[1]}));
 const first=ctx.selectMissionQuestions(bank,quiz,[],()=>.2);const retry=ctx.selectMissionQuestions(bank,quiz,first.questions.map(q=>q.id),()=>.8);assert.equal(first.questions.length,5);assert.equal(retry.repeatedQuestions,0);assert.equal(quiz.passingScore,60);
 const practice=docs.filter(d=>d.path.startsWith('practiceQuestions/'));assert.equal(practice.length,10);
 for(const p of practice){assert.ok(!bank.some(q=>q.question===p.question));assert.equal(p.reviewEvidencePolicy.requiredDifficulty,'hard');}
 for(const q of [...bank,...practice]){assert.equal(new Set('ABCD'.split('').map(k=>q['option'+k])).size,4);assert.ok(q.answerExplanations[q.correctAnswer]);}
});
