const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(role='admin'){
 const user={uid:'admin1'},auth={currentUser:user},queries=[],reads=[];let change=false;
 const scope=vm.createContext({auth,db:{},doc:(_,name,id)=>({name,id}),collection:(_,name)=>({name}),where:(...args)=>({where:args}),orderBy:key=>({order:key}),documentId:()=> '__name__',limit:n=>({limit:n}),query:(ref,...filters)=>({...ref,filters}),getDocFromServer:async ref=>{reads.push(ref);return ref.name==='users'?{exists:()=>true,data:()=>({role,status:'active'})}:{id:ref.id,exists:()=>false};},getDocsFromServer:async q=>{queries.push(q);if(change)auth.currentUser={uid:'other'};const count=q.name==='accountModeration'?11:26;return{size:count,docs:Array.from({length:count},(_,i)=>({id:String(i),data:()=>({status:'submitted',actorId:'admin1'})}))};}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/admin-accounts.js'),'utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,''),scope);
 return{applications:group=>scope.loadSubmittedTeacherApplications(null,group),load:()=>scope.loadAdminOverview(),queries,reads,change:()=>change=true};
}
test('overview combines bounded pending-teacher and submitted-form queries',async()=>{const f=fixture(),r=await f.load();assert.equal(f.queries.length,3);assert.deepEqual(f.queries.map(q=>q.filters.find(x=>x.limit).limit),[26,11,26]);assert.equal(r.applications.length,25);assert.equal(r.decisions.length,10);assert.equal(r.moreApplications,true);assert.equal(r.moreDecisions,true);assert.deepEqual(Array.from(f.queries[1].filters[0].where),['actorId','==','admin1']);assert.deepEqual(Array.from(f.queries[0].filters[0].where),['status','==','submitted']);assert.equal(r.teacherQueue.length,25);assert.equal(r.moreTeacherQueue,true);assert.deepEqual(Array.from(f.queries[2].filters[0].where),['role','==','teacher']);assert.deepEqual(Array.from(f.queries[2].filters[1].where),['status','==','pending']);});
test('nonadmin is denied before overview queries',async()=>{const f=fixture('teacher');await assert.rejects(f.load(),/active administrator/);assert.equal(f.queries.length,0);});
test('changed session cannot return another account overview',async()=>{const f=fixture();f.change();await assert.rejects(f.load(),/session changed/);});

test('pending teachers without forms and approved teachers appear with verified stages',async()=>{
 const profiles=[{id:'missing',firstName:'No Form'},{id:'approved',firstName:'Approved',teacherVerifiedRevision:2},{id:'submitted',firstName:'Submitted'}];
 const user={uid:'admin'},auth={currentUser:user};const app={approved:{status:'approved',revision:2},submitted:{status:'submitted',revision:1}};
 const scope=vm.createContext({auth,db:{},Map,Set,doc:(_,name,id)=>({name,id}),collection:(_,name)=>({name}),where:()=>null,orderBy:()=>null,documentId:()=>'',limit:()=>null,query:ref=>ref,
 getDocFromServer:async ref=>ref.name==='users'?{exists:()=>true,data:()=>({role:'admin',status:'active'})}:{id:ref.id,exists:()=>!!app[ref.id],data:()=>app[ref.id]},
 getDocsFromServer:async q=>{const rows=q.name==='users'?profiles:q.name==='teacherApplications'?[{id:'submitted',...app.submitted}]:[];return{size:rows.length,docs:rows.map(r=>({id:r.id,data:()=>r}))};}});
 vm.runInContext(fs.readFileSync('js/admin-accounts.js','utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,''),scope);
 const r=await scope.loadAdminOverview();assert.equal(r.teacherQueue.length,3);
 assert.equal(r.teacherQueue.find(r=>r.id==='missing').stage,'Application not submitted');
 assert.equal(r.teacherQueue.find(r=>r.id==='approved').stage,'Approved — awaiting activation');
 assert.equal(r.teacherQueue.filter(r=>r.id==='submitted').length,1);
 assert.equal(r.teacherQueue.find(r=>r.id==='submitted').reviewApplication,true);
});

test('application tabs query their actual statuses with bounded pagination',async()=>{for(const [group,op,value] of [['pending','==','submitted'],['review','==','submitted'],['revision','==','needs_changes'],['reviewed','in',['approved','declined']]]){const f=fixture();const result=await f.applications(group);assert.equal(result.rows.length,25);assert.equal(result.hasNext,true);const clause=f.queries[0].filters[0].where;assert.equal(clause[0],'status');assert.equal(clause[1],op);assert.deepEqual(JSON.parse(JSON.stringify(clause[2])),value);}});
test('application tabs reject unsupported filters and unauthorized readers',async()=>{const invalid=fixture();await assert.rejects(invalid.applications('all'),/valid application status/);assert.equal(invalid.queries.length,0);const denied=fixture('student');await assert.rejects(denied.applications('reviewed'),/active administrator/);assert.equal(denied.queries.length,0);});

test('pending queue includes missing forms, preserves stages and paginates the union without duplicates',async()=>{
 const records=new Map();records.set('users/admin',{role:'admin',status:'active'});
 for(let i=0;i<30;i++){const id='t'+String(i).padStart(2,'0');records.set('users/'+id,{role:'teacher',status:'pending',firstName:'Teacher '+i,email:id+'@example.com'});}
 records.set('teacherApplications/t00',{status:'submitted',legalName:'Submitted teacher'});
 records.set('teacherApplications/t01',{status:'approved',revision:2});records.get('users/t01').teacherVerifiedRevision=2;
 records.set('teacherApplications/t02',{status:'needs_changes'});
 records.set('teacherApplications/t03',{status:'declined'});
 records.set('users/a00',{role:'teacher',status:'active',email:'active@example.com'});records.set('teacherApplications/a00',{status:'submitted',legalName:'Active applicant'});
 const user={uid:'admin'},auth={currentUser:user};let fail=false;
 const snap=(id,data)=>({id,exists:()=>!!data,data:()=>data});
 const scope=vm.createContext({auth,db:{},doc:(_,name,id)=>({name,id}),collection:(_,name)=>({name}),where:(...args)=>({where:args}),orderBy:()=>({}),documentId:()=>'',startAfter:id=>({after:id}),limit:n=>({limit:n}),query:(ref,...filters)=>({...ref,filters}),
 getDocFromServer:async ref=>{if(fail&&ref.name==='teacherApplications')throw Error('Read unavailable');return snap(ref.id,records.get(ref.name+'/'+ref.id));},
 getDocsFromServer:async q=>{const rows=[...records].filter(([key,value])=>key.startsWith(q.name+'/')&&q.filters.every(f=>!f.where||(f.where[1]==='in'?f.where[2].includes(value[f.where[0]]):value[f.where[0]]===f.where[2]))).map(([key,data])=>snap(key.split('/')[1],data)).sort((a,b)=>a.id.localeCompare(b.id)).filter(d=>!q.filters.find(f=>f.after)||d.id>q.filters.find(f=>f.after).after).slice(0,q.filters.find(f=>f.limit).limit);return{size:rows.length,docs:rows};}});
 vm.runInContext(fs.readFileSync('js/admin-accounts.js','utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,''),scope);
 const first=await scope.loadSubmittedTeacherApplications();assert.equal(first.rows.length,25);assert.equal(first.hasNext,true);assert.equal(first.rows.find(r=>r.id==='t00').applicationStage,'Qualifications awaiting review');assert.equal(first.rows.find(r=>r.id==='t01').applicationStage,'Approved qualifications - awaiting activation');assert.equal(first.rows.find(r=>r.id==='t02').applicationStage,'Changes requested');assert.equal(first.rows.find(r=>r.id==='t03').applicationStage,'Application declined');assert.equal(first.rows.find(r=>r.id==='t04').applicationStage,'Application not submitted');assert.equal(first.rows[0].email,'active@example.com');
 const second=await scope.loadSubmittedTeacherApplications(first.cursor);assert.equal(second.hasNext,false);assert.equal(second.rows.length,6);assert.equal(new Set([...first.rows,...second.rows].map(r=>r.id)).size,31);
 const awaiting=await scope.loadSubmittedTeacherApplications(null,'awaiting');assert.equal(awaiting.rows.length,21);assert.equal(awaiting.sourcePageCount,25);assert.equal(awaiting.hasNext,true);assert.ok(awaiting.rows.every(row=>!['t00','t01','t02','t03'].includes(row.id)));const later=await scope.loadSubmittedTeacherApplications(awaiting.cursor,'awaiting');assert.equal(later.rows.length,5);assert.equal(later.hasNext,false);
 const review=await scope.loadSubmittedTeacherApplications(null,'review');assert.deepEqual(Array.from(review.rows,row=>row.id),['a00','t00']);
 for(let i=4;i<25;i++)records.set('teacherApplications/t'+String(i).padStart(2,'0'),{status:'submitted'});const emptyPage=await scope.loadSubmittedTeacherApplications(null,'awaiting');assert.equal(emptyPage.rows.length,0);assert.equal(emptyPage.hasNext,true);assert.equal((await scope.loadSubmittedTeacherApplications(emptyPage.cursor,'awaiting')).rows.length,5);
 fail=true;await assert.rejects(scope.loadSubmittedTeacherApplications(),/Read unavailable/);await assert.rejects(scope.loadSubmittedTeacherApplications(null,'awaiting'),/Read unavailable/);
});
