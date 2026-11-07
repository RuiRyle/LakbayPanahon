// Run only after explicit approval of the reviewed teacher rules publication.
// Publishes Firestore rules only: no website, Functions, curriculum or account writes.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname,'..'), hash = value=>crypto.createHash('sha256').update(value).digest('hex');
const normalize = value=>value.replace(/\r\n/g,'\n').trim();
async function main() {
    if (!process.argv.includes('--publish-reviewed')) { console.log('No action. Requires explicit approval, then --publish-reviewed. Review docs/teacher-rules-review.md first.'); return; }
    if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Do not publish from an emulator session.');
    const source = fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
    const review = JSON.parse(fs.readFileSync(path.join(root,'docs/validation/teacher-rules-review-2026-10-31.json'),'utf8'));
    const tests = JSON.parse(fs.readFileSync(path.join(root,'docs/validation/teacher-workflow-emulator-2026-10-31.json'),'utf8'));
    if(review.sourceHash!==hash(source)||!review.outsideScopeMatches||tests.sourceHash!==hash(source)||tests.steps.length<57||tests.steps.some(t=>t.status!=='pass'))throw Error('Candidate or matching local validation changed. Review again.');
    const cli = require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
    const account = cli.getProjectDefaultAccount(root); if(!account)throw Error('Firebase CLI login required.');
    const token = (await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
    const base='https://firebaserules.googleapis.com/v1/projects/lakbaypanahon-1797e';
    async function call(url,body,method=body?'POST':'GET') {
        const response=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
        const result=await response.json();if(!response.ok)throw Error('Rules API '+response.status+': '+(result.error?.message||'Request failed'));return result;
    }
    const release=await call(base+'/releases/cloud.firestore');
    const before=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
    if(before.source.files.length!==1||before.source.files[0].name!=='firestore.rules')throw Error('Unexpected source layout. No rules changed.');
    if(normalize(before.source.files[0].content)===normalize(source)){console.log('Reviewed teacher rules are already active.');return;}
    // The last publication's exact source must still be active. Stop on drift.
    const proof=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/journey-finale-rules-publication-2026-10-31.json'),'utf8'));
    if(release.rulesetName!==review.baselineRuleset||review.baselineSourceHash!==proof.sourceHash||hash(before.source.files[0].content)!==review.baselineSourceHash)throw Error('Live rules changed from the reviewed baseline. No rules published.');
    const backup=path.join(root,'backups','teacher-rules-'+Date.now()+'.json');fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,JSON.stringify({release,ruleset:before},null,2),{flag:'wx'});
    const created=await call(base+'/rulesets',{source:{files:[{name:'firestore.rules',content:source}]}});
    const latest=await call(base+'/releases/cloud.firestore');
    if(latest.rulesetName!==release.rulesetName)throw Error('Live rules changed during publication. New ruleset was not activated.');
    await call(base+'/releases/cloud.firestore?updateMask=rulesetName',{release:{name:release.name,rulesetName:created.name},updateMask:'rulesetName'},'PATCH');
    const after=await call(base+'/releases/cloud.firestore');
    if(after.rulesetName!==created.name)throw Error('Release readback differs. Inspect live rules.');
    const readback=await call('https://firebaserules.googleapis.com/v1/'+after.rulesetName);
    if(normalize(readback.source.files[0].content)!==normalize(source))throw Error('Source readback differs. Inspect live rules.');
    const report={mode:'published-and-read-back',publishedAt:new Date().toISOString(),sourceHash:hash(source),previousRuleset:release.rulesetName,rulesetName:after.rulesetName,backup:path.relative(root,backup),scope:review.changedScopes,learnerRecordsChanged:false};
    fs.writeFileSync(path.join(root,'docs/validation/teacher-rules-publication-2026-10-31.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
