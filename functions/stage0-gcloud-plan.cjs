// Local-only intent generator/validator. Deliberately has NO execution mode.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'build/priority3-stage0-release');
const project='lakbaypanahon-1797e',region='asia-southeast1',runtimeAccount=`assessment-runtime@${project}.iam.gserviceaccount.com`,buildAccount=`projects/${project}/serviceAccounts/assessment-build@${project}.iam.gserviceaccount.com`;
const names=['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'];
const relativeFiles=['index.js','student-assessment.js','assessment-callables.js','student-rewards.js','progression-policy.js','package.json','package-lock.json',...['daily-policy','mission-assessment','mission-review','practice-review','progression-policy'].map(n=>'assessment-shared/'+n+'.mjs')];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function createPlan(rollback=false){return{mode:'local-plan-only-no-execution',productionExecutionEnabled:false,project,region,cliVersion:'592.0.0',buildAccount,runtimeAccount,invocation:'platform-private-pending-separate-IAM-approval',protocol:{enabled:false,protocolVersion:1,attemptTtlSeconds:7200,perMinuteAttempts:3,perStudentDailyAttempts:60},operations:names.map(name=>({name,argv:['functions','deploy',name,'--gen2','--project='+project,'--region='+region,'--runtime=nodejs22','--entry-point='+name,'--source='+ (rollback?'rollback/functions':'functions'),'--build-service-account='+buildAccount,'--service-account='+runtimeAccount,'--max-instances=2','--min-instances=0','--concurrency=8','--cpu=1','--memory=256Mi','--timeout=60s','--trigger-http','--no-allow-unauthenticated','--ingress-settings=all','--security-level=secure-always','--update-labels=deployment-callable=true,lakbay-assessment-workflow=reviewed-gcloud','--env-vars-file=deployment/runtime-env.json','--ignore-file=.gcloudignore']}))};}
function validatePlan(plan,rollback=false){const expected=createPlan(rollback);if(JSON.stringify(plan)!==JSON.stringify(expected))throw Error('Deployment intent differs from exact reviewed pilot configuration');return true;}
function inventory(dir){const rows=[];function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(e.name==='node_modules')continue;const full=path.join(folder,e.name);if(e.isSymbolicLink())throw Error('Symlink in release');if(e.isDirectory())walk(full);else rows.push({file:path.relative(dir,full).replaceAll('\\','/'),sha256:hash(fs.readFileSync(full))});}}walk(dir);return rows.sort((a,b)=>a.file.localeCompare(b.file));}
function validateCandidate(dir=base){
 const policy=JSON.parse(fs.readFileSync(path.join(dir,'policy/disabled-proposal.json')));if(JSON.stringify(policy)!==JSON.stringify(createPlan().protocol))throw Error('Policy mismatch');
 const env=JSON.parse(fs.readFileSync(path.join(dir,'deployment/runtime-env.json')));if(JSON.stringify(env)!==JSON.stringify({FIREBASE_CONFIG:JSON.stringify({projectId:project,storageBucket:project+'.firebasestorage.app'}),FUNCTION_REGION:region}))throw Error('Runtime environment mismatch');
 for(const rollback of [false,true]){
  validatePlan(JSON.parse(fs.readFileSync(path.join(dir,'deployment',rollback?'rollback-plan.json':'deploy-plan.json'))),rollback);
  const folder=path.join(dir,rollback?'rollback/functions':'functions'),files=inventory(folder).map(x=>x.file),allowed=rollback?['index.js','package.json','package-lock.json','.gcloudignore']:relativeFiles.concat('.firebaseignore','.gcloudignore');
  if(JSON.stringify([...files].sort())!==JSON.stringify([...allowed].sort()))throw Error('Unexpected packaged files');
  const source=fs.readFileSync(path.join(folder,'index.js'),'utf8');
  for(const text of ['maxInstances:2','minInstances:0','concurrency:8','cpu:1','memory:\'256MiB\'','timeoutSeconds:60',runtimeAccount,"enforceAppCheck:process.env.FUNCTIONS_EMULATOR!=='true'"])if(!source.includes(text))throw Error('SDK runtime/security metadata mismatch: '+text);
  if(!rollback&&(source.match(/exports\.\w+=onCall/g)||[]).length!==4)throw Error('Endpoint inventory changed');
 }
 const accepted=JSON.parse(fs.readFileSync(path.join(root,'build/priority3-release/manifest.json')));
 if(hash(fs.readFileSync(path.join(root,'build/priority3-release/manifest.json')))!=='126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f')throw Error('Accepted manifest changed');
 for(const p of relativeFiles.filter(x=>x!=='index.js'))if(hash(fs.readFileSync(path.join(dir,'functions',p)))!==accepted.inventory.find(x=>x.file==='functions/'+p)?.sha256)throw Error('Non-configuration Functions payload changed: '+p);
 for(const p of ['rules/firestore.rules','rollback/firestore.rules','hosting/config.json','hosting/file-map.json'])if(hash(fs.readFileSync(path.join(dir,p)))!==accepted.inventory.find(x=>x.file===p)?.sha256)throw Error('Protected artifact changed: '+p);
 const mutable=new Set(['functions/index.js','rollback/functions/index.js','policy/disabled-proposal.json','firebase.release.json','rollback/firebase.json','README.txt']);
 for(const item of accepted.inventory)if(!mutable.has(item.file)&&hash(fs.readFileSync(path.join(dir,item.file)))!==item.sha256)throw Error('Retained artifact changed: '+item.file);
 for(const file of ['functions/index.js','rollback/functions/index.js']){
  const original=fs.readFileSync(path.join(root,'build/priority3-release',file),'utf8');
  if(fs.readFileSync(path.join(dir,file),'utf8')!==original.replace('maxInstances:10',"maxInstances:2,minInstances:0,concurrency:8,cpu:1,memory:'256MiB',timeoutSeconds:60"))throw Error('Change beyond approved SDK configuration: '+file);
 }
 for(const item of accepted.sourceFiles)if(hash(fs.readFileSync(path.join(root,item.file)))!==item.sha256)throw Error('Accepted source changed: '+item.file);
 const added=new Set(['deployment/deploy-plan.json','deployment/rollback-plan.json','deployment/runtime-env.json','deployment/identity-binding.json','functions/.gcloudignore','rollback/functions/.gcloudignore','preparation.json','manifest.json']);
 for(const item of inventory(dir))if(!accepted.inventory.some(x=>x.file===item.file)&&!added.has(item.file))throw Error('Unreviewed additional artifact: '+item.file);
 return{valid:true,mode:'local-validation-only',fourEndpoints:names,protocolEnabled:false};
}
if(require.main===module){if(process.argv.slice(2).some(x=>x!=='--validate'))throw Error('No production execution mode exists; only --validate is allowed');console.log(JSON.stringify(validateCandidate()));}
module.exports={createPlan,validatePlan,validateCandidate,inventory,relativeFiles,base,hash};
