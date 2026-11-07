const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({Date,Set});vm.runInContext(fs.readFileSync('js/student-data-export.js','utf8').replace(/export /g,''),ctx);
const base=()=>({user:{uid:'student',email:'student@example.com'},assertCurrent(){},readProfile:async()=>({id:'student',data:{role:'student',status:'active'}}),readCosmetics:async()=>null,listPage:async()=>[]});
test('download includes only the fixed readable learning scope and reports excluded services',async()=>{const names=[];const result=await ctx.collectLearningData({...base(),listPage:async(name,uid)=>{names.push(name);assert.equal(uid,'student');return[];}});assert.equal(names.length,11);assert.ok(!names.includes('classes'));assert.ok(!names.includes('classJoinCodes'));assert.equal(result.account.uid,'student');assert.ok(result.excluded.includes('Passwords and sign-in tokens'));});
test('pagination keeps every owned record and rejects duplicates or foreign ownership',async()=>{const items=Array.from({length:100},(_,i)=>({id:'id'+i,data:{userId:'student'}}));const result=await ctx.collectLearningData({...base(),listPage:async(name,uid,cursor)=>name==='studentProgress'?(cursor?[{id:'last',data:{userId:uid}}]:items):[]});assert.equal(result.records.studentProgress.length,101);for(const rows of [[{id:'other',data:{userId:'foreign'}}],[items[0],items[0]]])await assert.rejects(ctx.collectLearningData({...base(),listPage:async()=>rows}),/ownership/);});
test('a failed read, oversized result or inactive profile cannot produce a partial successful export',async()=>{await assert.rejects(ctx.collectLearningData({...base(),listPage:async()=>{throw Error('Offline');}}),/Offline/);await assert.rejects(ctx.collectLearningData({...base(),maxRecords:1,listPage:async()=>[{id:'1',data:{userId:'student'}},{id:'2',data:{userId:'student'}}]}),/too many/);await assert.rejects(ctx.collectLearningData({...base(),readProfile:async()=>({id:'student',data:{role:'teacher',status:'active'}})}),/active student/);});
test('account changes during reading stop the download before collecting another user?s records',async()=>{let changed=false;await assert.rejects(ctx.collectLearningData({...base(),assertCurrent(){if(changed)throw Error('Session changed');},readCosmetics:async()=>{changed=true;return null;}}),/Session changed/);});

function controller(read) {
 const user={uid:'student',email:'student@example.com'},auth={currentUser:user},status={textContent:''},button={addEventListener(_,fn){this.click=fn;}};let downloads=0;
 const context=vm.createContext({auth,db:{},collectLearningData:ctx.collectLearningData,Date,Set,Promise,Blob,setTimeout,clearTimeout,
  onAuthStateChanged(_,fn){fn();},window:{addEventListener(){}},URL:{createObjectURL(){return 'blob:local';},revokeObjectURL(){}},
  document:{getElementById:id=>id==='downloadLearningData'?button:status,createElement:()=>({click(){downloads++;},remove(){}}),body:{append(){}}},
  doc:(_,name,uid)=>({name,uid}),getDocFromServer:read|| (async({name,uid})=>({id:uid,exists:()=>name==='users',data:()=>({role:'student',status:'active'})})),
  collection:(_,name)=>name,query:(name,...constraints)=>({name,constraints}),where:(...v)=>v,orderBy:(...v)=>v,documentId:()=> '__name__',startAfter:(...v)=>v,limit:n=>n,
  getDocsFromServer:async q=>{assert.deepEqual(Array.from(q.constraints[0]),['userId','==','student']);return{docs:[]};}
 });
 vm.runInContext(fs.readFileSync('js/student-data-download.js','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+[''];/g,''),context);
 return{button,status,auth,user,get downloads(){return downloads;}};
}
test('Settings download creates one file only after all reads succeed',async()=>{const ui=controller();await ui.button.click();assert.equal(ui.downloads,1);assert.match(ui.status.textContent,/file is ready/);assert.equal(ui.button.disabled,false);});
test('Settings read failures preserve retry and session changes cannot trigger a stale download',async()=>{
 const failed=controller(async()=>{throw Error('Offline');});await failed.button.click();assert.equal(failed.downloads,0);assert.match(failed.status.textContent,/unsuccessful/);assert.equal(failed.button.disabled,false);
 let finish;const changed=controller(()=>new Promise(resolve=>finish=resolve)),pending=changed.button.click();changed.auth.currentUser={uid:'other'};finish({id:'student',exists:()=>true,data:()=>({role:'student',status:'active'})});await pending;assert.equal(changed.downloads,0);
});
