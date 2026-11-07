// Local-only security check. Does not change user-created classes.
const assert=require('node:assert/strict');
const base='http://127.0.0.1:8180/v1/projects/demo-lakbay-local/databases/(default)/documents';
const authBase='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/';
const encode=object=>({fields:Object.fromEntries(Object.entries(object).map(([k,v])=>[k,{stringValue:v}]))});
async function call(url,method,body,token='owner'){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json().catch(()=>({}))};}
(async()=>{
 const login=await call(authBase+'accounts:signInWithPassword?key=local-emulator-key','POST',{email:'student@lakbay.local',password:'LakbayLocal123!',returnSecureToken:true});assert.equal(login.status,200);const token=login.data.idToken,uid=login.data.localId;
 const classId='classmates-security-'+Date.now(),member=uid+'_'+classId;
 const classroom=base+'/classes/'+classId,directory=classroom+'/classmates/'+uid;
 try{
  assert.equal((await call(classroom,'PATCH',encode({teacherId:'fixture-teacher',status:'active',name:'Security fixture'}))).status,200);
  assert.equal((await call(directory,'PATCH',encode({displayName:'Explorer'}),token)).status,403,'nonmember cannot publish a name');
  assert.equal((await call(base+'/classMembers/'+member,'PATCH',encode({classId,userId:uid,status:'active'}))).status,200);
  assert.equal((await call(directory,'PATCH',encode({displayName:'Explorer'}),token)).status,200,'member can share a name');
  assert.equal((await call(directory,'PATCH',encode({displayName:'Explorer',email:'private@example.com'}),token)).status,403,'private extra fields are rejected');
  assert.equal((await call(classroom+'/classmates/someone-else','PATCH',encode({displayName:'Impersonation'}),token)).status,403,'cannot edit another student');
  assert.equal((await call(classroom+'/classmates','GET',null,token)).status,200,'members can list names');
  assert.equal((await call(base+'/classMembers/'+member,'DELETE',null,token)).status,403,'leaving must also remove directory entry');
  assert.equal((await call(directory,'DELETE',null,token)).status,200);
  assert.equal((await call(base+'/classMembers/'+member,'DELETE',null,token)).status,200);
  assert.equal((await call(classroom+'/classmates','GET',null,token)).status,403,'former members cannot list names');
  console.log('PASS: 8 classmates access and lifecycle checks (local emulator only).');
 }finally{await call(directory,'DELETE');await call(base+'/classMembers/'+member,'DELETE');await call(classroom,'DELETE');}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
