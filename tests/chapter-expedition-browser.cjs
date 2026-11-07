const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const {runFixture}=require('./student-missing-features-browser.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-chapter-design-'));
const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
const src=name=>fs.readFileSync('js/'+name,'utf8').replace(/import[\s\S]*?from\s+["'][^"']+["'];/g,'').replace(/export /g,'').replace(/(?:window\.)?location\.search/g,JSON.stringify('?chapter=chapter-1'));
async function main(){for(const width of [1440,1024,768,390]){
 const original=fs.readFileSync('pages/mission.html','utf8');let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=[...original.matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(m=>fs.readFileSync('css/'+m[1],'utf8').replace(/@import[^;]+;/g,'').replace(/url\(["']?(\.\.\/[^)'"\s]+)["']?\)/g,(_,p)=>'url("'+pathToFileURL(path.resolve('css',p)).href+'")')).join('\n');
 const script=`
 const catalog=${JSON.stringify(catalog)},cases=${fs.readFileSync('data/discovery-cases.json','utf8')};
 const tick=(ms=80)=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
 const auth={currentUser:{uid:'student'}},db={},completed=new Set(['mission-1']);let fixtureNavigation='';
 const instructionalSnapshot=(_,load)=>load(),requireLearningAccess=async()=>{},refreshInstructionalContent=()=>{};
 class LearningAccessError extends Error{}
 const onAuthStateChanged=(_,fn)=>queueMicrotask(()=>fn(auth.currentUser));
 const doc=(_,name,id)=>({name,id}),collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
 const getDoc=async ref=>({exists:()=>ref.name==='chapters',data:()=>catalog.chapters.find(c=>c.id===ref.id)});
 const getDocs=async ref=>{const rows=ref.name==='missions'?catalog.missions.filter(m=>m.chapterId==='chapter-1').map(m=>({...m,discoveryCase:cases.find(c=>c.chapterId===m.chapterId&&c.missionId===m.id)})):[...completed].map(missionId=>({missionId,userId:'student',completed:true}));const docs=rows.filter(row=>(ref.filters||[]).every(f=>row[f.field]===f.value)).map(row=>({id:row.id,data:()=>row}));return{docs,forEach:fn=>docs.forEach(fn)};};
 ${src('instructional-content.js').replace(/export \{[^}]+\} from [^;]+;/g,'').replace(/\{instructionalSnapshot,refreshInstructionalContent\} from [^;]+;/g,'')}
 ${src('mission.js').replace(/window\.location\.href\s*=/g,'fixtureNavigation =')}
 ${src('chapter-expedition.js')}
 ${src('mission-learning-guide-policy.js')}
 ${src('mission-learning-guide-view.js')}
 (function(){${src('mission-learning-companion.js')}})();
 ${src('discovery-cases.js')}
 ${src('discovery-case-view.js')}
 (function(){${src('mission-discovery.js')}})();
 (async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick(900);
 assert(!missionContent.hidden,'Chapter did not load');
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Horizontal overflow');
 assert(document.querySelector('.chapter-header-copy #chapterExpeditionProgress'),'Progress outside header copy');
 const image=document.querySelector('.chapter-header-art img');await image.decode();assert(image.naturalWidth>0,'Artwork did not load');
 assert(document.querySelector('.chapter-header-art').dataset.scene==='true','Chapter artwork not selected');
 assert(document.querySelector('.chapter-header-copy>.text-button')?.textContent==='Refresh Learning Content','Refresh missing');
 assert(document.querySelector('.chapter-about #chapterDescription').textContent===catalog.chapters.find(c=>c.id==='chapter-1').description,'Chapter description changed');
 assert(missionPath.querySelector('.completed')&&missionPath.querySelector('.current')&&missionPath.querySelector('.locked'),'Progress states missing');
 assert(missionPath.querySelector('.chapter-challenge.locked'),'Challenge gating changed');
 const route=document.querySelector('.mission-path-section'),brief=document.querySelector('.mission-introduction-card');
 if(innerWidth>850)assert(route.getBoundingClientRect().left>=brief.getBoundingClientRect().right,'Desktop columns overlap');
 for(const card of missionPath.querySelectorAll('.mission-path-item:not(.chapter-challenge)'))assert(card.getBoundingClientRect().height<190,'Oversized route card');
 assert(getComputedStyle(missionPath,'::before').display!=='none','Trail line missing');
 assert(getComputedStyle(missionPath.querySelector('.chapter-challenge .mission-path-content'),'::after').display==='none','Challenge overlay remains');
 const selected=loadedMissionStates.find(m=>m.id===selectedMissionId);assert(missionXp.textContent.includes(String(selected.xpReward)),'XP mismatch');
 missionPath.children[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await tick();assert(beginMissionButton.textContent.includes('Review'),'Review action lost');
 assert(!document.getElementById('missionLearningCompass').hidden,'Big Question missing');
 const detective=document.getElementById('missionDiscovery');assert(!detective.hidden,'Detective case missing');detective.open=true;await tick();assert(detective.querySelector('button'),'Detective did not render');
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Expanded case overflow');
 document.getElementById('fixtureResult').textContent='PASS: Chapter Overview '+innerWidth+'px, artwork, alignment, progress, XP, review, locks, question, detective';scrollTo(0,0);
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script>window.addEventListener("error",e=>document.getElementById("fixtureResult").textContent="FAIL: "+e.message);</script><script type="module">'+script+'</script></body>');
 const file=path.join(out,'chapter-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 if(width===1440||width===390){const detailFile=path.join(out,'chapter-details-'+width+'.html');fs.writeFileSync(detailFile,html.replace('scrollTo(0,0);',width===1440?"scrollTo(0,document.getElementById('missionDiscovery').getBoundingClientRect().top+scrollY-100);":"scrollTo(0,document.querySelector('.mission-path-section').getBoundingClientRect().top+scrollY-100);"));console.log(await runFixture(detailFile,width));}
 }console.log('Captures: '+out);}
main().catch(e=>{console.error(e);process.exitCode=1;});
