const {test}=require('node:test'),assert=require('node:assert/strict');
const {build}=require('../functions/build-question-reconciliation.cjs');
test('all thirty older feedback differences receive complete coherent review sets',()=>{
    const bundle=build();assert.equal(bundle.questions.length,30);assert.equal(new Set(bundle.questions.map(q=>q.path)).size,30);
    const expected=require('../docs/validation/prologue-feedback-review-local.json').feedback.filter(q=>!q.feedbackMatchesSnapshot).map(q=>q.path).sort();
    assert.deepEqual(bundle.questions.map(q=>q.path).sort(),expected);
    for(const q of bundle.questions){const f=q.canonicalReviewFields;
        assert.ok('ABCD'.includes(f.correctAnswer));assert.equal(new Set('ABCD'.split('').map(k=>f['option'+k])).size,4);
        for(const k of 'ABCD')assert.ok(f.answerExplanations[k]);
        assert.ok(f.question&&f.explanation&&f.learningPoint&&f.quizId&&f.topic);
        assert.equal(q.liveStateVerified,false);
    }
});
test('review retains complete later sets without changing scenario answer keys or creating an apply plan',()=>{
    const bundle=build(),snapshot=require('../docs/validation/learning-content-snapshot.json');
    assert.equal(bundle.questions.filter(q=>q.source==='roadmap-chapter34-migration.json').length,10);
    const scenarios=bundle.questions.filter(q=>q.earlierScenario);assert.equal(scenarios.length,20);
    assert.ok(scenarios.every(q=>q.answerKeyMatchesEarlierScenario));
    for(const q of bundle.questions){const {id,...original}=snapshot.collections.questions.find(d=>'questions/'+d.id===q.path);assert.deepEqual(q.canonicalReviewFields,original);}
    assert.equal(bundle.writes,undefined);assert.equal(bundle.teacherReview,'pending');
});
