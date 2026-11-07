// Actual mission markup and activity modules, simulated account/access/data. No network or writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const {runFixture}=require('./student-missing-features-browser.cjs'),out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-discoveries-'));
const source=name=>fs.readFileSync('js/'+name,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
async function main(){for(const width of [1440,390]){
 let html=fs.readFileSync('pages/mission.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const names=[...fs.readFileSync('pages/mission.html','utf8').matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(m=>m[1]);const css=names.map(n=>fs.readFileSync('css/'+n,'utf8').replace(/@import[^;]+;/g,'')).join('\n');
 const script=`
 const tick=()=>new Promise(r=>setTimeout(r,35)),assert=(ok,message)=>{if(!ok)throw Error(message);};
 const auth={currentUser:{uid:'owner'}};let authListener,accessMode='ok',releaseAccess,reads=0;
 const onAuthStateChanged=(_,fn)=>{authListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
 const requireLearningAccess=async(chapter,mission)=>{reads++;assert(discoveryCaseFor(chapter,mission),'Wrong access request');if(accessMode==='error')throw Error('Locked');if(accessMode==='late')await new Promise(r=>releaseAccess=r);};
 const discoveryCases=${JSON.stringify(require('../data/discovery-cases.json'))};
 const discoveryCaseFor=(chapter,mission)=>discoveryCases.find(c=>c.chapterId===chapter&&c.missionId===mission)||null;
 let loadedMission=null,loadedUser=auth.currentUser,meaningMode='ok',releaseMeaning,meaningReads=0;
 const loadDiscoveryCase=async(chapter,mission)=>{meaningReads++;if(meaningMode==='error')throw Error('Offline');if(meaningMode==='late')await new Promise(resolve=>releaseMeaning=resolve);return discoveryCaseFor(chapter,mission);};
 const deliver=()=>document.dispatchEvent(new CustomEvent('lakbay:mission-guide',{detail:loadedMission?{mission:loadedMission,user:loadedUser}:null}));
 document.addEventListener('lakbay:request-mission-guide',deliver);
 const selectCase=(chapter,mission)=>{loadedUser=auth.currentUser;loadedMission={id:mission,chapterId:chapter,discoveryCase:discoveryCaseFor(chapter,mission)};deliver();};
 ${source('discovery-cases.js')}
 ${source('discovery-case-view.js')}
 ${source('learning-community.js')}
 ${source('museum-exhibits.js')}
 ${source('mission-discovery.js')}
 (async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');document.getElementById('missionContent').hidden=false;document.getElementById('missionLoading').hidden=true;
 document.getElementById('chapterTitle').textContent='Early Filipino Communities';document.getElementById('missionTitle').textContent='Life in the Barangay';await tick();
 const panel=document.getElementById('missionDiscovery'),host=panel.querySelector('[data-discovery-activity]');
 selectCase('wrong','mission-1');assert(panel.hidden,'Unrelated mission received a case');
 selectCase('chapter-1','mission-1');assert(!panel.hidden&&!panel.open&&!host.children.length,'Activity crowded initial mission or failed discovery');
 accessMode='error';panel.open=true;await tick();assert(host.textContent.includes('could not open')&&!host.querySelector('button'),'Denied access showed the case');panel.open=false;await tick();
 accessMode='late';panel.open=true;await tick();auth.currentUser=null;authListener();releaseAccess();await tick();assert(panel.hidden&&!host.children.length,'Late case crossed accounts');
 auth.currentUser={uid:'owner'};accessMode='ok';authListener();selectCase('chapter-1','mission-1');panel.open=true;await tick();assert(host.textContent.includes('History Detective')&&reads===3,'Access retry did not recover');
 const clickText=(root,label)=>{const button=[...root.querySelectorAll('button')].find(b=>b.textContent===label);assert(button,'Missing action '+label);button.click();};
 for(const activity of discoveryCases){
  const dispose=mountDiscoveryCase(host,activity,{isCurrent:()=>auth.currentUser?.uid==='owner'});
  assert([...host.querySelectorAll('button')].find(b=>b.textContent==='Check My Conclusion').disabled,'Case answer enabled before clues');
  for(const b of host.querySelectorAll('.discovery-clues button'))b.click();
  host.querySelectorAll('.discovery-options button')[(activity.answer+1)%3].click();clickText(host,'Check My Conclusion');assert(host.textContent.includes('Look again')&&!host.textContent.includes('Compare Then and Now'),'Wrong answer advanced case');
  host.querySelectorAll('.discovery-options button')[activity.answer].click();clickText(host,'Check My Conclusion');assert(host.textContent.includes(activity.explanation),'Correct answer lacks teaching feedback');clickText(host,'Compare Then and Now');
  for(const image of host.querySelectorAll('img'))await image.decode();assert(host.querySelectorAll('figure').length===2,'Then and Now images missing');
  const proceed=[...host.querySelectorAll('button')].find(b=>b.textContent==='Explain My Discovery');assert(proceed.disabled,'Comparison skipped observations');
  host.querySelectorAll('.discovery-comparison-item').forEach((row,index)=>clickText(row,activity.compare[index].answer==='changed'?'Stayed similar':'Changed'));assert(proceed.disabled,'Incorrect comparisons unlocked next stage');
  host.querySelectorAll('.discovery-comparison-item').forEach((row,index)=>clickText(row,activity.compare[index].answer==='changed'?'Changed':'Stayed similar'));assert(!proceed.disabled,'Correct comparisons cannot continue');proceed.click();
  host.querySelectorAll('.discovery-options button')[(activity.support+1)%3].click();clickText(host,'Tell Bayani');assert(host.textContent.includes('another clue')&&!host.textContent.includes('Finish This Case'),'Unsupported explanation advanced');
  host.querySelectorAll('.discovery-options button')[activity.support].click();clickText(host,'Tell Bayani');assert(host.textContent.includes(activity.limit),'Bayani lacks evidence limit');clickText(host,'Finish This Case');assert(host.textContent.includes('Optional practice complete')&&host.textContent.includes('mission quiz'),'Practice claims official progress');clickText(host,'Try This Case Again');assert([...host.querySelectorAll('button')].find(b=>b.textContent==='Check My Conclusion').disabled,'Replay retained solved evidence');dispose();
 }
 const community=document.createElement('div');community.className='discovery-panel';host.append(community);const groups=[{chapters:[{id:'c',ready:true,missions:[{id:'m',title:'Saved mission'}]}]}];
 renderLearningCommunity(community,learningCommunityState(groups,[],'owner'));assert(community.querySelectorAll('[data-unlocked=false]').length===5&&!community.querySelector('a'),'Unfinished missions built community');renderLearningCommunity(community,learningCommunityState(groups,[{userId:'owner',chapterId:'c',missionId:'m',completed:true}],'owner'));assert(community.querySelectorAll('[data-unlocked=true]').length===5&&community.querySelector('a').href.includes('mission=m'),'Saved mission did not reveal community or return link');
 const trigger=document.createElement('button');trigger.textContent='Open test exhibit';host.append(trigger);trigger.focus();const artifact={name:'Artifact <img src=x>',description:'A learning token',chapterId:'chapter-1',missionId:'mission-2',learningDetails:{lessonConnection:'Exchange connects people.'}};
 openMuseumExhibit(artifact,{isCurrent:()=>auth.currentUser?.uid==='owner'});const dialog=document.querySelector('dialog');assert(dialog.open&&dialog.textContent.includes('<img')&&!dialog.querySelector('img'),'Exhibit not centered modal or hostile title interpreted');assert(meaningReads===0,'Opening museum fetched unused explanation');clickText(dialog,'Its Meaning');await tick();assert(dialog.textContent.includes('Imported ceramics')||dialog.textContent.includes('Different resources'),'Exhibit meaning lacks context');clickText(dialog,'My Discovery');assert(dialog.querySelector('a').href.includes('mission=mission-2'),'Exhibit lost originating mission');dialog.close();await tick();assert(document.activeElement===trigger,'Closing exhibit lost focus');
 openMuseumExhibit(artifact,{isCurrent:()=>auth.currentUser?.uid==='owner'});auth.currentUser=null;closeMuseumExhibit();assert(!document.querySelector('dialog'),'Account change retained exhibit');
 auth.currentUser={uid:'owner'};meaningMode='error';openMuseumExhibit(artifact);let failedDialog=document.querySelector('dialog');clickText(failedDialog,'Its Meaning');await tick();assert(failedDialog.textContent.includes('could not load')&&failedDialog.textContent.includes('Retry Explanation'),'Missing museum error recovery');meaningMode='ok';clickText(failedDialog,'Retry Explanation');await tick();assert(failedDialog.textContent.includes(discoveryCases[1].explanation),'Museum retry did not recover');closeMuseumExhibit();
 meaningMode='late';openMuseumExhibit(artifact);const oldDialog=document.querySelector('dialog');clickText(oldDialog,'Its Meaning');closeMuseumExhibit();openMuseumExhibit({...artifact,name:'New exhibit',learningDetails:{historicalUse:'New description'}});releaseMeaning();await tick();assert(!document.querySelector('dialog').textContent.includes(discoveryCases[1].explanation),'Late explanation changed a newer exhibit');closeMuseumExhibit();meaningMode='ok';
 selectCase('chapter-1','mission-1');window.dispatchEvent(new PageTransitionEvent('pagehide'));assert(panel.hidden&&!host.children.length,'Page exit retained detective state');deliver();assert(panel.hidden,'Late page data reopened detective');window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));assert(!panel.hidden,'Restore did not request mission data');loadedMission.discoveryCase={...discoveryCases[0],source:{title:'Unsafe',url:'javascript:alert(1)'}};deliver();assert(panel.hidden,'Unsafe source accepted');
 auth.currentUser={uid:'owner'};host.replaceChildren();mountDiscoveryCase(host,discoveryCases[1]);for(const b of host.querySelectorAll('.discovery-clues button'))b.click();host.querySelectorAll('.discovery-options button')[1].click();clickText(host,'Check My Conclusion');clickText(host,'Compare Then and Now');for(const image of host.querySelectorAll('img'))await image.decode();
 assert(innerWidth===${width}&&document.documentElement.scrollWidth<=innerWidth+1,'Discovery layout overflows viewport');document.getElementById('fixtureResult').textContent='PASS: all three cases, comparisons, Bayani explanations, community, museum, access and account isolation ${width}px';
 })().catch(error=>document.getElementById('fixtureResult').textContent='FAIL: '+error.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');const file=path.join(out,'discovery-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 }console.log('Captures: '+out);}
main().catch(error=>{console.error(error);process.exitCode=1;});
