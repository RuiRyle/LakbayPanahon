const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const plan=require('../data/beliefs-learning-migration.json'),old=require('../docs/validation/learning-content-snapshot.json').collections;
const scenes=plan.writes.filter(w=>w.path.startsWith('storyScenes/')).map(w=>w.fields);
test('beliefs update preserves first three scenes, assessment banks, order and rewards',()=>{
 assert.equal(plan.writes.length,4);assert.ok(plan.writes.every(w=>!w.create&&/^(storyScenes|missions)\//.test(w.path)));
 assert.ok(!plan.writes.some(w=>/scene[123]$/.test(w.path)));
 assert.ok(plan.writes.every(w=>!('xpReward' in w.fields)&&!('order' in w.fields)));
});
test('fictional tale, documented transmission and named artifact are clearly distinguished',()=>{
 assert.ok(scenes[0].content.includes('made up for this app')&&scenes[0].imageCaption.includes('invented'));
 assert.ok(scenes[1].content.includes('Hudhud')&&scenes[1].content.includes('Continuity means'));
 assert.ok(scenes[2].content.includes('Manunggul Jar')&&scenes[2].content.includes('Observation:')&&scenes[2].content.includes('Interpretation:'));
 for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.exploreItems.every(c=>!s.content.includes(c.discovery)));assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));}
 for(const s of scenes.filter(s=>s.imageUrl)){assert.equal(s.imageFit,'contain');assert.ok(s.imageAlt.length>100);assert.ok(fs.existsSync(path.join(__dirname,'..',s.imageUrl.slice(3))));}
});
test('existing main-quiz topics and additional review mappings remain available',()=>{
 const merged=old.storyScenes.filter(s=>s.missionId==='chapter2-mission2').map(s=>({...s,...plan.writes.find(w=>w.path==='storyScenes/'+s.id)?.fields}));
 const quiz=old.quizzes.find(q=>q.id==='chap2-quiz2');for(const slot of quiz.questionBlueprint){assert.ok(merged.some(s=>s.reviewTopics.includes(slot.topic)));assert.ok(scenes[2].reviewTopics.includes(slot.topic));}
 for(const topic of ['respect-for-traditions','ancestor-veneration','cultural-diversity'])assert.ok(merged.some(s=>s.reviewTopics.includes(topic)));
 assert.equal(quiz.questionCount,5);assert.equal(quiz.passingScore,60);
});
