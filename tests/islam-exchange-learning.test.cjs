const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const plan=require('../data/islam-exchange-learning-migration.json'),old=require('../docs/validation/learning-content-snapshot.json').collections;
const scenes=plan.writes.filter(w=>w.path.startsWith('storyScenes/')).map(w=>w.fields);
test('Islam/exchange teaching updates preserve opening encounter, belief description, assessment banks and rewards',()=>{
 assert.equal(plan.writes.length,5);assert.ok(plan.writes.every(w=>!w.create&&/^(storyScenes|missions)\//.test(w.path)));
 assert.ok(!plan.writes.some(w=>/scene[13]$/.test(w.path)));assert.ok(plan.writes.every(w=>!('xpReward' in w.fields)&&!('order' in w.fields)));
});
test('locator, connected contributions and chronology use distinct evidence with accessible illustrations',()=>{
 assert.equal(scenes.length,4);assert.ok(scenes[0].content.includes('Simunul')&&/modern locator/i.test(scenes[0].imageCaption));
 assert.ok(scenes[1].content.includes('made-up classroom case')&&scenes[1].content.includes('one fixed role'));
 assert.ok(scenes[2].content.includes('1380')&&scenes[2].content.includes('1400s')&&scenes[2].content.includes('differing exact dates'));
 for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.exploreItems.every(c=>!s.content.includes(c.discovery)));assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));}
 for(const s of scenes.filter(s=>s.imageUrl)){assert.equal(s.imageFit,'contain');assert.ok(s.imageAlt.length>100);assert.ok(fs.existsSync(path.join(__dirname,'..',s.imageUrl.slice(3))));}
});
test('all existing assessed topics remain taught and the recap connects the maritime continuation',()=>{
 const merged=old.storyScenes.filter(s=>s.missionId==='chapter2-mission3').map(s=>({...s,...plan.writes.find(w=>w.path==='storyScenes/'+s.id)?.fields})),quiz=old.quizzes.find(q=>q.id==='chap2-quiz3');
 for(const slot of quiz.questionBlueprint){assert.ok(merged.some(s=>s.reviewTopics.includes(slot.topic)));assert.ok(scenes[3].reviewTopics.includes(slot.topic));}
 assert.ok(scenes[3].reviewTopics.includes('respect-for-religion'));assert.ok(scenes[3].content.includes('Chapter 3'));assert.equal(quiz.questionCount,5);assert.equal(quiz.passingScore,60);
});
