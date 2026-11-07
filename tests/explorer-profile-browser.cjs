const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const originalRunner=require('./student-missing-features-browser.cjs').runFixture;
// Same local Chrome runner, preserving the requested page scroll for identity screenshots.
const runFixture=eval('('+originalRunner.toString().replace("document.getElementById('levelRewardsCollection')?.scrollIntoView({block:'start'})","void 0")+')');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-explorer-profile-'));
const source=n=>fs.readFileSync('js/'+n,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
async function main(){for(const width of [1440,768,390]){
 const original=fs.readFileSync('pages/my-profile.html','utf8');let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=[...original.matchAll(/href=["']\.\.\/css\/([^"'?]+)(?:\?[^"']*)?["']/g)].map(m=>fs.readFileSync('css/'+m[1],'utf8').replace(/@import[^;]+;/g,'').replace(/url\(["']?(\.\.\/[^)'"\s]+)["']?\)/g,(_,p)=>'url("'+pathToFileURL(path.resolve('css',p)).href+'")')).join('\n');
 const script=`
 const errors=[];window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
 const auth={currentUser:{uid:'profile-preview'}},db={},records=new Map(),handlers=new Map();const authListeners=[];
 const onAuthStateChanged=(_,fn)=>{authListeners.push(fn);queueMicrotask(()=>fn(auth.currentUser));};
 const doc=(_,name,id)=>name+'/'+id,collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),serverTimestamp=()=>0;
 const snap=key=>({id:key.split('/').at(-1),exists:()=>records.has(key),data:()=>records.get(key),metadata:{hasPendingWrites:false,fromCache:false}});
 const getDoc=async key=>snap(key),getDocFromServer=getDoc;
 const onSnapshot=(key,fn)=>{if(!handlers.has(key))handlers.set(key,new Set());handlers.get(key).add(fn);queueMicrotask(()=>fn(snap(key)));return()=>handlers.get(key)?.delete(fn);};
 const emit=key=>{for(const fn of handlers.get(key)||[])fn(snap(key));};
 const setDoc=async(key,data)=>{records.set(key,data);emit(key);},updateDoc=async(key,data)=>{records.set(key,{...records.get(key),...data});emit(key);};
 const avatars=${fs.readFileSync('data/avatar-catalog.json','utf8')};
 const getDocs=async ref=>({docs:(ref.name==='avatars'?avatars:[{id:'p1',completed:true},{id:'p2',completed:true},{id:'p3',completed:true}]).map(row=>({id:row.id,data:()=>row}))}),getDocsFromServer=getDocs;
 records.set('users/profile-preview',{role:'student',status:'active',firstName:'Ana',middleName:'Reyes',lastName:'Santos',email:'ana@example.test',xp:450,level:5,learningStreak:4,avatarId:'book',createdAt:{toDate:()=>new Date('2026-09-01')}});records.set('studentCosmetics/profile-preview',{frameId:'bamboo'});records.set('learningSettings/progression',{xpPerLevel:100});
 for(const id of ['one','two']){records.set('studentArtifacts/profile-preview_'+id,{userId:'profile-preview',artifactId:id});records.set('artifacts/'+id,{status:'active',name:id==='one'?'Community Keepsake':'Maritime Discovery',description:'An earned token from a completed history lesson.',icon:id==='one'?'🏺':'⛵'});}
 records.set('studentEvidenceJournal/note',{userId:'profile-preview',chapterId:'chapter-1',missionId:'mission-1',sceneId:'scene-1',clueIndex:0});records.set('chapters/chapter-1',{status:'active',title:'Early Filipino Communities'});records.set('missions/mission-1',{status:'active',chapterId:'chapter-1',title:'Life in the Barangay'});records.set('storyScenes/scene-1',{status:'active',missionId:'mission-1',exploreItems:[{title:'Shared responsibilities',discovery:'A saved explanation from the history lesson.'}]});
 ${source('discovery-pins.js')}
 ${source('explorer-art.js')}
 ${source('evidence-journal.js')}
 toggleDiscoveryPin(auth.currentUser.uid,{kind:'artifact',id:'one'});toggleDiscoveryPin(auth.currentUser.uid,{kind:'artifact',id:'two'});toggleDiscoveryPin(auth.currentUser.uid,{kind:'journal',id:'note'});
 (function(){${source('student-profile.js')}\nmountStudentProfile(records.get('users/profile-preview'));})();
 ${source('level-reward-policy.js')}
 (function(){${source('level-rewards.js')}})();
 (function(){${source('discovery-wall-page.js')}})();
 const tick=(ms=80)=>new Promise(r=>setTimeout(r,ms)),check=(v,m)=>{if(!v)throw Error(m);};
 (async()=>{document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick(900);
 check(document.getElementById('profilePageName').textContent==='Ana Reyes Santos','Identity mismatch');check(document.getElementById('profilePageXp').textContent==='450'&&document.getElementById('profilePageLevel').textContent==='5'&&document.getElementById('profilePageStreak').textContent==='4'&&document.getElementById('profilePageMissions').textContent==='3','Stats changed');
 check(document.getElementById('profileExplorerTitle').textContent.includes('Level 5'),'Explorer title missing');
 document.getElementById('editProfileButton').click();await tick();check(document.querySelector('.student-profile-dialog').open,'Edit did not open');document.querySelector('.student-profile-close').click();document.querySelector('[data-edit-profile]').click();await tick();check(document.querySelector('.student-profile-dialog').open,'Update details did not open');document.querySelector('.student-profile-close').click();
 check(document.querySelectorAll('.discovery-wall-card').length===3,'Pins missing');check(!toggleDiscoveryPin(auth.currentUser.uid,{kind:'artifact',id:'four'}).ok,'Pin limit changed');
 const remove=document.querySelector('.discovery-wall-card .discovery-pin-button');remove.click();await tick();check(document.querySelectorAll('.discovery-wall-card').length===2,'Unpin failed');document.getElementById('refreshDiscoveryWall').click();await tick();check(document.querySelectorAll('.discovery-wall-card').length===2,'Refresh wall failed');
 const unlocked=[...document.querySelectorAll('.level-reward-card[data-unlocked=true] button')].find(b=>!b.disabled&&b.dataset.frameId!=='none');check(unlocked,'Unlocked reward unavailable');unlocked.click();await tick();check(records.get('studentCosmetics/profile-preview').frameId===unlocked.dataset.frameId,'Equip not saved');check(document.querySelector('.profile-page-avatar').dataset.levelFrame===unlocked.dataset.frameId,'Equipped frame not shown');if(unlocked.dataset.frameId==='sunburst')check(getComputedStyle(document.querySelector('.profile-page-avatar')).outlineStyle==='double','Equipped frame outline hidden');
 check([...document.querySelectorAll('.level-reward-card[data-unlocked=false] button')].every(b=>b.disabled),'Locked reward selectable');
 check([...document.querySelectorAll('.profile-page-links>a')].map(a=>a.getAttribute('href')).join(',')==='my-journey.html,achievements.html,my-class.html','Quick routes changed');
 const identity=document.querySelector('.profile-identity-card').getBoundingClientRect(),heading=document.querySelector('.profile-page-heading').getBoundingClientRect();check(Math.abs(identity.width-heading.width)<2,'Unused profile column remains');check(document.documentElement.scrollWidth<=innerWidth+1,'Horizontal overflow');check(!errors.length,'Browser errors: '+errors.join('; '));await tick(300);scrollTo(0,0);document.getElementById('fixtureResult').textContent='PASS: Explorer Profile '+innerWidth+'px, identity, four stats, edit/update, wall, pin limit, equip, locks, links, overflow, runtime errors';
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
 for(const detail of [false,true]){const file=path.join(out,'profile-'+width+(detail?'-rewards':'')+'.html');fs.writeFileSync(file,detail?html.replace('scrollTo(0,0);',"scrollTo(0,document.getElementById('levelRewardsCollection').getBoundingClientRect().top+scrollY-90);"):html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}
 }console.log('Captures: '+out);}
main().catch(e=>{console.error(e);process.exitCode=1;});
