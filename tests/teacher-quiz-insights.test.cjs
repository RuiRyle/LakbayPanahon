const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/teacher-quiz-insights.js'),'utf8').replace(/export /g,''),scope);
const stamp=n=>({toMillis:()=>n}),record=attempts=>({status:'fulfilled',value:{attempts}}),attempt=(time,topics,missionId='m1')=>({missionId,completedAt:stamp(time),topicsForReview:topics});
test('latest retry removes historical topic from current counts and duplicate topic entries count once',()=>{
 const data=scope.summarizeQuizTopics([record([attempt(1000,['boats','boats']),attempt(2000,[])]),record([attempt(2000,['boats'])])],5000);
 assert.equal(data.available,2);assert.equal(data.topics[0].currentStudents,1);assert.equal(data.topics[0].historicalAttempts,2);
});
test('same topic in different missions stays separate and unavailable is not zero success',()=>{
 const data=scope.summarizeQuizTopics([record([attempt(1000,['trade'],'m1'),attempt(1000,['trade'],'m2')]),{status:'rejected'}],5000);
 assert.equal(data.topics.length,2);assert.equal(data.unavailable,1);assert.equal(data.available,1);
});
test('missing future and tied timestamps exclude current claims while retaining history',()=>{
 for(const extra of [{missionId:'m1',topicsForReview:['boats']},attempt(9000,['boats']),attempt(1000,['boats'])]){
  const data=scope.summarizeQuizTopics([record([attempt(1000,['boats']),extra])],5000);
  assert.equal(data.topics[0].currentStudents,0);assert.equal(data.topics[0].historicalAttempts,2);assert.equal(data.uncertainMissions,1);
 }
});
