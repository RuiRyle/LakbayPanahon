const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const context = vm.createContext({crypto:require('node:crypto').webcrypto,Uint8Array});
vm.runInContext(fs.readFileSync(require.resolve('../js/teacher-class-policy.js'),'utf8').replace(/export /g,''),context);
test('class details trim input and enforce content bounds',()=>{
    assert.equal(context.classDetails(' Grade 5 ',' History ').name,'Grade 5');
    assert.throws(()=>context.classDetails(' ',''));
    assert.throws(()=>context.classDetails('a'.repeat(101),''));
    assert.throws(()=>context.classDetails('A','b'.repeat(501)));
});
test('invitation generation produces 12 random uppercase alphanumeric characters',()=>{
    const codes=Array.from({length:100},()=>context.invitationCode());
    codes.forEach(code=>assert.match(code,/^[A-Z0-9]{12}$/));
    assert.equal(new Set(codes).size,codes.length);
});
test('publication content validates drafts and published messages without HTML interpretation',()=>{
    const message=context.publishedDetails('announcement',{title:' Clues ',body:'<img> A clue.',status:'draft'});
    assert.equal(message.title,'Clues');assert.equal(message.body,'<img> A clue.');assert.equal(message.status,'draft');
    assert.throws(()=>context.publishedDetails('announcement',{title:'Title',body:''}));
    assert.throws(()=>context.publishedDetails('assignment',{title:'Title',missionId:'../m',chapterId:'c'}));
});
test('deadlines use the end of the selected Philippine calendar date and reject impossible dates',()=>{
    assert.equal(context.assignmentDueMillis('2026-11-05'),Date.parse('2026-11-05T15:59:59.999Z'));
    assert.equal(context.assignmentDueMillis(''),null);
    for (const value of ['2026-02-30','2026-13-01','not-a-date']) assert.throws(()=>context.assignmentDueMillis(value));
    assert.equal(context.assignmentDueInput({toMillis:()=>Date.parse('2026-11-05T15:59:59.999Z')}),'2026-11-05');
});
test('assignment tracking keeps unavailable records unknown and distinguishes deadline timing',()=>{
    const dueAt={toMillis:()=>10000}, assignment={chapterId:'c1',dueAt};
    assert.equal(context.assignmentProgressState(null,assignment,true,20000).status,'unavailable');
    assert.equal(context.assignmentProgressState({chapterId:'other',completed:true},assignment,false,20000).status,'unavailable');
    assert.equal(context.assignmentProgressState(null,assignment,false,20000).timing,'Past due · not yet completed');
    assert.equal(context.assignmentProgressState({chapterId:'c1',completed:true,completedAt:{toMillis:()=>9000}},assignment).timing,'Completed by due date');
    assert.equal(context.assignmentProgressState({chapterId:'c1',completed:true,completedAt:{toMillis:()=>11000}},assignment).timing,'Completed after due date');
    assert.equal(context.assignmentProgressState({chapterId:'c1',completed:true},assignment).timing,'Completion date unavailable');
});
test('publication version is stable across key order and detects content changes without timestamps',()=>{
 const first={id:'a',title:'Lesson',status:'draft',body:'Old'};assert.equal(context.publicationVersion(first),context.publicationVersion({body:'Old',status:'draft',title:'Lesson'}));assert.notEqual(context.publicationVersion(first),context.publicationVersion({...first,body:'New'}));
});
test('closed activities keep only completion evidence dated before their ending',()=>{
 const stamp=ms=>({toMillis:()=>ms}),assignment={chapterId:'c',status:'closed',endedAt:stamp(2000)};
 assert.equal(context.assignmentProgressState({chapterId:'c',completed:true,completedAt:stamp(1500)},assignment,false,3000).status,'completed');
 assert.equal(context.assignmentProgressState({chapterId:'c',completed:true,completedAt:stamp(2500)},assignment,false,3000).status,'incomplete');
 assert.equal(context.assignmentProgressState({chapterId:'c',completed:true},assignment,false,3000).status,'unavailable');
 const review={...assignment,missionId:'m',assignedAt:stamp(1000)},attempt=ms=>({userId:'s',missionId:'m',chapterId:'c',score:90,passed:true,completedAt:stamp(ms)});
 assert.equal(context.reviewEvidence(review,[attempt(2500)],'s',3000).completed,false);
 assert.equal(context.reviewEvidence(review,[attempt(1500),attempt(2500)],'s',3000).completed,true);
 assert.equal(context.reviewEvidence(review,[attempt(1500),attempt(2500)],'s',3000).unavailable,false);
});
test('review stages never confuse passing practice with an explanation or teacher feedback',()=>{
 const passed={completed:true,unavailable:false};let stages=context.reviewLearningStages(passed,null);assert.equal(stages.practice,'passed');assert.equal(stages.explanation,'not-yet');assert.equal(stages.guidance,'after-explanation');
 stages=context.reviewLearningStages(passed,{body:'My clue',response:''});assert.equal(stages.explanation,'shared');assert.equal(stages.guidance,'not-yet');
 stages=context.reviewLearningStages(passed,{body:'My clue',response:'Connect the clue to your claim.'});assert.equal(stages.guidance,'sent');
 stages=context.reviewLearningStages(passed,{body:'Revised explanation',response:''});assert.equal(stages.practice,'passed');assert.equal(stages.guidance,'not-yet');
 stages=context.reviewLearningStages(passed,null,{reflectionAvailable:false});assert.equal(stages.practice,'passed');assert.equal(stages.explanation,'unavailable');assert.equal(stages.guidance,'unavailable');
 stages=context.reviewLearningStages({unavailable:true},null,{requested:false});assert.equal(stages.practice,'unavailable');assert.equal(stages.explanation,'not-requested');
 stages=context.reviewLearningStages(passed,{body:'',response:'Unexpected'});assert.equal(stages.guidance,'unavailable');
});

test('duplicate reviews match only active published reviews in the same class and mission',()=>{
 const rows=['published','closed','draft','withdrawn'].map((status,i)=>({id:String(i),classId:'c',missionId:'m',userId:'s',status}));
 assert.equal(context.activeReviewDuplicates(rows,'c','m',['s']).map(r=>r.id).join(','),'0');
 assert.equal(context.activeReviewDuplicates(rows,'c','m',['s'],['0']).length,0);
 assert.equal(context.activeReviewDuplicates(rows,'other','m',['s']).length,0);
 assert.equal(context.activeReviewDuplicates(rows,'c','other',['s']).length,0);
 assert.equal(context.activeReviewDuplicates(rows,'c','m',['other']).length,0);
});

test('intervention summaries distinguish support delivery from observed practice changes',()=>{
 const evidence={baseline:40,latest:80,completed:true},sent={guidance:'sent'};
 let summary=context.reviewInterventionSummary(evidence,sent,{attempted:false});assert.equal(summary.state,'awaiting-followup');assert.ok(summary.after.includes('No saved quiz attempt'));
 for(const change of [20,0,-20]){summary=context.reviewInterventionSummary(evidence,sent,{attempted:true,baseline:60,latest:60+change,change});assert.equal(summary.state,change>0?'higher-practice-score':change<0?'lower-practice-score':'same-practice-score');assert.ok(summary.limit.includes('caused a change'));}
 summary=context.reviewInterventionSummary(evidence,{guidance:'not-yet'},{attempted:true,change:40});assert.equal(summary.state,'needs-check');assert.ok(summary.support.includes('has not been sent'));
 summary=context.reviewInterventionSummary({...evidence,unavailable:true},sent,{attempted:true,change:40});assert.equal(summary.state,'unavailable');assert.ok(summary.after.includes('no improvement judgment'));
 summary=context.reviewInterventionSummary(evidence,sent,{attempted:true,change:null});assert.equal(summary.state,'needs-check');assert.ok(summary.after.includes('no clear before/after'));
});

test('post-guidance comparisons require a strictly later matching attempt',()=>{
 const stamp=ms=>({toMillis:()=>ms}),assignment={missionId:'m',chapterId:'c',assignedAt:stamp(2000)};
 const attempt=(ms,score)=>({userId:'s',missionId:'m',chapterId:'c',score,passed:score>=80,completedAt:stamp(ms)});
 const evidence=context.reviewEvidence(assignment,[attempt(1000,40),attempt(2000,80)],'s',4000);assert.equal(evidence.attempted,false);
 const followup=context.reviewEvidence(assignment,[attempt(1000,40),attempt(2000,80),attempt(3000,90)],'s',4000);assert.equal(followup.baseline,80);assert.equal(followup.change,10);
});

test('later passing retries preserve the first review completion date and deadline outcome',()=>{
 const stamp=ms=>({toMillis:()=>ms}),assignment={chapterId:'c',missionId:'m',assignedAt:stamp(1000),dueAt:stamp(2000),status:'published'};
 const attempt=(id,ms,score)=>({id,userId:'s',missionId:'m',chapterId:'c',score,passed:true,completedAt:stamp(ms)});
 const evidence=context.reviewEvidence(assignment,[attempt('later',2500,100),attempt('first',1500,80)],'s',3000);
 assert.equal(evidence.completedAt.toMillis(),1500);
 assert.equal(evidence.latest,100);
 assert.equal(context.assignmentProgressState({...evidence,chapterId:'c'},assignment,false,3000).timing,'Completed by due date');
});

test('future and nonpositive class completion dates cannot establish completion',()=>{
 for(const ms of [0,-1,4000])assert.equal(context.assignmentProgressState({chapterId:'c',completed:true,completedAt:{toMillis:()=>ms}},{chapterId:'c'},false,3000).status,'unavailable');
});
