// Exact objective-only publication, using the existing CLI auth / Firestore REST process.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{isDeepStrictEqual:equal}=require('node:util');
const {build}=require('./build-mission-objective-wording.cjs'),{encode,decode}=require('./apply-chapter1-mission1-learning-polish.cjs');
const root=path.resolve(__dirname,'..'),planFile=path.join(root,'data/mission-objective-wording-migration.json');
const approved=['chapter9-mission1','chapter9-mission3','chapter9-mission4','chapter10-mission1','chapter10-mission2','chapter10-mission3','chapter10-mission5','chapter11-mission1','chapter12-mission2','chapter12-mission3','chapter14-mission2','chapter14-mission3','chapter14-mission4'];
const unpack=d=>d?Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decode(v)])):null;
function validate(plan){if(!equal(plan,build())||plan.projectId!=='lakbaypanahon-1797e'||!equal(plan.writes.map(w=>w.path).sort(),approved.map(id=>'missions/'+id).sort()))throw Error('Plan differs from reviewed scope');for(const w of plan.writes){if(!equal(Object.keys(w.fields),['learningObjectives'])||!equal(Object.keys(w.expected),['learningObjectives'])||w.fields.learningObjectives.length!==5||w.fields.learningObjectives.some(t=>typeof t!=='string'||/[?\uFFFD]/.test(t)))throw Error('Invalid objective-only patch');}return true;}
function compare(write,document){const current=unpack(document);if(!current||!document.updateTime)throw Error('Missing existing document: '+write.path);if(equal(current.learningObjectives,write.fields.learningObjectives))return 'already-applied';if(!equal(current.learningObjectives,write.expected.learningObjectives))throw Error('CONFLICT: '+write.path+' learningObjectives differ from the approved original; nothing committed.');return 'pending';}
function patch(write,document){return {update:{name:document.name,fields:{learningObjectives:encode(write.fields.learningObjectives)}},updateMask:{fieldPaths:['learningObjectives']},currentDocument:{updateTime:document.updateTime}};}
async function main(){const mode=process.argv[2]||'--check-local';if(process.argv.length>3||!['--check-local','--dry-run-live','--apply'].includes(mode))throw Error('Use --check-local, --dry-run-live or --apply');const plan=JSON.parse(fs.readFileSync(planFile,'utf8'));validate(plan);if(mode==='--check-local'){console.log('Validated 13 missions / 65 objectives; only learningObjectives may be updated.');return;}
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Refusing production publication while emulator environment is set');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Existing Firebase CLI login required');const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firestore.googleapis.com/v1/projects/'+plan.projectId+'/databases/(default)/documents';
 async function call(url,body){const response=await fetch(url,{headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});if(response.status===404)return null;if(!response.ok)throw Error('Firestore HTTP '+response.status+'; no automatic retry');return response.json();}
 const read=()=>Promise.all(plan.writes.map(w=>call(base+'/'+w.path)));
 const before=await read(),states=plan.writes.map((w,i)=>compare(w,before[i]));
 const hash=crypto.createHash('sha256').update(fs.readFileSync(planFile)).digest('hex');
 const backup={projectId:plan.projectId,createdAt:new Date().toISOString(),planHash:hash,scope:'13 mission documents only; recover learningObjectives with an objective-only update mask',documents:plan.writes.map((w,i)=>({path:w.path,originalObjectives:unpack(before[i]).learningObjectives,document:before[i]}))};
 const backupFile=path.join(root,'backups','mission-objective-wording-'+Date.now()+'.json');fs.writeFileSync(backupFile,JSON.stringify(backup,null,2)+'\n',{flag:'wx'});
 if(!equal(JSON.parse(fs.readFileSync(backupFile,'utf8')),backup))throw Error('Backup readback failed; publication stopped');
 const pending=plan.writes.flatMap((w,i)=>states[i]==='pending'?[patch(w,before[i])]:[]);
 const report={mode,projectId:plan.projectId,checkedAt:new Date().toISOString(),documents:13,objectives:65,pending:pending.length,backup:path.relative(root,backupFile),backupVerified:true,planHash:hash};
 if(mode!=='--apply'){fs.writeFileSync(path.join(root,'docs/validation/priority-1-objective-preflight-2026-11-07.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));return;}
 // One atomic commit; a concurrent document edit fails its updateTime precondition.
 if(pending.length)await call(base+':commit',{writes:pending});
 const after=await read();for(const [i,w]of plan.writes.entries()){if(compare(w,after[i])!=='already-applied')throw Error('Publication readback mismatch: '+w.path);const old=unpack(before[i]),current=unpack(after[i]);delete old.learningObjectives;delete current.learningObjectives;if(!equal(old,current))throw Error('Unrelated field changed during publication: '+w.path);}
 const evidence={...report,mode:'published-and-read-back',publishedAt:new Date().toISOString(),changedDocuments:pending.length,unrelatedMissionFieldsUnchanged:true,learnerRecordsWritten:false};
 fs.writeFileSync(path.join(root,'docs/validation/priority-1-objective-publication-2026-11-07.json'),JSON.stringify(evidence,null,2)+'\n');
 fs.writeFileSync(path.join(root,'docs/validation/priority-1-objective-live-readback-2026-11-07.json'),JSON.stringify({projectId:plan.projectId,readAt:new Date().toISOString(),missions:after.map((d,i)=>({id:approved.includes(plan.writes[i].path.split('/')[1])?plan.writes[i].path.split('/')[1]:null,...unpack(d)}))},null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
}
module.exports={validate,compare,patch,unpack};if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
