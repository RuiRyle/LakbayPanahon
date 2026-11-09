// Real page markup/renderers; simulated auth/data/provider. No remote requests or speech generation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-missing-features-'));
const source=file=>fs.readFileSync('js/'+file,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
const tick="const tick=()=>new Promise(r=>setTimeout(r,30)),assert=(ok,message)=>{if(!ok)throw Error(message);};";
const setups={
 'journey-finale.html':`
 const auth={currentUser:{uid:'learner'}};let listener,mode='locked',resolveLate,plays=0,downloads=[];
 const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
 window.LakbayNarrator={enabled:true,play(){plays++;document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:true}}));},stop(){document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:false}}));}};
 const definition={enabled:true,id:'fixture-v1',finalChapterId:'c2',chapters:[{id:'c1',title:'Early Communities'},{id:'c2',title:'Reading Historical Evidence'}],missions:[{id:'m1',chapterId:'c1'},{id:'m2',chapterId:'c2'}]};
 ${source('journey-finale-policy.js')}
 const complete=()=>({definition,profile:{firstName:'Explorer'},state:journeyFinaleState({definition,userId:'learner',chapterProgress:definition.chapters.map(c=>({userId:'learner',chapterId:c.id,completed:true,completedAt:{toMillis:()=>1793400000000}})),missionProgress:definition.missions.map(m=>({userId:'learner',missionId:m.id,chapterId:m.chapterId,completed:true}))}),artifacts:[{artifactId:'map'},{artifactId:'map'}],badges:null});
 const loadJourneyFinale=async()=>{if(mode==='error')throw Error('Offline');if(mode==='late')return new Promise(r=>resolveLate=r);const data=complete();if(mode==='locked')data.state=journeyFinaleState({definition,userId:'learner'});return data;};
 const nativeClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){downloads.push({name:this.download,url:this.href});return;}return nativeClick.call(this);};
 ${source('journey-finale.js')}
 await tick();assert(!locked.hidden&&experience.hidden&&!stage.children.length,'Incomplete progress unlocked finale');
 mode='complete';retry.click();await tick();assert(locked.hidden&&!experience.hidden&&stage.textContent.includes('JOURNEY COMPLETE')&&plays===0,'Completion celebration missing or auto-narrated');
 stage.querySelector('button').click();assert(plays===1&&stage.querySelector('button').textContent==='Stop message','Closing narration did not start');window.LakbayNarrator.stop();assert(stage.querySelector('button').textContent.includes('Hear Bayani'),'External audio stop retained speaking state');
 next.click();assert(stage.textContent.includes('Not loaded'),'Unavailable optional collection falsely counted as zero');const input=document.getElementById('finaleReflection');input.value='Evidence helps us understand the past.';input.dispatchEvent(new Event('input'));assert(!localStorage.getItem(noteKey()),'Reflection saved without explicit choice');[...stage.querySelectorAll('button')].find(b=>b.textContent==='Save My Thought').click();assert(localStorage.getItem(noteKey())===reflection,'Reflection save failed');
 back.click();next.click();assert(document.getElementById('finaleReflection').value===reflection,'Back lost reflection');[...stage.querySelectorAll('button')].find(b=>b.textContent==='Clear My Thought').click();assert(!localStorage.getItem(noteKey())&&!reflection,'Reflection clear failed');
 next.click();const aliasInput=document.getElementById('finaleAlias');aliasInput.value='<img src=x onerror=alert(1)>';aliasInput.dispatchEvent(new Event('input'));stage.querySelector('.primary-button').click();for(let n=0;n<20&&!downloads.length;n++)await tick();assert(downloads.length===1&&downloads[0].name==='LakbayPanahon-Journey-Complete.png'&&downloads[0].url.startsWith('blob:'),'Completion card was not created');assert(!stage.querySelector('img')&&stage.textContent.includes('not an official school certificate'),'Name interpreted as markup or keepsake misrepresented');
 [...stage.querySelectorAll('button')].find(b=>b.textContent==='Replay This Celebration').click();assert(step===0&&downloads.length===1,'Replay changes rewards');
 mode='late';retry.click();await tick();auth.currentUser=null;listener();resolveLate(complete());await tick();assert(experience.hidden&&!stage.children.length,'Stale completion exposed after sign-out');
 auth.currentUser={uid:'other'};mode='error';listener();await tick();assert(experience.hidden&&!retry.disabled&&status.textContent.includes('could not be verified'),'Unavailable progress falsely shows completion or lacks retry');
 auth.currentUser={uid:'learner'};mode='complete';listener();await tick();next.click();next.click();await stage.querySelectorAll('img').forEach(image=>image.decode());
 `,
 'mission.html':`
 document.getElementById('missionContent').hidden=false;document.getElementById('missionLoading').hidden=true;document.getElementById('chapterTitle').textContent='Early Filipino Communities';document.getElementById('chapterDescription').textContent='Learn how early communities worked together.';
 let selectedMissionId;const chapterId='c1';const missionTitle=document.getElementById('missionTitle'),missionIntroduction=document.getElementById('missionIntroduction'),missionLearningGoal=document.getElementById('missionLearningGoal'),missionLearningObjective=document.getElementById('missionLearningObjective'),missionXp=document.getElementById('missionXp'),beginMissionButton=document.getElementById('beginMissionButton');
 const auth={currentUser:{uid:'learner'}},missionGuideUser=auth.currentUser,missionContent=document.getElementById('missionContent');
 const loadedMissionStates=[{id:'m1',isUnlocked:true}];let emittedGuide;
 document.addEventListener('lakbay:mission-guide',event=>{emittedGuide=event.detail;});
 ${source('mission.js').slice(source('mission.js').indexOf('function emitMissionGuide('),source('mission.js').indexOf("document.addEventListener('lakbay:request-mission-guide'"))}
 ${source('mission.js').slice(source('mission.js').indexOf('function displaySelectedMission('),source('mission.js').indexOf('function selectMission('))}
 displaySelectedMission({id:'m1',title:'How did early communities help one another?',introduction:'Explore the clues to explain how people shared work and resources.',learningObjectives:['Explain why communities shared work.','Compare roles in a community.','Use a clue to support your explanation.'],xpReward:25,isUnlocked:true,isCompleted:false});
 assert(beginMissionButton.textContent.includes('Start Lesson'),'Primary action is unclear');assert(document.getElementById('chapterTitle').tagName==='H1','Chapter has no main heading');const extra=missionLearningObjective.querySelector('details');assert(extra&&!extra.open&&extra.querySelectorAll('li').length===2,'Extra learning goals are not optional');assert(!document.querySelector('.mission-how-to-play').open,'Long instructions overwhelm the start screen');assert(beginMissionButton.compareDocumentPosition(document.querySelector('.mission-how-to-play'))&Node.DOCUMENT_POSITION_FOLLOWING,'Instructions appear before the start action');
 assert(emittedGuide?.mission.id==='m1'&&emittedGuide.user===auth.currentUser,'Selected mission guide context was not emitted');
 extra.open=true;assert(extra.textContent.includes('Compare roles'),'Learning goals were removed');extra.open=false;
 `,
 'era.html':`
 document.getElementById('eraOverview').hidden=false;document.getElementById('eraLoading').hidden=true;document.getElementById('chapterSection').hidden=false;document.getElementById('chapterLoading').hidden=true;
 document.getElementById('eraOverviewTitle').textContent='Early Philippine Communities';document.getElementById('eraOverviewPeriod').textContent='Before Spanish colonization';document.getElementById('eraOverviewPeriod').hidden=false;document.getElementById('eraOverviewDescription').textContent='Explore community life, beliefs and exchange.';document.getElementById('eraContinue').hidden=false;document.getElementById('eraContinue').textContent='Open next chapter';document.getElementById('eraContinue').href='mission.html?chapter=c1';document.getElementById('eraNextChapterName').textContent='Next: Early Filipino Communities';document.getElementById('eraNextChapterName').hidden=false;
 const list=document.getElementById('chapterList');for(const [name,status]of [['Early Filipino Communities','Ready to start'],['Culture and beliefs','Complete the previous chapter first']]){const article=document.createElement('article');article.className='chapter-card';article.innerHTML='<div class="chapter-number">1</div><div class="chapter-content"><span class="chapter-label"></span><h3></h3><p>Learn through short missions and a final challenge.</p><button class="chapter-button" type="button">Open Chapter</button></div>';article.querySelector('h3').textContent=name;article.querySelector('.chapter-label').textContent=status;article.querySelector('button').disabled=status!=='Ready to start';list.append(article);}
 assert(document.getElementById('eraArrival').hidden,'Duplicate arrival introduction is visible');assert(!document.querySelector('.era-about').open,'Historical description is not an optional detail');assert(document.getElementById('eraContinue').textContent==='Open next chapter'&&list.querySelectorAll('button:not(:disabled)').length===1,'Next chapter route or locked state is unclear');
 `,

 'story-playground.html':`
 let narrated=[];window.LakbayNarrator={enabled:true,play(parts){narrated=parts;document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:true}}));},stop(){document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:false}}));}};
 ${source('story-playground-content.js')}\n${source('bayani-narration-button.js')}\n${source('story-playground.js')}
 
 const button=document.querySelector('.bayani-narration-button');assert(button&&button.querySelector('img')&&button.getAttribute('aria-label')==='Hear the story with Bayani','Character control unavailable');await button.querySelector('img').decode();
 button.focus();button.click();assert(button.getAttribute('aria-pressed')==='true'&&button.querySelector('.bayani-narration-action').textContent==='Stop story'&&narrated.length,'Speaking state or actual narration content missing');button.click();assert(button.getAttribute('aria-pressed')==='false'&&button.querySelector('img'),'Stop lost character markup');
 document.body.classList.add('lakbay-reduce-motion');button.click();assert(button.querySelector('img').getAttribute('src').includes('still.svg'),'Reduced-motion preference animated the character');button.click();document.body.classList.remove('lakbay-reduce-motion');
 window.LakbayNarrator.enabled=false;document.dispatchEvent(new CustomEvent('lakbay:narration-preference'));assert(button.disabled&&button.textContent.includes('Narration is off'),'Narration-off state misleading');window.LakbayNarrator.enabled=true;document.dispatchEvent(new CustomEvent('lakbay:narration-preference'));assert(!button.disabled,'Narration cannot resume');

 `,
 'story.html':`
 let narrated=[];window.LakbayNarrator={enabled:true,play(parts){narrated=parts;document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:true}}));},stop(){document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:false}}));}};
 document.body.classList.add('simple-lesson');document.getElementById('storyReadingCard').classList.add('lesson-reading');document.getElementById('storyContent').hidden=false;document.getElementById('storyLoading').hidden=true;document.getElementById('sceneTitle').textContent='Reading a map';const paragraph=document.createElement('p');paragraph.textContent='A map legend explains its symbols. Use the north arrow to compare directions.';document.getElementById('storyText').replaceChildren(paragraph);
 ${source('bayani-narration-button.js')}\n${source('story-reading-steps.js')}
 
 const button=document.querySelector('.bayani-narration-button');assert(button&&button.querySelector('img')&&button.getAttribute('aria-label')==='Hear the story with Bayani','Character control unavailable');
 button.focus();button.click();assert(button.getAttribute('aria-pressed')==='true'&&button.querySelector('.bayani-narration-action').textContent==='Stop story'&&narrated.length,'Speaking state or actual narration content missing');button.click();assert(button.getAttribute('aria-pressed')==='false'&&button.querySelector('img'),'Stop lost character markup');
 document.body.classList.add('lakbay-reduce-motion');button.click();assert(button.querySelector('img').getAttribute('src').includes('still.svg'),'Reduced-motion preference animated the character');button.click();document.body.classList.remove('lakbay-reduce-motion');
 window.LakbayNarrator.enabled=false;document.dispatchEvent(new CustomEvent('lakbay:narration-preference'));assert(button.disabled&&button.textContent.includes('Narration is off'),'Narration-off state misleading');window.LakbayNarrator.enabled=true;document.dispatchEvent(new CustomEvent('lakbay:narration-preference'));assert(!button.disabled,'Narration cannot resume');

 document.dispatchEvent(new CustomEvent('mission-reading-stop'));assert(button.dataset.speaking==='false','Leaving the reading activity did not stop its control');
 `,

 'student-dashboard.html':`
 const auth={currentUser:{uid:'learner'}},db={},callbacks=new Map();let listener;
 const doc=(_,name,id)=>name+'/'+id,serverTimestamp=()=>0,setDoc=async()=>{throw Error('Dashboard must not write cosmetics');};
 const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
 const onSnapshot=(key,callback)=>{callbacks.set(key,callback);queueMicrotask(()=>callback(key.startsWith('users/')?{exists:()=>true,data:()=>({role:'student',status:'active',level:2,xp:100}),metadata:{}}:{exists:()=>false,metadata:{}}));return()=>callbacks.delete(key);};
 ${source('level-reward-policy.js')}\n${source('level-rewards.js')}
 await tick();assert(document.getElementById('nextExplorerReward').textContent.includes('Level 3')&&document.getElementById('nextExplorerReward').textContent.includes('Bamboo Explorer'),'Next reward is not beside the XP bar');assert(document.querySelector('#nextExplorerReward a').href.includes('my-profile.html#levelRewardsCollection'),'Reward collection route missing');
 callbacks.get('users/learner')({exists:()=>true,data:()=>({role:'student',status:'active',level:3,xp:200}),metadata:{}});await tick();assert(document.getElementById('nextExplorerReward').textContent.includes('Level 5')&&document.getElementById('explorerLevelCelebration').textContent.includes('Bamboo Explorer'),'Level-up celebration or next milestone missing');
 callbacks.get('studentCosmetics/learner')({exists:()=>true,data:()=>({frameId:'bamboo'}),metadata:{}});await tick();assert(document.getElementById('profileAvatar').dataset.levelFrame==='bamboo','Equipped frame is absent from Home');
 auth.currentUser=null;listener(null);await tick();assert(!document.getElementById('explorerLevelCelebration')&&document.getElementById('profileAvatar').dataset.levelFrame==='none','Sign-out retained account reward state');
 auth.currentUser={uid:'learner'};start(auth.currentUser);await tick();
 `,

 'my-profile.html':`
 const auth={currentUser:{uid:'learner'}},db={},records=new Map([['users/learner',{role:'student',status:'active',level:1,xp:0}],['users/other',{role:'student',status:'active',level:1,xp:0}]]),handlers=new Map();let listener,failSave=false,writeGate=null,releaseWrite,writes=0;
 const snap=key=>({exists:()=>records.has(key),data:()=>records.get(key),metadata:{hasPendingWrites:false}});
 const doc=(_,name,id)=>name+'/'+id,serverTimestamp=()=>0;
 const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
 const onSnapshot=(key,callback,error)=>{handlers.set(key,{callback,error});queueMicrotask(()=>callback(snap(key)));return()=>handlers.delete(key);};
 const setDoc=async(key,data)=>{writes++;if(writeGate)await writeGate;if(failSave)throw Error('Offline');records.set(key,data);handlers.get(key)?.callback(snap(key));};
 ${source('level-reward-policy.js')}\n${source('level-rewards.js')}
 await tick();assert(state.title==='History Scout'&&host.querySelectorAll('button:not(:disabled)').length===0,'Level 1 unlocks future frames');assert(host.getBoundingClientRect().width>=document.querySelector('.profile-learning-section').getBoundingClientRect().width-1,'Rewards do not span the profile grid');
 records.set('users/learner',{role:'student',status:'active',level:5,xp:400});handlers.get('users/learner').callback(snap('users/learner'));await tick();
 assert(state.title==='Heritage Explorer'&&document.getElementById('explorerLevelCelebration')&&host.querySelectorAll('button:not(:disabled)').length===2,'Level jump missed milestones');
 failSave=true;host.querySelector('[aria-label="Equip Bamboo Explorer frame"]').click();await tick();assert(document.getElementById('levelRewardsStatus').textContent.includes('could not be saved')&&frameId==='none','Failed save falsely equipped a frame');
 failSave=false;host.querySelector('[aria-label="Equip Bamboo Explorer frame"]').focus();host.querySelector('[aria-label="Equip Bamboo Explorer frame"]').click();await tick();assert(frameId==='bamboo'&&document.querySelector('[data-student-avatar]').dataset.levelFrame==='bamboo'&&records.get('studentCosmetics/learner').frameId==='bamboo','Frame not saved or painted');assert(document.activeElement.id==='levelRewardsStatus','Frame saving lost keyboard focus');
 start(auth.currentUser);await tick();assert(frameId==='bamboo'&&!document.getElementById('explorerLevelCelebration'),'Saved frame did not restore or replayed celebration');
 const stale=handlers.get('studentCosmetics/learner').callback;writeGate=new Promise(r=>releaseWrite=r);host.querySelector('[aria-label="Equip Golden Sun frame"]').click();await tick();assert(saving&&document.getElementById('levelRewardsStatus').textContent.includes('Saving'),'Pending save looked finished');
 auth.currentUser={uid:'other'};listener(auth.currentUser);await tick();stale({exists:()=>true,data:()=>({frameId:'guardian'}),metadata:{}});releaseWrite();await tick();assert(state.level===1&&frameId==='none'&&document.querySelector('[data-student-avatar]').dataset.levelFrame==='none','Old account save or listener leaked cosmetics');
 assert(writes===3,'Frame saving retried automatically');
 `,

 'history-timeline.html':`
 const auth={currentUser:{uid:'learner'}},db={};let listener,broken=false,release,gate;
 const eras=[{id:'e1',status:'active',order:1,title:'Early communities',dateRange:'Before Spanish colonization'},{id:'e2',status:'active',order:2,title:'Colonial encounters',requiredChapterIds:['c2']}];
 const chapters=[{id:'c1',eraId:'e1',status:'active',order:1,title:'Island communities <img src=x>'},{id:'c2',eraId:'e1',status:'active',order:2,title:'Trade and exchange'},{id:'c3',eraId:'e2',status:'active',title:'New encounters'}];
 const records={eras,chapters,missions:chapters.map((c,i)=>({id:'m'+i,chapterId:c.id,status:'active',title:'Explore the evidence'})),studentProgress:[],studentChapterProgress:[]};
 const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(fn);},collection=(_,name)=>({name}),where=()=>({}),query=r=>r;
 const getDocs=async ref=>{if(gate)await gate;if(broken)throw Error('Offline');return {docs:records[ref.name].map(row=>({id:row.id,data:()=>row}))};};
 ${source('journey-path.js')}\n${source('student-status.js')}\n${source('history-timeline-view.js')}\n${source('history-timeline.js')}
 await tick();assert(document.querySelector('.timeline-controls').contains(retry)&&document.querySelector('.timeline-controls').contains(filter),'Timeline controls are separated');assert(host.querySelectorAll('.history-timeline-stop').length===3,'Timeline entries missing');assert(host.querySelectorAll('a').length===1,'Timeline bypassed prerequisites');assert(!host.querySelector('img[src=x]')&&host.textContent.includes('<img src=x>'),'Timeline interpreted content as markup');assert(host.textContent.includes('Before Spanish colonization'),'Authored period lost');
 filter.value='e2';filter.dispatchEvent(new Event('change'));assert(host.querySelectorAll('.history-timeline-stop').length===1&&!host.querySelector('a'),'Period filter or era lock failed');
 broken=true;await load();assert(status.textContent.includes('could not load')&&!host.children.length&&!retry.disabled,'Timeline outage lacks retry');broken=false;await load();assert(host.querySelectorAll('.history-timeline-stop').length===1&&filter.value==='e2','Timeline refresh did not preserve the selected era');
 gate=new Promise(r=>release=r);const pending=load();await tick();const unblock=release;gate=null;auth.currentUser=null;listener();unblock();await pending;assert(!host.children.length,'Stale timeline survived sign-out');auth.currentUser={uid:'learner'};await load();
 `,
 'bayani-ai.html':`
 const auth={currentUser:{uid:'learner'}},db={};let listener,calls=0,providerMode='good',resolveReply;
 const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(fn);},doc=()=>0,getDocFromServer=async()=>({exists:()=>true,data:()=>({status:'active',chapterId:'c1',title:'Maps'})}),collection=()=>0,where=()=>0,query=()=>0;
 const getDocs=async()=>({docs:[{data:()=>({status:'active',title:'Reading maps',reviewTopics:['maps'],content:'A map legend explains symbols. A north arrow shows direction. Use the labels, legend and north arrow to describe places and compare their locations.'})}]});
 const BAYANI_REPLY_TIMEOUT_MS=1000,BAYANI_CONNECT_TIMEOUT_MS=1000,withBayaniDeadline=fn=>fn();
 const sample={question:'Which map tool explains symbols? <img src=x>',options:{A:'Legend',B:'Recipe',C:'Song',D:'Calendar'},answer:'A',explanation:'The lesson explains that the legend defines symbols.'};
 const connectBayani=async()=>({settings:{maxMessageCharacters:2000},send:async prompt=>{calls++;assert(prompt.includes('north arrow'),'Review is not grounded in the lesson');if(providerMode==='late')return new Promise(r=>resolveReply=r);if(providerMode==='bad')return 'not JSON';return JSON.stringify(sample);}});
 ${source('bayani-review-question.js')}\n${source('bayani-review.js')}
 await tick();assert(!generate.disabled&&calls===0,'Review generated automatically or failed preparation');generate.click();await tick();assert(calls===1&&!card.hidden&&!card.querySelector('img'),'Generated practice missing or interpreted HTML');
 assert(check.disabled&&!feedback.textContent,'Answer revealed before choosing');document.querySelector('#reviewQuestionOptions button').click();check.click();assert(feedback.textContent.includes('suggested answer')&&feedback.textContent.includes('Check this'),'Review feedback lacks explanation/disclosure');
 providerMode='bad';generate.click();await tick();assert(status.textContent.includes('could not create')&&card.hidden&&!generate.disabled&&calls===2,'Malformed AI reply lacks recovery or retried automatically');
 providerMode='late';generate.click();await tick();auth.currentUser=null;listener();resolveReply(JSON.stringify(sample));await tick();assert(card.hidden&&generate.disabled&&!feedback.textContent,'Stale provider reply crossed accounts');
 auth.currentUser={uid:'learner'};providerMode='good';await prepare();
 `
};
async function runFixture(file,width){
 const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-pipe','--user-data-dir='+file+'-profile'],{windowsHide:true,stdio:['ignore','ignore','ignore','pipe','pipe']});
 let seq=0,buffer='';const pending=new Map();chrome.stdio[4].on('data',chunk=>{buffer+=chunk.toString();let end;while((end=buffer.indexOf('\0'))>=0){const data=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);const request=pending.get(data.id);if(request){pending.delete(data.id);clearTimeout(request.timer);data.error?request.reject(Error(data.error.message)):request.resolve(data.result);}}});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>reject(Error('Chrome deadline: '+method)),12000);pending.set(id,{resolve,reject,timer});chrome.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});
 try{const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Page.enable',{},sessionId);await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700},sessionId);await send('Page.navigate',{url:require('node:url').pathToFileURL(file).href+'?chapter=c1&mission=m1&topic=maps'},sessionId);
 const result=await send('Runtime.evaluate',{expression:"new Promise(resolve=>{let n=0;const timer=setInterval(()=>{const value=document.getElementById('fixtureResult')?.textContent;if(value&&value!=='RUNNING'||++n>100){clearInterval(timer);resolve(value||'FAIL: no result');}},40);})",awaitPromise:true,returnByValue:true},sessionId);
 await send('Runtime.evaluate',{expression:"document.getElementById('levelRewardsCollection')?.scrollIntoView({block:'start'})"},sessionId);
 const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(file+'.png',Buffer.from(shot.data,'base64'));return result.result.value;
 }finally{await send('Browser.close').catch(()=>{});chrome.kill();}
}
async function main(){
for(const [page,setup]of Object.entries(setups).filter(([page])=>!process.argv[2]||page===process.argv[2]))for(const width of [1440,390]){
 let html=fs.readFileSync('pages/'+page,'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 html=html.replace('<head>','<head><base href="'+require('node:url').pathToFileURL(path.resolve('pages')).href+'/">');
 const names=[...fs.readFileSync('pages/'+page,'utf8').matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(match=>match[1]);
 const css=names.map(n=>fs.readFileSync('css/'+n,'utf8').replace(/@import[^;]+;/g,'')).join('\n');
 const script=`${tick}\n(async()=>{document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');${setup}\nassert(innerWidth===${width},'Viewport mismatch');assert(document.documentElement.scrollWidth<=innerWidth+1,'Horizontal overflow');document.getElementById('fixtureResult').textContent='PASS: ${page} ${width}px';})().catch(error=>document.getElementById('fixtureResult').textContent='FAIL: '+error.message);`;
 html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
 const file=path.join(out,page.replace('.html','-'+width+'.html'));fs.writeFileSync(file,html);
 const result=await runFixture(file,width);console.log(result||'FAIL: no browser result');if(!result?.startsWith('PASS:'))process.exitCode=1;
}
console.log('Captures: '+out);
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={runFixture};
