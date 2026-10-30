const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-journey-'));
const hostileId='c1"><img data-attack src=x onerror="window.routeAttack=1">&mission=forged#fragment';
let html = fs.readFileSync(path.join(root, 'pages/mission.html'), 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '');
const source = fs.readFileSync(path.join(root, 'js/mission.js'), 'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g, '').replace(/window\.location\.href\s*=/g,'fixtureNavigation =');
const styles = ['student.css', 'mission.css','navy-gold-theme.css'].map(name => fs.readFileSync(path.join(root, 'css', name), 'utf8')).join('\n');
const script = `
const instructionalSnapshot=(_,load)=>load();
const auth={currentUser:{uid:'student'}}, db={};
const fixtureChapterId=${JSON.stringify(hostileId)};let fixtureNavigation='';
class LearningAccessError extends Error {}
const requireLearningAccess=async()=>{};
let listener, fail=false, gate=null, completed=new Set();
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const doc=(_,name,id)=>({name,id}),collection=(_,name)=>({name});
const where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const getDoc=async ref=>{
 if(gate) await gate;
 if(fail) throw Error('Offline');
 return {exists:()=>ref.name==='chapters',data:()=>({title:'Chapter',status:'active',contentReady:true})};
};
const getDocs=async ref=>{
 if(ref.name==='missions'&&!(ref.filters||[]).some(filter=>filter.field==='chapterId'&&filter.value))throw Error('Unscoped catalog read');
 const rows=ref.name==='missions'?[{id:'m1',chapterId:fixtureChapterId,title:'First <img src=x onerror=alert(1)>',learningObjectives:['Explain cooperation','Compare roles <img src=x>'],description:'Mission description fallback',status:'active',order:1,xpReward:25},{id:'m2',chapterId:fixtureChapterId,title:'Second',learningObjective:'Legacy objective',status:'active',order:2,xpReward:25}]
 :[...completed].map(missionId=>({missionId,userId:'student',completed:true}));
 const docs=rows.filter(row=>(ref.filters||[]).every(filter=>row[filter.field]===filter.value)).map(row=>({id:row.id,data:()=>row}));return {docs,forEach:fn=>docs.forEach(fn)};
};
${source}
const tick=()=>new Promise(resolve=>setTimeout(resolve,50));
const check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');
 await tick();check(!missionContent.hidden&&selectedMissionId==='m1','First mission unavailable');
 check(!missionPath.querySelector('img'),'Catalog title rendered as HTML');
 check(missionLearningObjective.querySelectorAll('li').length===2&&!missionLearningGoal.hidden,'Objective list missing');
 check(!missionLearningObjective.querySelector('img')&&missionLearningObjective.textContent.includes('<img src=x>'),'Objective interpreted HTML');
 check(missionIntroduction.textContent==='Mission description fallback','Missing introduction did not use catalog description');
 check(missionPath.querySelector('.chapter-challenge').classList.contains('locked'),'Challenge appears unlocked');
 check(!missionPath.children[1].hasAttribute('tabindex'),'Locked mission selectable');
 globalThis.__lakbayExplorationPreview=true;await loadMissionPage();check(loadedMissionStates.every(m=>m.isUnlocked)&&missionPath.querySelector('.chapter-challenge.unlocked'),'Preview did not open all missions and challenge');globalThis.__lakbayExplorationPreview=false;await loadMissionPage();
 completed.add('m1');window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));await tick();
 check(selectedMissionId==='m2','Returning from quiz did not unlock next mission');
 check(missionLearningObjective.textContent==='Legacy objective','Legacy objective fallback missing');
 missionPath.children[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 check(selectedMissionId==='m1'&&beginMissionButton.textContent.includes('Review'),'Completed mission review unavailable');
 check(document.activeElement===missionTitle&&missionPath.children[0].getAttribute('aria-pressed')==='true','Mission selection lost focus or accessible selection state');
 completed.add('m2');await loadMissionPage();
 check(missionPath.querySelector('.chapter-challenge').getAttribute('role')==='button','All missions did not unlock challenge');
 missionPath.querySelector('.chapter-challenge').click();
 const challengeTarget=new URL(fixtureNavigation,'https://example.test/pages/');
 check(challengeTarget.pathname==='/pages/chapter-challenge.html'&&challengeTarget.searchParams.get('chapter')===fixtureChapterId&&[...challengeTarget.searchParams].length===1&&!challengeTarget.hash,'Hostile chapter parameter changed challenge navigation');
 displaySelectedMission({...loadedMissionStates[0],id:fixtureChapterId,isUnlocked:true});beginMissionButton.click();
 const storyTarget=new URL(fixtureNavigation,'https://example.test/pages/');
 check(storyTarget.pathname==='/pages/story.html'&&storyTarget.searchParams.get('chapter')===fixtureChapterId&&storyTarget.searchParams.get('mission')===fixtureChapterId&&[...storyTarget.searchParams].length===2&&!storyTarget.hash,'Hostile chapter/mission IDs changed lesson navigation');
 check(!document.querySelector('[data-attack]')&&window.routeAttack===undefined,'Hostile route parameter rendered as markup');
 fail=true;await loadMissionPage();check(!missionError.hidden&&!retryMissionLoadButton.hidden,'Missing load recovery');
 fail=false;retryMissionLoadButton.click();await tick();check(!missionContent.hidden,'Load retry failed');
 let release;gate=new Promise(resolve=>{release=resolve;});const pending=loadMissionPage();
 auth.currentUser=null;listener(null);release();await pending;gate=null;
 check(missionContent.hidden&&!loadedMissionStates.length&&!missionPath.children.length,'Late response revealed signed-out journey');
 auth.currentUser={uid:'student'};listener(auth.currentUser);await tick();
 check(!missionContent.hidden,'Fresh sign-in failed');
 document.getElementById('result').textContent='PASS: saved progress unlocks, Back navigation refresh, review, challenge gating, safe titles and hostile route parameters, retry and sign-out';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html = html.replace('</head>', '<style>'+styles+'</style></head>').replace('</body>', '<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'mission.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
    '--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=4000',
    'file:///'+file.replaceAll('\\','/')+'?chapter='+encodeURIComponent(hostileId)
],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;
const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);
console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
