const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const ctx=vm.createContext({});
for(const file of ['journey-path','student-journey'])vm.runInContext(fs.readFileSync(require.resolve('../js/'+file+'.js'),'utf8').replace(/export /g,''),ctx);
const input=()=>({userId:'s',eras:[{id:'e1',status:'active',order:1},{id:'e2',status:'active',order:2,requiredChapterIds:['c1']}],chapters:[{id:'c1',eraId:'e1',status:'active',order:1},{id:'c2',eraId:'e2',status:'active',order:1}],missions:[{id:'m1',chapterId:'c1',status:'active'},{id:'m2',chapterId:'c2',status:'active',order:1},{id:'m3',chapterId:'c2',status:'active',order:2}],challenges:[{id:'ch1',chapterId:'c1',status:'active'}],chapterProgress:[],missionProgress:[],attempts:[],drafts:[]});
test('Home does not resume a locked era draft and unlocks only after the chapter challenge record',()=>{
 const data=input();data.drafts=[{userId:'s',chapterId:'c2',missionId:'m2',kind:'quiz',state:{attemptId:'pending'},updatedAt:{toMillis:()=>500}}];
 assert.equal(ctx.resolveStudentJourney(data).mission.id,'m1');
 data.missionProgress=[{userId:'s',missionId:'m1',completed:true}];
 assert.equal(ctx.resolveStudentJourney(data).kind,'challenge');
 assert.equal(ctx.buildJourneyPath(data)[1].chapters[0].accessible,false);
 data.chapterProgress=[{userId:'someone-else',chapterId:'c1',completed:true}];
 assert.equal(ctx.resolveStudentJourney(data).kind,'challenge');
 data.chapterProgress=[{userId:'s',chapterId:'c1',completed:true}];
 assert.equal(ctx.resolveStudentJourney(data).mission.id,'m2');
 assert.equal(ctx.buildJourneyPath(data)[1].chapters[0].missions[0].accessible,true);
});
test('My Journey preserves completed mission review while keeping the rest of its era locked',()=>{
 const data=input();data.missionProgress=[{userId:'s',missionId:'m2',completed:true}];
 const chapter=ctx.buildJourneyPath(data)[1].chapters[0];
 assert.equal(chapter.accessible,false);assert.equal(chapter.missions[0].accessible,true);assert.equal(chapter.missions[1].accessible,false);
 assert.equal(ctx.resolveStudentJourney(data).mission.id,'m1');
});
test('missing or malformed requirements do not falsely report a finished journey',()=>{
 const data=input();data.chapters=data.chapters.filter(c=>c.id==='c2');
 assert.equal(ctx.resolveStudentJourney(data).kind,'locked');
 for(const value of [null,'c1',['']]){data.eras[1].requiredChapterIds=value;assert.equal(ctx.resolveStudentJourney(data).kind,'locked');assert.equal(ctx.buildJourneyPath(data)[0].chapters[0].accessible,false);}
});
test('authored era chain includes all earlier required chapters and makes the prologue required',()=>{
 const plan=require('../data/era-progression-migration.json');
 const eras=plan.writes.filter(w=>w.path.startsWith('eras/'));
 for(const [index,era]of eras.entries()){
  assert.ok(Array.isArray(era.fields.requiredChapterIds));
  if(index)for(const id of eras[index-1].fields.requiredChapterIds)assert.ok(era.fields.requiredChapterIds.includes(id));
  for(const id of era.fields.requiredChapterIds)assert.ok(plan.prerequisites.some(p=>p.path==='chapters/'+id));
  assert.ok(era.expectedAbsent.includes('requiredChapterIds'));
 }
 assert.equal(plan.writes.find(w=>w.path==='chapters/era1-prologue').fields.requiredForProgression,true);
 assert.ok(plan.writes.every(w=>w.path.startsWith('eras/')||w.path==='chapters/era1-prologue'));
});

test('existing-era rollout defers missing eras and keeps the original full plan intact',()=>{
 const {existingEraPlan}=require('../functions/era-progression-plan.cjs');const plan=require('../data/era-progression-migration.json');
 const selected=existingEraPlan(plan,new Set(['eras/early-philippine-communities','eras/spanish-exploration-colonial-rule']));
 assert.equal(selected.writes.length,3);assert.equal(selected.deferred.length,2);assert.equal(selected.prerequisites.length,5);
 assert.equal(plan.writes.length,5);assert.ok(selected.writes.every(w=>w.expected));
 assert.ok(selected.prerequisites.every(p=>['era1-prologue','chapter-1','chapter-2','chapter-3','chapter-4'].includes(p.path.split('/')[1])));
});
test('migration empty arrays match Firestore REST readback representation',()=>{
 const source=fs.readFileSync(require.resolve('../functions/apply-era-progression.cjs'),'utf8');
 const context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('const encode='),source.indexOf('async function main()'))+';globalThis.matches=equal(encode([]),{arrayValue:{}});',context);
 assert.equal(context.matches,true);
});
