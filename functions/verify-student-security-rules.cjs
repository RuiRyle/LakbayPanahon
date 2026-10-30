// Opt-in server-side compilation/evaluation using only synthetic document mocks.
// Does not deploy rules, create accounts, or read/write Firestore documents.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {cases}=require('../tests/fixtures/student-security-rules-cases.cjs');
const source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
const sourceHash=crypto.createHash('sha256').update(source).digest('hex');
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('This command does not use an emulator.');
 if(!process.argv.includes('--verify')){console.log(JSON.stringify({mode:'offline-inspection',sourceHash,cases:cases.length,command:'Add --verify to evaluate synthetic cases with the original project Rules API. No deployment.'},null,2));return;}
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login is required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const testCases=cases.map(({name,...test})=>test);
 const response=await fetch('https://firebaserules.googleapis.com/v1/projects/lakbaypanahon-1797e:test',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({source:{files:[{name:'firestore.rules',content:source}]},testSuite:{testCases}}),signal:AbortSignal.timeout(45000)});
 const result=await response.json();if(!response.ok)throw Error('Rules verification HTTP '+response.status+': '+(result.error?.message||'Request failed'));
 const errors=(result.issues||[]).filter(i=>i.severity==='ERROR');
 const tests=(result.testResults||[]).map((t,i)=>({name:cases[i]?.name,expectation:cases[i]?.expectation,state:t.state,
  ...(t.debugMessages?.length?{debugMessages:t.debugMessages}:{}),functionCalls:t.functionCalls||[]}));
 const report={mode:'server-rules-test-synthetic-mocks-not-deployed',verifiedAt:new Date().toISOString(),sourceHash,issues:result.issues||[],tests,
  limitations:['Synthetic document mocks; no learner data is accessed.','Does not prove browser grades or progression claims truthful.','Does not emulate a multi-write SDK transaction or test App Check/hosting.']};
 fs.writeFileSync(path.join(root,'docs/validation/student-security-rules-2026-10-30.json'),JSON.stringify(report,null,2));
 const failures=tests.filter(t=>t.state!=='SUCCESS');
 console.log(JSON.stringify({sourceHash,issues:report.issues,tests:tests.length,passed:tests.length-failures.length,failures},null,2));
 if(errors.length||failures.length||tests.length!==cases.length)process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
