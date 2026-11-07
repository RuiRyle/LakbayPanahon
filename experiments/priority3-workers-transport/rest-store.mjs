// Bounded local transport proof. No production endpoint or credential support.
const root='http://127.0.0.1:8180/v1/projects/demo-lakbaypanahon/databases/(default)/documents';
const prefix='projects/demo-lakbaypanahon/databases/(default)/documents/';
export const stamp=Object.freeze({__localServerTimestamp:true});
export class RestTimestamp{constructor(iso){this.iso=iso;}toMillis(){return Date.parse(this.iso);}toDate(){return new Date(this.toMillis());}}
export function encode(v){
 if(v instanceof RestTimestamp)return{timestampValue:v.iso};
 if(v===null)return{nullValue:null};if(typeof v==='string')return{stringValue:v};if(typeof v==='boolean')return{booleanValue:v};
 if(typeof v==='number'&&Number.isFinite(v))return Number.isSafeInteger(v)?{integerValue:String(v)}:{doubleValue:v};
 if(Array.isArray(v))return{arrayValue:{values:v.map(encode)}};
 if(v&&typeof v==='object')return{mapValue:{fields:fields(v)}};throw Error('transport/unsupported-value');
}
const fields=v=>Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]));
export function decode(v){if('nullValue'in v)return null;if('stringValue'in v)return v.stringValue;if('booleanValue'in v)return v.booleanValue;if('integerValue'in v){const n=Number(v.integerValue);if(!Number.isSafeInteger(n))throw Error('transport/unsafe-integer');return n;}if('doubleValue'in v)return v.doubleValue;if('timestampValue'in v)return new RestTimestamp(v.timestampValue);if('arrayValue'in v)return(v.arrayValue.values||[]).map(decode);if('mapValue'in v)return data(v.mapValue.fields);throw Error('transport/unsupported-value');}
const data=f=>Object.fromEntries(Object.entries(f||{}).map(([k,v])=>[k,decode(v)]));
function write(kind,path,value){const transforms=[],clean=v=>{if(v===stamp)throw Error('transport/nested-transform');return v;},out={};for(const[k,v]of Object.entries(value)){if(v===stamp)transforms.push({fieldPath:k,setToServerValue:'REQUEST_TIME'});else out[k]=clean(v);}
 const w={update:{name:prefix+path,fields:fields(out)}};
 if(kind==='create')w.currentDocument={exists:false};if(kind==='update'){w.currentDocument={exists:true};w.updateMask={fieldPaths:Object.keys(value)};}if(transforms.length)w.updateTransforms=transforms;return w;
}
export function restStore(metrics,{beforeCommit}={}){
 const post=async(method,body)=>{metrics.firestoreRequests++;const response=await fetch(root+':'+method,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer owner'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)}),result=await response.json();if(!response.ok)throw Object.assign(Error(result.error?.message||'REST failure'),{code:result.error?.status||'INTERNAL'});return result;};
 return{run:async fn=>{for(let attempt=0;attempt<5;attempt++){metrics.transactionAttempts++;let transaction;try{
  ({transaction}=await post('beginTransaction',{options:{readWrite:{}}}));const writes=[];
  const tx={stamp:()=>stamp,get:async path=>{const rows=await post('batchGet',{documents:[prefix+path],transaction}),row=(Array.isArray(rows)?rows:[rows])[0];metrics.reads++;return row.found?data(row.found.fields):null;},
   list:async(collection,key,value,filters=[])=>{const conditions=[[key,value],...filters].map(([field,v])=>({fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:encode(v)}}));const rows=await post('runQuery',{transaction,structuredQuery:{from:[{collectionId:collection}],where:conditions.length===1?conditions[0]:{compositeFilter:{op:'AND',filters:conditions}},limit:1001}}),documents=rows.filter(r=>r.document).map(r=>({...data(r.document.fields),id:r.document.name.split('/').at(-1)}));metrics.reads+=Math.max(1,documents.length);if(documents.length>1000)throw Object.assign(Error('assessment/catalog-limit'),{code:'assessment/catalog-limit'});return documents;},
   create:(p,d)=>writes.push(write('create',p,d)),set:(p,d)=>writes.push(write('set',p,d)),update:(p,d)=>writes.push(write('update',p,d))};
  const result=await fn(tx);await beforeCommit?.({transaction,writes,attempt,post});await post('commit',{transaction,writes});metrics.writes+=writes.length;return result;
 }catch(e){if(transaction)try{await post('rollback',{transaction});}catch{}if(e.code!=='ABORTED'||attempt===4)throw e;metrics.retries++;await new Promise(r=>setTimeout(r,10*(attempt+1)));}}
 }};
}
