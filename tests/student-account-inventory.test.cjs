const {test}=require('node:test'),assert=require('node:assert/strict');
const {inspectAccount}=require('../functions/student-account-inventory.cjs');
const scope=require('../data/student-account-data-scope.json');
test('inventory scopes every collection to the explicit owner and returns counts without private content',async()=>{
 const calls=[];const report=await inspectAccount('student',{profileExists:async uid=>{assert.equal(uid,'student');return true;},listOwned:async(name,uid,limit)=>{calls.push(name);assert.equal(uid,'student');assert.equal(limit,501);return[{id:'a',userId:uid,email:'private@example.com',answers:{private:true}}];}});
 assert.deepEqual(calls,scope.ownedCollections);assert.equal(report.complete,true);assert.ok(report.collections.every(c=>c.count===1));assert.ok(!JSON.stringify(report).includes('private@example.com'));
 for(const name of scope.excludedSharedCollections)assert.ok(!calls.includes(name));
});
test('invalid identities are rejected before any profile or collection lookup',async()=>{
 for(const uid of ['',null,{},'../student','user/name',' user','..'])await assert.rejects(inspectAccount(uid,{profileExists:()=>{throw Error('Must not read');},listOwned:()=>{throw Error('Must not read');}}),/valid explicit account UID/);
});
test('foreign ownership fails instead of treating the record as the requested account',async()=>{
 await assert.rejects(inspectAccount('student',{profileExists:async()=>true,listOwned:async()=>[{id:'foreign',userId:'other'}]}),/foreign ownership/);
});
test('bounded inventory labels larger collections incomplete rather than claiming a full export',async()=>{
 const report=await inspectAccount('student',{profileExists:async()=>false,listOwned:async()=>Array.from({length:501},(_,i)=>({id:'r'+i,userId:'student'}))});
 assert.equal(report.complete,false);assert.ok(report.collections.every(c=>c.count===500&&c.truncated));
});
