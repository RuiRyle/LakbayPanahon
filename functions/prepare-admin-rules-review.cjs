// Offline comparison only. No cloud access or deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {scopes}=require('./prepare-teacher-rules-review.cjs');
const root=path.resolve(__dirname,'..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function main(){
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'backups/admin-rules-baseline-2026-10-31.json'),'utf8'));
 if(hash(baseline.source)!==baseline.proof.sourceHash)throw Error('Baseline does not match published teacher rules.');
 const source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8'),before=scopes(baseline.source.replace(/\r\n/g,'\n')),after=scopes(source.replace(/\r\n/g,'\n'));
 if(before.outside!==after.outside)throw Error('Unreviewed changes outside named rule scopes.');
 const allowed=new Set(['function activeAdmin','function validModeration','match /accountModeration/{eventId}','match /users/{userId}']);
 const changed=[...new Set([...before.result.keys(),...after.result.keys()])].filter(key=>before.result.get(key)!==after.result.get(key));
 if(changed.length!==4||changed.some(key=>!allowed.has(key)))throw Error('Unexpected rule changes: '+changed.join(', '));
 for(const file of ['admin-workflow-emulator-2026-10-31.json','admin-teacher-regression-2026-10-31.json']){
  const check=JSON.parse(fs.readFileSync(path.join(root,'docs/validation',file),'utf8'));
  if(check.sourceHash!==hash(source)||!check.steps.length||check.steps.some(t=>t.status!=='pass'))throw Error('Missing matching emulator checks: '+file);
 }
 const browser=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/admin-workspace-browser-2026-10-31.json'),'utf8'));
 if(!browser.pass)throw Error('Browser validation required.');
 for(const item of browser.sources)if(hash(fs.readFileSync(path.join(root,item.file)))!==item.sha256)throw Error('Browser source drift: '+item.file);
 const report={mode:'offline-admin-rule-review',preparedAt:new Date().toISOString(),sourceHash:hash(source),baselineSourceHash:baseline.proof.sourceHash,baselineRuleset:baseline.proof.rulesetName,outsideScopeMatches:true,changedScopes:changed};
 fs.writeFileSync(path.join(root,'docs/validation/admin-rules-review-2026-10-31.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(root,'docs/admin-rules-review.md'),'# Administrator permission review\n\nOnly four named scopes change from the hash-verified published teacher rules. Status changes are limited to student/teacher accounts and require a paired, immutable audit record. No client can grant administrator roles or alter curriculum, grades or rewards through these rules. Current activation status is recorded in admin-workflow.md.\n\n'+changed.map(key=>'## '+key+'\n\nBefore:\n```\n'+(before.result.get(key)||'(absent)')+'\n```\n\nAfter:\n```\n'+after.result.get(key)+'\n```\n').join('\n'));
 console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();module.exports={main};
