const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const plan=require('../data/chapter15-mission1-migration.json');const docs=name=>plan.writes.filter(w=>w.path.startsWith(name+'/')).map(w=>w.fields);
test('new MATATAG investigation appends a partial chapter without altering earned chapter progress',()=>{
 assert.equal(plan.writes.length,31);assert.equal(plan.writes.filter(w=>w.create).length,30);
 assert.equal(docs('chapters')[0].order,15);assert.equal(docs('chapters')[0].eraId,'resistance-national-consciousness');
 assert.equal(docs('missions')[0].xpReward,50);assert.equal(docs('badges').length,0);assert.equal(docs('chapterChallenges').length,0);
 assert.ok(plan.writes.every(w=>!w.path.startsWith('student')&&!w.path.startsWith('users/')));
 const update=plan.writes.find(w=>!w.create);assert.equal(update.path,'eras/resistance-national-consciousness');assert.ok(update.expected.description);assert.deepEqual(Object.keys(update.fields),['description']);
 assert.ok(plan.prerequisites.some(p=>p.path==='chapterChallenges/challenge-14'));assert.ok(plan.curriculumBasis.includes('MATATAG Grade 5'));
});
test('all quiz topics have taught scenes, two equivalent variants and separate adaptive practice',()=>{
 const quiz=docs('quizzes')[0],scenes=docs('storyScenes'),main=docs('questions'),practice=docs('practiceQuestions');
 assert.equal(quiz.questionCount,5);assert.equal(quiz.passingScore,60);assert.equal(main.length,10);assert.equal(practice.length,10);
 for(const slot of quiz.questionBlueprint){assert.ok(scenes.slice(0,5).some(s=>s.reviewTopics.includes(slot.topic)));assert.equal(main.filter(q=>q.topic===slot.topic&&q.difficulty==='medium').length,2);assert.deepEqual(practice.filter(q=>q.topic===slot.topic).map(q=>q.difficulty),['easy','hard']);}
 assert.deepEqual(scenes[5].reviewTopics,quiz.questionBlueprint.map(t=>t.topic));
 for(const q of [...main,...practice]){assert.equal(new Set('ABCD'.split('').map(k=>q['option'+k])).size,4);assert.ok(q['option'+q.correctAnswer]);assert.ok(q.answerExplanations[q.correctAnswer]);}
 assert.ok(practice.every(p=>!main.some(q=>p.question===q.question)));
});
test('scenes teach concrete chronology and distinguish fictional activities from named historical examples',()=>{
 const scenes=docs('storyScenes');assert.equal(scenes.length,6);
 assert.match(scenes[0].content,/1855/);assert.match(scenes[0].content,/1859/);assert.match(scenes[0].content,/1863/);
 assert.match(scenes[1].content,/Mediterranean/);assert.match(scenes[1].content,/Red Sea/);assert.match(scenes[1].content,/1869/);
 assert.match(scenes[2].content,/fictional family/);assert.match(scenes[2].content,/fees/);assert.match(scenes[3].content,/Madrid.*1882/);
 for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));assert.ok(s.learningHelp.explanation);assert.ok(fs.existsSync(s.imageUrl.slice(3)));assert.ok(s.imageAlt.length>50);assert.ok(s.sourceUrls.length>=3);}
});
test('1870 route game requires the correct dated connection and preserves the explanation stage',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/story-route.js'),'utf8').replace(/export /g,''),ctx);
 const scene=docs('storyScenes')[1];const activity=scene.routeActivity;ctx.validateRouteActivity(activity);
 assert.equal(ctx.evaluateRoute(activity,'suez').valid,true);assert.equal(ctx.evaluateRoute(activity,'cape').valid,false);assert.equal(ctx.evaluateRoute(activity,'pacific').valid,false);
 assert.ok(scene.decisionQuestion);assert.ok(scene.decisionCorrectAnswer);assert.match(activity.mapDescription,/not a scaled map/);
});
