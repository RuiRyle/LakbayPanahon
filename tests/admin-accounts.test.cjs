const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(require.resolve('../js/admin-accounts.js'),'utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export /g,''),context);
test('teacher activation requires verification and a useful reason',()=>{
 const teacher={role:'teacher',status:'pending'};
 assert.throws(()=>context.moderationDetails(teacher,'active','Verified identity',false));
 assert.throws(()=>context.moderationDetails(teacher,'active','x',true));
 assert.equal(context.moderationDetails(teacher,'active',' Verified identity ',true).reason,'Verified identity');
});
test('administrator and role changes are excluded from the account tool',()=>{
 assert.throws(()=>context.moderationDetails({role:'admin',status:'active'},'inactive','A reason',true));
 assert.throws(()=>context.moderationDetails({role:'student',status:'active'},'active','A reason',true));
 assert.throws(()=>context.moderationDetails({role:'student',status:'active'},'pending','A reason',true));
});
test('student access can be deactivated without teacher verification',()=>{
 assert.equal(context.moderationDetails({role:'student',status:'active'},'inactive','Requested account restriction',false).status,'inactive');
 assert.throws(()=>context.moderationDetails({role:'student',status:'active'},'inactive','x'.repeat(501),false));
});
