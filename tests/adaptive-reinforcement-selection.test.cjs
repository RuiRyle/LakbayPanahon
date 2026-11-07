const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/mission-assessment.js'),'utf8').replace(/export /g,''),c);
const question=(id,topic,difficulty)=>({id,topic,difficulty,status:'active',optionA:'A supported answer',optionB:'Another answer',optionC:'Third answer',optionD:'Fourth answer',correctAnswer:'A'});
const choose=(bank,options={})=>c.selectAdaptiveQuestion(bank,{difficultyLevels:['easy','medium','hard'],targetDifficulty:'easy',random:()=>0,...options});
test('seen weak-topic questions outrank unseen unrelated questions throughout follow-up',()=>{
 const bank=[question('weak-easy','weak','easy'),question('weak-hard','weak','hard'),question('new','other','easy')],used=[];
 for(let i=0;i<2;i++){const q=choose(bank,{seenIds:['weak-easy','weak-hard'],usedIds:used,topicWeights:{weak:4},topicAttempts:{weak:i}});assert.equal(q.topic,'weak');used.push(q.id);}
 assert.equal(choose(bank,{usedIds:used,topicWeights:{weak:4}}).id,'new');
 assert.equal(choose(bank,{usedIds:bank.map(q=>q.id)}),null);
});
test('seen easy review outranks unseen hard; unseen equivalent review avoids repetition',()=>{
 const easy=question('seen','trade','easy'),hard=question('new-hard','trade','hard');
 assert.equal(choose([easy,hard],{seenIds:['seen']}).id,'seen');
 assert.equal(choose([easy,hard,question('new-easy','trade','easy')],{seenIds:['seen']}).id,'new-easy');
});
test('limited pools fall back and existing correct/wrong difficulty steps stay bounded',()=>{
 assert.equal(choose([question('only','weak','hard')],{topicWeights:{weak:3}}).id,'only');
 const levels=['easy','medium','hard'];let level='medium';
 for(const correct of [false,false,true,true,true,false])level=c.nextAdaptiveDifficulty(level,correct,levels);
 assert.equal(level,'medium');assert.equal(choose([]),null);
});
