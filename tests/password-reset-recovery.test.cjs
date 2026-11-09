const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const nodes=new Map();let handler,release,calls=0,fail=false;
 const button={disabled:false,textContent:'Send Reset Link',innerHTML:'Send Reset Link'};
 const form={querySelector:()=>button,addEventListener:(name,fn)=>{if(name==='submit')handler=fn;}};
 nodes.set('forgotPasswordForm',form);nodes.set('resetEmail',{value:' teacher@example.com '});
 nodes.set('resetPasswordMessage',{textContent:'',classList:{add(){},remove(){}}});
 const context=vm.createContext({auth:{},console:{log(){},error(){}},window:{},document:{getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')fn();}},sendPasswordResetEmail:async(_,email)=>{calls++;assert.equal(email,'teacher@example.com');await new Promise(r=>release=r);if(fail)throw Object.assign(Error('offline'),{code:'auth/network-request-failed'});}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/auth-ui.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,''),context);
 return{nodes,button,submit:()=>handler({preventDefault(){}}),release:()=>release(),calls:()=>calls,setFail:value=>fail=value};
}
test('empty reset email makes no request',async()=>{const f=fixture();f.nodes.get('resetEmail').value=' ';await f.submit();assert.equal(f.calls(),0);assert.match(f.nodes.get('resetPasswordMessage').textContent,/enter your email/);});
test('pending reset blocks duplicate delivery and restores the action after success',async()=>{const f=fixture(),pending=f.submit();assert.equal(f.calls(),1);assert.equal(f.button.disabled,true);await f.submit();assert.equal(f.calls(),1);f.release();await pending;assert.equal(f.button.disabled,false);assert.match(f.nodes.get('resetPasswordMessage').textContent,/check your email/);});
test('failed reset restores a manual retry without an automatic request',async()=>{const f=fixture();f.setFail(true);let pending=f.submit();f.release();await pending;assert.equal(f.calls(),1);assert.equal(f.button.disabled,false);assert.match(f.nodes.get('resetPasswordMessage').textContent,/Unable to connect/);f.setFail(false);pending=f.submit();assert.equal(f.calls(),2);f.release();await pending;assert.equal(f.button.disabled,false);});
