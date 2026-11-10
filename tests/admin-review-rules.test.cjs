const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {separateActivation}=require('../tools/admin-review-rules.cjs');
test('local overlay changes only review approval status preservation',()=>{
 const source=fs.readFileSync('build/priority3-stage0-release/rules/firestore.rules','utf8');
 const overlay=separateActivation(source);
 assert.equal(overlay.replace("? resource.data.status : resource.data.status == 'inactive'","? 'active' : resource.data.status == 'inactive'"),source);
 assert.equal(require('../functions/stage0-gcloud-plan.cjs').validateCandidateArchive().archiveValid,true,'frozen accepted archive still validates');
});
test('unexpected or already patched rules fail closed',()=>{
 assert.throws(()=>separateActivation('unrecognized rules'));
 assert.throws(()=>separateActivation(separateActivation(fs.readFileSync('firestore.assessment.rules','utf8'))));
});
