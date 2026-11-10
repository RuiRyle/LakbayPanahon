const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('js/student-class-client.js','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
function setup(){
 const records=new Map(),writes=[];let members=[];
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:(_,name,id)=>name+'/'+id,collection:(_,name)=>name,where:()=>null,query:()=>null,serverTimestamp:()=>1,
  getDocsFromServer:async()=>({docs:members.map(data=>({data:()=>data}))}),
  getDocFromServer:async()=>({exists:()=>true,data:()=>({classId:'new',status:'active'})}),
  runTransaction:async(_,fn)=>{const pending=[];const result=await fn({get:async ref=>({exists:()=>records.has(ref),data:()=>records.get(ref)}),set:(ref,data)=>pending.push([ref,data])});for(const [ref,data] of pending){records.set(ref,data);writes.push(ref);}return result;}});
 vm.runInContext(source,context);return {context,records,writes,members:value=>members=value};
}
test('another existing active membership blocks joining before any transaction writes',async()=>{
 const r=setup();r.members([{userId:'student',classId:'old',status:'active'}]);await assert.rejects(r.context.joinStudentClass('ABCDEFGHIJKL'),/only one class/);assert.equal(r.writes.length,0);
});
test('reservation blocks a different class even if the initial membership query was stale',async()=>{
 const r=setup();r.records.set('studentClassSlots/student',{classId:'old'});r.records.set('classMembers/student_old',{userId:'student',classId:'old',status:'active'});await assert.rejects(r.context.joinStudentClass('ABCDEFGHIJKL'),/only one class/);assert.equal(r.writes.length,0);
});
test('new membership and reservation save together; a duplicate join remains idempotent',async()=>{
 const r=setup();await r.context.joinStudentClass('ABCDEFGHIJKL');assert.equal(r.records.get('studentClassSlots/student').classId,'new');assert.equal(r.records.get('classMembers/student_new').status,'active');const result=await r.context.joinStudentClass('ABCDEFGHIJKL');assert.equal(result.alreadyJoined,true);assert.equal(r.writes.filter(ref=>ref==='classMembers/student_new').length,1);
});
test('leaving or teacher removal permits replacing a stale reservation without changing learning records',async()=>{
 const r=setup();r.records.set('studentClassSlots/student',{classId:'old'});await r.context.joinStudentClass('ABCDEFGHIJKL');assert.equal(r.records.get('studentClassSlots/student').classId,'new');assert.ok(r.writes.every(ref=>ref.startsWith('classMembers/')||ref.startsWith('studentClassSlots/')));
});
