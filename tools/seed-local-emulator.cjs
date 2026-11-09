const project='demo-lakbay-local',authBase='http://127.0.0.1:9099',firestoreBase='http://127.0.0.1:8180';
async function call(url,body){
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer owner'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const result=await response.json();if(!response.ok)throw Error('Local emulator request failed: '+response.status+' '+JSON.stringify(result).slice(0,250));return result;
}
function encode(value){
 if(value===null)return {nullValue:null};if(Array.isArray(value))return {arrayValue:{values:value.map(encode)}};
 if(typeof value==='boolean')return {booleanValue:value};if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
 if(typeof value==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([key,v])=>[key,encode(v)]))}};
 return {stringValue:String(value)};
}
async function seedLocalEmulator({secured=false}={}){
 // Fixed demo project and literal loopback endpoints deliberately cannot target production.
 const signup=async(email,name)=>{
  const result=await call(authBase+'/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-emulator-key',{email,password:'LakbayLocal123!',displayName:name,returnSecureToken:true});
  await call(authBase+'/identitytoolkit.googleapis.com/v1/accounts:update?key=local-emulator-key',{localId:result.localId,emailVerified:true});return result.localId;
 };
 const teacher=await signup('teacher@lakbay.local','Local Teacher'),student=await signup('student@lakbay.local','Local Student'),admin=await signup('admin@lakbay.local','Local Administrator');
 const records=[];
 const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
 for(const [collection,items] of Object.entries(catalog))for(const item of items){const {id,path,...fields}=item;if(id)records.push([collection+'/'+id,fields]);}
 const avatars=require('../data/avatar-catalog.json');for(const item of Array.isArray(avatars)?avatars:[]){const {id,...fields}=item;if(id)records.push(['avatars/'+id,fields]);}
 records.push(['users/'+teacher,{role:'teacher',status:'active',firstName:'Local',lastName:'Teacher',email:'teacher@lakbay.local',teacherVerifiedRevision:1,teacherAccessType:'facilitator'}],['teacherApplications/'+teacher,{userId:teacher,email:'teacher@lakbay.local',emailVerified:true,status:'approved',revision:1,applicantType:'facilitator'}],['users/'+student,{role:'student',status:'active',firstName:'Local',lastName:'Student',email:'student@lakbay.local',xp:0,level:1,learningStreak:0}],['learningSettings/progression',{xpPerLevel:100,version:1}],['learningSettings/bayaniAI',{enabled:false}]);
 const prefix=`projects/${project}/databases/(default)/documents/`;
 records.push(['users/'+admin,{role:'admin',status:'active',firstName:'Local',lastName:'Administrator',email:'admin@lakbay.local'}]);
 if(secured)records.push(['learningSettings/securedAssessment',{enabled:true,protocolVersion:1,attemptTtlSeconds:7200,perMinuteAttempts:3,perStudentDailyAttempts:60}]);
 for(let offset=0;offset<records.length;offset+=200)await call(firestoreBase+'/v1/projects/'+project+'/databases/(default)/documents:commit',{writes:records.slice(offset,offset+200).map(([name,fields])=>({update:{name:prefix+name,fields:Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,encode(value)]))}}))});
 console.log('Seeded '+records.length+' local catalog/profile records. No online database was contacted.');
 return {teacher,student,admin,records:records.length};
}
module.exports={seedLocalEmulator};
