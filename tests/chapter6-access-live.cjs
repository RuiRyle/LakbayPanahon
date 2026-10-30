// Explicit live era-access test with seeded temporary completion records: uses one temporary account and deletes its records afterward.
// No emulator or existing student account is used.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {randomUUID,randomBytes}=require('node:crypto');
const root=path.join(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
const config=fs.readFileSync(path.join(root,'js/firebase-config.js'),'utf8');
const apiKey=config.match(/apiKey:\s*"([^"]+)"/)[1];
const base='https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents';
const fullBase=base.replace('https://firestore.googleapis.com/v1/','');
const encode=value=>value===null?{nullValue:null}:typeof value==='string'?{stringValue:value}:typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value}:Array.isArray(value)?{arrayValue:{values:value.map(encode)}}:{mapValue:{fields:fields(value)}};
const fields=value=>Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encode(v)]));
const decode=v=>'stringValue'in v?v.stringValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'booleanValue'in v?v.booleanValue:'timestampValue'in v?{toMillis:()=>Date.parse(v.timestampValue)}:'arrayValue'in v?(v.arrayValue.values||[]).map(decode):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,val])=>[k,decode(val)])):null;
const decodeDoc=doc=>Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,decode(v)]));
let identity,adminToken;const touched=new Set();
async function request(url,body,token){const response=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw new Error('HTTP '+response.status+' '+(data.error?.message||''));return data;}
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Live test only.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(root);adminToken=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const email='chapter6-access-'+randomUUID()+'@example.com',password=randomBytes(24).toString('hex');
 identity=await request('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+apiKey,{email,password,returnSecureToken:true});
 const uid=identity.localId;let token=identity.idToken;
 touched.add('users/'+uid);
 await request(base+':commit',{writes:[{update:{name:fullBase+'/users/'+uid,fields:fields({firstName:'Flow',lastName:'TemporaryTest',email,role:'student',status:'active'})},currentDocument:{exists:false},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]}]},token);
 const snapshot=async ref=>{const response=await fetch(base+'/'+ref.key,{headers:{Authorization:'Bearer '+token}});if(response.status===404)return{exists:()=>false,data:()=>undefined};if(!response.ok)throw new Error('Read HTTP '+response.status+' '+await response.text());const row=decodeDoc(await response.json());return{exists:()=>true,data:()=>row};};
 const getDocs=async ref=>{const filters=(ref.filters||[]).map(f=>({fieldFilter:{field:{fieldPath:f.field},op:'EQUAL',value:encode(f.value)}}));const structuredQuery={from:[{collectionId:ref.name}],...(filters.length?{where:filters.length===1?filters[0]:{compositeFilter:{op:'AND',filters}}}:{})};const result=await request(base+':runQuery',{structuredQuery},token);return{docs:result.filter(item=>item.document).map(({document})=>({id:document.name.split('/').at(-1),data:()=>decodeDoc(document)}))};};
 const context=vm.createContext({console,auth:{currentUser:{uid}},db:{},
 collection:(_,name)=>({name}),doc:(_,name,id)=>({key:name+'/'+id}),where:(field,op,value)=>({field,value}),query:(ref,...filters)=>({...ref,filters}),getDoc:snapshot,getDocs,
 serverTimestamp:()=>({__serverTimestamp:true}),
 runTransaction:async(_,callback)=>{
   const writes=[];
   const makeWrite=(ref,data,update)=>{if(!ref.key.startsWith('users/'+uid)&&!ref.key.split('/')[1]?.startsWith(uid+'_'))throw new Error('Test write outside temporary account');touched.add(ref.key);const values={},transforms=[];for(const [key,value]of Object.entries(data)){if(value?.__serverTimestamp)transforms.push({fieldPath:key,setToServerValue:'REQUEST_TIME'});else values[key]=value;}return{update:{name:fullBase+'/'+ref.key,fields:fields(values)},...(update?{updateMask:{fieldPaths:Object.keys(data)}}:{}),...(transforms.length?{updateTransforms:transforms}:{})};};
   const result=await callback({get:snapshot,set:(ref,data)=>writes.push(makeWrite(ref,data,false)),update:(ref,data)=>writes.push(makeWrite(ref,data,true))});
   if(writes.length)await request(base+':commit',{writes},token);return result;
 }});
 context.getDocFromServer=snapshot;context.getDocsFromServer=getDocs;
 vm.runInContext(source('learning-access.js'),context);
 const targetChapter='chapter-6';
 const era=(await snapshot({key:'eras/spanish-exploration-colonial-rule'})).data();
 if(!Array.isArray(era.requiredChapterIds)||!era.requiredChapterIds.length)throw Error('Era prerequisites missing');
 const seed=async(collectionName,id,data)=>{const key=collectionName+'/'+uid+'_'+id;touched.add(key);await request(base+':commit',{writes:[{update:{name:fullBase+'/'+key,fields:fields({userId:uid,...data})},currentDocument:{exists:false}}]},adminToken);};
 for(const chapterId of era.requiredChapterIds)await seed('studentChapterProgress',chapterId,{chapterId,completed:true});
 let denied=false;try{await context.requireLearningAccess(targetChapter);}catch(error){if(!error.message.includes('previous chapters'))throw error;denied=true;}if(!denied)throw Error('Chapter 6 opened before Chapter 5 completion');
 await seed('studentChapterProgress','chapter-5',{chapterId:'chapter-5',completed:true});
 if((await context.requireLearningAccess(targetChapter)).id!==targetChapter)throw Error('Chapter 6 failed to unlock');
 const rows=s=>s.docs.map(d=>({id:d.id,...d.data()}));
 const missions=rows(await getDocs({name:'missions',filters:[{field:'chapterId',value:targetChapter}]})).filter(m=>m.status==='active').sort((a,b)=>a.order-b.order);
 if(missions.length!==4)throw Error('Chapter 6 does not have four active missions');
 await context.requireLearningAccess(targetChapter,missions[0].id);
 denied=false;try{await context.requireLearningAccess(targetChapter,missions[1].id);}catch(error){if(!error.message.includes('previous missions'))throw error;denied=true;}if(!denied)throw Error('Second mission opened early');
 await seed('studentProgress',missions[0].id,{chapterId:targetChapter,missionId:missions[0].id,completed:true});
 await context.requireLearningAccess(targetChapter,missions[1].id);
 const chapters=rows(await getDocs({name:'chapters'}));
 const progress=rows(await getDocs({name:'studentChapterProgress',filters:[{field:'userId',value:uid}]}));
 vm.runInContext(source('chapter-continuation.js'),context);
 if(context.nextChapterAfterCompletion('chapter-5',chapters,progress,missions,uid)?.id!==targetChapter)throw Error('Chapter 5 completion does not point to Chapter 6');
 const challenges=rows(await getDocs({name:'chapterChallenges',filters:[{field:'chapterId',value:targetChapter}]}));
 if(!challenges.some(c=>c.status==='active'))throw Error('Chapter 6 challenge missing');
 console.log('PASS: live Chapter 5 to 6 gate and continuation, four published missions, sequential mission access, and chapter challenge presence. Temporary seeded completions test access only, not quiz grading.');
}
async function cleanup(){
 if(!identity)return;
 const uid=identity.localId;
 const paths=[...touched];if(paths.some(key=>key!=='users/'+uid&&!key.split('/')[1]?.startsWith(uid+'_')))throw new Error('Invalid cleanup path');
 if(paths.length)await request(base+':commit',{writes:paths.map(key=>({delete:fullBase+'/'+key}))},adminToken);
 await request('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+apiKey,{idToken:identity.idToken});
 console.log('Removed the temporary test account and its learning records.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>cleanup().catch(error=>{console.error('Cleanup failed: '+error.message);process.exitCode=1;}));
