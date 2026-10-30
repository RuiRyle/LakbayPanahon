// Live smoke test with a temporary account and temporary catalog entry, both removed afterward.
const fs=require('node:fs'),path=require('node:path'),{randomUUID,randomBytes}=require('node:crypto');
const root=path.join(__dirname,'..');
const apiKey=fs.readFileSync(path.join(root,'js/firebase-config.js'),'utf8').match(/apiKey:\s*"([^"]+)"/)[1];
const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
const nameBase=base.replace('https://firestore.googleapis.com/v1/','');
const encode=value=>typeof value==='string'?{stringValue:value}:typeof value==='boolean'?{booleanValue:value}:{integerValue:String(value)};
const fields=data=>Object.fromEntries(Object.entries(data).map(([key,value])=>[key,encode(value)]));
let account,adminToken,tempAvatar;const touched=new Set();
async function request(url,body,token,denied=false){
 const response=await fetch(url,{headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 if(denied){if(response.status!==403)throw new Error('Expected permission denial; got HTTP '+response.status);return;}
 const data=await response.json();if(!response.ok)throw new Error('HTTP '+response.status+' '+(data.error?.message||''));return data;
}
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Original Firebase only.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const cliAccount=cli.getProjectDefaultAccount(root);adminToken=(await cli.getAccessToken(cliAccount.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const email='avatar-test-'+randomUUID()+'@example.com',password=randomBytes(24).toString('hex');
 account=await request('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+apiKey,{email,password,returnSecureToken:true});
 const uid=account.localId,userPath='users/'+uid;tempAvatar='avatar-test-'+uid;
 touched.add(userPath);touched.add('avatars/'+tempAvatar);
 await request(base+':commit',{writes:[{update:{name:nameBase+'/'+userPath,fields:fields({firstName:'Avatar',lastName:'TemporaryTest',email,role:'student',status:'active'})},currentDocument:{exists:false},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]}]},account.idToken);
 // Read the real catalogs and owner-scoped progress to verify the fresh-student dashboard action.
 const decode=v=>'stringValue'in v?v.stringValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'booleanValue'in v?v.booleanValue:'timestampValue'in v?{toMillis:()=>Date.parse(v.timestampValue)}:null;
 const names=['chapters','eras','missions','chapterChallenges','studentChapterProgress','studentProgress','studentQuizAttempts'];
 const records=await Promise.all(names.map(async name=>{
   const structuredQuery={from:[{collectionId:name}],...(name.startsWith('student')?{where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:uid}}}}:{})};
   const result=await request(base+':runQuery',{structuredQuery},account.idToken);
   return result.filter(row=>row.document).map(({document})=>({...Object.fromEntries(Object.entries(document.fields||{}).map(([key,value])=>[key,decode(value)])),id:document.name.split('/').at(-1)}));
 }));
 const vm=require('node:vm'),journeyContext=vm.createContext({});
 vm.runInContext(fs.readFileSync(path.join(root,'js/student-journey.js'),'utf8').replace(/export /g,''),journeyContext);
 const [chapters,eras,missions,challenges,chapterProgress,missionProgress,attempts]=records;
 const journey=journeyContext.resolveStudentJourney({userId:uid,chapters,eras,missions,challenges,chapterProgress,missionProgress,attempts});
 if(journey.kind!=='mission'||journey.started||!journey.mission)throw new Error('Fresh live student has no Start Learning action');
 const catalog=await request(base+':runQuery',{structuredQuery:{from:[{collectionId:'avatars'}]}},account.idToken);
 const choice=catalog.find(row=>row.document?.fields?.status?.stringValue==='active'&&row.document.fields.kind?.stringValue==='emoji')?.document;
 if(!choice)throw new Error('No active emoji avatar available');const choiceId=choice.name.split('/').at(-1);
 const save=(data,denied=false,setupField=null)=>request(base+':commit',{writes:[{update:{name:nameBase+'/'+userPath,fields:fields(data)},updateMask:{fieldPaths:Object.keys(data)},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'},...(setupField?[{fieldPath:setupField,setToServerValue:'REQUEST_TIME'}]:[])]}]},account.idToken,denied);
 await save({firstName:'Avatar'},false,'profileSetupDismissedAt');
 await save({profileSetupCompletedAt:true},true);
 await save({firstName:'Saved Avatar',avatarId:choiceId},false,'profileSetupCompletedAt');
 await save({profileSetupDismissedAt:false},true);
 await save({profileSetupCompletedAt:false},true);
 await save({avatarId:'unlisted-avatar'},true);
 await save({role:'admin'},true);await save({xp:999},true);
 await request(base+':commit',{writes:[{update:{name:nameBase+'/avatars/'+tempAvatar,fields:fields({name:'Temporary catalog test',kind:'emoji',icon:'X',status:'active',order:999})},currentDocument:{exists:false}}]},adminToken);
 await save({avatarId:tempAvatar});
 await request(base+':commit',{writes:[{update:{name:nameBase+'/avatars/'+tempAvatar,fields:fields({status:'inactive'})},updateMask:{fieldPaths:['status']}}]},adminToken);
 await save({firstName:'Preserved Avatar'});
 await save({avatarId:choiceId});await save({avatarId:tempAvatar},true);
 const signedIn=await request('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+apiKey,{email,password,returnSecureToken:true});
 const profile=await request(base+'/'+userPath,null,signedIn.idToken);
 if(!profile.fields.profileSetupCompletedAt?.timestampValue||!profile.fields.profileSetupDismissedAt?.timestampValue)throw new Error('Setup state did not persist');
 if(profile.fields.firstName.stringValue!=='Preserved Avatar'||profile.fields.avatarId.stringValue!==choiceId||profile.fields.role.stringValue!=='student'||profile.fields.xp)throw new Error('Profile persistence or protected fields mismatch');
 console.log('PASS: live catalog reads, active selection, denied invalid/inactive choices, preserved retired choice, protected fields, setup timestamps, fresh sign-in persistence and a live-catalog Start Learning action.');
}
async function cleanup(){
 if(!account)return;
 const allowed=new Set(['users/'+account.localId,'avatars/'+tempAvatar]);
 if([...touched].some(key=>!allowed.has(key)))throw new Error('Invalid cleanup path');
 if(touched.size)await request(base+':commit',{writes:[...touched].map(key=>({delete:nameBase+'/'+key}))},adminToken);
 await request('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+apiKey,{idToken:account.idToken});
 console.log('Removed temporary account, profile and catalog test entry.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>cleanup().catch(error=>{console.error('Cleanup failed: '+error.message);process.exitCode=1;}));
