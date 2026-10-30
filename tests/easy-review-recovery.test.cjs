const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const plan=require('../data/easy-review-gaps-migration.json');
test('new easy items fill the six catalog gaps without changing existing assessments',()=>{
    const snapshot=structuredClone(require('../docs/validation/learning-content-snapshot.json'));
    assert.equal(plan.writes.length,6);
    for(const w of plan.writes){assert.equal(w.create,true);assert.ok(w.path.startsWith('practiceQuestions/'));
        const q=w.fields;assert.equal(q.difficulty,'easy');assert.equal(q.reviewEvidencePolicy.requiredDifficulty,'hard');
        assert.ok(!snapshot.collections.practiceQuestions.some(p=>p.id===w.path.split('/')[1]||p.question===q.question));
        assert.equal(new Set('ABCD'.split('').map(k=>q['option'+k])).size,4);
        for(const k of 'ABCD')assert.ok(q.answerExplanations[k]);
        snapshot.collections.practiceQuestions.push({id:w.path.split('/')[1],...q});
    }
    const r=require('../functions/audit-retained-question-alignment.cjs').audit(snapshot,require('../data/question-reconciliation-review.json'));
    assert.deepEqual(r.errors,[]);assert.equal(r.totals.topicsWithoutRequestedReviewDifficulty,0);
});
function route(passed,topics){
    const source=fs.readFileSync(require.resolve('../js/quiz.js'),'utf8');
    const start=source.indexOf('continueResultButton.addEventListener('),end=source.indexOf('/* ==========================================\n   ERROR',start);
    let handler;const context={continueResultButton:{addEventListener:(event,fn)=>{handler=fn;}},lastQuizPassed:passed,lastQuizTopics:topics,chapterId:'chapter-1',missionId:'mission-1',URLSearchParams,window:{location:{href:''}}};
    vm.runInNewContext(source.slice(start,end),context);handler();return new URL(context.window.location.href,'https://example.test/');
}
test('failed quiz recovery goes to the diagnosed lesson topic with safe query encoding',()=>{
    const url=route(false,['custom & shared']);assert.equal(url.pathname,'/story.html');assert.equal(url.searchParams.get('reviewTopic'),'custom & shared');
    assert.equal(url.searchParams.get('mission'),'mission-1');assert.equal(route(false,[]).searchParams.has('reviewTopic'),false);
});
test('passed quiz recovery still returns to the mission journey',()=>{
    const url=route(true,['custom']);assert.equal(url.pathname,'/mission.html');assert.equal(url.searchParams.get('chapter'),'chapter-1');
});
