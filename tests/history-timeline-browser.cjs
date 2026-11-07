// Actual Timeline modules and page; synthetic fixtures only, no Firebase access.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {runFixture}=require('./student-missing-features-browser.cjs');
const root=path.resolve(__dirname,'..'),folder=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-timeline-'));
const source=file=>fs.readFileSync(path.join(root,'js',file),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
const setup=`
const auth={currentUser:{uid:'timeline-student'}},db={},listeners=[],xpListeners=[];let broken=false,release,gate;
const records=${JSON.stringify({eras:catalog.eras,chapters:catalog.chapters,missions:catalog.missions,studentProgress:[],studentChapterProgress:[]})};
for(const chapter of records.chapters.filter(c=>c.order<1))records.studentChapterProgress.push({id:chapter.id,userId:'timeline-student',chapterId:chapter.id,completed:true});
const first=records.chapters.find(c=>c.id==='chapter-1'),second=records.chapters.find(c=>c.id==='chapter-2');
records.studentChapterProgress.push({id:'completed',userId:'timeline-student',chapterId:first.id,completed:true});
for(const m of records.missions.filter(m=>m.chapterId===first.id))records.studentProgress.push({id:m.id,userId:'timeline-student',missionId:m.id,completed:true});
const secondMissions=records.missions.filter(m=>m.chapterId===second.id);records.studentProgress.push({id:'partial',userId:'timeline-student',missionId:secondMissions[0].id,completed:true});
const onAuthStateChanged=(_,fn)=>{listeners.push(fn);queueMicrotask(()=>fn(auth.currentUser));};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),doc=(_,name,id)=>({name,id});
const getDocs=async ref=>{if(gate)await gate;if(broken)throw Error('Offline');if(ref.name.startsWith('student'))check(ref.filters?.[0]?.value===auth.currentUser?.uid,'Progress queries must be scoped to the student');return{docs:records[ref.name].map(row=>({id:row.id,data:()=>row}))};};
const onSnapshot=(ref,next,error)=>{const listener={ref,next,error,stopped:false};xpListeners.push(listener);next({exists:()=>true,data:()=>({role:'student',status:'active',xp:245}),metadata:{}});return()=>{listener.stopped=true;};};
const tick=()=>new Promise(r=>setTimeout(r,60)),checks=[],check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
${source('journey-path.js')}
${source('student-status.js')}
${source('history-timeline-view.js')}
${source('history-timeline.js')}
${source('student-profile.js')}
normalizeStudentTopbar({xp:245,firstName:'History',level:3});
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick();
 check(host.querySelectorAll('.history-timeline-stop').length===groups.reduce((total,era)=>total+era.chapters.length,0),'All published chapters are retained');
 const titles=[...host.querySelectorAll('.history-timeline-stop h3')].map(n=>n.textContent);
 check(titles.join('|')===groups.flatMap(g=>g.chapters.map(c=>c.title)).join('|'),'Chapter text and order match shared journey path');
 check(document.getElementById('topXp').textContent==='245 XP','XP uses the saved profile value');
 const cards=['chapter-1','chapter-2','chapter-3'].map(id=>host.querySelector('[data-chapter-id="'+id+'"]')); check(cards[0].dataset.state==='complete'&&cards[1].dataset.state==='available'&&cards[2].dataset.state==='locked','Completed, available and locked chapter states are distinct');
 check(cards[0].querySelector('a').textContent==='Revisit Chapter'&&cards[1].querySelector('a').textContent==='Explore Chapter'&&!cards[2].querySelector('a'),'Only accessible chapters have navigation actions');
 check(new URL(cards[1].querySelector('a').href).searchParams.get('chapter')===second.id,'Chapter navigation keeps the actual identifier');
 check(cards[1].querySelector('progress').value===1&&cards[1].querySelector('progress').max===secondMissions.length,'Mission meter uses actual owned completion records');
 check(host.querySelector('.timeline-era-count b').textContent.startsWith('2 /'),'Era meter counts chapter results, not mission totals');
 check(cards[0].textContent.includes(first.description),'Authored chapter description is retained');
 for(const m of secondMissions.slice(1))records.studentProgress.push({id:m.id,userId:'timeline-student',missionId:m.id,completed:true});await load();
 check(host.querySelector('[data-chapter-id=chapter-2]').dataset.state==='available'&&host.textContent.includes('Finish the chapter challenge'),'Completing all missions does not fabricate chapter completion');
 check(!host.querySelector('[data-chapter-id=chapter-3]').querySelector('a'),'Mission completion cannot unlock a chapter without its chapter result');
 const authoredHighlights=new Set(records.missions.map(m=>m.title));check([...host.querySelectorAll('.timeline-highlights li')].every(n=>authoredHighlights.has(n.textContent)),'Highlights reuse published mission titles');
 filter.value=groups[1].id;filter.dispatchEvent(new Event('change'));check(host.querySelectorAll('.timeline-period').length===1&&!host.querySelector('.history-timeline-stop a'),'Era filter respects locked periods');await load();check(filter.value===groups[1].id,'Refresh preserves selected period');
 broken=true;await load();check(!host.children.length&&!retry.disabled&&status.textContent.includes('could not load'),'Load errors clear stale progress and permit retry');broken=false;await load();

 gate=new Promise(r=>release=r);const pending=load();await tick();auth.currentUser=null;for(const fn of listeners)fn(null);gate=null;release();await pending;
 check(!host.children.length,'Late timeline data cannot survive sign-out');
 auth.currentUser={uid:'timeline-student'};for(const fn of listeners)fn(auth.currentUser);await tick();
 filter.value=groups[0].id;filter.dispatchEvent(new Event('change'));await tick();
 check(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal page overflow');
 document.documentElement.dataset.studentTextSize='larger';check(document.documentElement.scrollWidth<=innerWidth+1,'Larger student text does not overflow');delete document.documentElement.dataset.studentTextSize;
 const hostile={id:'a &?x',title:'<img src=x>',description:'<b>authored text</b>',accessible:true,completed:false,missions:[],imageUrl:'javascript:alert(1)'};
 const probe=document.createElement('div');renderHistoryTimeline(probe,[{id:'e',chapters:[hostile]}]);check(!probe.querySelector('script')&&!probe.querySelector('img[src=x]')&&probe.textContent.includes('<b>authored text</b>'),'Curriculum text cannot inject markup');check(new URL(probe.querySelector('a').href).searchParams.get('chapter')===hostile.id,'Special chapter IDs stay encoded');
 await new Promise(resolve=>setTimeout(resolve,500));
 document.getElementById('fixtureResult').textContent='PASS: '+checks.length+' timeline checks at '+innerWidth+'px';
})().catch(error=>document.getElementById('fixtureResult').textContent='FAIL: '+error.stack);
`;
(async()=>{for(const width of [1440,1024,768,390,320]){let html=fs.readFileSync(path.join(root,'pages/history-timeline.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,href)=>{const file=path.resolve(root,'pages',href);return '<style>'+fs.readFileSync(file,'utf8').replace(/url\(['"]?([^)'"\s]+)['"]?\)/g,(all,url)=>url.startsWith('data:')?all:'url("'+require('node:url').pathToFileURL(path.resolve(path.dirname(file),url)).href+'")')+'</style>';});html=html.replace('<head>','<head><base href="'+require('node:url').pathToFileURL(path.join(root,'pages')).href+'/">').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+setup+'</script></body>');const file=path.join(folder,'timeline-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}console.log('Screenshots: '+folder);})().catch(e=>{console.error(e);process.exitCode=1;});
