// Auth emulator link semantics only; no SMTP, real email or production access.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const project='demo-lakbay-local',base='http://127.0.0.1:9099',api=base+'/identitytoolkit.googleapis.com/v1/',checks=[];
const email='auth-links-'+crypto.randomUUID()+'@example.com',password=crypto.randomBytes(18).toString('hex'),replacement=crypto.randomBytes(18).toString('hex');
let uid;
async function call(endpoint,body,owner=false){const r=await fetch(api+endpoint+'?key=local-emulator-key',{method:'POST',headers:{'Content-Type':'application/json',...(owner?{Authorization:'Bearer owner'}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});return{status:r.status,body:await r.json()};}
function check(ok,label){assert.ok(ok,label);checks.push(label);console.log('PASS: '+label);}
async function code(type){const r=await fetch(base+'/emulator/v1/projects/'+project+'/oobCodes',{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);const data=await r.json();const selected=data.oobCodes.filter(item=>item.email===email&&item.requestType===type).at(-1);assert.ok(selected,'fixture link is available');return selected.oobCode;}
const report={pass:false,mode:'loopback Auth emulator with one temporary identity; no email delivery or frontend redemption-page claim',checks};
(async()=>{
 const created=await call('accounts:signUp',{email,password,returnSecureToken:true});assert.equal(created.status,200);uid=created.body.localId;
 let token=created.body.idToken;
 const before=await call('accounts:lookup',{idToken:token});check(before.body.users[0].emailVerified===false,'new identity starts with unverified email');
 assert.equal((await call('accounts:sendOobCode',{requestType:'VERIFY_EMAIL',idToken:token})).status,200);
 const verify=await call('accounts:update',{oobCode:await code('VERIFY_EMAIL')});check(verify.status===200,'generated verification code can be applied');
 const signed=await call('accounts:signInWithPassword',{email,password,returnSecureToken:true});assert.equal(signed.status,200);token=signed.body.idToken;
 check((await call('accounts:lookup',{idToken:token})).body.users[0].emailVerified===true,'fresh account lookup reports verified email after redemption');
 assert.equal((await call('accounts:sendOobCode',{requestType:'PASSWORD_RESET',email})).status,200);
 const resetCode=await code('PASSWORD_RESET');
 check((await call('accounts:resetPassword',{oobCode:resetCode})).status===200,'reset code validates before password change');
 check((await call('accounts:resetPassword',{oobCode:resetCode,newPassword:replacement})).status===200,'reset code changes the account password');
 check((await call('accounts:signInWithPassword',{email,password,returnSecureToken:true})).status===400,'old password no longer signs in');
 check((await call('accounts:signInWithPassword',{email,password:replacement,returnSecureToken:true})).status===200,'replacement password signs in');
 check((await call('accounts:resetPassword',{oobCode:resetCode,newPassword:password})).status===400,'used reset code cannot change the password again');
 report.pass=true;
})().catch(e=>{report.error=e.stack;console.error(e.stack);process.exitCode=1;}).finally(async()=>{
 if(uid){try{const removed=await call('accounts:delete',{localId:uid},true);assert.equal(removed.status,200);report.cleanup='temporary identity deleted';}catch(e){report.pass=false;report.cleanupError=e.message;process.exitCode=1;}}
 report.verifiedAt=new Date().toISOString();fs.writeFileSync(path.join(__dirname,'../docs/validation/auth-links-emulator-2026-11-07.json'),JSON.stringify(report,null,2));
});
