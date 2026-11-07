// Real Achievements markup/styles/modules. Isolated synthetic owned collections; no Firebase.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url'),{runFixture}=require('./student-missing-features-browser.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-museum-layout-'));
const source=file=>fs.readFileSync('js/'+file,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
async function main(){for(const width of [1440,390])for(const modal of [false,true]){
 const original=fs.readFileSync('pages/achievements.html','utf8'),names=[...original.matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(m=>m[1]);let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=names.map(n=>fs.readFileSync('css/'+n,'utf8').replace(/@import[^;]+;/g,'')).join('\n');
 const script=`
 const tick=()=>new Promise(r=>setTimeout(r,35)),check=(ok,message)=>{if(!ok)throw Error(message);};
 const auth={currentUser:{uid:'owner'}},db={};let authListener;
 const onAuthStateChanged=(_,fn)=>{authListener=fn;queueMicrotask(()=>fn(auth.currentUser));};
 const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),doc=(_,name,id)=>({name,id});
 const getDocs=async ref=>({forEach:fn=>(ref.name==='studentBadges'?['badge']:['one','two','three']).forEach(id=>fn({data:()=>({userId:'owner',[ref.name==='studentBadges'?'badgeId':'artifactId']:id,chapterId:'chapter-1',missionId:'mission-2',earnedAt:{toDate:()=>new Date('2026-10-30T04:00:00Z')}})}))});
 const getDoc=async ref=>({exists:()=>true,data:()=>({status:'active',name:ref.id==='one'?'Trade and Livelihood Token':ref.id==='two'?'Community Traditions and Shared Responsibilities':'Boatbuilding Discovery',icon:ref.id==='one'?'🏺':'⛵',description:ref.id==='two'?'Remember the different ways people worked together and shared knowledge in early communities.':'A keepsake of the ideas and evidence explored in your history mission.',learningDetails:{represents:'A learning token from your mission.',lessonConnection:'People exchanged goods and ideas. Evidence helps us investigate those connections. '.repeat(8),reflectionQuestion:'Which clue helps you explain this discovery?',collectibleNote:'A learning symbol, not an original historical object.'}})});
 window.matchMedia=()=>({matches:true});
 ${source('student-status.js')}
 ${source('discovery-pins.js')}
 ${source('discovery-cases.js')}
 const loadDiscoveryCase=async()=>null;
 ${source('museum-exhibits.js')}
 ${source('achievements.js')}
 (async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick();document.getElementById('toggleArtifacts').click();await tick();
 const cards=[...document.querySelectorAll('.artifact-card')];check(cards.length===3,'Owned gallery missing');for(const card of cards){check(card.querySelectorAll('button').length===2&&!card.querySelector('details')&&!card.querySelector('a'),'Repeated card controls remain');check([...card.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height>=44),'Small action target');}
 check(document.querySelectorAll('.museum-wall-link').length===1,'Wall link repeated');check(document.querySelector('.journey-finale-entry').compareDocumentPosition(document.getElementById('artifacts'))&Node.DOCUMENT_POSITION_PRECEDING,'Finale still interrupts collections');
 const trigger=cards[1].querySelector('.artifact-view-button');trigger.focus();const scrollBefore=scrollY;trigger.click();let dialog=document.querySelector('.museum-exhibit');
 function centered(){const r=dialog.getBoundingClientRect();check(Math.abs(r.left+r.width/2-innerWidth/2)<2&&Math.abs(r.top+r.height/2-innerHeight/2)<2,'Exhibit is not centred '+JSON.stringify({rect:r.toJSON(),w:innerWidth,h:innerHeight,margin:getComputedStyle(dialog).margin,inset:getComputedStyle(dialog).inset}));check(r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,'Exhibit exceeds viewport');check(dialog.scrollWidth<=dialog.clientWidth+1,'Exhibit overflows horizontally');}
 check(dialog.open&&document.documentElement.style.overflow==='hidden','Modal does not lock background scroll');centered();
 for(const b of dialog.querySelectorAll('.museum-exhibit-views button')){b.click();centered();}
 dialog.close();await tick();check(document.activeElement===trigger&&Math.abs(scrollY-scrollBefore)<2&&document.documentElement.style.overflow!=='hidden','Closing lost focus, scroll position or scroll unlock');
 trigger.click();auth.currentUser=null;authListener(null);await tick();check(!document.querySelector('.museum-exhibit')&&document.documentElement.style.overflow!=='hidden','Sign-out left modal or locked scroll');
 auth.currentUser={uid:'owner'};authListener(auth.currentUser);await tick();document.getElementById('toggleArtifacts').click();await tick();
 if(${modal}){document.querySelector('.artifact-view-button').click();dialog=document.querySelector('.museum-exhibit');dialog.querySelectorAll('.museum-exhibit-views button')[1].click();centered();}else document.getElementById('artifacts').scrollIntoView({block:'start'});
 check(innerWidth===${width}&&document.documentElement.scrollWidth<=innerWidth+1,'Gallery overflows viewport');document.getElementById('fixtureResult').textContent='PASS: gallery actions, centred exhibit, view changes, focus, scroll and account cleanup ${width}px ${modal?'exhibit':'gallery'}';
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');const file=path.join(out,(modal?'exhibit':'gallery')+'-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 }console.log('Captures: '+out);}
main().catch(error=>{console.error(error);process.exitCode=1;});
