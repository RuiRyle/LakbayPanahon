const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/admin-workspace.js'),'utf8');
const handlerSource=source.slice(source.indexOf('let moderationConfirmationPending=false;'),source.indexOf('function clear(){'));
function fixture(){
 let handler,resolve,confirmations=0,writes=0;
 const selected={id:'student1',role:'student',status:'active'};
 const controls={moderationForm:{addEventListener:(_,fn)=>handler=fn},newAccountStatus:{value:'inactive'},moderationReason:{value:'Reviewed request'},teacherIdentityVerified:{checked:false}};
 const context={busy:false,selected,pendingAccountDecision:null,savedAccountUid:null,epoch:1,$:id=>controls[id],appConfirm:()=>{confirmations++;return new Promise(r=>resolve=r);},task:fn=>fn(),moderateAccount:async()=>{writes++;},refreshSavedAccount:async()=>{}};
 vm.createContext(context);vm.runInContext(handlerSource,context);
 return {context,submit:()=>handler({preventDefault(){}}),answer:value=>resolve(value),counts:()=>({confirmations,writes})};
}
test('only one confirmation and write while duplicate submissions are pending',async()=>{const f=fixture();const first=f.submit();await f.submit();assert.deepEqual(f.counts(),{confirmations:1,writes:0});f.answer(true);await first;assert.equal(f.counts().writes,1);});
test('cancel releases the guard for a later submission',async()=>{const f=fixture();let pending=f.submit();f.answer(false);await pending;assert.equal(f.counts().writes,0);pending=f.submit();f.answer(true);await pending;assert.deepEqual(f.counts(),{confirmations:2,writes:1});});
test('session or selected account changes invalidate an open confirmation',async()=>{for(const change of [f=>f.context.epoch++,f=>f.context.selected={id:'student2'}]){const f=fixture();const pending=f.submit();change(f);f.answer(true);await pending;assert.equal(f.counts().writes,0);}});
