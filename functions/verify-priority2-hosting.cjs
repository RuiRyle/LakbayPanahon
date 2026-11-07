// Read-only post-release verification; no account or Firestore writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e',origin='https://'+project+'.web.app',base='https://firebasehosting.googleapis.com/v1beta1/';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const signature=x=>JSON.stringify(canonical(x)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const plan=require('../docs/validation/priority-2-hosting-plan-2026-11-07.json'),publication=require('../docs/validation/priority-2-hosting-publication-2026-11-07.json'),backup=require('../backups/priority-2-hosting-before-2026-11-07.json');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root),token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const get=async url=>{const r=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Metadata HTTP '+r.status);return r.json();};
 const channel=await get(base+`projects/${project}/sites/${project}/channels/live`);if(channel.release.version.name!==publication.version)throw Error('Unexpected production version');
 const version=await get(base+publication.version);if(signature(version.config)!==signature(plan.config))throw Error('Hosting config changed');
 let files=[],page='';do{const r=await get(base+publication.version+'/files?pageSize=1000'+(page?'&pageToken='+encodeURIComponent(page):''));files.push(...r.files||[]);page=r.nextPageToken;}while(page);
 const old=new Map(backup.files.map(f=>[f.path,f.hash])),changed=files.filter(f=>old.get(f.path)!==f.hash).map(f=>f.path).sort();
 if(files.length!==old.size||signature(changed)!==signature(plan.updates.map(u=>'/'+u.file).sort()))throw Error('Unexpected production file changes');
 const rules=await get(`https://firebaserules.googleapis.com/v1/projects/${project}/releases/cloud.firestore`),source=await get('https://firebaserules.googleapis.com/v1/'+rules.rulesetName);
 if(rules.rulesetName!==plan.ruleset||hash(signature(source.source))!==plan.rulesSha256)throw Error('Rules changed');
 const checks=[];
 for(const item of plan.updates){const r=await fetch(origin+'/'+item.file,{signal:AbortSignal.timeout(30000)}),bytes=Buffer.from(await r.arrayBuffer());if(r.status!==200||hash(bytes)!==item.sourceSha256)throw Error('Deployed bytes mismatch '+item.file);if(!r.headers.get('cache-control')?.includes('no-cache'))throw Error('JavaScript caching mismatch');const etag=r.headers.get('etag');const revalidated=await fetch(origin+'/'+item.file,{headers:etag?{'If-None-Match':etag}:{},signal:AbortSignal.timeout(30000)});if(revalidated.status!==304&&hash(Buffer.from(await revalidated.arrayBuffer()))!==item.sourceSha256)throw Error('Revalidation mismatch');checks.push({file:item.file,sha256:hash(bytes),cache:r.headers.get('cache-control'),revalidationStatus:revalidated.status});}
 for(const route of ['/pages/login.html','/pages/quiz.html','/pages/story.html','/pages/bayani-ai.html']){const r=await fetch(origin+route,{signal:AbortSignal.timeout(30000)});if(r.status!==200||!r.headers.get('cache-control')?.includes('no-store')||!r.headers.get('content-security-policy'))throw Error('Route/header failure '+route);checks.push({route,status:r.status,htmlNoStore:true,csp:true});}
 for(const route of ['/firestore.rules','/backups/priority-2-hosting-before-2026-11-07.json']){const r=await fetch(origin+route);if(r.status!==404)throw Error('Private file exposed');checks.push({route,status:404});}
 const report={checkedAt:new Date().toISOString(),status:'pass',origin,version:publication.version,fileCount:files.length,changedPaths:changed,other573FileHashesPreserved:true,hostingConfigPreserved:true,rulesetUnchanged:rules.rulesetName,checks,serviceWorkerNamedAssets:files.filter(f=>/\/(?:sw|service-worker)\.js$/.test(f.path)).map(f=>f.path),limitations:['Already-open documents retain imported modules until reloaded.','Conditional HTTP revalidation does not force an already running old tab to reload.']};
 fs.writeFileSync(path.join(root,'docs/validation/priority-2-hosted-verification-2026-11-07.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
