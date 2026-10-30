const {test}=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('../functions/audit-retained-question-alignment.cjs');
const snapshot=require('../docs/validation/learning-content-snapshot.json'),bundle=require('../data/question-reconciliation-review.json');
test('retained questions map to fifteen taught topics with separate practice and retry coverage',()=>{
    const r=audit(snapshot,bundle);assert.deepEqual(r.errors,[]);assert.equal(r.totals.questions,30);assert.equal(r.totals.topics,15);
    assert.equal(r.totals.missions,3);assert.equal(r.totals.topicsWithoutRequestedReviewDifficulty,6);
    assert.ok(r.topics.every(t=>t.mappedScenes.length&&t.practice.length>=2&&t.retryCoverage===2));
    assert.equal(r.liveStateVerified,false);
});
test('alignment audit detects broken topic routing rather than accepting any scene in the mission',()=>{
    const copy=structuredClone(snapshot),topic=bundle.questions[0].canonicalReviewFields.topic;
    for(const scene of copy.collections.storyScenes)scene.reviewTopics=scene.reviewTopics?.filter(t=>t!==topic);
    assert.ok(audit(copy,bundle).errors.some(e=>e.reason==='missing-lesson'&&e.topic===topic));
});
test('alignment audit flags practice that repeats a main assessment prompt',()=>{
    const copy=structuredClone(snapshot),question=bundle.questions[0].canonicalReviewFields;
    const quiz=copy.collections.quizzes.find(q=>q.id===question.quizId);
    const practice=copy.collections.practiceQuestions.find(p=>p.missionId===quiz.missionId&&p.topic===question.topic);
    practice.question='  '+question.question.toUpperCase()+'  ';
    assert.ok(audit(copy,bundle).errors.some(e=>e.reason==='practice-repeats-main-prompt'));
});
