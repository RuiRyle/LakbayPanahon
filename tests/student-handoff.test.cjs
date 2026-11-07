const {test}=require('node:test'),assert=require('node:assert/strict'),{audit}=require('../functions/audit-student-handoff.cjs');
test('published curriculum supports every mission assessment, retry and targeted practice route',()=>{
 const result=audit();assert.deepEqual(result.issues,[]);assert.equal(result.counts.missions,66);assert.equal(result.counts.scenes,388);assert.equal(result.counts.topics,330);
});
test('normal Home recommendations and Journey locks agree through the entire selected journey',()=>{
 const result=audit();assert.equal(result.status,'pass');assert.equal(result.steps.filter(s=>s.kind==='mission').length,66);assert.equal(result.steps.filter(s=>s.kind==='challenge').length,16);assert.equal(result.steps.at(-1).kind,'complete');assert.equal(new Set(result.steps.filter(s=>s.id).map(s=>s.id)).size,82);
});
