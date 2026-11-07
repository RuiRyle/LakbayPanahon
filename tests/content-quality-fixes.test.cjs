const {test}=require('node:test'),assert=require('node:assert/strict');
const plan=require('../data/content-quality-fixes-migration.json'),compiler=require('../functions/build-content-quality-fixes.cjs'),{validatePlan}=require('../functions/apply-content-quality-fixes.cjs'),{audit}=require('../functions/audit-learning-clarity.cjs'),{normalize}=require('../js/lesson-narration-text.js'),{compareDocument}=require('../functions/apply-balangay-clarity.cjs');
test('the reviewed plan removes all four recorded structural editorial flags without dropping mapped topics',()=>{
 assert.equal(validatePlan(plan),true);const result=audit(compiler.publishedBaseline(),plan);assert.equal(result.counts.genericStems,0);assert.equal(result.counts.repeatedWrongFeedback,0);assert.equal(result.counts.longParagraphs,0);assert.equal(result.counts.missingLessonTopics,0);
});
test('225 hard tasks use specific sourced cases and retain original scoring letters and difficulty',()=>{
 assert.equal(plan.provenance.length,225);assert.equal(plan.summary.reusedLessonCases,213);assert.equal(plan.summary.supplementalCases,12);const rows=plan.writes.filter(w=>w.fields.optionA!==undefined);assert.equal(rows.length,225);assert.ok(new Set(rows.map(w=>w.fields['option'+w.expected.correctAnswer])).size>200);
 for(const w of rows){assert.equal(w.expected.difficulty,'hard');assert.equal(Object.hasOwn(w.fields,'difficulty'),false);assert.equal(Object.hasOwn(w.fields,'correctAnswer'),false);assert.equal(new Set(['A','B','C','D'].map(k=>w.fields['option'+k])).size,4);assert.doesNotMatch(w.fields['option'+w.expected.correctAnswer],/^The note supports the point/);assert.ok(w.fields.question.includes('?'));assert.equal(w.fields.answerExplanations[w.expected.correctAnswer],w.fields.explanation);}
});
test('easy stems preserve every option and key while all feedback keeps supported correct explanations',()=>{
 assert.equal(plan.summary.easyStems,225);assert.equal(plan.summary.repeatedFeedbackRecords,1054);
 for(const w of plan.writes.filter(w=>w.fields.answerExplanations)){assert.equal(Object.values(w.fields.answerExplanations).length,4);assert.equal(new Set(Object.values(w.fields.answerExplanations)).size,4);if(!w.fields.optionA)assert.equal(w.fields.answerExplanations[w.expected.correctAnswer],w.expected.answerExplanations[w.expected.correctAnswer]||w.expected.explanation);}
});
test('paragraph changes preserve all wording except the explicitly replaced obsolete final notices',()=>{
 const baseline=compiler.publishedBaseline().collections;let notices=0;
 for(const w of plan.writes.filter(w=>w.path.startsWith('storyScenes/'))){const old=w.expected.content,newText=w.fields.content,stale=/remain unfinished|still being prepared|still need to be built|only .*prepared here/i.test(old);if(!stale)assert.equal(normalize(newText),normalize(old));else{notices++;const paragraphs=old.split(/\n\s*\n/),prefix=normalize(paragraphs.slice(0,-1).join(' '));assert.ok(normalize(newText).startsWith(prefix));assert.match(newText,/then pass the chapter challenge/);assert.doesNotMatch(newText,/still being prepared|still need to be built|remain unfinished/i);const m=baseline.missions.find(m=>m.id===w.expected.missionId);assert.ok(baseline.chapterChallenges.some(c=>c.chapterId===m.chapterId&&c.status==='active'));}assert.ok(newText.split(/\n\s*\n/).every(p=>p.trim().split(/\s+/).length<=70));}assert.equal(notices,22);
});
test('unreviewed wording, scoring, policies and learner paths are rejected; readback remains idempotent',()=>{
 for(const mutate of [p=>p.writes[0].fields.correctAnswer='A',p=>p.writes[0].fields.difficulty='easy',p=>p.writes[0].fields.xpReward=999,p=>p.writes[0].path='users/example',p=>p.writes[0].fields.question='Unreviewed']){const p=structuredClone(plan);mutate(p);assert.throws(()=>validatePlan(p));}
 for(const w of plan.writes){assert.equal(compareDocument(w,w.expected),'pending');assert.equal(compareDocument(w,{...w.expected,...w.fields}),'already-applied');assert.throws(()=>compareDocument(w,{...w.expected,status:'inactive'}));}
});
