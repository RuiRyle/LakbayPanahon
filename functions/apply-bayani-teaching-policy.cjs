// One-document, instruction-only update with backup and optimistic concurrency.
const fs=require('node:fs'),path=require('node:path');
const plan=require('../data/bayani-teaching-policy.json');
async function main(){
 if(plan.projectId!=='lakbaypanahon-1797e'||plan.documentPath!=='learningSettings/bayaniAI'||process.env.FIRESTORE_EMULATOR_HOST)throw Error('Unexpected target.');
 if(typeof plan.systemInstruction!=='string'||!plan.systemInstruction.trim())throw Error('Missing teaching instructions.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(path.join(__dirname,'..'));if(!account)throw Error('Firebase login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firestore.googleapis.com/v1/projects/'+plan.projectId+'/databases/(default)/documents';
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 async function call(url,options={}){const response=await fetch(url,{headers,...options});if(!response.ok)throw Error('Firestore HTTP '+response.status+'; no automatic retry.');return response.json();}
 const before=await call(base+'/'+plan.documentPath);
 if(before.fields?.systemInstruction?.stringValue===plan.systemInstruction){console.log('Teaching instructions already match. No write.');return;}
 if(!process.argv.includes('--apply')){console.log('Ready: one instruction field on learningSettings/bayaniAI. Use --apply to publish.');return;}
 const folder=path.join(__dirname,'../backups');fs.mkdirSync(folder,{recursive:true});
 const backup=path.join(folder,'bayani-teaching-policy-'+Date.now()+'.json');
 // Back up the affected field only; omit unrelated configuration and keys.
 fs.writeFileSync(backup,JSON.stringify({path:plan.documentPath,updateTime:before.updateTime,fields:{systemInstruction:before.fields?.systemInstruction||null}},null,2));
 await call(base+':commit',{method:'POST',body:JSON.stringify({writes:[{update:{name:before.name,fields:{systemInstruction:{stringValue:plan.systemInstruction}}},updateMask:{fieldPaths:['systemInstruction']},currentDocument:{updateTime:before.updateTime}}]})});
 const after=await call(base+'/'+plan.documentPath);
 if(after.fields?.systemInstruction?.stringValue!==plan.systemInstruction)throw Error('Instruction readback mismatch.');
 for(const [key,value] of Object.entries(before.fields||{})){if(key!=='systemInstruction'&&JSON.stringify(after.fields[key])!==JSON.stringify(value))throw Error('Another settings field changed: '+key);}
 console.log('Published and verified teaching instructions. Other settings unchanged. Backup: '+path.basename(backup));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
