const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});vm.runInContext(fs.readFileSync('js/level-reward-policy.js','utf8').replace(/export /g,''),scope);
test('level milestones expose earned titles and the next cosmetic reward at exact boundaries',()=>{
 for(const [level,title,next,count] of [[1,'History Scout',3,1],[2,'History Scout',3,1],[3,'Clue Detective',5,2],[5,'Heritage Explorer',10,3],[10,'History Guardian',null,4],[99,'History Guardian',null,4]]){
  const state=scope.explorerRewardState(level);assert.equal(state.title,title);assert.equal(state.next?.level??null,next);assert.equal(state.unlocked.length,count);
 }
});
test('invalid and locked frame choices cannot become equipped',()=>{
 for(const level of [undefined,null,'10',0,-1,2.5,Infinity])assert.equal(scope.explorerRewardState(level),null);
 assert.equal(scope.equippedExplorerFrame(2,'guardian'),'none');assert.equal(scope.equippedExplorerFrame(3,'bamboo'),'bamboo');assert.equal(scope.equippedExplorerFrame(5,'sunburst'),'sunburst');assert.equal(scope.equippedExplorerFrame(10,'arbitrary-frame'),'none');
});
