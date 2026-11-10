const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../js/student-class-client.js'),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
function loadClient(context){
 context.doc=(_,name,id)=>name+'/'+id;context.collection=(_,name)=>name;context.where=(field,op,value)=>({field,value});context.query=(...args)=>args;
 context.getDocsFromServer=async()=>({docs:[]});
 const original=context.runTransaction;
 context.runTransaction=async(db,fn)=>original(db,tx=>fn({...tx,get:ref=>String(ref).startsWith('studentClassSlots/')?Promise.resolve({exists:()=>false}):tx.get(ref),set:(ref,data)=>{if(!String(ref).startsWith('studentClassSlots/'))tx.set(ref,data);}}));
 vm.runInContext(source,context);
}

test('class join validates codes, uses deterministic owned membership and preserves duplicate joins',async()=>{let saved,writes=0,existing=false;const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:(_,name,id)=>name+'/'+id,serverTimestamp:()=>123,getDocFromServer:async()=>({exists:()=>true,data:()=>({status:'active',classId:'c1'})}),runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>existing,data:()=>({userId:'student',classId:'c1',status:'active'})}),set:(ref,data)=>{writes++;saved={ref,data};}})});loadClient(context);assert.equal(context.normalizeClassCode('abcd-1234-efgh'),'ABCD1234EFGH');assert.throws(()=>context.normalizeClassCode('short'),/12-character/);await context.joinStudentClass('ABCD1234EFGH');assert.equal(saved.ref,'classMembers/student_c1');assert.equal(saved.data.userId,'student');assert.equal(saved.data.classId,'c1');assert.equal(saved.data.status,'active');existing=true;const result=await context.joinStudentClass('ABCD1234EFGH');assert.equal(result.alreadyJoined,true);assert.equal(writes,1);});
test('expired, revoked and unknown invites never write membership',async()=>{let data={status:'active',classId:'c1',expiresAt:{toMillis:()=>1}},exists=true,writes=0;const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=>'',getDocFromServer:async()=>({exists:()=>exists,data:()=>data}),runTransaction:async()=>{writes++;}});loadClient(context);await assert.rejects(context.joinStudentClass('ABCD1234EFGH'),/unavailable/);data={status:'revoked',classId:'c1'};await assert.rejects(context.joinStudentClass('ABCD1234EFGH'),/unavailable/);exists=false;await assert.rejects(context.joinStudentClass('ABCD1234EFGH'),/unavailable/);assert.equal(writes,0);});
test('a session replacement during invite lookup cannot join for the previous account',async()=>{let release,writes=0;const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=>'',getDocFromServer:async()=>{await new Promise(r=>release=r);return{exists:()=>true,data:()=>({status:'active',classId:'c1'})};},runTransaction:async()=>{writes++;}});loadClient(context);const pending=context.joinStudentClass('ABCD1234EFGH');context.auth.currentUser={uid:'other'};release();await assert.rejects(pending,/session changed/);assert.equal(writes,0);});


test('inactive membership cannot be reported as already joined',async()=>{
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=>'',getDocFromServer:async()=>({exists:()=>true,data:()=>({status:'active',classId:'c1'})}),runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>true,data:()=>({userId:'student',classId:'c1',status:'removed'})}),set(){throw Error('Unexpected write');}})});
 loadClient(context);await assert.rejects(context.joinStudentClass('ABCD1234EFGH'),/membership.*not active/i);
});

test('malformed expiry is a safe unavailable-code error and never starts a membership write',async()=>{
 for(const expiresAt of ['tomorrow',{toMillis:()=>NaN},{toMillis:()=>{throw Error('private parse detail');}}]){
  const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=>'',getDocFromServer:async()=>({exists:()=>true,data:()=>({status:'active',classId:'c1',expiresAt})}),runTransaction:async()=>{throw Error('Unexpected transaction');}});
  loadClient(context);await assert.rejects(context.joinStudentClass('ABCD1234EFGH'),/class code is unavailable/);
 }
});

test('an account switch during membership lookup cannot enqueue an old-account write',async()=>{
 let release,writes=0;const auth={currentUser:{uid:'student'}};
 const context=vm.createContext({auth,db:{},doc:()=>'',serverTimestamp:()=>1,getDocFromServer:async()=>({exists:()=>true,data:()=>({status:'active',classId:'c1'})}),runTransaction:async(_,fn)=>fn({get:async()=>{await new Promise(r=>release=r);return {exists:()=>false};},set:()=>writes++})});
 loadClient(context);const task=context.joinStudentClass('ABCD1234EFGH');await new Promise(r=>setImmediate(r));auth.currentUser={uid:'other'};release();await assert.rejects(task,/session changed/);assert.equal(writes,0);
});

test('confirmation cancellation never writes membership and different codes target only their linked classroom',async()=>{
 let writes=[];const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:(_,name,id)=>name+'/'+id,serverTimestamp:()=>1,getDocFromServer:async ref=>({exists:()=>true,data:()=>({status:'active',classId:ref.endsWith('AAAAAAAAAAAA')?'a':'b',className:'Selected classroom',teacherName:'Teacher'})}),runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>false}),set:(ref,data)=>writes.push({ref,data})})});loadClient(context);
 const cancelled=await context.joinStudentClass('AAAAAAAAAAAA',invite=>{assert.equal(invite.classId,'a');assert.equal(invite.className,'Selected classroom');return false;});assert.equal(cancelled.cancelled,true);assert.equal(writes.length,0);
 await context.joinStudentClass('AAAAAAAAAAAA',()=>true);await context.joinStudentClass('BBBBBBBBBBBB',()=>true);assert.deepEqual(writes.map(w=>w.ref),['classMembers/student_a','classMembers/student_b']);assert.deepEqual(writes.map(w=>w.data.classId),['a','b']);
});
