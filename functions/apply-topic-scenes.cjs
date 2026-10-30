// Original-project curriculum tags only. Dry run unless --apply is supplied.
const fs=require('fs'),path=require('path');
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
 const plan=require('../data/topic-scene-mapping.json');if(plan.projectId!=='lakbaypanahon-1797e')throw Error('Unexpected project.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(path.join(__dirname,'..'));if(!account)throw Error('Firebase login required.');const token=await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 const base='https://firestore.googleapis.com/v1/projects/'+plan.projectId+'/databases/(default)/documents',headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
 async function call(url,body){const r=await fetch(url,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error('Firestore '+r.status+': '+(data.error?.message||''));return data;}
 const writes=[],before=[];
 for(const item of plan.writes){if(!/^storyScenes\/[^/]+$/.test(item.path)||!item.reviewTopics.length||item.reviewTopics.some(x=>typeof x!=='string'||!x.trim())||new Set(item.reviewTopics).size!==item.reviewTopics.length)throw Error('Invalid mapping.');const d=await call(base+'/'+item.path);if(d.fields.missionId?.stringValue!==item.missionId||d.fields.status?.stringValue!=='active')throw Error('Scene no longer matches '+item.path);const existing=(d.fields.reviewTopics?.arrayValue?.values||[]).map(v=>v.stringValue);if(JSON.stringify(existing)===JSON.stringify(item.reviewTopics))continue;if(d.updateTime!==item.expectedUpdateTime)throw Error('Scene changed since content review: '+item.path);before.push(d);writes.push({update:{name:d.name,fields:{reviewTopics:{arrayValue:{values:item.reviewTopics.map(stringValue=>({stringValue}))}}}},updateMask:{fieldPaths:['reviewTopics']},currentDocument:{updateTime:d.updateTime}});}
 console.log(JSON.stringify({project:plan.projectId,scenesToTag:writes.length,mode:process.argv.includes('--apply')?'apply':'dry-run'}));if(!process.argv.includes('--apply')||!writes.length)return;
 const folder=path.join(__dirname,'../backups');fs.mkdirSync(folder,{recursive:true});const backup=path.join(folder,'topic-scenes-'+Date.now()+'.json');fs.writeFileSync(backup,JSON.stringify(before,null,2));
 await call(base+':commit',{writes});
 for(const item of plan.writes){const d=await call(base+'/'+item.path);const actual=(d.fields.reviewTopics?.arrayValue?.values||[]).map(v=>v.stringValue);if(JSON.stringify(actual)!==JSON.stringify(item.reviewTopics))throw Error('Readback failed '+item.path);}
 console.log('Verified all scene tags. Backup: '+backup);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
