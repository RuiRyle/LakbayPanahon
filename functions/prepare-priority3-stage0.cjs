// Separate candidate; does not mutate accepted Option A artifacts or production.
const fs=require('fs'),path=require('path');
const {createPlan,validateCandidate,inventory,relativeFiles,base,hash}=require('./stage0-gcloud-plan.cjs'),root=path.resolve(__dirname,'..'),acceptedDir=path.join(root,'build/priority3-release');
function write(name,value){const file=path.join(base,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
const json=(p,v)=>write(p,JSON.stringify(v,null,2)+'\n');
function prepare(){
 if(fs.existsSync(path.join(base,'manifest.json')))throw Error('Finalized candidate exists; do not overwrite reviewed manifest');
 const bytes=fs.readFileSync(path.join(acceptedDir,'manifest.json'));if(hash(bytes)!=='126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f')throw Error('Accepted manifest changed');const accepted=JSON.parse(bytes);
 for(const item of accepted.inventory){const b=fs.readFileSync(path.join(acceptedDir,item.file));if(hash(b)!==item.sha256)throw Error('Accepted artifact drift');write(item.file,b);}
 for(const rollback of [false,true]){const prefix=rollback?'rollback/functions':'functions',source=fs.readFileSync(path.join(base,prefix,'index.js'),'utf8');if(!source.includes('maxInstances:10'))throw Error('Runtime baseline mismatch');write(prefix+'/index.js',source.replace('maxInstances:10',"maxInstances:2,minInstances:0,concurrency:8,cpu:1,memory:'256MiB',timeoutSeconds:60"));
  const allowed=rollback?['index.js','package.json','package-lock.json']:relativeFiles;
  // Empty default-deny list with explicit file and parent-directory exceptions.
  write(prefix+'/.gcloudignore',['**','!.','!.gcloudignore','!assessment-shared',...allowed.map(p=>'!'+p)].join('\n')+'\n');
  json('deployment/'+(rollback?'rollback-plan.json':'deploy-plan.json'),createPlan(rollback));
 }
 json('policy/disabled-proposal.json',createPlan().protocol);
 json('deployment/runtime-env.json',{FIREBASE_CONFIG:JSON.stringify({projectId:'lakbaypanahon-1797e',storageBucket:'lakbaypanahon-1797e.firebasestorage.app'}),FUNCTION_REGION:'asia-southeast1'});
 json('deployment/identity-binding.json',{status:'proposed-not-provisioned',buildServiceAccount:createPlan().buildAccount,runtimeServiceAccount:createPlan().runtimeAccount,permissionChangesPerformed:false,productionExecutionEnabled:false});
 // Remove the Firebase Functions deployment target from this new candidate.
 json('firebase.release.json',{firestore:{rules:'rules/firestore.rules'}});
 json('rollback/firebase.json',{firestore:{rules:'firestore.rules'}});
 write('README.txt','LOCAL STAGE 0 CONFIGURATION CANDIDATE ONLY. No deployment or activation authorized.\nFunctions use the exact plans under deployment/ with dedicated build/runtime identities, private initial invocation and disabled protocol. The local validator has no execution mode. Do not run a broad firebase Functions deploy for this candidate.\nHosting remains the accepted hash-map overlay, not a full directory deploy. Protected rollback uses rollback/functions and rollback-plan.json with the same explicit accounts/limits; keep canonical rules restrictive and committed student records intact.\nAll-endpoint UID throttling remains unimplemented. Real IAM, build identity, App Check attestation and hosted scaling require separate approvals and acceptance.\n');
 json('preparation.json',{mode:'unfinalized-local-stage0-candidate',acceptedManifestSha256:hash(bytes),productionExecutionEnabled:false,requiredTests:['stage0 unit/plan/packaging/protocol','Auth Functions Firestore integration and browser','pilot policy/quota/recovery','relevant browser regressions'],acceptedArtifactCount:accepted.inventory.length});
 validateCandidate();console.log(JSON.stringify({prepared:true,path:base,manifestGenerated:false}));
}
function finalize(evidencePath){
 validateCandidate();const evidence=JSON.parse(fs.readFileSync(evidencePath));if(evidence.status!=='pass'||evidence.acceptedManifestSha256!=='126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f')throw Error('Passing verification evidence required');
 const accepted=JSON.parse(fs.readFileSync(path.join(acceptedDir,'manifest.json'))),items=inventory(base).filter(x=>x.file!=='manifest.json'&&!x.file.startsWith('verification/'));
 if(evidence.candidateInventorySha256!==hash(Buffer.from(JSON.stringify(items))))throw Error('Candidate changed since verification');
 const changed=items.filter(x=>accepted.inventory.find(y=>y.file===x.file)?.sha256!==x.sha256),removed=accepted.inventory.filter(x=>!items.some(y=>y.file===x.file));
 const sourceFiles=['functions/stage0-gcloud-plan.cjs','functions/prepare-priority3-stage0.cjs','tests/stage0-workflow.test.cjs','tests/stage0-gcloud-packaging.py','tests/stage0-assessment-emulator.cjs','tests/stage0-browser-emulator.cjs','tests/stage0-pilot-checks.cjs','firebase.stage0-emulator.json'].map(file=>({file,sha256:hash(fs.readFileSync(path.join(root,file)))}));
 const m={...accepted,mode:'local-stage0-gcloud-candidate-not-deployed',acceptedOptionAManifestSha256:'126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f',activation:false,productionExecutionEnabled:false,tooling:JSON.parse(fs.readFileSync(path.join(root,'build/google-cloud-cli-592/verified.json'))),sourceFiles,acceptedSourceFiles:accepted.sourceFiles,inventory:items,changesFromAccepted:{changedOrAdded:changed.map(x=>({file:x.file,before:accepted.inventory.find(y=>y.file===x.file)?.sha256||null,after:x.sha256})),removed},verificationEvidenceSha256:hash(fs.readFileSync(evidencePath))};json('manifest.json',m);console.log(JSON.stringify({manifestSha256:hash(fs.readFileSync(path.join(base,'manifest.json'))),artifacts:items.length,changes:m.changesFromAccepted}));
}
if(require.main===module){if(process.argv[2]==='--prepare')prepare();else if(process.argv[2]==='--finalize'&&process.argv[3])finalize(process.argv[3]);else throw Error('Use --prepare or --finalize <local-evidence>');}
module.exports={prepare,finalize};
