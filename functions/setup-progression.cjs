// Dry run by default. Initializes missing progression settings and reconciles cached levels only.
const fs=require('node:fs'),path=require('node:path');
const {requireProgressionPolicy,progressionState}=require('./progression-policy');
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Original database only.');
 const auth=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=auth.getProjectDefaultAccount(process.cwd());if(!account)throw new Error('Run firebase login first.');
 const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
 const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
 const nameBase=base.replace('https://firestore.googleapis.com/v1/','');
 async function call(url,body){const response=await fetch(url,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})});if(response.status===404&&!body)return null;const data=await response.json();if(!response.ok)throw new Error('HTTP '+response.status+' '+(data.error?.message||''));return data;}
 let existing=await call(base+'/learningSettings/progression');
 const value=v=>v&&('integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:undefined);
 const policy=requireProgressionPolicy(existing?{xpPerLevel:value(existing.fields.xpPerLevel),version:value(existing.fields.version)}:JSON.parse(fs.readFileSync(path.join(__dirname,'../data/progression-settings.json'),'utf8')));
 const students=(await call(base+':runQuery',{structuredQuery:{from:[{collectionId:'users'}],select:{fields:[{fieldPath:'xp'},{fieldPath:'level'}]},where:{fieldFilter:{field:{fieldPath:'role'},op:'EQUAL',value:{stringValue:'student'}}}}})).filter(row=>row.document).map(row=>row.document);
 const changes=[],invalid=[];
 for(const doc of students){const xp=doc.fields?.xp===undefined?0:value(doc.fields.xp);if(!Number.isSafeInteger(xp)||xp<0){invalid.push(doc.name);continue;}const level=progressionState(xp,policy).level;if(value(doc.fields?.level)!==level)changes.push({doc,level});}
 console.log(JSON.stringify({policy,initializeSettings:!existing,students:students.length,cachedLevelsToReconcile:changes.length,invalidXpRecords:invalid.length}));
 if(invalid.length)throw new Error('Invalid XP records found. No changes made.');
 if(!process.argv.includes('--apply'))return;
 fs.mkdirSync(path.join(__dirname,'../backups'),{recursive:true});
 const backup=path.join(__dirname,'../backups/progression-before-'+Date.now()+'.json');
 fs.writeFileSync(backup,JSON.stringify({settings:existing,students:changes.map(change=>change.doc)},null,2));
 if(!existing){await call(base+':commit',{writes:[{update:{name:nameBase+'/learningSettings/progression',fields:{xpPerLevel:{integerValue:String(policy.xpPerLevel)},version:{integerValue:String(policy.version)}}},currentDocument:{exists:false}}]});existing=await call(base+'/learningSettings/progression');}
 for(let offset=0;offset<changes.length;offset+=400){
   const batch=changes.slice(offset,offset+400);
   // A no-op policy write supplies an update-time precondition for every reconciliation batch.
   const writes=[{update:{name:existing.name,fields:existing.fields},currentDocument:{updateTime:existing.updateTime}},...batch.map(({doc,level})=>({update:{name:doc.name,fields:{level:{integerValue:String(level)}}},updateMask:{fieldPaths:['level']},currentDocument:{updateTime:doc.updateTime}}))];
   await call(base+':commit',{writes});existing=await call(base+'/learningSettings/progression');
 }
 console.log('Progression configured; reconciled '+changes.length+' cached levels. XP unchanged. Backup: '+backup);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
