// Trusted maintenance for expired images only. Default is dry-run. No profile,
// application or review deletion. Schedule this command in operator automation.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e';
async function main(){
 const apply=process.argv.includes('--purge-expired');
 if(process.argv.slice(2).some(a=>!['--purge-expired','--inspect'].includes(a)))throw Error('Unsupported argument.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token,base=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`,cutoff=new Date(Date.now()-30*86400000).toISOString();
 async function call(url,body){const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw Error('Evidence maintenance HTTP '+response.status);return data;}
 const result=await call(base+':runQuery',{structuredQuery:{select:{fields:['userId','uploadedAt','revision'].map(fieldPath=>({fieldPath}))},from:[{collectionId:'teacherEvidence'}],where:{fieldFilter:{field:{fieldPath:'uploadedAt'},op:'LESS_THAN_OR_EQUAL',value:{timestampValue:cutoff}}},limit:400}});
 const documents=result.filter(row=>row.document).map(row=>row.document);
 for(const document of documents){const uid=document.fields?.userId?.stringValue,uploaded=document.fields?.uploadedAt?.timestampValue;if(!uid||document.name!==`projects/${project}/databases/(default)/documents/teacherEvidence/${uid}`||!uploaded||Date.parse(uploaded)>Date.parse(cutoff)||!document.updateTime)throw Error('Unexpected evidence record; no purge performed.');}
 if(apply&&documents.length)await call(base+':commit',{writes:documents.map(document=>({delete:document.name,currentDocument:{updateTime:document.updateTime}}))});
 const report={mode:apply?'expired-evidence-purge':'expired-evidence-dry-run',checkedAt:new Date().toISOString(),project,cutoff,matched:documents.length,deleted:apply?documents.length:0,moreMayRemain:documents.length===400,profileOrApplicationRecordsChanged:false};
 fs.writeFileSync(path.join(root,'docs/validation/teacher-evidence-maintenance-2026-10-31.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
