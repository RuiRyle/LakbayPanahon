// Operator preparation, read-only. No export/delete or student-facing request endpoint.
const fs=require('node:fs'),path=require('node:path');
const scope=require('../data/student-account-data-scope.json');
function validUid(uid){return typeof uid==='string'&&uid.length>0&&uid.length<=128&&uid.trim()===uid&&!/[\/\u0000-\u001f]/.test(uid)&&uid!=='.'&&uid!=='..';}
async function inspectAccount(uid,{profileExists,listOwned}){
 if(!validUid(uid))throw Error('A valid explicit account UID is required.');
 const present=await profileExists(uid),collections=[];
 for(const name of scope.ownedCollections){
  const rows=await listOwned(name,uid,501);
  if(!Array.isArray(rows)||rows.length>501||rows.some(row=>typeof row.id!=='string'||row.id.includes('/')||row.userId!==uid))throw Error('Inventory returned invalid or foreign ownership data.');
  collections.push({collection:name,count:Math.min(rows.length,500),truncated:rows.length>500});
 }
 return {mode:'read-only-account-inventory',profilePresent:present,collections,complete:collections.every(row=>!row.truncated),
  notes:['Counts only; no names, emails, answer content or chat text are returned.','Firebase Auth identity and any outside provider/host records need a separately verified operator process.','No records were changed or deleted. Shared class/catalog/global counter records are excluded.']};
}
async function main(){
 const args=process.argv.slice(2);
 if(!args.length){console.log(JSON.stringify({mode:'offline-scope-only',...scope},null,2));return;}
 if(args.length!==2||args[0]!=='--inspect'||!validUid(args[1]))throw Error('Use no arguments for offline scope, or --inspect followed by one verified account UID for read-only counts.');
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(path.resolve(__dirname,'..'));if(!account)throw Error('Firebase operator login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
 async function call(url,body){const response=await fetch(url,{headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});if(response.status===404&&!body)return null;const result=await response.json();if(!response.ok)throw Error('Account inventory HTTP '+response.status);return result;}
 const result=await inspectAccount(args[1],{
  profileExists:async uid=>!!await call(base+'/users/'+encodeURIComponent(uid)),
  listOwned:async(name,uid,limit)=>(await call(base+':runQuery',{structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}},select:{fields:[{fieldPath:'userId'}]},limit}})).filter(row=>row.document).map(({document})=>({id:document.name.split('/').at(-1),userId:document.fields?.userId?.stringValue}))
 });
 console.log(JSON.stringify(result,null,2));
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={inspectAccount,validUid};
