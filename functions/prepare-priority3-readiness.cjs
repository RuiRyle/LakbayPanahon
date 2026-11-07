// LOCAL artifacts only. Public HTTPS GETs may fill the pinned baseline cache.
// No credentials, Firebase management mutations, deployment or configuration writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/priority3-release');
const origin='https://lakbaypanahon-1797e.web.app';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const gzip=b=>zlib.gzipSync(b,{level:9});
function write(name,bytes){const file=path.join(out,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
function json(name,value){write(name,JSON.stringify(value,null,2)+'\n');}
async function prepare({download=false}={}){
 require('./sync-assessment-policy.cjs').sync(true);
 const facts=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/priority-3-production-readiness-facts-2026-11-07.json')));
 const original=Object.fromEntries(facts.hosting.files.map(f=>[f.path,f.hash]));
 if(Object.keys(original).length!==575)throw Error('Unexpected baseline');
 const config=structuredClone(facts.hosting.config),callable='https://asia-southeast1-lakbaypanahon-1797e.cloudfunctions.net';
 const headers=config.headers.find(h=>h.headers?.['Content-Security-Policy']);
 const before=headers.headers['Content-Security-Policy'];
 if(before.includes(callable))throw Error('Unexpected CSP baseline');
 headers.headers['Content-Security-Policy']=before.replace(/connect-src ([^;]+)/,(_,v)=>'connect-src '+v+' '+callable);
 const cached=path.join(root,'build/priority3-production-cache');
 const baselineFiles=Object.keys(original).filter(p=>/\.(?:js|json|html|css)$/.test(p)&&!p.startsWith('/__/'));
 let next=0;
 await Promise.all(Array.from({length:8},async()=>{while(next<baselineFiles.length){
  const p=baselineFiles[next++],file=path.join(cached,p.slice(1));let b;
  if(fs.existsSync(file))b=fs.readFileSync(file);
  else {if(!download)throw Error('Missing baseline cache; use --download: '+p);const response=await fetch(origin+p,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Baseline HTTP '+response.status+' '+p);b=Buffer.from(await response.arrayBuffer());fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}
  if(hash(gzip(b))!==original[p])throw Error('Production drift/cache mismatch: '+p);
  write('hosting/public'+p,b);
 }}));
 const replacements=['student-rewards-client.js','mission-assessment-client.js','quiz.js','chapter-challenge.js','daily-challenge.js'];
 const additions=['student-assessment-client.js','assessment-preview.js'];
 const final={...original},updates=[];
 for(const name of [...replacements,...additions]){
  let b=fs.readFileSync(path.join(root,'js',name));
  if(name==='chapter-challenge.js'){
   // Keep unrelated local keepsake fallback out of this approved release.
   const baseline=fs.readFileSync(path.join(cached,'js',name),'utf8');
   const block=s=>s.match(/        const updateKeepsake=\(\)=>\{[\s\S]*?\n        \};/)?.[0];
   if(!block(b.toString())||!block(baseline))throw Error('Chapter baseline shape changed');
   b=Buffer.from(b.toString().replace(block(b.toString()),block(baseline)));
  }
  const p='/js/'+name,compressed=gzip(b);final[p]=hash(compressed);
  write('hosting/public'+p,b);write('hosting/uploads/'+final[p]+'.gz',compressed);
  updates.push({path:p,before:original[p]||null,after:final[p],sourceSha256:hash(b)});
 }
 // Production firebase-config and AI graph remain byte-for-byte intact.
 json('hosting/file-map.json',final);json('hosting/config.json',config);
 // Generated payloads are content-addressed. Retain only bytes referenced by
 // this exact map so rebuilding cannot inventory an obsolete upload.
 const payloadDir=path.join(out,'hosting/uploads'),referenced=new Set(Object.values(final));
 for(const entry of fs.readdirSync(payloadDir,{withFileTypes:true})){
  if(!entry.isFile()||!/^[a-f0-9]{64}\.gz$/.test(entry.name))throw Error('Unexpected generated upload entry');
  if(!referenced.has(entry.name.slice(0,-3)))fs.unlinkSync(path.join(payloadDir,entry.name));
 }
 json('baseline/hosting-config.json',facts.hosting.config);json('baseline/file-map.json',original);
 const baseline=fs.readFileSync(path.join(root,'build/priority3-audit/firestore.readiness-active.rules'),'utf8');
 if(hash(baseline)!==facts.rules.sha256)throw Error('Rule baseline drift');
 const secured=require('./build-trusted-assessment-rules.cjs').buildCandidate(baseline);
 if(secured!==fs.readFileSync(path.join(root,'firestore.assessment.rules'),'utf8'))throw Error('Rule candidate drift');
 write('rules/firestore.rules',secured);write('baseline/firestore.rules',baseline);
 write('rollback/firestore.rules',secured);
 // Pause rather than restore legacy browser reward authority.
 const holding={...final},reward=Buffer.from("export async function submitStudentActivity(){throw Error('Assessment saving is temporarily unavailable. Your earned progress is safe. Please try again later.');}\n");
 holding['/js/student-rewards-client.js']=hash(gzip(reward));
 write('rollback/student-rewards-client.js',reward);write('rollback/uploads/'+hash(gzip(reward))+'.gz',gzip(reward));
 json('rollback/hosting-file-map.json',holding);json('rollback/hosting-config.json',config);
 json('policy/disabled-proposal.json',{enabled:false,protocolVersion:1,attemptTtlSeconds:7200,perMinuteAttempts:10,perStudentDailyAttempts:200});
 const entries=['student-assessment.js','assessment-callables.js','student-rewards.js','progression-policy.js','package.json','package-lock.json'];
 for(const name of entries)write('functions/'+name,fs.readFileSync(path.join(root,'functions',name)));
 for(const name of fs.readdirSync(path.join(root,'functions/assessment-shared')))write('functions/assessment-shared/'+name,fs.readFileSync(path.join(root,'functions/assessment-shared',name)));
 const index=fs.readFileSync(path.join(root,'functions/index.js'),'utf8').split('/*')[0];
 if((index.match(/exports\.\w+=onCall/g)||[]).length!==4)throw Error('Unexpected endpoint inventory');
 write('functions/index.js',index);
 write('functions/.firebaseignore','node_modules\n.git\n*.log\n');
 write('rollback/functions/package.json',fs.readFileSync(path.join(root,'functions/package.json')));
 write('rollback/functions/package-lock.json',fs.readFileSync(path.join(root,'functions/package-lock.json')));
 write('rollback/functions/index.js',`const {onCall,HttpsError}=require('firebase-functions/v2/https');\nconst options={region:'asia-southeast1',serviceAccount:'assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com',enforceAppCheck:process.env.FUNCTIONS_EMULATOR!=='true',maxInstances:10};\nfor(const name of ['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'])exports[name]=onCall(options,async()=>{throw new HttpsError('unavailable','Assessment saving is temporarily unavailable. Your earned progress is safe.');});\n`);
 json('rollback/firebase.json',{functions:[{source:'functions',codebase:'default'}],firestore:{rules:'firestore.rules'}});
 json('runtime-identity.proposal.json',{status:'proposal-not-provisioned',runtimeServiceAccount:'assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com',runtimePredefinedRoles:['roles/datastore.user','roles/firebaseauth.viewer'],note:'Practical predefined roles; stricter custom roles and build identity permissions require production IAM verification. No Editor, Owner, credential keys or token-creator grant requested.'});
 json('assessment-runtime-role.proposal.json',{title:'LakbayPanahon Assessment Runtime',description:'Proposed operation-level runtime permissions; not created or granted. Validate on the selected production identity before activation.',stage:'GA',includedPermissions:['datastore.databases.get','datastore.entities.get','datastore.entities.list','datastore.entities.create','datastore.entities.update','firebaseauth.users.get']});
 write('README.txt',`LOCAL CANDIDATE ONLY - NOT DEPLOYED OR ACTIVATED\n\nHosting is a REST file-map overlay, not a complete directory deploy. Reuse unchanged hashes from the pinned live version, and upload only hosting/uploads payloads. Do not deploy hosting/public as a whole site. Recheck live version, rules, file map and configuration before a later approved release. No production publish command is included in the builder.\n\nDeploy only the four reviewed endpoints from functions, with billing/APIs and the explicitly named runtime/build identities separately approved and provisioned. Use the disabled policy proposal only after approval; it is not a migration or write script.\n\nRollback: keep restrictive rules, disable rollout policy and gate Admin endpoints or publish the deny-only rollback/functions package. The rollback Hosting map reuses the candidate map plus its holding facade: a future uploader may need payloads from BOTH hosting/uploads and rollback/uploads. Never restore baseline/firestore.rules as incident rollback. Retain committed learner data.\n\nSee docs/validation/priority-3-local-readiness-preparation-2026-11-07.md for gates, risk decisions and verification limitations.\n`);
 json('firebase.release.json',{functions:[{source:'functions',codebase:'default'}],firestore:{rules:'rules/firestore.rules'}});
 const inventory=[];function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(e.name==='node_modules')continue;const p=path.join(folder,e.name);if(e.isDirectory())walk(p);else if(e.name!=='manifest.json')inventory.push({file:path.relative(out,p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))});}}walk(out);
 const sourceFiles=['js/firebase-config.js','js/student-assessment-client.js','functions/student-hosting-config.cjs','functions/index.js','functions/student-assessment.js','functions/package.json','functions/package-lock.json','functions/prepare-priority3-readiness.cjs','firebase.priority3-readiness-emulator.json','tests/priority3-readiness.test.cjs','tests/secured-browser-emulator.cjs','tests/easy-review-recovery.test.cjs','tests/option-a-context.test.cjs','tests/student-assessment-emulator.cjs','tests/priority3-save-diagnostic.cjs'];
 const manifest={mode:'local-preparation-only-not-deployed',baselineVersion:facts.hosting.version,baselineRulesSha256:hash(baseline),securedRulesSha256:hash(secured),updates,expectedHostingPaths:Object.keys(final).length,preservedPaths:Object.keys(original).length-replacements.length,callableOrigin:callable,functions:['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'],activation:false,requiresFreshProductionPreflight:true,sourceFiles:sourceFiles.map(file=>({file,sha256:hash(fs.readFileSync(path.join(root,file)))})),inventory};
 json('manifest.json',manifest);return manifest;
}
if(require.main===module)prepare({download:process.argv.includes('--download')}).then(m=>console.log(JSON.stringify({paths:m.expectedHostingPaths,preserved:m.preservedPaths,updates:m.updates.map(x=>x.path),artifacts:m.inventory.length}))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepare,out};
