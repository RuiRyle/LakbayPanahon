const {test}=require('node:test'),assert=require('node:assert/strict');
const {reviewRevision,build}=require('../functions/review-prologue-feedback-local.cjs');
test('archaeology guards resolve to the preserved pre-glossary whole-document revision',()=>{
    const previous=require('../backups/archaeology-pilot-before-glossary.json'),current=require('../data/archaeology-pilot-migration.json');
    const report=reviewRevision(previous,current);assert.equal(report.length,27);assert.ok(report.every(d=>d.expectedMatchesPriorAuthoredRevision));
});
test('whole-document revision check rejects a mixed content and answer baseline',()=>{
    const previous={writes:[{path:'questions/q',fields:{question:'old',correctAnswer:'B'}}]};
    const current={writes:[{path:'questions/q',expected:{question:'old',correctAnswer:'A'},fields:{question:'new',correctAnswer:'C'}}]};
    assert.equal(reviewRevision(previous,current)[0].expectedMatchesPriorAuthoredRevision,false);
});
test('feedback review does not treat a dated snapshot as live approval or publish old fields',()=>{
    const report=build(require('../docs/validation/learning-content-snapshot.json'),require('../backups/archaeology-pilot-before-glossary.json'),require('../data/archaeology-pilot-migration.json'),require('../data/question-feedback-migration.json'),require('../data/grade5-quiz-wording.json'));
    assert.equal(report.feedback.filter(q=>q.wordingOverlap&&q.wordingMatchesSnapshot).length,20);
    assert.equal(report.feedback.filter(q=>!q.feedbackMatchesSnapshot).length,30);
    assert.equal(report.executable,false);assert.equal(report.liveStateVerified,false);
});
