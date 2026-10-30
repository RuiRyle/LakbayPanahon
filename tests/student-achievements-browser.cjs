const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-achievements-'));
const source=fs.readFileSync(path.join(root,'js/achievements.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
let html=fs.readFileSync(path.join(root,'pages/achievements.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const script=`
const auth={currentUser:{uid:'student'}},db={};let listener,mode='partial',gate=null,reads=0,artifactReads=0;
const collection=(_,name)=>({name}),doc=(_,name,id)=>({name,id}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const getDocs=async ref=>{if(ref.name==='studentArtifacts'){artifactReads++;return{forEach:()=>{}};}if(ref.filters[0].value!=='student')throw Error('Wrong owner query');const delayed=gate,currentMode=mode;if(delayed)await delayed;if(currentMode==='error')throw Error('Offline');return{forEach:fn=>(currentMode==='empty'?[]:[{userId:'student',badgeId:'b1'},{userId:'student',badgeId:'b1'},{userId:'student',badgeId:'b2'},{userId:'other',badgeId:'foreign'}]).forEach(row=>fn({data:()=>row}))};};
const getDoc=async ref=>{reads++;if(ref.id==='foreign')throw Error('Foreign badge read');if(mode==='detailError'&&ref.id==='b2')throw Error('Offline');return{id:ref.id,exists:()=>mode!=='missing'&&(ref.id==='b1'||mode==='complete'),data:()=>({status:'active',name:'Badge <img src=x>',description:'Description <script>bad<'+ '/script>',icon:'<svg onload=bad>',order:1})};};
${source}
const earnedBadgeCount = badgeView.count, badgeCollection = badgeView.grid, achievementLoading = badgeView.loading, achievementEmpty = badgeView.empty, achievementStatus = badgeView.status, retryAchievements = badgeView.retry;
const tick=()=>new Promise(r=>setTimeout(r,30)),check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');await tick();
 check(earnedBadgeCount.textContent==='2'&&reads===2,'Ownership count or detail dedup failed');
 check(badgeCollection.children.length===1&&achievementEmpty.hidden,'Partial catalog lost available badges');
 check(achievementStatus.textContent.includes('Some earned')&&!retryAchievements.hidden,'Partial catalog lacks recovery');
 check(!badgeCollection.querySelector('img,svg,script')&&badgeCollection.textContent.includes('<img src=x>'),'Badge text interpreted as markup');
 mode='complete';retryAchievements.click();await tick();check(badgeCollection.children.length===2&&retryAchievements.hidden&&achievementLoading.hidden,'Retry did not restore details');
 mode='detailError';await loadAchievements(auth.currentUser);check(badgeCollection.children.length===1&&earnedBadgeCount.textContent==='2','Detail outage discarded successful cards');
 mode='missing';await loadAchievements(auth.currentUser);check(!achievementEmpty.hidden===false&&achievementStatus.textContent.includes('earned badges are saved'),'Missing catalog claimed no earned badges');
 mode='error';await loadAchievements(auth.currentUser);check(earnedBadgeCount.textContent==='Unavailable'&&!retryAchievements.hidden&&achievementLoading.hidden,'Ownership error lacks retry');
 mode='empty';retryAchievements.click();await tick();check(earnedBadgeCount.textContent==='0'&&!achievementEmpty.hidden&&retryAchievements.hidden,'Genuine empty collection not distinguished');
 let release;mode='complete';gate=new Promise(r=>release=r);const old=loadAchievements(auth.currentUser);await tick();auth.currentUser=null;listener(null);gate=null;release();await old;
 check(!badgeCollection.children.length&&earnedBadgeCount.textContent==='—'&&achievementEmpty.hidden,'Late response restored signed-out badges');
 auth.currentUser={uid:'student'};mode='complete';listener(auth.currentUser);await tick();check(badgeCollection.children.length===2,'Fresh session failed');
 gate=new Promise(r=>release=r);const stale=loadAchievements(auth.currentUser);await tick();gate=null;mode='empty';await loadAchievements(auth.currentUser);release();await stale;
 check(earnedBadgeCount.textContent==='0'&&!achievementEmpty.hidden&&!badgeCollection.children.length,'Older request replaced fresh achievements');
 mode='complete';document.getElementById('toggleBadges').click();await tick();const artifactReadsBefore=artifactReads;
 window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));await tick();
 check(earnedBadgeCount.textContent==='2'&&badgeCollection.children.length===2&&artifactReads===artifactReadsBefore+1&&!document.getElementById('badges').hidden,'Back navigation did not refresh collections or preserve the open collection');
 document.getElementById('result').textContent='PASS: achievements ownership/dedup, safe text, partial/missing details, retry, empty state and session/request races';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
`;
html=html.replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'achievements.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1000','--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=4000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
