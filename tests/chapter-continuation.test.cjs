const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/chapter-continuation.js'),'utf8').replace(/export /g,''),context);
test('chapter continuation respects era, readiness, owned prerequisites and available missions',()=>{
 const chapters=[{id:'c1',eraId:'e1',status:'active',order:1},{id:'soon',eraId:'e1',status:'active',contentReady:false,order:2},{id:'c2',eraId:'e1',status:'active',order:3},{id:'other',eraId:'e2',status:'active'}];
 const progress=[{userId:'student',chapterId:'c1',completed:true}],missions=[{chapterId:'c2',status:'active'}];
 const next=(p=progress,m=missions,c=chapters)=>context.nextChapterAfterCompletion('c1',c,p,m,'student');
 assert.equal(next().id,'c2');assert.equal(next([{...progress[0],userId:'other'}]),null);
 assert.equal(next(progress,[]),null);
 assert.equal(next([...progress,{userId:'student',chapterId:'c2',completed:true}]),null);
 assert.equal(next(progress,missions,[{id:'earlier',eraId:'e1',status:'active',order:0},...chapters]),null);
});

test('candidate selection is separate from verifying playable mission content',()=>{
 const chapters=[{id:'c1',eraId:'era',status:'active',order:1},{id:'c2',eraId:'era',status:'active',order:2},{id:'other',eraId:'other-era',status:'active',order:2}];
 const progress=[{userId:'s',chapterId:'c1',completed:true}];
 assert.equal(context.nextChapterCandidate('c1',chapters,progress,'s').id,'c2');
 assert.equal(context.nextChapterAfterCompletion('c1',chapters,progress,[{chapterId:'c2',status:'draft'}],'s'),null);
 assert.equal(context.nextChapterAfterCompletion('c1',chapters,progress,[{chapterId:'other',status:'active'}],'s'),null);
 assert.equal(context.nextChapterCandidate('c1',chapters,[{userId:'other',chapterId:'c1',completed:true}],'s'),null);
});
