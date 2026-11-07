// Hosting-only patch: reuse every deployed file hash except the two approved assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e',api='https://firebasehosting.googleapis.com/v1beta1/',site=`projects/${project}/sites/${project}`;
const target=['js/mission-assessment.js','js/learning-draft.js'],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const signature=x=>JSON.stringify(canonical(x));
async function main(){
 const publish=process.argv.includes('--publish');if(!publish&&!process.argv.includes('--prepare'))throw Error('Use --prepare or --publish');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 async function request(url,method='GET',body){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(method+' HTTP '+r.status);return r.status===204?null:r.json();}
 async function files(name){let rows=[],page='';do{const r=await request(api+name+'/files?pageSize=1000'+(page?'&pageToken='+encodeURIComponent(page):''));rows.push(...r.files||[]);page=r.nextPageToken;}while(page);return rows;}
 const channel=await request(api+site+'/channels/live'),version=await request(api+channel.release.version.name),original=await files(version.name);
 const rules=await request(`https://firebaserules.googleapis.com/v1/projects/${project}/releases/cloud.firestore`);
 const ruleSource=await request('https://firebaserules.googleapis.com/v1/'+rules.rulesetName);
 const planFile=path.join(root,'docs/validation/priority-2-hosting-plan-2026-11-07.json');
 const updates=target.map(file=>{const bytes=fs.readFileSync(path.join(root,file)),gzip=zlib.gzipSync(bytes,{level:9}),old=original.find(f=>f.path==='/'+file);if(!old)throw Error('Missing deployed asset '+file);return{file,before:old.hash,after:hash(gzip),sourceSha256:hash(bytes)};});
 const plan={preparedAt:new Date().toISOString(),project,origin:'https://'+project+'.web.app',baselineVersion:version.name,rollbackVersion:version.name,files:original.length,updates,config:version.config,ruleset:rules.rulesetName,rulesSha256:hash(signature(ruleSource.source)),onlyHosting:true};
 if(!publish){fs.writeFileSync(planFile,JSON.stringify(plan,null,2));fs.writeFileSync(path.join(root,'backups/priority-2-hosting-before-2026-11-07.json'),JSON.stringify({channel,version,files:original,rules,ruleSource},null,2));console.log(JSON.stringify(plan,null,2));return;}
 const approved=JSON.parse(fs.readFileSync(planFile,'utf8'));
 for(const key of ['baselineVersion','files','updates','config','ruleset','rulesSha256'])if(signature(plan[key])!==signature(approved[key]))throw Error('Preflight drift: '+key);
 if(updates.some(u=>u.before===u.after))throw Error('Expected exactly two changed assets');
 const expected=Object.fromEntries(original.map(f=>[f.path,f.hash]));for(const u of updates)expected['/'+u.file]=u.after;
 const created=await request(api+site+'/versions','POST',{config:version.config});
 const report={startedAt:new Date().toISOString(),baselineVersion:version.name,version:created.name,updates,status:'uploading',ruleset:rules.rulesetName};
 const reportFile=path.join(root,'docs/validation/priority-2-hosting-publication-2026-11-07.json');const save=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2));save();
 const population=await request(api+created.name+':populateFiles','POST',{files:expected});
 for(const required of population.uploadRequiredHashes||[]){const update=updates.find(u=>u.after===required);if(!update)throw Error('Unexpected upload required for unchanged production asset');const bytes=zlib.gzipSync(fs.readFileSync(path.join(root,update.file)),{level:9});const r=await fetch(population.uploadUrl+'/'+required,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream'},body:bytes,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Asset upload HTTP '+r.status);}
 await request(api+created.name+'?updateMask=status','PATCH',{status:'FINALIZED'});
 const staged=await files(created.name);if(staged.length!==original.length||staged.some(f=>expected[f.path]!==f.hash))throw Error('Staged file map differs from exact two-file patch');
 const stagedVersion=await request(api+created.name);if(signature(stagedVersion.config)!==signature(version.config))throw Error('Hosting configuration changed');
 if((await request(api+site+'/channels/live')).release.version.name!==version.name)throw Error('Another deployment advanced production');
 const release=await request(api+site+'/channels/live/releases?versionName='+encodeURIComponent(created.name),'POST',{message:'Priority 2: adaptive reinforcement and version-guarded learning drafts only'});
 report.status='published';report.release=release;report.fileCount=staged.length;report.exactChangedPaths=updates.map(u=>u.file);report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
