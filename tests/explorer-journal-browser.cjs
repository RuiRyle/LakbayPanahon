// Real page modules with simulated owner progress and provider-free catalog reads.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const {runFixture}=require('./student-missing-features-browser.cjs');const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-journal-design-'));
const source=name=>fs.readFileSync('js/'+name,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
const old=fs.readFileSync('tests/my-journey-browser.cjs','utf8');let setup=old.slice(old.indexOf('const auth={'),old.indexOf("${source('practice-review.js')}"));
setup=setup.replace("const onAuthStateChanged=(_,fn)=>{authListener=fn;queueMicrotask(()=>fn(auth.currentUser));};","const listeners=[];const onAuthStateChanged=(_,fn)=>{listeners.push(fn);authListener=u=>listeners.forEach(f=>f(u));queueMicrotask(()=>fn(auth.currentUser));};");
async function main(){for(const width of [1440,768,390].filter(w=>!process.argv[2]||w===Number(process.argv[2]))){
 const original=fs.readFileSync('pages/my-journey.html','utf8');let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=[...original.matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(m=>fs.readFileSync('css/'+m[1],'utf8').replace(/@import[^;]+;/g,'').replace(/url\(["']?(\.\.\/[^)'"\s]+)["']?\)/g,(_,p)=>'url("'+pathToFileURL(path.resolve('css',p)).href+'")')).join('\n');
 const script="const browserErrors=[];window.addEventListener('error',e=>browserErrors.push(e.message));window.addEventListener('unhandledrejection',e=>browserErrors.push(String(e.reason)));\n"+source('student-status.js')+'\n'+setup+`
 const doc=(_,name,id)=>({name,id}),getDoc=async ref=>{const row=(records[ref.name]||[]).find(r=>r.id===ref.id);return{id:ref.id,exists:()=>!!row,data:()=>row};};
 const deleteDoc=async ref=>{records[ref.name]=records[ref.name].filter(r=>r.id!==ref.id);};
 records.studentChapterProgress=[{id:'cp',chapterId:'c1',userId:'student',completed:true,completedAt:{toDate:()=>new Date('2026-11-01')}}];
 records.studentProgress.push({id:'p2',userId:'student',missionId:'m2',chapterId:'c1',completed:true});records.studentQuizAttempts=[];
 records.storyScenes=[{id:'s1',missionId:'m1',status:'active',order:1,exploreItems:[{title:'A shared responsibility',discovery:'A saved explanation from the lesson.'}]},{id:'s2',missionId:'m2',status:'active',order:1,exploreItems:[{title:'Exchange',discovery:'Another saved explanation.'}]}];
 records.studentEvidenceJournal=[{id:'note2',userId:'student',chapterId:'c1',missionId:'m2',sceneId:'s2',clueIndex:0},{id:'note1',userId:'student',chapterId:'c1',missionId:'m1',sceneId:'s1',clueIndex:0}];
 `+['practice-review.js','mission-review.js','review-question-catalog.js','student-journey.js','journey-path.js','lakbay-passport.js','learning-community.js','my-journey.js','discovery-pins.js','evidence-journal.js','evidence-journal-page.js'].map(source).join('\n')+`
 const tick=(ms=80)=>new Promise(r=>setTimeout(r,ms)),check=(ok,m)=>{if(!ok)throw Error(m);};
 (async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick(900);
 check(!page.hidden,'Journey did not load');check(document.documentElement.scrollWidth<=innerWidth+1,'Page overflow');
 check(document.getElementById('journeyMissionCount').textContent==='2 / 3','Mission calculation changed');
 check(document.getElementById('journeyChapterCount').textContent==='1 / 2','Chapter calculation changed');
 check(document.querySelector('.passport-stamp a').href.includes('chapter=c1'),'Stamp route missing');check(document.querySelector('.passport-stamp').textContent.includes('Nov'),'Completion date missing');check(document.querySelector('.passport-pending'),'Incomplete destination missing');
 check(journalHost.children.length===2,'Saved entries missing');
 journalSearch.value='responsibility';journalSearch.dispatchEvent(new Event('input'));check(journalHost.children.length===1,'Search failed');journalSearch.value='';journalSearch.dispatchEvent(new Event('input'));
 chapterFilter.value='c1';chapterFilter.dispatchEvent(new Event('change'));check(journalHost.children.length===2,'Chapter filter failed');
 journalFilter.value='m2';journalFilter.dispatchEvent(new Event('change'));check(journalHost.children.length===1,'Mission filter failed');journalFilter.value='';journalFilter.dispatchEvent(new Event('change'));
 document.querySelector('[data-journal-view=timeline]').click();check(journalHost.dataset.view==='timeline'&&journalHost.firstElementChild.textContent.includes('A shared responsibility'),'Curriculum order failed');
 document.querySelector('[data-journal-view=notebook]').click();check(journalHost.dataset.view==='notebook'&&journalHost.textContent.includes('saved explanation'),'Notebook lost explanations');
 document.querySelector('[data-journal-view=cards]').click();
 const actions=journalHost.querySelector('.journal-entry-actions');actions.open=true;const pin=actions.querySelector('.discovery-pin-button');pin.click();check(pin.getAttribute('aria-pressed')==='true','Pin failed');pin.click();check(pin.getAttribute('aria-pressed')==='false','Unpin failed');check(actions.querySelector('a').href.includes('discoveryWall'),'Wall route missing');
 [...actions.querySelectorAll('button')].find(b=>b.textContent==='Remove from Journal').click();await tick();check(records.studentEvidenceJournal.length===1&&journalHost.children.length===1,'Remove failed');
 check(records.studentProgress.length===2,'Journal actions changed learning evidence');
 const accordion=document.querySelector('.journey-chapter');accordion.open=!accordion.open;check(typeof accordion.open==='boolean','Accordion unavailable');
 check(document.querySelector('.journal-goal-progress progress').value===1,'Goal display wrong');
 check(document.documentElement.scrollWidth<=innerWidth+1,'Expanded layout overflow');
 await tick(300);check(!browserErrors.length,'Browser errors: '+browserErrors.join('; '));scrollTo(0,0);document.getElementById('fixtureResult').textContent='PASS: Explorer journal '+innerWidth+'px, saved counts, passport, filters, views, curriculum order, pin, remove, accordion, goal';
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
 const file=path.join(out,'journey-'+width+'.html');fs.writeFileSync(file,html);let result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 const second=path.join(out,'journal-'+width+'.html');fs.writeFileSync(second,html.replace('scrollTo(0,0);',"scrollTo(0,document.getElementById('evidenceJournal').getBoundingClientRect().top+scrollY-90);"));const secondary=await runFixture(second,width);console.log(secondary);if(!secondary?.startsWith('PASS:'))process.exitCode=1;
 const trail=path.join(out,'path-'+width+'.html');fs.writeFileSync(trail,html.replace('scrollTo(0,0);',"scrollTo(0,document.querySelector('.journey-body-grid').getBoundingClientRect().top+scrollY-90);"));const trailResult=await runFixture(trail,width);console.log(trailResult);if(!trailResult?.startsWith('PASS:'))process.exitCode=1;
 }console.log('Captures: '+out);}
main().catch(e=>{console.error(e);process.exitCode=1;});
