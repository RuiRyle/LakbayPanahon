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
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original-project check only');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(path.join(__dirname,'..'));if(!account)throw Error('Existing Firebase CLI login required');adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const owner=await student(),other=await student(),key='studentCosmetics/'+owner.uid;
 const equip=(frameId,extra={})=>{touched.add(key);return commit([{update:{name:prefix+'/'+key,fields:fields({frameId,...extra})},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}],owner.token);};
 check(await equip('bamboo'),403,'Level 1 cannot equip Level 3 frame');check(await equip('none'),200,'Level 1 can save the classic frame');
 check(await get(key,owner),200,'owner can read saved frame');check(await get(key,other),403,'another student cannot read cosmetic settings');
 check(await commit([{update:{name:prefix+'/users/'+owner.uid,fields:fields({level:5,xp:400})},updateMask:{fieldPaths:['level','xp']}}],adminToken),200,'temporary fixture level prepared without real learner changes');
 check(await equip('sunburst'),200,'Level 5 can equip earned Golden Sun frame');const saved=await get(key,owner);check(saved,200,'earned frame can be read back');if(saved.data.fields.frameId.stringValue!=='sunburst')throw Error('Saved frame mismatch');
 check(await equip('guardian'),403,'Level 5 cannot equip Level 10 frame');check(await equip('unknown'),403,'unknown frame rejected');check(await equip('none',{xp:999999}),403,'cosmetic preference cannot inflate XP');
 check(await commit([{update:{name:prefix+'/'+key,fields:fields({frameId:'none'})},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}],other.token),403,'another student cannot change the owner frame');
 console.log('PASS: live cosmetic ownership, unlock gates, account persistence and XP isolation; only temporary accounts used');
}
async function cleanup(){if(!adminToken)return;for(const account of accounts){const r=await api('https://identitytoolkit.googleapis.com/v1/projects/'+project+'/accounts:delete',{body:{localId:account.uid},token:adminToken});if(r.status!==200)throw Error('Temporary authentication cleanup failed '+r.status);}if(touched.size){const r=await commit([...touched].map(key=>({delete:prefix+'/'+key})),adminToken);if(r.status!==200)throw Error('Temporary record cleanup failed '+r.status);}console.log('CLEANUP: two temporary accounts, profiles and cosmetic preference removed');}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>cleanup().catch(error=>{console.error(error.message);process.exitCode=1;}));
