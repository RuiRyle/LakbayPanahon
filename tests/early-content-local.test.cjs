const {test}=require('node:test'),assert=require('node:assert/strict');
const {classify,review}=require('../functions/audit-early-content-local.cjs');
test('snapshot comparison distinguishes an applied patch from a stale guard and pending revision',()=>{
    assert.equal(classify({content:'new'},{expected:{content:'old'},fields:{content:'new'}}),'matches-snapshot');
    assert.equal(classify({content:'old'},{expected:{content:'old'},fields:{content:'new'}}),'guard-matches-snapshot');
    assert.equal(classify({content:'other'},{expected:{content:'old'},fields:{content:'new'}}),'guard-differs-from-snapshot');
    assert.equal(classify(undefined,{create:true,fields:{content:'new'}}),'create-not-in-snapshot');
    assert.equal(classify(undefined,{fields:{content:'new'}}),'baseline-missing');
});
test('single-document pilot guards and overlapping fields remain visible without applying edits',()=>{
    const snapshot={auditedAt:'dated',collections:{storyScenes:[{id:'s',content:'old'}]}};
    const report=review(snapshot,[{file:'pilot',data:{path:'storyScenes/s',expectedFirestoreFields:{content:'old'},fields:{content:'new'}}},
        {file:'later',data:{writes:[{path:'storyScenes/s',expected:{content:'new'},fields:{content:'later'}}]}}]);
    assert.equal(report.plans[0].statuses['guard-matches-snapshot'],1);
    assert.equal(report.plans[1].statuses['guard-differs-from-snapshot'],1);
    assert.deepEqual(report.overlappingFields[0].fields.content,['pilot','later']);
    assert.equal(snapshot.collections.storyScenes[0].content,'old');
    assert.equal(report.liveStateVerified,false);
});
