// Separate submission launcher. Accepted Stage 0 sources are read-only.
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),accepted=path.join(root,'build/priority3-stage0-release'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(sha(path.join(accepted,'manifest.json'))!=='0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef')throw Error('Accepted candidate drift');
const original=path.join(__dirname,'start-local-emulator.cjs');let source=fs.readFileSync(original,'utf8');
function replace(from,to){if(!source.includes(from))throw Error('Submission launcher contract changed');source=source.replace(from,to);}
replace("const folder=resolvePackage();",`const folder=resolvePackage();
  const accepted=path.join(root,'build/priority3-stage0-release');
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,'release-manifest.json')));
  const secure=['student-assessment-client.js','student-rewards-client.js','mission-assessment-client.js','quiz.js','chapter-challenge.js','daily-challenge.js','assessment-preview.js'];
  for(const name of secure){const relative='js/'+name,target=path.join(folder,'public',relative);fs.copyFileSync(path.join(accepted,'hosting/public',relative),target);const row=manifest.files.find(x=>x.file===relative);if(!row)throw Error('Secure module missing from allowlist: '+relative);row.sha256=require('crypto').createHash('sha256').update(fs.readFileSync(target)).digest('hex');row.bytes=fs.statSync(target).size;}
  fs.writeFileSync(path.join(folder,'release-manifest.json'),JSON.stringify(manifest,null,2));
  fs.writeFileSync(path.join(folder,'SUBMISSION-LOCAL-ONLY.txt'),'Synthetic local demonstration only. Secure modules from accepted Stage 0; latest frontend is a separate integration candidate. Never deploy this package.');`);
replace("const config=path.join(folder,'emulator-config.json');","const config=path.join(root,'build/submission-demo-emulator.json');");
replace("{firestore:{rules:path.join(root,'firestore.rules')},emulators:","{functions:[{source:'priority3-stage0-release/functions',codebase:'default'}],firestore:{rules:'priority3-stage0-release/rules/firestore.rules'},emulators:");
replace("emulators:{auth:","emulators:{functions:{host:'127.0.0.1',port:5001},auth:");
replace("'--only','auth,firestore'","'--only','auth,firestore,functions'");
replace("if(running.auth&&running.firestore)","if(running.auth&&running.firestore&&running.functions)");
replace("if(!ready)throw Error('Emulator startup timed out.');",`if(!ready)throw Error('Emulator startup timed out.');
  let callableReady=false;
  for(let i=0;i<60;i++){const probe=await fetch('http://127.0.0.1:5001/demo-lakbay-local/asia-southeast1/startStudentAssessment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:{}}),signal:AbortSignal.timeout(60000)});if(probe.status===401){callableReady=true;break;}if(probe.status!==404&&probe.status!==503)throw Error('Secure callable authentication check failed: '+probe.status);await new Promise(r=>setTimeout(r,1000));}
  if(!callableReady)throw Error('Secure callable discovery timed out; website stays closed');`);
replace("await seedLocalEmulator();",`await seedLocalEmulator();
  const policy=await fetch('http://127.0.0.1:8180/v1/projects/demo-lakbay-local/databases/(default)/documents/learningSettings/securedAssessment',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer owner'},body:JSON.stringify({fields:{enabled:{booleanValue:true},protocolVersion:{integerValue:'1'},attemptTtlSeconds:{integerValue:'7200'},perMinuteAttempts:{integerValue:'3'},perStudentDailyAttempts:{integerValue:'60'}}})});
  if(!policy.ok)throw Error('Demo policy seeding failed');`);
replace("LOCAL EMULATOR WEBSITE:","LOCAL SECURE SUBMISSION DEMO (synthetic data; live AI disabled):");
const compiled=new Module(original,module);compiled.filename=original;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(source,original);
