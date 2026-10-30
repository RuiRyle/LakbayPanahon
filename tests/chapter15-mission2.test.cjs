const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const plan=require('../data/chapter15-mission2-migration.json');const docs=name=>plan.writes.filter(w=>w.path.startsWith(name+'/')).map(w=>w.fields);
test('Mission 2 preserves existing chapter completion requirements and only guards description updates',()=>{
 assert.equal(plan.writes.length,31);assert.equal(plan.writes.filter(w=>w.create).length,29);assert.equal(docs('missions')[0].order,2);assert.equal(docs('missions')[0].xpReward,50);
 assert.equal(docs('chapterChallenges').length,0);assert.equal(docs('badges').length,0);assert.ok(!plan.writes.some(w=>w.path.startsWith('student')||w.path.startsWith('users/')));
 for(const w of plan.writes.filter(w=>!w.create)){assert.deepEqual(Object.keys(w.fields),['description']);assert.ok(w.expected.description);}
 assert.ok(plan.prerequisites.some(p=>p.path==='missions/chapter15-mission1'&&p.expected.order===1));
});
test('five taught topics have separate easy/hard practice and equivalent main variants',()=>{
 const quiz=docs('quizzes')[0],main=docs('questions'),practice=docs('practiceQuestions'),scenes=docs('storyScenes');assert.equal(main.length,10);assert.equal(practice.length,10);assert.equal(quiz.questionCount,5);assert.equal(quiz.passingScore,60);
 for(const slot of quiz.questionBlueprint){assert.ok(scenes.slice(0,5).some(s=>s.reviewTopics.includes(slot.topic)));assert.equal(main.filter(q=>q.topic===slot.topic).length,2);assert.deepEqual(practice.filter(q=>q.topic===slot.topic).map(q=>q.difficulty),['easy','hard']);}
 assert.ok(practice.every(p=>!main.some(q=>p.question===q.question)));assert.deepEqual(scenes[5].reviewTopics,quiz.questionBlueprint.map(t=>t.topic));
 for(const q of [...main,...practice]){assert.equal(new Set('ABCD'.split('').map(k=>q['option'+k])).size,4);assert.ok(q['option'+q.correctAnswer]);assert.ok(q.answerExplanations[q.correctAnswer]);}
});
test('named cases distinguish translation, regional publishing and women initiating an educational request',()=>{
 const scenes=docs('storyScenes');assert.equal(scenes.length,6);assert.match(scenes[1].content,/1882/);assert.match(scenes[1].content,/del Pilar/);assert.match(scenes[2].content,/El Ilocano.*1889/);assert.match(scenes[3].content,/12 December 1888/);
 assert.match(scenes[3].content,/later wrote/);assert.ok(scenes[4].exhibitActivity);assert.equal(scenes[4].exhibitActivity.pairs.length,3);
 for(const s of scenes){assert.equal(s.exploreItems.length,3);assert.ok(s.decisionChoices.includes(s.decisionCorrectAnswer));assert.ok(s.learningHelp.explanation);assert.ok(fs.existsSync(s.imageUrl.slice(3)));assert.ok(s.imageAlt.length>60);}
});
test('normal progression requires the owned first mission and does not complete the partial chapter',()=>{
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/journey-path.js'),'utf8').replace(/export /g,''),ctx);
 const first=require('../data/chapter15-mission1-migration.json');const chapter={id:'chapter-15',...first.writes.find(w=>w.path==='chapters/chapter-15').fields};
 const missions=[...first.writes,...plan.writes].filter(w=>w.path.startsWith('missions/')).map(w=>({id:w.path.split('/')[1],...w.fields}));
 const input={userId:'s',eras:[{id:chapter.eraId,status:'active'}],chapters:[chapter],missions,challenges:[],chapterProgress:[],missionProgress:[{userId:'other',missionId:'chapter15-mission1',completed:true}]};
 assert.equal(ctx.buildJourneyPath(input)[0].chapters[0].missions[1].accessible,false);input.missionProgress[0].userId='s';assert.equal(ctx.buildJourneyPath(input)[0].chapters[0].missions[1].accessible,true);assert.equal(ctx.buildJourneyPath(input)[0].chapters[0].challengeAccessible,false);
});
