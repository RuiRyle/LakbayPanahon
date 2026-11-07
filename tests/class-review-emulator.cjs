// Local rules tests with temporary fixtures; all records are cleaned up.
const assert=require('node:assert/strict');
const base='http://127.0.0.1:8180/v1/projects/demo-lakbay-local/databases/(default)/documents';
const fields=object=>Object.fromEntries(Object.entries(object).map(([k,v])=>[k,v===null?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:Array.isArray(v)?{arrayValue:{values:v.map(item=>({stringValue:item}))}}:typeof v==='number'?{integerValue:String(v)}:v instanceof Date?{timestampValue:v.toISOString()}:{stringValue:v}]));
async function call(url,method,body,token='owner'){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json().catch(()=>({}))};}
async function login(email){const r=await call('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-emulator-key','POST',{email,password:'LakbayLocal123!',returnSecureToken:true});assert.equal(r.status,200);return {uid:r.data.localId,token:r.data.idToken};}
(async()=>{
 const student=await login('student@lakbay.local'),teacher=await login('teacher@lakbay.local'),id='review-rules-'+Date.now();
 const paths=['classes/'+id,'classMembers/'+student.uid+'_'+id,'chapters/'+id,'missions/'+id,'classReviewAssignments/'+id,'classReviewAssignments/'+id+'-other','storyScenes/'+id,'studentQuizAttempts/'+id+'-attempt','classReviewReflections/'+id];
 const value={classId:id,userId:student.uid,assignmentType:'targeted-review',title:'Review a clue',instructions:'Revisit the evidence and try a new quiz.',missionId:id,chapterId:id,status:'published',reviewTopic:'evidence',reviewSceneId:id,reflectionQuestion:'Explain the clue.'};
 const save=(data,token,transforms=['publishedAt','updatedAt','assignedAt'])=>call(base+':commit','POST',{writes:[{update:{name:'projects/demo-lakbay-local/databases/(default)/documents/'+paths[4],fields:fields(data)},updateTransforms:transforms.map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}]},token);
 try{
  for(const [index,data] of [[0,{teacherId:teacher.uid,name:'Review fixture',status:'active'}],[1,{classId:id,userId:student.uid,status:'active'}],[2,{status:'active'}],[3,{chapterId:id,status:'active'}]])assert.equal((await call(base+'/'+paths[index],'PATCH',{fields:fields(data)})).status,200);
  await call(base+'/'+paths[6],'PATCH',{fields:fields({missionId:id,status:'active',reviewTopics:['evidence']})});
  assert.equal((await save({...value,reviewTopic:'invented'},teacher.token)).status,403,'unmapped topic rejected');
  assert.equal((await save(value,student.token)).status,403,'students cannot assign themselves a review');
  assert.equal((await save(value,teacher.token)).status,200,'owning teacher publishes review');
  const original=await call(base+'/'+paths[4],'GET',null,student.token);assert.equal(original.status,200);
  assert.equal((await save({...value,userId:'not-a-member'},teacher.token)).status,403,'review requires active target membership');
  assert.equal((await save({...value,privateNote:'secret'},teacher.token)).status,403,'unrecognized private fields rejected');
  assert.equal((await save(value,teacher.token)).status,403,'editing cannot reset assignedAt');
  const anchor=new Date(original.data.fields.assignedAt.timestampValue);
  assert.equal((await save({...value,instructions:'Updated guidance',assignedAt:anchor},teacher.token,['publishedAt','updatedAt'])).status,200,'editing preserves fresh-work anchor');
  await call(base+'/'+paths[5],'PATCH',{fields:fields({...value,userId:'someone-else',assignedAt:anchor})});
  assert.equal((await call(base+'/'+paths[5],'GET',null,student.token)).status,403,'another student review is private');
  const result=await call(base+':runQuery','POST',{structuredQuery:{from:[{collectionId:'classReviewAssignments'}],where:{compositeFilter:{op:'AND',filters:[['classId',id],['userId',student.uid],['status','published']].map(([field,value])=>({fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:{stringValue:value}}}))}}}},student.token);assert.equal(result.status,200,'scoped student query is permitted');
  assert.equal((await call(base+'/'+paths[4],'DELETE',null,student.token)).status,403,'student cannot remove assigned work');
  const reflection={classId:id,userId:student.uid,reviewId:id,question:'Explain the clue.',body:'The map clue shows connections.',attemptId:id+'-attempt',revision:1,response:'',respondedAt:null};
  const saveReflection=(data,token,teacherReply=false)=>call(base+':commit','POST',{writes:[{update:{name:'projects/demo-lakbay-local/databases/(default)/documents/'+paths[8],fields:fields(data)},...(teacherReply?{updateMask:{fieldPaths:Object.keys(data)}}:{}),updateTransforms:[{fieldPath:teacherReply?'respondedAt':'submittedAt',setToServerValue:'REQUEST_TIME'}]}]},token);
  await call(base+'/'+paths[7],'PATCH',{fields:fields({userId:student.uid,missionId:id,chapterId:id,passed:true,completedAt:new Date(anchor.getTime()-1000)})});
  assert.equal((await saveReflection(reflection,student.token)).status,403,'old passing attempt cannot unlock explanation');
  await call(base+'/'+paths[7],'PATCH',{fields:fields({userId:student.uid,missionId:id,chapterId:id,passed:true,completedAt:new Date(anchor.getTime()+1000)})});
  assert.equal((await saveReflection({...reflection,question:'Forged question'},student.token)).status,403,'question must match assignment');
  assert.equal((await saveReflection(reflection,student.token)).status,200,'student shares explanation after fresh passing result');
  assert.equal((await saveReflection({response:'Forged reply'},student.token,true)).status,403,'student cannot write teacher guidance');
  assert.equal((await saveReflection({response:'Connect the clue to your idea.'},teacher.token,true)).status,200,'teacher gives private explanation guidance');
  assert.equal((await call(base+'/'+paths[8],'GET',null,student.token)).status,200,'student reads teacher guidance');
  assert.equal((await save({...value,reflectionQuestion:'Changed question',assignedAt:anchor},teacher.token,['publishedAt','updatedAt'])).status,403,'published reflection prompt cannot silently change');
  assert.equal((await saveReflection({...reflection,body:'My revised explanation',revision:2},student.token)).status,200,'student may revise an explanation after receiving guidance');
  assert.equal((await call(base+'/'+paths[8],'GET',null,teacher.token)).data.fields.response.stringValue,'','revised explanation requires fresh teacher guidance');
  console.log('PASS: topic-review, explanation, revision and private guidance permission checks.');
 }finally{for(const relative of paths.reverse())await call(base+'/'+relative,'DELETE');}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
