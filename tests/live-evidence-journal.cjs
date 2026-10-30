// Explicit original-project permission check; all fixtures and temporary students are removed.
const fs=require('fs'),path=require('path'),{randomUUID,randomBytes,randomInt}=require('crypto');
const project='lakbaypanahon-1797e',base='https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents',prefix=base.replace('https://firestore.googleapis.com/v1/','');
const apiKey=fs.readFileSync(path.join(__dirname,'../js/firebase-config.js'),'utf8').match(/apiKey:\s*"([^"]+)"/)[1];
const encode=v=>typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:v?.timestamp?{timestampValue:v.timestamp}:{integerValue:String(v)};
const fields=obj=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,encode(v)]));
let adminToken;const accounts=[],touched=new Set(),classId='dev-class-'+randomUUID(),assignmentId=classId+'_published',draftId=classId+'_draft',code=Array.from({length:12},()=> 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[randomInt(36)]).join('');
async function api(url,{body,token,method=body?'POST':'GET'}={}){const response=await fetch(url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:response.status,data:await response.json()};}
const commit=(writes,token)=>api(base+':commit',{body:{writes},token});
async function seed(key,data){const r=await commit([{update:{name:prefix+'/'+key,fields:fields(data)},currentDocument:{exists:false}}],adminToken);if(r.status!==200)throw Error('Fixture creation failed '+r.status);touched.add(key);}
function check(result,status,label){if(result.status!==status)throw Error(label+': expected '+status+', received '+result.status+' '+(result.data.error?.message||''));console.log('PASS: '+label);}
async function student(){const result=await api('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+apiKey,{body:{email:'class-test-'+randomUUID()+'@example.com',password:randomBytes(24).toString('hex'),returnSecureToken:true}});check(result,200,'temporary student sign-up');const account={uid:result.data.localId,token:result.data.idToken};accounts.push(account);await seed('users/'+account.uid,{role:'student',status:'active',firstName:'Temporary',lastName:'ClassTest',email:result.data.email});return account;}
const get=(key,student)=>api(base+'/'+key,{token:student.token});
function membership(student,extra={}){const key='classMembers/'+student.uid+'_'+classId;touched.add(key);return{update:{name:prefix+'/'+key,fields:fields({userId:student.uid,classId,joinCode:code,status:'active',...extra})},updateTransforms:[{fieldPath:'joinedAt',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:false}};}
async function main(){if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only');const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));const a=cli.getProjectDefaultAccount(path.join(__dirname,'..'));adminToken=(await cli.getAccessToken(a.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;const owner=await student(),other=await student();const sceneId='prologue-mission1-scene1';const key='studentEvidenceJournal/'+owner.uid+'_'+sceneId+'_0';touched.add(key);
const entry={userId:owner.uid,chapterId:'era1-prologue',missionId:'prologue-mission1',sceneId,clueIndex:0};
const write=(overrides={},name=key)=>({update:{name:prefix+'/'+name,fields:fields({...entry,...overrides})},updateTransforms:[{fieldPath:'savedAt',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:false}});
check(await get(key,owner),404,'missing own bookmark can be checked for idempotent save');
check(await commit([write()],other.token),403,'another student cannot create an owner bookmark');
const invalid='studentEvidenceJournal/'+owner.uid+'_'+sceneId+'_999';touched.add(invalid);check(await commit([write({clueIndex:999},invalid)],owner.token),403,'out-of-range clue rejected');
check(await commit([write({xp:100})],owner.token),403,'reward fields rejected');
check(await commit([write()],owner.token),200,'student can save an authored clue');
check(await get(key,owner),200,'owner can read discovery');check(await get(key,other),403,'another student cannot read discovery');
const scoped={structuredQuery:{from:[{collectionId:'studentEvidenceJournal'}],where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:owner.uid}}}}};check(await api(base+':runQuery',{body:scoped,token:owner.token}),200,'owner-scoped journal query works');
check(await api(base+':runQuery',{body:{structuredQuery:{from:[{collectionId:'studentEvidenceJournal'}]}},token:owner.token}),403,'unscoped journal queries rejected');
check(await commit([{update:{name:prefix+'/'+key,fields:fields({...entry,clueIndex:1})},updateMask:{fieldPaths:['clueIndex']}}],owner.token),403,'saved references cannot be rewritten');
check(await commit([{delete:prefix+'/'+key}],other.token),403,'another student cannot delete discovery');check(await commit([{delete:prefix+'/'+key}],owner.token),200,'owner can remove discovery');
console.log('PASS: original-project journal permissions verified.');
}
async function cleanup(){if(!adminToken)return;if(touched.size){const r=await commit([...touched].map(key=>({delete:prefix+'/'+key})),adminToken);if(r.status!==200)throw Error('Fixture cleanup failed '+r.status);}for(const account of accounts){const r=await api('https://identitytoolkit.googleapis.com/v1/projects/'+project+'/accounts:delete',{body:{localId:account.uid},token:adminToken});if(r.status!==200)throw Error('Temporary authentication cleanup failed '+r.status);}console.log('Removed temporary journal records and student accounts.');}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>cleanup().catch(error=>{console.error(error.message);process.exitCode=1;}));
