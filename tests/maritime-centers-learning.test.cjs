const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const plan=require('../data/maritime-centers-learning-migration.json');
test('maritime-center expansion preserves other scenes, assessment banks, order and rewards',()=>{
 assert.equal(plan.writes.length,4);assert.ok(plan.writes.every(w=>!w.create&&/^(missions|storyScenes)\//.test(w.path)));
 assert.ok(!plan.writes.some(w=>/scene[34]$/.test(w.path)));assert.ok(plan.writes.every(w=>!('order' in w.fields)&&!('xpReward' in w.fields)));
});
test('harbor model, separate evidence and recap have valid accessible teaching',()=>{
 const scenes=plan.writes.filter(w=>w.path.startsWith('storyScenes/')).map(w=>w.fields);
 assert.ok(scenes[0].content.includes('fictional harbor diagram'));assert.ok(scenes[1].content.includes('Tentative List')&&scenes[1].content.includes('different finds and contexts'));
 for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.exploreItems.every(c=>!s.content.includes(c.discovery)));assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));assert.equal(s.imageFit,'contain');assert.ok(fs.existsSync(s.imageUrl.slice(3)));}
 assert.equal(scenes[2].reviewTopics.length,5);
});
