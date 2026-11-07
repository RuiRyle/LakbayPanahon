const fs=require('fs'),path=require('path'),os=require('os'),{pathToFileURL}=require('url');
const {runFixture}=require('./student-missing-features-browser.cjs');const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-era-route-'));
const source=f=>fs.readFileSync(path.join(root,'js',f),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
const script=`
const instructionalSnapshot=(_,load)=>load();
const auth={currentUser:{uid:'student'}}, db={};
let listener,gate=null,completed=false,eraCompleted=false,failedCollection=null;
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const getDocs=async ref=>{
 if(ref.name==='chapters'&&!(ref.filters||[]).some(filter=>filter.field==='eraId'&&filter.value))throw Error('Unscoped catalog read');
 if(ref.name===failedCollection)throw Error("Offline");
 if(ref.name==='chapters'&&gate)await gate;
 const rows=ref.name==='missions'?[{id:'m1',chapterId:'c1',status:'active'},{id:'m2',chapterId:'c2',status:'active'}]:ref.name==='studentProgress'?(completed?[{userId:'student',missionId:'m1',completed:true}]:[]):ref.name==='eras'?[{id:'early-philippine-communities',status:'active',title:'Precolonial Philippines',description:'Explore the origins, communities, cultures, and connections of the Philippines before Spanish colonization.'},{id:'e2',status:'active',title:'Era two',requiredChapterIds:['c1','c2'],unlockMessage:'Complete Era one first.'}]
 :ref.name==='chapters'?[{id:'c1',eraId:'early-philippine-communities',title:'First chapter',displayLabel:'Prologue',status:'active',order:0},{id:'c2',eraId:'early-philippine-communities',title:'Second chapter',status:'active',order:2},{id:'c3',eraId:'e2',title:'Other era chapter',status:'active',order:1}]
 :eraCompleted?['c1','c2'].map(chapterId=>({userId:'student',chapterId,completed:true})):completed?[{userId:'student',chapterId:'c1',completed:true}]:[];
 const docs=rows.filter(row=>(ref.filters||[]).every(filter=>row[filter.field]===filter.value)).map(row=>({id:row.id,data:()=>row}));return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn)};
};

${source('era-expedition.js')}
${source('chapters.js')}

const tick=()=>new Promise(r=>setTimeout(r,100)),checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
(async()=>{document.body.classList.remove('auth-checking');document.body.classList.add('authenticated');await tick();await tick();const era=loadedEras.find(row=>row.id==='early-philippine-communities');renderEraOverview(era);await loadChapters('early-philippine-communities','Era one');await tick();
check(document.getElementById('eraOverview').contains(document.getElementById('eraProgressPanel')),'Era progress lives inside the compact header');
check(document.getElementById('eraCompletionPercent').textContent==='0%','Initial completion percentage uses saved chapters');
check(chapterList.querySelectorAll('.chapter-card').length===2,'Selected-era chapter order remains intact');
check(chapterList.querySelectorAll('.chapter-card')[1].querySelector('button').disabled,'Later chapter stays locked');
check(document.querySelector('#eraOverviewArt img').getAttribute('src').includes('/assets/story/'),'Precolonial hero reuses the local maritime lesson illustration');
check(document.querySelectorAll('#eraDiscoveryList li').length>0,'Existing discovery content retained');
completed=true;await loadChapters('early-philippine-communities','Era one');await tick();
check(document.getElementById('eraCompletionPercent').textContent==='50%','Saved chapter completion changes percentage');
check(chapterList.querySelector('.chapter-card').dataset.expeditionState==='completed','Completed chapter uses completed milestone');
check(chapterList.querySelectorAll('.chapter-card')[1].dataset.expeditionState==='current','Next eligible chapter is current');
check(chapterList.querySelector('button').textContent==='Review Chapter','Completed chapter keeps review action');
check(chapterList.querySelector('.era-mission-progress').textContent.includes('1 / 1'),'Mission progress uses owned results');
check(new URL(document.getElementById('eraContinue').href).searchParams.get('chapter')==='c2','Continue action preserves next chapter route');
await loadChapters('e2','Era two');await tick();check(document.getElementById('eraContinue').hidden&&chapterList.querySelector('button').disabled,'Locked era exposes no continuation');
renderEraOverview(era);eraError.hidden=true;await loadChapters('early-philippine-communities','Era one');await tick();await new Promise(r=>setTimeout(r,650));check(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal overflow');
const h=document.getElementById('eraOverview').getBoundingClientRect();check(h.height<900,'Header remains bounded on small screens');
document.documentElement.dataset.studentTextSize='larger';check(document.documentElement.scrollWidth<=innerWidth+1,'Larger text fits viewport');
const first=chapterList.querySelector('.chapter-card');
check(first.querySelector('.era-chapter-actions').contains(first.querySelector('.chapter-button')),'Chapter action occupies its own action column');
if(innerWidth>950){const copy=first.querySelector('.chapter-content').getBoundingClientRect(),actions=first.querySelector('.era-chapter-actions').getBoundingClientRect();check(copy.right<=actions.left+1,'Desktop chapter content and actions do not overlap');check(first.getBoundingClientRect().height<300,'Desktop chapter card stays compact');}
check(getComputedStyle(document.getElementById('eraOverviewArt').querySelector('img')).objectFit==='cover','Detailed hero fills its image area');
document.getElementById('fixtureResult').textContent='PASS: '+checks.length+' era-route checks at '+innerWidth+'px';})().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.stack);

`;
(async()=>{for(const width of [1920,1440,768,390]){let html=fs.readFileSync('pages/era.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,href)=>{const f=path.resolve('pages',href);return '<style>'+fs.readFileSync(f,'utf8').replace(/url\(['"]?([^)'"\s]+)['"]?\)/g,(all,url)=>url.startsWith('data:')?all:'url("'+pathToFileURL(path.resolve(path.dirname(f),url)).href+'")')+'</style>';});html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');const file=path.join(out,'era-route-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}console.log('Screenshots: '+out);})().catch(e=>{console.error(e);process.exitCode=1;});
