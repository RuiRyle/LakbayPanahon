const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/learning-draft.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(legacy=null){
 let record=legacy,revision=0,gate=null,loseAck=false;
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const snap=()=>{const value=copy(record);return{exists:()=>value!==null,data:()=>value};};
 const c=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',serverTimestamp:()=>0,getDocFromServer:async()=>snap(),
 runTransaction:async(_,fn)=>{for(let retry=0;retry<8;retry++){
  const version=revision,jobs=[];const result=await fn({get:async()=>snap(),set:(_,data)=>jobs.push(()=>{record={...copy(data),updatedAt:{seconds:++revision,nanoseconds:0}};}),delete:()=>jobs.push(()=>{record=null;revision++;})});
  if(gate){const wait=gate;gate=null;await wait;}
  if(version!==revision)continue;
  for(const job of jobs)job();
  if(loseAck&&jobs.length){loseAck=false;throw Error('Connection interrupted after commit');}
  return result;
 }throw Error('Too much contention');}});
 vm.runInContext(source,c);
 return{auth:c.auth,make:()=>{const status={textContent:'',retryButton:{hidden:true}};return{draft:c.learningDraft('quiz','c1','m1',status),status};},record:()=>copy(record),hold:promise=>{gate=promise;},loseAck:()=>{loseAck=true;}};
}
test('stale session cannot overwrite or delete a newer draft; refreshed owner can clean up',async()=>{
 const f=fixture(),a=f.make();a.draft.save({attemptId:'A',index:1});await tick();
 const b=f.make();assert.equal((await b.draft.read()).index,1);b.draft.save({attemptId:'B',index:2});await tick();
 a.draft.save({attemptId:'A',index:3});await tick();assert.match(a.status.textContent,/another session/);assert.equal(f.record().state.attemptId,'B');
 await a.draft.clear();assert.equal(f.record().state.attemptId,'B');
 const refreshed=f.make();assert.equal((await refreshed.draft.read()).index,2);await refreshed.draft.clear();assert.equal(f.record(),null);
});
test('cleanup alone from older session preserves newer work',async()=>{
 const f=fixture(),a=f.make();a.draft.save({index:1});await tick();const b=f.make();await b.draft.read();b.draft.save({index:2});await tick();await a.draft.clear();assert.equal(f.record().state.index,2);
});
test('delayed transaction retries reject stale writes after another tab commits',async()=>{
 const f=fixture(),a=f.make(),b=f.make();await Promise.all([a.draft.read(),b.draft.read()]);let release;
 f.hold(new Promise(resolve=>{release=resolve;}));a.draft.save({index:1});await tick();b.draft.save({index:2});await tick();release();await tick();
 assert.equal(f.record().state.index,2);assert.match(a.status.textContent,/another session/);
});
test('delayed cleanup retries preserve a newly saved session',async()=>{
 const f=fixture(),a=f.make();a.draft.save({index:1});await tick();const b=f.make();await b.draft.read();let release;f.hold(new Promise(resolve=>{release=resolve;}));
 const clearing=a.draft.clear();await tick();b.draft.save({index:2});await tick();release();await clearing;assert.equal(f.record().state.index,2);
});
test('legacy drafts restore without extra fields and interrupted commits remain recoverable',async()=>{
 const f=fixture({userId:'student',kind:'quiz',chapterId:'c1',missionId:'m1',state:{index:1},updatedAt:{seconds:1}}),a=f.make();
 assert.equal((await a.draft.read()).index,1);f.loseAck();a.draft.save({index:2});await tick();assert.match(a.status.textContent,/could not be saved/);
 const b=f.make();assert.equal((await b.draft.read()).index,2);b.draft.save({index:3});await tick();
 a.status.retryButton.onclick();await tick();assert.equal(f.record().state.index,3);assert.match(a.status.textContent,/another session/);
 assert.deepEqual(Object.keys(f.record()).sort(),['chapterId','kind','missionId','state','updatedAt','userId']);
});
test('closed sessions cannot clear work after an already submitted write',async()=>{
 const f=fixture(),a=f.make();let release;f.hold(new Promise(resolve=>{release=resolve;}));a.draft.save({index:1});await tick();a.draft.close();release();await tick();
 // A transaction already enqueued for commit may finish; it cannot clear or
 // enqueue further writes, and any newer version is protected by retry checks.
 const before=f.record();await a.draft.clear();assert.deepEqual(f.record(),before);
});
test('changed-account sessions reject new saves and cleanup',async()=>{
 const f=fixture(),a=f.make();a.draft.save({index:1});await tick();const before=f.record();f.auth.currentUser={uid:'other'};
 a.draft.save({index:2});await tick();await a.draft.clear();assert.deepEqual(f.record(),before);
});
test('unavailable initial baseline cannot overwrite an existing draft on retry',async()=>{
 let writes=0;const c=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',getDocFromServer:async()=>{throw Error('Offline');},runTransaction:async()=>{writes++;}});
 vm.runInContext(source,c);const status={textContent:'',retryButton:{hidden:true}},draft=c.learningDraft('quiz','c1','m1',status);
 await assert.rejects(draft.read());draft.save({index:2});await tick();assert.equal(writes,0);assert.match(status.textContent,/Reopen this activity/);assert.equal(status.retryButton.hidden,true);draft.close();
});
