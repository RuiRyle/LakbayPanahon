const {test}=require('node:test'),assert=require('node:assert/strict');
const {trace}=require('../functions/reconcile-content-local.cjs');
const step=(file,expected,value)=>({file,expected,value,guarded:true});
test('field reconciliation follows guarded revisions independent of filename order',()=>{
    const result=trace('old',[step('later','middle','new'),step('earlier','old','middle')]);
    assert.equal(result.status,'unique-field-terminal');assert.deepEqual(result.candidateWriters,['later']);
});
test('branch and cycle histories never select a deployment candidate',()=>{
    const branch=trace('old',[step('a','old','one'),step('b','old','two')]);
    assert.equal(branch.status,'branch-review');assert.equal(branch.candidateHash,undefined);
    assert.equal(trace('old',[step('a','old','new'),step('b','new','old')]).status,'cycle');
});
test('unguarded writes and disconnected history remain explicit review items',()=>{
    assert.equal(trace('old',[{file:'unknown',value:'new',guarded:false}]).status,'unguarded-review');
    const disconnected=trace('old',[step('next','old','new'),step('unrelated','other','last')]);
    assert.equal(disconnected.status,'disconnected-review');assert.deepEqual(disconnected.disconnectedFiles,['unrelated']);
});
