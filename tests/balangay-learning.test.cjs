const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const plan=require('../data/balangay-learning-migration.json');
test('boat expansion preserves the route scene, assessment banks, order and rewards',()=>{
 assert.equal(plan.writes.length,4);assert.ok(plan.writes.every(w=>!w.create));
 assert.ok(!plan.writes.some(w=>w.path==='storyScenes/chapter3-mission1-scene4'));
 assert.ok(plan.writes.every(w=>!('routeActivity' in w.fields)&&!('order' in w.fields)&&!('xpReward' in w.fields)));
});
test('construction explanation and recap provide valid choices and complete illustrations',()=>{
 const scenes=plan.writes.filter(w=>w.path.startsWith('storyScenes/')).map(w=>w.fields);
 for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.exploreItems.every(c=>!s.content.includes(c.discovery)));assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));assert.equal(s.imageFit,'contain');assert.ok(fs.existsSync(s.imageUrl.slice(3)));}
 assert.ok(scenes[1].content.includes('dowel')&&scenes[1].content.includes('without lugs'));assert.equal(scenes[2].reviewTopics.length,5);
});
