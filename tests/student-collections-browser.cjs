const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-collections-'));
const source=fs.readFileSync(path.join(root,'js/achievements.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
let html=fs.readFileSync(path.join(root,'pages/achievements.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
const css=['student.css','achievements.css','navy-gold-theme.css'].map(n=>fs.readFileSync(path.join(root,'css',n),'utf8')).join('\n');
const script=`
${fs.readFileSync(path.join(root,'js/student-status.js'),'utf8').replace(/export /g,'')}

const auth={currentUser:{uid:'student'}},db={};let artifactFailure=false;
const collection=(_,name)=>({name}),where=(field,op,value)=>({field,value}),query=(ref,...filters)=>({...ref,filters}),doc=(_,name,id)=>({name,id});
const onAuthStateChanged=(_,fn)=>queueMicrotask(()=>fn(auth.currentUser));
const getDocs=async ref=>{if(ref.filters[0].value!=='student')throw Error('Owner query missing');if(ref.name==='studentArtifacts'&&artifactFailure)throw Error('Offline');const key=ref.name==='studentBadges'?'badgeId':'artifactId',ids=ref.name==='studentBadges'?['b1']:['a1','a2'];return{forEach:fn=>ids.forEach(id=>fn({data:()=>({userId:'student',[key]:id,earnedAt:{toDate:()=>new Date('2026-10-27T04:00:00Z')}})}))};};
const getDoc=async ref=>({exists:()=>true,data:()=>({status:'active',order:ref.id==='a2'?2:1,rarity:'Milestone',icon:ref.id==='b1'?'\\u{1F3C5}':ref.id==='a1'?'\\u{1F3D8}':'\\u2696',name:ref.id==='b1'?'Community Explorer':ref.id==='a1'?'Barangay Community Emblem':'Trade and Livelihood Token',description:ref.id==='b1'?'A chapter milestone celebrating your exploration of early Filipino communities.':'A historical collectible representing the community life and livelihoods explored in your mission.'})});
let motionReduced=true;window.matchMedia=()=>({matches:motionReduced});
${source}
const tick=()=>new Promise(r=>setTimeout(r,60)),check=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick();
 check(document.getElementById('earnedBadgeCount').textContent==='1'&&document.getElementById('artifactCount').textContent==='2','Collection counts incorrect');
 check(document.querySelectorAll('.achievement-badge-card').length===1&&document.querySelectorAll('.artifact-card').length===2,'Collections not separated');
 const educational=createArtifactCard({name:'Test discovery',chapterId:'chapter 1&x',missionId:'mission?2',learningDetails:{represents:'A lesson token <img src=x>',lessonConnection:'A saved lesson recap.',reflectionQuestion:'What did you learn?',collectibleNote:'Not an original object.'}});document.body.append(educational);const disclosure=educational.querySelector('details');check(disclosure&&!disclosure.open,'Learning panel must start closed');disclosure.querySelector('summary').click();check(disclosure.open&&educational.textContent.includes('What did you learn?'),'Learning panel did not open');check(!educational.querySelector('img')&&educational.textContent.includes('<img src=x>'),'Learning content interpreted as HTML');const lessonTarget=new URL(educational.querySelector('a').href);check(lessonTarget.searchParams.get('chapter')==='chapter 1&x'&&lessonTarget.searchParams.get('mission')==='mission?2','Lesson IDs not encoded');educational.remove();const legacy=createArtifactCard({name:'Legacy token'});check(!legacy.querySelector('details'),'Missing authored details invent a learning panel');

 const badges=document.getElementById('badges'),artifacts=document.getElementById('artifacts'),badgeToggle=document.getElementById('toggleBadges'),artifactToggle=document.getElementById('toggleArtifacts');
 check(getComputedStyle(badges).display==='none'&&getComputedStyle(artifacts).display==='none','Collections must initially be closed');
 badgeToggle.click();check(!badges.hidden&&artifacts.hidden&&badgeToggle.getAttribute('aria-expanded')==='true','Badge toggle did not open only badges');
 artifactToggle.click();check(badges.hidden&&!artifacts.hidden&&badgeToggle.getAttribute('aria-expanded')==='false'&&artifactToggle.getAttribute('aria-expanded')==='true','Artifact toggle did not replace badges');
 artifactToggle.click();check(badges.hidden&&artifacts.hidden&&!document.getElementById('collectionSelectionHint').hidden,'Selected artifact toggle did not close both');
 badgeToggle.click();badgeToggle.click();check(badges.hidden&&artifacts.hidden,'Selected badge toggle did not close both');
 await loadArtifacts(auth.currentUser);check(badges.hidden&&artifacts.hidden,'Background collection load opened a closed panel');
 artifactToggle.click();check(getComputedStyle(badges).display==='none'&&getComputedStyle(artifacts).display!=='none','CSS does not enforce exclusive visibility');
 check(document.querySelector('#artifacts .achievement-earned-date').textContent.startsWith('Collected '),'Artifact collection date missing');
 for(const id of ['achievementEmpty','artifactEmpty'])check(getComputedStyle(document.getElementById(id)).display==='none','Empty state visible with earned collection');
 check(document.documentElement.scrollWidth<=window.innerWidth,'Desktop layout overflows horizontally');
 artifactFailure=true;await loadArtifacts(auth.currentUser);check(document.querySelectorAll('.achievement-badge-card').length===1,'Artifact failure cleared badges');
 check(document.getElementById('artifactCount').textContent==='Unavailable'&&!document.getElementById('retryArtifacts').hidden,'Artifact error lacks independent retry');
 artifactFailure=false;document.getElementById('retryArtifacts').click();await tick();check(document.querySelectorAll('.artifact-card').length===2,'Artifact retry did not recover');
 const finishMotion=async()=>{for(let step=0;step<6;step++){for(const animation of collectionAnimations)animation.finish();await tick();}};
 motionReduced=false;showCollection(null,false);badgeToggle.click();
 check(collectionAnimations.size>0,'Opening did not animate');await finishMotion();
 check(!badges.hidden&&artifacts.hidden&&getComputedStyle(badges).opacity==='1','Animated badge opening failed');
 artifactToggle.click();check(badges.inert&&artifacts.hidden,'Outgoing content must be inert until switch completes');await finishMotion();
 check(badges.hidden&&!artifacts.hidden&&!artifacts.inert,'Animated switch did not settle');
 artifactToggle.click();await finishMotion();check(badges.hidden&&artifacts.hidden,'Animated close failed');
 badgeToggle.click();artifactToggle.click();badgeToggle.click();artifactToggle.click();await finishMotion();
 check(badges.hidden&&!artifacts.hidden&&artifactToggle.getAttribute('aria-expanded')==='true','Rapid toggles settled on an outdated selection');
 motionReduced=true;artifactToggle.click();check(badges.hidden&&artifacts.hidden&&collectionAnimations.size===0,'Reduced motion did not close immediately');
 artifactToggle.click();check(!artifacts.hidden&&collectionAnimations.size===0,'Reduced motion still animates');
 if(${process.argv.includes('--visual-review')}){
  document.documentElement.dataset.studentTextSize='larger';
  for(const node of document.querySelectorAll('#artifactCollection h3,#artifactCollection h4,.achievement-artifact-card h3,.achievement-artifact-card h4'))node.textContent='Sagisag ng Kabuhayan at Pakikipagpalitan ng mga Sinaunang Pamayanang Pilipino';
  for(const node of document.querySelectorAll('.achievement-artifact-card p'))node.textContent='Isang natuklasang sagisag ng sama-samang pamumuhay, kabuhayan at pakikipagkalakalan. Balikan ang aralin upang maalala kung paano nagtulungan ang mga pamayanan.';
  check(document.documentElement.scrollWidth<=innerWidth+1,'Long collection descriptions overflow desktop');
 }
 document.getElementById('result').textContent='PASS: collection animation, rapid switching, reduced motion, toggles, counts and independent recovery';
})().catch(e=>document.getElementById('result').textContent='FAIL: '+e.message);
`;
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result">RUNNING</output><script type="module">'+script+'</script></body>');
const file=path.join(temp,'collections.html'),screenshot=path.join(temp,'collections.png');fs.writeFileSync(file,html);
const r=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1400','--user-data-dir='+path.join(temp,'browser'),'--screenshot='+screenshot,'--dump-dom','--virtual-time-budget=3000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
if(r.error)throw r.error;const result=r.stdout.match(/<output id="result">([^<]+)<\/output>/)?.[1];console.log(result||'FAIL: no browser result');console.log('Screenshot: '+screenshot);process.exitCode=result?.startsWith('PASS:')?0:1;
