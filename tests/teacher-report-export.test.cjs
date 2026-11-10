const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({Date,Blob});vm.runInContext(fs.readFileSync(require.resolve('../js/teacher-report-export.js'),'utf8').replace(/export /g,''),context);

test('malformed timestamps and invalid scores cannot break or misrepresent an individual export',()=>{
 const broken={toMillis(){throw Error('bad timestamp');}},overflow={toMillis:()=>1e20};
 const report={progress:[{missionId:'m',bestScore:101,completedAt:overflow}],attempts:[{missionId:'m',score:-1,completedAt:broken},{missionId:'m',score:0,completedAt:{toMillis:()=>1000}}]};
 const rows=context.learningReportRows({studentName:'Synthetic',className:'Class',missions:[],report});
 assert.equal(rows[7][3],'Unavailable');assert.equal(rows[7][5],'Unavailable');
 assert.equal(rows[8][3],0);assert.equal(rows[9][3],'Unavailable');assert.equal(rows[9][5],'Unavailable');
 assert.equal(report.progress[0].bestScore,101,'source records remain unchanged');
});
test('classroom export skips unusable dates while retaining valid dated evidence',()=>{
 const report={progress:[],attempts:[{chapterId:'c',missionId:'m',score:100,completedAt:{toMillis(){throw Error('bad');}}},{chapterId:'c',missionId:'m',score:80,passed:true,completedAt:{toMillis:()=>1000}}]};
 const rows=context.classroomReportRows({className:'Class',students:[{name:'Synthetic',report}],missions:[{chapterId:'c',id:'m'}]});
 assert.equal(rows[7][4],80);assert.equal(rows[7][5],'Passed');
});
test('learning export includes records and explicit unknowns, excludes private fields',()=>{
    const rows=context.learningReportRows({studentName:'Ana',className:'Grade 5',missions:[{id:'m1',title:'Boats'}],generatedAt:new Date('2026-11-05T00:00:00Z'),report:{profile:{email:'private@example.com'},note:'PRIVATE NOTE',feedback:'PRIVATE FEEDBACK',progress:[{missionId:'m1',completed:true,bestScore:80}],attempts:[{missionId:'m1',score:40,passed:false,topicsForReview:['boat_use'],completedAt:{toMillis:()=>1000}}]}});
    const serialized=JSON.stringify(rows);assert.ok(serialized.includes('Boats'));assert.ok(serialized.includes('boat use'));assert.ok(serialized.includes('Unavailable'));assert.ok(serialized.includes('1970-01-01T00:00:01.000Z'));
    assert.ok(!serialized.includes('PRIVATE NOTE'));assert.ok(!serialized.includes('PRIVATE FEEDBACK'));assert.ok(!serialized.includes('private@example.com'));
});
test('CSV quotes delimiters/newlines and neutralizes spreadsheet formulas',()=>{
    const csv=context.learningReportCSV([['=HYPERLINK("bad")',' +SUM(1,2)','@formula','-3','normal, "quote"\nline']]);
    assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.includes('"\' +SUM(1,2)"'));assert.ok(csv.includes('"\'@formula"'));assert.ok(csv.includes('"\'-3"'));assert.ok(csv.includes('"normal, ""quote""\nline"'));
});
test('empty learning export is explicit without fabricated scores',()=>{
    const rows=context.learningReportRows({studentName:'Ana',className:'Class',report:{progress:[],attempts:[]},missions:[]});assert.equal(rows.at(-1)[0],'No saved learning records available');
});

test('classroom snapshot distinguishes missing records, zero scores and duplicate completion records',()=>{
 const rows=context.classroomReportRows({className:'Grade 5',generatedAt:new Date(10000),missions:[{id:'m1',chapterId:'c1'},{id:'m2',chapterId:'c1'}],students:[{name:'Unknown',report:null},{name:'Ana',report:{profile:{email:'PRIVATE'},progress:[{missionId:'m1',chapterId:'c1',completed:true},{missionId:'m1',chapterId:'c1',completed:true},{missionId:'retired',chapterId:'c1',completed:true}],attempts:[{missionId:'m1',chapterId:'c1',score:0,passed:false,completedAt:{toMillis:()=>1000}}]}},{name:'No quizzes',report:{progress:[],attempts:[]}}]});
 assert.equal(rows[7][1],'Unavailable');assert.equal(rows[7][2],'');assert.equal(rows[8][2],1);assert.equal(rows[8][3],2);assert.equal(rows[8][4],0);assert.equal(rows[9][4],'Unavailable');assert.ok(!JSON.stringify(rows).includes('PRIVATE'));
});
test('classroom snapshot does not select tied, future or undated quiz scores',()=>{
 const attempt=ms=>({missionId:'m1',chapterId:'c1',score:90,completedAt:{toMillis:()=>ms}});
 const rows=context.classroomReportRows({className:'Class',generatedAt:new Date(10000),missions:[{id:'m1',chapterId:'c1'}],students:[{name:'Ana',report:{progress:[],attempts:[attempt(1000),attempt(1000),attempt(20000),{missionId:'m1',chapterId:'c1',score:100}]}}]});assert.equal(rows[7][4],'Unavailable');assert.equal(rows[7][5],'Latest attempt unclear');
});

test('evidence interpretation separates participation, completion, understanding and retention',()=>{
 const guide=vm.runInContext('learningEvidenceGuide',context);
 assert.equal(guide.length,6);
 assert.ok(guide.every(entry=>entry.label&&entry.meaning&&entry.next));
 assert.ok(guide.find(entry=>entry.label==='Student explanation').meaning.includes('does not establish'));
 assert.ok(guide.find(entry=>entry.label==='Teacher guidance').meaning.includes('does not establish'));
 assert.ok(guide.find(entry=>entry.label==='Retention and application').next.includes('No retention score'));
 const rows=context.learningReportRows({studentName:'Ana',className:'Class',report:{progress:[],attempts:[]},missions:[]});
 assert.ok(rows[4][1].includes('Completion is not mastery'));
 assert.ok(rows[4][1].includes('not assessed by this export'));
});
