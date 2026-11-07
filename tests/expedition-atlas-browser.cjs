const fs=require('fs'),path=require('path'),os=require('os'),{pathToFileURL}=require('url');
const {runFixture}=require('./student-missing-features-browser.cjs');const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-atlas-'));
const source=f=>fs.readFileSync(path.join(root,'js',f),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
const script=`
const auth={currentUser:{uid:'student'}},db={},listeners=[];const data=${JSON.stringify({eras:catalog.eras,chapters:catalog.chapters,studentChapterProgress:[]})};
const onAuthStateChanged=(_,fn)=>{listeners.push(fn);queueMicrotask(()=>fn(auth.currentUser));},collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),instructionalSnapshot=(_,fn)=>fn();
const getDocs=async ref=>{const values=(data[ref.name]||[]).filter(row=>(ref.filters||[]).every(f=>row[f.field]===f.value));const docs=values.map(row=>({id:row.id||row.chapterId,data:()=>row}));return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn)};};
${source('chapters.js')}
${source('expedition-atlas.js')}
const tick=()=>new Promise(r=>setTimeout(r,100)),checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
(async()=>{document.body.classList.remove('auth-checking');document.body.classList.add('authenticated');await tick();await tick();
check(cards.querySelectorAll('.era-card').length===4,'All active eras retained');check(atlas.children.length===4,'Atlas exposes all destinations');
check(cards.querySelector('[data-locked=true] .era-button').tagName==='BUTTON','Locked destination opens a preview rather than a lesson');
const locked=atlas.querySelector('[data-state=locked]');locked.click();check(dialog.open&&content.querySelector('ol li'),'Locked destination preview lists published chapters');check(!content.querySelector('a'),'Preview cannot expose restricted lesson routes');document.getElementById('closeAtlasPreview').click();check(!dialog.open,'Preview closes');
check(cards.querySelector('.atlas-card-progress span').textContent.includes('0 /'),'Progress comes from saved chapter records');
check(cards.querySelector('[data-locked=false] .era-button').href.includes('era.html?era='),'Available era retains original route');
check(atlas.querySelector('[aria-current=step]'),'Current available era is highlighted');
await new Promise(r=>setTimeout(r,650));
const entries=[...cards.querySelectorAll('.era-card')];
check(entries.every(card=>!card.querySelector('.era-image .destination-number')),'Destination labels never overlap decorative illustrations');
check(entries.every(card=>card.querySelector('.era-destination-art').getAttribute('src').includes('/assets/atlas/')),'All destinations use the same text-free editorial asset family');
if(innerWidth>650){const buttons=entries.slice(0,2).map(card=>card.querySelector('.era-button').getBoundingClientRect());check(Math.abs(buttons[0].top-buttons[1].top)<1,'Paired destination action buttons align');check(entries[0].getBoundingClientRect().height<650,'Cards stay compact with full descriptions');}
const bounds=entries.map(c=>c.getBoundingClientRect());if(innerWidth>650)check(Math.abs(bounds[0].height-bounds[1].height)<1,'Destination cards share aligned heights');

for(const entry of entries){const authored=data.eras.find(era=>era.id===entry.dataset.eraId);check(entry.querySelector('.atlas-card-description').textContent.trim()===authored.description.trim(),'Original description is preserved for '+authored.id);}
const completedEra=data.eras.find(era=>era.id==='early-philippine-communities');for(const c of data.chapters.filter(ch=>ch.eraId===completedEra.id&&ch.status==='active'))data.studentChapterProgress.push({id:c.id,userId:'student',chapterId:c.id,completed:true});await loadEras();await loadAtlas(auth.currentUser);await tick();
check(cards.querySelector('[data-era-id="early-philippine-communities"]').dataset.atlasState==='complete','Owned chapter results mark an era completed');
check(cards.querySelector('[data-era-id="early-philippine-communities"] .era-button').textContent==='Revisit era','Completed era retains revisit navigation');
data.studentChapterProgress=[];await loadEras();await loadAtlas(auth.currentUser);await tick();
check(document.documentElement.scrollWidth<=innerWidth+1,'No horizontal page overflow');await new Promise(r=>setTimeout(r,600));document.querySelector('.era-grid').scrollIntoView({block:'start'});document.getElementById('fixtureResult').textContent='PASS: '+checks.length+' atlas checks at '+innerWidth+'px';})().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.stack);
`;
(async()=>{for(const width of [1920,1440,768,390]){let html=fs.readFileSync('pages/chapters.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,href)=>{const f=path.resolve('pages',href);return '<style>'+fs.readFileSync(f,'utf8').replace(/url\(['"]?([^)'"\s]+)['"]?\)/g,(all,url)=>url.startsWith('data:')?all:'url("'+pathToFileURL(path.resolve(path.dirname(f),url)).href+'")')+'</style>';});html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');const file=path.join(out,'atlas-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}console.log('Screenshots: '+out);})().catch(e=>{console.error(e);process.exitCode=1;});
