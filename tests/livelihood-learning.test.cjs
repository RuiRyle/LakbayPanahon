const {test}=require('node:test'),assert=require('node:assert/strict');
const old=require('../docs/validation/learning-content-snapshot.json').collections;
const plan=require('../data/livelihood-learning-migration.json');
const scenes=old.storyScenes.filter(s=>s.missionId==='mission-2').map(s=>({...s,...plan.writes.find(w=>w.path==='storyScenes/'+s.id)?.fields})).sort((a,b)=>a.order-b.order);
test('livelihood teaching update preserves illustrations, rewards, quiz questions and trade configuration',()=>{
 assert.equal(plan.writes.length,7);assert.ok(plan.writes.every(w=>/^(missions|storyScenes)\//.test(w.path)));
 for(const w of plan.writes){assert.equal(w.create,false);assert.ok(!('xpReward' in w.fields));assert.ok(!('imageUrl' in w.fields));assert.ok(!('tradeActivity' in w.fields));}
 assert.deepEqual(Object.keys(plan.writes.find(w=>w.path==='storyScenes/mission2-scene4').fields),['order']);
 assert.deepEqual(scenes.find(s=>s.id==='mission2-scene4').tradeActivity,old.storyScenes.find(s=>s.id==='mission2-scene4').tradeActivity);
});
test('students learn about resources and craft before the investigation and recap follows it',()=>{
 assert.deepEqual(scenes.map(s=>s.id),['mission2-scene1','mission2-scene2','mission2-scene3','mission2-scene5','mission2-scene4','mission2-scene6']);
 const slots=old.quizzes.find(q=>q.id==='quiz-2').questionBlueprint;
 for(const slot of slots)assert.ok(scenes.some(s=>s.reviewTopics.includes(slot.topic)),slot.topic);
 assert.equal(scenes.at(-1).reviewTopics.length,5);
});
test('expanded teaching has worked examples, new observations and valid applied decisions',()=>{
 for(const scene of scenes.filter(s=>!s.tradeActivity)){
  assert.ok(scene.content.length>500);assert.equal(scene.exploreItems.length,3);assert.ok(scene.exploreItems.every(c=>!scene.content.includes(c.discovery)));
  assert.equal(new Set(scene.decisionChoices).size,4);assert.ok(scene.decisionChoices.includes(scene.decisionCorrectAnswer));assert.ok(!scene.decisionQuestion.includes('Copy'));
 }
 assert.ok(scenes[0].content.includes('Step 1.'));assert.ok(scenes[3].content.includes('Step 1.'));
});
