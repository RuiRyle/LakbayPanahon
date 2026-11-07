const {test}=require('node:test'),assert=require('node:assert/strict'),plan=require('../data/student-content-completion-migration.json'),{validatePlan}=require('../functions/apply-student-content-completion.cjs'),{compareDocument}=require('../functions/apply-balangay-clarity.cjs');
test('all 49 legacy practice items gain complete feedback without changing assessment content or evidence',()=>{
 assert.equal(validatePlan(plan),true);const rows=plan.writes.filter(w=>w.path.startsWith('practiceQuestions/'));assert.equal(rows.length,49);
 for(const w of rows){assert.deepEqual(Object.keys(w.fields),['answerExplanations']);assert.equal(w.fields.answerExplanations[w.expected.correctAnswer],w.expected.explanation);assert.equal(new Set(Object.values(w.fields.answerExplanations)).size,4);assert.ok(Object.values(w.fields.answerExplanations).every(v=>typeof v==='string'&&v.trim()));}
});
test('13 reference repairs preserve every scene activity, answer and original lesson',()=>{const rows=plan.writes.filter(w=>w.path.startsWith('storyScenes/'));assert.equal(rows.length,13);for(const w of rows){assert.deepEqual(Object.keys(w.fields),['sourceUrls']);assert.ok(w.fields.sourceUrls.every(u=>u.startsWith('https://')));assert.equal(w.expected.sourceUrls?.length||0,0);}});
test('publication rejects drift, unreviewed feedback, learner paths, answer changes and policy edits',()=>{
 for(const mutate of [p=>p.writes[0].path='users/example',p=>p.writes[0].fields.correctAnswer='B',p=>p.writes[0].fields.reviewEvidencePolicy={},p=>p.writes[0].fields.answerExplanations.A='Unreviewed',p=>p.projectId='other']){const p=structuredClone(plan);mutate(p);assert.throws(()=>validatePlan(p));}
 for(const w of plan.writes){assert.equal(compareDocument(w,w.expected),'pending');assert.equal(compareDocument(w,{...w.expected,...w.fields}),'already-applied');assert.throws(()=>compareDocument(w,{...w.expected,status:'inactive'}));}
});
