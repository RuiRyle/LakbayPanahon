const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const plan=require('../data/chapter15-mission5-migration.json');const docs=name=>plan.writes.filter(w=>w.path.startsWith(name+'/')).map(w=>w.fields);
test('Mission 5 appends content without changing previous missions or earned chapter records',()=>{
 assert.equal(plan.writes.length,31);assert.equal(plan.writes.filter(w=>w.create).length,29);assert.equal(docs('missions')[0].order,5);assert.equal(docs('missions')[0].xpReward,50);
 assert.equal(docs('chapterChallenges').length,0);assert.equal(docs('badges').length,0);
 assert.ok(plan.writes.every(w=>!w.path.startsWith('student')&&!w.path.startsWith('users/')));
 for(const w of plan.writes.filter(w=>!w.create)){assert.deepEqual(Object.keys(w.fields),['description']);assert.ok(w.expected.description);}
 for(const n of [1,2,3,4])assert.ok(plan.prerequisites.some(p=>p.path==='missions/chapter15-mission'+n&&p.expected.order===n));
});
test('five reform voices topics have teaching, equivalent quiz variants and separate adaptive practice',()=>{
 const quiz=docs('quizzes')[0],main=docs('questions'),practice=docs('practiceQuestions'),scenes=docs('storyScenes');assert.equal(quiz.questionCount,5);assert.equal(quiz.passingScore,60);assert.equal(main.length,10);assert.equal(practice.length,10);
 for(const slot of quiz.questionBlueprint){assert.ok(scenes.slice(0,5).some(s=>s.reviewTopics.includes(slot.topic)));assert.equal(main.filter(q=>q.topic===slot.topic&&q.difficulty==='medium').length,2);assert.deepEqual(practice.filter(q=>q.topic===slot.topic).map(q=>q.difficulty),['easy','hard']);}
 assert.deepEqual(scenes[5].reviewTopics,quiz.questionBlueprint.map(t=>t.topic));assert.ok(practice.every(p=>!main.some(q=>p.question===q.question)));
 for(const q of [...main,...practice]){assert.equal(new Set('ABCD'.split('').map(k=>q['option'+k])).size,4);assert.ok(q['option'+q.correctAnswer]);assert.ok(q.answerExplanations[q.correctAnswer]);}
});
test('reform goals, contributors and organizations have source-labelled teaching and an interactive field guide',()=>{
 const scenes=docs('storyScenes');assert.equal(scenes.length,6);assert.match(scenes[0].content,/Spanish Cortes/);assert.match(scenes[0].content,/different from immediately/);assert.match(scenes[1].content,/15 February 1889/);assert.match(scenes[2].content,/first editor/);assert.match(scenes[2].content,/Marcelo H. del Pilar later/);assert.match(scenes[3].content,/3 July 1892/);assert.match(scenes[3].content,/separate Katipunan/);assert.match(scenes[4].content,/not original documents/);
 for(const scene of scenes){assert.equal(scene.exploreItems.length,3);assert.ok(scene.decisionChoices.includes(scene.decisionCorrectAnswer));assert.ok(scene.learningHelp.explanation);assert.ok(fs.existsSync(scene.imageUrl.slice(3)));assert.ok(scene.sourceUrls.some(url=>url.includes('la-liga-filipina')));}
 const activity=scenes[4].exhibitActivity;assert.equal(activity.pairs.length,3);assert.deepEqual(activity.effects.map(e=>e.id).sort(),['check','organize','publish']);
});
test('normal Mission 5 access requires all owned earlier mission completions',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/journey-path.js'),'utf8').replace(/export /g,''),ctx);
 const plans=[1,2,3,4,5].map(n=>require('../data/chapter15-mission'+n+'-migration.json'));
 const chapter={id:'chapter-15',...plans[0].writes.find(w=>w.path==='chapters/chapter-15').fields};const missions=plans.flatMap(p=>p.writes.filter(w=>w.path.startsWith('missions/')).map(w=>({id:w.path.split('/')[1],...w.fields})));
 const input={userId:'s',eras:[{id:chapter.eraId,status:'active'}],chapters:[chapter],missions,challenges:[],chapterProgress:[],missionProgress:[1,2,3,4].map(n=>({userId:n===4?'other':'s',missionId:'chapter15-mission'+n,completed:true}))};
 assert.equal(ctx.buildJourneyPath(input)[0].chapters[0].missions[4].accessible,false);input.missionProgress[3].userId='s';assert.equal(ctx.buildJourneyPath(input)[0].chapters[0].missions[3].accessible,true);assert.equal(ctx.buildJourneyPath(input)[0].chapters[0].challengeAccessible,false);
});
