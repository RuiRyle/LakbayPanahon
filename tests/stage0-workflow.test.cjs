const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const {createPlan,validatePlan,validateCandidate,relativeFiles,base,hash}=require('../functions/stage0-gcloud-plan.cjs');
const root=path.resolve(__dirname,'..'),accepted=JSON.parse(fs.readFileSync(path.join(root,'build/priority3-release/manifest.json')));
const readLog=file=>{const bytes=fs.readFileSync(file);return bytes.subarray(0,2).equals(Buffer.from([255,254]))?bytes.toString('utf16le').replace(/^\uFEFF/,''):bytes.toString('utf8');};
test('Separate candidate preserves every accepted source and non-configuration artifact',()=>assert.equal(validateCandidate().valid,true));
for(const rollback of [false,true])test((rollback?'Rollback':'Release')+' binds both exact accounts and four callable exports with pilot scale',()=>{
 const plan=createPlan(rollback);assert.equal(validatePlan(plan,rollback),true);assert.equal(plan.operations.length,4);assert.equal(plan.productionExecutionEnabled,false);
 for(const op of plan.operations){assert.ok(op.argv.includes('--build-service-account='+plan.buildAccount));assert.ok(op.argv.includes('--service-account='+plan.runtimeAccount));for(const arg of ['--gen2','--runtime=nodejs22','--max-instances=2','--min-instances=0','--concurrency=8','--ignore-file=.gcloudignore','--no-allow-unauthenticated'])assert.ok(op.argv.includes(arg));}
 assert.deepEqual(plan.protocol,{enabled:false,protocolVersion:1,attemptTtlSeconds:7200,perMinuteAttempts:3,perStudentDailyAttempts:60});
});
for(const flag of ['--build-service-account=','--service-account=','--project=','--region=','--runtime=','--entry-point=','--source=','--max-instances=','--min-instances=','--concurrency=','--env-vars-file=','--ignore-file='])test('Reject missing or altered '+flag,()=>{
 for(const rollback of [false,true])for(const mode of ['missing','altered']){const plan=createPlan(rollback),args=plan.operations[0].argv,index=args.findIndex(x=>x.startsWith(flag));assert.notEqual(index,-1);if(mode==='missing')args.splice(index,1);else args[index]=flag+'unapproved';assert.throws(()=>validatePlan(plan,rollback));}
});
test('Reject public invocation, extra flags, extra endpoints and protocol activation',()=>{for(const edit of [p=>p.operations[0].argv.push('--allow-unauthenticated'),p=>p.operations.push(p.operations[0]),p=>p.protocol.enabled=true,p=>p.productionExecutionEnabled=true,p=>p.protocol.perMinuteAttempts=10]){const p=createPlan();edit(p);assert.throws(()=>validatePlan(p));}});
test('Validator cannot execute deployments',()=>{const r=spawnSync(process.execPath,['functions/stage0-gcloud-plan.cjs','--deploy'],{cwd:root,encoding:'utf8',windowsHide:true});assert.notEqual(r.status,0);assert.match(r.stderr,/No production execution mode/);});
test('Actual verified CLI help exposes both identity flags and scaling controls',()=>{const text=readLog(path.join(root,'docs/validation/priority-3-stage0-gcloud-help-2026-11-07.log'));for(const flag of ['--build-service-account','--service-account','--max-instances','--min-instances','--concurrency','--ignore-file'])assert.ok(text.includes(flag));const v=JSON.parse(fs.readFileSync(path.join(root,'build/google-cloud-cli-592/verified.json')));assert.equal(v.version,'592.0.0');assert.equal(v.sha256,'65002e0d679fc2ade00163b97637f45656d6fd5250d6f5962e4a1a555f2628ea');});
for(const rollback of [false,true])test('Actual gcloud upload selection excludes tests, credentials and node_modules: '+rollback,()=>{
 const file=rollback?'priority-3-stage0-gcloud-rollback-upload-2026-11-07.log':'priority-3-stage0-gcloud-upload-2026-11-07.log';
 const actual=readLog(path.join(root,'docs/validation',file)).trim().split(/\r?\n/).map(x=>x.replaceAll('\\','/')).sort();
 assert.deepEqual(actual,(rollback?['index.js','package.json','package-lock.json','.gcloudignore']:relativeFiles.concat('.gcloudignore')).sort());
});
test('No Firebase Functions deploy target or enabled policy; no environment bypass',()=>{for(const file of ['firebase.release.json','rollback/firebase.json'])assert.equal(JSON.parse(fs.readFileSync(path.join(base,file))).functions,undefined);const env=JSON.parse(fs.readFileSync(path.join(base,'deployment/runtime-env.json')));assert.deepEqual(Object.keys(env).sort(),['FIREBASE_CONFIG','FUNCTION_REGION']);assert.equal(JSON.parse(env.FIREBASE_CONFIG).projectId,'lakbaypanahon-1797e');assert.equal(JSON.parse(fs.readFileSync(path.join(base,'policy/disabled-proposal.json'))).enabled,false);});
test('Actual Functions ZIP routine packages every allowed byte for release and rollback',()=>{
 const proof=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/priority-3-stage0-actual-packaging-2026-11-07.json')));assert.equal(proof.status,'pass');
 for(const p of proof.packages)assert.deepEqual(p.files,(p.rollback?['index.js','package.json','package-lock.json','.gcloudignore']:relativeFiles.concat('.gcloudignore')).sort());
});
test('Protected rollback exports four secured deny-only callables with matching identities and limits',async()=>{
 delete process.env.FUNCTIONS_EMULATOR;
 const Module=require('node:module'),filename=path.join(base,'rollback/functions/index.js'),compiled=new Module(filename,module);compiled.filename=filename;compiled.paths=Module._nodeModulePaths(path.join(base,'functions'));
 compiled._compile(fs.readFileSync(filename,'utf8'),filename);
 assert.deepEqual(Object.keys(compiled.exports).sort(),createPlan().operations.map(x=>x.name).sort());
 for(const fn of Object.values(compiled.exports)){
  assert.equal(fn.__endpoint.maxInstances,2);assert.equal(fn.__endpoint.minInstances,0);assert.equal(fn.__endpoint.concurrency,8);assert.equal(fn.__endpoint.serviceAccountEmail,createPlan().runtimeAccount);assert.equal(fn.__trigger.labels['deployment-callable'],'true');
  await assert.rejects(fn.run({auth:{uid:'synthetic'},app:{appId:'synthetic'},data:{score:100,xp:999}}),error=>error.code==='unavailable'&&/earned progress is safe/.test(error.message));
 }
});
test('Callable SDK metadata and real HTTP wrapper retain security, CORS and callable error encoding',async()=>{
 delete process.env.FUNCTIONS_EMULATOR;process.env.FIREBASE_CONFIG=JSON.stringify({projectId:'demo-lakbaypanahon'});process.env.GCLOUD_PROJECT='demo-lakbaypanahon';
 const rf=createRequire(path.join(base,'functions/package.json')),functions=rf('./index.js'),express=rf('express'),app=express();app.use(express.json());
 assert.deepEqual(Object.keys(functions).sort(),createPlan().operations.map(x=>x.name).sort());
 for(const [name,fn]of Object.entries(functions)){assert.equal(typeof fn,'function');assert.equal(fn.__endpoint.maxInstances,2);assert.equal(fn.__endpoint.minInstances,0);assert.equal(fn.__endpoint.concurrency,8);assert.equal(fn.__trigger.labels['deployment-callable'],'true');app.all('/'+name,fn);}
 const server=http.createServer(app);await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 try{for(const name of Object.keys(functions)){
  const options=await fetch(url+name,{method:'OPTIONS',headers:{Origin:'https://lakbaypanahon-1797e.web.app','Access-Control-Request-Method':'POST'}});assert.equal(options.status,204);assert.match(options.headers.get('access-control-allow-methods'),/POST/);
  const missing=await fetch(url+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:{score:100}})});assert.equal(missing.status,401);assert.equal((await missing.json()).error.status,'UNAUTHENTICATED');
  for(const headers of [{'X-Firebase-AppCheck':'not-a-token'},{Authorization:'Bearer not-a-token'}]){const invalid=await fetch(url+name,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:'{"data":{}}'});assert.equal(invalid.status,401);assert.equal((await invalid.json()).error.status,'UNAUTHENTICATED');}
  const malformed=await fetch(url+name,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"score":100}'});assert.equal(malformed.status,400);assert.equal((await malformed.json()).error.status,'INVALID_ARGUMENT');
 }}finally{await new Promise(r=>server.close(r));for(const a of rf('firebase-admin/app').getApps())await rf('firebase-admin/app').deleteApp(a);}
});
