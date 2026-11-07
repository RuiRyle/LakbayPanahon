// Isolated local fixture: never touches production or user-created classes.
const assert=require('node:assert/strict'),fs=require('node:fs');
const project='demo-lakbay-local',base='http://127.0.0.1:8180/v1/projects/'+project+'/databases/(default)/documents';
const encode=object=>Object.fromEntries(Object.entries(object).map(([k,v])=>[k,v===null?{nullValue:null}:typeof v==='number'?{integerValue:String(v)}:{stringValue:v}]));
async function call(url,method,body,token='owner'){const response=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json().catch(()=>({}))};}
async function login(email){const result=await call('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-emulator-key','POST',{email,password:'LakbayLocal123!',returnSecureToken:true});assert.equal(result.status,200);return {token:result.data.idToken,uid:result.data.localId};}
(async()=>{
 const rules=await call('http://127.0.0.1:8180/emulator/v1/projects/'+project+':securityRules','PUT',{rules:{files:[{name:'firestore.rules',content:fs.readFileSync('firestore.rules','utf8')}]}});assert.equal(rules.status,200);
 const student=await login('student@lakbay.local'),teacher=await login('teacher@lakbay.local');
 const id='help-security-'+Date.now(),assignment=id+'-assignment',help=id+'_'+student.uid+'_'+assignment;
 const paths=['classes/'+id,'classMembers/'+student.uid+'_'+id,'classAssignments/'+assignment,'classHelpRequests/'+help];
 const request={classId:id,userId:student.uid,assignmentId:assignment,chapterId:'fixture-chapter',missionId:'fixture-mission',reason:'lesson',message:'Please explain the clue.',status:'open',response:'',answeredAt:null,understanding:'',understandingAt:null,revision:1};
 const write=async(values,token,creating=false)=>call(base+':commit','POST',{writes:[{update:{name:'projects/'+project+'/databases/(default)/documents/classHelpRequests/'+help,fields:encode(values)},...(creating?{}:{updateMask:{fieldPaths:Object.keys(values)}}),updateTransforms:(creating?['createdAt','updatedAt']:values.status==='answered'?['answeredAt','updatedAt']:['updatedAt']).map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}]},token);
 try{
  for(const [index,data] of [[0,{teacherId:teacher.uid,name:'Help security fixture',status:'active'}],[1,{userId:student.uid,classId:id,status:'active'}],[2,{classId:id,missionId:'fixture-mission',chapterId:'fixture-chapter',status:'published'}]])assert.equal((await call(base+'/'+paths[index],'PATCH',{fields:encode(data)})).status,200);
  assert.equal((await write({...request,missionId:'wrong'},student.token,true)).status,403,'mission must match assignment');
  assert.equal((await write(request,student.token,true)).status,200,'student opens request');
  assert.equal((await write({...request,message:'Duplicate'},student.token)).status,403,'open request cannot be overwritten');
  assert.equal((await write({status:'answered',response:'Self reply'},student.token)).status,403,'student cannot impersonate teacher');
  assert.equal((await call(base+'/'+paths[3],'GET',null,teacher.token)).status,200,'owner teacher can read request');
  assert.equal((await write({status:'answered',response:'Revisit the map clue.'},teacher.token)).status,200,'teacher can answer');
  const answer=await call(base+'/'+paths[3],'GET',null,student.token);assert.equal(answer.status,200);assert.equal(answer.data.fields.response.stringValue,'Revisit the map clue.');
  const respond=(data,token)=>call(base+':commit','POST',{writes:[{update:{name:'projects/'+project+'/databases/(default)/documents/classHelpRequests/'+help,fields:encode(data)},updateMask:{fieldPaths:Object.keys(data)},updateTransforms:[{fieldPath:'understandingAt',setToServerValue:'REQUEST_TIME'}]}]},token);
  assert.equal((await respond({understanding:'needs-help'},student.token)).status,200,'student can flag unresolved confusion');
  assert.equal((await respond({understanding:'invented'},student.token)).status,403,'unrecognized understanding state rejected');
  assert.equal((await respond({understanding:'understood',response:'student forged reply'},student.token)).status,403,'understanding response cannot alter teacher guidance');
  assert.equal((await write({status:'answered',response:'Try reading the second map clue.',understanding:'',understandingAt:null},teacher.token)).status,200,'teacher can reply again to unresolved confusion and reset response');
  assert.equal((await respond({understanding:'understood'},student.token)).status,200,'student can acknowledge understanding');
  assert.equal((await respond({understanding:'needs-help'},teacher.token)).status,403,'teacher cannot pretend to be student');
  assert.equal((await write({...request,revision:2,message:'A follow-up question'},student.token)).status,200,'student can reopen after reply');
  await call(base+'/'+paths[1],'DELETE');
  assert.equal((await call(base+'/'+paths[3],'GET',null,student.token)).status,403,'former member loses access');
  assert.equal((await write({status:'answered',response:'Reply'},teacher.token)).status,403,'teacher cannot reply after departure');
  console.log('PASS: 16 private help request lifecycle and understanding permission checks.');
 }finally{for(const relative of paths.reverse())await call(base+'/'+relative,'DELETE');}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
