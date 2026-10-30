const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const policy=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/daily-policy.js'),'utf8').replace(/export /g,''),policy);
test('Philippines learning day changes at UTC 16:00, including year and leap-day boundaries',()=>{
 for(const [utc,key]of [['2026-10-26T15:59:59.999Z','2026-10-26'],['2026-10-26T16:00:00Z','2026-10-27'],['2026-12-31T16:00:00Z','2027-01-01'],['2028-02-28T16:00:00Z','2028-02-29']])assert.equal(policy.learningDateKey(new Date(utc)),key);
 assert.equal(policy.millisecondsUntilLearningMidnight(new Date('2026-10-26T15:59:59.999Z')),1);
 assert.equal(policy.millisecondsUntilLearningMidnight(new Date('2026-10-26T16:00:00Z')),86400000);
});
test('daily rotation uses Firestore order with deterministic IDs and ignores inactive content',()=>{
 const bank=[{id:'b',status:'active',order:1},{id:'a',status:'active',order:1},{id:'ignored',status:'inactive',order:0}];
 assert.equal(policy.selectDailyChallenge(bank,new Date('2026-01-01T00:00:00Z')).id,'a');
 assert.equal(policy.selectDailyChallenge(bank,new Date('2026-01-01T16:00:00Z')).id,'b');
 assert.equal(policy.selectDailyChallenge(bank.slice().reverse(),new Date('2026-01-01T16:00:00Z')).id,'b');
 assert.equal(policy.selectDailyChallenge([],new Date()),null);
});
