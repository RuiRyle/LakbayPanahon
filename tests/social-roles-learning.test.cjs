const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const plan=require('../data/social-roles-learning-migration.json'),old=require('../docs/validation/learning-content-snapshot.json').collections;
test('social comparison updates only three scenes and teaching metadata, preserving mission order and reward policy',()=>{
 assert.equal(plan.writes.length,4);assert.ok(plan.writes.every(w=>w.create===false&&/^(storyScenes|missions)\//.test(w.path)));
 for(const w of plan.writes){assert.ok(!('order' in w.fields));assert.ok(!('xpReward' in w.fields));}
 assert.ok(!plan.writes.some(w=>/scene[134]$/.test(w.path)));
});
test('source and fictional cases have distinct scope, accessible diagrams and valid decisions',()=>{
 const scenes=plan.writes.filter(w=>w.path.startsWith('storyScenes/')).map(w=>w.fields);
 assert.equal(scenes.length,3);for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.exploreItems.every(c=>!s.content.includes(c.discovery)));assert.equal(new Set(s.decisionChoices).size,4);assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));}
 assert.ok(scenes[0].content.includes('1589')&&scenes[0].content.includes('after Spanish arrival'));
 assert.ok(scenes[1].content.includes('made-up people')&&scenes[1].content.includes('cannot assign their exact historical titles'));
 for(const s of scenes.filter(s=>s.imageUrl)){assert.equal(s.imageFit,'contain');assert.ok(s.imageAlt.length>80);assert.ok(fs.existsSync(path.join(__dirname,'..',s.imageUrl.slice(3))));}
});
test('every existing assessed topic remains mapped and the recap connects all five',()=>{
 const scenes=old.storyScenes.filter(s=>s.missionId==='chapter2-mission1').map(s=>({...s,...plan.writes.find(w=>w.path==='storyScenes/'+s.id)?.fields}));
 const quiz=old.quizzes.find(q=>q.id==='chap2-quiz1');for(const slot of quiz.questionBlueprint)assert.ok(scenes.some(s=>s.reviewTopics?.includes(slot.topic)));
 assert.equal(scenes.find(s=>s.id==='chap2-mission1-scene6').reviewTopics.length,5);assert.equal(quiz.questionCount,5);assert.equal(quiz.passingScore,60);
});
