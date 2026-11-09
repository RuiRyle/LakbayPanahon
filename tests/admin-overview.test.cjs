const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(role='admin'){
 const user={uid:'admin1'},auth={currentUser:user},queries=[];let change=false;
 const scope=vm.createContext({auth,db:{},doc:(_,name,id)=>({name,id}),collection:(_,name)=>({name}),where:(...args)=>({where:args}),orderBy:key=>({order:key}),documentId:()=> '__name__',limit:n=>({limit:n}),query:(ref,...filters)=>({...ref,filters}),getDocFromServer:async()=>({exists:()=>true,data:()=>({role,status:'active'})}),getDocsFromServer:async q=>{queries.push(q);if(change)auth.currentUser={uid:'other'};const count=q.name==='teacherApplications'?26:11;return{size:count,docs:Array.from({length:count},(_,i)=>({id:String(i),data:()=>({status:'submitted',actorId:'admin1'})}))};}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/admin-accounts.js'),'utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,''),scope);
 return{load:()=>scope.loadAdminOverview(),queries,change:()=>change=true};
}
test('overview uses two bounded queries and sentinel-based partial labels',async()=>{const f=fixture(),r=await f.load();assert.equal(f.queries.length,2);assert.deepEqual(f.queries.map(q=>q.filters.find(x=>x.limit).limit),[26,11]);assert.equal(r.applications.length,25);assert.equal(r.decisions.length,10);assert.equal(r.moreApplications,true);assert.equal(r.moreDecisions,true);assert.deepEqual(Array.from(f.queries[1].filters[0].where),['actorId','==','admin1']);assert.deepEqual(Array.from(f.queries[0].filters[0].where),['status','==','submitted']);});
test('nonadmin is denied before overview queries',async()=>{const f=fixture('teacher');await assert.rejects(f.load(),/active administrator/);assert.equal(f.queries.length,0);});
test('changed session cannot return another account overview',async()=>{const f=fixture();f.change();await assert.rejects(f.load(),/session changed/);});
