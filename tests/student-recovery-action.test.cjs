const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/student-journey.js'),'utf8').replace(/export /g,''),context);
const state=topics=>({chapter:{id:'c'},mission:{id:'m'},attempt:{passed:false,topicsForReview:['old']},reviewTopics:topics});
test('next step uses an unvisited diagnosed lesson before targeted practice',()=>{
    const action=context.missionRecoveryAction(state([{topic:'done',lessonRevisited:true},{topic:'custom & shared',lessonRevisited:false}]));
    assert.equal(action.page,'story.html');assert.equal(action.params.reviewTopic,'custom & shared');
    assert.equal(action.params.chapter,'c');assert.equal(action.params.mission,'m');
});
test('reviewed topics recommend mission-scoped practice without claiming mastery',()=>{
    const action=context.missionRecoveryAction(state([{topic:'exchange',lessonRevisited:true}]));
    assert.equal(action.page,'practice.html');assert.equal(action.params.topic,'exchange');assert.equal(action.params.review,'1');
    assert.match(action.message,/retry/);
});
test('legacy string diagnosis and missing optional review evidence default to the lesson',()=>{
    assert.equal(context.missionRecoveryAction(state(['exchange'])).params.reviewTopic,'exchange');
    assert.equal(context.missionRecoveryAction(state(undefined)).params.reviewTopic,'old');
    const empty=context.missionRecoveryAction(state([]));assert.equal(empty.page,'story.html');assert.equal(empty.params.reviewTopic,undefined);
});
