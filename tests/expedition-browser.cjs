// Local fixture review: real pages/styles and presentation code, no account or network.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url'),{spawn}=require('node:child_process');
const root=path.join(__dirname,'..'),out=path.join(root,'build','expedition-review');
fs.mkdirSync(out,{recursive:true});
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const moduleBody=file=>read(file).replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm,'').replace(/export /g,'');
const shared=read('js/expedition-ui.js');
const passport=moduleBody('js/lakbay-passport.js');
const journey=moduleBody('js/student-journey.js');
const presentation=['explorer-art.js','explorer-desk.js','era-arrival.js','discovery-pins.js','chapter-keepsake.js'].map(file=>moduleBody('js/'+file)).join('\n');
const achievements=read('js/achievements.js');
const artifact=achievements.slice(achievements.indexOf('function createArtifactCard('),achievements.indexOf('onAuthStateChanged(auth, user =>'));
const storySource=read('js/story.js');
const exploreFunction=storySource.slice(storySource.indexOf('function displayStoryExplore(scene)'),storySource.indexOf('function isSceneExploreComplete(scene)'));
const state=`({kind:'mission',started:true,eraTitle:'Early communities',eraTheme:'forest',chapter:{id:'c1',eraId:'e1',title:'Early Philippine Communities'},mission:{id:'m1',title:'Clues from a coastal community',introduction:'Look closely at the objects and stories that help explain life in early communities.',estimatedMinutes:8},completedCount:1,totalMissions:4})`;
const setups={
 'index.html':``,
 'pages/student-dashboard.html':`${journey}\nrenderStudentJourney(document.getElementById('newJourneyState'),${state},()=>{});renderExplorerDesk(document.getElementById('explorerDesk'),${state});document.getElementById('homeLearningTrail').textContent='Continue your current chapter to discover the next lesson.';`,
 'pages/my-journey.html':`${journey}\n${passport}\ndocument.getElementById('journeyPageContent').hidden=false;document.getElementById('journeyPageStatus').textContent='Local design preview';renderPassport(document.getElementById('passportStamps'),[{id:'c1',title:'Early Philippine Communities',era:'Early communities',date:'30 Oct 2026'},{id:'c2',title:'Trade and Exchange',era:'Early communities',date:'30 Oct 2026'}]);renderStudentJourney(document.getElementById('journeyNextAction'),${state},()=>{});document.getElementById('journeyMissionCount').textContent='6 / 20';document.getElementById('journeyChapterCount').textContent='2 / 5';document.getElementById('journeyReviewCount').textContent='1';`,
 'pages/chapters.html':`document.getElementById('eraLoading').hidden=true;document.getElementById('eraList').innerHTML=['sea','forest','sand'].map((theme,i)=>'<article class="era-card available" data-theme="'+theme+'"><div class="era-image"><img class="era-destination-art" alt="" src="../assets/brand/'+['expedition-atlas.svg','expedition-community.svg','expedition-archive.svg'][i]+'"><span class="destination-number">DESTINATION 0'+(i+1)+'</span></div><div class="era-content"><span class="era-status">AVAILABLE</span><h3>'+['Early Communities','Connections and Exchange','Stories of Change'][i]+'</h3><p>Discover the people, places, and evidence behind this part of the journey.</p><a class="era-button" href="era.html?era=fixture">Explore Era →</a></div></article>').join('');`,
 'pages/story.html':`document.getElementById('storyContent').hidden=false;for(const id of ['storyLoading','storyError']){const el=document.getElementById(id);if(el)el.hidden=true;}document.getElementById('storyMissionTitle').textContent='Clues from a coastal community';document.getElementById('storyChapterTitle').textContent='Early Philippine Communities';document.getElementById('sceneTitle').textContent='What can an object tell us?';document.getElementById('sceneLabel').textContent='SCENE 1';document.getElementById('storyText').innerHTML='<p>Imagine looking closely at the objects people left behind. A tool, a pot, or the remains of a boat can help us ask questions about their daily lives.</p><p>Start with what you can observe. Then connect the clue to an explanation supported by evidence.</p>';document.getElementById('sceneProgressText').textContent='Scene 1 of 4';document.getElementById('storyProgressFill').style.width='25%';document.getElementById('storySceneTrail').innerHTML='<li aria-current="step">1</li><li>2</li><li>3</li><li>4</li>';`,
 'pages/achievements.html':`${artifact}\ndocument.getElementById('artifacts').hidden=false;document.getElementById('artifactLoading').hidden=true;document.getElementById('earnedBadgeCount').textContent='2';document.getElementById('artifactCount').textContent='1';document.getElementById('artifactGrid').append(createArtifactCard({id:'a1',name:'A trading vessel',description:'A learning keepsake for exploring connections between coastal communities.',chapterId:'c1',missionId:'m1',icon:'⛵'}));`,
 'pages/bayani-ai.html':`document.getElementById('bayaniStatus').textContent='Local design preview';`,
 'pages/teacher-dashboard.html':``
};
setups['pages/era.html']=`document.getElementById('eraLoading').hidden=true;document.getElementById('eraOverview').hidden=false;document.getElementById('eraOverviewTitle').textContent='Connections and exchange';document.getElementById('eraOverviewDescription').textContent='Follow the evidence of how communities connected across the islands.';document.getElementById('eraOverviewArt').append(createExplorerArt('map'));document.getElementById('eraOverviewPeriod').textContent='An authored period label';document.getElementById('eraOverviewPeriod').hidden=false;`;
setups['pages/story.html']+=`\nconst storyExplore=document.getElementById('storyExplore'),storyExploreIntroduction=document.getElementById('storyExploreIntroduction'),storyExploreChoices=document.getElementById('storyExploreChoices');const opened=new Set();const getExploreItems=scene=>scene.exploreItems,getExploredItemsForScene=()=>opened,clean=value=>typeof value==='string'?value.trim():'',isSafeImageUrl=()=>false;function updateStoryClueHuntUnlock(){}function updateContinueButton(){}\n${exploreFunction}\ndisplayStoryExplore({id:'fixture-scene',exploreIntroduction:'Inspect a clue and connect it to an explanation.',exploreItems:[{title:'A closer look',hint:'What can you observe?',icon:'◈',discovery:'Start with what the evidence shows. Compare it with the explanation in your lesson.'}]});`;
setups['pages/my-profile.html']=`${moduleBody('js/evidence-journal.js')}\nconst fixtureRecords=new Map([
 ['studentArtifacts/fixture_a1',{userId:'fixture',artifactId:'a1',chapterId:'c1',missionId:'m1'}],['artifacts/a1',{status:'active',name:'A mission keepsake',description:'A reminder of the connections explored in your lesson.'}],
 ['studentEvidenceJournal/fixture_j1',{userId:'fixture',sceneId:'s1',chapterId:'c1',missionId:'m1',clueIndex:0}],['storyScenes/s1',{status:'active',missionId:'m1',exploreItems:[{title:'Evidence from a lesson',discovery:'A saved clue gives you a starting point for explaining what you learned.'}]}],['missions/m1',{status:'active',chapterId:'c1',title:'Community connections'}],['chapters/c1',{status:'active',title:'Early communities'}]
 ]);const doc=(_,name,id)=>name+'/'+id,getDoc=async key=>({id:key.split('/')[1],exists:()=>fixtureRecords.has(key),data:()=>fixtureRecords.get(key)}),onAuthStateChanged=(_,callback)=>callback(auth.currentUser);toggleDiscoveryPin('fixture',{kind:'artifact',id:'a1'});toggleDiscoveryPin('fixture',{kind:'journal',id:'fixture_j1'});\n${moduleBody('js/discovery-wall-page.js')}`;
setups['pages/chapter-challenge.html']=`document.getElementById('challengeChapterTitle').textContent='Chapter complete';document.getElementById('challengeDescription').textContent='Your completion has been saved. Take a moment to connect what you discovered.';document.getElementById('challengeStatus').textContent='Your chapter is recorded.';const fixtureKeepHost=document.createElement('section');fixtureKeepHost.id='fixtureKeepsake';fixtureKeepHost.className='chapter-keepsake';document.querySelector('.chapter-challenge-intro').append(fixtureKeepHost);renderChapterKeepsake(fixtureKeepHost,{chapter:{id:'c1',eraId:'e1',title:'Early Philippine Communities'},firstCompletion:true,nextChapter:{id:'c2',title:'Connections across communities'},artifacts:[{title:'A mission keepsake'}],artifactsAvailable:true});`;
const results=[];
async function main(){
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-expedition-'));
const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
 '--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars',
 '--user-data-dir='+profile,'--remote-debugging-pipe'
],{stdio:['ignore','ignore','ignore','pipe','pipe'],windowsHide:true});
let sequence=0,buffer='';const pending=new Map();
browser.stdio[4].on('data',chunk=>{
 buffer+=chunk.toString();let end;
 while((end=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);const request=pending.get(message.id);if(request){pending.delete(message.id);clearTimeout(request.timer);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}}
});
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
 const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Chrome timed out: '+method));},15000);
 pending.set(id,{resolve,reject,timer});browser.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
});
try{
await send('Browser.getVersion');
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
await send('Page.enable',{},sessionId);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},sessionId);
for(const [file,setup] of Object.entries(setups)){
 let html=read(file).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.join(root,path.dirname(file))) .href+'/">');
 html=html.replace('auth-checking','authenticated');
 html=html.replace(/<body([^>]*)>/,(_,attrs)=>'<body'+attrs+'>');
 // Some protected pages use inline auth visibility; fixture explicitly renders them.
 html=html.replace('</head>','<style>body{visibility:visible!important}.student-loading-shell{display:none!important}</style></head>');
 const check=`
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 window.addEventListener('error',event=>{document.getElementById('reviewResult').textContent='FAIL: '+event.message;});
 (async()=>{
 const auth={currentUser:{uid:'fixture'}},db={};
 ${presentation}
 localStorage.removeItem(discoveryPinKey('fixture'));
 ${setup}
 ${shared}
 await new Promise(resolve=>setTimeout(resolve,300));
 const toggle=document.getElementById('readingSurfaceToggle');
 if(toggle){check(document.body.classList.contains('paper-reading'),'paper surface default');toggle.click();check(!document.body.classList.contains('paper-reading'),'reading toggle');toggle.click();}
 const input=document.getElementById('bayaniInput');
 if(input){const chip=document.querySelector('[data-bayani-prompt]');check(chip.disabled,'offline prompt state');input.disabled=false;await Promise.resolve();check(!chip.disabled,'ready prompt state');chip.click();check(input.value.includes('history lesson'),'question starter');check(!document.getElementById('bayaniMessages').children.length,'chip sent a message');input.disabled=true;await Promise.resolve();check(chip.disabled,'busy prompt state');}
 const stamps=document.getElementById('passportStamps');if(stamps){check(stamps.children.length===2,'passport rendering');check(getComputedStyle(document.getElementById('passportTitle')).color==='rgb(220, 229, 237)','passport heading contrast');}
 const gallery=document.getElementById('artifactGrid');if(gallery){check(gallery.querySelector('details'),'artifact details missing');gallery.querySelector('details').open=true;check(gallery.querySelector('a').href.includes('mission=m1'),'artifact lesson context');}
 const desk=document.getElementById('explorerDesk');if(desk){check(desk.children.length===3,'desk objects missing');check(desk.dataset.theme==='forest','desk theme did not follow era');check(desk.querySelector('a').href.includes('era=e1'),'desk map lost era context');}
 const arrival=document.getElementById('eraArrival');if(arrival&&!arrival.hidden){check(arrival.textContent.includes('An authored period label'),'arrival lost period');arrival.querySelector('button').click();check(arrival.hidden,'arrival cannot be skipped');check(document.activeElement.id==='eraOverviewTitle','arrival skip lost focus');arrival.hidden=false;}
 const clue=document.querySelector('.story-explore-choice');if(clue){clue.click();const result=document.getElementById(clue.getAttribute('aria-controls'));check(result&&!result.hidden,'clue result missing');check(result.querySelector('.evidence-reflection'),'clue reflection missing');}
 const pin=document.querySelector('#artifactGrid .discovery-pin-button');if(pin){pin.click();check(pin.getAttribute('aria-pressed')==='true','artifact pin failed');check(readDiscoveryPins('fixture').pins.length===1,'pin was not saved');pin.click();check(readDiscoveryPins('fixture').pins.length===0,'unpin failed');}
 const wall=document.getElementById('discoveryWallEntries');if(wall){check(wall.children.length===2,'owned wall entries missing');wall.querySelector('.discovery-pin-button').click();await new Promise(resolve=>setTimeout(resolve,50));check(wall.children.length===1,'wall did not refresh after unpin');toggleDiscoveryPin('fixture',{kind:'artifact',id:'a1'});await loadDiscoveryWall();const pendingWall=loadDiscoveryWall();auth.currentUser={uid:'another-student'};await loadDiscoveryWall();await pendingWall;check(wall.children.length===0,'replaced account retained a pinned discovery');auth.currentUser={uid:'fixture'};await loadDiscoveryWall();check(wall.children.length===2,'wall did not recover after account change');}
 const keepsake=document.getElementById('fixtureKeepsake');if(keepsake){check(keepsake.querySelectorAll('.chapter-keepsake-step').length===3,'completion reveal missing steps');check([...keepsake.querySelectorAll('a')].some(link=>link.href.includes('chapter=c2')),'completion next route missing');const focused=keepsake.querySelector('a');focused.focus({preventScroll:true});const revealData={chapter:{id:'c1',eraId:'e1',title:'Early Philippine Communities'},firstCompletion:true,nextChapter:{id:'c2',title:'Connections across communities'},artifacts:[{title:'A mission keepsake'}],artifactsAvailable:true};renderChapterKeepsake(keepsake,revealData);check(document.activeElement===focused,'async reveal update lost keyboard focus');focused.blur();}
 const nextAction=document.getElementById('journeyNextAction');if(nextAction){check(nextAction.closest('section')===document.getElementById('journeyPageContent').firstElementChild,'Next learning action is buried below collections');check(getComputedStyle(nextAction.querySelector('.journey-details')).borderTopWidth==='0px','Recovery action still has nested card borders');}
 check(document.documentElement.scrollWidth<=innerWidth+1,'horizontal overflow '+document.documentElement.scrollWidth+'/'+innerWidth);
 for(const icon of document.querySelectorAll('.sidebar .nav-icon'))check(icon.querySelector('svg'),'mixed navigation icon');
 document.getElementById('reviewResult').textContent='PASS: ${file} '+innerWidth+'px';
 })().catch(error=>{document.getElementById('reviewResult').textContent='FAIL: '+error.message;});`;
 html=html.replace('</body>','<output id="reviewResult" style="position:fixed;bottom:0;right:0;background:#10263e;color:#fff;padding:4px;font:10px monospace;z-index:9999">RUNNING</output><script>'+check+'</script></body>');
 const fixture=path.join(out,path.basename(file));fs.writeFileSync(fixture,html);
 for(const width of [1440,390]){
  const screenshot=path.join(out,path.basename(file,'.html')+'-'+width+'.png');
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<700},sessionId);
  await send('Page.navigate',{url:pathToFileURL(fixture).href+'?review='+width},sessionId);
  const result=await send('Runtime.evaluate',{expression:`new Promise(resolve=>{let tries=0;const timer=setInterval(()=>{const value=document.getElementById('reviewResult')?.textContent;if(value&&value!=='RUNNING'||++tries>80){clearInterval(timer);resolve(value||'FAIL: No browser result');}},100);})`,awaitPromise:true,returnByValue:true},sessionId);
  const message=result.result.value||'FAIL: Browser result missing';
  if(file==='pages/story.html')await send('Runtime.evaluate',{expression:"document.getElementById('storyContent').scrollIntoView({block:'start'})"},sessionId);
  if(file==='pages/my-profile.html')await send('Runtime.evaluate',{expression:"window.scrollTo(0,document.getElementById('discoveryWall').getBoundingClientRect().top+scrollY-90)"},sessionId);
  if(file==='pages/chapter-challenge.html')await send('Runtime.evaluate',{expression:"document.getElementById('fixtureKeepsake').scrollIntoView({block:'start'})"},sessionId);
  const capture=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(screenshot,Buffer.from(capture.data,'base64'));
  console.log(message);results.push({page:file,width,message,screenshot});
 }
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
process.exitCode=results.every(row=>row.message.startsWith('PASS:'))?0:1;
}finally{await send('Browser.close').catch(()=>{});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
