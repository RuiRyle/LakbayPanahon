const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const cases=require('../data/discovery-cases.json');
const {validateCases,compareMission,makeWrite}=require('../functions/publish-discovery-cases.cjs');
const {encode}=require('../functions/apply-chapter1-mission1-learning-polish.cjs');
const runtime=()=>{
    const auth={currentUser:{uid:'owner'}},calls=[];
    let result={status:'active',chapterId:'chapter-1',discoveryCase:structuredClone(cases[0])},fail=false,wait=null;
    const context=vm.createContext({URL,URLSearchParams,auth,db:{},doc:(_,name,id)=>({name,id}),getDoc:async ref=>{calls.push(ref);if(wait)await wait;if(fail)throw Error('Offline');return {exists:()=>!!result,data:()=>result};}});
    for(const file of ['discovery-cases.js','discovery-case-loader.js'])vm.runInContext(fs.readFileSync('js/'+file,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,''),context);
    return {context,auth,calls,setResult:v=>result=v,setFailure:v=>fail=v,setWait:v=>wait=v};
};
test('case schema rejects malformed structures, wrong identity and unsafe source URLs',()=>{
    const {context}=runtime(),valid=()=>({id:'mission-1',chapterId:'chapter-1',discoveryCase:structuredClone(cases[0])});
    assert.ok(context.validatedDiscoveryCase(valid()));
    for(const change of [m=>delete m.discoveryCase,m=>m.discoveryCase.version=99,m=>m.discoveryCase.missionId='other',m=>m.discoveryCase.clues=[],m=>m.discoveryCase.claims=['same',' same '],m=>m.discoveryCase.answer=5,m=>m.discoveryCase.support=-1,m=>m.discoveryCase.compare[0].answer='unknown',m=>m.discoveryCase.source={title:'Bad',url:'javascript:alert(1)'},m=>m.discoveryCase.source={title:'Bad',url:'https://name:password@example.com'},m=>m.discoveryCase.source={title:'Bad',url:'http://example.com'}]){const m=valid();change(m);assert.equal(context.validatedDiscoveryCase(m),null);}
});
test('museum lookup reads only the requested mission, handles absence, rejects invalid data and retries failures',async()=>{
    const r=runtime();assert.equal((await r.context.loadDiscoveryCase('chapter-1','mission-1')).id,'community-clues');
    assert.equal(r.calls.length,1);assert.equal(r.calls[0].name,'missions');assert.equal(r.calls[0].id,'mission-1');
    r.setResult(null);assert.equal(await r.context.loadDiscoveryCase('chapter-1','mission-1'),null);
    r.setResult({status:'active',chapterId:'chapter-1'});assert.equal(await r.context.loadDiscoveryCase('chapter-1','mission-1'),null);
    r.setResult({status:'active',chapterId:'chapter-1',discoveryCase:{}});await assert.rejects(()=>r.context.loadDiscoveryCase('chapter-1','mission-1'));
    r.setFailure(true);await assert.rejects(()=>r.context.loadDiscoveryCase('chapter-1','mission-1'));
    r.setFailure(false);r.setResult({status:'active',chapterId:'chapter-1',discoveryCase:cases[0]});assert.ok(await r.context.loadDiscoveryCase('chapter-1','mission-1'));
    const count=r.calls.length;await assert.rejects(()=>r.context.loadDiscoveryCase('chapter-1','../invalid'));assert.equal(r.calls.length,count);
});
test('a pending museum read cannot return content to a replaced auth session',async()=>{
    const r=runtime();let release;r.setWait(new Promise(resolve=>release=resolve));const pending=r.context.loadDiscoveryCase('chapter-1','mission-1');r.auth.currentUser={uid:'owner'};release();await assert.rejects(()=>pending,/session changed/);
});
test('publication is limited to three valid cases and never overwrites conflicting existing content',()=>{
    assert.equal(validateCases(cases),true);assert.throws(()=>validateCases(cases.slice(1)));
    const changed=structuredClone(cases);changed[0].missionId='another';assert.throws(()=>validateCases(changed));
    const old={status:'active',chapterId:'chapter-1',xpReward:45,learningGuide:{question:'Preserve me'}};
    assert.equal(compareMission(cases[0],old),'pending');
    assert.equal(compareMission(cases[0],{...old,discoveryCase:cases[0]}),'already-applied');
    assert.throws(()=>compareMission(cases[0],{...old,discoveryCase:{}}));assert.throws(()=>compareMission(cases[0],{...old,status:'draft'}));
    const before={name:'projects/lakbaypanahon-1797e/databases/(default)/documents/missions/mission-1',updateTime:'2026-11-05T01:00:00Z',fields:Object.fromEntries(Object.entries(old).map(([k,v])=>[k,encode(v)]))};
    const write=makeWrite(cases[0],before);assert.deepEqual(Object.keys(write.update.fields),['discoveryCase']);assert.deepEqual(write.updateMask.fieldPaths,['discoveryCase']);assert.equal(write.currentDocument.updateTime,before.updateTime);assert.equal(old.xpReward,45);
    assert.throws(()=>makeWrite(cases[0],{...before,updateTime:null}));
});
test('runtime discovery modules contain no authored case catalog or authoring dependency',()=>{
    for(const file of ['discovery-cases.js','mission-discovery.js','museum-exhibits.js'])assert.doesNotMatch(fs.readFileSync('js/'+file,'utf8'),/community-clues|trade-clues|boat-clues|data\/discovery/);
});
