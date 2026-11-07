// Non-authoritative display-only experiment. Never cache reward verification.
const fs=require('fs'),assert=require('assert/strict'),p=require('./proof.cjs');
(async()=>{await p.fixture.seedLocalCatalog();let baselineReads=0,sharedReads=0;const collections=['chapters','eras','missions','chapterChallenges'];
 const base=[],shared=[];
 for(let student=0;student<30;student++){
  const snapshots=[];for(let page=0;page<2;page++){const state={};for(const name of collections){const s=await p.meter.outside('display-baseline',p.db.collection(name));baselineReads+=Math.max(1,s.size);state[name]=s.docs.map(d=>({id:d.id,...d.data()}));}snapshots.push(state);}base.push(snapshots);
  // Page-lifecycle-owned promise map; only overlapping display consumers share.
  // Drop it on navigation/reload. No persistent TTL or server cache.
  const pending=new Map(),read=name=>{if(!pending.has(name))pending.set(name,p.meter.outside('display-sharing',p.db.collection(name)).then(s=>{sharedReads+=Math.max(1,s.size);return s.docs.map(d=>({id:d.id,...d.data()}));}));return pending.get(name);};
  const views=await Promise.all([1,2].map(async()=>Object.fromEntries(await Promise.all(collections.map(async name=>[name,await read(name)])))));shared.push(views);assert.deepEqual(views,base[student]);
 }
 // New page/context gets a fresh edit. Cached results never establish access.
 await p.db.doc('missions/mission-1').update({localDisplayProbe:'changed'});const fresh=await p.db.collection('missions').get();assert.equal(fresh.docs.find(d=>d.id==='mission-1').data().localDisplayProbe,'changed');
 const report={status:'pass',scope:'Two overlapping display consumers of four catalog collections, 30 synthetic browsers',baselineReads,sharedReads,savedReads:baselineReads-sharedReads,writes:0,deletes:0,displayParity:true,freshPageSeesEdits:true,serverAssessmentCaching:false,productionIntegration:false,limitations:['No saving if the existing UI already coalesces these consumers.','Not a browser trace or reward-service optimization.','Seed/probe writes excluded from measured display workload.']};fs.writeFileSync('docs/validation/priority-3-netlify-display-sharing-2026-11-07.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(p.cleanup);
