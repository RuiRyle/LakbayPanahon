const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/student-journey.js'),'utf8').replace(/export /g,''),context);
const resolve=overrides=>context.resolveStudentJourney({userId:'alice',eras:[{id:'e1',order:1,status:'active'},{id:'e2',order:2,status:'active'}],chapters:[{id:'c1',eraId:'e1',order:1,status:'active'},{id:'c2',eraId:'e1',order:2,status:'active'},{id:'c3',eraId:'e2',order:1,status:'active'}],missions:[{id:'m1',chapterId:'c1',order:1,status:'active'},{id:'m2',chapterId:'c1',order:2,status:'active'},{id:'m3',chapterId:'c2',order:1,status:'active'},{id:'m4',chapterId:'c3',order:1,status:'active'}],challenges:[{id:'ch1',chapterId:'c1',status:'active'}],chapterProgress:[],missionProgress:[],attempts:[],...overrides});
test('fresh students start an available lesson without classroom membership',()=>{
 const state=resolve();assert.equal(state.kind,'mission');assert.equal(state.mission.id,'m1');assert.equal(state.started,false);
});
test('saved completions advance to the next mission, then the chapter challenge',()=>{
 const progress=[{userId:'alice',missionId:'m1',completed:true}];
 assert.equal(resolve({missionProgress:progress}).mission.id,'m2');
 const state=resolve({missionProgress:[...progress,{userId:'alice',missionId:'m2',completed:true}]});assert.equal(state.kind,'challenge');assert.equal(state.chapter.id,'c1');
 assert.equal(resolve({chapterProgress:[{userId:'alice',chapterId:'c1',completed:true}]}).mission.id,'m3');
});
test('resume the most recent eligible mission across independent eras; never skip prerequisites',()=>{
 const attempted=(missionId,chapterId,time)=>({id:missionId,userId:'alice',missionId,chapterId,passed:false,completedAt:{toMillis:()=>time}});
 const state=resolve({attempts:[attempted('m4','c3',20),attempted('m3','c2',30),attempted('m2','c1',40)]});
 assert.equal(state.mission.id,'m4');assert.equal(state.started,true);assert.equal(state.attempt.passed,false);
});
test('unready chapters and other students records cannot determine the next action',()=>{
 assert.equal(resolve({chapters:[{id:'unready',eraId:'e1',order:0,status:'active',contentReady:false},{id:'c1',eraId:'e1',order:1,status:'active'}]}).mission.id,'m1');
 const state=resolve({missionProgress:[{userId:'bob',missionId:'m1',completed:true}],attempts:[{id:'b',userId:'bob',missionId:'m4',chapterId:'c3',completedAt:{toMillis:()=>100}}]});assert.equal(state.mission.id,'m1');assert.equal(state.started,false);
});
test('waiting chapters do not block another independent era and completed journeys offer review',()=>{
 assert.equal(resolve({missions:[{id:'m4',chapterId:'c3',status:'active'}]}).mission.id,'m4');
 assert.equal(resolve({missions:[]}).kind,'waiting');assert.equal(resolve({chapters:[]}).kind,'unavailable');
 assert.equal(resolve({chapterProgress:['c1','c2','c3'].map(chapterId=>({userId:'alice',chapterId,completed:true}))}).kind,'complete');
});

test('dashboard resumes owned eligible drafts and ignores submitted quiz drafts',()=>{
 const draft={id:'d1',userId:'alice',chapterId:'c1',missionId:'m1',kind:'quiz',state:{attemptId:'in-progress'},updatedAt:{toMillis:()=>100}};
 assert.equal(resolve({drafts:[draft]}).draft.kind,'quiz');
 assert.equal(resolve({drafts:[{...draft,kind:'story'}]}).draft.kind,'story');
 assert.equal(resolve({drafts:[{...draft,userId:'bob'}]}).draft,null);
 assert.equal(resolve({drafts:[{...draft,missionId:'m2'}]}).draft,null);
 assert.equal(resolve({drafts:[draft],attempts:[{userId:'alice',attemptId:'in-progress',missionId:'m1',chapterId:'c1',completedAt:{toMillis:()=>101}}]}).draft,null);
});

test('inactive or missing eras cannot supply journey recommendations',()=>{
 assert.equal(resolve({eras:[{id:'e1',status:'inactive'},{id:'e2',status:'active'}]}).chapter.id,'c3');
 assert.equal(resolve({eras:[]}).kind,'unavailable');
});
test('completed journey summarizes only owned ready learning and recent chapter',()=>{
 const stamp=value=>({toMillis:()=>value});
 const state=resolve({chapterProgress:[{userId:'alice',chapterId:'c1',completed:true,completedAt:stamp(20)},{userId:'alice',chapterId:'c2',completed:true,completedAt:stamp(40)},{userId:'alice',chapterId:'c3',completed:true,completedAt:stamp(30)},{userId:'bob',chapterId:'c3',completed:true,completedAt:stamp(999)}],missionProgress:[{userId:'alice',missionId:'m1',completed:true},{userId:'alice',missionId:'m2',completed:true},{userId:'alice',missionId:'m2',completed:true},{userId:'bob',missionId:'m3',completed:true}]});
 assert.equal(state.kind,'complete');assert.equal(state.completion.chapterCount,3);assert.equal(state.completion.missionCount,2);assert.equal(state.completion.latestChapter.id,'c2');
});
test('completed journey chooses an active saved review topic and derives its chapter from catalog',()=>{
 const progress=['c1','c2','c3'].map(chapterId=>({userId:'alice',chapterId,completed:true}));
 const state=resolve({chapterProgress:progress,reviewTopics:[{missionId:'missing',topic:'wrong',missed:2},{missionId:'m3',topic:'trade & travel',label:'Trade',chapterId:'forged',missed:1}]});
 assert.equal(state.completion.review.chapterId,'c2');assert.equal(state.completion.review.topic,'trade & travel');
 assert.equal(resolve({chapterProgress:progress,reviewTopics:[{missionId:'m3',topic:'trade',missed:0}]}).completion.review,null);
});
