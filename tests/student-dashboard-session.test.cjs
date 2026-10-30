const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('dashboard counts ignore reads from a replaced session',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;}),updates=[];
 const context=vm.createContext({dashboardGeneration:1,auth:{currentUser:{uid:'student'}},db:{},console:{error(){}},
 document:{getElementById:()=>({})},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
 getDocs:async()=>{await gate;return{size:1,forEach:fn=>fn({data:()=>({completed:true})})};},
 setText:(...args)=>updates.push(args)});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 for(const [start,end] of [['loadCompletedMissionCount','async function loadCurrentJourney'],['loadBadgeCount','function setText']]) {
     vm.runInContext(source.slice(source.indexOf('async function '+start+'('),source.indexOf(end)),context);
 }
 const reads=[context.loadCompletedMissionCount('student'),context.loadBadgeCount('student')];
 context.dashboardGeneration++;context.auth.currentUser={uid:'student'};release();await Promise.all(reads);
 assert.equal(updates.length,0,'Previous session updated fresh dashboard');
 await context.loadCompletedMissionCount('student');await context.loadBadgeCount('student');
 assert.equal(updates.length,2,'Current session counts did not render');
});

test('dashboard links to Achievements without reading artifact ownership or catalog',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../pages/student-dashboard.html'),'utf8');
 assert.doesNotMatch(source,/loadArtifactCollection|studentArtifacts/);
 assert.doesNotMatch(html,/id="artifactGrid"|id="artifactCount"/);
 assert.match(html,/href="achievements.html"[^>]*>Open Collections/);
});

test('failed dashboard counts show unknown values and retry only their own query',async()=>{
 const updates=[],retries=[],reads=[];let fails=true;
 const context=vm.createContext({dashboardGeneration:1,auth:{currentUser:{uid:'student'}},db:{},console:{error(){}},
 document:{getElementById:()=>({parentElement:{}})},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
 getDocs:async ref=>{reads.push(ref.name);if(fails)throw Error('offline');return{size:0,forEach(){}};},
 setText:(...args)=>updates.push(args),appendDashboardRetry:(container,label,id,retry)=>retries.push(retry)});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 for(const [start,end] of [['loadCompletedMissionCount','async function loadCurrentJourney'],['loadBadgeCount','function setText']])vm.runInContext(source.slice(source.indexOf('async function '+start+'('),source.indexOf(end)),context);
 await context.loadCompletedMissionCount('student');await context.loadBadgeCount('student');
 assert.deepEqual(updates,[['missionsCompleted','Not loaded'],['badgesEarned','Not loaded']]);
 fails=false;reads.length=0;await retries[0]();assert.deepEqual(reads,['studentProgress']);
 assert.deepEqual(updates.at(-1),['missionsCompleted',0]);
 reads.length=0;await retries[1]();assert.deepEqual(reads,['studentBadges']);
 assert.deepEqual(updates.at(-1),['badgesEarned',0]);
});
test('Home completed-mission total counts owned mission IDs once',async()=>{
 const updates=[],rows=[{userId:'student',missionId:'m1',completed:true},{userId:'student',missionId:'m1',completed:true},{userId:'student',missionId:'m2',completed:true},{userId:'other',missionId:'m3',completed:true},{userId:'student',missionId:'m4',completed:false}];
 const context=vm.createContext({dashboardGeneration:1,auth:{currentUser:{uid:'student'}},db:{},console:{error(){}},
  document:{getElementById:()=>null},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
  getDocs:async()=>({forEach:fn=>rows.forEach(row=>fn({data:()=>row}))}),setText:(...args)=>updates.push(args)});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('async function loadCompletedMissionCount('),source.indexOf('// ==========================================\n// CURRENT JOURNEY')),context);
 await context.loadCompletedMissionCount('student');assert.deepEqual(updates,[['missionsCompleted',2]]);
});
test('Home badge total matches distinct owned badge collection IDs',async()=>{
 const updates=[],rows=[{userId:'student',badgeId:'b1'},{userId:'student',badgeId:'b1'},{userId:'student',badgeId:'b2'},{userId:'other',badgeId:'b3'},{userId:'student',badgeId:'bad/id'}];
 const context=vm.createContext({dashboardGeneration:1,auth:{currentUser:{uid:'student'}},db:{},console:{error(){}},
  document:{getElementById:()=>null},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
  getDocs:async()=>({size:rows.length,forEach:fn=>rows.forEach(row=>fn({data:()=>row}))}),setText:(...args)=>updates.push(args)});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('async function loadBadgeCount('),source.indexOf('// ==========================================\n// TEXT HELPERS')),context);
 await context.loadBadgeCount('student');assert.deepEqual(updates,[['badgesEarned',2]]);
});
