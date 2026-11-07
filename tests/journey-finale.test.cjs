const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});vm.runInContext(fs.readFileSync('js/journey-finale-policy.js','utf8').replace(/export /g,''),scope);
const definition={enabled:true,id:'v1',finalChapterId:'c2',chapters:[{id:'c1',title:'One'},{id:'c2',title:'Two'}],missions:[{id:'m1',chapterId:'c1'},{id:'m2',chapterId:'c2'}]};
const chapters=[{userId:'a',chapterId:'c1',completed:true,completedAt:{toMillis:()=>100}},{userId:'a',chapterId:'c2',completed:true,completedAt:{toMillis:()=>200}}];
const missions=definition.missions.map(m=>({userId:'a',missionId:m.id,chapterId:m.chapterId,completed:true}));
const state=(chapterProgress=chapters,missionProgress=missions)=>scope.journeyFinaleState({definition,userId:'a',chapterProgress,missionProgress});
test('finale requires every configured mission and chapter, independent of level or collection counts',()=>{
 assert.equal(state().eligible,true);assert.equal(state().completedAt,200);assert.equal(state(chapters.slice(0,1)).eligible,false);assert.equal(state(chapters,missions.slice(0,1)).eligible,false);
});
test('other accounts, wrong mission chapters and unfinished records cannot unlock the ending',()=>{
 assert.equal(state(chapters.map(c=>({...c,userId:'b'}))).eligible,false);assert.equal(state(chapters,missions.map(m=>({...m,chapterId:'wrong'}))).eligible,false);assert.equal(state(chapters.map(c=>({...c,completed:false}))).eligible,false);
});
test('the frozen scope ignores unrelated optional work and replay does not change evidence',()=>{
 const extra=[...chapters,{userId:'a',chapterId:'optional',completed:false}],before=JSON.stringify(extra);assert.equal(state(extra).eligible,true);state(extra);assert.equal(JSON.stringify(extra),before);
});
test('legacy missing timestamps do not invent a completion date',()=>{
 const result=state(chapters.map(c=>({...c,completedAt:null})));assert.equal(result.eligible,true);assert.equal(result.completedAt,null);
});
test('empty, disabled, duplicated or inconsistent finale definitions fail closed',()=>{
 for(const value of [{...definition,enabled:false},{...definition,chapters:[]},{...definition,chapters:[...definition.chapters,definition.chapters[0]]},{...definition,missions:[{id:'m1',chapterId:'missing'}]},{...definition,finalChapterId:'missing'}])assert.throws(()=>scope.validateFinaleDefinition(value));
});
