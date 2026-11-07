const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});vm.runInContext(fs.readFileSync('js/bayani-review-question.js','utf8').replace(/export /g,''),scope);
const valid={question:'What helps you read a map?',options:{A:'A legend',B:'A recipe',C:'A song',D:'A calendar'},answer:'A',explanation:'A legend explains the map symbols.'};
test('review parser accepts one structured question including a plain JSON code fence',()=>{
 assert.equal(scope.parseReviewQuestion('```json\n'+JSON.stringify(valid)+'\n```').answer,'A');
});
test('review parser rejects incomplete, ambiguous and oversized generated responses',()=>{
 for(const value of [{...valid,answer:'E'},{...valid,explanation:''},{...valid,options:{...valid.options,D:'A legend'}},{...valid,question:'x'.repeat(501)}])assert.throws(()=>scope.parseReviewQuestion(JSON.stringify(value)));
 assert.throws(()=>scope.parseReviewQuestion('Here is the answer '+JSON.stringify(valid)));assert.throws(()=>scope.parseReviewQuestion('x'.repeat(12001)));
});
test('review prompts remain within the configured limit and include lesson grounding',()=>{
 const prompt=scope.reviewPrompt('Maps','A legend explains symbols. '.repeat(500),1100);assert.equal(prompt.length,1100);assert.match(prompt,/LESSON:/);assert.match(prompt,/using only the LESSON/);assert.throws(()=>scope.reviewPrompt('Maps','Source',100));
});
