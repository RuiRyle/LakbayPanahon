const {test}=require('node:test'),assert=require('node:assert/strict');
const {validatePlan,compareDocument,buildPlan,parseFlags}=require('../functions/prepare-chapter2-scene-help-local.cjs');
test('four scoped help drafts reject reward, body, answer and nested-path mutations',()=>{
 const plan=buildPlan();assert.equal(plan.writes.length,4);
 for(const field of ['xpReward','content','checkCorrectAnswer']){const altered=structuredClone(plan);altered.writes[0].fields[field]='unexpected';assert.throws(()=>validatePlan(altered),/scope/);}
 const nested=structuredClone(plan);nested.writes[0].path+='/unexpected';assert.throws(()=>validatePlan(nested),/scope/);
 const other=structuredClone(plan);other.writes[0].path='users/other';assert.throws(()=>validatePlan(other),/scope/);
});
test('stale body, identity and topic guards fail even if proposed help already matches',()=>{
 const write=buildPlan().writes[0],current={...write.expected};assert.equal(compareDocument(write,current),'pending');
 for(const field of ['content','missionId','reviewTopics'])assert.throws(()=>compareDocument(write,{...current,[field]:'changed',learningHelp:write.fields.learningHelp}),/changed/);
});
test('newly authored help is preserved and exact applied help is recognized',()=>{
 const write=buildPlan().writes[0];assert.throws(()=>compareDocument(write,{...write.expected,learningHelp:{explanation:'Teacher addition'}}),/authored/);
 assert.equal(compareDocument(write,{...write.expected,learningHelp:write.fields.learningHelp}),'already-applied');
 const unqualified=buildPlan();unqualified.writes[0].fields.learningHelp.example='Everyone did this';assert.throws(()=>validatePlan(unqualified),/qualified/);
});
test('local CLI parser rejects publication, unknown and ambiguous flags',()=>{
 assert.equal(parseFlags([]),false);assert.equal(parseFlags(['--check']),true);
 for(const flags of [['--apply'],['--dry-run-live'],['unknown'],['--check','--check']])assert.throws(()=>parseFlags(flags),/no publication mode/);
});
