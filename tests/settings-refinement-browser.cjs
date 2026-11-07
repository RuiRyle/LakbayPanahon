const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url'),{runFixture}=require('./student-missing-features-browser.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-settings-refinement-'));
const source=n=>fs.readFileSync('js/'+n,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
async function main(){for(const width of [1440,768,390]){
 const original=fs.readFileSync('pages/settings.html','utf8');let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=[...original.matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(m=>fs.readFileSync('css/'+m[1],'utf8').replace(/@import[^;]+;/g,'')).join('\n');
 const script=`const errors=[];window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));Object.defineProperty(window,'AudioContext',{value:undefined});Object.defineProperty(window,'webkitAudioContext',{value:undefined});localStorage.clear();localStorage.setItem('lakbay-background-music','off');
 ${source('page-transition.js')}
 const auth={currentUser:{uid:'settings-preview'}},db={};const onAuthStateChanged=(_,fn)=>queueMicrotask(()=>fn(auth.currentUser));
 const collection=(_,name)=>({name}),doc=(_,name,id)=>({name,id}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),orderBy=field=>({field}),documentId=()=> '__name__',limit=n=>({n}),startAfter=id=>({id});
 const getDocFromServer=async ref=>({id:ref.id,exists:()=>ref.name==='users',data:()=>({role:'student',status:'active',firstName:'Preview',xp:150})});
 const getDocsFromServer=async ref=>{if(!ref.filters.some(f=>f.field==='userId'&&f.value===auth.currentUser.uid))throw Error('Missing owner query');return {docs:[]};};
 let downloadedBlob,filename;URL.createObjectURL=blob=>{downloadedBlob=blob;return 'blob:preview';};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){filename=this.download;};
 ${source('student-data-export.js')}
 (function(){${source('student-data-download.js')}})();
 const tick=(ms=80)=>new Promise(r=>setTimeout(r,ms)),check=(ok,m)=>{if(!ok)throw Error(m);};
 (async()=>{document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick(500);
 for(const name of ['sounds','music','focus-audio','motion','contrast']){const control=document.querySelector('[data-preference-switch="'+name+'"]'),before=control.getAttribute('aria-checked');control.click();check(control.getAttribute('aria-checked')!==before,'Switch failed '+name);control.click();}
 for(const [id,val] of [['gameSoundVolume','25'],['backgroundMusicVolume','40']]){const slider=document.getElementById(id);slider.value=val;slider.dispatchEvent(new Event('input',{bubbles:true}));check(slider.closest('.settings-volume-row').querySelector('output').textContent===val+'%','Slider failed');}
 const size=document.getElementById('studentReadingSize');size.value='larger';size.dispatchEvent(new Event('change',{bubbles:true}));check(document.documentElement.dataset.studentTextSize==='larger','Text preference failed');check(document.documentElement.scrollWidth<=innerWidth+1,'Large text overflow');size.value='standard';size.dispatchEvent(new Event('change',{bubbles:true}));
 for(const faq of document.querySelectorAll('.settings-data-questions details')){faq.open=true;check(faq.querySelector('.settings-data-answer').getBoundingClientRect().height>0,'FAQ answer missing');faq.open=false;}
 check([...document.querySelectorAll('.settings-section-links a')].map(a=>a.getAttribute('href')).join(',')==='#sound-settings,#reading-settings,#account-data-help','Section navigation changed');
 check(document.querySelector('.settings-profile-link').getAttribute('href')==='my-profile.html','Profile route changed');
 document.getElementById('downloadLearningData').click();await tick();check(filename?.endsWith('.json')&&downloadedBlob?.type==='application/json','Download not prepared');const data=JSON.parse(await downloadedBlob.text());check(data&&document.getElementById('learningDataDownloadStatus').textContent.includes('ready'),'Export incomplete');
 check(!errors.length,'Runtime errors: '+errors.join('; '));check(document.documentElement.scrollWidth<=innerWidth+1,'Page overflow');scrollTo(0,0);document.getElementById('fixtureResult').textContent='PASS: Settings '+innerWidth+'px, switches, volumes, reading, FAQs, section links, profile route, mock account export, overflow and runtime errors';
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);`;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
 for(const detail of [false,true]){const file=path.join(out,'settings-'+width+(detail?'-help':'')+'.html');fs.writeFileSync(file,detail?html.replace('scrollTo(0,0);',"scrollTo(0,document.getElementById('account-data-help').getBoundingClientRect().top+scrollY-90);"):html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;}
 }console.log('Captures: '+out);}
main().catch(e=>{console.error(e);process.exitCode=1;});
