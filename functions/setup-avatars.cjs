// Creates missing avatar catalog entries. Existing catalog entries and student profiles are preserved.
const fs=require('node:fs'),path=require('node:path');
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Original database only.');
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/avatar-catalog.json'),'utf8'));
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(process.cwd());if(!account)throw new Error('Run firebase login first.');
 const token=await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
 const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
 const nameBase=base.replace('https://firestore.googleapis.com/v1/','');
 const encode=value=>value===null?{nullValue:null}:typeof value==='string'?{stringValue:value}:typeof value==='boolean'?{booleanValue:value}:{integerValue:String(value)};
 const writes=[],backup=[];
 for(const entry of entries){
   const {id,...data}=entry;
   if(!id||id.includes('/')||!data.name||!['emoji','initials'].includes(data.kind)||data.status!=='active')throw new Error('Invalid bootstrap avatar.');
   const response=await fetch(base+'/avatars/'+id,{headers});
   if(response.ok){backup.push(await response.json());continue;}
   if(response.status!==404)throw new Error('Avatar read HTTP '+response.status);
   writes.push({update:{name:nameBase+'/avatars/'+id,fields:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,encode(value)]))},currentDocument:{exists:false}});
 }
 console.log(JSON.stringify({createAvatars:writes.length,preserveExistingAvatars:backup.length,studentProfilesChanged:0}));
 if(!process.argv.includes('--apply'))return;
 fs.mkdirSync(path.join(__dirname,'../backups'),{recursive:true});
 const backupPath=path.join(__dirname,'../backups/avatars-before-'+Date.now()+'.json');
 fs.writeFileSync(backupPath,JSON.stringify({existing:backup,createdDocumentNames:writes.map(write=>write.update.name)},null,2));
 if(writes.length){const response=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes})});if(!response.ok)throw new Error('Catalog commit HTTP '+response.status+' '+await response.text());}
 console.log('Avatar catalog initialized. Backup: '+backupPath);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
