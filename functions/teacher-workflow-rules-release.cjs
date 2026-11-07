// --inspect is GET-only. --publish-reviewed activates only the exact reviewed rules.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
async function main(){
 const publish=process.argv.includes('--publish-reviewed');
 if(!publish&&!process.argv.includes('--inspect')){console.log('Use --inspect for a read-only live comparison. --publish-reviewed requires authorization to activate the reviewed rules.');return;}
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Do not operate on live rules from an emulator session.');
 const review=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/teacher-workflow-release-preparation-2026-11-05.json'),'utf8'));
 const source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
 if(review.project!=='lakbaypanahon-1797e'||review.sourceHash!==hash(source))throw Error('Candidate differs from reviewed rules.');
 const tests=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/teacher-student-loop-emulator-2026-11-03.json'),'utf8'));
 if(tests.sourceHash!==hash(source)||tests.steps.length<129||tests.steps.some(s=>s.status!=='pass'))throw Error('Matching local permission evidence required.');
 const staged=fs.readFileSync(path.join(root,review.package,'reviewed-firestore.rules'),'utf8');if(hash(staged)!==hash(source))throw Error('Staged rules differ.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);
 if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 async function call(url,body,method=body?'POST':'GET'){
  const response=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  const data=await response.json();if(!response.ok)throw Error('Rules API HTTP '+response.status+': '+(data.error?.message||'Request failed'));return data;
 }
 const base='https://firebaserules.googleapis.com/v1/projects/'+review.project;
 const release=await call(base+'/releases/cloud.firestore'),ruleset=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
 if(ruleset.source.files.length!==1||ruleset.source.files[0].name!=='firestore.rules')throw Error('Unexpected live source layout. Nothing activated.');
 const liveHash=hash(ruleset.source.files[0].content),alreadyActive=liveHash===review.sourceHash;
 const matchesBaseline=release.rulesetName===review.baselineRuleset&&liveHash===review.baselineSourceHash;
 const inspection={mode:'read-only-live-rules-comparison',checkedAt:new Date().toISOString(),project:review.project,liveRuleset:release.rulesetName,liveSourceHash:liveHash,reviewedSourceHash:review.sourceHash,matchesRecordedBaseline:matchesBaseline,reviewedCandidateAlreadyActive:alreadyActive,activationAllowedByDriftCheck:matchesBaseline||alreadyActive,configurationChanged:false};
 fs.writeFileSync(path.join(root,'docs/validation/teacher-workflow-live-rules-check-2026-11-05.json'),JSON.stringify(inspection,null,2));
 if(!publish){console.log(JSON.stringify(inspection,null,2));return;}
 if(alreadyActive){console.log('Exact reviewed rules are already active. Nothing changed.');return;}
 if(!matchesBaseline)throw Error('Live rules drifted from the reviewed baseline. Nothing activated.');
 const backupFile=path.join(root,'backups','teacher-workflow-rules-'+Date.now()+'.json');fs.writeFileSync(backupFile,JSON.stringify({release,ruleset},null,2),{flag:'wx'});
 const created=await call(base+'/rulesets',{source:{files:[{name:'firestore.rules',content:source}]}});
 if((await call(base+'/releases/cloud.firestore')).rulesetName!==release.rulesetName)throw Error('Live release changed during preparation; new candidate was not activated.');
 await call(base+'/releases/cloud.firestore?updateMask=rulesetName',{release:{name:release.name,rulesetName:created.name},updateMask:'rulesetName'},'PATCH');
 const after=await call(base+'/releases/cloud.firestore'),readback=await call('https://firebaserules.googleapis.com/v1/'+after.rulesetName);
 if(after.rulesetName!==created.name||hash(readback.source.files[0].content)!==review.sourceHash)throw Error('Activation readback mismatch. Inspect live rules before proceeding.');
 const report={mode:'published-and-read-back',publishedAt:new Date().toISOString(),project:review.project,sourceHash:review.sourceHash,previousRuleset:release.rulesetName,rulesetName:after.rulesetName,backup:path.relative(root,backupFile),scopes:review.changedScopes,learnerRecordsChanged:false,hostingChanged:false};
 fs.writeFileSync(path.join(root,'docs/validation/teacher-workflow-rules-publication-2026-11-05.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={main};
