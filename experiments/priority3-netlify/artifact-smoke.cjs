// Actual extracted package, synthetic demo data only; no hosted gateway claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
assert.ok(process.env.LOCAL_ASSESSMENT_PACKAGE,'Select an extracted local package');
const p=require('./proof.cjs'),checks=[],report={pass:false,checks,runtime:process.version,candidate:process.env.LOCAL_ASSESSMENT_PACKAGE};
function check(ok,label){assert.ok(ok,label);checks.push(label);}
(async()=>{
 await p.fixture.seedLocalCatalog();const user=await p.fixture.fixtureUser('artifact-'+crypto.randomUUID());
 let state=await p.call(p.names[0],{...p.identity,requestId:crypto.randomUUID()},user,'artifact');check(state.questions.length===5,'extracted adapter issues five authoritative questions');
 state=await p.finish(user,state,0,'artifact');const result=await p.submit(user,state,'artifact');check(result.score===100,'extracted package marks correct answers');check(result.totalXp===p.mission.xpReward,'extracted package awards catalog reward');
 const resumed=await p.call(p.names[2],{attemptId:state.attemptId},user,'artifact');check(resumed.result.totalXp===result.totalXp,'resume recovers committed receipt');
 const replay=await p.submit(user,state,'artifact');check(replay.totalXp===result.totalXp,'same-attempt replay does not add XP');
 check((await p.db.doc('users/'+user.uid).get()).data().xp===result.totalXp,'canonical XP matches one award');report.operations=p.meter.total('artifact');report.pass=true;
})().catch(e=>{report.error=e.stack;process.exitCode=1;}).finally(async()=>{await p.cleanup();report.verifiedAt=new Date().toISOString();fs.writeFileSync(path.resolve(__dirname,'../../docs/validation/node-provider-artifact-smoke-2026-11-07.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
