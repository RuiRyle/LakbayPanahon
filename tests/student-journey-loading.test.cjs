const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('optional dashboard reads do not block learning or invent resolved review evidence',async()=>{
 let failed='studentPracticeProgress',input,rendered;
 const context=vm.createContext({instructionalSnapshot:(_,load)=>load(),auth:{currentUser:{uid:'student'}},db:{},console:{warn(){}},
 document:{getElementById:id=>id==='newJourneyState'?{}:null},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
 doc:()=>({}),getDocFromServer:async()=>({exists:()=>true,data:()=>({})}),
 getDocs:async ref=>{if(ref.name===failed)throw Error('Unavailable');return {docs:[]};},
 missionReviewTopics:()=>[],resolveStudentJourney:value=>{input=value;return {kind:'mission'};},
 renderStudentJourney:(_,state)=>{rendered=state;}});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/review-question-catalog.js"),"utf8").replace(/export /g,""),context);
 vm.runInContext(source.slice(source.indexOf('async function loadCurrentJourney('),source.indexOf('window.addEventListener("pageshow"')),context);
 await context.loadCurrentJourney('student');assert.equal(rendered.kind,'mission');assert.equal(rendered.optionalGuidanceUnavailable,true);assert.equal(input.reviewTopics,undefined);
 failed='studentLearningDrafts';await context.loadCurrentJourney('student');assert.equal(rendered.kind,'mission');assert.equal(input.drafts.length,0);assert.equal(Array.isArray(input.reviewTopics),true);
 failed='studentReviewEvents';await context.loadCurrentJourney('student');assert.equal(rendered.kind,'mission');assert.equal(input.reviewTopics,undefined);assert.equal(rendered.optionalGuidanceUnavailable,true);
 failed='studentProgress';await context.loadCurrentJourney('student');assert.equal(rendered.kind,'error');
 failed=null;await context.loadCurrentJourney('student');assert.equal(rendered.optionalGuidanceUnavailable,false);
});

test('older dashboard loads cannot replace fresh results or errors',async()=>{
 let release,slow=true,rendered;
 const gate=new Promise(resolve=>{release=resolve;});
 const context=vm.createContext({instructionalSnapshot:(_,load)=>load(),auth:{currentUser:{uid:'student'}},db:{},console:{warn(){}},
 document:{getElementById:id=>id==='newJourneyState'?{}:null},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
 doc:()=>({}),getDocFromServer:async()=>({exists:()=>true,data:()=>({})}),
 getDocs:async()=>{if(slow){await gate;throw Error('Old read failed');}return{docs:[]};},
 missionReviewTopics:()=>[],resolveStudentJourney:()=>({kind:'mission'}),renderStudentJourney:(_,state)=>{rendered=state;}});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/review-question-catalog.js"),"utf8").replace(/export /g,""),context);
 vm.runInContext(source.slice(source.indexOf('async function loadCurrentJourney('),source.indexOf('window.addEventListener("pageshow"')),context);
 const old=context.loadCurrentJourney('student');slow=false;await context.loadCurrentJourney('student');
 assert.equal(rendered.kind,'mission');release();await old;assert.equal(rendered.kind,'mission');
 context.auth.currentUser=null;await context.loadCurrentJourney('student');assert.equal(rendered.kind,'mission','Signed-out call rendered stale content');
});
test('home journey and review panel reuse one catalog and progress load',async()=>{
 const panel={textContent:''},reload={disabled:false,addEventListener(){}},reads=new Map(),cached=[];let topicsRendered=0;
 const context=vm.createContext({instructionalSnapshot:(name,load)=>{cached.push(name);return load();},auth:{currentUser:{uid:'student'}},db:{},console:{warn(){}},
 document:{getElementById:id=>id==='studentReviewTopics'?panel:id==='reloadStudentReview'?reload:{}},
 collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
 doc:()=>({}),getDocFromServer:async()=>({exists:()=>true,data:()=>({})}),
 getDocs:async ref=>{reads.set(ref.name,(reads.get(ref.name)||0)+1);return{docs:[]};},
 missionReviewTopics:()=>[],resolveStudentJourney:()=>({kind:'unavailable'}),renderStudentJourney:()=>{},
 renderHomeLearningTrail(){},renderReviewTopics:()=>{topicsRendered++;}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/review-question-catalog.js'),'utf8').replace(/export /g,''),context);
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('async function loadCurrentJourney('),source.indexOf('window.addEventListener("pageshow"')),context);
 await context.loadCurrentJourney('student');
 assert.deepEqual(cached,['chapters','eras','missions','chapterChallenges']);
 assert.equal(reads.get('studentQuizAttempts'),1);assert.equal(reads.get('studentPracticeProgress'),1);assert.equal(reads.get('studentReviewEvents'),1);
 assert.equal(reads.get('practiceQuestions')||0,0);assert.equal(topicsRendered,1);assert.equal(reload.disabled,false);
});
test('dashboard counter and journey can share one owned progress snapshot',async()=>{
 const reads=[];const snapshot={docs:[],forEach(){}};
 const context=vm.createContext({instructionalSnapshot:(_,load)=>load(),dashboardGeneration:1,auth:{currentUser:{uid:'student'}},db:{},console:{warn(){},error(){}},
  document:{getElementById:id=>id==='newJourneyState'?{}:null},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
  doc:()=>({}),getDocFromServer:async()=>({exists:()=>true,data:()=>({})}),
  getDocs:async ref=>{reads.push(ref.name);return{docs:[],forEach(){}};},setText(){},
  missionReviewTopics:()=>[],resolveStudentJourney:()=>({kind:'unavailable'}),renderStudentJourney:()=>{}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/review-question-catalog.js'),'utf8').replace(/export /g,''),context);
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('async function loadCompletedMissionCount('),source.indexOf('// ==========================================\n// CURRENT JOURNEY')),context);
 vm.runInContext(source.slice(source.indexOf('async function loadCurrentJourney('),source.indexOf('window.addEventListener("pageshow"')),context);
 await Promise.all([context.loadCompletedMissionCount('student',Promise.resolve(snapshot)),context.loadCurrentJourney('student',Promise.resolve(snapshot))]);
 assert.equal(reads.filter(name=>name==='studentProgress').length,0);
});
