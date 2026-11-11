// Creates only the missing, disabled assessment policy. Never activates or overwrites it.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'data/render-assessment-settings.json'),'utf8').replace(/^\uFEFF/,''));
assert.equal(plan.projectId,'lakbaypanahon-1797e');assert.equal(plan.documentPath,'learningSettings/securedAssessment');
assert.deepEqual(plan.fields,{enabled:false,protocolVersion:1,attemptTtlSeconds:7200,perMinuteAttempts:3,perStudentDailyAttempts:60,backendUrl:'https://lakbaypanahon-assessment.onrender.com'});
async function main(){
 if(!process.argv.includes('--create')){console.log('PASS: reviewed disabled policy; --create creates the absent document only.');return;}
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firestore.googleapis.com/v1/projects/'+plan.projectId+'/databases/(default)/documents';
 async function request(url,method='GET',body){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});if(r.status===404)return null;const value=await r.json();if(!r.ok)throw Error('Firestore configuration request failed: '+r.status);return value;}
 if(await request(base+'/'+plan.documentPath))throw Error('Document already exists; refused to overwrite.');
 const fields=Object.fromEntries(Object.entries(plan.fields).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:{stringValue:v}]));
 await request(base+'/learningSettings?documentId=securedAssessment','POST',{fields});
 const saved=await request(base+'/'+plan.documentPath);assert.deepEqual(saved.fields,fields);
 const report={verifiedAt:new Date().toISOString(),projectId:plan.projectId,path:plan.documentPath,createdAndReadBack:true,fields:plan.fields,studentRecordsChanged:false};
 fs.writeFileSync(path.join(root,'docs/validation/render-assessment-settings-2026-11-11.json'),JSON.stringify(report,null,2));console.log('PASS: disabled assessment configuration created and verified. Grading remains off; no student records changed.');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
