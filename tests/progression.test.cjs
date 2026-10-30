const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const backend=require('../functions/progression-policy');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/progression-policy.js'),'utf8').replace(/export /g,''),context);
test('progression follows configured spacing and exact level boundaries',()=>{
 for(const xpPerLevel of [25,100,250])for(const xp of [0,24,25,99,100,249,250,999]){
   const state=context.progressionState(xp,{xpPerLevel,version:2});
   assert.equal(state.level,Math.floor(xp/xpPerLevel)+1);assert.equal(state.xpInLevel,xp%xpPerLevel);
   assert.equal(state.xpUntilNextLevel,xpPerLevel-xp%xpPerLevel);
   assert.deepEqual(JSON.parse(JSON.stringify(state)),backend.progressionState(xp,{xpPerLevel,version:2}));
 }
});
test('missing and malformed progression settings never invent a fallback',()=>{
 for(const policy of [null,{}, {xpPerLevel:0,version:1},{xpPerLevel:-1,version:1},{xpPerLevel:2.5,version:1},{xpPerLevel:'100',version:1},{xpPerLevel:100,version:0},{xpPerLevel:Infinity,version:1}]){
   assert.throws(()=>context.progressionState(0,policy),/progression/);assert.throws(()=>backend.progressionState(0,policy),/progression/);
 }
 for(const xp of [-1,NaN,Infinity,0.5,'100'])assert.throws(()=>context.progressionState(xp,{xpPerLevel:100,version:1}),/XP/);
});

test('dashboard and daily progress render the configured spacing rather than a stored level rule',()=>{
 for(const [file,start,end]of [['student.js','function loadPlayerProgress(', '// ==========================================\n//'],['daily-challenge.js','function updateDisplayedProgress(', 'function showCorrectFeedback(']]){
   const script=fs.readFileSync(path.join(__dirname,'../js',file),'utf8').replace(/\r\n/g,'\n');
   const from=script.indexOf(start);const to=script.indexOf(end,from+start.length);
   assert.ok(from>=0&&to>from);
   const values={},bar={style:{},setAttribute(){}};
   const ui=vm.createContext({progressionState:backend.progressionState,setText:(key,value)=>values[key]=value,document:{getElementById:()=>bar}});
   vm.runInContext(script.slice(from,to),ui);
   if(file==='student.js')ui.loadPlayerProgress(175,1,{xpPerLevel:250,version:1});
   else ui.updateDisplayedProgress(175,1,2,{xpPerLevel:250,version:1});
   assert.equal(values.levelProgressXp,'175 / 250 XP');assert.equal(values.nextLevelText,'75 XP until Level 2');assert.equal(bar.style.width,'70%');
 }
});
