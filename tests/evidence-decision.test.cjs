const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=file=>fs.readFileSync('js/'+file,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const ctx=vm.createContext({});vm.runInContext(source('evidence-decision.js')+source('student-rewards-client.js'),ctx);
const q={id:'q',...require('../data/evidence-challenge-pilot.json').writes[0].fields};
test('an evidence decision requires both a correct clue and a correct conclusion',()=>{
 const answer={gameType:'evidenceDecision',evidenceId:q.evidenceTask.correctEvidenceId,conclusion:q.correctAnswer};
 assert.equal(ctx.evidenceDecisionCorrect(q,answer),true);
 assert.equal(ctx.evidenceDecisionCorrect(q,{...answer,evidenceId:'resource-skills'}),false);
 assert.equal(ctx.evidenceDecisionCorrect(q,{...answer,conclusion:'B'}),false);
 assert.equal(ctx.evidenceDecisionCorrect(q,'A'),false);
});
test('shared reward grading counts an evidence decision as one point and rejects conclusion-only credit',()=>{
 assert.equal(ctx.grade([q],{q:{gameType:'evidenceDecision',evidenceId:'direction-dots',conclusion:'A'}}).score,100);
 assert.equal(ctx.grade([q],{q:{gameType:'evidenceDecision',evidenceId:'resource-skills',conclusion:'A'}}).score,0);
 assert.equal(ctx.grade([q],{q:'A'}).score,0);
});
test('evidence references must be unique and include a valid correct clue',()=>{
 assert.ok(ctx.validateEvidenceTask(q));
 assert.throws(()=>ctx.validateEvidenceTask({...q,evidenceTask:{...q.evidenceTask,correctEvidenceId:'missing'}}));
 assert.throws(()=>ctx.validateEvidenceTask({...q,evidenceTask:{...q.evidenceTask,cards:[q.evidenceTask.cards[0],q.evidenceTask.cards[0]]}}));
});
test('pilot references existing authored clues and preserves challenge identity and reward policy',()=>{
 const plan=require('../data/evidence-challenge-pilot.json');assert.equal(plan.writes.length,1);assert.equal(plan.writes[0].path,'chapterChallengeQuestions/challenge-prologue-question1');
 const scenes=require('../data/geography-pilot-migration.json').writes.filter(w=>w.path.startsWith('storyScenes/'));
 for(const card of q.evidenceTask.cards)assert.ok(scenes.find(w=>w.path==='storyScenes/'+card.sceneId)?.fields.exploreItems[card.clueIndex]?.discovery);
 assert.ok(!('passingScore' in plan.writes[0].fields));assert.ok(!('xpReward' in plan.writes[0].fields));
});
