// Recover only the Chapter 5 temporary student left by an interrupted live test.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
async function main(){
 const recovery=path.resolve(process.argv[2]||'');
 const parent=path.dirname(recovery);
 if(path.basename(recovery)!=='test-account.json'||!parent.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(parent).startsWith('lakbay-chapter5-challenge-live-'))throw Error('Expected a Chapter 5 test recovery file under the temporary directory.');
 const {uid,email}=JSON.parse(fs.readFileSync(recovery,'utf8'));
 if(!/^[A-Za-z0-9]{20,40}$/.test(uid)||!/^desktop-[0-9a-f-]{36}@example\.com$/.test(email))throw Error('Recovery file does not identify an expected temporary student.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(path.join(__dirname,'..'));
 if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const authBase='https://identitytoolkit.googleapis.com/v1/projects/lakbaypanahon-1797e/accounts';
 const lookup=await fetch(authBase+':lookup',{method:'POST',headers,body:JSON.stringify({localId:[uid]})});
 if(!lookup.ok)throw Error('Temporary Auth lookup failed: '+lookup.status);
 const users=(await lookup.json()).users||[];
 if(users.length>1||users[0]&&users[0].email!==email)throw Error('Auth identity does not match the temporary recovery record.');
 if(users.length){
  const deleted=await fetch(authBase+':delete',{method:'POST',headers,body:JSON.stringify({localId:uid})});
  if(!deleted.ok)throw Error('Temporary Auth deletion failed: '+deleted.status);
  console.log('Removed temporary Auth account; continuing owned Firestore cleanup.');
 }
 const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
 const names=[];
 for(const name of ['studentProgress','studentQuizAttempts','studentPracticeProgress','studentReviewEvents','studentLearningDrafts','studentChapterProgress','studentDailyChallenges','studentArtifacts','studentBadges','studentEvidenceJournal']){
  const response=await fetch(base+':runQuery',{method:'POST',headers,body:JSON.stringify({structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}}}})});
  if(!response.ok)throw Error('Owned Firestore cleanup pending: '+response.status+'; keep recovery file '+recovery);
  for(const row of await response.json()){
   const document=row.document;if(!document)continue;
   if(document.fields?.userId?.stringValue!==uid||!document.name.startsWith('projects/lakbaypanahon-1797e/databases/(default)/documents/'+name+'/'))throw Error('Owned document check failed.');
   names.push(document.name);
  }
 }
 names.push('projects/lakbaypanahon-1797e/databases/(default)/documents/users/'+uid);
 if(names.length>500)throw Error('Too many owned documents for one cleanup batch.');
 const result=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes:names.map(name=>({delete:name}))})});
 if(!result.ok)throw Error('Owned Firestore deletion pending: '+result.status+'; keep recovery file '+recovery);
 fs.rmSync(recovery);
 console.log('Removed '+names.length+' owned Firestore documents and the recovery file.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
