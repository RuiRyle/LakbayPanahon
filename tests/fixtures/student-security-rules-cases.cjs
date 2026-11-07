// Synthetic Rules API cases. Every external document function has a fallback mock;
// these cases must never consult learner documents.
const base='/databases/(default)/documents/';
const time='2026-10-30T04:00:00Z';
const student={role:'student',status:'active',firstName:'Ana',lastName:'Test',xp:0,level:1};
const chapter={status:'active',contentReady:true};
const mission={status:'active',chapterId:'c1',xpReward:25};
const quiz={status:'active',missionId:'m1',questionCount:5,passingScore:60};
const clone=value=>JSON.parse(JSON.stringify(value));
function testCase(name,expectation,path,method,data,{resource,docs={},after={},existing={},uid='alice'}={}) {
 const records={'users/alice':student,'chapters/c1':chapter,'missions/m1':mission,'quizzes/q1':quiz,...docs};
 const exact=(fn,path,value)=>({function:fn,args:[{exactValue:base+path}],result:{value}});
 const mocks=[];
 for(const [key,value] of Object.entries(records))mocks.push(exact('get',key,{data:value}));
 for(const [key,value] of Object.entries(after))mocks.push(exact('getAfter',key,{data:value}));
 for(const [key,value] of Object.entries(existing))mocks.push(exact('exists',key,value));
 for(const fn of ['get','getAfter'])mocks.push({function:fn,args:[{anyValue:{}}],result:{undefined:{}}});
 mocks.push({function:'exists',args:[{anyValue:{}}],result:{value:false}});
 return {name,expectation,request:{auth:uid?{uid,token:{email:uid+'@example.com'}}:null,
  path:base+path,method,time,...(data?{resource:{data}}:{})},
  ...(resource?{resource:{data:resource}}:{}),functionMocks:mocks};
}
const cases=[];
cases.push(testCase('owner reads profile','ALLOW','users/alice','get',null,{resource:student}));
cases.push(testCase('other student cannot read profile','DENY','users/bob','get',null,{resource:{...student}}));
cases.push(testCase('anonymous cannot read profile','DENY','users/alice','get',null,{resource:student,uid:null}));
for(const [key,value]of [['role','admin'],['xp',99999],['status','active']]) {
 const old=key==='status'?{...student,status:'disabled'}:student;
 cases.push(testCase('cannot self-change '+key,'DENY','users/alice','update',{...old,[key]:value,updatedAt:time},{resource:old,docs:{'users/alice':old}}));
}
const practice={userId:'alice',chapterId:'c1',missionId:'m1',completedAt:time,totalQuestions:1,
 firstTryCorrectCount:1,questionResults:[{questionId:'p1',firstTryCorrect:true}],topicsForReview:[]};
cases.push(testCase('valid practice remains writable','ALLOW','studentPracticeProgress/session','create',practice));
cases.push(testCase('practice cannot name another chapter','DENY','studentPracticeProgress/session','create',{...practice,chapterId:'c2'},{docs:{'chapters/c2':chapter}}));
cases.push(testCase('practice cannot use an inactive mission','DENY','studentPracticeProgress/session','create',practice,{docs:{'missions/m1':{...mission,status:'inactive'}}}));
cases.push(testCase('practice cannot use an unpublished chapter','DENY','studentPracticeProgress/session','create',practice,{docs:{'chapters/c1':{...chapter,contentReady:false}}}));
cases.push(testCase('practice cannot exceed storage bound','DENY','studentPracticeProgress/session','create',{...practice,totalQuestions:201,questionResults:Array(201).fill({})}));
cases.push(testCase('practice cannot inflate review topics','DENY','studentPracticeProgress/session','create',{...practice,topicsForReview:['one','two']}));
cases.push(testCase('practice cannot write as another owner','DENY','studentPracticeProgress/session','create',{...practice,userId:'bob'}));
const draft={userId:'alice',kind:'story',chapterId:'c1',missionId:'m1',state:{scene:1},updatedAt:time};
cases.push(testCase('valid story draft remains writable','ALLOW','studentLearningDrafts/alice_story_m1','create',draft));
cases.push(testCase('valid chapter draft remains writable','ALLOW','studentLearningDrafts/alice_chapter_c1','create',{...draft,kind:'chapter',missionId:null}));
cases.push(testCase('draft cannot use an inactive mission','DENY','studentLearningDrafts/alice_story_m1','create',draft,{docs:{'missions/m1':{...mission,status:'inactive'}}}));
cases.push(testCase('draft cannot use an unpublished chapter','DENY','studentLearningDrafts/alice_story_m1','create',draft,{docs:{'chapters/c1':{...chapter,contentReady:false}}}));
cases.push(testCase('draft cannot overwrite a foreign record','DENY','studentLearningDrafts/alice_story_m1','update',draft,{resource:{...draft,userId:'bob'}}));
cases.push(testCase('own draft can still update','ALLOW','studentLearningDrafts/alice_story_m1','update',draft,{resource:draft}));
const attempt={userId:'alice',chapterId:'c1',missionId:'m1',quizId:'q1',attemptId:'a1',questionIds:['q1','q2','q3','q4','q5'],
 answers:{q1:'A',q2:'B',q3:'C',q4:'D',q5:'A'},score:20,correctAnswers:1,totalQuestions:5,passed:false,
 topicsForReview:['roles'],completedAt:time,response:{score:20,correctAnswers:1,passed:false,topicsForReview:['roles'],firstCompletion:false,xpReward:0}};
cases.push(testCase('valid failing attempt remains writable','ALLOW','studentQuizAttempts/alice_a1','create',attempt));
const replay={...clone(attempt),score:80,correctAnswers:4,passed:true};Object.assign(replay.response,{score:80,correctAnswers:4,passed:true});
cases.push(testCase('valid passing replay remains writable','ALLOW','studentQuizAttempts/alice_a1','create',replay));
const first=clone(replay);Object.assign(first.response,{firstCompletion:true,xpReward:25});
const completion={userId:'alice',chapterId:'c1',missionId:'m1',quizId:'q1',completed:true,bestScore:80,
 completedAt:time,updatedAt:time,xpEarned:25};
cases.push(testCase('fresh matching first completion is accepted','ALLOW','studentQuizAttempts/alice_a1','create',first,{after:{'studentProgress/alice_m1':completion}}));
for(const [name,change]of [
 ['forged response pass',d=>{d.response.passed=true;}],
 ['forged response score',d=>{d.response.score=100;}],
 ['inflated response reward',d=>{d.response.xpReward=9999;}],
 ['failed first completion',d=>{d.response.firstCompletion=true;d.response.xpReward=25;}],
 ['different response review topics',d=>{d.response.topicsForReview=[];}],
 ['zero-question attempt',d=>{d.totalQuestions=0;}]
]){const invalid=clone(attempt);change(invalid);cases.push(testCase(name,'DENY','studentQuizAttempts/alice_a1','create',invalid));}
cases.push(testCase('first completion cannot omit progress','DENY','studentQuizAttempts/alice_a1','create',first));
cases.push(testCase('first completion cannot reuse older progress','DENY','studentQuizAttempts/alice_a1','create',first,{after:{'studentProgress/alice_m1':completion},existing:{'studentProgress/alice_m1':true}}));
cases.push(testCase('first completion cannot use another owner','DENY','studentQuizAttempts/alice_a1','create',first,{after:{'studentProgress/alice_m1':{...completion,userId:'bob'}}}));
cases.push(testCase('first completion must match recorded score','DENY','studentQuizAttempts/alice_a1','create',first,{after:{'studentProgress/alice_m1':{...completion,bestScore:100}}}));
const news={classId:'class1',status:'published',title:'Our next discussion',body:'Bring your questions.'};
const member={docs:{'classMembers/alice_class1':{userId:'alice',status:'active'}},existing:{'classMembers/alice_class1':true}};
for(const method of ['get','list'])cases.push(testCase('member reads published announcement '+method,'ALLOW','classAnnouncements/news',method,null,{resource:news,...member}));
cases.push(testCase('nonmember cannot read announcements','DENY','classAnnouncements/news','get',null,{resource:news}));
cases.push(testCase('member cannot read announcement drafts','DENY','classAnnouncements/news','get',null,{resource:{...news,status:'draft'},...member}));
cases.push(testCase('anonymous cannot read announcements','DENY','classAnnouncements/news','get',null,{resource:news,...member,uid:null}));
for(const method of ['create','update','delete'])cases.push(testCase('student cannot '+method+' announcement','DENY','classAnnouncements/news',method,news,{resource:news,...member}));
for(const [frameId,level,min]of [['bamboo',3,3],['sunburst',5,5],['guardian',10,10]]){
 const cosmetic={frameId,updatedAt:time};
 cases.push(testCase('earned '+frameId+' frame may be equipped','ALLOW','studentCosmetics/alice','create',cosmetic,{docs:{'users/alice':{...student,level}}}));
 cases.push(testCase('locked '+frameId+' frame cannot be equipped','DENY','studentCosmetics/alice','create',cosmetic,{docs:{'users/alice':{...student,level:min-1}}}));
}
cases.push(testCase('owner reads own cosmetics','ALLOW','studentCosmetics/alice','get',null,{resource:{frameId:'none',updatedAt:time}}));
cases.push(testCase('cosmetics cannot be enumerated','DENY','studentCosmetics/alice','list',null,{resource:{frameId:'none',updatedAt:time}}));
cases.push(testCase('other account cosmetics stay private','DENY','studentCosmetics/bob','get',null,{resource:{frameId:'none',updatedAt:time}}));
cases.push(testCase('cosmetics cannot change XP','DENY','studentCosmetics/alice','create',{frameId:'none',updatedAt:time,xp:999}));
cases.push(testCase('unknown frame is rejected','DENY','studentCosmetics/alice','create',{frameId:'fake',updatedAt:time}));
cases.push(testCase('another account cannot equip cosmetics','DENY','studentCosmetics/bob','create',{frameId:'none',updatedAt:time}));
cases.push(testCase('active student reads finale definition','ALLOW','learningSettings/journeyFinale','get',null,{resource:{enabled:true,id:'v1'}}));
cases.push(testCase('anonymous cannot read finale definition','DENY','learningSettings/journeyFinale','get',null,{resource:{enabled:true,id:'v1'},uid:null}));
cases.push(testCase('student cannot change finale requirements','DENY','learningSettings/journeyFinale','update',{enabled:true,id:'forged'},{resource:{enabled:true,id:'v1'}}));
cases.push(testCase('student cannot list finale configuration','DENY','learningSettings/journeyFinale','list',null,{resource:{enabled:true,id:'v1'}}));
module.exports={cases};
