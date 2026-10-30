const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-journey-'));
let html = fs.readFileSync(path.join(root, 'pages/chapters.html'), 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '');
const source = fs.readFileSync(path.join(root, 'js/chapters.js'), 'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g, '').replace(/window\.location\.href\s*=/g,'fixtureNavigation =');
const styles = ['student.css', 'chapters.css'].map(name => fs.readFileSync(path.join(root, 'css', name), 'utf8')).join('\n');
const script = `
const instructionalSnapshot=(_,load)=>load();
const auth={currentUser:{uid:'student'}}, db={};
let listener,gate=null,completed=false,eraCompleted=false,failedCollection=null,hostileCatalog=false,fixtureNavigation='';
const hostile='<img data-attack src=x onerror="window.mapAttack=1"><svg data-attack onload="window.mapAttack=1"></svg>',hostileId='chapter"&era=forged#'+hostile;
const onAuthStateChanged=(_,fn)=>{listener=fn;queueMicrotask(()=>fn(auth.currentUser));};
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters});
const getDocs=async ref=>{
 if(ref.name==='chapters'&&!(ref.filters||[]).some(filter=>filter.field==='eraId'&&filter.value))throw Error('Unscoped catalog read');
 if(ref.name===failedCollection)throw Error("Offline");
 if(ref.name==='chapters'&&gate)await gate;
 const rows=ref.name==='eras'?[{id:'e1',status:'active',title:'Era one'},{id:'e2',status:'active',title:'Era two',requiredChapterIds:['c1','c2'],unlockMessage:'Complete Era one first.'}]
 :ref.name==='chapters'?[{id:'c1',eraId:'e1',title:'First chapter',displayLabel:'Prologue',status:'active',order:0},{id:'c2',eraId:'e1',title:'Second chapter',status:'active',order:2},{id:'c3',eraId:'e2',title:'Other era chapter',status:'active',order:1}]
 :eraCompleted?['c1','c2'].map(chapterId=>({userId:'student',chapterId,completed:true})):completed?[{userId:'student',chapterId:'c1',completed:true}]:[];
 if(hostileCatalog&&['eras','chapters'].includes(ref.name))for(const row of rows){if(row.id==='e1'||row.id==='c1')row.id=hostileId;if(row.eraId==='e1')row.eraId=hostileId;row.title=row.description=row.displayLabel=hostile;row.imageUrl='javascript:window.mapAttack=1';}
 const docs=rows.filter(row=>(ref.filters||[]).every(filter=>row[filter.field]===filter.value)).map(row=>({id:row.id,data:()=>row}));return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn)};
};
${source}
const tick=()=>new Promise(resolve=>setTimeout(resolve,50));
const check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');
 await tick();
 failedCollection='eras';await loadEras();check(!eraError.hidden&&eraError.querySelector('button'),'Era recovery missing');
 failedCollection=null;eraError.querySelector('button').click();await tick();check(eraList.children.length===2&&eraError.hidden,'Era retry failed');
 failedCollection='chapters';await loadChapters('e1','Era one');check(chapterList.querySelector('button'),'Chapter recovery missing');
 failedCollection=null;chapterList.querySelector('button').click();await tick();

 check(eraList.children[1].dataset.locked==='true'&&eraList.children[1].querySelector('.era-button').textContent==='Preview Chapters','Locked era is not a preview');
 await loadChapters('e2','Era two');check(chapterList.querySelector('button').disabled,'First chapter bypassed era lock');
 await loadChapters('e1','Era one');
 check(chapterList.children.length===2,'Chapter map missing content');
 const firstCard=chapterList.children[0], marker=firstCard.querySelector('.chapter-number'),content=firstCard.querySelector('.chapter-content');
 check(!marker.textContent.includes('Prologue')&&firstCard.querySelector('.chapter-label').textContent.includes('Prologue'),'Named chapter label must sit outside its marker');
 check(marker.scrollWidth<=marker.clientWidth,'Prologue marker overflows');
 check(marker.getBoundingClientRect().right<=content.getBoundingClientRect().left,'Prologue marker overlaps chapter content');
 check(document.activeElement===selectedEraTitle,'Loaded chapters did not receive heading focus');
 check(chapterList.children[1].querySelector('button').disabled,'Later chapter unlocked early');
 completed=true;await loadChapters('e1','Era one');
 check(!chapterList.children[1].querySelector('button').disabled,'Saved completion did not unlock next chapter');
 await loadChapters('e2','Era two');check(chapterList.querySelector('button').disabled,'Partial previous era unlocked new era');
 globalThis.__lakbayExplorationPreview=true;await loadChapters('e2','Era two');check(!chapterList.querySelector('button').disabled,'Local preview did not open locked era');globalThis.__lakbayExplorationPreview=false;
 eraCompleted=true;await loadChapters('e2','Era two');check(!chapterList.querySelector('button').disabled&&eraList.children[1].dataset.locked==='false','Completed previous era did not unlock next era');
 eraCompleted=false;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));await tick();
 check(eraList.children[1].dataset.locked==='true'&&chapterList.querySelector('button').disabled,'Browser return retained stale unlocked chapter');
 eraCompleted=true;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));await tick();
 check(eraList.children[1].dataset.locked==='false'&&!chapterList.querySelector('button').disabled,'Browser return did not refresh completed era and chapter progress');
 let release;gate=new Promise(resolve=>{release=resolve;});const old=loadChapters('e1','Era one');
 gate=null;await loadChapters('e2','Era two');release();await old;
 check(chapterList.textContent.includes('Other era chapter')&&!chapterList.textContent.includes('First chapter'),'Stale era replaced selection');
 hostileCatalog=true;await loadEras();await loadChapters(hostileId,hostile);await tick();
 check(!document.querySelector('[data-attack]')&&window.mapAttack===undefined,'Catalog text or era image URL interpreted as executable markup');
 check(eraList.textContent.includes(hostile)&&chapterList.textContent.includes(hostile),'Escaped catalog text was lost');
 const eraTarget=new URL(eraList.querySelector('.era-button').href);
 check(eraTarget.pathname.endsWith('/era.html')&&eraTarget.searchParams.get('era')===hostileId&&[...eraTarget.searchParams].length===1&&!eraTarget.hash,'Hostile era ID changed its navigation');
 chapterList.querySelector('.chapter-button').click();
 const chapterTarget=new URL(fixtureNavigation,'https://example.test/pages/');
 check(chapterTarget.pathname==='/pages/mission.html'&&chapterTarget.searchParams.get('chapter')===hostileId&&[...chapterTarget.searchParams].length===1&&!chapterTarget.hash,'Hostile chapter ID changed its navigation');
 hostileCatalog=false;
 gate=new Promise(resolve=>{release=resolve;});const pending=loadChapters('e1','Era one');
 auth.currentUser=null;listener(null);release();await pending;
 check(!eraList.children.length&&!chapterList.children.length&&chapterSection.hidden,'Sign-out retained map');
 document.getElementById('result').textContent='PASS: chapter prerequisites, saved unlock, rapid era switching, hostile catalog text/IDs and sign-out during loading';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});
`;
html = html.replace('</head>', '<style>'+styles+'</style></head>').replace('</body>', '<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'chapters.html');fs.writeFileSync(file,html);
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
    '--window-size='+(process.env.CHAPTER_VIEWPORT||'1280,900'),'--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--user-data-dir='+path.join(temp,'browser'),'--dump-dom','--virtual-time-budget=4000',
    'file:///'+file.replaceAll('\\','/')+'?chapter=c1'
],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(result.error)throw result.error;
const match=result.stdout.match(/<output id="result">([^<]+)<\/output>/);
console.log(match?.[1]||'FAIL: no browser result');process.exitCode=match?.[1].startsWith('PASS:')?0:1;
