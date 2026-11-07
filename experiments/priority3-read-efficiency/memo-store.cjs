'use strict';
// Scope is ONE transaction callback, including fresh maps on every SDK retry.
// No authorization, catalog, policy or progress data survives a callback.
const stats={pointHits:0,queryHits:0,callbacks:0};
function assessmentStore(db,timestamp){return{run:fn=>db.runTransaction(async transaction=>{
 stats.callbacks++;const points=new Map(),queries=new Map(),writes=[];
 const tx={
  get:async p=>{if(points.has(p))stats.pointHits++;else points.set(p,transaction.get(db.doc(p)));const s=await points.get(p);return s.exists?s.data():null;},
  list:async(c,k,v,filters=[])=>{const key=JSON.stringify([c,k,v,filters]);let promise=queries.get(key);if(promise)stats.queryHits++;else{let q=db.collection(c).where(k,'==',v);for(const[field,value]of filters)q=q.where(field,'==',value);promise=transaction.get(q.limit(1001));queries.set(key,promise);}const s=await promise;if(s.size>1000){const {AssessmentError}=require('../priority3-netlify/service/student-assessment.js');throw new AssessmentError('assessment/catalog-limit');}for(const d of s.docs)if(!points.has(d.ref.path))points.set(d.ref.path,Promise.resolve(d));return s.docs.map(d=>({...d.data(),id:d.id}));},
  stamp:timestamp,create:(p,d)=>writes.push(()=>transaction.create(db.doc(p),d)),set:(p,d)=>writes.push(()=>transaction.set(db.doc(p),d)),update:(p,d)=>writes.push(()=>transaction.update(db.doc(p),d))
 };const result=await fn(tx);for(const w of writes)w();return result;
})};}
module.exports={assessmentStore,stats};
