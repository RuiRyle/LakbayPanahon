// Dry run by default. Adds only the authored review interval to existing settings.
const fs=require('node:fs'),path=require('node:path');
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original database only.');
 const configured=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/progression-settings.json'),'utf8'));
 const days=configured.reviewAfterDays;
 if(!Number.isSafeInteger(days)||days<1||days>365)throw Error('Invalid reviewAfterDays.');
 const auth=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=auth.getProjectDefaultAccount(path.join(__dirname,'..'));
 if(!account)throw Error('Firebase CLI login required.');
 const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
 const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
 const name=base+'/learningSettings/progression';
 const read=async()=>{const response=await fetch(name,{headers});if(!response.ok)throw Error('Settings read failed: '+response.status);return response.json();};
 const existing=await read();
 if(!existing.fields?.xpPerLevel||!existing.fields?.version)throw Error('Existing progression settings are incomplete.');
 const current=Number(existing.fields.reviewAfterDays?.integerValue);
 console.log(JSON.stringify({project:'lakbaypanahon-1797e',document:'learningSettings/progression',current:Number.isFinite(current)?current:null,planned:days,mode:process.argv.includes('--apply')?'apply':'dry-run'}));
 if(!process.argv.includes('--apply')||current===days)return;
 const folder=path.join(__dirname,'../backups');fs.mkdirSync(folder,{recursive:true});
 const backup=path.join(folder,'return-to-learn-settings-'+Date.now()+'.json');fs.writeFileSync(backup,JSON.stringify(existing,null,2));
 const response=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes:[{update:{name:existing.name,fields:{reviewAfterDays:{integerValue:String(days)}}},updateMask:{fieldPaths:['reviewAfterDays']},currentDocument:{updateTime:existing.updateTime}}]})});
 if(!response.ok)throw Error('Settings update failed: '+response.status+'; backup '+backup);
 const after=await read();if(Number(after.fields?.reviewAfterDays?.integerValue)!==days)throw Error('Settings readback differs; backup '+backup);
 console.log('Published reviewAfterDays='+days+'; verified readback. Backup: '+backup);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
