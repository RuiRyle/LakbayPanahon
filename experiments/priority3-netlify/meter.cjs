'use strict';
const {AsyncLocalStorage}=require('node:async_hooks');
function installMeter(db){
 const scope=new AsyncLocalStorage(),events=[],original=db.runTransaction.bind(db);
 const read=(bucket,ref,s)=>{const query=Array.isArray(s.docs),collection=query?(ref._queryOptions?.collectionId||'query'):ref.path.split('/')[0];const row=bucket[collection]||(bucket[collection]={pointGets:0,queryGets:0,documentsReturned:0,minimumReadUnits:0});row[query?'queryGets':'pointGets']++;row.documentsReturned+=query?s.size:Number(s.exists);row.minimumReadUnits+=query?Math.max(1,s.size):1;};
 db.runTransaction=async(fn,...options)=>{
  const event={phase:scope.getStore()||'unattributed',callbacks:[],committed:false};events.push(event);
  try{const result=await original(async tx=>{const callback={reads:{},writes:{create:0,set:0,update:0,delete:0}};event.callbacks.push(callback);const wrapped=new Proxy(tx,{get(target,key){if(key==='get')return async ref=>{const s=await target.get(ref);read(callback.reads,ref,s);return s;};if(['create','set','update','delete'].includes(key))return(...args)=>{callback.writes[key]++;target[key](...args);return wrapped;};const value=target[key];return typeof value==='function'?value.bind(target):value;}});return fn(wrapped);},...options);event.committed=true;return result;}catch(error){event.code=error.code;throw error;}
 };
 const total=phase=>{
  const rows=events.filter(e=>!phase||e.phase===phase),out={transactions:rows.filter(e=>!e.outsideTransaction).length,outsideGets:rows.filter(e=>e.outsideTransaction).length,callbacks:0,retryCallbacks:0,documentsReturned:0,minimumReadUnits:0,pointGets:0,queryGets:0,attemptedWrites:0,committedWrites:0,committedDeletes:0,failedTransactions:0,collections:{}};
  for(const e of rows){if(!e.outsideTransaction)out.callbacks+=e.callbacks.length;out.retryCallbacks+=Math.max(0,e.callbacks.length-1);out.failedTransactions+=!e.committed;
   for(const c of e.callbacks){out.attemptedWrites+=Object.values(c.writes).reduce((a,b)=>a+b,0);for(const [name,v]of Object.entries(c.reads)){const t=out.collections[name]||(out.collections[name]={pointGets:0,queryGets:0,documentsReturned:0,minimumReadUnits:0});for(const k of Object.keys(v)){t[k]+=v[k];out[k]+=v[k];}}}
   if(e.committed&&e.callbacks.length){const w=e.callbacks.at(-1).writes;out.committedWrites+=w.create+w.set+w.update;out.committedDeletes+=w.delete;}
  }return out;
 };
 return{events,total,run:(phase,fn)=>scope.run(phase,fn),async outside(phase,ref){const s=await ref.get();const bucket={};read(bucket,ref,s);events.push({phase,committed:true,callbacks:[{reads:bucket,writes:{create:0,set:0,update:0,delete:0}}],outsideTransaction:true});return s;}};
}
module.exports={installMeter};
