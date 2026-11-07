const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../js/teacher-support-policy.js'),'utf8').replace(/export /g,''),scope);
const stamp=n=>({toMillis:()=>n});
test('follow-up evidence uses status time and only later dated attempts for the same mission',()=>{
    const note={missionId:'m1',statusAt:stamp(2000)};
    const evidence=scope.followupQuizEvidence(note,[{missionId:'m1',score:40,completedAt:stamp(1000)},{missionId:'m1',score:80,completedAt:stamp(3000)},{missionId:'m2',score:100,completedAt:stamp(4000)}],5000);
    assert.equal(evidence.attempts.length,1);assert.equal(evidence.latest.score,80);assert.equal(evidence.uncertain,false);
});
test('missing, future or tied timestamps do not fabricate a definite latest result',()=>{
    const note={missionId:'m1',statusAt:stamp(2000)};
    for(const extra of [{missionId:'m1'},{missionId:'m1',completedAt:stamp(9000)},{missionId:'m1',completedAt:stamp(3000)}]){
        const evidence=scope.followupQuizEvidence(note,[{missionId:'m1',completedAt:stamp(3000)},extra],5000);
        assert.equal(evidence.latest,null);assert.equal(evidence.uncertain,true);
    }
    assert.equal(scope.followupQuizEvidence({missionId:'m1'},[],5000).available,false);
});
test('a new status boundary excludes earlier follow-up attempts',()=>{
    const attempts=[{missionId:'m1',completedAt:stamp(3000)}];
    assert.equal(scope.followupQuizEvidence({missionId:'m1',statusAt:stamp(2000)},attempts,5000).attempts.length,1);
    assert.equal(scope.followupQuizEvidence({missionId:'m1',statusAt:stamp(4000)},attempts,5000).attempts.length,0);
});

test('quiz support labels separate absent, unavailable, uncertain and review evidence',()=>{
 assert.equal(scope.quizSupportLabel(null).state,'unavailable');
 let signals=scope.quizSupportSignals([],5000);assert.equal(scope.quizSupportLabel(signals).state,'no-evidence');assert.ok(scope.quizSupportLabel(signals).reason.includes('does not establish inactivity'));
 signals=scope.quizSupportSignals([{missionId:'m',passed:false,completedAt:stamp(2000)}],5000);assert.equal(scope.quizSupportLabel(signals).state,'review');assert.equal(signals.latestAt,2000);
 signals=scope.quizSupportSignals([{missionId:'m',passed:false,completedAt:stamp(9000)}],5000);assert.equal(scope.quizSupportLabel(signals).state,'uncertain');assert.equal(signals.review.length,0);
 signals=scope.quizSupportSignals([{missionId:'m',passed:true,completedAt:stamp(2000)}],5000);assert.equal(scope.quizSupportLabel(signals).state,'no-signal');assert.ok(scope.quizSupportLabel(signals).reason.includes('does not establish mastery'));
});
test('tied or invalid dates cannot generate a definite support diagnosis',()=>{
 for(const extra of [{missionId:'m'}, {missionId:'m',completedAt:stamp(9000)}, {missionId:'m',passed:true,completedAt:stamp(2000)}]){
 const signals=scope.quizSupportSignals([{missionId:'m',passed:false,completedAt:stamp(2000)},extra],5000);assert.equal(signals.review.length,0);assert.equal(scope.quizSupportLabel(signals).state,'uncertain');}
 const mixed=scope.quizSupportSignals([{missionId:'m',passed:false,completedAt:stamp(2000)},{missionId:'other'}],5000);assert.equal(scope.quizSupportLabel(mixed).state,'review');assert.ok(scope.quizSupportLabel(mixed).reason.includes('Other mission results'));
});
