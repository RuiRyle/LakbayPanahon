const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-era-'));
let html = fs.readFileSync(path.join(root, 'pages/era.html'), 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '');
const source = fs.readFileSync(path.join(root, 'js/chapters.js'), 'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g, '');
const styles = ['student.css', 'chapters.css', 'navy-gold-theme.css'].map(name => fs.readFileSync(path.join(root, 'css', name), 'utf8')).join('\n');
const script = `
const instructionalSnapshot=(_,load)=>load();
const auth={currentUser:{uid:'student'}}, db={};
let listener,gate=null,completed=false,eraCompleted=false,failedCollection=null;
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const getDocs=async ref=>{
 if(ref.name==='chapters'&&!(ref.filters||[]).some(filter=>filter.field==='eraId'&&filter.value))throw Error('Unscoped catalog read');
 if(ref.name===failedCollection)throw Error("Offline");
 if(ref.name==='chapters'&&gate)await gate;
 const rows=ref.name==='eras'?[{id:'e1',status:'active',title:'Era one'},{id:'e2',status:'active',title:'Era two',requiredChapterIds:['c1','c2'],unlockMessage:'Complete Era one first.'}]
 :ref.name==='chapters'?[{id:'c1',eraId:'e1',title:'First chapter',displayLabel:'Prologue',status:'active',order:0},{id:'c2',eraId:'e1',title:'Second chapter',status:'active',order:2},{id:'c3',eraId:'e2',title:'Other era chapter',status:'active',order:1}]
 :eraCompleted?['c1','c2'].map(chapterId=>({userId:'student',chapterId,completed:true})):completed?[{userId:'student',chapterId:'c1',completed:true}]:[];
 const docs=rows.filter(row=>(ref.filters||[]).every(filter=>row[filter.field]===filter.value)).map(row=>({id:row.id,data:()=>row}));return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn)};
};
${source}
const tick=()=>new Promise(resolve=>setTimeout(resolve,50));
const check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');await tick();await tick();
 const hero=document.getElementById('eraOverview'), action=document.getElementById('eraContinue'), access=document.getElementById('eraOverviewAccess');
 check(hero.getBoundingClientRect().width > document.querySelector('.dashboard-content').getBoundingClientRect().width * .8,'Era hero was squeezed into the Home grid');
 check(!hero.hidden&&document.getElementById('eraOverviewTitle').textContent==='Era two','Direct era URL did not render');
 check(eraList.hidden&&chapterList.children.length===1,'Overview did not isolate selected chapter trail');
 check(action.hidden&&chapterList.querySelector('button').disabled,'Locked era exposes playable action');
 check(access.textContent.includes('Complete Era one'),'Locked overview lacks prerequisite explanation');
 check(document.getElementById('eraDiscoveryList').textContent.includes('Other era chapter'),'Catalog discovery fallback missing');
 check(document.querySelector('.era-button').getAttribute('href')==='era.html?era=e1','Era destination is not a real deep link');
 check(!document.querySelector('.era-button').hasAttribute('aria-pressed'),'Era link still acts like a toggle');
 globalThis.__lakbayExplorationPreview=true;await loadChapters('e2','Era two');
 check(!action.hidden&&action.getAttribute('href')==='mission.html?chapter=c3'&&!chapterList.querySelector('button').disabled,'Exploration preview did not preserve access');
 check(access.textContent.includes('not saved'),'Preview reward behavior unclear');globalThis.__lakbayExplorationPreview=false;
 eraCompleted=true;await loadChapters('e2','Era two');check(!action.hidden,'Completed prerequisite did not open destination');
 completed=true;eraCompleted=false;await loadChapters('e1','Era one');
 check(action.getAttribute('href')==='mission.html?chapter=c2','Next chapter action points to completed chapter');
 check(document.getElementById('eraProgress').value===1&&document.getElementById('eraProgress').max===2,'Progress is inaccurate');
 const authored={id:'e1',title:'<img src=x onerror=alert(1)>',description:'A described era',learningObjectives:['Explain a source','Connect two events'],theme:'forest',dateRange:'A published period'};
 renderEraOverview(authored);renderEraOverviewProgress(authored,[{chapter:{id:'c1',title:'Chapter'},isUnlocked:true,isContentReady:true,isCompleted:true}],true);
 check(!hero.querySelector('h1 img')&&document.getElementById('eraDiscoveryList').children.length===2,'Authored content is unsafe or missing');
 check(action.textContent.startsWith('Revisit:')&&hero.dataset.theme==='forest','Completed era has no review action or theme');
 failedCollection='chapters';await loadChapters('e2','Era two');check(action.hidden&&chapterList.querySelector('button'),'Failed reload retained stale action or lacks retry');
 failedCollection=null;eraCompleted=true;chapterList.querySelector('button').click();await tick();check(!action.hidden,'Retry did not recover overview');
 const width=document.documentElement.clientWidth;check(document.documentElement.scrollWidth<=width,'Overview causes horizontal overflow');check(hero.getBoundingClientRect().right<=width&&document.getElementById('eraDiscoveries').getBoundingClientRect().right<=width,'Overview content clips outside viewport');
 auth.currentUser=null;listener(null);check(hero.hidden&&action.hidden&&chapterSection.hidden,'Sign-out retained learner overview');
 auth.currentUser={uid:'student'};listener(auth.currentUser);await tick();await tick();
 document.getElementById('result').textContent='PASS: era deep link, catalog/authored content, locks, preview, next step, progress, retry and sign-out';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html = html.replace('</head>', '<style>'+styles+'</style></head>').replace('</body>', '<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'chapters.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
    '--window-size='+(process.env.CHAPTER_VIEWPORT||'1280,900'),'--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--screenshot='+path.join(temp,'era.png'),'--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=4000',
    'file:///'+file.replaceAll('\\','/')+'?era=e2'
],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;
const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);
console.log(match?.[1]||'FAIL: no browser result');console.log('Screenshot: '+path.join(temp,'era.png'));process.exitCode=match?.[1].startsWith('PASS:')?0:1;
