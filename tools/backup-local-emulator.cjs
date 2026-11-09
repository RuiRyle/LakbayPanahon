// New snapshots only; never overwrites an earlier backup or calls a cloud API.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),parent=path.join(root,'build/local-backups');
async function main(){
 const hub=await fetch('http://127.0.0.1:4400/emulators',{signal:AbortSignal.timeout(3000)}).then(r=>r.json());
 if(hub.auth?.port!==9099||hub.firestore?.port!==8180)throw Error('Expected local Auth/Firestore session is not running.');
 fs.mkdirSync(parent,{recursive:true});
 const target=path.join(parent,new Date().toISOString().replace(/[:.]/g,'-'));
 if(fs.existsSync(target))throw Error('Backup already exists; refusing overwrite.');
 const response=await fetch('http://127.0.0.1:4400/_admin/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:target,initiatedBy:'lakbay-local-backup',targets:['auth','firestore']}),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('Local export failed: '+await response.text());
 const metadata=JSON.parse(fs.readFileSync(path.join(target,'firebase-export-metadata.json'),'utf8'));
 if(!metadata.auth||!metadata.firestore)throw Error('Incomplete local export.');
 fs.writeFileSync(path.join(target,'lakbay-local-backup.json'),JSON.stringify({projectId:'demo-lakbay-local',createdAt:new Date().toISOString(),secured:true},null,2),{flag:'wx'});
 console.log('Local backup: '+path.relative(root,target));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
