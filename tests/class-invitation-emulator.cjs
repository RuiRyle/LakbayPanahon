const fs=require('fs'),assert=require('node:assert/strict');
const project='demo-lakbay-local',root=`projects/${project}/databases/(default)/documents`,base='http://127.0.0.1:8180/v1/'+root;
const fields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,{stringValue:v}]));
async function call(url,method,body,token='owner'){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json().catch(()=>({}))};}
async function login(email){const r=await call('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local','POST',{email,password:'LakbayLocal123!',returnSecureToken:true});assert.equal(r.status,200);return r.data;}
(async()=>{assert.equal((await call('http://127.0.0.1:8180/emulator/v1/projects/'+project+':securityRules','PUT',{rules:{files:[{name:'firestore.rules',content:fs.readFileSync('firestore.rules','utf8')}]}})).status,200);
 const teacher=await login('teacher@lakbay.local'),student=await login('student@lakbay.local'),id='invite-check-'+Date.now(),a=id+'a',b=id+'b',code=require('crypto').randomBytes(6).toString('hex').toUpperCase();const paths=['classes/'+a,'classes/'+b,'classJoinCodes/'+code,'classMembers/'+student.localId+'_'+a,'classMembers/'+student.localId+'_'+b];
 const commit=(writes,token)=>call(base+':commit','POST',{writes},token);
 try{
 for(const c of [a,b])assert.equal((await call(base+'/classes/'+c,'PATCH',{fields:{...fields({name:c,description:'',teacherId:teacher.localId,teacherName:'Local Teacher',status:'active',currentJoinCode:''}),createdAt:{timestampValue:new Date().toISOString()},updatedAt:{timestampValue:new Date().toISOString()}}})).status,200);
 const inviteWrite={update:{name:root+'/classJoinCodes/'+code,fields:{...fields({classId:a,teacherId:teacher.localId,className:a,teacherName:'Local Teacher',status:'active'}),expiresAt:{timestampValue:new Date(Date.now()+86400000).toISOString()}}},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]};
 const link=c=>({update:{name:root+'/classes/'+c,fields:fields({currentJoinCode:code})},updateMask:{fieldPaths:['currentJoinCode']},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]});
 assert.equal((await commit([inviteWrite,link(a)],teacher.idToken)).status,200,'teacher reserves unique code for class A');
 assert.equal((await commit([link(b)],teacher.idToken)).status,403,'class B cannot adopt class A code');
 const member=c=>({update:{name:root+'/classMembers/'+student.localId+'_'+c,fields:fields({userId:student.localId,classId:c,joinCode:code,status:'active'})},updateTransforms:[{fieldPath:'joinedAt',setToServerValue:'REQUEST_TIME'}]});
 assert.equal((await commit([member(b)],student.idToken)).status,403,'code cannot enroll into class B');
 assert.equal((await commit([member(a)],student.idToken)).status,200,'code enrolls into class A only');
 console.log('PASS: unique classroom reservation, cross-class pointer rejection, wrong-class enrollment rejection, correct enrollment.');
 }finally{for(const p of paths)await call(base+'/'+p,'DELETE');}
})().catch(e=>{console.error(e);process.exitCode=1;});
