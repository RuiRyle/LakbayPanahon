const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('dashboard offers profile and level-setting recovery without a page reload',async()=>{
 const element=()=>({textContent:'',children:[],append(child){this.children.push(child);},addEventListener(_,fn){this.click=fn;},remove(){},replaceChildren(){this.children=[];}});
 const panel=element(),progress=element(),elements={newJourneyState:panel,nextLevelText:{parentElement:progress}};
 let profileFails=true,policyFails=false,reads=0;
 const context=vm.createContext({dashboardGeneration:0,auth:{currentUser:{uid:'student'}},db:{},console:{error(){},warn(){}},
 document:{getElementById:id=>elements[id]||null,createElement:element},doc:()=>'',
 getDoc:async()=>{reads++;if(profileFails)throw Error('Offline');return{exists:()=>true,data:()=>({role:'student',xp:0,firstName:'Ana'})};},
 loadProgressionPolicy:async()=>{if(policyFails)throw Error('Unavailable');return{xpPerLevel:100};},progressionState:()=>({level:1}),
 setText(){},loadPlayerProgress(){},loadCompletedMissionCount:async()=>{},loadCurrentJourney:async()=>{},loadBadgeCount:async()=>{}});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('async function loadStudentDashboard('),source.indexOf('onAuthStateChanged(auth, loadStudentDashboard)'))+source.slice(source.indexOf('function appendDashboardRetry(')),context);
 await context.loadStudentDashboard(context.auth.currentUser);
 assert.match(panel.textContent,/could not finish/);assert.equal(panel.children[0].textContent,'Retry Loading Dashboard');
 profileFails=false;await panel.children[0].click();assert.equal(reads,2);
 policyFails=true;await context.loadStudentDashboard(context.auth.currentUser);
 assert.equal(progress.children[0].textContent,'Retry Level Settings');
 policyFails=false;await progress.children[0].click();assert.equal(reads,4);
});

test('independent dashboard sections start together and one failure does not replace successful guidance',async()=>{
 const started=[];let release;const gate=new Promise(resolve=>{release=resolve;});
 const panel={textContent:'current journey'};
 const section=name=>async()=>{started.push(name);if(name==='badges')throw Error('Unavailable');await gate;};
 const context=vm.createContext({dashboardGeneration:0,auth:{currentUser:{uid:'student'}},db:{},console:{error(){},warn(){}},
 document:{getElementById:id=>id==='newJourneyState'?panel:null},doc:()=>'',getDoc:async()=>({exists:()=>true,data:()=>({role:'student',xp:0})}),collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,getDocs:async()=>({docs:[]}),
 loadProgressionPolicy:async()=>({xpPerLevel:100}),progressionState:()=>({level:1}),setText(){},loadPlayerProgress(){},
 loadCompletedMissionCount:section('missions'),loadCurrentJourney:section('journey'),loadBadgeCount:section('badges')});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('async function loadStudentDashboard('),source.indexOf('onAuthStateChanged(auth, loadStudentDashboard)')),context);
 const loading=context.loadStudentDashboard(context.auth.currentUser);await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(started,['missions','journey','badges']);release();await loading;
 assert.equal(panel.textContent,'current journey');
});
test('back-forward cache return refreshes all Home progress, not only journey guidance',()=>{
 let pageshow,refreshed=0,journeyOnly=0;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},window:{addEventListener:(name,fn)=>{if(name==='pageshow')pageshow=fn;}},
  loadStudentDashboard:user=>{assert.equal(user.uid,'student');refreshed++;},loadCurrentJourney:()=>journeyOnly++});
 const source=fs.readFileSync(path.join(__dirname,'../js/student.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf('window.addEventListener("pageshow"'),source.indexOf('async function loadBadgeCount(')),context);
 pageshow({persisted:false});assert.equal(refreshed,0);
 pageshow({persisted:true});assert.equal(refreshed,1);assert.equal(journeyOnly,0);
 context.auth.currentUser=null;pageshow({persisted:true});assert.equal(refreshed,1);
});
