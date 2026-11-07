// Activate only the reviewed administrator account-management rule additions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
async function main(){
 if(!process.argv.includes('--publish-reviewed')){console.log('No publication. Prepare and review the admin rule candidate, then use --publish-reviewed.');return;}
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Cannot publish from an emulator session.');
 const source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8'),review=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/admin-rules-review-2026-10-31.json'),'utf8'));
 if(review.sourceHash!==hash(source)||!review.outsideScopeMatches||review.changedScopes.length!==4)throw Error('Reviewed source changed.');
 for(const [file,count]of[['admin-workflow-emulator-2026-10-31.json',44],['admin-teacher-regression-2026-10-31.json',57]]){
  const check=JSON.parse(fs.readFileSync(path.join(root,'docs/validation',file),'utf8'));if(check.sourceHash!==hash(source)||check.steps.length<count||check.steps.some(t=>t.status!=='pass'))throw Error('Matching local permission checks required.');
 }
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firebaserules.googleapis.com/v1/projects/lakbaypanahon-1797e';
 async function call(url,body,method=body?'POST':'GET'){
  const response=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  const result=await response.json();if(!response.ok)throw Error('Rules API '+response.status+': '+(result.error?.message||'Request failed'));return result;
 }
 const release=await call(base+'/releases/cloud.firestore'),before=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
 if(before.source.files.length!==1||before.source.files[0].name!=='firestore.rules')throw Error('Unexpected source layout.');
 if(before.source.files[0].content===source){console.log('Reviewed administrator rules are already active.');return;}
 if(release.rulesetName!==review.baselineRuleset||hash(before.source.files[0].content)!==review.baselineSourceHash)throw Error('Live rules drifted. No publication performed.');
 const backup=path.join(root,'backups','admin-rules-'+Date.now()+'.json');fs.writeFileSync(backup,JSON.stringify({release,ruleset:before},null,2),{flag:'wx'});
 const created=await call(base+'/rulesets',{source:{files:[{name:'firestore.rules',content:source}]}});
 const latest=await call(base+'/releases/cloud.firestore');if(latest.rulesetName!==release.rulesetName)throw Error('Live release changed; new ruleset not activated.');
 await call(base+'/releases/cloud.firestore?updateMask=rulesetName',{release:{name:release.name,rulesetName:created.name},updateMask:'rulesetName'},'PATCH');
 const after=await call(base+'/releases/cloud.firestore'),readback=await call('https://firebaserules.googleapis.com/v1/'+after.rulesetName);
 if(after.rulesetName!==created.name||readback.source.files[0].content!==source)throw Error('Publication readback mismatch. Inspect live release.');
 const report={mode:'published-and-read-back',publishedAt:new Date().toISOString(),sourceHash:hash(source),previousRuleset:release.rulesetName,rulesetName:after.rulesetName,backup:path.relative(root,backup),scope:review.changedScopes,accountRecordsChanged:false};
 fs.writeFileSync(path.join(root,'docs/validation/admin-rules-publication-2026-10-31.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
