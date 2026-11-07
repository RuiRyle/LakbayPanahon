// Explicit owner-requested development account. No real credential review is claimed.
// Password is generated in memory and printed once, never written to repository files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e';
async function main(){
 if(!process.argv.includes('--create'))throw Error('Use --create for the explicitly requested dedicated teacher account.');
 const helper=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=helper.getProjectDefaultAccount(root);
 const token=(await helper.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const config=fs.readFileSync(path.join(root,'js/firebase-config.js'),'utf8');
 const key=config.match(/apiKey:\s*"([^"]+)"/)?.[1];if(!key)throw Error('Project configuration missing.');
 const email='teacher.owner.'+crypto.randomBytes(5).toString('hex')+'@example.com';
 const password='Lakbay!'+crypto.randomBytes(15).toString('base64url')+'9a';
 async function call(url,body,bearer=false){
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(bearer?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Account provisioning HTTP '+response.status+' (no automatic retry).');
  return response.json();
 }
 let uid;
 try{
  const created=await call('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+key,{email,password,returnSecureToken:true});uid=created.localId;
  await call('https://identitytoolkit.googleapis.com/v1/projects/'+project+'/accounts:update',{localId:uid,emailVerified:true},true);
  const encode=v=>typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:{integerValue:String(v)};
  const eventId='owner-provision-'+crypto.randomUUID();
  const reason='Project owner requested direct teacher dashboard access for development. No professional credentials or email ownership were independently reviewed.';
  const docs=[['users/'+uid,{firstName:'Project',middleName:'',lastName:'Teacher',email,role:'teacher',status:'active',teacherVerifiedRevision:1,teacherAccessType:'facilitator',teacherVerificationReviewId:eventId}],['teacherApplications/'+uid,{userId:uid,email,emailVerified:true,revision:1,status:'approved',applicantType:'facilitator',legalName:'Project Teacher',institution:'',locality:'',roleTitle:'Project development account',officialWebsite:'',workEmail:'',prcNumber:'',sponsorName:'',sponsorContact:'',statement:reason,acknowledged:true,evidenceRevision:0,evidenceName:'',decisionReason:reason,reviewId:eventId,reviewedBy:'trusted-owner-provisioning'}],['teacherApplicationReviews/'+eventId,{userId:uid,actorId:'trusted-owner-provisioning',revision:1,applicantType:'facilitator',decision:'approved',reason,affiliationReference:'Owner-directed development access; no affiliation claimed.',credentialReference:'No professional credential verification claimed.'}]];
  const base='projects/'+project+'/databases/(default)/documents/';
  await call('https://firestore.googleapis.com/v1/'+base.slice(0,-1)+':commit',{writes:docs.map(([p,data])=>({update:{name:base+p,fields:{...Object.fromEntries(Object.entries(data).map(([k,v])=>[k,encode(v)])),...(p.startsWith('teacherApplications/')?{prcExpiresAt:{nullValue:null},evidenceUploadedAt:{nullValue:null}}:{}),...(p.startsWith('teacherApplicationReviews/')?{checks:{mapValue:{fields:Object.fromEntries(['identity','affiliation','prc','endorsement'].map(k=>[k,{booleanValue:false}]))}}}:{})}},currentDocument:{exists:false},updateTransforms:(p.startsWith('teacherApplications/')?['updatedAt','reviewedAt']:p.startsWith('users/')?['createdAt','updatedAt']:['createdAt']).map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}))},true);
  const login=await call('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+key,{email,password,returnSecureToken:true});
  const lookup=await call('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+key,{idToken:login.idToken});
  if(lookup.users?.[0]?.emailVerified!==true)throw Error('Account verification state missing.');
  for(const p of ['users/'+uid,'teacherApplications/'+uid]){
   const r=await fetch('https://firestore.googleapis.com/v1/'+base+p,{headers:{Authorization:'Bearer '+login.idToken},signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw Error('Profile readback HTTP '+r.status);
   const d=(await r.json()).fields;
   if(p.startsWith('users/')?d.status.stringValue!=='active'||d.teacherVerifiedRevision.integerValue!=='1':d.status.stringValue!=='approved'||d.revision.integerValue!=='1')throw Error('Eligibility readback mismatch.');
  }
  console.log(JSON.stringify({email,password,uid,status:'Login and dashboard eligibility readback verified',purpose:'Persistent owner development account; not a verified professional credential'},null,2));
 }catch(e){if(uid)console.error('Created account UID for recovery: '+uid);throw e;}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
